package handlers

import (
	"net/http"

	"devflow/internal/domain"
	"devflow/internal/events"
	"devflow/internal/security"
)

type EventsHandler struct{}

func NewEventsHandler() *EventsHandler {
	return &EventsHandler{}
}

func (h *EventsHandler) HandleWS(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("user_claims").(*security.Claims)
	if !ok {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", domain.ErrUnauthorized)
		return
	}

	events.GetHub().ServeWS(w, r, claims.UserID)
}
