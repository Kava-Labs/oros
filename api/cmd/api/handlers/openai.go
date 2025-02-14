package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/kava-labs/kavachat/api/cmd/api/config"
	"github.com/kava-labs/kavachat/api/cmd/api/middleware"
)

type openaiProxyHandler struct {
	backends config.OpenAIBackends
	logger   *slog.Logger
	endpoint string
}

// NewOpenAIProxyHandler creates a new handler that proxies requests to the OpenAI API
func NewOpenAIProxyHandler(
	backends config.OpenAIBackends,
	logger *slog.Logger,
	endpoint string,
) http.Handler {
	return openaiProxyHandler{
		backends: backends,
		logger:   logger,
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

	h.logger.Debug(fmt.Sprintf(
		"Forwarding request for model '%s' to backend '%s'",
		model, backend.Name,
	))

	client := backend.GetClient()

	// Forward request to OpenAI API
	apiResponse, err := client.DoRequest(
		r.Method,
		h.endpoint,
		r.Body,
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

	// Forward response body, straight copy from response which includes streaming
	io.Copy(w, apiResponse.Body)
}
