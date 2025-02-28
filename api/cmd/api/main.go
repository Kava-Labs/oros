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
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	chimiddleware "github.com/go-chi/chi/middleware"

	"github.com/justinas/alice"
	"github.com/kava-labs/kavachat/api/cmd/api/config"
	"github.com/kava-labs/kavachat/api/cmd/api/handlers"
	"github.com/kava-labs/kavachat/api/cmd/api/middleware"
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
	// Metrics registry
	metricsReg := prometheus.NewRegistry()

	// Go runtime metrics and process collectors
	metricsReg.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)

	metricsMiddleware := middleware.NewMetricsMiddleware(metricsReg, nil)

	// -------------------------------------------------------------------------
	// API Routes
	logger.Info().Msg("Starting Kavachat API!")

	mux := http.NewServeMux()
	mux.HandleFunc("/v1/healthcheck", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "available")
	})

	// Metrics re-use middleware for /v1/files routes to not duplicate metrics
	// autoprom panics if the same handler name is used
	fileMetrics := metricsMiddleware.WitHandlerName("/v1/files")

	// File uploads
	mux.Handle(
		"POST /v1/files",
		alice.New(
			// Need to set real IP
			chimiddleware.RealIP,
			// Before rate limiter
			middleware.NewRateLimiter(middleware.RateLimiterConfig{
				MaxRequests: 10,
				WindowSize:  1 * time.Minute,
			}),
			fileMetrics,
		).Then(handlers.NewFileUploadHandler(
			cfg.S3BucketName,
			cfg.S3PathStyleRequests,
			cfg.PublicURL,
			logger,
		)),
	)

	// File downloads
	mux.Handle(
		"GET /v1/files/{file_id}",
		alice.New(
			fileMetrics,
		).Then(handlers.NewFileDownloadHandler(
			cfg.S3BucketName,
			cfg.S3PathStyleRequests,
			logger,
		)),
	)

	// OpenAI routes
	mux.Handle(
		"/openai/v1/chat/completions",
		alice.
			// Middlewares
			New(
				middleware.PreflightMiddleware,
				middleware.ExtractModelMiddleware(logger),
				middleware.ModelAllowlistMiddleware(logger, cfg.Backends),
				metricsMiddleware.WitHandlerName("/chat/completions"),
			).
			Then(handlers.NewOpenAIProxyHandler(
				cfg.Backends,
				logger,
				"/chat/completions",
			)),
	)

	mux.Handle(
		"/openai/v1/images/generations",
		alice.
			// Middlewares
			New(
				middleware.PreflightMiddleware,
				middleware.ExtractModelMiddleware(logger),
				middleware.ModelAllowlistMiddleware(logger, cfg.Backends),
				metricsMiddleware.WitHandlerName("/images/generations"),
			).
			// Handler
			Then(handlers.NewOpenAIProxyHandler(
				cfg.Backends,
				logger,
				"/images/generations",
			)),
	)

	// -------------------------------------------------------------------------
	// Metrics server

	metricsLogger := logger.With().Str("server", "metrics").Logger()

	metricsMux := http.NewServeMux()

	metricsMux.Handle("/metrics", promhttp.HandlerFor(metricsReg, promhttp.HandlerOpts{
		// register a metric "promhttp_metric_handler_errors_total", partitioned by "cause".
		Registry: metricsReg,
		ErrorLog: &metricsLogger,
	}))

	metricsServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.MetricsPort),
		Handler: metricsMux,
	}

	go func() {
		logger.Info().Msgf("serving metrics on: %s/metrics", metricsServer.Addr)

		if err := metricsServer.ListenAndServe(); err != http.ErrServerClosed {
			logger.Fatal().Err(err).Msg("metrics server err")
		}
	}()

	// -------------------------------------------------------------------------
	// Server setup

	address := fmt.Sprintf("%s:%d", cfg.ServerHost, cfg.ServerPort)

	server := &http.Server{
		Addr:    address,
		Handler: mux,
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

	if err := metricsServer.Shutdown(shutdownCtx); err != nil {
		logger.Fatal().Err(err).Msg("shutdown metrics server err")
	}

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Fatal().Err(err).Msg("shutdown API server err")
	}

	logger.Info().Msg("Server shut down")
}
