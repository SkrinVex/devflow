package middleware

import (
	"context"
	"net/http"
	"strings"

	"devflow/internal/api/handlers"
	"devflow/internal/domain"
	"devflow/internal/security"
)

const UserContextKey = "user_claims"

func Auth(jwtManager *security.JWTManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString := ""

			// 1. Check Authorization header: Bearer <token>
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
					tokenString = parts[1]
				}
			}

			// 2. Check cookie if header not present
			if tokenString == "" {
				cookie, err := r.Cookie("devflow_token")
				if err == nil && cookie.Value != "" {
					tokenString = cookie.Value
				}
			}

			// 3. Check query param ?token= or ?access_token= (used for WebSocket & EventSource)
			if tokenString == "" {
				tokenString = r.URL.Query().Get("token")
				if tokenString == "" {
					tokenString = r.URL.Query().Get("access_token")
				}
			}

			if tokenString == "" {
				handlers.RespondError(w, http.StatusUnauthorized, "Authentication required", domain.ErrUnauthorized)
				return
			}

			claims, err := jwtManager.ValidateToken(tokenString)
			if err != nil || claims.IsTemp {
				handlers.RespondError(w, http.StatusUnauthorized, "Invalid or expired token", domain.ErrUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserClaims retrieves authenticated user claims from request context.
func GetUserClaims(r *http.Request) (*security.Claims, bool) {
	claims, ok := r.Context().Value(UserContextKey).(*security.Claims)
	return claims, ok
}
