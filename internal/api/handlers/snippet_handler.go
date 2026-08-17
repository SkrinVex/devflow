package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"devflow/internal/domain"
	"devflow/internal/security"
	"devflow/internal/service"
)

type SnippetHandler struct {
	snippetService *service.SnippetService
}

func NewSnippetHandler(snippetService *service.SnippetService) *SnippetHandler {
	return &SnippetHandler{snippetService: snippetService}
}

func (h *SnippetHandler) List(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	q := r.URL.Query()
	filter := domain.SnippetFilter{
		UserID:   claims.UserID,
		Query:    q.Get("q"),
		Type:     domain.SnippetType(q.Get("type")),
		Language: q.Get("language"),
		Tag:      q.Get("tag"),
	}

	if pinned := q.Get("is_pinned"); pinned != "" {
		b := pinned == "true" || pinned == "1"
		filter.IsPinned = &b
	}

	if fav := q.Get("is_favorite"); fav != "" {
		b := fav == "true" || fav == "1"
		filter.IsFavorite = &b
	}

	if arch := q.Get("is_archived"); arch != "" {
		b := arch == "true" || arch == "1"
		filter.IsArchived = &b
	}

	if limitStr := q.Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			filter.Limit = limit
		}
	}

	if offsetStr := q.Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil {
			filter.Offset = offset
		}
	}

	snippets, total, err := h.snippetService.List(r.Context(), filter)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to retrieve snippets", err)
		return
	}

	if snippets == nil {
		snippets = []domain.Snippet{}
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"items": snippets,
		"total": total,
	})
}

func (h *SnippetHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	var req domain.CreateSnippetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	snippet, err := h.snippetService.Create(r.Context(), claims.UserID, req)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidInput) {
			RespondError(w, http.StatusBadRequest, "Content cannot be empty", err)
			return
		}
		RespondError(w, http.StatusInternalServerError, "Failed to create snippet", err)
		return
	}

	RespondSuccess(w, http.StatusCreated, "Snippet created", snippet)
}

func (h *SnippetHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	id := extractIDFromPath(r.URL.Path, "/api/v1/snippets/")
	if id == "" {
		RespondError(w, http.StatusBadRequest, "Missing snippet ID", nil)
		return
	}

	snippet, err := h.snippetService.GetByID(r.Context(), id, claims.UserID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			RespondError(w, http.StatusNotFound, "Snippet not found", err)
			return
		}
		RespondError(w, http.StatusInternalServerError, "Failed to get snippet", err)
		return
	}

	RespondJSON(w, http.StatusOK, snippet)
}

func (h *SnippetHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	id := extractIDFromPath(r.URL.Path, "/api/v1/snippets/")
	if id == "" {
		RespondError(w, http.StatusBadRequest, "Missing snippet ID", nil)
		return
	}

	var req domain.UpdateSnippetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	snippet, err := h.snippetService.Update(r.Context(), id, claims.UserID, req)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			RespondError(w, http.StatusNotFound, "Snippet not found", err)
			return
		}
		RespondError(w, http.StatusInternalServerError, "Failed to update snippet", err)
		return
	}

	RespondSuccess(w, http.StatusOK, "Snippet updated", snippet)
}

func (h *SnippetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	id := extractIDFromPath(r.URL.Path, "/api/v1/snippets/")
	if id == "" {
		RespondError(w, http.StatusBadRequest, "Missing snippet ID", nil)
		return
	}

	if err := h.snippetService.Delete(r.Context(), id, claims.UserID); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			RespondError(w, http.StatusNotFound, "Snippet not found", err)
			return
		}
		RespondError(w, http.StatusInternalServerError, "Failed to delete snippet", err)
		return
	}

	RespondSuccess(w, http.StatusOK, "Snippet deleted", nil)
}

func (h *SnippetHandler) TogglePin(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	id := extractIDFromSubPath(r.URL.Path, "/api/v1/snippets/", "/pin")
	snippet, err := h.snippetService.GetByID(r.Context(), id, claims.UserID)
	if err != nil {
		RespondError(w, http.StatusNotFound, "Snippet not found", err)
		return
	}

	newPinned := !snippet.IsPinned
	updated, err := h.snippetService.Update(r.Context(), id, claims.UserID, domain.UpdateSnippetRequest{
		IsPinned: &newPinned,
	})
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to toggle pin", err)
		return
	}

	RespondJSON(w, http.StatusOK, updated)
}

func (h *SnippetHandler) ToggleFavorite(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	id := extractIDFromSubPath(r.URL.Path, "/api/v1/snippets/", "/favorite")
	snippet, err := h.snippetService.GetByID(r.Context(), id, claims.UserID)
	if err != nil {
		RespondError(w, http.StatusNotFound, "Snippet not found", err)
		return
	}

	newFav := !snippet.IsFavorite
	updated, err := h.snippetService.Update(r.Context(), id, claims.UserID, domain.UpdateSnippetRequest{
		IsFavorite: &newFav,
	})
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to toggle favorite", err)
		return
	}

	RespondJSON(w, http.StatusOK, updated)
}

func (h *SnippetHandler) RunPrompt(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	id := extractIDFromSubPath(r.URL.Path, "/api/v1/snippets/", "/run")
	snippet, err := h.snippetService.GetByID(r.Context(), id, claims.UserID)
	if err != nil {
		RespondError(w, http.StatusNotFound, "Snippet not found", err)
		return
	}

	var req domain.RunPromptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	rendered := h.snippetService.RunPrompt(snippet.Content, req.Variables)
	RespondJSON(w, http.StatusOK, domain.RunPromptResponse{
		RenderedContent: rendered,
	})
}

func (h *SnippetHandler) Detect(w http.ResponseWriter, r *http.Request) {
	var req domain.DetectContentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	result := h.snippetService.Detect(req.Content)
	RespondJSON(w, http.StatusOK, result)
}

func (h *SnippetHandler) GetTags(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	tags, err := h.snippetService.GetUserTags(r.Context(), claims.UserID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to get tags", err)
		return
	}

	if tags == nil {
		tags = []domain.TagCount{}
	}

	RespondJSON(w, http.StatusOK, tags)
}

// Helpers for route parameters
func extractIDFromPath(path, prefix string) string {
	rest := strings.TrimPrefix(path, prefix)
	parts := strings.Split(rest, "/")
	return parts[0]
}

func extractIDFromSubPath(path, prefix, suffix string) string {
	rest := strings.TrimPrefix(path, prefix)
	rest = strings.TrimSuffix(rest, suffix)
	parts := strings.Split(rest, "/")
	return parts[0]
}
