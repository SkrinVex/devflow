package security

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID       string `json:"sub"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	Is2FAEnabled bool   `json:"is_2fa_enabled"`
	Is2FAVerified bool  `json:"is_2fa_verified"`
	IsTemp       bool   `json:"is_temp,omitempty"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	secret []byte
	expiry time.Duration
}

func NewJWTManager(secret []byte, expiry time.Duration) *JWTManager {
	return &JWTManager{
		secret: secret,
		expiry: expiry,
	}
}

// GenerateToken generates a full session token for a logged-in user.
func (m *JWTManager) GenerateToken(userID, username, email string, is2FAEnabled bool) (string, error) {
	claims := Claims{
		UserID:        userID,
		Username:      username,
		Email:         email,
		Is2FAEnabled:  is2FAEnabled,
		Is2FAVerified: true,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "devflow",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

// GenerateTempToken generates a short-lived token (5 minutes) for completing 2FA challenge.
func (m *JWTManager) GenerateTempToken(userID, username, email string) (string, error) {
	claims := Claims{
		UserID:        userID,
		Username:      username,
		Email:         email,
		Is2FAEnabled:  true,
		Is2FAVerified: false,
		IsTemp:        true,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "devflow",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

// ValidateToken validates and parses a JWT string into Claims.
func (m *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return m.secret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}
