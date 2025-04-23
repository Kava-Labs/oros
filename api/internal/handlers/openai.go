package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
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
		// Check if error is due to client cancellation
		if errors.Is(err, context.Canceled) {
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

	// This creates a child span for the TTFB
	responseWriter := NewTimeToFirstByteResponseWriter(
		ctx,
		w,
		tracer,
		model,
		backend.Name,
	)
	defer responseWriter.End()

	// Forward request to OpenAI API
	apiResponse, err := client.DoRequest(
		ctx,
		r.Method,
		h.endpoint,
		r.Body,
	)
	if err != nil {
		// Check if error is due to client cancellation
		if errors.Is(err, context.Canceled) {
			h.logger.Info().Msgf(
				"request to backend %s was cancelled by client",
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

	// Response headers
	w.Header().Set("Content-Type", apiResponse.Header.Get("Content-Type"))
	w.Header().Set("Transfer-Encoding", "identity")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	w.WriteHeader(apiResponse.StatusCode)

	// Forward response body, straight copy from response which includes streaming
	bytesWritten, err := io.Copy(responseWriter, apiResponse.Body)
	if err != nil {
		// Check if error is due to client cancellation
		if errors.Is(err, context.Canceled) {
			h.logger.Info().Msgf(
				"response streaming to client was cancelled",
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
