package main_test

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
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
		_, err := io.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		idx := r.Header.Get("x-testcase-index")
		if len(idx) == 0 {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Println(w, "could not find matching request")
			return
		}

		testcaseIdx, _ := strconv.Atoi(idx)
		matchingTestCase = httpTestCases[testcaseIdx]

		// if !bytes.Equal(responseData, matchingTestCase.Body) {
		// 	panic("mismatched test case")
		// }

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
	for tcIdx, tc := range httpTestCases {
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

			request.Header.Add("x-testcase-index", strconv.Itoa(tcIdx))

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
