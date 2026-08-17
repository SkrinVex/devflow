package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"devflow/internal/domain"
	"devflow/internal/events"
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

	// Broadcast real-time SSE event to all connected user devices
	events.GetHub().Publish(events.EventSnippetCreated, claims.UserID, snippet)

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

	// Broadcast real-time SSE event to all connected user devices
	events.GetHub().Publish(events.EventSnippetUpdated, claims.UserID, snippet)

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

	// Broadcast real-time SSE event to all connected user devices
	events.GetHub().Publish(events.EventSnippetDeleted, claims.UserID, map[string]string{"id": id})

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

	// Broadcast real-time SSE event to all connected user devices
	events.GetHub().Publish(events.EventSnippetPinned, claims.UserID, updated)

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

	// Broadcast real-time SSE event to all connected user devices
	events.GetHub().Publish(events.EventSnippetFavorited, claims.UserID, updated)

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
		RespondError(w, http.StatusInternalServerError, "Failed to retrieve tags", err)
		return
	}

	if tags == nil {
		tags = []domain.TagCount{}
	}

	RespondJSON(w, http.StatusOK, tags)
}

func (h *SnippetHandler) ExportVault(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	userProfile := domain.UserProfile{
		ID:           claims.UserID,
		Username:     claims.Username,
		Email:        claims.Email,
		Is2FAEnabled: claims.Is2FAEnabled,
	}

	export, err := h.snippetService.ExportVault(r.Context(), userProfile)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to export vault", err)
		return
	}

	w.Header().Set("Content-Disposition", "attachment; filename=devflow_vault_backup.json")
	RespondJSON(w, http.StatusOK, export)
}

func (h *SnippetHandler) ImportVault(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	var export domain.VaultExport
	if err := json.NewDecoder(r.Body).Decode(&export); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid backup JSON format", err)
		return
	}

	count, err := h.snippetService.ImportVault(r.Context(), claims.UserID, export)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to import vault", err)
		return
	}

	// Broadcast real-time SSE event to all connected user devices
	events.GetHub().Publish(events.EventVaultImported, claims.UserID, map[string]int{"imported_count": count})

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"message":        "Vault imported successfully",
		"imported_count": count,
	})
}

func extractIDFromPath(path, prefix string) string {
	trimmed := strings.TrimPrefix(path, prefix)
	parts := strings.Split(trimmed, "/")
	if len(parts) > 0 {
		return parts[0]
	}
	return ""
}

func extractIDFromSubPath(path, prefix, suffix string) string {
	trimmed := strings.TrimPrefix(path, prefix)
	trimmed = strings.TrimSuffix(trimmed, suffix)
	parts := strings.Split(trimmed, "/")
	if len(parts) > 0 {
		return parts[0]
	}
	return ""
}
