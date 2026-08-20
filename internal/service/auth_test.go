package service

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"devflow/internal/domain"
	"devflow/internal/repository/sqlite"
	"devflow/internal/security"
)

type MockMailer struct {
	lastToEmail string
	lastLink    string
}

func (m *MockMailer) SendPasswordResetEmail(toEmail, username, resetLink string) error {
	m.lastToEmail = toEmail
	m.lastLink = resetLink
	return nil
}

func (m *MockMailer) IsConfigured() bool {
	return true
}

func TestForgotPasswordAndReset(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_auth.db")

	db, err := sqlite.New(dbPath)
	if err != nil {
		t.Fatalf("Failed to open DB: %v", err)
	}
	defer db.Close()
	defer os.Remove(dbPath)

	ctx := context.Background()
	if err := sqlite.Migrate(ctx, db); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	userRepo := sqlite.NewUserRepository(db)
	jwtManager := security.NewJWTManager([]byte("12345678901234567890123456789012"), 24*time.Hour)
	totpManager := security.NewTOTPManager("DevFlow")
	mockMailer := &MockMailer{}
	authService := NewAuthService(userRepo, jwtManager, totpManager, mockMailer, "http://localhost:1451", true)

	// 1. Register a user
	regResp, err := authService.Register(ctx, domain.RegisterRequest{
		Username: "lexa",
		Email:    "lexa@devflow.local",
		Password: "ValidPassword123!",
	})
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
	if regResp.User.Username != "lexa" {
		t.Fatalf("Expected username lexa, got %s", regResp.User.Username)
	}

	// 2. Request forgot password
	if err := authService.ForgotPassword(ctx, "lexa@devflow.local"); err != nil {
		t.Fatalf("ForgotPassword error: %v", err)
	}

	// Wait briefly for goroutine if async
	time.Sleep(50 * time.Millisecond)

	if mockMailer.lastToEmail != "lexa@devflow.local" {
		t.Fatalf("Expected email to lexa@devflow.local, got %s", mockMailer.lastToEmail)
	}

	// 3. Extract reset token from mock link
	link := mockMailer.lastLink
	const prefix = "http://localhost:1451/?reset_token="
	if len(link) <= len(prefix) {
		t.Fatalf("Expected valid reset link format, got %s", link)
	}
	rawToken := link[len(prefix):]

	// 4. Try resetting password with invalid token
	err = authService.ResetPassword(ctx, domain.ResetPasswordRequest{
		Token:       "invalid_token_12345",
		NewPassword: "BrandNewPassword123!",
	})
	if err != domain.ErrInvalidResetToken {
		t.Fatalf("Expected ErrInvalidResetToken, got %v", err)
	}

	// 5. Reset password with correct token
	err = authService.ResetPassword(ctx, domain.ResetPasswordRequest{
		Token:       rawToken,
		NewPassword: "BrandNewPassword123!",
	})
	if err != nil {
		t.Fatalf("Failed to reset password: %v", err)
	}

	// 6. Verify old password fails and new password succeeds
	_, err = authService.Login(ctx, domain.LoginRequest{
		Username: "lexa",
		Password: "ValidPassword123!",
	})
	if err != domain.ErrInvalidCredentials {
		t.Fatalf("Expected old password to fail with ErrInvalidCredentials, got %v", err)
	}

	loginResp, err := authService.Login(ctx, domain.LoginRequest{
		Username: "lexa",
		Password: "BrandNewPassword123!",
	})
	if err != nil {
		t.Fatalf("Expected login with new password to succeed, got %v", err)
	}
	if loginResp.Token == "" {
		t.Fatalf("Expected token on successful login")
	}

	// 7. Try using the same token again (should fail because token is used)
	err = authService.ResetPassword(ctx, domain.ResetPasswordRequest{
		Token:       rawToken,
		NewPassword: "AnotherPassword123!",
	})
	if err != domain.ErrInvalidResetToken {
		t.Fatalf("Expected used token to fail with ErrInvalidResetToken, got %v", err)
	}

	// 8. Test Admin CLI Reset
	err = authService.AdminResetPassword(ctx, "lexa", "AdminOverridePass123!")
	if err != nil {
		t.Fatalf("AdminResetPassword failed: %v", err)
	}

	_, err = authService.Login(ctx, domain.LoginRequest{
		Username: "lexa",
		Password: "AdminOverridePass123!",
	})
	if err != nil {
		t.Fatalf("Expected login with admin override password to succeed, got %v", err)
	}
}
