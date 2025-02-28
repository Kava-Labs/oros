package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/kava-labs/kavachat/api/internal/config"
	"github.com/kava-labs/kavachat/api/internal/types"
	"github.com/openai/openai-go"
	"github.com/rs/zerolog"
)

// ErrorResponse is the response body for an error
type ErrorResponse struct {
	ErrorBody *openai.Error `json:"error"`
}

// ModelAllowlistMiddleware is a middleware that checks if the model field in
// the request body is allowed, in both ChatCompletion and ImageGeneration
// requests.
func ModelAllowlistMiddleware(
	baseLogger *zerolog.Logger,
	backends config.OpenAIBackends,
) func(next http.Handler) http.Handler {
	logger := baseLogger.With().Str("middleware", "model_allowlist").Logger()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check if model field is present
			model := r.Context().Value(CTX_REQ_MODEL_KEY)

			// nil check, only for certain context types
			if model == nil {
				logger.Debug().Msg("model field is nil")

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)

				json.NewEncoder(w).Encode(types.ErrorResponse{
					ErrorBody: &openai.Error{
						Message: "you must provide a model parameter",
						Type:    "invalid_request_error",
					},
				})

				return
			}

			// string check, should be enforced by the ExtractModelMiddleware
			// but we'll check it here just in case instead of panicking
			modelStr, ok := model.(string)
			if !ok {
				logger.Debug().Msgf("model field is not a string: %v", model)

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)

				json.NewEncoder(w).Encode(types.ErrorResponse{
					ErrorBody: &openai.Error{
						Message: "We could not parse the JSON body of your request. (HINT: This likely means you aren't using your HTTP library correctly. The OpenAI API expects a JSON payload, but what was sent was not valid JSON. If you have trouble figuring out how to fix this, please contact us through our help center at help.openai.com.)",
						Type:    "invalid_request_error",
					},
				})

				return
			}

			// empty string response
			if modelStr == "" {
				logger.Debug().Msg("model field is empty")

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)

				json.NewEncoder(w).Encode(types.ErrorResponse{
					ErrorBody: &openai.Error{
						Message: "you must provide a model parameter",
						Type:    "invalid_request_error",
					},
				})

				return
			}

			// allowlist check
			_, found := backends.GetBackendFromModel(modelStr)
			if !found {
				logger.Debug().Msgf("model is not supported by any backend: %s", model)

				// Respond with matching openai error
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)

				json.NewEncoder(w).Encode(types.ErrorResponse{
					ErrorBody: &openai.Error{
						Message: "invalid model ID",
						Type:    "invalid_request_error",
					},
				})

				return
			}

			logger.Debug().Msgf("model is allowed: %s", model)

			next.ServeHTTP(w, r)
		})
	}
}
