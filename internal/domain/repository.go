package domain

import (
	"context"
)

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id string) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	Update(ctx context.Context, user *User) error
	UpdatePassword(ctx context.Context, userID, newPasswordHash string) error
	Update2FA(ctx context.Context, userID string, enabled bool, secret string, backupCodes string) error
	Count(ctx context.Context) (int64, error)
}

type SnippetRepository interface {
	Create(ctx context.Context, snippet *Snippet) error
	GetByID(ctx context.Context, id, userID string) (*Snippet, error)
	Update(ctx context.Context, snippet *Snippet) error
	Delete(ctx context.Context, id, userID string) error
	List(ctx context.Context, filter SnippetFilter) ([]Snippet, int64, error)
	GetAllUserTags(ctx context.Context, userID string) ([]TagCount, error)
	GetAllForExport(ctx context.Context, userID string) ([]Snippet, error)
	ImportBatch(ctx context.Context, userID string, snippets []Snippet) (int, error)
}

type TagCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}
