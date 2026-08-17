package domain

import "errors"

var (
	ErrNotFound            = errors.New("resource not found")
	ErrAlreadyExists       = errors.New("resource already exists")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrInvalidCredentials  = errors.New("invalid username or password")
	ErrInvalidInput        = errors.New("invalid input data")
	ErrWeakPassword        = errors.New("password does not meet security requirements")
	ErrTwoFactorRequired   = errors.New("two-factor authentication code required")
	ErrInvalid2FACode      = errors.New("invalid two-factor authentication code")
	Err2FAAlreadyEnabled   = errors.New("two-factor authentication is already enabled")
	ErrRegistrationDisabled = errors.New("registration is disabled on this instance")
	ErrInternal            = errors.New("internal server error")
)
