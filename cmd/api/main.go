package main

import (
	"errors"
	"fmt"
	"io"
	"log"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
)

const (
	defaultAPIPort = 5555
)

const (
	defaultHost = "127.0.0.1"
)

var ErrOpenAIKeyRequired = errors.New("OPENAI_API_KEY is required")
var ErrOpenAIBaseURLRequired = errors.New("OPENAI_BASE_URL is required")
var ErrAPIHostRequired = errors.New("KAVACHAT_API_HOST is required")

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		logFatal(logger, ErrOpenAIKeyRequired)
	}
	baseURL := os.Getenv("OPENAI_BASE_URL")
	if baseURL == "" {
		logFatal(logger, ErrOpenAIBaseURLRequired)
	}

	logger.Info("Starting Kavachat API!")

	mux := http.NewServeMux()
	mux.HandleFunc("/v1/healthcheck", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "available")
	})

	authHeader := fmt.Sprintf("Bearer %s", apiKey)
	chatCompletionsUrl, err := url.JoinPath(baseURL, "/chat/completions")
	if err != nil {
		logFatal(logger, err)
	}

	client := http.Client{}
	mux.HandleFunc("/openai/v1/chat/completions", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, x-stainless-os, x-stainless-runtime-version, x-stainless-package-version, x-stainless-runtime, x-stainless-arch, x-stainless-retry-count, x-stainless-lang, user-agent")

			w.WriteHeader(http.StatusOK)
			return
		}

		request, err := http.NewRequest(r.Method, chatCompletionsUrl, r.Body)
		if err != nil {
			logger.Error(fmt.Errorf("error building request for upstream: %w", err).Error())
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		request.Header.Set("Authorization", authHeader)
		request.Header.Set("Content-Type", r.Header.Get("Content-Type"))

		response, err := client.Do(request)
		if err != nil {
			logger.Error(fmt.Errorf("error forwarding request to upstream: %w", err).Error())
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer response.Body.Close()

		w.Header().Set("Content-Type", response.Header.Get("Content-Type"))
		w.Header().Set("Transfer-Encoding", "identity")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(response.StatusCode)
		io.Copy(w, response.Body)

	})

	port := defaultAPIPort
	if envPort := os.Getenv("KAVACHAT_API_PORT"); envPort != "" {
		parsedPort, err := strconv.Atoi(envPort)
		if err != nil {
			logFatal(logger, fmt.Errorf("error setting KAVACHAT_API_PORT to %s: %w", envPort, err))
		}
		port = parsedPort
	}

	host := defaultHost

	if envHost := os.Getenv("KAVACHAT_HOST"); envHost != "" {
		host = envHost
	}

	address := fmt.Sprintf("%s:%d", host, port)

	listener, err := net.Listen("tcp", address)
	if err != nil {
		logFatal(logger, err)
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
	log.Fatalf("fatal: %v", err)
}
