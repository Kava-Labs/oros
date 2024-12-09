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
	ImageGenerationPath = "/images/generations"

	basic              = `{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Say this is a test!"}], "temperature": 0.7 }`
	basicStreaming     = `{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Say this is a test!"}], "temperature": 0.7, "stream": true}`
	streamWithNewLines = `{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Please send me a response with new lines."}], "temperature": 0.7, "stream": true}`
	basicImageGen      = `{"model": "dall-e-2", "prompt": "generate an image of a tabby cat", "size": "256x256"}`

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

	keepAuthHeader      bool
	WantStatusCode      int               `json:"wantStatusCode"`
	WantContentType     string            `json:"wantContentType"`
	WantResponseHeaders map[string]string `json:"wantResponseHeaders"`

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
			keepAuthHeader: true,
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
			keepAuthHeader: false,
			Headers: map[string]string{
				"Content-Type":  "application/json",
				"Authorization": "Bearer kavachat:3ecf96d2-2180-423d-9de7-ecf247125524:a496f6c4-90e5-4f56-83bd-47a36b911b9e",
			},
			Body:            json.RawMessage(basic),
			WantStatusCode:  200,
			WantContentType: "application/json",
		},
		{
			Name:   "basic streaming",
			Method: http.MethodPost,
			Path:   ChatCompletionsPath,
			keepAuthHeader: false,
			Headers: map[string]string{
				"Content-Type":  "application/json",
				"Authorization": "Bearer kavachat:5e5168ef-42a7-4f24-b490-551b60d9a971:9e080aba-f3fd-44ef-b419-0fa1e801819f",
			},
			Body:            json.RawMessage(basicStreaming),
			WantStatusCode:  200,
			WantContentType: "text/event-stream",
		},
		{
			Name:   "streaming with new lines",
			Method: http.MethodPost,
			Path:   ChatCompletionsPath,
			keepAuthHeader: false,
			Headers: map[string]string{
				"Content-Type":  "application/json",
				"Authorization": "Bearer kavachat:69b23a03-a7ca-40db-a3b9-48e89e1f54a5:ee989320-98a1-49de-8697-56ce206d26b3",
			},
			Body:            json.RawMessage(streamWithNewLines),
			WantStatusCode:  200,
			WantContentType: "text/event-stream",
		},
		{
			Name:   "Basic Image Generation",
			Method: http.MethodPost,
			Path:   ImageGenerationPath,
			keepAuthHeader: false,
			Headers: map[string]string{
				"Content-Type":  "application/json",
				"Authorization": "Bearer kavachat:1e84d3cd-6301-4c49-82ed-e556c4fe2d13:31ecbc1c-2004-4d31-9f45-6868d71bebee",
			},
			Body:            json.RawMessage(basicImageGen),
			WantStatusCode:  200,
			WantContentType: "application/json",
		},

		{
			Name:   "Basic preflight request image generation endpoint",
			Path:   "images/generations",
			Method: http.MethodOptions,
			Headers: map[string]string{
				"Origin": "http://localhost:5555",
			},
			Body:           nil,
			WantStatusCode: http.StatusOK,
			WantResponseHeaders: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Authorization, Content-Type, x-stainless-os, x-stainless-runtime-version, x-stainless-package-version, x-stainless-runtime, x-stainless-arch, x-stainless-retry-count, x-stainless-lang, user-agent",
				"Access-Control-Max-Age":       "3600",
			},
		},

		{
			Name:   "Basic preflight request chat endpoint",
			Path:   "chat/completions",
			Method: http.MethodOptions,
			Headers: map[string]string{
				"Origin": "http://localhost:5555",
			},
			Body:           nil,
			WantStatusCode: http.StatusOK,
			WantResponseHeaders: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Authorization, Content-Type, x-stainless-os, x-stainless-runtime-version, x-stainless-package-version, x-stainless-runtime, x-stainless-arch, x-stainless-retry-count, x-stainless-lang, user-agent",
				"Access-Control-Max-Age":       "3600",
			},
		},
	}

	client := &http.Client{}
	authHeader := fmt.Sprintf("Bearer %s", apiKey)

	for _, tc := range testCases {
		if tc.Method == http.MethodOptions {
			continue
		}
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
			// when generating test cases and keepAuthHeader is false 
			// use the real auth token and not the client sent set one to the proxy
			if name == "Authorization" && !tc.keepAuthHeader {
				continue
			}
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
