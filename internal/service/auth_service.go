package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"devflow/internal/domain"
	"devflow/internal/email"
	"devflow/internal/security"

	"github.com/google/uuid"
)

type AuthService struct {
	userRepo           domain.UserRepository
	jwtManager         *security.JWTManager
	totpManager        *security.TOTPManager
	mailer             email.Mailer
	appURL             string
	enableRegistration bool
}

func NewAuthService(
	userRepo domain.UserRepository,
	jwtManager *security.JWTManager,
	totpManager *security.TOTPManager,
	mailer email.Mailer,
	appURL string,
	enableRegistration bool,
) *AuthService {
	return &AuthService{
		userRepo:           userRepo,
		jwtManager:         jwtManager,
		totpManager:        totpManager,
		mailer:             mailer,
		appURL:             appURL,
		enableRegistration: enableRegistration,
	}
}

func (s *AuthService) Register(ctx context.Context, req domain.RegisterRequest) (*domain.AuthResponse, error) {
	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Username == "" || req.Email == "" || req.Password == "" {
		return nil, domain.ErrInvalidInput
	}

	// Check registration setting (if 0 users exist, always allow first admin user)
	count, err := s.userRepo.Count(ctx)
	if err != nil {
		return nil, err
	}
	if count > 0 && !s.enableRegistration {
		return nil, domain.ErrRegistrationDisabled
	}

	// Evaluate password strength
	strength := security.EvaluatePasswordStrength(req.Password)
	if !strength.IsValid {
		return nil, domain.ErrWeakPassword
	}

	// Check if username or email is already taken
	if _, err := s.userRepo.GetByUsername(ctx, req.Username); err == nil {
		return nil, domain.ErrAlreadyExists
	}
	if _, err := s.userRepo.GetByEmail(ctx, req.Email); err == nil {
		return nil, domain.ErrAlreadyExists
	}

	// Hash password with Argon2id
	hash, err := security.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := &domain.User{
		ID:           uuid.New().String(),
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hash,
		Is2FAEnabled: false,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	token, err := s.jwtManager.GenerateToken(user.ID, user.Username, user.Email, user.Is2FAEnabled)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
		User:  user.ToProfile(),
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, error) {
	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || req.Password == "" {
		return nil, domain.ErrInvalidCredentials
	}

	// Lookup by username or email
	var user *domain.User
	var err error
	if strings.Contains(req.Username, "@") {
		user, err = s.userRepo.GetByEmail(ctx, req.Username)
	} else {
		user, err = s.userRepo.GetByUsername(ctx, req.Username)
	}
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	// Verify password
	ok, err := security.VerifyPassword(req.Password, user.PasswordHash)
	if err != nil || !ok {
		return nil, domain.ErrInvalidCredentials
	}

	// If 2FA is enabled
	if user.Is2FAEnabled {
		if req.Code2FA == "" {
			// Issue temporary token for 2FA verification step
			tempToken, err := s.jwtManager.GenerateTempToken(user.ID, user.Username, user.Email)
			if err != nil {
				return nil, err
			}
			return &domain.AuthResponse{
				Requires2FA: true,
				TempToken:   tempToken,
			}, nil
		}

		// Verify provided 2FA code or backup code
		valid2FA := s.totpManager.ValidateCode(req.Code2FA, user.TwoFASecret)
		if !valid2FA {
			// Check if it's a valid backup code
			validBackup, updatedCodes, err := s.totpManager.ValidateAndConsumeBackupCode(req.Code2FA, user.BackupCodes)
			if err != nil || !validBackup {
				return nil, domain.ErrInvalid2FACode
			}
			// Update consumed backup codes
			_ = s.userRepo.Update2FA(ctx, user.ID, true, user.TwoFASecret, updatedCodes)
		}
	}

	token, err := s.jwtManager.GenerateToken(user.ID, user.Username, user.Email, user.Is2FAEnabled)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
		User:  user.ToProfile(),
	}, nil
}

func (s *AuthService) Verify2FATemp(ctx context.Context, tempToken, code string) (*domain.AuthResponse, error) {
	claims, err := s.jwtManager.ValidateToken(tempToken)
	if err != nil || !claims.IsTemp {
		return nil, domain.ErrUnauthorized
	}

	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, domain.ErrNotFound
	}

	valid2FA := s.totpManager.ValidateCode(code, user.TwoFASecret)
	if !valid2FA {
		validBackup, updatedCodes, err := s.totpManager.ValidateAndConsumeBackupCode(code, user.BackupCodes)
		if err != nil || !validBackup {
			return nil, domain.ErrInvalid2FACode
		}
		_ = s.userRepo.Update2FA(ctx, user.ID, true, user.TwoFASecret, updatedCodes)
	}

	token, err := s.jwtManager.GenerateToken(user.ID, user.Username, user.Email, user.Is2FAEnabled)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
		User:  user.ToProfile(),
	}, nil
}

func (s *AuthService) Setup2FA(ctx context.Context, userID string) (*domain.Setup2FAResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, domain.ErrNotFound
	}

	if user.Is2FAEnabled {
		return nil, domain.Err2FAAlreadyEnabled
	}

	secret, qrURI, err := s.totpManager.GenerateSecret(user.Username)
	if err != nil {
		return nil, err
	}

	return &domain.Setup2FAResponse{
		Secret: secret,
		QRCode: qrURI,
	}, nil
}

func (s *AuthService) ConfirmEnable2FA(ctx context.Context, userID, secret, code string) (*domain.AuthResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, domain.ErrNotFound
	}

	if !s.totpManager.ValidateCode(code, secret) {
		return nil, domain.ErrInvalid2FACode
	}

	backupCodes, backupJSON, err := s.totpManager.GenerateBackupCodes(8)
	if err != nil {
		return nil, err
	}

	if err := s.userRepo.Update2FA(ctx, userID, true, secret, backupJSON); err != nil {
		return nil, err
	}

	token, err := s.jwtManager.GenerateToken(user.ID, user.Username, user.Email, true)
	if err != nil {
		return nil, err
	}

	user.Is2FAEnabled = true

	return &domain.AuthResponse{
		Token:       token,
		User:        user.ToProfile(),
		BackupCodes: backupCodes,
	}, nil
}

func (s *AuthService) Disable2FA(ctx context.Context, userID, password string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return domain.ErrNotFound
	}

	ok, err := security.VerifyPassword(password, user.PasswordHash)
	if err != nil || !ok {
		return domain.ErrInvalidCredentials
	}

	return s.userRepo.Update2FA(ctx, userID, false, "", "")
}

func (s *AuthService) ChangePassword(ctx context.Context, userID string, req domain.ChangePasswordRequest) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return domain.ErrNotFound
	}

	ok, err := security.VerifyPassword(req.OldPassword, user.PasswordHash)
	if err != nil || !ok {
		return domain.ErrInvalidCredentials
	}

	strength := security.EvaluatePasswordStrength(req.NewPassword)
	if !strength.IsValid {
		return domain.ErrWeakPassword
	}

	hash, err := security.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	return s.userRepo.UpdatePassword(ctx, userID, hash)
}

// ForgotPassword initiates a secure password reset request via email.
// To prevent user enumeration attacks, this method always returns nil on success,
// even if the provided email does not belong to any registered user.
func (s *AuthService) ForgotPassword(ctx context.Context, emailAddress string) error {
	emailAddress = strings.TrimSpace(strings.ToLower(emailAddress))
	if emailAddress == "" {
		return domain.ErrInvalidInput
	}

	user, err := s.userRepo.GetByEmail(ctx, emailAddress)
	if err != nil {
		// User does not exist — silently succeed to prevent user enumeration
		return nil
	}

	// Generate 32 bytes (256 bits) of cryptographically secure random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return fmt.Errorf("failed to generate secure reset token: %w", err)
	}
	rawToken := hex.EncodeToString(tokenBytes)

	// Hash the token with SHA-256 for persistent database storage
	tokenHashBytes := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(tokenHashBytes[:])

	// Invalidate any previous reset tokens for this user
	_ = s.userRepo.DeleteUserResetTokens(ctx, user.ID)

	// Save reset token with 30 minutes expiration
	resetToken := &domain.PasswordResetToken{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(30 * time.Minute),
		CreatedAt: time.Now(),
	}

	if err := s.userRepo.CreateResetToken(ctx, resetToken); err != nil {
		return fmt.Errorf("failed to persist reset token: %w", err)
	}

	// Build the reset link URL
	resetLink := fmt.Sprintf("%s/?reset_token=%s", strings.TrimRight(s.appURL, "/"), rawToken)

	// Send email asynchronously so HTTP request doesn't block
	if s.mailer != nil {
		go func(toEmail, username, link string) {
			_ = s.mailer.SendPasswordResetEmail(toEmail, username, link)
		}(user.Email, user.Username, resetLink)
	}

	return nil
}

// ResetPassword validates the reset token and securely sets a new password.
func (s *AuthService) ResetPassword(ctx context.Context, req domain.ResetPasswordRequest) error {
	req.Token = strings.TrimSpace(req.Token)
	if req.Token == "" || req.NewPassword == "" {
		return domain.ErrInvalidInput
	}

	// Compute SHA-256 hash of provided token
	tokenHashBytes := sha256.Sum256([]byte(req.Token))
	tokenHash := hex.EncodeToString(tokenHashBytes[:])

	resetToken, err := s.userRepo.GetResetTokenByHash(ctx, tokenHash)
	if err != nil || resetToken == nil || resetToken.UsedAt != nil {
		return domain.ErrInvalidResetToken
	}

	if time.Now().After(resetToken.ExpiresAt) {
		return domain.ErrResetTokenExpired
	}

	// Validate new password strength
	strength := security.EvaluatePasswordStrength(req.NewPassword)
	if !strength.IsValid {
		return domain.ErrWeakPassword
	}

	// Hash new password with Argon2id
	hash, err := security.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	// Update user password in database
	if err := s.userRepo.UpdatePassword(ctx, resetToken.UserID, hash); err != nil {
		return err
	}

	// Invalidate token
	if err := s.userRepo.MarkResetTokenUsed(ctx, resetToken.ID); err != nil {
		return err
	}

	return nil
}

// AdminResetPassword immediately resets a user password without requiring email token (CLI fallback).
func (s *AuthService) AdminResetPassword(ctx context.Context, usernameOrEmail, newPassword string) error {
	usernameOrEmail = strings.TrimSpace(usernameOrEmail)
	if usernameOrEmail == "" || newPassword == "" {
		return domain.ErrInvalidInput
	}

	var user *domain.User
	var err error
	if strings.Contains(usernameOrEmail, "@") {
		user, err = s.userRepo.GetByEmail(ctx, usernameOrEmail)
	} else {
		user, err = s.userRepo.GetByUsername(ctx, usernameOrEmail)
	}
	if err != nil {
		return domain.ErrNotFound
	}

	strength := security.EvaluatePasswordStrength(newPassword)
	if !strength.IsValid {
		return domain.ErrWeakPassword
	}

	hash, err := security.HashPassword(newPassword)
	if err != nil {
		return err
	}

	return s.userRepo.UpdatePassword(ctx, user.ID, hash)
}

func (s *AuthService) GetProfile(ctx context.Context, userID string) (*domain.UserProfile, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	profile := user.ToProfile()
	return &profile, nil
}

func (s *AuthService) CheckPasswordStrength(password string) security.PasswordStrength {
	return security.EvaluatePasswordStrength(password)
}
