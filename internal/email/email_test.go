package email

import (
	"strings"
	"testing"
)

func TestConsoleMailer(t *testing.T) {
	mailer := &ConsoleMailer{}
	if !mailer.IsConfigured() {
		t.Fatalf("ConsoleMailer should always be considered configured as fallback")
	}

	err := mailer.SendPasswordResetEmail("user@example.com", "lexa", "http://localhost:1451/?reset_token=123456")
	if err != nil {
		t.Fatalf("Expected nil error from ConsoleMailer, got %v", err)
	}
}

func TestEmailTemplateRendering(t *testing.T) {
	username := "testuser"
	link := "http://localhost:1451/?reset_token=abcdef123456"

	html := renderPasswordResetHTML(username, link)
	if !strings.Contains(html, username) {
		t.Errorf("Expected HTML to contain username %s", username)
	}
	if !strings.Contains(html, link) {
		t.Errorf("Expected HTML to contain reset link %s", link)
	}

	text := renderPasswordResetText(username, link)
	if !strings.Contains(text, username) {
		t.Errorf("Expected text to contain username %s", username)
	}
	if !strings.Contains(text, link) {
		t.Errorf("Expected text to contain reset link %s", link)
	}
}

func TestExtractEmail(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"DevFlow <noreply@devflow.app>", "noreply@devflow.app"},
		{"noreply@devflow.app", "noreply@devflow.app"},
		{"<admin@domain.com>", "admin@domain.com"},
	}

	for _, c := range cases {
		res := extractEmail(c.input)
		if res != c.expected {
			t.Errorf("extractEmail(%q) = %q, expected %q", c.input, res, c.expected)
		}
	}
}
