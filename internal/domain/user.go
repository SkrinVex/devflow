package domain

import (
	"time"
)

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Is2FAEnabled bool      `json:"is_2fa_enabled"`
	TwoFASecret  string    `json:"-"`
	BackupCodes  string    `json:"-"` // JSON array of hashed/encrypted backup codes
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type UserProfile struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	Is2FAEnabled bool      `json:"is_2fa_enabled"`
	CreatedAt    time.Time `json:"created_at"`
}

func (u *User) ToProfile() UserProfile {
	return UserProfile{
		ID:           u.ID,
		Username:     u.Username,
		Email:        u.Email,
		Is2FAEnabled: u.Is2FAEnabled,
		CreatedAt:    u.CreatedAt,
	}
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Code2FA  string `json:"code_2fa,omitempty"`
}

type AuthResponse struct {
	Token        string      `json:"token,omitempty"`
	User         UserProfile `json:"user,omitempty"`
	Requires2FA  bool        `json:"requires_2fa,omitempty"`
	TempToken    string      `json:"temp_token,omitempty"`
	BackupCodes  []string    `json:"backup_codes,omitempty"`
}

type Setup2FAResponse struct {
	Secret string `json:"secret"`
	QRCode string `json:"qr_code"` // otpauth:// URL or base64 QR
}

type Verify2FARequest struct {
	Code   string `json:"code"`
	Secret string `json:"secret,omitempty"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}
