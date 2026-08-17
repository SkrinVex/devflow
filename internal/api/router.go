package api

import (
	"io/fs"
	"net/http"
	"os"
	"strings"

	"devflow/internal/api/handlers"
	"devflow/internal/api/middleware"
	"devflow/internal/config"
	"devflow/internal/security"
	"devflow/internal/service"
)

type Router struct {
	cfg            *config.Config
	authService    *service.AuthService
	snippetService *service.SnippetService
	jwtManager     *security.JWTManager
	rateLimiter    *middleware.RateLimiter
	staticFS       fs.FS
}

func NewRouter(
	cfg *config.Config,
	authService *service.AuthService,
	snippetService *service.SnippetService,
	jwtManager *security.JWTManager,
	staticFS fs.FS,
) *Router {
	rateLimiter := middleware.NewRateLimiter(cfg.RateLimitRPS, cfg.RateLimitBurst)
	return &Router{
		cfg:            cfg,
		authService:    authService,
		snippetService: snippetService,
		jwtManager:     jwtManager,
		rateLimiter:    rateLimiter,
		staticFS:       staticFS,
	}
}

func (r *Router) SetupRoutes() http.Handler {
	mux := http.NewServeMux()

	authHandler := handlers.NewAuthHandler(r.authService)
	snippetHandler := handlers.NewSnippetHandler(r.snippetService)
	exportHandler := handlers.NewExportHandler(r.snippetService, r.authService)

	authMiddleware := middleware.Auth(r.jwtManager)

	// Health check
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, req *http.Request) {
		handlers.RespondJSON(w, http.StatusOK, map[string]string{"status": "healthy", "service": "devflow"})
	})
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, req *http.Request) {
		handlers.RespondJSON(w, http.StatusOK, map[string]string{"status": "healthy", "service": "devflow"})
	})

	// Public Auth endpoints
	mux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/v1/auth/2fa/verify-temp", authHandler.Verify2FATemp)
	mux.HandleFunc("POST /api/v1/auth/check-password", authHandler.CheckPasswordStrength)
	mux.HandleFunc("POST /api/v1/auth/logout", authHandler.Logout)

	// Protected Auth endpoints
	mux.Handle("GET /api/v1/auth/me", authMiddleware(http.HandlerFunc(authHandler.GetMe)))
	mux.Handle("POST /api/v1/auth/2fa/setup", authMiddleware(http.HandlerFunc(authHandler.Setup2FA)))
	mux.Handle("POST /api/v1/auth/2fa/confirm", authMiddleware(http.HandlerFunc(authHandler.Confirm2FA)))
	mux.Handle("POST /api/v1/auth/2fa/disable", authMiddleware(http.HandlerFunc(authHandler.Disable2FA)))
	mux.Handle("POST /api/v1/auth/password", authMiddleware(http.HandlerFunc(authHandler.ChangePassword)))

	// Snippets & Smart Engine (Protected)
	mux.Handle("GET /api/v1/snippets", authMiddleware(http.HandlerFunc(snippetHandler.List)))
	mux.Handle("POST /api/v1/snippets", authMiddleware(http.HandlerFunc(snippetHandler.Create)))
	mux.Handle("POST /api/v1/detect", authMiddleware(http.HandlerFunc(snippetHandler.Detect)))
	mux.Handle("GET /api/v1/tags", authMiddleware(http.HandlerFunc(snippetHandler.GetTags)))

	// Real-Time Multi-Device Sync Stream (WebSocket & SSE)
	eventsHandler := handlers.NewEventsHandler()
	mux.Handle("/api/v1/ws", authMiddleware(http.HandlerFunc(eventsHandler.HandleWS)))
	mux.Handle("GET /api/v1/ws", authMiddleware(http.HandlerFunc(eventsHandler.HandleWS)))

	// Dynamic snippet sub-routes
	mux.Handle("/api/v1/snippets/", authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		path := req.URL.Path
		switch {
		case strings.HasSuffix(path, "/pin") && req.Method == http.MethodPost:
			snippetHandler.TogglePin(w, req)
		case strings.HasSuffix(path, "/favorite") && req.Method == http.MethodPost:
			snippetHandler.ToggleFavorite(w, req)
		case strings.HasSuffix(path, "/run") && req.Method == http.MethodPost:
			snippetHandler.RunPrompt(w, req)
		case req.Method == http.MethodGet:
			snippetHandler.Get(w, req)
		case req.Method == http.MethodPut:
			snippetHandler.Update(w, req)
		case req.Method == http.MethodDelete:
			snippetHandler.Delete(w, req)
		default:
			handlers.RespondError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		}
	})))

	// Vault export / import
	mux.Handle("GET /api/v1/vault/export", authMiddleware(http.HandlerFunc(exportHandler.ExportVault)))
	mux.Handle("POST /api/v1/vault/import", authMiddleware(http.HandlerFunc(exportHandler.ImportVault)))

	// Static Web Client & SPA fallback
	mux.HandleFunc("/", r.serveSPA)

	// Apply global middleware pipeline: Logger -> SecurityHeaders -> CORS -> RateLimit
	var handler http.Handler = mux
	handler = r.rateLimiter.Middleware(handler)
	handler = middleware.CORS(handler)
	handler = middleware.SecurityHeaders(handler)
	handler = middleware.Logger(handler)

	return handler
}

func (r *Router) serveSPA(w http.ResponseWriter, req *http.Request) {
	// If it's an unhandled /api/ route, return 404 JSON instead of HTML
	if strings.HasPrefix(req.URL.Path, "/api/") {
		handlers.RespondError(w, http.StatusNotFound, "API endpoint not found", nil)
		return
	}

	if r.staticFS == nil {
		// In local dev if staticFS is nil, check local filesystem web/dist
		if _, err := os.Stat("web/dist/index.html"); err == nil {
			http.FileServer(http.Dir("web/dist")).ServeHTTP(w, req)
			return
		}
		http.Error(w, "DevFlow Web UI not built. Please build the web assets or run Vite dev server.", http.StatusNotFound)
		return
	}

	cleanPath := strings.TrimPrefix(req.URL.Path, "/")
	if cleanPath == "" {
		cleanPath = "index.html"
	}

	// Try serving the exact file from staticFS
	f, err := r.staticFS.Open(cleanPath)
	if err == nil {
		_ = f.Close()
		http.FileServer(http.FS(r.staticFS)).ServeHTTP(w, req)
		return
	}

	// If file not found (e.g. client-side SPA route like /login, /prompts), serve index.html
	indexFile, err := r.staticFS.Open("index.html")
	if err != nil {
		http.Error(w, "DevFlow UI index.html not found", http.StatusNotFound)
		return
	}
	defer indexFile.Close()

	stat, _ := indexFile.Stat()
	http.ServeContent(w, req, "index.html", stat.ModTime(), indexFile.(ioReadSeeker))
}

type ioReadSeeker interface {
	fs.File
	Seek(offset int64, whence int) (int64, error)
}
