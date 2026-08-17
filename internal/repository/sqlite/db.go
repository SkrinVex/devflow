package sqlite

import (
	"database/sql"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
}

// New creates and configures a SQLite connection pool with optimal PRAGMAs for performance & reliability.
func New(dbPath string) (*DB, error) {
	// Enable WAL mode, foreign keys, synchronous NORMAL for high performance and integrity
	dsn := fmt.Sprintf("file:%s?_pragma=journal_mode(WAL)&_pragma=foreign_keys(ON)&_pragma=busy_timeout(5000)&_pragma=synchronous(NORMAL)", dbPath)

	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// SQLite connection pooling: limit open connections to avoid lock contention
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(10 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping sqlite database: %w", err)
	}

	return &DB{db}, nil
}

// Checkpoint executes a WAL checkpoint with TRUNCATE mode, ensuring all transactions
// written to devflow.db-wal are flushed into devflow.db and the WAL file is truncated.
func (d *DB) Checkpoint() error {
	_, err := d.Exec("PRAGMA wal_checkpoint(TRUNCATE);")
	return err
}
