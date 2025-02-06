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

	fmt.Printf("cfg: %+v\n", cfg)

	logger.Info("Load config from env")

	// Update log level
	logger.Info("Setting log level", "level", cfg.LogLevel)
	if strings.ToLower(cfg.LogLevel) == "debug" {
		logLevel.Set(slog.LevelDebug)
	} else if strings.ToLower(cfg.LogLevel) == "info" {
		logLevel.Set(slog.LevelInfo)
	}

	// -------------------------------------------------------------------------
	// Verify backends

	// Runpod LLaMA.cpp worker doesn't implement v1/models endpoint right now,
	// only warn for now
	if cfg.SkipBackendValidation {
		logger.Warn("Skipping backend validation")
	} else {
		// logger.Info("Validating backends...")

		// if err := validateBackendModels(cfg); err != nil {
		// 	logger.Warn("Error when validating backends", "error", err)
		// }
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

// validateBackendModels checks if the models in the config are available in the
// backend APIs
/*
func validateBackendModels(cfg config.Config) error {
	missingModels := make(map[string][]string)

	for _, backend := range cfg.Backends {
		client := backend.GetClient()

		backendModels, err := client.Models.List(context.Background())
		if err != nil {
			return fmt.Errorf(
				"error fetching models from backend %s with base URL %s: %w",
				backend.Name,
				backend.BaseURL,
				err,
			)
		}

		// Convert to map for easier lookup
		backendModelsMap := make(map[string]struct{})
		for _, backendModel := range backendModels.Data {
			backendModelsMap[backendModel.ID] = struct{}{}
		}

		for _, allowedModel := range backend.AllowedModels {
			// Allowed model is present in the backend, skip
			_, ok := backendModelsMap[allowedModel]
			if ok {
				continue
			}

			// Init empty slice if not present
			if _, ok := missingModels[backend.BaseURL]; !ok {
				missingModels[backend.BaseURL] = []string{}
			}

			// Add missing model to the list
			missingModels[backend.BaseURL] = append(missingModels[backend.BaseURL], allowedModel)
		}
	}

	if len(missingModels) > 0 {
		return fmt.Errorf("models not found in backends: %v", missingModels)
	}

	return nil
}
*/

func logFatal(logger *slog.Logger, err error) {
	logger.Error(err.Error())
	os.Exit(1)
}
