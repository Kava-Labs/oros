package main

import (
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"strings"

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
			).
			// Handler
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
	// Server setup

	address := fmt.Sprintf("%s:%d", cfg.ServerHost, cfg.ServerPort)

	listener, err := net.Listen("tcp", address)
	if err != nil {
		logFatal(logger, fmt.Errorf("failed to start server: %w", err))
	}

	tcpAddr := listener.Addr().(*net.TCPAddr)
	logger.Info("listening", "port", tcpAddr.Port)

	server := &http.Server{
		Handler:  mux,
		ErrorLog: slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}

	logger.Info("serving", "addr", address)

	if err := server.Serve(listener); err != http.ErrServerClosed {
		logFatal(logger, err)
	}
}

func logFatal(logger *slog.Logger, err error) {
	logger.Error(err.Error())
	os.Exit(1)
}
