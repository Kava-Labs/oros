package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"syscall"
	"time"

	"github.com/kava-labs/kavachat/api/internal/config"
	"github.com/kava-labs/kavachat/api/internal/middleware"
	"github.com/kava-labs/kavachat/api/internal/otel"
	"github.com/kava-labs/kavachat/api/internal/types"
	"github.com/rs/zerolog"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

// TimeToFirstByteResponseWriter is a wrapper around http.ResponseWriter that
// records the time to first byte (TTFB) for a response
type TimeToFirstByteResponseWriter struct {
	http.ResponseWriter
	ctx          context.Context
	startTime    time.Time
	started      bool
	tracer       trace.Tracer
	ResponseSpan trace.Span
	model        string
	backend      string
	bytesWritten int64
}

// NewTimeToFirstByteResponseWriter creates a new TimeToFirstByteResponseWriter
func NewTimeToFirstByteResponseWriter(
	ctx context.Context,
	w http.ResponseWriter,
	tracer trace.Tracer,
	model string,
	backend string,
) *TimeToFirstByteResponseWriter {
	return &TimeToFirstByteResponseWriter{
		ResponseWriter: w,
		ctx:            ctx,
		startTime:      time.Now(),
		started:        false,
		tracer:         tracer,
		ResponseSpan:   nil,
		model:          model,
		backend:        backend,
	}
}

// Write records the time to first byte (TTFB) on the first write
func (w *TimeToFirstByteResponseWriter) Write(b []byte) (int, error) {
	// Record TTFB on first write
	if !w.started && len(b) > 0 {
		ttfb := time.Since(w.startTime)
		w.started = true

		// Record metrics for TTFB
		if otel.GlobalMetrics != nil {
			otel.GlobalMetrics.RecordTTFB(
				w.ctx,
				float64(ttfb.Milliseconds()),
				attribute.String("model", w.model),
				attribute.String("backend", w.backend),
			)
		}

		if w.tracer != nil {
			// Create a child span for the TTFB
			_, w.ResponseSpan = w.tracer.Start(w.ctx, "proxy.response")
			w.ResponseSpan.SetAttributes(attribute.Float64("ttfb_ms", float64(ttfb.Milliseconds())))
		}
	}

	i, err := w.ResponseWriter.Write(b)
	if err != nil && w.ResponseSpan != nil {
		// Check if error is specifically due to client disconnection -- don't
		// mark span as error
		if errors.Is(err, syscall.EPIPE) || errors.Is(err, syscall.ECONNRESET) {
			// Client disconnected, don't mark as error
			return i, err
		} else if errors.Is(err, context.Canceled) {
			// Context cancelled, might be client disconnection
			return i, err
		}

		// Record error in child span
		w.ResponseSpan.SetStatus(codes.Error, "response write error")
		w.ResponseSpan.RecordError(err)
	}
	return i, err
}

// End ends the response span if it exists and records response size metric
func (w *TimeToFirstByteResponseWriter) End() {
	if w.ResponseSpan != nil {
		w.ResponseSpan.End()
	}
}

type openaiProxyHandler struct {
	backends config.OpenAIBackends
	logger   *zerolog.Logger
	endpoint string
}

// NewOpenAIProxyHandler creates a new handler that proxies requests to the OpenAI API
func NewOpenAIProxyHandler(
	backends config.OpenAIBackends,
	baseLogger *zerolog.Logger,
	endpoint string,
) http.Handler {
	logger := baseLogger.With().
		Str("handler", "openai_proxy").
		Str("endpoint", endpoint).
		Logger()

	return openaiProxyHandler{
		backends: backends,
		logger:   &logger,
		endpoint: endpoint,
	}
}

// ServeHTTP forwards the request to the OpenAI API
func (h openaiProxyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tracer := trace.SpanFromContext(ctx).
		TracerProvider().
		Tracer("openai_proxy")

	ctx, proxySpan := tracer.Start(ctx, "proxy.request")
	defer proxySpan.End()

	model := r.Context().Value(middleware.CTX_REQ_MODEL_KEY).(string)
	backend, found := h.backends.GetBackendFromModel(model)
	if !found {
		h.logger.Error().Msgf("error finding backend for model: %s", model)

		// Not OpenAI compatible, backend should be found in the middleware
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)

		return
	}

	h.logger.Debug().Msgf(
		"forwarding request for model '%s' to backend '%s'",
		model, backend.Name,
	)

	client := backend.GetClient()
	ctx = types.AddBackendToContext(ctx, backend.Name)
	ctx = types.AddModelToContext(ctx, model)

	proxySpan.SetAttributes(attribute.String("model", model))

	// Buffer and log the request body
	var bodyBytes []byte
	if r.Body != nil {
		var err error
		bodyBytes, err = io.ReadAll(r.Body)
		if err != nil {
			h.logger.Error().Err(err).Msg("error reading request body for proxy")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		r.Body.Close()
	}

	// This creates a child span for the TTFB
	responseWriter := NewTimeToFirstByteResponseWriter(
		ctx,
		w,
		tracer,
		model,
		backend.Name,
	)
	defer responseWriter.End()

	// Forward request
	apiResponse, err := client.DoRequest(
		ctx,
		r.Method,
		h.endpoint,
		bytes.NewReader(bodyBytes),
	)
	if err != nil {
		// Check if error is specifically due to client disconnection
		if errors.Is(err, syscall.EPIPE) || errors.Is(err, syscall.ECONNRESET) {
			h.logger.Info().Msgf(
				"client disconnected during request to backend %s (connection reset/broken pipe)",
				backend.Name,
			)

			return
		} else if errors.Is(err, context.Canceled) {
			h.logger.Info().Msgf(
				"request to backend %s was cancelled (might be client disconnection)",
				backend.Name,
			)

			return
		}

		h.logger.Error().Msgf(
			"error forwarding request to backend %s: %s",
			backend.Name, err.Error(),
		)

		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(err)

		proxySpan.SetStatus(codes.Error, "request forwarding error")
		proxySpan.RecordError(err)
		return
	}
	defer apiResponse.Body.Close()

	h.logger.Debug().
		Str("http_proto", apiResponse.Proto).
		Int("status_code", apiResponse.StatusCode).
		Str("backend", backend.Name).
		Msg("response from backend")

	// Response headers
	w.Header().Set("Content-Type", apiResponse.Header.Get("Content-Type"))
	w.Header().Set("Transfer-Encoding", "identity")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	w.WriteHeader(apiResponse.StatusCode)

	// Forward response body, straight copy from response which includes streaming
	bytesWritten, err := io.Copy(responseWriter, apiResponse.Body)
	if err != nil {
		// Check if error is specifically due to client disconnection
		if errors.Is(err, syscall.EPIPE) || errors.Is(err, syscall.ECONNRESET) {
			h.logger.Info().Msgf(
				"client disconnected during response streaming (connection reset/broken pipe)",
			)
			return
		} else if errors.Is(err, context.Canceled) {
			h.logger.Info().Msgf(
				"response streaming to client was cancelled (might be client disconnection)",
			)
			return
		}

		h.logger.Error().Msgf(
			"error forwarding response body to client: %s",
			err.Error(),
		)
		// Only record as error if not context cancellation
		proxySpan.SetStatus(codes.Error, "response forwarding error")
		proxySpan.RecordError(err)
	}

	proxySpan.SetAttributes(attribute.Int64("response_bytes", bytesWritten))
	h.logger.Debug().
		Int64("bytes_written", bytesWritten).
		Msg("request forwarded successfully")
}
