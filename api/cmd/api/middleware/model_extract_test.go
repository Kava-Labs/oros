package middleware

import (
	"bytes"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestExtractModelMiddleware(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    string
		expectedModel  string
		expectedStatus int
	}{
		{
			name:           "valid model",
			requestBody:    `{"model": "testModel"}`,
			expectedModel:  "testModel",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "valid - empty string",
			requestBody:    `{"model": ""}`,
			expectedModel:  "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "missing model",
			requestBody:    `{"invalid": "data"}`,
			expectedModel:  "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "empty request body",
			requestBody:    `{}`,
			expectedModel:  "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid - non-string model",
			requestBody:    `{"model": 123}`,
			expectedModel:  "",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid json",
			requestBody:    `{invalid json}`,
			expectedModel:  "",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a request with the test request body
			req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(tt.requestBody))
			rr := httptest.NewRecorder()

			// Create a dummy handler to check the context value
			handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				model := r.Context().Value(CTX_REQ_MODEL_KEY)

				t.Logf("model: %v", model)

				require.Equal(t, tt.expectedModel, model)
			})

			// Wrap the handler with the middleware
			middleware := ExtractModelMiddleware(slog.Default())(handler)

			// Serve the request
			middleware.ServeHTTP(rr, req)

			// Check the response status code
			require.Equal(t, tt.expectedStatus, rr.Code)
		})
	}
}
