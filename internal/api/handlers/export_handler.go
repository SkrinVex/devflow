package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"devflow/internal/domain"
	"devflow/internal/security"
	"devflow/internal/service"
)

type ExportHandler struct {
	snippetService *service.SnippetService
	authService    *service.AuthService
}

func NewExportHandler(snippetService *service.SnippetService, authService *service.AuthService) *ExportHandler {
	return &ExportHandler{
		snippetService: snippetService,
		authService:    authService,
	}
}

func (h *ExportHandler) ExportVault(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	profile, err := h.authService.GetProfile(r.Context(), claims.UserID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to get user profile", err)
		return
	}

	export, err := h.snippetService.ExportVault(r.Context(), *profile)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to export vault", err)
		return
	}

	filename := fmt.Sprintf("devflow_export_%s.json", time.Now().Format("20060102_150405"))
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	RespondJSON(w, http.StatusOK, export)
}

func (h *ExportHandler) ImportVault(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	var export domain.VaultExport
	if err := json.NewDecoder(r.Body).Decode(&export); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid export JSON format", err)
		return
	}

	count, err := h.snippetService.ImportVault(r.Context(), claims.UserID, export)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to import items", err)
		return
	}

	RespondSuccess(w, http.StatusOK, fmt.Sprintf("Successfully imported %d items", count), map[string]int{
		"imported_count": count,
	})
}
