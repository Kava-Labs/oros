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
	"github.com/go-chi/chi/v5"

	"github.com/kava-labs/kavachat/api/internal/config"
	"github.com/kava-labs/kavachat/api/internal/handlers"
	"github.com/kava-labs/kavachat/api/internal/middleware"
	"github.com/kava-labs/kavachat/api/internal/types"
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

	r := chi.NewRouter()

	r.Use(chimiddleware.Recoverer) // Recover from panics, 500 response, logs stack trace

	// Metrics re-use middleware for /v1/files routes to not duplicate metrics
	// autoprom panics if the same handler name is used
	fileMetrics := metricsMiddleware.WitHandlerName("/v1/files")

	// /v1/ custom routes
	r.Route("/v1", func(r chi.Router) {
		r.Get("/healthcheck", func(w http.ResponseWriter, r *http.Request) {
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
			// Need to set real IP
			chimiddleware.RealIP,
			// Before rate limiter
			middleware.NewRateLimiter(middleware.RateLimiterConfig{
				MaxRequests: 10,
				WindowSize:  1 * time.Minute,
			}),
			fileMetrics,
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
		r.With(fileMetrics).Get(
			"/files/{file_id}",
			downloadHandler.ServeHTTP,
		)
	})

	// OpenAI compatible routes
	r.Route("/openai/v1", func(r chi.Router) {
		r.Use(middleware.PreflightMiddleware)
		r.Use(middleware.ExtractModelMiddleware(logger))
		r.Use(middleware.ModelAllowlistMiddleware(logger, cfg.Backends))

		// /openai/v1/chat/completions
		r.With(metricsMiddleware.WitHandlerName(types.ChatCompletionEndpoint.String())).
			Handle(
				types.ChatCompletionEndpoint.String(),
				handlers.NewOpenAIChatHandler(
					cfg.Backends,
					logger,
					types.ChatCompletionEndpoint,
					cfg.VisionPreprocessingMap,
					cfg.VisionSystemPrompt,
				),
			)

		// /openai/v1/image/generations
		r.With(metricsMiddleware.WitHandlerName(types.ImageGenerationsEndpoint.String())).
			Handle(
				types.ImageGenerationsEndpoint.String(),
				handlers.NewBasicOpenAIProxyHandler(
					cfg.Backends,
					logger,
					types.ImageGenerationsEndpoint,
				),
			)
	})

	// -------------------------------------------------------------------------
	// Metrics server

	metricsLogger := logger.With().Str("server", "metrics").Logger()

	metricsR := chi.NewRouter()
	metricsR.Handle("/metrics", promhttp.HandlerFor(metricsReg, promhttp.HandlerOpts{
		// register a metric "promhttp_metric_handler_errors_total", partitioned by "cause".
		Registry: metricsReg,
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

	if err := metricsServer.Shutdown(shutdownCtx); err != nil {
		logger.Fatal().Err(err).Msg("shutdown metrics server err")
	}

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Fatal().Err(err).Msg("shutdown API server err")
	}

	logger.Info().Msg("Server shut down")
}
