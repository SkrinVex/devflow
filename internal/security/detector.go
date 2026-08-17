package security

import (
	"encoding/json"
	"regexp"
	"strings"
	"unicode"

	"devflow/internal/domain"
)

var (
	varRegex     = regexp.MustCompile(`\{\{([a-zA-Z0-9_-]+)\}\}`)
	hashtagRegex = regexp.MustCompile(`(?:^|\s)#([a-zA-Z0-9_\-]+)`)
	jwtRegex     = regexp.MustCompile(`^ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$`)
	apiKeyRegex  = regexp.MustCompile(`(?i)(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|gho_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[0-9a-zA-Z]{10,}|glpat-[0-9a-zA-Z\-_]{20,}|AIza[0-9A-Za-z\-_]{35})`)
	connStrRegex = regexp.MustCompile(`(?i)(postgres|postgresql|mysql|mongodb|redis|amqp):\/\/[^\s]+`)
)

type ContentDetector struct{}

func NewContentDetector() *ContentDetector {
	return &ContentDetector{}
}

// Detect analyzes raw content and returns classification, auto-tags, language, and extracted variables.
func (d *ContentDetector) Detect(content string) domain.DetectContentResponse {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return domain.DetectContentResponse{
			SuggestedTitle:   "Untitled Note",
			DetectedType:     domain.SnippetTypeNote,
			DetectedLanguage: "plaintext",
			AutoTags:         []string{"note"},
		}
	}

	tagsMap := make(map[string]bool)

	// 1. Extract manual #hashtags
	hashMatches := hashtagRegex.FindAllStringSubmatch(content, -1)
	for _, m := range hashMatches {
		if len(m) > 1 {
			tag := strings.ToLower(strings.TrimSpace(m[1]))
			if tag != "" && len(tag) <= 30 {
				tagsMap[tag] = true
			}
		}
	}

	// 2. Extract {{variable}} placeholders
	var extractedVars []string
	varSet := make(map[string]bool)
	varMatches := varRegex.FindAllStringSubmatch(content, -1)
	for _, m := range varMatches {
		if len(m) > 1 {
			v := strings.TrimSpace(m[1])
			if !varSet[v] {
				varSet[v] = true
				extractedVars = append(extractedVars, v)
			}
		}
	}

	// 3. Detect Secrets
	isLikelySecret := d.checkSecret(trimmed)
	if isLikelySecret {
		tagsMap["secret"] = true
		title := d.generateTitle(trimmed, "Secret / API Key")
		return domain.DetectContentResponse{
			SuggestedTitle:   title,
			DetectedType:     domain.SnippetTypeSecret,
			DetectedLanguage: "secret",
			AutoTags:         mapToSlice(tagsMap),
			ExtractedVars:    extractedVars,
			IsLikelySecret:   true,
		}
	}

	// 4. Detect AI Prompts
	isPrompt, promptTags := d.checkPrompt(trimmed, len(extractedVars) > 0)
	if isPrompt {
		for _, t := range promptTags {
			tagsMap[t] = true
		}
		title := d.generateTitle(trimmed, "AI Prompt")
		return domain.DetectContentResponse{
			SuggestedTitle:   title,
			DetectedType:     domain.SnippetTypePrompt,
			DetectedLanguage: "prompt",
			AutoTags:         mapToSlice(tagsMap),
			ExtractedVars:    extractedVars,
			IsLikelySecret:   false,
		}
	}

	// 5. Detect Code Language
	lang, codeTags := d.checkCodeLanguage(trimmed)
	if lang != "" {
		for _, t := range codeTags {
			tagsMap[t] = true
		}
		tagsMap[lang] = true
		title := d.generateTitle(trimmed, strings.ToUpper(lang)+" Snippet")
		return domain.DetectContentResponse{
			SuggestedTitle:   title,
			DetectedType:     domain.SnippetTypeCode,
			DetectedLanguage: lang,
			AutoTags:         mapToSlice(tagsMap),
			ExtractedVars:    extractedVars,
			IsLikelySecret:   false,
		}
	}

	// 6. Default: Note / Markdown
	tagsMap["note"] = true
	lang = "markdown"
	if !strings.ContainsAny(trimmed, "#*`_[]") {
		lang = "plaintext"
	}
	title := d.generateTitle(trimmed, "Quick Note")

	return domain.DetectContentResponse{
		SuggestedTitle:   title,
		DetectedType:     domain.SnippetTypeNote,
		DetectedLanguage: lang,
		AutoTags:         mapToSlice(tagsMap),
		ExtractedVars:    extractedVars,
		IsLikelySecret:   false,
	}
}

func (d *ContentDetector) checkSecret(content string) bool {
	if jwtRegex.MatchString(content) {
		return true
	}
	if apiKeyRegex.MatchString(content) {
		return true
	}
	if connStrRegex.MatchString(content) {
		return true
	}
	if strings.Contains(content, "-----BEGIN RSA PRIVATE KEY-----") ||
		strings.Contains(content, "-----BEGIN OPENSSH PRIVATE KEY-----") ||
		strings.Contains(content, "-----BEGIN PRIVATE KEY-----") ||
		strings.HasPrefix(content, "ssh-rsa ") ||
		strings.HasPrefix(content, "ssh-ed25519 ") {
		return true
	}
	return false
}

func (d *ContentDetector) checkPrompt(content string, hasVariables bool) (bool, []string) {
	lower := strings.ToLower(content)
	var tags []string

	if hasVariables {
		tags = append(tags, "prompt", "template")
		return true, tags
	}

	promptKeywords := []string{
		"you are an expert", "you are a helpful", "act as a", "system prompt",
		"your task is to", "respond in json", "respond with json",
		"write a prompt", "generate a prompt", "you will act as",
		"as an ai", "role:", "instruction:", "instructions:",
		"temperature:", "context:", "format output as",
		"ты — опытный", "ты опытный", "действуй как", "твоя задача",
		"напиши промпт", "системный промпт", "отвечай в формате",
	}

	matchedCount := 0
	for _, kw := range promptKeywords {
		if strings.Contains(lower, kw) {
			matchedCount++
		}
	}

	if matchedCount >= 1 {
		tags = append(tags, "prompt")
		if strings.Contains(lower, "system") || strings.Contains(lower, "системный") {
			tags = append(tags, "system-prompt")
		}
		if strings.Contains(lower, "claude") || strings.Contains(lower, "gpt") || strings.Contains(lower, "midjourney") {
			tags = append(tags, "ai")
		}
		return true, tags
	}

	return false, nil
}

func (d *ContentDetector) checkCodeLanguage(content string) (string, []string) {
	lower := strings.ToLower(content)

	// JSON check
	if (strings.HasPrefix(content, "{") && strings.HasSuffix(content, "}")) ||
		(strings.HasPrefix(content, "[") && strings.HasSuffix(content, "]")) {
		var js interface{}
		if json.Unmarshal([]byte(content), &js) == nil {
			return "json", []string{"json", "api"}
		}
	}

	// Go
	if (strings.Contains(content, "package ") && strings.Contains(content, "import ")) ||
		(strings.Contains(content, "func ") && strings.Contains(content, "()")) ||
		(strings.Contains(content, ":=") && strings.Contains(content, "fmt.")) {
		return "go", []string{"golang", "backend"}
	}

	// Python
	if (strings.Contains(content, "def ") && strings.Contains(content, ":\n")) ||
		(strings.Contains(content, "import ") && strings.Contains(content, "from ")) ||
		(strings.Contains(content, "if __name__ == '__main__':") || strings.Contains(content, "class ") && strings.Contains(content, ":\n")) {
		return "python", []string{"python", "script"}
	}

	// SQL
	sqlKeywords := []string{"select ", "insert into ", "create table ", "alter table ", "update ", "delete from ", "drop table "}
	for _, kw := range sqlKeywords {
		if strings.HasPrefix(lower, kw) || strings.Contains(lower, "\n"+kw) {
			return "sql", []string{"database", "sql"}
		}
	}

	// Bash / Shell
	if strings.HasPrefix(content, "#!/bin/bash") || strings.HasPrefix(content, "#!/bin/sh") ||
		strings.HasPrefix(content, "curl ") || strings.HasPrefix(content, "chmod ") ||
		strings.HasPrefix(content, "docker run ") || strings.HasPrefix(content, "docker compose") ||
		strings.HasPrefix(content, "npm run ") || strings.HasPrefix(content, "git clone ") {
		return "bash", []string{"shell", "cli", "devops"}
	}

	// Dockerfile
	if strings.HasPrefix(content, "FROM ") || (strings.Contains(content, "FROM ") && strings.Contains(content, "WORKDIR ")) {
		return "dockerfile", []string{"docker", "devops"}
	}

	// YAML
	if (strings.Contains(content, "apiVersion:") && strings.Contains(content, "kind:")) ||
		(strings.Contains(content, "version:") && strings.Contains(content, "services:")) {
		return "yaml", []string{"yaml", "config"}
	}

	// HTML
	if strings.HasPrefix(lower, "<!doctype html") || (strings.Contains(lower, "<html") && strings.Contains(lower, "</html>")) ||
		(strings.Contains(lower, "<div") && strings.Contains(lower, "</div>")) {
		return "html", []string{"frontend", "html"}
	}

	// CSS
	if (strings.Contains(content, "display: flex") || strings.Contains(content, "margin:") || strings.Contains(content, "@media")) && strings.Contains(content, "{") {
		return "css", []string{"frontend", "styling"}
	}

	// TypeScript / JavaScript
	if (strings.Contains(content, "const ") || strings.Contains(content, "let ") || strings.Contains(content, "function ")) &&
		(strings.Contains(content, "=>") || strings.Contains(content, "return") || strings.Contains(content, "console.log")) {
		if strings.Contains(content, ": string") || strings.Contains(content, ": number") || strings.Contains(content, "interface ") || strings.Contains(content, ": React.FC") {
			return "typescript", []string{"typescript", "js"}
		}
		return "javascript", []string{"javascript", "js"}
	}

	return "", nil
}

func (d *ContentDetector) generateTitle(content, defaultPrefix string) string {
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		// Strip comment markers or Markdown headers
		cleaned := strings.TrimLeft(trimmed, "#/* -<!>")
		cleaned = strings.TrimSpace(cleaned)
		if cleaned != "" {
			runes := []rune(cleaned)
			if len(runes) > 60 {
				return string(runes[:57]) + "..."
			}
			return string(runes)
		}
	}
	return defaultPrefix
}

func mapToSlice(m map[string]bool) []string {
	var result []string
	for k := range m {
		k = strings.TrimSpace(strings.ToLower(k))
		if k != "" {
			// strip # if attached
			k = strings.TrimPrefix(k, "#")
			// only keep alphanumeric and hyphens
			var clean strings.Builder
			for _, r := range k {
				if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '-' || r == '_' {
					clean.WriteRune(r)
				}
			}
			s := clean.String()
			if s != "" {
				result = append(result, s)
			}
		}
	}
	return result
}
