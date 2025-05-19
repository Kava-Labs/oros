package types

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptrace"
	"net/http/httputil"

	"go.opentelemetry.io/contrib/instrumentation/net/http/httptrace/otelhttptrace"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/attribute"
)

const (
	CTX_CLIENT_REQ_MODEL_KEY   = "model"
	CTX_CLIENT_REQ_BACKEND_KEY = "backend"
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
		client: &http.Client{
			Transport: otelhttp.NewTransport(
				http.DefaultTransport,
				otelhttp.WithClientTrace(func(ctx context.Context) *httptrace.ClientTrace {
					return otelhttptrace.NewClientTrace(ctx, otelhttptrace.WithoutSubSpans())
				}),
				otelhttp.WithMetricAttributesFn(func(r *http.Request) []attribute.KeyValue {
					attrs := []attribute.KeyValue{}

					model, ok := r.Context().Value(CTX_CLIENT_REQ_MODEL_KEY).(string)
					if ok {
						attrs = append(attrs, attribute.String("model", model))
					}

					backend, ok := r.Context().Value(CTX_CLIENT_REQ_BACKEND_KEY).(string)
					if ok {
						attrs = append(attrs, attribute.String("backend", backend))
					}

					return attrs
				}),
			),
		},
	}
}

// DoRequest performs an HTTP request to the upstream API, use raw client
// request to do a passthrough instead of using the OpenAI client which does
// custom handling, retries, etc and would need manual handling of the response
// and streaming.
func (c *OpenAIPassthroughClient) DoRequest(
	ctx context.Context,
	method,
	path string,
	body *bytes.Reader, // *bytes.Reader which sets the Content-Length header
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

	req, err := http.NewRequestWithContext(ctx, method, reqUrl, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))
	req.Header.Add("Content-Type", "application/json")

	// Dump the raw outgoing HTTP request for debugging
	if dump, err := httputil.DumpRequestOut(req, true); err == nil {
		fmt.Printf("RAW BACKEND REQUEST:\n%q\n", string(dump))
	} else {
		fmt.Printf("Failed to dump request: %v\n", err)
	}

	return c.client.Do(req)
}

// AddModelToContext adds the model string to the context
func AddModelToContext(ctx context.Context, model string) context.Context {
	return context.WithValue(ctx, CTX_CLIENT_REQ_MODEL_KEY, model)
}

// AddBackendToContext adds the backend string to the context
func AddBackendToContext(ctx context.Context, backend string) context.Context {
	return context.WithValue(ctx, CTX_CLIENT_REQ_BACKEND_KEY, backend)
}
