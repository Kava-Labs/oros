package middleware

import "net/http"

// PreflightMiddleware is a middleware that handles preflight requests, allowing
// CORS requests to be made to the API.
func PreflightMiddleware(next http.Handler) http.Handler {
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
