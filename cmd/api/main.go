package main

import (
	"errors"
	"fmt"
	"log"
	"log/slog"
	"net"
	"net/http"
	"os"
	"strconv"
)

const (
	defaultAPIPort = 5555
)

var ErrOpenAIKeyRequired = errors.New("OPENAI_API_KEY is required")

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	if os.Getenv("OPENAI_API_KEY") == "" {
		logFatal(logger, ErrOpenAIKeyRequired)
	}

	logger.Info("Starting Kavachat API!")

	mux := http.NewServeMux()
	mux.HandleFunc("/v1/healthcheck", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "available")
	})

	port := defaultAPIPort
	if envPort := os.Getenv("KAVACHAT_API_PORT"); envPort != "" {
		parsedPort, err := strconv.Atoi(envPort)
		if err != nil {
			logFatal(logger, err)
		}
		port = parsedPort
	}

	listener, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		logFatal(logger, err)
	}
	tcpAddr := listener.Addr().(*net.TCPAddr)
	logger.Info("listening", "port", tcpAddr.Port)

	server := &http.Server{
		Handler:  mux,
		ErrorLog: slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}

	logger.Info("serving", "addr", listener.Addr())

	if err := server.Serve(listener); err != http.ErrServerClosed {
		logFatal(logger, err)
	}
}

func logFatal(logger *slog.Logger, err error) {
	logger.Error(err.Error())
	log.Fatalf("fatal: %v", err)
}
