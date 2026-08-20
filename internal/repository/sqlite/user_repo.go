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

func (r *UserRepository) CreateResetToken(ctx context.Context, token *domain.PasswordResetToken) error {
	query := `
		INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at, used_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query,
		token.ID,
		token.UserID,
		token.TokenHash,
		token.ExpiresAt,
		token.CreatedAt,
		token.UsedAt,
	)
	return err
}

func (r *UserRepository) GetResetTokenByHash(ctx context.Context, tokenHash string) (*domain.PasswordResetToken, error) {
	query := `
		SELECT id, user_id, token_hash, expires_at, created_at, used_at
		FROM password_reset_tokens
		WHERE token_hash = ?
	`
	var t domain.PasswordResetToken
	var usedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, tokenHash).Scan(
		&t.ID,
		&t.UserID,
		&t.TokenHash,
		&t.ExpiresAt,
		&t.CreatedAt,
		&usedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	if usedAt.Valid {
		t.UsedAt = &usedAt.Time
	}
	return &t, nil
}

func (r *UserRepository) MarkResetTokenUsed(ctx context.Context, id string) error {
	query := `
		UPDATE password_reset_tokens
		SET used_at = ?
		WHERE id = ?
	`
	_, err := r.db.ExecContext(ctx, query, time.Now(), id)
	return err
}

func (r *UserRepository) DeleteUserResetTokens(ctx context.Context, userID string) error {
	query := `
		DELETE FROM password_reset_tokens
		WHERE user_id = ?
	`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}

