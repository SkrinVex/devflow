package security

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
)

type TOTPManager struct {
	issuer string
}

func NewTOTPManager(issuer string) *TOTPManager {
	if issuer == "" {
		issuer = "DevFlow"
	}
	return &TOTPManager{issuer: issuer}
}

// GenerateSecret generates a new TOTP secret key for a user with QR URL.
func (m *TOTPManager) GenerateSecret(accountName string) (secret string, qrURI string, err error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      m.issuer,
		AccountName: accountName,
		Period:      30,
		SecretSize:  20,
		Algorithm:   otp.AlgorithmSHA1,
		Digits:      otp.DigitsSix,
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to generate TOTP key: %w", err)
	}

	return key.Secret(), key.URL(), nil
}

// ValidateCode verifies a user-entered 6-digit TOTP code against their secret.
func (m *TOTPManager) ValidateCode(code, secret string) bool {
	code = strings.TrimSpace(code)
	if len(code) != 6 {
		return false
	}
	return totp.Validate(code, secret)
}

// GenerateBackupCodes generates 10 alphanumeric backup codes.
func (m *TOTPManager) GenerateBackupCodes(count int) ([]string, string, error) {
	if count <= 0 {
		count = 8
	}

	codes := make([]string, count)
	for i := 0; i < count; i++ {
		bytes := make([]byte, 4)
		if _, err := rand.Read(bytes); err != nil {
			return nil, "", err
		}
		raw := hex.EncodeToString(bytes) // 8 chars
		codes[i] = fmt.Sprintf("%s-%s", raw[:4], raw[4:])
	}

	jsonBytes, err := json.Marshal(codes)
	if err != nil {
		return nil, "", err
	}

	return codes, string(jsonBytes), nil
}

// ValidateAndConsumeBackupCode checks if the code is a valid backup code and removes it if found.
func (m *TOTPManager) ValidateAndConsumeBackupCode(inputCode string, backupCodesJSON string) (bool, string, error) {
	inputCode = strings.TrimSpace(strings.ToLower(inputCode))
	if inputCode == "" || backupCodesJSON == "" {
		return false, backupCodesJSON, nil
	}

	var codes []string
	if err := json.Unmarshal([]byte(backupCodesJSON), &codes); err != nil {
		return false, backupCodesJSON, errors.New("malformed backup codes store")
	}

	foundIdx := -1
	for i, code := range codes {
		normalized := strings.ToLower(strings.TrimSpace(code))
		if normalized == inputCode || strings.ReplaceAll(normalized, "-", "") == strings.ReplaceAll(inputCode, "-", "") {
			foundIdx = i
			break
		}
	}

	if foundIdx == -1 {
		return false, backupCodesJSON, nil
	}

	// Remove used code
	updatedCodes := append(codes[:foundIdx], codes[foundIdx+1:]...)
	updatedJSON, err := json.Marshal(updatedCodes)
	if err != nil {
		return true, backupCodesJSON, err
	}

	return true, string(updatedJSON), nil
}
