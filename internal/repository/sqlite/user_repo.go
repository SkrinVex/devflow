package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"devflow/internal/domain"
)

type UserRepository struct {
	db *DB
}

func NewUserRepository(db *DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, u *domain.User) error {
	query := `
		INSERT INTO users (id, username, email, password_hash, is_2fa_enabled, two_fa_secret, backup_codes, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	now := time.Now()
	u.CreatedAt = now
	u.UpdatedAt = now

	is2FA := 0
	if u.Is2FAEnabled {
		is2FA = 1
	}

	_, err := r.db.ExecContext(ctx, query,
		u.ID,
		u.Username,
		u.Email,
		u.PasswordHash,
		is2FA,
		u.TwoFASecret,
		u.BackupCodes,
		u.CreatedAt,
		u.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	query := `
		SELECT id, username, email, password_hash, is_2fa_enabled, two_fa_secret, backup_codes, created_at, updated_at
		FROM users
		WHERE id = ?
	`
	var u domain.User
	var is2FA int
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&u.ID,
		&u.Username,
		&u.Email,
		&u.PasswordHash,
		&is2FA,
		&u.TwoFASecret,
		&u.BackupCodes,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	u.Is2FAEnabled = is2FA == 1
	return &u, nil
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `
		SELECT id, username, email, password_hash, is_2fa_enabled, two_fa_secret, backup_codes, created_at, updated_at
		FROM users
		WHERE LOWER(username) = LOWER(?)
	`
	var u domain.User
	var is2FA int
	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&u.ID,
		&u.Username,
		&u.Email,
		&u.PasswordHash,
		&is2FA,
		&u.TwoFASecret,
		&u.BackupCodes,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	u.Is2FAEnabled = is2FA == 1
	return &u, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, username, email, password_hash, is_2fa_enabled, two_fa_secret, backup_codes, created_at, updated_at
		FROM users
		WHERE LOWER(email) = LOWER(?)
	`
	var u domain.User
	var is2FA int
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&u.ID,
		&u.Username,
		&u.Email,
		&u.PasswordHash,
		&is2FA,
		&u.TwoFASecret,
		&u.BackupCodes,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	u.Is2FAEnabled = is2FA == 1
	return &u, nil
}

func (r *UserRepository) Update(ctx context.Context, u *domain.User) error {
	query := `
		UPDATE users
		SET username = ?, email = ?, updated_at = ?
		WHERE id = ?
	`
	u.UpdatedAt = time.Now()
	_, err := r.db.ExecContext(ctx, query, u.Username, u.Email, u.UpdatedAt, u.ID)
	return err
}

func (r *UserRepository) UpdatePassword(ctx context.Context, userID, newPasswordHash string) error {
	query := `
		UPDATE users
		SET password_hash = ?, updated_at = ?
		WHERE id = ?
	`
	_, err := r.db.ExecContext(ctx, query, newPasswordHash, time.Now(), userID)
	return err
}

func (r *UserRepository) Update2FA(ctx context.Context, userID string, enabled bool, secret string, backupCodes string) error {
	query := `
		UPDATE users
		SET is_2fa_enabled = ?, two_fa_secret = ?, backup_codes = ?, updated_at = ?
		WHERE id = ?
	`
	is2FA := 0
	if enabled {
		is2FA = 1
	}
	_, err := r.db.ExecContext(ctx, query, is2FA, secret, backupCodes, time.Now(), userID)
	return err
}

func (r *UserRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&count)
	return count, err
}
