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

// New creates and configures a SQLite connection pool with production-grade PRAGMAs for high concurrency & reliability.
func New(dbPath string) (*DB, error) {
	// Enterprise SQLite PRAGMA configuration:
	// - journal_mode(WAL): Concurrent readers while writing without blocking
	// - busy_timeout(10000): Wait up to 10 seconds for locks instead of failing with SQLITE_BUSY
	// - synchronous(NORMAL): 2x-5x faster write throughput in WAL mode while maintaining full durability
	// - foreign_keys(ON): Enforces relational integrity on deletes/updates
	// - cache_size(-20000): 20MB in-memory page cache
	// - temp_store(MEMORY): Temporary tables and indexes stored in RAM
	// - mmap_size(268435456): 256MB memory-mapped I/O for instantaneous zero-copy reads
	dsn := fmt.Sprintf(
		"file:%s?_pragma=journal_mode(WAL)&_pragma=busy_timeout(10000)&_pragma=synchronous(NORMAL)&_pragma=foreign_keys(ON)&_pragma=cache_size(-20000)&_pragma=temp_store(MEMORY)&_pragma=mmap_size(268435456)",
		dbPath,
	)

	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// SQLite connection pooling:
	// WAL mode supports unlimited concurrent readers.
	// We set MaxOpenConns to 25 and MaxIdleConns to 10 for low latency under high concurrent load.
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(10 * time.Minute)

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
