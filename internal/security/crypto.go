package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"strings"
)

const (
	EncPrefix = "enc:v1:"
)

// EncryptAESGCM encrypts plaintext using AES-256-GCM with the provided 32-byte key.
// Returns a prefixed format: enc:v1:<nonce_hex>:<ciphertext_hex>
func EncryptAESGCM(plaintext string, key []byte) (string, error) {
	if len(key) < 32 {
		return "", errors.New("encryption key must be at least 32 bytes")
	}

	block, err := aes.NewCipher(key[:32])
	if err != nil {
		return "", fmt.Errorf("failed to create cipher block: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	ciphertext := gcm.Seal(nil, nonce, []byte(plaintext), nil)

	return fmt.Sprintf("%s%s:%s", EncPrefix, hex.EncodeToString(nonce), hex.EncodeToString(ciphertext)), nil
}

// DecryptAESGCM decrypts ciphertext that was encrypted with EncryptAESGCM.
// If the text does not have the enc:v1: prefix, it returns the original text untouched (backwards compatibility).
func DecryptAESGCM(encoded string, key []byte) (string, error) {
	if !strings.HasPrefix(encoded, EncPrefix) {
		return encoded, nil
	}

	if len(key) < 32 {
		return "", errors.New("decryption key must be at least 32 bytes")
	}

	payload := strings.TrimPrefix(encoded, EncPrefix)
	parts := strings.SplitN(payload, ":", 2)
	if len(parts) != 2 {
		return "", errors.New("invalid encrypted payload format")
	}

	nonce, err := hex.DecodeString(parts[0])
	if err != nil {
		return "", fmt.Errorf("invalid nonce hex: %w", err)
	}

	ciphertext, err := hex.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("invalid ciphertext hex: %w", err)
	}

	block, err := aes.NewCipher(key[:32])
	if err != nil {
		return "", fmt.Errorf("failed to create cipher block: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt ciphertext (integrity check failed): %w", err)
	}

	return string(plaintext), nil
}
