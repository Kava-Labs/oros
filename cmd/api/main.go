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
		logger.Error(ErrOpenAIKeyRequired.Error())
		log.Fatalf("fatal: %v", ErrOpenAIKeyRequired)
	}

	fmt.Println("Welcome to the Kavachat API!")
}
