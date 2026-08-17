package security

import (
	"testing"
	"time"

	"devflow/internal/domain"
)

func TestPasswordHashingAndVerification(t *testing.T) {
	password := "SuperSecret!Pass123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	valid, err := VerifyPassword(password, hash)
	if err != nil || !valid {
		t.Fatalf("Password verification failed for valid password")
	}

	invalid, _ := VerifyPassword("WrongPassword123", hash)
	if invalid {
		t.Fatalf("Password verification succeeded for invalid password")
	}
}

func TestPasswordStrengthEvaluator(t *testing.T) {
	weak := EvaluatePasswordStrength("12345")
	if weak.IsValid || weak.Score > 1 {
		t.Errorf("Expected weak score for '12345', got %d (valid: %v)", weak.Score, weak.IsValid)
	}

	strong := EvaluatePasswordStrength("Complex#P@ssw0rd2026!")
	if !strong.IsValid || strong.Score < 3 {
		t.Errorf("Expected strong score, got %d (valid: %v)", strong.Score, strong.IsValid)
	}
}

func TestJWTManager(t *testing.T) {
	secret := []byte("test-secret-key-1234567890123456")
	mgr := NewJWTManager(secret, 1*time.Hour)

	token, err := mgr.GenerateToken("user-1", "lexa", "lexa@example.com", true)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	claims, err := mgr.ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	if claims.UserID != "user-1" || claims.Username != "lexa" || !claims.Is2FAVerified {
		t.Errorf("Claims mismatch: %+v", claims)
	}
}

func TestTOTPManager(t *testing.T) {
	mgr := NewTOTPManager("DevFlowTest")
	secret, qrURI, err := mgr.GenerateSecret("testuser")
	if err != nil {
		t.Fatalf("Failed to generate secret: %v", err)
	}

	if secret == "" || qrURI == "" {
		t.Errorf("Expected secret and QR URI, got empty")
	}

	// Backup codes
	codes, jsonStr, err := mgr.GenerateBackupCodes(5)
	if err != nil {
		t.Fatalf("Failed to generate backup codes: %v", err)
	}
	if len(codes) != 5 {
		t.Fatalf("Expected 5 codes, got %d", len(codes))
	}

	// Validate backup code
	valid, updatedJSON, err := mgr.ValidateAndConsumeBackupCode(codes[0], jsonStr)
	if err != nil || !valid {
		t.Fatalf("Expected valid backup code consumption")
	}

	// Check it cannot be used again
	reused, _, _ := mgr.ValidateAndConsumeBackupCode(codes[0], updatedJSON)
	if reused {
		t.Fatalf("Consumed backup code was allowed again")
	}
}

func TestContentDetector(t *testing.T) {
	detector := NewContentDetector()

	// 1. Detect Prompt with variables
	promptText := "You are an expert in {{tech}}. Write a production {{language}} script for {{task}} #prompt #ai"
	resPrompt := detector.Detect(promptText)
	if resPrompt.DetectedType != domain.SnippetTypePrompt {
		t.Errorf("Expected type 'prompt', got '%s'", resPrompt.DetectedType)
	}
	if len(resPrompt.ExtractedVars) != 3 {
		t.Errorf("Expected 3 extracted vars, got %v", resPrompt.ExtractedVars)
	}

	// 2. Detect Go Code
	goCode := `
package main

import "fmt"

func main() {
    fmt.Println("Hello world")
}
`
	resGo := detector.Detect(goCode)
	if resGo.DetectedType != domain.SnippetTypeCode || resGo.DetectedLanguage != "go" {
		t.Errorf("Expected Go code, got type: %s, lang: %s", resGo.DetectedType, resGo.DetectedLanguage)
	}

	// 3. Detect Secret (API Key)
	secretText := "sk-abcdef1234567890abcdef1234567890"
	resSecret := detector.Detect(secretText)
	if resSecret.DetectedType != domain.SnippetTypeSecret {
		t.Errorf("Expected Secret type, got %s", resSecret.DetectedType)
	}

	// 4. Detect SQL
	sqlCode := "SELECT id, name, email FROM users WHERE is_active = 1 ORDER BY created_at DESC;"
	resSQL := detector.Detect(sqlCode)
	if resSQL.DetectedType != domain.SnippetTypeCode || resSQL.DetectedLanguage != "sql" {
		t.Errorf("Expected SQL code, got type: %s, lang: %s", resSQL.DetectedType, resSQL.DetectedLanguage)
	}
}
