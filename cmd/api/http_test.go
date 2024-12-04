package main_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"

	api "github.com/kava-labs/kavachat/cmd/api"
)

const (
	ChatCompletionsPath = "/chat/completions"

	basic              = `{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Say this is a test!"}], "temperature": 0.7 }`
	basicStreaming     = `{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Say this is a test!"}], "temperature": 0.7, "stream": true}`
	streamWithNewLines = `{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Please send me a response with new lines."}], "temperature": 0.7, "stream": true}`

	testCaseFileName = "httpTestCases.json"
)

var (
	responseHeaderWhitelist = []string{
		"Content-Type",
	}
)

type HttpTestCase struct {
	Name string `json:"name"`

	Method  string            `json:"method"`
	Path    string            `json:"path"`
	Headers map[string]string `json:"headers"`
	Body    []byte            `json:"body"`

	WantStatusCode  int    `json:"wantStatusCode"`
	WantContentType string `json:"wantContentType"`

	Response HttpResponseData `json:"response"`
}

type HttpResponseData struct {
	Header http.Header `json:"headers"`
	Body   []byte      `json:"body"`
}

func loadHttpTestCases(generate bool) ([]*HttpTestCase, error) {
	var testCases []*HttpTestCase

	if generate {
		var err error
		testCases, err = generateTestCases()
		if err != nil {
			return nil, err
		}

		data, err := json.MarshalIndent(testCases, "", "  ")
		if err != nil {
			return nil, err
		}

		if err := os.WriteFile(testCaseFileName, data, 0644); err != nil {
			return nil, err
		}
	} else {
		data, err := os.ReadFile(testCaseFileName)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(data, &testCases); err != nil {
			return nil, err
		}
	}

	return testCases, nil
}

func generateTestCases() ([]*HttpTestCase, error) {
	var apiKey, baseURL string

	if apiKey = os.Getenv("OPENAI_API_KEY"); apiKey == "" {
		return nil, api.ErrOpenAIKeyRequired
	}

	if baseURL = os.Getenv("OPENAI_BASE_URL"); baseURL == "" {
		return nil, api.ErrOpenAIBaseURLRequired
	}

	testCases := []*HttpTestCase{
		{
			Name:   "unauthorized api key",
			Method: http.MethodPost,
			Path:   ChatCompletionsPath,
			Headers: map[string]string{
				"Authorization": "Bearer not-a-valid-api-key",
				"Content-Type":  "application/json",
			},
			Body:            json.RawMessage(basic),
			WantStatusCode:  401,
			WantContentType: "application/json",
		},
		{
			Name:   "basic",
			Method: http.MethodPost,
			Path:   ChatCompletionsPath,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body:            json.RawMessage(basic),
			WantStatusCode:  200,
			WantContentType: "application/json",
		},
		{
			Name:   "basic streaming",
			Method: http.MethodPost,
			Path:   ChatCompletionsPath,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body:            json.RawMessage(basicStreaming),
			WantStatusCode:  200,
			WantContentType: "text/event-stream",
		},
		{
			Name:   "streaming with new lines",
			Method: http.MethodPost,
			Path:   ChatCompletionsPath,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body:            json.RawMessage(streamWithNewLines),
			WantStatusCode:  200,
			WantContentType: "text/event-stream",
		},
	}

	client := &http.Client{}
	authHeader := fmt.Sprintf("Bearer %s", apiKey)

	for _, tc := range testCases {
		url, err := url.JoinPath(baseURL, tc.Path)
		if err != nil {
			return nil, fmt.Errorf("building url for %v: %w", tc.Name, err)
		}

		var buffer io.Reader
		if tc.Body != nil {
			buffer = bytes.NewBuffer(tc.Body)
		}

		request, err := http.NewRequest(tc.Method, url, buffer)
		if err != nil {
			return nil, fmt.Errorf("building new request for %v: %w", tc.Name, err)
		}
		for name, value := range tc.Headers {
			request.Header.Add(name, value)
		}
		if request.Header.Get("Authorization") == "" {
			request.Header.Add("Authorization", authHeader)
		}

		response, err := client.Do(request)
		if err != nil {
			return nil, fmt.Errorf("sending new request for %v: %w", tc.Name, err)
		}
		defer response.Body.Close()

		if response.StatusCode != tc.WantStatusCode {
			return nil, fmt.Errorf("response status code %d, did not match wanted status code %d for %v", response.StatusCode, tc.WantStatusCode, tc.Name)
		}

		responseContentType := strings.Split(response.Header.Get("Content-Type"), ";")[0]
		if responseContentType != tc.WantContentType {
			return nil, fmt.Errorf("response content type %s, did not match wanted content type %s for %v", responseContentType, tc.WantContentType, tc.Name)
		}

		data, err := io.ReadAll(response.Body)
		if err != nil {
			return nil, fmt.Errorf("reading response for %v: %w", tc.Name, err)
		}

		tc.Response.Header = http.Header{}
		for _, name := range responseHeaderWhitelist {
			tc.Response.Header.Add(name, response.Header.Get(name))
		}
		tc.Response.Body = data
	}

	return testCases, nil
}
