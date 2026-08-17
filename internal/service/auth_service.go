package service

import (
	"context"
	"strings"

	"devflow/internal/domain"
	"devflow/internal/security"

	"github.com/google/uuid"
)

type AuthService struct {
	userRepo           domain.UserRepository
	jwtManager         *security.JWTManager
	totpManager        *security.TOTPManager
	enableRegistration bool
}

func NewAuthService(
	userRepo domain.UserRepository,
	jwtManager *security.JWTManager,
	totpManager *security.TOTPManager,
	enableRegistration bool,
) *AuthService {
	return &AuthService{
		userRepo:           userRepo,
		jwtManager:         jwtManager,
		totpManager:        totpManager,
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
