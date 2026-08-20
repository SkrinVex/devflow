package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"devflow/internal/api"
	"devflow/internal/assets"
	"devflow/internal/config"
	"devflow/internal/email"
	"devflow/internal/mcp"
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
	// Subcommand: devflow mcp
	if len(os.Args) > 1 && os.Args[1] == "mcp" {
		url := os.Getenv("DEVFLOW_URL")
		if url == "" {
			url = "http://localhost:1451"
		}
		token := os.Getenv("DEVFLOW_TOKEN")

		for i := 2; i < len(os.Args); i++ {
			arg := os.Args[i]
			if strings.HasPrefix(arg, "--url=") {
				url = strings.TrimPrefix(arg, "--url=")
			} else if strings.HasPrefix(arg, "--token=") {
				token = strings.TrimPrefix(arg, "--token=")
			}
		}

		if token == "" {
			fmt.Fprintln(os.Stderr, "Error: DEVFLOW_TOKEN is required. Pass --token=<jwt> or set DEVFLOW_TOKEN env var.")
			os.Exit(1)
		}

		server := mcp.NewServer(url, token)
		if err := server.RunStdio(); err != nil {
			fmt.Fprintf(os.Stderr, "MCP server error: %v\n", err)
			os.Exit(1)
		}
		return
	}

	// Subcommand: devflow reset-password --username=<user> --password=<newpass>
	if len(os.Args) > 1 && os.Args[1] == "reset-password" {
		cfg, err := config.Load()
		if err != nil {
			log.Fatalf("❌ Failed to load configuration: %v", err)
		}

		db, err := sqlite.New(cfg.DBPath)
		if err != nil {
			log.Fatalf("❌ Failed to connect to SQLite: %v", err)
		}
		defer db.Close()

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		userRepo := sqlite.NewUserRepository(db)
		jwtManager := security.NewJWTManager(cfg.JWTSecret, cfg.JWTExpiry)
		totpManager := security.NewTOTPManager("DevFlow")
		mailer := email.NewMailer(cfg)
		authService := service.NewAuthService(userRepo, jwtManager, totpManager, mailer, cfg.AppURL, cfg.EnableRegistration)

		var username, newPassword string
		for i := 2; i < len(os.Args); i++ {
			arg := os.Args[i]
			if strings.HasPrefix(arg, "--username=") {
				username = strings.TrimPrefix(arg, "--username=")
			} else if strings.HasPrefix(arg, "--password=") {
				newPassword = strings.TrimPrefix(arg, "--password=")
			}
		}

		if username == "" || newPassword == "" {
			fmt.Println("Usage: devflow reset-password --username=<username_or_email> --password=<new_password>")
			os.Exit(1)
		}

		if err := authService.AdminResetPassword(ctx, username, newPassword); err != nil {
			log.Fatalf("❌ Failed to reset password: %v", err)
		}

		log.Printf("✅ Password for user '%s' was successfully reset!", username)
		return
	}

	fmt.Print(banner)

	// 1. Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Failed to load configuration: %v", err)
	}

	log.Printf("🚀 Starting DevFlow on port :%s (env: %s, data: %s, app_url: %s)", cfg.Port, cfg.AppEnv, cfg.DataDir, cfg.AppURL)

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
	snippetRepo := sqlite.NewSnippetRepository(db, cfg.JWTSecret)

	// 4. Initialize Security Managers & Email Service
	jwtManager := security.NewJWTManager(cfg.JWTSecret, cfg.JWTExpiry)
	totpManager := security.NewTOTPManager("DevFlow")
	contentDetector := security.NewContentDetector()
	mailer := email.NewMailer(cfg)

	// 5. Initialize Services
	authService := service.NewAuthService(userRepo, jwtManager, totpManager, mailer, cfg.AppURL, cfg.EnableRegistration)
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

	// Flush SQLite WAL to disk
	if err := db.Checkpoint(); err != nil {
		log.Printf("⚠️ SQLite WAL checkpoint warning: %v", err)
	} else {
		log.Println("✅ SQLite WAL checkpoint completed (TRUNCATE)")
	}

	_ = db.Close()

	log.Println("👋 DevFlow exited cleanly. Goodbye!")
}
