package handlers

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"log/slog"

	"github.com/kava-labs/kavachat/api/cmd/api/config"
	"github.com/kava-labs/kavachat/api/cmd/api/middleware"
	"github.com/stretchr/testify/assert"
)

func createMockServer(responseBody string, statusCode int) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		w.Write([]byte(responseBody))
	}))
}

func TestOpenAIProxyHandler_MultipleBackends(t *testing.T) {
	logger := slog.Default()

	server1 := createMockServer(`{"result": "success1"}`, http.StatusOK)
	defer server1.Close()

	server2 := createMockServer(`{"result": "success2"}`, http.StatusOK)
	defer server2.Close()

	backend1 := config.OpenAIBackend{
		Name:          "backend1",
		BaseURL:       server1.URL + "/",
		APIKey:        "api-key-1",
		AllowedModels: []string{"deepseek-r1"},
	}

	backend2 := config.OpenAIBackend{
		Name:          "backend2",
		BaseURL:       server2.URL + "/",
		APIKey:        "api-key-2",
		AllowedModels: []string{"gpt-4o-mini"},
	}

	metrics := NewOpenaiProxyMetrics(nil)
	handler := NewOpenAIProxyHandler(
		config.OpenAIBackends{
			backend1,
			backend2,
		},
		logger,
		metrics,
		"/v1/chat/completions",
	)

	tests := []struct {
		name         string
		model        string
		expectedBody string
		expectedCode int
	}{
		{
			"Valid Model gpt-3.5",
			"deepseek-r1",
			`{"result": "success1"}`,
			http.StatusOK,
		},
		{
			"Valid Model gpt-4",
			"gpt-4o-mini",
			`{"result": "success2"}`,
			http.StatusOK,
		},
		{
			"Invalid Model gpt-5",
			"gpt-5",
			``,
			http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(`{"prompt":"Hello"}`))

			// Add model to request context
			ctx := context.WithValue(req.Context(), middleware.CTX_REQ_MODEL_KEY, tt.model)
			req = req.WithContext(ctx)

			rr := httptest.NewRecorder()

			handler.ServeHTTP(rr, req)

			assert.Equal(t, tt.expectedCode, rr.Code)
			if tt.expectedBody != "" {
				assert.JSONEq(t, tt.expectedBody, rr.Body.String())
			} else {
				assert.Empty(t, rr.Body.String())
			}
		})
	}
}

func TestOpenAIProxyHandler_BackendError(t *testing.T) {
	logger := slog.Default()

	backendResponseCode := http.StatusInternalServerError
	backendResponseBody := `{"error": "backend failure"}`

	errorServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(backendResponseCode)
		w.Write([]byte(backendResponseBody))
	}))
	defer errorServer.Close()

	backend := config.OpenAIBackend{
		Name:          "backendError",
		BaseURL:       errorServer.URL + "/",
		APIKey:        "api-key-error",
		AllowedModels: []string{"gpt-4o-mini"},
	}

	metrics := NewOpenaiProxyMetrics(nil)
	handler := NewOpenAIProxyHandler(config.OpenAIBackends{backend}, logger, metrics, "/v1/chat/completions")

	req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(`{"prompt":"Error"}`))

	// Add model to request context
	ctx := context.WithValue(req.Context(), middleware.CTX_REQ_MODEL_KEY, "gpt-4o-mini")
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	assert.Equal(t, backendResponseCode, rr.Code, "response code should match upstream backend")
	assert.JSONEq(t, backendResponseBody, rr.Body.String(), "response body should match upstream backend")
}
