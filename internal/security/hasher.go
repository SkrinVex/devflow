package security

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"math"
	"strings"
	"unicode"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/bcrypt"
)

type PasswordStrength struct {
	Score        int      `json:"score"`         // 0 to 4 (0=Very Weak, 1=Weak, 2=Fair, 3=Good, 4=Strong)
	Entropy      float64  `json:"entropy"`       // Estimated entropy bits
	IsValid      bool     `json:"is_valid"`      // True if meets min criteria for registration
	Requirements []string `json:"requirements"`  // Unmet requirements messages
}

const (
	argonMemory      = 64 * 1024 // 64 MB
	argonIterations  = 3
	argonParallelism = 2
	argonSaltLength  = 16
	argonKeyLength   = 32
)

// HashPassword hashes a password using Argon2id.
func HashPassword(password string) (string, error) {
	salt := make([]byte, argonSaltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), salt, argonIterations, argonMemory, argonParallelism, argonKeyLength)

	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	encoded := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, argonMemory, argonIterations, argonParallelism, b64Salt, b64Hash)

	return encoded, nil
}

// VerifyPassword verifies a password against an Argon2id or bcrypt hash.
func VerifyPassword(password, encodedHash string) (bool, error) {
	if strings.HasPrefix(encodedHash, "$argon2id$") {
		parts := strings.Split(encodedHash, "$")
		if len(parts) != 6 {
			return false, errors.New("invalid argon2id hash format")
		}

		var version int
		var memory uint32
		var iterations uint32
		var parallelism uint8

		_, err := fmt.Sscanf(parts[2], "v=%d", &version)
		if err != nil {
			return false, err
		}
		_, err = fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism)
		if err != nil {
			return false, err
		}

		salt, err := base64.RawStdEncoding.DecodeString(parts[4])
		if err != nil {
			return false, err
		}

		hash, err := base64.RawStdEncoding.DecodeString(parts[5])
		if err != nil {
			return false, err
		}

		comparisonHash := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, uint32(len(hash)))

		if subtle.ConstantTimeCompare(hash, comparisonHash) == 1 {
			return true, nil
		}
		return false, nil
	}

	// Fallback to bcrypt
	err := bcrypt.CompareHashAndPassword([]byte(encodedHash), []byte(password))
	if err == nil {
		return true, nil
	}
	return false, nil
}

// EvaluatePasswordStrength checks security criteria and entropy.
func EvaluatePasswordStrength(password string) PasswordStrength {
	var (
		hasLower   bool
		hasUpper   bool
		hasNumber  bool
		hasSpecial bool
		unmet      []string
	)

	length := len(password)
	for _, char := range password {
		switch {
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsDigit(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char) || char == ' ':
			hasSpecial = true
		}
	}

	if length < 8 {
		unmet = append(unmet, "Password must be at least 8 characters long")
	}
	if !hasLower {
		unmet = append(unmet, "Must include at least one lowercase letter")
	}
	if !hasUpper {
		unmet = append(unmet, "Must include at least one uppercase letter")
	}
	if !hasNumber {
		unmet = append(unmet, "Must include at least one number")
	}

	// Calculate entropy
	poolSize := 0
	if hasLower {
		poolSize += 26
	}
	if hasUpper {
		poolSize += 26
	}
	if hasNumber {
		poolSize += 10
	}
	if hasSpecial {
		poolSize += 32
	}
	if poolSize == 0 {
		poolSize = 1
	}

	entropy := float64(length) * (math.Log2(float64(poolSize)))

	score := 0
	switch {
	case entropy >= 60 && length >= 12 && hasLower && hasUpper && hasNumber && hasSpecial:
		score = 4 // Strong
	case entropy >= 45 && length >= 10 && (hasLower && hasUpper && (hasNumber || hasSpecial)):
		score = 3 // Good
	case entropy >= 30 && length >= 8:
		score = 2 // Fair
	case length >= 6:
		score = 1 // Weak
	default:
		score = 0 // Very Weak
	}

	isValid := length >= 8 && hasLower && hasUpper && hasNumber

	return PasswordStrength{
		Score:        score,
		Entropy:      math.Round(entropy*10) / 10,
		IsValid:      isValid,
		Requirements: unmet,
	}
}
