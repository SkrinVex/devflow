package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"devflow/internal/api"
	"devflow/internal/assets"
	"devflow/internal/config"
	"devflow/internal/repository/sqlite"
	"devflow/internal/security"
	"devflow/internal/service"
)

const banner = `
  ____             _____ _               
 |  _ \  _____   _|  ___| | _____      __
 | | | |/ _ \ \ / / |_  | |/ _ \ \ /\ / /
 | |_| |  __/\ V /|  _| | | (_) \ V  V / 
 |____/ \___| \_/ |_|   |_|\___/ \_/\_/  
 Personal Knowledge Vault & Prompt Manager
`

func main() {
	fmt.Print(banner)

	// 1. Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Failed to load configuration: %v", err)
	}

	log.Printf("🚀 Starting DevFlow on port :%s (env: %s, data: %s)", cfg.Port, cfg.AppEnv, cfg.DataDir)

	// 2. Initialize Database & Migrations
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := sqlite.New(cfg.DBPath)
	if err != nil {
		log.Fatalf("❌ Failed to connect to SQLite (%s): %v", cfg.DBPath, err)
	}
	defer db.Close()

	if err := sqlite.Migrate(ctx, db); err != nil {
		log.Fatalf("❌ Failed to run database migrations: %v", err)
	}
	log.Printf("✅ SQLite database initialized at %s (WAL mode active)", cfg.DBPath)

	// 3. Initialize Repositories
	userRepo := sqlite.NewUserRepository(db)
	snippetRepo := sqlite.NewSnippetRepository(db)

	// 4. Initialize Security Managers
	jwtManager := security.NewJWTManager(cfg.JWTSecret, cfg.JWTExpiry)
	totpManager := security.NewTOTPManager("DevFlow")
	contentDetector := security.NewContentDetector()

	// 5. Initialize Services
	authService := service.NewAuthService(userRepo, jwtManager, totpManager, cfg.EnableRegistration)
	snippetService := service.NewSnippetService(snippetRepo, contentDetector)

	// 6. Initialize Router & Embedded Assets
	webFS := assets.GetWebFS()
	appRouter := api.NewRouter(cfg, authService, snippetService, jwtManager, webFS)
	httpHandler := appRouter.SetupRoutes()

	// 7. Setup HTTP Server
	serverAddr := fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)
	srv := &http.Server{
		Addr:         serverAddr,
		Handler:      httpHandler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in background goroutine
	go func() {
		log.Printf("🌐 DevFlow is ready and listening on http://%s", serverAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("❌ Server stopped unexpectedly: %v", err)
		}
	}()

	// 8. Graceful Shutdown on SIGINT/SIGTERM
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	<-quit

	log.Println("🛑 Shutting down DevFlow gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("⚠️ Server forced shutdown: %v", err)
	}

	log.Println("👋 DevFlow exited cleanly. Goodbye!")
}
