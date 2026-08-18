package sqlite

import (
	"context"
	"fmt"
)

const schema = `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_2fa_enabled INTEGER NOT NULL DEFAULT 0,
    two_fa_secret TEXT DEFAULT '',
    backup_codes TEXT DEFAULT '',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    language TEXT NOT NULL,
    variables TEXT DEFAULT '[]',
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS snippet_tags (
    snippet_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY(snippet_id, tag_id),
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_snippets_user_created ON snippets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_user_pinned ON snippets(user_id, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_user_type ON snippets(user_id, type);
CREATE INDEX IF NOT EXISTS idx_tags_user_name ON tags(user_id, name);

-- SQLite FTS5 Full-Text Search Virtual Table
CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
    snippet_id UNINDEXED,
    user_id UNINDEXED,
    title,
    content,
    tokenize = 'unicode61'
);

-- Triggers to synchronize FTS5 index automatically with snippets table
CREATE TRIGGER IF NOT EXISTS trg_snippets_ai AFTER INSERT ON snippets BEGIN
    INSERT INTO snippets_fts(snippet_id, user_id, title, content)
    VALUES (new.id, new.user_id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS trg_snippets_ad AFTER DELETE ON snippets BEGIN
    DELETE FROM snippets_fts WHERE snippet_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_snippets_au AFTER UPDATE ON snippets BEGIN
    DELETE FROM snippets_fts WHERE snippet_id = old.id;
    INSERT INTO snippets_fts(snippet_id, user_id, title, content)
    VALUES (new.id, new.user_id, new.title, new.content);
END;
`

func Migrate(ctx context.Context, db *DB) error {
	if _, err := db.ExecContext(ctx, schema); err != nil {
		return fmt.Errorf("failed to apply migrations: %w", err)
	}

	// Populate FTS5 index for any existing snippets that were created before FTS5 table
	populateFTS := `
	INSERT INTO snippets_fts(snippet_id, user_id, title, content)
	SELECT s.id, s.user_id, s.title, s.content
	FROM snippets s
	WHERE s.id NOT IN (SELECT snippet_id FROM snippets_fts);
	`
	_, _ = db.ExecContext(ctx, populateFTS)

	return nil
}
