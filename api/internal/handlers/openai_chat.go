package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/kava-labs/kavachat/api/internal/config"
	"github.com/kava-labs/kavachat/api/internal/middleware"
	"github.com/kava-labs/kavachat/api/internal/types"
	"github.com/rs/zerolog"
	openai "github.com/sashabaranov/go-openai"
)

type OpenAIChatHandler struct {
	base basicOpenAIProxyHandler

	// Vision capable model name to use for generating image descriptions
	visionModel string
	// Prompt to use for generating image descriptions
	visionModelPrompt string
}

// NewOpenAIChatHandler creates a new handler that proxies requests to the OpenAI API
func NewOpenAIChatHandler(
	backends config.OpenAIBackends,
	baseLogger *zerolog.Logger,
	endpoint types.OpenAIEndpoint,
) http.Handler {
	logger := baseLogger.With().
		Str("handler", "openai_proxy").
		Str("endpoint", string(endpoint)).
		Logger()

	return OpenAIChatHandler{
		base: basicOpenAIProxyHandler{
			backends: backends,
			logger:   &logger,
			endpoint: endpoint,
		},
	}
}

// ServeHTTP forwards the request to the OpenAI API
func (h OpenAIChatHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	model := r.Context().Value(middleware.CTX_REQ_MODEL_KEY).(string)
	backend, found := h.base.backends.GetBackendFromModel(model)
	if !found {
		h.base.logger.Error().Msgf("error finding backend for model: %s", model)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	switch h.base.endpoint {
	case types.ChatCompletionEndpoint:
		h.handleChatCompletion(w, r, backend)
	default:
		h.base.forwardOpenAIRequest(w, r, backend)
	}
}

// handleChatCompletion handles /chat/completions requests, with extra checks
// on the request body to determine if image data should be injected into the
// request before forwarding it to the OpenAI API
func (h OpenAIChatHandler) handleChatCompletion(
	w http.ResponseWriter,
	r *http.Request,
	backend *config.OpenAIBackend,
) {
	decodedReq, err := DecodeRequest(r)
	if err != nil {
		// Debug log for bad request errors
		h.base.logger.Debug().Msgf("error decoding request: %s", err.Error())

		RespondAPIError(w, http.StatusBadRequest, "error decoding request")
		return
	}

	// Images in previous user messages are ignored and left as-is in the request.
	// This means the last model must not fail if it receives an image in the
	// message content, even if it doesn't support vision.
	images := GetLatestUserContentImages(decodedReq)

	// No images found in the request, forward the request as-is
	if len(images) == 0 {
		h.base.forwardOpenAIRequest(w, r, backend)
		return
	}

	// Get image description in text
	description, err := h.DescribeImages(images)
	if err != nil {
		h.base.logger.Error().Msgf("error updating request with image description: %s", err.Error())

		RespondAPIError(w, http.StatusInternalServerError, "error scanning image")
		return
	}

	// Mutate the request with the generated description
	newReq := UpdateLatestUserMessage(decodedReq, description)

	// Encode the updated request to a buffer
	buff := bytes.Buffer{}
	if err := json.NewEncoder(&buff).Encode(newReq); err != nil {
		h.base.logger.Error().Msgf("error encoding updated request: %s", err.Error())

		RespondAPIError(w, http.StatusInternalServerError, "error processing image result")
		return
	}

	// Replace the request body with the updated request
	r.Body = io.NopCloser(&buff)
}

// DescribeImages pre-processes the request by generating a description for the
// image with a vision capable backend model and then updates the original
// request with the generated description.
func (h OpenAIChatHandler) DescribeImages(
	images []openai.ChatMessagePart,
) (string, error) {
	// 1. Extract image URL from the request
	// 2. Generate description for the image with configured vision model
	// 3. Update the request with the generated description
	// 4. Return the updated request

	visionBackend, found := h.base.backends.GetBackendFromModel(h.visionModel)
	if !found {
		return "", fmt.Errorf("error finding vision backend for model: %s", h.visionModel)
	}

	client := visionBackend.GetClient()

	// Build vision model request
	visionReq := openai.ChatCompletionRequest{
		Model: h.visionModel,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: h.visionModelPrompt,
			},
			{
				Role:         openai.ChatMessageRoleUser,
				MultiContent: images,
			},
		},
	}

	buff := bytes.Buffer{}
	if err := json.NewEncoder(&buff).Encode(visionReq); err != nil {
		return "", fmt.Errorf("error encoding vision request: %w", err)
	}

	response, err := client.DoRequest("POST", types.ChatCompletionEndpoint.String(), &buff)
	if err != nil {
		return "", fmt.Errorf("error requesting vision backend: %w", err)
	}

	// Decode response as ChatCompletionResponse
	var visionResp openai.ChatCompletionResponse
	if err := json.NewDecoder(response.Body).Decode(&visionResp); err != nil {
		return "", fmt.Errorf("error decoding vision response: %w", err)
	}

	content := visionResp.Choices[0].Message.Content

	return content, nil
}

// DecodeRequest decodes the request body into a ChatCompletionRequest struct
func DecodeRequest(
	r *http.Request,
) (openai.ChatCompletionRequest, error) {

	var params openai.ChatCompletionRequest
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		return openai.ChatCompletionRequest{}, fmt.Errorf("error decoding request body: %w", err)
	}

	return params, nil
}

// GetLatestUserContentImages checks if the request last user message
// content contains an image_url field.
func GetLatestUserContentImages(
	req openai.ChatCompletionRequest,
) []openai.ChatMessagePart {
	if len(req.Messages) == 0 {
		return nil
	}

	lastMessage := req.Messages[len(req.Messages)-1]

	// Not a user message
	if lastMessage.Role != openai.ChatMessageRoleUser {
		return nil
	}

	messageContent := lastMessage.MultiContent

	// Empty content in user message
	if len(messageContent) == 0 {
		return nil
	}

	images := []openai.ChatMessagePart{}

	for _, content := range messageContent {
		// Not image
		if content.ImageURL == nil {
			continue
		}

		imageURL := content.ImageURL.URL

		// Empty image URL
		if imageURL == "" {
			return nil
		}

		// Image URL found
		images = append(images, content)
	}

	return images
}

// UpdateLatestUserMessage updates the content of the latest user message in the
// given ChatCompletionRequest with the provided image description. If the
// latest message is not from a user or if there are no messages, the request is
// returned unchanged.
func UpdateLatestUserMessage(
	req openai.ChatCompletionRequest,
	imageDescription string,
) openai.ChatCompletionRequest {
	if len(req.Messages) == 0 {
		return req
	}

	lastMessage := req.Messages[len(req.Messages)-1]

	// Not a user message
	if lastMessage.Role != openai.ChatMessageRoleUser {
		return req
	}

	// Clear multi content
	lastMessage.MultiContent = nil

	// Add image description
	lastMessage.Content = imageDescription

	// Replace last message
	req.Messages[len(req.Messages)-1] = lastMessage

	return req
}
