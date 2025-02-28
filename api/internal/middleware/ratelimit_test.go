package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/kava-labs/kavachat/api/internal/middleware"
	"github.com/stretchr/testify/require"
)

func TestRateLimiter(t *testing.T) {
	// Create a rate limiter middleware function with the new struct-based options
	limitMiddleware := middleware.NewRateLimiter(middleware.RateLimiterConfig{
		MaxRequests: 3,
		WindowSize:  1 * time.Second,
	})

	// Create a simple handler for testing
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Apply the rate limiter middleware
	limitedHandler := limitMiddleware(handler)

	// Create a request with a fixed IP
	req, err := http.NewRequest("GET", "/", nil)
	require.NoError(t, err)

	// Set a mock IP address
	req.RemoteAddr = "192.168.1.1:12345"

	// Test successful requests within the limit
	for i := 0; i < 3; i++ {
		rr := httptest.NewRecorder()
		limitedHandler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusOK, rr.Code, "handler returned wrong status code")
	}

	// Test exceeding the rate limit
	rr := httptest.NewRecorder()
	limitedHandler.ServeHTTP(rr, req)

	require.Equal(t, http.StatusTooManyRequests, rr.Code, "handler should return 429 after limit exceeded")

	// Test reset after window expiry
	time.Sleep(1100 * time.Millisecond) // Wait longer than the window

	rr = httptest.NewRecorder()
	limitedHandler.ServeHTTP(rr, req)

	require.Equal(t, http.StatusOK, rr.Code, "handler should allow requests after window reset")
}
