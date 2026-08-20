package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"devflow/internal/domain"
	"devflow/internal/security"
	"devflow/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req domain.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	resp, err := h.authService.Register(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrWeakPassword):
			RespondError(w, http.StatusBadRequest, "Password is too weak", err)
		case errors.Is(err, domain.ErrAlreadyExists):
			RespondError(w, http.StatusConflict, "Username or email already in use", err)
		case errors.Is(err, domain.ErrRegistrationDisabled):
			RespondError(w, http.StatusForbidden, "Registration is disabled", err)
		case errors.Is(err, domain.ErrInvalidInput):
			RespondError(w, http.StatusBadRequest, "Invalid username, email, or password", err)
		default:
			RespondError(w, http.StatusInternalServerError, "Failed to register user", err)
		}
		return
	}

	h.setAuthCookie(w, resp.Token)
	RespondSuccess(w, http.StatusCreated, "User registered successfully", resp)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	resp, err := h.authService.Login(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrInvalidCredentials):
			RespondError(w, http.StatusUnauthorized, "Invalid credentials", err)
		case errors.Is(err, domain.ErrInvalid2FACode):
			RespondError(w, http.StatusUnauthorized, "Invalid 2FA code", err)
		default:
			RespondError(w, http.StatusInternalServerError, "Login failed", err)
		}
		return
	}

	if resp.Token != "" {
		h.setAuthCookie(w, resp.Token)
	}

	RespondSuccess(w, http.StatusOK, "Login successful", resp)
}

func (h *AuthHandler) Verify2FATemp(w http.ResponseWriter, r *http.Request) {
	var body struct {
		TempToken string `json:"temp_token"`
		Code      string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	resp, err := h.authService.Verify2FATemp(r.Context(), body.TempToken, body.Code)
	if err != nil {
		RespondError(w, http.StatusUnauthorized, "Invalid 2FA code or expired token", err)
		return
	}

	h.setAuthCookie(w, resp.Token)
	RespondSuccess(w, http.StatusOK, "2FA verified", resp)
}

func (h *AuthHandler) CheckPasswordStrength(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	strength := h.authService.CheckPasswordStrength(body.Password)
	RespondJSON(w, http.StatusOK, strength)
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	profile, err := h.authService.GetProfile(r.Context(), claims.UserID)
	if err != nil {
		RespondError(w, http.StatusNotFound, "User not found", err)
		return
	}

	RespondJSON(w, http.StatusOK, profile)
}

func (h *AuthHandler) Setup2FA(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	resp, err := h.authService.Setup2FA(r.Context(), claims.UserID)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Failed to setup 2FA", err)
		return
	}

	RespondJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) Confirm2FA(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	var req domain.Verify2FARequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	resp, err := h.authService.ConfirmEnable2FA(r.Context(), claims.UserID, req.Secret, req.Code)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid 2FA code", err)
		return
	}

	h.setAuthCookie(w, resp.Token)
	RespondSuccess(w, http.StatusOK, "2FA successfully enabled", resp)
}

func (h *AuthHandler) Disable2FA(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.authService.Disable2FA(r.Context(), claims.UserID, body.Password); err != nil {
		RespondError(w, http.StatusBadRequest, "Failed to disable 2FA (check password)", err)
		return
	}

	RespondSuccess(w, http.StatusOK, "2FA disabled", nil)
}

func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	var req domain.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.authService.ChangePassword(r.Context(), claims.UserID, req); err != nil {
		RespondError(w, http.StatusBadRequest, "Failed to change password", err)
		return
	}

	RespondSuccess(w, http.StatusOK, "Password changed successfully", nil)
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req domain.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.authService.ForgotPassword(r.Context(), req.Email); err != nil {
		if errors.Is(err, domain.ErrInvalidInput) {
			RespondError(w, http.StatusBadRequest, "Invalid email address", err)
			return
		}
		RespondError(w, http.StatusInternalServerError, "Failed to process forgot password request", err)
		return
	}

	// Always return generic success message to prevent user enumeration
	RespondSuccess(w, http.StatusOK, "If an account with this email exists, a password reset link has been sent.", nil)
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req domain.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.authService.ResetPassword(r.Context(), req); err != nil {
		switch {
		case errors.Is(err, domain.ErrInvalidResetToken):
			RespondError(w, http.StatusBadRequest, "Invalid or expired password reset link", err)
		case errors.Is(err, domain.ErrResetTokenExpired):
			RespondError(w, http.StatusBadRequest, "Password reset link has expired", err)
		case errors.Is(err, domain.ErrWeakPassword):
			RespondError(w, http.StatusBadRequest, "Password is too weak", err)
		case errors.Is(err, domain.ErrInvalidInput):
			RespondError(w, http.StatusBadRequest, "Missing token or password", err)
		default:
			RespondError(w, http.StatusInternalServerError, "Failed to reset password", err)
		}
		return
	}

	RespondSuccess(w, http.StatusOK, "Password reset successfully. You can now sign in with your new password.", nil)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "devflow_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	RespondSuccess(w, http.StatusOK, "Logged out", nil)
}

func (h *AuthHandler) setAuthCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "devflow_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(72 * time.Hour),
		MaxAge:   72 * 3600,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

