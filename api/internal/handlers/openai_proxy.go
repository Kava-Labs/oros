package handlers

import (
	"io"
	"net/http"

	"github.com/kava-labs/kavachat/api/internal/config"
	"github.com/kava-labs/kavachat/api/internal/middleware"
	"github.com/kava-labs/kavachat/api/internal/types"

	"github.com/rs/zerolog"
)

type basicOpenAIProxyHandler struct {
	backends config.OpenAIBackends
	logger   *zerolog.Logger
	endpoint types.OpenAIEndpoint
}

// NewBasicOpenAIProxyHandler creates a new handler that proxies requests to the OpenAI API
func NewBasicOpenAIProxyHandler(
	backends config.OpenAIBackends,
	baseLogger *zerolog.Logger,
	endpoint types.OpenAIEndpoint,
) http.Handler {
	logger := baseLogger.With().
		Str("handler", "openai_proxy_basic").
		Stringer("endpoint", endpoint).
		Logger()

	return basicOpenAIProxyHandler{
		backends: backends,
		logger:   &logger,
		endpoint: endpoint,
	}
}

// ServeHTTP forwards the request to the OpenAI API
func (h basicOpenAIProxyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	model := r.Context().Value(middleware.CTX_REQ_MODEL_KEY).(string)
	backend, found := h.backends.GetBackendFromModel(model)
	if !found {
		h.logger.Error().Msgf("error finding backend for model: %s", model)

		RespondAPIError(w, http.StatusInternalServerError, "error finding backend for model")
		return
	}

	h.forwardOpenAIRequest(w, r, backend)
}

// forwardOpenAIRequest forwards the request to the OpenAI API and writes the
// response back to the client
func (h basicOpenAIProxyHandler) forwardOpenAIRequest(
	w http.ResponseWriter,
	r *http.Request,
	backend *config.OpenAIBackend,
) {
	h.logger.Debug().Msgf(
		"forwarding request for model to backend '%s'",
		backend.Name,
	)

	client := backend.GetClient()

	// Forward request to OpenAI API
	apiResponse, err := client.DoRequest(
		r.Method,
		h.endpoint.String(),
		r.Body,
	)
	if err != nil {
		h.logger.Error().Msgf(
			"error forwarding request to backend %s: %s",
			backend.Name, err.Error(),
		)

		RespondAPIError(w, http.StatusInternalServerError, "error forwarding request to model")
		return
	}
	defer apiResponse.Body.Close()

	// Response headers
	w.Header().Set("Content-Type", apiResponse.Header.Get("Content-Type"))
	w.Header().Set("Transfer-Encoding", "identity")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(apiResponse.StatusCode)

	// Forward response body, straight copy from response which includes streaming
	bytesWritten, err := io.Copy(w, apiResponse.Body)
	if err != nil {
		h.logger.Error().Msgf(
			"error forwarding response body to client: %s",
			err.Error(),
		)
	}

	h.logger.Debug().
		Int64("bytes_written", bytesWritten).
		Msg("request forwarded successfully")
}
