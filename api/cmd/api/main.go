package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/attribute"

	chimiddleware "github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"

	"github.com/kava-labs/kavachat/api/internal/config"
	"github.com/kava-labs/kavachat/api/internal/handlers"
	"github.com/kava-labs/kavachat/api/internal/middleware"
	"github.com/kava-labs/kavachat/api/internal/otel"
)

func main() {
	// -------------------------------------------------------------------------
	// Setup logging, configuration

	// Default format is JSON before config is loaded
	logger := InitializeLogger(true, "debug")

	cfg, err := config.NewConfigFromEnv()
	if err != nil {
		logger.Fatal().Err(err).Msgf("error parsing config")
	}

	if err := cfg.Validate(); err != nil {
		logger.Fatal().Err(err).Msgf("invalid config")
	}

	// Replace logger with configured format
	logger = InitializeLogger(cfg.LogFormatIsJSON(), cfg.LogLevel)

	// API Keys are redacted in the OpenAIBackend.String() method
	logger.Info().Stringer("config", cfg).Msg("Load config from env")

	// -------------------------------------------------------------------------
	// OpenTelemetry tracing setup

	// Includes runtime and host metrics start
	shutdownOtel, err := otel.SetupOTelSDK(context.Background())
	if err != nil {
		logger.Fatal().Err(err).Msg("error setting up OpenTelemetry SDK")
	}

	// -------------------------------------------------------------------------
	// API Routes

	r := chi.NewRouter()

	r.Use(chimiddleware.Recoverer) // Recover from panics, 500 response, logs stack trace

	// /v1/ custom routes
	r.Route("/v1", func(r chi.Router) {
		// OpenTelemetry tracing and metrics middleware without model
		metricsMiddleware := otelhttp.NewMiddleware(
			"kavachat-api",
			otelhttp.WithMetricAttributesFn(func(r *http.Request) []attribute.KeyValue {
				attrs := []attribute.KeyValue{
					// TODO: Disable for non-matching paths
					// New metric created for random paths
					attribute.String("path", r.URL.Path),
				}

				return attrs
			}),
		)

		r.With(metricsMiddleware).Get("/healthcheck", func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprintln(w, "available")
		})

		// POST /v1/files - File uploads
		fileUploadHandler := handlers.NewFileUploadHandler(
			cfg.S3BucketName,
			cfg.S3PathStyleRequests,
			cfg.PublicURL,
			logger,
		)
		r.With(
			metricsMiddleware,
			// Need to set real IP
			chimiddleware.RealIP,
			// Before rate limiter
			middleware.NewRateLimiter(middleware.RateLimiterConfig{
				MaxRequests: 10,
				WindowSize:  1 * time.Minute,
			}),
		).Post(
			"/files",
			fileUploadHandler.ServeHTTP,
		)

		// GET /v1/files/{file_id} - File downloads
		downloadHandler := handlers.NewFileDownloadHandler(
			cfg.S3BucketName,
			cfg.S3PathStyleRequests,
			logger,
		)
		r.With(metricsMiddleware).Get(
			"/files/{file_id}",
			downloadHandler.ServeHTTP,
		)
	})

	// OpenAI compatible routes
	r.Route("/openai/v1", func(r chi.Router) {
		r.Use(middleware.PreflightMiddleware)
		r.Use(middleware.ExtractModelMiddleware(logger))
		r.Use(middleware.ModelAllowlistMiddleware(logger, cfg.Backends))

		// Do not use r.Use as it will match every /openai/v1/* route, only
		// want to match specific routes.
		// Needs to run after ExtractModelMiddleware.
		openaiMetrics := otelhttp.NewMiddleware(
			"kavachat-api",
			otelhttp.WithMetricAttributesFn(func(r *http.Request) []attribute.KeyValue {
				attrs := []attribute.KeyValue{
					attribute.String("path", r.URL.Path),
				}

				model, ok := r.Context().Value(middleware.CTX_REQ_MODEL_KEY).(string)
				if ok {
					attrs = append(attrs, attribute.String("model", model))
				}

				return attrs
			}),
		)

		chatCompletionsRoute := "/chat/completions"
		r.With(openaiMetrics).Handle(
			chatCompletionsRoute,
			handlers.NewOpenAIProxyHandler(
				cfg.Backends,
				logger,
				chatCompletionsRoute,
			),
		)

		imageGenerationsRoute := "/images/generations"
		r.With(openaiMetrics).Handle(
			imageGenerationsRoute,
			handlers.NewOpenAIProxyHandler(
				cfg.Backends,
				logger,
				imageGenerationsRoute,
			),
		)
	})

	// -------------------------------------------------------------------------
	// Metrics server

	metricsLogger := logger.With().Str("server", "metrics").Logger()

	metricsR := chi.NewRouter()
	metricsR.Handle("/metrics", promhttp.HandlerFor(prometheus.DefaultGatherer, promhttp.HandlerOpts{
		Registry: prometheus.DefaultRegisterer,
		ErrorLog: &metricsLogger,
	}))

	metricsServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.MetricsPort),
		Handler: metricsR,
	}

	go func() {
		logger.Info().Msgf("serving metrics on: %s/metrics", metricsServer.Addr)

		if err := metricsServer.ListenAndServe(); err != http.ErrServerClosed {
			logger.Fatal().Err(err).Msg("metrics server err")
		}
	}()

	// -------------------------------------------------------------------------
	// Server setup

	logger.Info().Msg("Starting Kavachat API!")

	address := fmt.Sprintf("%s:%d", cfg.ServerHost, cfg.ServerPort)

	server := &http.Server{
		Addr:    address,
		Handler: r,
	}

	logger.Info().Msgf("serving API on %s", address)

	go func() {
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			logger.Fatal().Err(err).Msg("API server err")
		}
	}()

	// -------------------------------------------------------------------------
	// Shutdown cleanup

	// Wait for SIGTERM or SIGINT
	sigC := make(chan os.Signal, 1)
	signal.Notify(sigC, syscall.SIGTERM, syscall.SIGINT)
	<-sigC

	logger.Info().Msg("Received signal, shutting down server (10s timeout)...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := shutdownOtel(shutdownCtx); err != nil {
		logger.Error().Err(err).Msg("shutdown OpenTelemetry SDK err")
	}

	if err := metricsServer.Shutdown(shutdownCtx); err != nil {
		logger.Error().Err(err).Msg("shutdown metrics server err")
	}

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error().Err(err).Msg("shutdown API server err")
	}

	logger.Info().Msg("Server shut down")
}
