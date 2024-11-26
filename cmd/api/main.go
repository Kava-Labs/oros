package main

import (
	"errors"
	"fmt"
	"log"
	"log/slog"
	"os"
)

var ErrOpenAIKeyRequired = errors.New("OPENAI_API_KEY is required")

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	if os.Getenv("OPENAI_API_KEY") == "" {
		logFatal(logger, ErrOpenAIKeyRequired)
	}

	fmt.Println("Welcome to the Kavachat API!")
}

func logFatal(logger *slog.Logger, err error) {
	logger.Error(err.Error())
	log.Fatalf("fatal: %v", err)
}
