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

	testSecretKey := []byte("01234567890123456789012345678901") // 32 bytes
	userRepo := NewUserRepository(db)
	snippetRepo := NewSnippetRepository(db, testSecretKey)

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

	// 2. Create Prompt Snippet
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

	// 3. Create Encrypted Secret Snippet
	secretPlaintext := "sk-ant-api03-super-secret-key-123456"
	secretSnippet := &domain.Snippet{
		ID:       "s2",
		UserID:   "u1",
		Title:    "Anthropic API Key",
		Content:  secretPlaintext,
		Type:     domain.SnippetTypeSecret,
		Language: "plaintext",
		Tags:     []string{"secret", "api"},
	}
	if err := snippetRepo.Create(ctx, secretSnippet); err != nil {
		t.Fatalf("Failed to create secret snippet: %v", err)
	}

	// Verify it is encrypted directly in the raw DB
	var rawContentInDB string
	err = db.QueryRowContext(ctx, "SELECT content FROM snippets WHERE id = 's2'").Scan(&rawContentInDB)
	if err != nil {
		t.Fatalf("Failed to query raw DB: %v", err)
	}
	if rawContentInDB == secretPlaintext {
		t.Fatalf("Expected secret to be encrypted in SQLite, but got raw plaintext!")
	}

	// Verify repo transparently decrypts it
	retrievedSecret, err := snippetRepo.GetByID(ctx, "s2", "u1")
	if err != nil {
		t.Fatalf("Failed to retrieve secret snippet: %v", err)
	}
	if retrievedSecret.Content != secretPlaintext {
		t.Fatalf("Expected decrypted %q, got %q", secretPlaintext, retrievedSecret.Content)
	}

	// 4. List snippets
	list, total, err := snippetRepo.List(ctx, domain.SnippetFilter{UserID: "u1"})
	if err != nil || total != 2 || len(list) != 2 {
		t.Fatalf("List error: total=%d, len=%d, err=%v", total, len(list), err)
	}

	// 5. Test Tags Query
	tags, err := snippetRepo.GetAllUserTags(ctx, "u1")
	if err != nil || len(tags) == 0 {
		t.Fatalf("Expected tags, got %v, err=%v", tags, err)
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
