package main_test

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newHttpMockServer(authHeader string) *httptest.Server {
	mockTestCaseHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// nil or set to the matching test case
		var matchingTestCase *HttpTestCase

		// read request body, which must match the
		// test case exactly
		responseData, err := io.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		// Find the matching request in order to return
		// the recorded response
		for _, tc := range httpTestCases {
			if r.Method != tc.Method {
				continue
			}
			// use a default base path of /v1
			expectedRequestPath, err := url.JoinPath("/v1", tc.Path)
			if err != nil {
				panic(err)
			}
			if r.URL.Path != expectedRequestPath {
				continue
			}
			headersMatch := true
			// If no Authorization header is set in the test case,
			// we check the incoming header against the configured
			// one.
			if _, hasAuthHeader := tc.Headers["Authorization"]; !hasAuthHeader {
				if r.Header.Get("Authorization") != authHeader {
					headersMatch = false
				}
			}
			// We only check headers that are specified in the test case.
			// Other headers are ignored.
			for name, value := range tc.Headers {
				if r.Header.Get(name) != value {
					headersMatch = false
				}
			}
			if !headersMatch {
				continue
			}
			// Request body must match exactly
			if !bytes.Equal(responseData, tc.Body) {
				continue
			}

			matchingTestCase = tc
			break
		}

		// Fail with 500 if no matching request is found
		if matchingTestCase == nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Println(w, "could not find matching request")
			return
		}

		// Write response recorded in httpTestCase which includes
		// the Content-Type header.
		for name, values := range matchingTestCase.Response.Header {
			for _, value := range values {
				w.Header().Add(name, value)
			}
		}
		w.WriteHeader(matchingTestCase.WantStatusCode)
		if _, err := w.Write(matchingTestCase.Response.Body); err != nil {
			panic(err)
		}
	})

	server := httptest.NewUnstartedServer(mockTestCaseHandler)
	// OpenAI will use http2 if client supports it
	server.EnableHTTP2 = true

	return server
}

func TestHttpMockServer(t *testing.T) {
	authHeader := fmt.Sprintf("Bearer %s", newDefaultTestConfig().apiKey)
	mockServer := newHttpMockServer(authHeader)
	mockServer.Start()
	defer mockServer.Close()

	client := &http.Client{}
	for _, tc := range httpTestCases {
		t.Run(tc.Name, func(t *testing.T) {
			url, err := url.JoinPath(mockServer.URL, "/v1", tc.Path)
			require.NoError(t, err)

			var buffer io.Reader
			if tc.Body != nil {
				buffer = bytes.NewBuffer(tc.Body)
			}

			request, err := http.NewRequest(tc.Method, url, buffer)
			require.NoError(t, err)

			for name, value := range tc.Headers {
				request.Header.Add(name, value)
			}
			if request.Header.Get("Authorization") == "" {
				request.Header.Add("Authorization", authHeader)
			}

			response, err := client.Do(request)
			require.NoError(t, err)
			defer response.Body.Close()

			assert.Equal(t, tc.WantStatusCode, response.StatusCode)

			data, err := io.ReadAll(response.Body)
			require.NoError(t, err)
			assert.Equal(t, string(tc.Response.Body), string(data))
		})
	}
}
