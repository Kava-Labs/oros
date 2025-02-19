package handlers

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/kava-labs/kavachat/api/cmd/api/config"
	"github.com/kava-labs/kavachat/api/cmd/api/middleware"
	"github.com/openai/openai-go"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

type OpenaiProxyMetrics struct {
	PromptTokensTotal             *prometheus.CounterVec
	PredictedTokensTotal          *prometheus.CounterVec
	PromptProcessingTokensSeconds *prometheus.GaugeVec
}

func NewOpenaiProxyMetrics(registry prometheus.Registerer) OpenaiProxyMetrics {
	labels := []string{
		"model",
	}

	promptTokensTotal := promauto.With(registry).NewCounterVec(
		prometheus.CounterOpts{
			Name: "prompt_tokens_total",
			Help: "Tracks total number of tokens in the prompt.",
		},
		labels,
	)

	predictedTokensTotal := promauto.With(registry).NewCounterVec(
		prometheus.CounterOpts{
			Name: "tokens_predicted_total",
			Help: "Tracks total number of tokens predicted by the model.",
		},
		labels,
	)

	// We don't have any data that determines prompt vs generation throughput.
	// Internal to llama.cpp metrics, not in OpenAI chat completion response.
	// So we just measure the TOTAL time spent it takes to process a prompt.
	// total tokens / time processing + time generating
	// This will be lower than the actual output tokens/s
	promptProcessingTokensSeconds := promauto.With(registry).NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "prompt_processing_tokens_seconds",
			Help: "Average total prompt processing throughput in tokens/s",
		},
		labels,
	)

	return OpenaiProxyMetrics{
		PromptTokensTotal:             promptTokensTotal,
		PredictedTokensTotal:          predictedTokensTotal,
		PromptProcessingTokensSeconds: promptProcessingTokensSeconds,
	}
}

type openaiProxyHandler struct {
	backends config.OpenAIBackends
	logger   *slog.Logger
	metrics  OpenaiProxyMetrics
	endpoint string
}

// NewOpenAIProxyHandler creates a new handler that proxies requests to the OpenAI API
func NewOpenAIProxyHandler(
	backends config.OpenAIBackends,
	logger *slog.Logger,
	metrics OpenaiProxyMetrics,
	endpoint string,
) http.Handler {
	return openaiProxyHandler{
		backends: backends,
		logger:   logger,
		metrics:  metrics,
		endpoint: endpoint,
	}
}

// ServeHTTP forwards the request to the OpenAI API
func (h openaiProxyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	model := r.Context().Value(middleware.CTX_REQ_MODEL_KEY).(string)
	backend, found := h.backends.GetBackendFromModel(model)
	if !found {
		h.logger.Error(fmt.Sprintf("error finding backend for model: %s", model))

		// Not OpenAI compatible, backend should be found in the middleware
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)

		return
	}

	bodyBytes, err := h.getRequestBody(r)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(err)

		return
	}

	bodyReader := io.NopCloser(bytes.NewReader(bodyBytes))

	h.logger.Debug(fmt.Sprintf(
		"Forwarding request for model '%s' to backend '%s'",
		model, backend.Name,
	))

	client := backend.GetClient()

	completionTimeStart := time.Now()

	// Forward request to OpenAI API
	apiResponse, err := client.DoRequest(
		r.Method,
		h.endpoint,
		bodyReader,
	)
	if err != nil {
		h.logger.Error(fmt.Sprintf(
			"error forwarding request to backend %s: %s",
			backend.Name, err.Error(),
		))

		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(err)

		return
	}
	defer apiResponse.Body.Close()

	// Response headers
	w.Header().Set("Content-Type", apiResponse.Header.Get("Content-Type"))
	w.Header().Set("Transfer-Encoding", "identity")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	w.WriteHeader(apiResponse.StatusCode)

	// Write apiResponse.Body to BOTH:
	// 1. w: the response writer, which will be sent to the client
	// 2. r.Context(): the request context, which will be used by the next handler for metrics
	responseBody := bytes.Buffer{}
	multiWriter := io.MultiWriter(w, &responseBody)

	// Forward response body, straight copy from response which includes streaming
	_, err = io.Copy(multiWriter, apiResponse.Body)
	if err != nil {
		h.logger.Error(fmt.Sprintf(
			"error forwarding response body to client: %s",
			err.Error(),
		))
	}

	// After io.Copy, the response body is fully read and sent to client.
	// TODO: Does this mean if client is slow, our timing metric will be off?
	completionTimeEnd := time.Now()

	// Calculate the time it took to process the request
	completionDuration := completionTimeEnd.Sub(completionTimeStart)

	// Process metrics
	isStream := h.IsStreamingRequest(r)

	if isStream {
		h.ProcessRequestMetrics_Stream(responseBody.Bytes(), completionDuration)
	} else {
		h.ProcessRequestMetrics(responseBody.Bytes(), r, completionDuration)
	}
}

// getRequestBody reads the request body and injects stream_options if the
// request is a streaming request
func (h openaiProxyHandler) getRequestBody(
	r *http.Request,
) ([]byte, error) {
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		h.logger.Error(fmt.Sprintf(
			"error reading request body: %s",
			err.Error(),
		))

		return nil, err
	}

	// Inject stream_options into the request body
	isStream, ok := r.Context().Value(middleware.CTX_REQ_STREAM_KEY).(bool)
	if !ok || !isStream {
		return bodyBytes, nil
	}

	// Decode as JSON
	var body map[string]interface{}

	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		h.logger.Error(fmt.Sprintf(
			"error decoding request body: %s",
			err.Error(),
		))

		// Continue to forward request without stream_options
		return bodyBytes, nil
	}

	// Inject stream_options to be object with "include_usage" to be true
	// https://platform.openai.com/docs/api-reference/chat/create#chat-create-stream_options
	// This creates usage field on the last chunk
	body["stream_options"] = map[string]interface{}{
		"include_usage": true,
	}

	// Update bodyBytes
	bodyBytes, err = json.Marshal(body)
	if err != nil {
		h.logger.Error(fmt.Sprintf(
			"error encoding request body: %s",
			err.Error(),
		))

		// Continue to forward request without stream_options
		return bodyBytes, nil
	}

	return bodyBytes, nil
}

type streamingBody struct {
	Stream bool `json:"stream"`
}

func (h openaiProxyHandler) IsStreamingRequest(
	r *http.Request,
) bool {
	isStream, ok := r.Context().Value(middleware.CTX_REQ_STREAM_KEY).(bool)
	if !ok {
		h.logger.Warn("streaming context key not found")
		return false
	}

	return isStream
}

func (h openaiProxyHandler) ProcessRequestMetrics_Stream(
	responseBody []byte,
	completionDuration time.Duration,
) {
	// Reference:
	// https://github.com/ggml-org/llama.cpp/blob/master/examples/server/bench/script.js

	bytesReader := bytes.NewReader(responseBody)
	reader := bufio.NewReader(bytesReader)

	var model string
	var promptTokens int64
	var predictedTokens int64

	for {
		line, err := reader.ReadSlice('\n')
		if err != nil {
			if err == io.EOF {
				break
			}

			h.logger.Warn("error reading stream line", "line", line, "error", err)
			break
		}

		// Remove:
		// - whitespace
		// - data: prefix
		line = bytes.TrimSpace(line)
		line = bytes.TrimPrefix(line, []byte("data:"))
		line = bytes.TrimSpace(line)

		// Skip empty lines
		if len(line) == 0 {
			continue
		}

		// If [DONE] is found, we are done
		if bytes.Equal(line, []byte("[DONE]")) {
			break
		}

		var completionChunk openai.ChatCompletionChunk
		if err := json.Unmarshal(line, &completionChunk); err != nil {
			h.logger.Warn("error decoding stream line", "line", line, "error", err)
			break
		}

		if model == "" && completionChunk.Model != "" {
			model = completionChunk.Model
		}

		// All chunks have null usage, but only the last chunk has usage
		if completionChunk.Usage.CompletionTokens == 0 && completionChunk.Usage.PromptTokens == 0 {
			continue
		}

		promptTokens = completionChunk.Usage.PromptTokens
		predictedTokens = completionChunk.Usage.CompletionTokens
	}

	h.metrics.PromptTokensTotal.WithLabelValues(model).Add(float64(promptTokens))
	h.metrics.PredictedTokensTotal.WithLabelValues(model).Add(float64(predictedTokens))

	// Calculate the throughput, tokens / second
	throughput := float64(promptTokens) / float64(completionDuration.Seconds())
	h.metrics.PromptProcessingTokensSeconds.WithLabelValues(model).Set(throughput)

	h.logger.Debug(fmt.Sprintf(
		"model: %s, prompt tokens: %d, predicted tokens: %d, throughput: %f tokens/s, duration: %s",
		model,
		promptTokens, predictedTokens,
		throughput,
		completionDuration.String(),
	))
}

func (h openaiProxyHandler) ProcessRequestMetrics(
	responseBody []byte,
	r *http.Request,
	completionDuration time.Duration,
) {
	h.logger.Debug(fmt.Sprintf("responsebody: %s", string(responseBody)))

	// Decode JSON body .. but this could be a streaming response
	var completion openai.ChatCompletion
	if err := json.Unmarshal(responseBody, &completion); err != nil {
		h.logger.Warn("error decoding response body", "error", err)
		return
	}

	model := completion.Model

	h.metrics.PromptTokensTotal.WithLabelValues(model).Add(float64(completion.Usage.PromptTokens))
	h.metrics.PredictedTokensTotal.WithLabelValues(model).Add(float64(completion.Usage.CompletionTokens))

	// Calculate the throughput
	// tokens / second
	throughput := float64(completion.Usage.PromptTokens) / float64(completionDuration.Seconds())
	h.metrics.PromptProcessingTokensSeconds.WithLabelValues(model).Set(throughput)

	h.logger.Debug(fmt.Sprintf(
		"model: %s, prompt tokens: %d, predicted tokens: %d, throughput: %f tokens/s, duration: %s",
		model,
		completion.Usage.PromptTokens, completion.Usage.CompletionTokens,
		throughput,
		completionDuration.String(),
	))
}
