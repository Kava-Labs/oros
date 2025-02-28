// Copyright 2022 The Prometheus Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Package httpmiddleware is adapted from
// https://github.com/bwplotka/correlator/tree/main/examples/observability/ping/pkg/httpinstrumentation
package middleware

import (
	"context"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type metricsMiddleware struct {
	buckets  []float64
	registry prometheus.Registerer
}

// WitHandlerName returns a http.Handler middleware
func (m *metricsMiddleware) WitHandlerName(handlerName string) func(http.Handler) http.Handler {
	reg := prometheus.WrapRegistererWith(prometheus.Labels{"handler": handlerName}, m.registry)

	// "method" and "code" are native promhttp labels.
	// "model" is a custom label extracted from the request context w/ WithLabelFromCtx
	labels := []string{"method", "code", "model"}

	requestsTotal := promauto.With(reg).NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Tracks the number of HTTP requests.",
		}, labels,
	)
	requestDuration := promauto.With(reg).NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Tracks the latencies for HTTP requests.",
			Buckets: m.buckets,
		},
		labels,
	)
	requestSize := promauto.With(reg).NewSummaryVec(
		prometheus.SummaryOpts{
			Name: "http_request_size_bytes",
			Help: "Tracks the size of HTTP requests.",
		},
		labels,
	)
	responseSize := promauto.With(reg).NewSummaryVec(
		prometheus.SummaryOpts{
			Name: "http_response_size_bytes",
			Help: "Tracks the size of HTTP responses.",
		},
		labels,
	)

	// Extract model label from request context. This is set after the handler
	// is run, so model_extract middleware will already have run.
	opts := promhttp.WithLabelFromCtx("model",
		func(ctx context.Context) string {
			// Not all routes have model
			model, ok := ctx.Value(CTX_REQ_MODEL_KEY).(string)
			if !ok {
				return ""
			}

			return model
		},
	)

	// Wraps the provided http.Handler to observe the request result with the provided metrics.
	return func(handler http.Handler) http.Handler {
		return promhttp.InstrumentHandlerCounter(
			requestsTotal,
			promhttp.InstrumentHandlerDuration(
				requestDuration,
				promhttp.InstrumentHandlerRequestSize(
					requestSize,
					promhttp.InstrumentHandlerResponseSize(
						responseSize,
						handler,
						opts,
					),
					opts,
				),
				opts,
			),
			opts,
		)
	}
}

// NewMetricsMiddleware returns a Middleware interface.
func NewMetricsMiddleware(registry prometheus.Registerer, buckets []float64) *metricsMiddleware {
	if buckets == nil {
		buckets = prometheus.ExponentialBuckets(0.1, 1.5, 5)
	}

	return &metricsMiddleware{
		buckets:  buckets,
		registry: registry,
	}
}
