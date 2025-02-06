package main_test

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestCors(t *testing.T) {
	config := newDefaultTestConfig()

	authHeader := fmt.Sprintf("Bearer %s", newDefaultTestConfig().apiKey)
	mockServer := newHttpMockServer(authHeader)
	mockServer.Start()

	baseURL, err := url.JoinPath(mockServer.URL, "/v1")
	require.NoError(t, err)
	config.baseURL = baseURL
	config.allowedModels = []string{"gpt-4o-mini", "dall-e-2"}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(20*time.Second))
	defer cancel()

	serverUrl, shutdown, err := launchApiServer(ctx, config)

	defer shutdown()
	defer mockServer.Close()

	require.NoError(t, err, "expected server to start without error")

	testCases := []struct {
		name                string
		requestMethod       string
		path                string
		requestHeaders      map[string]string
		requestBody         []byte
		wantStatusCode      int
		wantResponseHeaders map[string]string
	}{
		{
			name:          "Basic preflight request chat endpoint",
			path:          "chat/completions",
			requestMethod: "OPTIONS",
			requestHeaders: map[string]string{
				"Origin": "http://localhost:5555",
			},
			requestBody:    nil,
			wantStatusCode: http.StatusOK,
			wantResponseHeaders: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Authorization, Content-Type, x-stainless-os, x-stainless-runtime-version, x-stainless-package-version, x-stainless-runtime, x-stainless-arch, x-stainless-retry-count, x-stainless-lang, user-agent",
				"Access-Control-Max-Age":       "3600",
			},
		},
		{
			name:          "Basic chat completions POST request",
			path:          "chat/completions",
			requestMethod: "POST",
			requestHeaders: map[string]string{
				"Origin":        "http://localhost:5555",
				"Authorization": "Bearer some-token",
				"Content-Type":  "application/json",
			},
			requestBody:    []byte(basicStreaming),
			wantStatusCode: http.StatusOK,
			wantResponseHeaders: map[string]string{
				"Access-Control-Allow-Origin": "*",
			},
		},

		{
			name:          "Basic preflight request image generation endpoint",
			path:          "images/generations",
			requestMethod: "OPTIONS",
			requestHeaders: map[string]string{
				"Origin": "http://localhost:5555",
			},
			requestBody:    nil,
			wantStatusCode: http.StatusOK,
			wantResponseHeaders: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Authorization, Content-Type, x-stainless-os, x-stainless-runtime-version, x-stainless-package-version, x-stainless-runtime, x-stainless-arch, x-stainless-retry-count, x-stainless-lang, user-agent",
				"Access-Control-Max-Age":       "3600",
			},
		},
		{
			name:          "Basic image generations POST request",
			path:          "images/generations",
			requestMethod: "POST",
			requestHeaders: map[string]string{
				"Origin":        "http://localhost:5555",
				"Authorization": "Bearer some-token",
				"Content-Type":  "application/json",
			},
			requestBody:    []byte(basicImageGen),
			wantStatusCode: http.StatusOK,
			wantResponseHeaders: map[string]string{
				"Access-Control-Allow-Origin": "*",
			},
		},
	}

	client := &http.Client{}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			requestUrl, err := url.JoinPath(serverUrl, "/openai/v1", tc.path)
			require.NoError(t, err)

			var buffer io.Reader
			if len(tc.requestBody) > 0 {
				buffer = bytes.NewBuffer(tc.requestBody)
			}

			request, err := http.NewRequest(tc.requestMethod, requestUrl, buffer)
			require.NoError(t, err)

			for name, value := range tc.requestHeaders {
				request.Header.Set(name, value)
			}

			response, err := client.Do(request)
			require.NoError(t, err)
			defer response.Body.Close()

			if response.StatusCode != tc.wantStatusCode {
				// Read body bytes
				body, err := io.ReadAll(response.Body)
				require.NoError(t, err)

				t.Logf("response body: %v", string(body))
			}

			require.Equal(t, tc.wantStatusCode, response.StatusCode)

			for name, value := range tc.wantResponseHeaders {
				require.Equal(t, value, response.Header.Get(name))
			}
		})
	}

}
