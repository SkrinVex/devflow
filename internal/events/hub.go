package events

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type EventType string

const (
	EventSnippetCreated   EventType = "snippet:created"
	EventSnippetUpdated   EventType = "snippet:updated"
	EventSnippetDeleted   EventType = "snippet:deleted"
	EventSnippetPinned    EventType = "snippet:pinned"
	EventSnippetFavorited EventType = "snippet:favorited"
	EventVaultImported    EventType = "vault:imported"
)

type EventMessage struct {
	Type      EventType   `json:"type"`
	UserID    string      `json:"user_id"`
	Payload   interface{} `json:"payload,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	userID string
	send   chan []byte
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]bool // userID -> set of clients
}

var globalHub *Hub
var once sync.Once

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for reverse proxies (Coolify, Traefik, Docker)
		return true
	},
}

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

	if _, ok := h.clients[c.userID]; !ok {
		h.clients[c.userID] = make(map[*Client]bool)
	}
	h.clients[c.userID][c] = true
	log.Printf("🔌 Real-time client connected for user: %s (total active: %d)", c.userID, len(h.clients[c.userID]))
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if userClients, ok := h.clients[c.userID]; ok {
		if _, exists := userClients[c]; exists {
			delete(userClients, c)
			close(c.send)
			if len(userClients) == 0 {
				delete(h.clients, c.userID)
			}
			log.Printf("🔌 Real-time client disconnected for user: %s", c.userID)
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
			case client.send <- data:
			default:
				// If send buffer is full, unregister client
				go h.Unregister(client)
			}
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(25 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current websocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// readPump pumps messages from the websocket connection to the hub.
func (c *Client) readPump() {
	defer func() {
		c.hub.Unregister(c)
		c.conn.Close()
	}()

	c.conn.SetReadLimit(4096)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

// ServeWS upgrades the HTTP server connection to the WebSocket protocol.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, userID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ Failed to upgrade websocket: %v", err)
		return
	}

	client := &Client{
		hub:    h,
		conn:   conn,
		userID: userID,
		send:   make(chan []byte, 64),
	}

	h.Register(client)

	// Send initial welcome sync confirmation message
	initMsg, _ := json.Marshal(map[string]string{
		"type":    "connected",
		"status":  "realtime_active",
		"user_id": userID,
	})
	client.send <- initMsg

	go client.writePump()
	go client.readPump()
}
