package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/justinas/alice"
	"github.com/kava-labs/kavachat/api/cmd/api/config"
	"github.com/kava-labs/kavachat/api/cmd/api/handlers"
	"github.com/kava-labs/kavachat/api/cmd/api/middleware"
)

func main() {
	// -------------------------------------------------------------------------
	// Setup logging, configuration
	logLevel := new(slog.LevelVar)
	logLevel.Set(slog.LevelInfo)

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))

	cfg, err := config.NewConfigFromEnv()
	if err != nil {
		logFatal(logger, fmt.Errorf("error parsing config: %w", err))
	}

	if err := cfg.Validate(); err != nil {
		logFatal(logger, fmt.Errorf("invalid config: %w", err))
	}

	// API Keys are redacted in the OpenAIBackend.String() method
	logger.Info("Load config from env", "config", cfg)

	// Update log level
	logger.Info("Setting log level", "level", cfg.LogLevel)
	if strings.ToLower(cfg.LogLevel) == "debug" {
		logLevel.Set(slog.LevelDebug)
	} else if strings.ToLower(cfg.LogLevel) == "info" {
		logLevel.Set(slog.LevelInfo)
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
	logger.Info("Starting Kavachat API!")

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

	metricsServer := &http.Server{
		Addr: ":9090",
		Handler: promhttp.HandlerFor(metricsReg, promhttp.HandlerOpts{
			// register a metric "promhttp_metric_handler_errors_total", partitioned by "cause".
			Registry: metricsReg,
			ErrorLog: slog.NewLogLogger(logger.Handler(), slog.LevelError),
		}),
		ErrorLog: slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}

	go func() {
		logger.Info("serving metrics at: :9090")
		if err := metricsServer.ListenAndServe(); err != http.ErrServerClosed {
			logFatal(logger, fmt.Errorf("metrics server err: %w", err))
		}
	}()

	// -------------------------------------------------------------------------
	// Server setup

	address := fmt.Sprintf("%s:%d", cfg.ServerHost, cfg.ServerPort)

	server := &http.Server{
		Addr:     address,
		Handler:  mux,
		ErrorLog: slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}

	logger.Info(fmt.Sprintf("serving API on %s", address))

	go func() {
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			logFatal(logger, fmt.Errorf("API server err: %w", err))
		}
	}()

	// -------------------------------------------------------------------------
	// Shutdown cleanup

	// Wait for SIGTERM or SIGINT
	sigC := make(chan os.Signal, 1)
	signal.Notify(sigC, syscall.SIGTERM, syscall.SIGINT)
	<-sigC

	logger.Info("Received signal, shutting down server (10s timeout)...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := metricsServer.Shutdown(shutdownCtx); err != nil {
		logFatal(logger, fmt.Errorf("shutdown metrics server err: %w", err))
	}

	if err := server.Shutdown(shutdownCtx); err != nil {
		logFatal(logger, fmt.Errorf("shutdown API server err: %w", err))
	}

	logger.Info("Server shut down")
}

func logFatal(logger *slog.Logger, err error) {
	logger.Error(err.Error())
	os.Exit(1)
}
