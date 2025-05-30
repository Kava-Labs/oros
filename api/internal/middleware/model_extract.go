package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/kava-labs/kavachat/api/internal/types"
	"github.com/openai/openai-go"
	"github.com/rs/zerolog"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

const CTX_REQ_MODEL_KEY = "model"

// 25MB
const MAX_BODY_SIZE = 25 * 1024 * 1024

// RequestWithModel is a struct that represents an incoming request with a model
// field, used to extract the model field from the request body and ignore any
// other fields
type RequestWithModel struct {
	Model string `json:"model"`
}

// ExtractModelMiddleware is a middleware that extracts the model field from the
// request body and stores it in the request context
func ExtractModelMiddleware(baseLogger *zerolog.Logger) func(next http.Handler) http.Handler {
	logger := baseLogger.With().Str("middleware", "extract_model").Logger()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()

			// Decode the request body into Payload struct
			req := RequestWithModel{}

			// Ensure body size isn't too large, malicious or otherwise
			r.Body = http.MaxBytesReader(w, r.Body, MAX_BODY_SIZE)

			// Need to read the body to extract the model field, but also
			// preserve the body for the next handler.
			bodyBytes, err := io.ReadAll(r.Body)
			if err != nil {
				log.Printf("Error reading body: %v", err)
				http.Error(w, "can't read body", http.StatusBadRequest)
				return
			}

			// Replace the body bytes with a new ReadCloser
			r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

			// Create a span for JSON decoding
			tracer := trace.SpanFromContext(ctx).
				TracerProvider().
				Tracer("extract_model_middleware")
			ctx, jsonSpan := tracer.Start(ctx, "request.json.decode")

			// Parse body for model field
			if err := json.Unmarshal(bodyBytes, &req); err != nil {
				// Add error information to the span
				jsonSpan.SetStatus(codes.Error, "json decode error")
				jsonSpan.RecordError(err)

				// Respond with openai error
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)

				json.NewEncoder(w).Encode(types.ErrorResponse{
					ErrorBody: &openai.Error{
						Message: "invalid model ID",
						Type:    "invalid_request_error",
					},
				})

				jsonSpan.End()
				return
			}

			// Add model info to span
			jsonSpan.SetAttributes(attribute.String("model", req.Model))
			jsonSpan.SetAttributes(attribute.Int64("request_bytes", int64(len(bodyBytes))))
			jsonSpan.End()

			// Store the extracted field in the request context
			ctx = context.WithValue(ctx, CTX_REQ_MODEL_KEY, req.Model)
			logger.Debug().Str("model", req.Model).Msg("extracted model from request body")

			// Call the next handler with the new context
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
