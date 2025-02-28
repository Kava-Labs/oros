package main

import (
	"io"
	stdlog "log"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

func InitializeLogger(
	isJson bool,
	logLevel string,
) *zerolog.Logger {
	var output io.Writer
	if isJson {
		output = os.Stdout
	} else {
		output = zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.Kitchen}
	}

	logger := zerolog.New(output).With().Timestamp().Logger()

	// Set as standard logger output
	stdlog.SetFlags(0)
	stdlog.SetOutput(logger)

	// Update log level
	logger.Info().Str("log_level", logLevel).Msg("Setting log level")

	if strings.ToLower(logLevel) == "debug" {
		logger.WithLevel(zerolog.DebugLevel)
	} else if strings.ToLower(logLevel) == "info" {
		logger.WithLevel(zerolog.InfoLevel)
	}

	return &logger
}
