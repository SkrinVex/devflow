package domain

import "time"

type SnippetType string

const (
	SnippetTypePrompt SnippetType = "prompt"
	SnippetTypeCode   SnippetType = "code"
	SnippetTypeSecret SnippetType = "secret"
	SnippetTypeNote   SnippetType = "note"
)

type Snippet struct {
	ID         string      `json:"id"`
	UserID     string      `json:"user_id"`
	Title      string      `json:"title"`
	Content    string      `json:"content"`
	Type       SnippetType `json:"type"`
	Language   string      `json:"language"`
	Tags       []string    `json:"tags"`
	Variables  []string    `json:"variables"` // Extracted {{variables}} for prompt templates
	IsPinned   bool        `json:"is_pinned"`
	IsFavorite bool        `json:"is_favorite"`
	IsArchived bool        `json:"is_archived"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`
}

type CreateSnippetRequest struct {
	Title      string      `json:"title,omitempty"`
	Content    string      `json:"content"`
	Type       SnippetType `json:"type,omitempty"`
	Language   string      `json:"language,omitempty"`
	Tags       []string    `json:"tags,omitempty"`
	IsPinned   bool        `json:"is_pinned,omitempty"`
	IsFavorite bool        `json:"is_favorite,omitempty"`
}

type UpdateSnippetRequest struct {
	Title      *string      `json:"title,omitempty"`
	Content    *string      `json:"content,omitempty"`
	Type       *SnippetType `json:"type,omitempty"`
	Language   *string      `json:"language,omitempty"`
	Tags       *[]string    `json:"tags,omitempty"`
	IsPinned   *bool        `json:"is_pinned,omitempty"`
	IsFavorite *bool        `json:"is_favorite,omitempty"`
	IsArchived *bool        `json:"is_archived,omitempty"`
}

type SnippetFilter struct {
	UserID     string
	Query      string
	Type       SnippetType
	Language   string
	Tag        string
	IsPinned   *bool
	IsFavorite *bool
	IsArchived *bool
	Limit      int
	Offset     int
}

type DetectContentRequest struct {
	Content string `json:"content"`
}

type DetectContentResponse struct {
	SuggestedTitle    string      `json:"suggested_title"`
	DetectedType      SnippetType `json:"detected_type"`
	DetectedLanguage  string      `json:"detected_language"`
	AutoTags          []string    `json:"auto_tags"`
	ExtractedVars     []string    `json:"extracted_vars"`
	IsLikelySecret    bool        `json:"is_likely_secret"`
}

type RunPromptRequest struct {
	Variables map[string]string `json:"variables"`
}

type RunPromptResponse struct {
	RenderedContent string `json:"rendered_content"`
}

type VaultExport struct {
	Version   string    `json:"version"`
	ExportedAt time.Time `json:"exported_at"`
	User      UserProfile `json:"user"`
	Snippets  []Snippet `json:"snippets"`
}
