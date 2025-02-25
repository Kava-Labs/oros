package types

import (
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"net/http/httptrace"
	"time"
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
	body io.Reader,
) (*http.Response, error) {
	// To properly build URL:
	// BaseURL should NOT have a trailing slash
	// Path SHOULD have a leading slash

	// Check if base URL has a trailing slash
	if c.BaseURL[len(c.BaseURL)-1] == '/' {
		c.BaseURL = c.BaseURL[:len(c.BaseURL)-1]
	}

	if (len(path)) == 0 {
		return nil, fmt.Errorf("path is empty when making request")
	}

	// Check if path has a leading slash
	if path[0] != '/' {
		path = "/" + path
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

func (c *OpenAIPassthroughClient) WithTracing(r *http.Request) *http.Request {
	var start, connect, dns, tlsHandshake time.Time

	trace := &httptrace.ClientTrace{
		DNSStart: func(dsi httptrace.DNSStartInfo) { dns = time.Now() },
		DNSDone: func(ddi httptrace.DNSDoneInfo) {
			fmt.Printf("DNS Done: %v\n", time.Since(dns))
		},

		TLSHandshakeStart: func() { tlsHandshake = time.Now() },
		TLSHandshakeDone: func(cs tls.ConnectionState, err error) {
			fmt.Printf("TLS Handshake: %v\n", time.Since(tlsHandshake))
		},

		ConnectStart: func(network, addr string) { connect = time.Now() },
		ConnectDone: func(network, addr string, err error) {
			fmt.Printf("Connect time: %v\n", time.Since(connect))
		},

		GotFirstResponseByte: func() {
			fmt.Printf("Time from start to first byte: %v\n", time.Since(start))
		},
	}

	return r.WithContext(httptrace.WithClientTrace(r.Context(), trace))
}
