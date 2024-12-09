package main

import (
	"context"
	"encoding/json"
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
	"strings"

	"github.com/google/uuid"
)

const (
	defaultAPIPort = 5555
)

var ErrOpenAIKeyRequired = errors.New("OPENAI_API_KEY is required")
var ErrOpenAIBaseURLRequired = errors.New("OPENAI_BASE_URL is required")

type ClientIdent struct {
	SessionID string
	ClientID  string
}

type ContextKey string

var contextKeyClientIdent = ContextKey("client_ident")

// here's what an openai api error looks like
// {
// 	"error": {
// 	  "code": "invalid_api_key",
// 	  "message": "Incorrect API key provided:  You can find your API key at https://platform.openai.com/account/api-keys.",
// 	  "param": null,
// 	  "type": "invalid_request_error"
// 	}
//   }

// not sure if it's worth setting up types and marshaling the error
// or keep a raw json array pre-marshaled
// type OpenaiAPIErrorData struct {
// 	Code    string `json:"code"`
// 	Message string `json:"message"`
// 	Param   any    `json:"param"`
// 	Type    string `json:"type"`
// }

//	type OpenaiAPIError struct {
//		Error OpenaiAPIErrorData `json:"error"`
//	}
var InvalidRequestBadAPIKey = json.RawMessage(`{"error": {"code": "invalid_api_key", "message": "Incorrect or malformed API key provided", "param": null, type: "invalid_request_error"}}`)

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

	imageGenerationUrl, err := url.JoinPath(baseURL, "/images/generations")
	if err != nil {
		logFatal(logger, err)
	}

	client := http.Client{}

	authMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tkn := r.Header.Get("Authorization")
			if !strings.HasPrefix(tkn, "Bearer kavachat:") {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write(InvalidRequestBadAPIKey)
				logger.Info("Invalid Authorization header", slog.String("Authorization", tkn))
				return
			}

			tkn = strings.Replace(tkn, "Bearer kavachat:", "", 1)
			tknPair := strings.Split(tkn, ":")
			if len(tknPair) != 2 {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write(InvalidRequestBadAPIKey)
				logger.Info("Invalid Authorization header", slog.String("Authorization", tkn))
				return
			}

			for _, t := range tknPair {
				_, err := uuid.Parse(t)
				if err != nil {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusUnauthorized)
					w.Write(InvalidRequestBadAPIKey)
					logger.Info("Invalid Authorization header", slog.String("Authorization", tkn))
					return
				}
			}

			r = r.WithContext(context.WithValue(r.Context(), contextKeyClientIdent, ClientIdent{
				ClientID:  tknPair[0],
				SessionID: tknPair[1],
			}))

			next.ServeHTTP(w, r)
		})
	}

	// handle browsers's OPTIONS request and halt or forward to the handler
	preFlightMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodOptions {
				w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, x-stainless-os, x-stainless-runtime-version, x-stainless-package-version, x-stainless-runtime, x-stainless-arch, x-stainless-retry-count, x-stainless-lang, user-agent")
				w.Header().Set("Access-Control-Max-Age", "3600")
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}

	copyApplicationHeaders := func(src http.Request, dst http.Request){
		for name, vals := range src.Header {
			if strings.HasPrefix(name, "X-") || strings.HasPrefix(name, "x-") {
				for _, v := range vals {
					dst.Header.Add(name, v)
				}
			}
		}
	}


	completionsHandler := func(w http.ResponseWriter, r *http.Request) {
		cid, _ := r.Context().Value(contextKeyClientIdent).(ClientIdent)

		logger.Info("request received", slog.String("clientID", cid.ClientID), slog.String("sessionID", cid.SessionID), slog.String("path", r.URL.Path))

		request, err := http.NewRequest(r.Method, chatCompletionsUrl, r.Body)
		if err != nil {
			logger.Error(fmt.Errorf("error building request for upstream: %w", err).Error())
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		request.Header.Set("Authorization", authHeader)
		request.Header.Set("Content-Type", r.Header.Get("Content-Type"))
		copyApplicationHeaders(*r, *request)

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
	}

	imageGenerationHandler := func(w http.ResponseWriter, r *http.Request) {
		cid, _ := r.Context().Value(contextKeyClientIdent).(ClientIdent)

		logger.Info("request received", slog.String("clientID", cid.ClientID), slog.String("sessionID", cid.SessionID), slog.String("path", r.URL.Path))

		request, err := http.NewRequest(r.Method, imageGenerationUrl, r.Body)
		if err != nil {
			logger.Error(fmt.Errorf("error building request for upstream: %w", err).Error())
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		request.Header.Set("Authorization", authHeader)
		request.Header.Set("Content-Type", r.Header.Get("Content-Type"))

		copyApplicationHeaders(*r, *request)

		response, err := client.Do(request)
		if err != nil {
			logger.Error(fmt.Errorf("error forwarding request to upstream: %w", err).Error())
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer response.Body.Close()

		w.Header().Set("Content-Type", response.Header.Get("Content-Type"))
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(response.StatusCode)

		io.Copy(w, response.Body)
	}

	mux.Handle("/openai/v1/chat/completions", preFlightMiddleware(authMiddleware(http.HandlerFunc(completionsHandler))))
	mux.Handle("/openai/v1/images/generations", preFlightMiddleware(authMiddleware(http.HandlerFunc(imageGenerationHandler))))

	port := defaultAPIPort
	if envPort := os.Getenv("KAVACHAT_API_PORT"); envPort != "" {
		parsedPort, err := strconv.Atoi(envPort)
		if err != nil {
			logFatal(logger, fmt.Errorf("error setting KAVACHAT_API_PORT to %s: %w", envPort, err))
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
