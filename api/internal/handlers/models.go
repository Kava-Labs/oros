package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/kava-labs/kavachat/api/internal/config"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/packages/pagination"
)

// mergedModelsHandler that provides a response to the /v1/models endpoint with
// a merged list of models from different OpenAI API compatible backends
type mergedModelsHandler struct {
	logger   *slog.Logger
	backends []config.OpenAIBackend
}

// NewMergedModelsHandler creates a new handler that merges responses from multiple
// OpenAI API compatible backends
func NewMergedModelsHandler(
	logger *slog.Logger,
	backends []config.OpenAIBackend,
) http.Handler {
	return mergedModelsHandler{
		logger:   logger,
		backends: backends,
	}
}

// ServeHTTP forwards the request to the OpenAI API
func (h mergedModelsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	models := []openai.Model{}

	for _, backend := range h.backends {
		client := backend.GetClient()

		reqModels, err := client.DoRequest(
			http.MethodGet,
			"/models",
			nil,
		)
		if err != nil {
			h.logger.Error(fmt.Errorf("error fetching models from backend: %w", err).Error())
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		defer reqModels.Body.Close()

		modelsPage := pagination.Page[openai.Model]{}

		// Decode response
		if err := json.NewDecoder(reqModels.Body).Decode(&modelsPage); err != nil {
			h.logger.Error(fmt.Errorf("error decoding models from backend: %w", err).Error())
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// Filter out allowed models
		filteredModels := []openai.Model{}
		for _, model := range modelsPage.Data {
			for _, allowedModel := range backend.AllowedModels {
				if model.ID == allowedModel {
					filteredModels = append(filteredModels, model)
					break
				}
			}
		}

		// Add models to the list
		models = append(models, filteredModels...)
	}

	// Response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(models)
}
