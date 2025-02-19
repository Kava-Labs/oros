package main

import (
	"context"
	"fmt"
	stdlog "log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/rs/zerolog"

	"github.com/justinas/alice"
	"github.com/kava-labs/kavachat/api/cmd/api/config"
	"github.com/kava-labs/kavachat/api/cmd/api/handlers"
	"github.com/kava-labs/kavachat/api/cmd/api/middleware"
)

func NewLogger() *zerolog.Logger {
	// Can be removed for JSON logging, ConsoleWriter not as performant
	output := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.Kitchen}
	logger := zerolog.New(output).With().Timestamp().Logger()
	return &logger
}

func main() {
	// -------------------------------------------------------------------------
	// Setup logging, configuration
	logger := NewLogger()

	// Set as standard logger output
	stdlog.SetFlags(0)
	stdlog.SetOutput(logger)

	cfg, err := config.NewConfigFromEnv()
	if err != nil {
		logger.Fatal().Err(err).Msgf("error parsing config")
	}

	if err := cfg.Validate(); err != nil {
		logger.Fatal().Err(err).Msgf("invalid config")
	}

	// API Keys are redacted in the OpenAIBackend.String() method
	logger.Info().Stringer("config", cfg).Msg("Load config from env")

	// Update log level
	logger.Info().Str("log_level", cfg.LogLevel).Msg("Setting log level")

	if strings.ToLower(cfg.LogLevel) == "debug" {
		logger.WithLevel(zerolog.DebugLevel)
	} else if strings.ToLower(cfg.LogLevel) == "info" {
		logger.WithLevel(zerolog.InfoLevel)
	}

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
			Then(
				handlers.NewOpenAIProxyHandler(
					cfg.Backends,
					logger,
					"/chat/completions",
				),
			),
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
			Then(
				handlers.NewOpenAIProxyHandler(
					cfg.Backends,
					logger,
					"/images/generations",
				),
			),
	)

	// -------------------------------------------------------------------------
	// Metrics server

	metricsLogger := logger.With().Str("server", "metrics").Logger()

	metricsServer := &http.Server{
		Addr: fmt.Sprintf(":%d", cfg.MetricsPort),
		Handler: promhttp.HandlerFor(metricsReg, promhttp.HandlerOpts{
			// register a metric "promhttp_metric_handler_errors_total", partitioned by "cause".
			Registry: metricsReg,
			ErrorLog: &metricsLogger,
		}),
	}

	go func() {
		logger.Info().Msgf("serving metrics at: %s", metricsServer.Addr)

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
