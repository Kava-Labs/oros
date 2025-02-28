package middleware

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/kava-labs/kavachat/api/internal/config"
	"github.com/kava-labs/kavachat/api/internal/types"
	"github.com/openai/openai-go"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/require"
)

func TestModelAllowlistMiddleware(t *testing.T) {
	backends := config.OpenAIBackends{
		{
			Name:          "OpenAI",
			BaseURL:       "https://api.openai.com/v1/",
			APIKey:        "test-api",
			AllowedModels: []string{"model1", "model2"},
		},
		{
			Name:          "runpod",
			BaseURL:       "https://runpod.io/v1/",
			APIKey:        "second-api",
			AllowedModels: []string{"model3"},
		},
	}

	tests := []struct {
		name           string
		modelValue     interface{}
		expectedStatus int
		expectedBody   types.ErrorResponse
	}{
		{
			name:           "nil model field",
			modelValue:     nil,
			expectedStatus: http.StatusBadRequest,
			expectedBody: types.ErrorResponse{
				ErrorBody: &openai.Error{
					Message: "you must provide a model parameter",
					Type:    "invalid_request_error",
				},
			},
		},
		{
			name:           "empty model field",
			modelValue:     "",
			expectedStatus: http.StatusBadRequest,
			expectedBody: types.ErrorResponse{
				ErrorBody: &openai.Error{
					Message: "you must provide a model parameter",
					Type:    "invalid_request_error",
				},
			},
		},
		{
			name:           "model field is not a string",
			modelValue:     123,
			expectedStatus: http.StatusBadRequest,
			expectedBody: types.ErrorResponse{
				ErrorBody: &openai.Error{
					Message: "We could not parse the JSON body of your request. (HINT: This likely means you aren't using your HTTP library correctly. The OpenAI API expects a JSON payload, but what was sent was not valid JSON. If you have trouble figuring out how to fix this, please contact us through our help center at help.openai.com.)",
					Type:    "invalid_request_error",
				},
			},
		},
		{
			name:           "model not allowed",
			modelValue:     "invalid_model",
			expectedStatus: http.StatusBadRequest,
			expectedBody: types.ErrorResponse{
				ErrorBody: &openai.Error{
					Message: "invalid model ID",
					Type:    "invalid_request_error",
				},
			},
		},
		{
			name:           "model allowed",
			modelValue:     "model1",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			// Create request
			req := httptest.NewRequest(http.MethodPost, "/", nil)
			req.Header.Set("Content-Type", "application/json")

			// Create response recorder
			rr := httptest.NewRecorder()

			// Create next handler
			next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			})

			// Create middleware
			middleware := ModelAllowlistMiddleware(&log.Logger, backends)(next)

			// Add model to request context
			ctx := context.WithValue(req.Context(), CTX_REQ_MODEL_KEY, tt.modelValue)
			req = req.WithContext(ctx)

			t.Logf("ctx: %v", req.Context())

			// Serve HTTP
			middleware.ServeHTTP(rr, req)

			// Check status code
			require.Equal(t, tt.expectedStatus, rr.Code)

			// Check response body
			if tt.expectedStatus != http.StatusOK {
				var responseBody types.ErrorResponse
				body, err := io.ReadAll(rr.Body)
				require.NoError(t, err)

				err = json.Unmarshal(body, &responseBody)
				require.NoError(t, err, "response body should be JSON")

				require.Equal(t, tt.expectedBody.ErrorBody.Message, responseBody.ErrorBody.Message)
			}
		})
	}
}
