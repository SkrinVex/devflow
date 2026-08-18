package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"devflow/internal/domain"
	"devflow/internal/security"

	"github.com/google/uuid"
)

type SnippetRepository struct {
	db        *DB
	secretKey []byte
}

func NewSnippetRepository(db *DB, secretKey []byte) *SnippetRepository {
	return &SnippetRepository{
		db:        db,
		secretKey: secretKey,
	}
}

func (r *SnippetRepository) encryptIfSecret(content string, sType domain.SnippetType) string {
	if sType == domain.SnippetTypeSecret && len(r.secretKey) >= 32 {
		if encrypted, err := security.EncryptAESGCM(content, r.secretKey); err == nil {
			return encrypted
		}
	}
	return content
}

func (r *SnippetRepository) decryptIfSecret(content string, sType domain.SnippetType) string {
	if sType == domain.SnippetTypeSecret && len(r.secretKey) >= 32 {
		if decrypted, err := security.DecryptAESGCM(content, r.secretKey); err == nil {
			return decrypted
		}
	}
	return content
}

func (r *SnippetRepository) Create(ctx context.Context, s *domain.Snippet) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if s.ID == "" {
		s.ID = uuid.New().String()
	}

	now := time.Now()
	if s.CreatedAt.IsZero() {
		s.CreatedAt = now
	}
	s.UpdatedAt = now

	varsJSON, err := json.Marshal(s.Variables)
	if err != nil {
		varsJSON = []byte("[]")
	}

	isPinned := 0
	if s.IsPinned {
		isPinned = 1
	}
	isFav := 0
	if s.IsFavorite {
		isFav = 1
	}
	isArch := 0
	if s.IsArchived {
		isArch = 1
	}

	contentToStore := r.encryptIfSecret(s.Content, s.Type)

	query := `
		INSERT INTO snippets (id, user_id, title, content, type, language, variables, is_pinned, is_favorite, is_archived, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.ExecContext(ctx, query,
		s.ID,
		s.UserID,
		s.Title,
		contentToStore,
		string(s.Type),
		s.Language,
		string(varsJSON),
		isPinned,
		isFav,
		isArch,
		s.CreatedAt,
		s.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert snippet: %w", err)
	}

	// Insert tags
	if err := r.syncTagsTx(ctx, tx, s.ID, s.UserID, s.Tags); err != nil {
		return fmt.Errorf("failed to sync tags: %w", err)
	}

	return tx.Commit()
}

func (r *SnippetRepository) GetByID(ctx context.Context, id, userID string) (*domain.Snippet, error) {
	query := `
		SELECT id, user_id, title, content, type, language, variables, is_pinned, is_favorite, is_archived, created_at, updated_at
		FROM snippets
		WHERE id = ? AND user_id = ?
	`
	var s domain.Snippet
	var sType, varsStr string
	var isPinned, isFav, isArch int

	err := r.db.QueryRowContext(ctx, query, id, userID).Scan(
		&s.ID,
		&s.UserID,
		&s.Title,
		&s.Content,
		&sType,
		&s.Language,
		&varsStr,
		&isPinned,
		&isFav,
		&isArch,
		&s.CreatedAt,
		&s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	s.Type = domain.SnippetType(sType)
	s.IsPinned = isPinned == 1
	s.IsFavorite = isFav == 1
	s.IsArchived = isArch == 1
	s.Content = r.decryptIfSecret(s.Content, s.Type)

	if err := json.Unmarshal([]byte(varsStr), &s.Variables); err != nil {
		s.Variables = []string{}
	}

	tags, err := r.getSnippetTags(ctx, s.ID)
	if err != nil {
		return nil, err
	}
	s.Tags = tags

	return &s, nil
}

func (r *SnippetRepository) Update(ctx context.Context, s *domain.Snippet) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	s.UpdatedAt = time.Now()
	varsJSON, err := json.Marshal(s.Variables)
	if err != nil {
		varsJSON = []byte("[]")
	}

	isPinned := 0
	if s.IsPinned {
		isPinned = 1
	}
	isFav := 0
	if s.IsFavorite {
		isFav = 1
	}
	isArch := 0
	if s.IsArchived {
		isArch = 1
	}

	contentToStore := r.encryptIfSecret(s.Content, s.Type)

	query := `
		UPDATE snippets
		SET title = ?, content = ?, type = ?, language = ?, variables = ?, is_pinned = ?, is_favorite = ?, is_archived = ?, updated_at = ?
		WHERE id = ? AND user_id = ?
	`
	res, err := tx.ExecContext(ctx, query,
		s.Title,
		contentToStore,
		string(s.Type),
		s.Language,
		string(varsJSON),
		isPinned,
		isFav,
		isArch,
		s.UpdatedAt,
		s.ID,
		s.UserID,
	)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil || rows == 0 {
		return domain.ErrNotFound
	}

	// Update tags
	if err := r.syncTagsTx(ctx, tx, s.ID, s.UserID, s.Tags); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *SnippetRepository) Delete(ctx context.Context, id, userID string) error {
	query := `DELETE FROM snippets WHERE id = ? AND user_id = ?`
	res, err := r.db.ExecContext(ctx, query, id, userID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil || rows == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *SnippetRepository) List(ctx context.Context, filter domain.SnippetFilter) ([]domain.Snippet, int64, error) {
	var whereClauses []string
	var args []interface{}

	whereClauses = append(whereClauses, "s.user_id = ?")
	args = append(args, filter.UserID)

	if filter.Type != "" {
		whereClauses = append(whereClauses, "s.type = ?")
		args = append(args, string(filter.Type))
	}

	if filter.Language != "" {
		whereClauses = append(whereClauses, "s.language = ?")
		args = append(args, filter.Language)
	}

	if filter.IsPinned != nil {
		pinnedVal := 0
		if *filter.IsPinned {
			pinnedVal = 1
		}
		whereClauses = append(whereClauses, "s.is_pinned = ?")
		args = append(args, pinnedVal)
	}

	if filter.IsFavorite != nil {
		favVal := 0
		if *filter.IsFavorite {
			favVal = 1
		}
		whereClauses = append(whereClauses, "s.is_favorite = ?")
		args = append(args, favVal)
	}

	if filter.IsArchived != nil {
		archVal := 0
		if *filter.IsArchived {
			archVal = 1
		}
		whereClauses = append(whereClauses, "s.is_archived = ?")
		args = append(args, archVal)
	} else {
		// By default do not show archived
		whereClauses = append(whereClauses, "s.is_archived = 0")
	}

	if filter.Tag != "" {
		whereClauses = append(whereClauses, "s.id IN (SELECT st.snippet_id FROM snippet_tags st JOIN tags t ON st.tag_id = t.id WHERE t.name = ? AND t.user_id = ?)")
		args = append(args, filter.Tag, filter.UserID)
	}

	if filter.Query != "" {
		cleanQuery := strings.TrimSpace(filter.Query)
		ftsQuery := `"` + strings.ReplaceAll(cleanQuery, `"`, `""`) + `"*`
		searchPattern := "%" + cleanQuery + "%"
		whereClauses = append(whereClauses, "(s.id IN (SELECT snippet_id FROM snippets_fts WHERE user_id = ? AND snippets_fts MATCH ?) OR s.title LIKE ? OR s.content LIKE ? OR s.id IN (SELECT st.snippet_id FROM snippet_tags st JOIN tags t ON st.tag_id = t.id WHERE t.name LIKE ? AND t.user_id = ?))")
		args = append(args, filter.UserID, ftsQuery, searchPattern, searchPattern, searchPattern, filter.UserID)
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(DISTINCT s.id) FROM snippets s WHERE %s", whereSQL)
	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count snippets: %w", err)
	}

	// Fetch page
	limit := filter.Limit
	if limit <= 0 {
		limit = 50
	}
	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}

	query := fmt.Sprintf(`
		SELECT DISTINCT s.id, s.user_id, s.title, s.content, s.type, s.language, s.variables, s.is_pinned, s.is_favorite, s.is_archived, s.created_at, s.updated_at
		FROM snippets s
		WHERE %s
		ORDER BY s.is_pinned DESC, s.created_at DESC
		LIMIT ? OFFSET ?
	`, whereSQL)

	fetchArgs := append(args, limit, offset)
	rows, err := r.db.QueryContext(ctx, query, fetchArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query snippets: %w", err)
	}
	defer rows.Close()

	var snippets []domain.Snippet
	for rows.Next() {
		var s domain.Snippet
		var sType, varsStr string
		var isPinned, isFav, isArch int

		err := rows.Scan(
			&s.ID,
			&s.UserID,
			&s.Title,
			&s.Content,
			&sType,
			&s.Language,
			&varsStr,
			&isPinned,
			&isFav,
			&isArch,
			&s.CreatedAt,
			&s.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}

		s.Type = domain.SnippetType(sType)
		s.IsPinned = isPinned == 1
		s.IsFavorite = isFav == 1
		s.IsArchived = isArch == 1
		s.Content = r.decryptIfSecret(s.Content, s.Type)

		if err := json.Unmarshal([]byte(varsStr), &s.Variables); err != nil {
			s.Variables = []string{}
		}

		tags, err := r.getSnippetTags(ctx, s.ID)
		if err != nil {
			return nil, 0, err
		}
		s.Tags = tags

		snippets = append(snippets, s)
	}

	return snippets, total, nil
}

func (r *SnippetRepository) TogglePin(ctx context.Context, id, userID string) (bool, error) {
	s, err := r.GetByID(ctx, id, userID)
	if err != nil {
		return false, err
	}
	s.IsPinned = !s.IsPinned
	return s.IsPinned, r.Update(ctx, s)
}

func (r *SnippetRepository) ToggleFavorite(ctx context.Context, id, userID string) (bool, error) {
	s, err := r.GetByID(ctx, id, userID)
	if err != nil {
		return false, err
	}
	s.IsFavorite = !s.IsFavorite
	return s.IsFavorite, r.Update(ctx, s)
}

func (r *SnippetRepository) GetAllUserTags(ctx context.Context, userID string) ([]domain.TagCount, error) {
	query := `
		SELECT t.name, COUNT(st.snippet_id) as count
		FROM tags t
		JOIN snippet_tags st ON t.id = st.tag_id
		JOIN snippets s ON st.snippet_id = s.id
		WHERE t.user_id = ? AND s.is_archived = 0
		GROUP BY t.id, t.name
		ORDER BY count DESC, t.name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query tags: %w", err)
	}
	defer rows.Close()

	var tags []domain.TagCount
	for rows.Next() {
		var tc domain.TagCount
		if err := rows.Scan(&tc.Name, &tc.Count); err != nil {
			return nil, err
		}
		tags = append(tags, tc)
	}
	return tags, nil
}

func (r *SnippetRepository) GetAllForExport(ctx context.Context, userID string) ([]domain.Snippet, error) {
	filter := domain.SnippetFilter{
		UserID: userID,
		Limit:  100000,
	}
	snippets, _, err := r.List(ctx, filter)
	return snippets, err
}

func (r *SnippetRepository) ImportBatch(ctx context.Context, userID string, snippets []domain.Snippet) (int, error) {
	count := 0
	for _, s := range snippets {
		s.UserID = userID
		if s.ID == "" {
			s.ID = uuid.New().String()
		}
		if err := r.Create(ctx, &s); err == nil {
			count++
		}
	}
	return count, nil
}

// Helpers
func (r *SnippetRepository) syncTagsTx(ctx context.Context, tx *sql.Tx, snippetID, userID string, tags []string) error {
	// Delete existing tag relations
	_, err := tx.ExecContext(ctx, "DELETE FROM snippet_tags WHERE snippet_id = ?", snippetID)
	if err != nil {
		return err
	}

	for _, tag := range tags {
		tag = strings.TrimSpace(strings.ToLower(tag))
		if tag == "" {
			continue
		}

		// Ensure tag exists
		var tagID int64
		err := tx.QueryRowContext(ctx, "SELECT id FROM tags WHERE user_id = ? AND name = ?", userID, tag).Scan(&tagID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				res, err := tx.ExecContext(ctx, "INSERT INTO tags (user_id, name, created_at) VALUES (?, ?, ?)", userID, tag, time.Now())
				if err != nil {
					return err
				}
				tagID, err = res.LastInsertId()
				if err != nil {
					return err
				}
			} else {
				return err
			}
		}

		// Insert relation
		_, err = tx.ExecContext(ctx, "INSERT OR IGNORE INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)", snippetID, tagID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *SnippetRepository) getSnippetTags(ctx context.Context, snippetID string) ([]string, error) {
	query := `
		SELECT t.name
		FROM tags t
		JOIN snippet_tags st ON t.id = st.tag_id
		WHERE st.snippet_id = ?
		ORDER BY t.name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, snippetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []string
	for rows.Next() {
		var tag string
		if err := rows.Scan(&tag); err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}
	return tags, nil
}
