package events

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type EventType string

const (
	EventSnippetCreated  EventType = "snippet:created"
	EventSnippetUpdated  EventType = "snippet:updated"
	EventSnippetDeleted  EventType = "snippet:deleted"
	EventSnippetPinned   EventType = "snippet:pinned"
	EventSnippetFavorited EventType = "snippet:favorited"
	EventVaultImported   EventType = "vault:imported"
)

type EventMessage struct {
	Type      EventType   `json:"type"`
	UserID    string      `json:"user_id"`
	Payload   interface{} `json:"payload,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

type Client struct {
	UserID string
	Send   chan []byte
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]bool // userID -> set of clients
}

var globalHub *Hub
var once sync.Once

func GetHub() *Hub {
	once.Do(func() {
		globalHub = &Hub{
			clients: make(map[string]map[*Client]bool),
		}
	})
	return globalHub
}

func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[c.UserID]; !ok {
		h.clients[c.UserID] = make(map[*Client]bool)
	}
	h.clients[c.UserID][c] = true
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if userClients, ok := h.clients[c.UserID]; ok {
		delete(userClients, c)
		close(c.Send)
		if len(userClients) == 0 {
			delete(h.clients, c.UserID)
		}
	}
}

func (h *Hub) Publish(eventType EventType, userID string, payload interface{}) {
	msg := EventMessage{
		Type:      eventType,
		UserID:    userID,
		Payload:   payload,
		Timestamp: time.Now(),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	if userClients, ok := h.clients[userID]; ok {
		for client := range userClients {
			select {
			case client.Send <- data:
			default:
				// Channel is blocked or slow, skip
			}
		}
	}
}

// ServeSSE handles Server-Sent Events HTTP connections
func (h *Hub) ServeSSE(w http.ResponseWriter, r *http.Request, userID string) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no") // Disable Nginx/Coolify proxy buffering

	client := &Client{
		UserID: userID,
		Send:   make(chan []byte, 32),
	}

	h.Register(client)
	defer h.Unregister(client)

	// Send initial connected event
	fmt.Fprintf(w, "event: connected\ndata: {\"status\":\"connected\",\"user_id\":\"%s\"}\n\n", userID)
	flusher.Flush()

	// Keep-alive ticker every 20 seconds
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			fmt.Fprintf(w, ": keep-alive\n\n")
			flusher.Flush()
		case msg, ok := <-client.Send:
			if !ok {
				return
			}
			fmt.Fprintf(w, "data: %s\n\n", string(msg))
			flusher.Flush()
		}
	}
}
