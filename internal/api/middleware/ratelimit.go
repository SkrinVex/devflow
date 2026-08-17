package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"devflow/internal/api/handlers"
)

type clientLimit struct {
	tokens     float64
	lastRefill time.Time
}

type RateLimiter struct {
	mu      sync.Mutex
	clients map[string]*clientLimit
	rate    float64 // tokens per second
	burst   float64 // max burst capacity
}

func NewRateLimiter(rps float64, burst int) *RateLimiter {
	limiter := &RateLimiter{
		clients: make(map[string]*clientLimit),
		rate:    rps,
		burst:   float64(burst),
	}

	// Periodic cleanup of stale client records
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		for range ticker.C {
			limiter.mu.Lock()
			now := time.Now()
			for ip, client := range limiter.clients {
				if now.Sub(client.lastRefill) > 15*time.Minute {
					delete(limiter.clients, ip)
				}
			}
			limiter.mu.Unlock()
		}
	}()

	return limiter
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Don't rate limit static assets
		if !strings.HasPrefix(r.URL.Path, "/api/") {
			next.ServeHTTP(w, r)
			return
		}

		ip := getClientIP(r)

		rl.mu.Lock()
		client, exists := rl.clients[ip]
		now := time.Now()

		if !exists {
			client = &clientLimit{
				tokens:     rl.burst,
				lastRefill: now,
			}
			rl.clients[ip] = client
		}

		// Refill tokens
		elapsed := now.Sub(client.lastRefill).Seconds()
		client.tokens += elapsed * rl.rate
		if client.tokens > rl.burst {
			client.tokens = rl.burst
		}
		client.lastRefill = now

		if client.tokens < 1.0 {
			rl.mu.Unlock()
			handlers.RespondError(w, http.StatusTooManyRequests, "Rate limit exceeded. Please slow down.", nil)
			return
		}

		client.tokens -= 1.0
		rl.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}

func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	// Check X-Real-IP
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}
	// RemoteAddr
	parts := strings.Split(r.RemoteAddr, ":")
	return parts[0]
}
