package config

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

type Config struct {
	Port                   string
	Host                   string
	AppURL                 string
	DataDir                string
	DBPath                 string
	JWTSecret              []byte
	JWTExpiry              time.Duration
	RateLimitRPS           float64
	RateLimitBurst         int
	EnableRegistration     bool
	AppEnv                 string
	ResendAPIKey           string
	EmailFrom              string
	SMTPHost               string
	SMTPPort               int
	SMTPUser               string
	SMTPPassword           string
	SMTPFrom               string
	SMTPInsecureSkipVerify bool
}

func Load() (*Config, error) {
	port := getEnv("PORT", "1451")
	host := getEnv("HOST", "0.0.0.0")
	dataDir := getEnv("DATA_DIR", "./data")
	appEnv := getEnv("APP_ENV", "production")

	// Ensure data directory exists with secure directory permissions (0750)
	if err := os.MkdirAll(dataDir, 0750); err != nil {
		return nil, fmt.Errorf("failed to create data dir %s: %w", dataDir, err)
	}

	dbPath := filepath.Join(dataDir, "devflow.db")

	jwtSecretStr := os.Getenv("JWT_SECRET")
	var jwtSecret []byte

	if jwtSecretStr != "" {
		jwtSecret = []byte(jwtSecretStr)
	} else {
		// Auto-generate or read persistent secret file atomically with 0600 permissions
		secretFile := filepath.Join(dataDir, ".jwt_secret")
		secretBytes, err := os.ReadFile(secretFile)

		if err == nil {
			trimmed := bytes.TrimSpace(secretBytes)
			if len(trimmed) >= 32 {
				jwtSecret = trimmed
				// Enforce strict 0600 permissions on existing secret file
				_ = os.Chmod(secretFile, 0600)
			}
		}

		if len(jwtSecret) == 0 {
			// Generate 32 bytes (256 bits) of cryptographically secure random bytes
			randomKey := make([]byte, 32)
			if _, err := rand.Read(randomKey); err != nil {
				return nil, fmt.Errorf("failed to generate random JWT secret: %w", err)
			}
			hexSecret := hex.EncodeToString(randomKey)

			// Atomic write: write to temp file first, fsync, then atomic rename
			tempFile := fmt.Sprintf("%s.tmp.%d", secretFile, time.Now().UnixNano())
			f, err := os.OpenFile(tempFile, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
			if err != nil {
				return nil, fmt.Errorf("failed to create temporary secret file: %w", err)
			}

			if _, err := f.Write([]byte(hexSecret)); err != nil {
				_ = f.Close()
				_ = os.Remove(tempFile)
				return nil, fmt.Errorf("failed to write secret to temporary file: %w", err)
			}

			// Ensure data is physically flushed to disk
			if err := f.Sync(); err != nil {
				_ = f.Close()
				_ = os.Remove(tempFile)
				return nil, fmt.Errorf("failed to sync secret file: %w", err)
			}
			_ = f.Close()

			// Atomic rename replaces the target file atomically
			if err := os.Rename(tempFile, secretFile); err != nil {
				_ = os.Remove(tempFile)
				return nil, fmt.Errorf("failed to atomically rename secret file: %w", err)
			}

			// Enforce 0600 permissions (read/write by owner only)
			_ = os.Chmod(secretFile, 0600)

			log.Printf("🔐 Generated new persistent JWT secret at %s (mode: 0600)", secretFile)
			jwtSecret = []byte(hexSecret)
		}
	}

	jwtExpiryHours, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "72"))
	if jwtExpiryHours <= 0 {
		jwtExpiryHours = 72
	}

	rateLimitRPS, _ := strconv.ParseFloat(getEnv("RATE_LIMIT_RPS", "30"), 64)
	if rateLimitRPS <= 0 {
		rateLimitRPS = 30
	}

	rateLimitBurst, _ := strconv.Atoi(getEnv("RATE_LIMIT_BURST", "60"))
	if rateLimitBurst <= 0 {
		rateLimitBurst = 60
	}

	enableReg := getEnv("ENABLE_REGISTRATION", "true") == "true"

	appURL := getEnv("APP_URL", "")
	if appURL == "" {
		if host == "0.0.0.0" || host == "" {
			appURL = fmt.Sprintf("http://localhost:%s", port)
		} else {
			appURL = fmt.Sprintf("http://%s:%s", host, port)
		}
	}

	resendAPIKey := getEnv("RESEND_API_KEY", "")
	emailFrom := getEnv("EMAIL_FROM", "DevFlow <noreply@devflow.app>")

	smtpHost := getEnv("SMTP_HOST", "")
	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))
	if smtpPort <= 0 {
		smtpPort = 587
	}
	smtpUser := getEnv("SMTP_USER", "")
	smtpPassword := getEnv("SMTP_PASSWORD", "")
	smtpFrom := getEnv("SMTP_FROM", emailFrom)
	smtpInsecureSkipVerify := getEnv("SMTP_INSECURE_SKIP_VERIFY", "false") == "true"

	return &Config{
		Port:                   port,
		Host:                   host,
		AppURL:                 appURL,
		DataDir:                dataDir,
		DBPath:                 dbPath,
		JWTSecret:              jwtSecret,
		JWTExpiry:              time.Duration(jwtExpiryHours) * time.Hour,
		RateLimitRPS:           rateLimitRPS,
		RateLimitBurst:         rateLimitBurst,
		EnableRegistration:     enableReg,
		AppEnv:                 appEnv,
		ResendAPIKey:           resendAPIKey,
		EmailFrom:              emailFrom,
		SMTPHost:               smtpHost,
		SMTPPort:               smtpPort,
		SMTPUser:               smtpUser,
		SMTPPassword:           smtpPassword,
		SMTPFrom:               smtpFrom,
		SMTPInsecureSkipVerify: smtpInsecureSkipVerify,
	}, nil
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
