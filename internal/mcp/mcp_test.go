package mcp

import (
	"context"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"devflow/internal/api"
	"devflow/internal/assets"
	"devflow/internal/config"
	"devflow/internal/domain"
	"devflow/internal/repository/sqlite"
	"devflow/internal/security"
	"devflow/internal/service"
)

func setupTestServer(t *testing.T) (*httptest.Server, string, func()) {
	ctx := context.Background()
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "mcp_test.db")

	db, err := sqlite.New(dbPath)
	if err != nil {
		t.Fatalf("Failed to create test DB: %v", err)
	}

	if err := sqlite.Migrate(ctx, db); err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}

	jwtSecret := []byte("test_secret_for_mcp_testing_32_bytes_long_123")
	userRepo := sqlite.NewUserRepository(db)
	snippetRepo := sqlite.NewSnippetRepository(db, jwtSecret)

	jwtManager := security.NewJWTManager(jwtSecret, 24*time.Hour)
	totpManager := security.NewTOTPManager("DevFlow")
	contentDetector := security.NewContentDetector()

	authService := service.NewAuthService(userRepo, jwtManager, totpManager, nil, "http://localhost:1451", true)
	snippetService := service.NewSnippetService(snippetRepo, contentDetector)

	authRes, err := authService.Register(ctx, domain.RegisterRequest{
		Username: "mcp_user",
		Email:    "mcp@example.com",
		Password: "Password123!",
	})
	if err != nil {
		t.Fatalf("Failed to register test user: %v", err)
	}

	cfg := &config.Config{
		Host:               "127.0.0.1",
		Port:               "0",
		AppEnv:             "test",
		RateLimitRPS:       100,
		RateLimitBurst:     100,
		EnableRegistration: true,
	}

	router := api.NewRouter(cfg, authService, snippetService, jwtManager, assets.GetWebFS())
	ts := httptest.NewServer(router.SetupRoutes())

	cleanup := func() {
		ts.Close()
		_ = db.Close()
	}

	return ts, authRes.Token, cleanup
}

func TestMCPServerTools(t *testing.T) {
	ts, token, cleanup := setupTestServer(t)
	defer cleanup()

	server := NewServer(ts.URL, token)

	// 1. Test Tools List
	tools := server.getTools()
	if len(tools) != 7 {
		t.Errorf("Expected 7 tools, got %d", len(tools))
	}

	// 2. Test Create Snippet via MCP Tool
	createRes, err := server.executeTool("devflow_create_snippet", map[string]interface{}{
		"title":    "AI Pipeline Prompt",
		"content":  "You are a Senior Go Architect. Optimize this pipeline for {{load_rps}} req/sec in {{framework}} #golang #concurrency #prompt",
		"type":     "prompt",
		"language": "go",
	})
	if err != nil {
		t.Fatalf("Failed to create snippet via MCP: %v", err)
	}

	if !strings.Contains(createRes, "AI Pipeline Prompt") {
		t.Errorf("Expected created snippet title in response, got: %s", createRes)
	}

	// 3. Test List Snippets via MCP Tool
	listRes, err := server.executeTool("devflow_list_snippets", map[string]interface{}{
		"query": "pipeline",
	})
	if err != nil {
		t.Fatalf("Failed to list snippets via MCP: %v", err)
	}

	if !strings.Contains(listRes, "AI Pipeline Prompt") {
		t.Errorf("Expected snippet in list response, got: %s", listRes)
	}

	// 4. Test Get Tags via MCP Tool
	tagsRes, err := server.executeTool("devflow_get_tags", map[string]interface{}{})
	if err != nil {
		t.Fatalf("Failed to get tags via MCP: %v", err)
	}

	if !strings.Contains(tagsRes, "golang") || !strings.Contains(tagsRes, "concurrency") {
		t.Errorf("Expected auto-extracted tags in response, got: %s", tagsRes)
	}
}
