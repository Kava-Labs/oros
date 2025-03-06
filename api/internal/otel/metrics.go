package otel

import (
	"context"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
)

// Metrics provides access to OpenTelemetry metrics instrumentation
type Metrics struct {
	meter         metric.Meter
	ttfbHistogram metric.Float64Histogram
}

// NewMetrics creates and registers a new Metrics instrumentation
func NewMetrics() (*Metrics, error) {
	meter := otel.GetMeterProvider().Meter("github.com/kava/kavachat/api/internal/otel")

	ttfbHistogram, err := meter.Float64Histogram(
		"http_server_ttfb",
		metric.WithDescription("Time to first byte in milliseconds"),
		metric.WithUnit("ms"),
	)
	if err != nil {
		return nil, err
	}

	return &Metrics{
		meter:         meter,
		ttfbHistogram: ttfbHistogram,
	}, nil
}

// RecordTTFB records the time to first byte for a request
func (m *Metrics) RecordTTFB(ctx context.Context, ttfbMs float64, attrs ...attribute.KeyValue) {
	m.ttfbHistogram.Record(ctx, ttfbMs, metric.WithAttributes(attrs...))
}
