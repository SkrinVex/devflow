package sqlite

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"devflow/internal/domain"
)

func TestSQLiteRepo(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_devflow.db")

	db, err := New(dbPath)
	if err != nil {
		t.Fatalf("Failed to open DB: %v", err)
	}
	defer db.Close()
	defer os.Remove(dbPath)

	ctx := context.Background()
	if err := Migrate(ctx, db); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	userRepo := NewUserRepository(db)
	snippetRepo := NewSnippetRepository(db)

	// 1. Create User
	user := &domain.User{
		ID:           "u1",
		Username:     "lexa",
		Email:        "lexa@devflow.local",
		PasswordHash: "hash123",
		Is2FAEnabled: false,
	}
	if err := userRepo.Create(ctx, user); err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	foundUser, err := userRepo.GetByID(ctx, "u1")
	if err != nil || foundUser.Username != "lexa" {
		t.Fatalf("Failed to get user by id: %v", err)
	}

	// 2. Create Snippet
	snippet := &domain.Snippet{
		ID:         "s1",
		UserID:     "u1",
		Title:      "Test Prompt",
		Content:    "Act as {{role}} and write {{code}}",
		Type:       domain.SnippetTypePrompt,
		Language:   "prompt",
		Tags:       []string{"prompt", "ai", "generator"},
		Variables:  []string{"role", "code"},
		IsPinned:   true,
		IsFavorite: true,
	}
	if err := snippetRepo.Create(ctx, snippet); err != nil {
		t.Fatalf("Failed to create snippet: %v", err)
	}

	// 3. List snippets
	list, total, err := snippetRepo.List(ctx, domain.SnippetFilter{UserID: "u1"})
	if err != nil || total != 1 || len(list) != 1 {
		t.Fatalf("List error: total=%d, len=%d, err=%v", total, len(list), err)
	}

	if len(list[0].Tags) != 3 {
		t.Errorf("Expected 3 tags, got %v", list[0].Tags)
	}

	// 4. Test Tags Query
	tags, err := snippetRepo.GetAllUserTags(ctx, "u1")
	if err != nil || len(tags) != 3 {
		t.Fatalf("Expected 3 tag counts, got %v", tags)
	}

	// 5. Update Snippet
	newTitle := "Updated Prompt Title"
	snippet.Title = newTitle
	if err := snippetRepo.Update(ctx, snippet); err != nil {
		t.Fatalf("Failed to update snippet: %v", err)
	}

	updated, err := snippetRepo.GetByID(ctx, "s1", "u1")
	if err != nil || updated.Title != newTitle {
		t.Fatalf("Update check failed: %v", err)
	}

	// 6. Delete Snippet
	if err := snippetRepo.Delete(ctx, "s1", "u1"); err != nil {
		t.Fatalf("Failed to delete snippet: %v", err)
	}

	_, err = snippetRepo.GetByID(ctx, "s1", "u1")
	if err != domain.ErrNotFound {
		t.Fatalf("Expected ErrNotFound, got %v", err)
	}
}
