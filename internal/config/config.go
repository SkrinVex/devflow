package config

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

type Config struct {
	Port               string
	Host               string
	DataDir            string
	DBPath             string
	JWTSecret          []byte
	JWTExpiry          time.Duration
	RateLimitRPS       float64
	RateLimitBurst     int
	EnableRegistration bool
	AppEnv             string
}

func Load() (*Config, error) {
	port := getEnv("PORT", "1451")
	host := getEnv("HOST", "0.0.0.0")
	dataDir := getEnv("DATA_DIR", "./data")
	appEnv := getEnv("APP_ENV", "production")

	// Ensure data directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data dir %s: %w", dataDir, err)
	}

	dbPath := filepath.Join(dataDir, "devflow.db")

	jwtSecretStr := os.Getenv("JWT_SECRET")
	var jwtSecret []byte
	if jwtSecretStr != "" {
		jwtSecret = []byte(jwtSecretStr)
	} else {
		// Generate or read persistent secret file if not provided
		secretFile := filepath.Join(dataDir, ".jwt_secret")
		secretBytes, err := os.ReadFile(secretFile)
		if err == nil && len(secretBytes) >= 32 {
			jwtSecret = secretBytes
		} else {
			randomKey := make([]byte, 32)
			if _, err := rand.Read(randomKey); err != nil {
				return nil, fmt.Errorf("failed to generate random JWT secret: %w", err)
			}
			hexSecret := hex.EncodeToString(randomKey)
			_ = os.WriteFile(secretFile, []byte(hexSecret), 0600)
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

	return &Config{
		Port:               port,
		Host:               host,
		DataDir:            dataDir,
		DBPath:             dbPath,
		JWTSecret:          jwtSecret,
		JWTExpiry:          time.Duration(jwtExpiryHours) * time.Hour,
		RateLimitRPS:       rateLimitRPS,
		RateLimitBurst:     rateLimitBurst,
		EnableRegistration: enableReg,
		AppEnv:             appEnv,
	}, nil
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
