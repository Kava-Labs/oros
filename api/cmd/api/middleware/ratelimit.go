package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"
)

// Default rate limit exceeded message
const defaultRateLimitMessage = "Rate limit exceeded. Please try again later."

// RateLimiterConfig holds configuration for the rate limiter
type RateLimiterConfig struct {
	// Maximum number of requests allowed in the time window
	MaxRequests int
	// Time window for rate limiting (in seconds)
	WindowSize time.Duration
}

// ipData stores request information for a specific IP
type ipData struct {
	count      int
	lastAccess time.Time
}

// NewRateLimiter creates a new rate limiter middleware that directly returns
// a http.Handler middleware function
func NewRateLimiter(config RateLimiterConfig) func(http.Handler) http.Handler {
	// Create in-memory storage for request counts
	requests := make(map[string]ipData)
	var mu sync.Mutex

	// Start a goroutine to periodically clean up old entries
	go func() {
		ticker := time.NewTicker(config.WindowSize)
		defer ticker.Stop()

		for range ticker.C {
			mu.Lock()
			now := time.Now()

			// Remove entries older than the window size
			for ip, data := range requests {
				if now.Sub(data.lastAccess) > config.WindowSize {
					delete(requests, ip)
				}
			}
			mu.Unlock()
		}
	}()

	// Return the middleware function
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get client IP from RemoteAddr
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				// If there's an error, just use RemoteAddr directly
				ip = r.RemoteAddr
			}

			mu.Lock()
			defer mu.Unlock()

			// Get current request data for this IP or initialize if not exists
			data, exists := requests[ip]
			now := time.Now()

			// If the entry exists but the window has expired, reset the counter
			if exists && now.Sub(data.lastAccess) > config.WindowSize {
				data.count = 0
			}

			// Update the access count and time
			data.count++
			data.lastAccess = now
			requests[ip] = data

			// Check if the rate limit has been exceeded
			if data.count > config.MaxRequests {
				w.WriteHeader(http.StatusTooManyRequests)
				w.Write([]byte(defaultRateLimitMessage))
				return
			}

			// If not exceeded, proceed with the request
			next.ServeHTTP(w, r)
		})
	}
}
