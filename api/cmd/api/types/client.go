package types

import (
	"fmt"
	"io"
	"net/http"
)

// OpenAIPassthroughClient is a client for the OpenAI API
type OpenAIPassthroughClient struct {
	BaseURL string
	APIKey  string

	client *http.Client
}

// NewOpenAIClient creates a new OpenAI client with the given base URL and API
// key
func NewOpenAIClient(baseURL, apiKey string) *OpenAIPassthroughClient {
	return &OpenAIPassthroughClient{
		BaseURL: baseURL,
		APIKey:  apiKey,
		client:  &http.Client{},
	}
}

// DoRequest performs an HTTP request to the upstream API, use raw client
// request to do a passthrough instead of using the OpenAI client which does
// custom handling, retries, etc and would need manual handling of the response
// and streaming.
func (c *OpenAIPassthroughClient) DoRequest(
	method,
	path string,
	body io.ReadCloser,
) (*http.Response, error) {
	// BaseURL has a / suffix
	// path also has / prefix

	// Check if path has a leading slash
	if path[0] == '/' {
		path = path[1:]
	}

	reqUrl := c.BaseURL + path

	req, err := http.NewRequest(method, reqUrl, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))
	req.Header.Add("Content-Type", "application/json")

	return c.client.Do(req)
}
