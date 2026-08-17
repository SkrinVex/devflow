package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"devflow/internal/domain"
	"devflow/internal/security"

	"github.com/google/uuid"
)

type SnippetService struct {
	snippetRepo domain.SnippetRepository
	detector    *security.ContentDetector
}

func NewSnippetService(snippetRepo domain.SnippetRepository, detector *security.ContentDetector) *SnippetService {
	return &SnippetService{
		snippetRepo: snippetRepo,
		detector:    detector,
	}
}

func (s *SnippetService) Create(ctx context.Context, userID string, req domain.CreateSnippetRequest) (*domain.Snippet, error) {
	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		return nil, domain.ErrInvalidInput
	}

	// Run smart detection
	detected := s.detector.Detect(req.Content)

	title := strings.TrimSpace(req.Title)
	if title == "" {
		title = detected.SuggestedTitle
	}

	snippetType := req.Type
	if snippetType == "" {
		snippetType = detected.DetectedType
	}

	language := strings.TrimSpace(req.Language)
	if language == "" {
		language = detected.DetectedLanguage
	}

	// Merge user tags and auto tags
	tagSet := make(map[string]bool)
	for _, t := range detected.AutoTags {
		if clean := cleanTag(t); clean != "" {
			tagSet[clean] = true
		}
	}
	for _, t := range req.Tags {
		if clean := cleanTag(t); clean != "" {
			tagSet[clean] = true
		}
	}

	var finalTags []string
	for t := range tagSet {
		finalTags = append(finalTags, t)
	}

	snippet := &domain.Snippet{
		ID:         uuid.New().String(),
		UserID:     userID,
		Title:      title,
		Content:    req.Content,
		Type:       snippetType,
		Language:   language,
		Tags:       finalTags,
		Variables:  detected.ExtractedVars,
		IsPinned:   req.IsPinned,
		IsFavorite: req.IsFavorite,
		IsArchived: false,
	}

	if err := s.snippetRepo.Create(ctx, snippet); err != nil {
		return nil, err
	}

	return snippet, nil
}

func (s *SnippetService) GetByID(ctx context.Context, id, userID string) (*domain.Snippet, error) {
	return s.snippetRepo.GetByID(ctx, id, userID)
}

func (s *SnippetService) Update(ctx context.Context, id, userID string, req domain.UpdateSnippetRequest) (*domain.Snippet, error) {
	snippet, err := s.snippetRepo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		snippet.Title = strings.TrimSpace(*req.Title)
	}

	if req.Content != nil {
		snippet.Content = strings.TrimSpace(*req.Content)
		// Re-run detection for variables if content changed
		detected := s.detector.Detect(snippet.Content)
		snippet.Variables = detected.ExtractedVars
	}

	if req.Type != nil {
		snippet.Type = *req.Type
	}

	if req.Language != nil {
		snippet.Language = strings.TrimSpace(*req.Language)
	}

	if req.Tags != nil {
		var cleanTags []string
		tagSet := make(map[string]bool)
		for _, t := range *req.Tags {
			if clean := cleanTag(t); clean != "" && !tagSet[clean] {
				tagSet[clean] = true
				cleanTags = append(cleanTags, clean)
			}
		}
		snippet.Tags = cleanTags
	}

	if req.IsPinned != nil {
		snippet.IsPinned = *req.IsPinned
	}

	if req.IsFavorite != nil {
		snippet.IsFavorite = *req.IsFavorite
	}

	if req.IsArchived != nil {
		snippet.IsArchived = *req.IsArchived
	}

	if err := s.snippetRepo.Update(ctx, snippet); err != nil {
		return nil, err
	}

	return snippet, nil
}

func (s *SnippetService) Delete(ctx context.Context, id, userID string) error {
	return s.snippetRepo.Delete(ctx, id, userID)
}

func (s *SnippetService) List(ctx context.Context, filter domain.SnippetFilter) ([]domain.Snippet, int64, error) {
	return s.snippetRepo.List(ctx, filter)
}

func (s *SnippetService) GetUserTags(ctx context.Context, userID string) ([]domain.TagCount, error) {
	return s.snippetRepo.GetAllUserTags(ctx, userID)
}

func (s *SnippetService) Detect(content string) domain.DetectContentResponse {
	return s.detector.Detect(content)
}

func (s *SnippetService) RunPrompt(content string, variables map[string]string) string {
	result := content
	for k, v := range variables {
		placeholder := fmt.Sprintf("{{%s}}", k)
		result = strings.ReplaceAll(result, placeholder, v)
	}
	return result
}

func (s *SnippetService) ExportVault(ctx context.Context, user domain.UserProfile) (*domain.VaultExport, error) {
	snippets, err := s.snippetRepo.GetAllForExport(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	return &domain.VaultExport{
		Version:    "1.0",
		ExportedAt: time.Now(),
		User:       user,
		Snippets:   snippets,
	}, nil
}

func (s *SnippetService) ImportVault(ctx context.Context, userID string, export domain.VaultExport) (int, error) {
	return s.snippetRepo.ImportBatch(ctx, userID, export.Snippets)
}

func cleanTag(t string) string {
	t = strings.TrimSpace(strings.ToLower(t))
	t = strings.TrimPrefix(t, "#")
	return t
}
