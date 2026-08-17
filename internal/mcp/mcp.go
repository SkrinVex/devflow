package mcp

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Standard JSON-RPC 2.0 structures
type JSONRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      interface{}     `json:"id,omitempty"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type JSONRPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id,omitempty"`
	Result  interface{} `json:"result,omitempty"`
	Error   *RPCError   `json:"error,omitempty"`
}

type RPCError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type Tool struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	InputSchema InputSchema `json:"inputSchema"`
}

type InputSchema struct {
	Type       string                 `json:"type"`
	Properties map[string]PropertyDef `json:"properties"`
	Required   []string               `json:"required,omitempty"`
}

type PropertyDef struct {
	Type        string `json:"type"`
	Description string `json:"description"`
}

type Server struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

func NewServer(baseURL, token string) *Server {
	baseURL = strings.TrimSuffix(baseURL, "/")
	if !strings.HasSuffix(baseURL, "/api/v1") {
		baseURL = baseURL + "/api/v1"
	}

	return &Server{
		baseURL: baseURL,
		token:   token,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (s *Server) RunStdio() error {
	reader := bufio.NewReader(os.Stdin)
	writer := bufio.NewWriter(os.Stdout)

	for {
		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}

		line = bytes.TrimSpace(line)
		if len(line) == 0 {
			continue
		}

		var req JSONRPCRequest
		if err := json.Unmarshal(line, &req); err != nil {
			s.sendError(writer, nil, -32700, "Parse error", err.Error())
			continue
		}

		s.handleRequest(writer, &req)
	}
}

func (s *Server) handleRequest(w *bufio.Writer, req *JSONRPCRequest) {
	switch req.Method {
	case "initialize":
		s.sendResult(w, req.ID, map[string]interface{}{
			"protocolVersion": "2024-11-05",
			"serverInfo": map[string]string{
				"name":    "devflow-mcp",
				"version": "1.0.0",
			},
			"capabilities": map[string]interface{}{
				"tools": map[string]interface{}{},
			},
		})

	case "notifications/initialized", "initialized":
		// No response required for initialized notification

	case "ping":
		s.sendResult(w, req.ID, map[string]string{"status": "pong"})

	case "tools/list":
		s.sendResult(w, req.ID, map[string]interface{}{
			"tools": s.getTools(),
		})

	case "tools/call":
		var callParams struct {
			Name      string                 `json:"name"`
			Arguments map[string]interface{} `json:"arguments"`
		}
		if err := json.Unmarshal(req.Params, &callParams); err != nil {
			s.sendError(w, req.ID, -32602, "Invalid params", err.Error())
			return
		}

		resultText, err := s.executeTool(callParams.Name, callParams.Arguments)
		if err != nil {
			s.sendResult(w, req.ID, map[string]interface{}{
				"content": []map[string]string{
					{
						"type": "text",
						"text": fmt.Sprintf("Error: %v", err),
					},
				},
				"isError": true,
			})
			return
		}

		s.sendResult(w, req.ID, map[string]interface{}{
			"content": []map[string]string{
				{
					"type": "text",
					"text": resultText,
				},
			},
		})

	default:
		s.sendError(w, req.ID, -32601, "Method not found", fmt.Sprintf("Method '%s' not supported", req.Method))
	}
}

func (s *Server) getTools() []Tool {
	return []Tool{
		{
			Name:        "devflow_list_snippets",
			Description: "Search, filter, and list code snippets, AI prompts, secrets, and notes from DevFlow vault.",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]PropertyDef{
					"query":    {Type: "string", Description: "Search query text"},
					"type":     {Type: "string", Description: "Filter by type: 'prompt', 'code', 'secret', or 'note'"},
					"tag":      {Type: "string", Description: "Filter by tag name (without #)"},
					"limit":    {Type: "number", Description: "Max results to return (default: 20)"},
				},
			},
		},
		{
			Name:        "devflow_get_snippet",
			Description: "Get a specific snippet or prompt by ID with full content and metadata.",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]PropertyDef{
					"id": {Type: "string", Description: "Snippet UUID"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "devflow_create_snippet",
			Description: "Save a new AI prompt, code snippet, secret, or note into DevFlow vault with auto-tagging and variable extraction.",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]PropertyDef{
					"content":  {Type: "string", Description: "Content of the snippet or prompt"},
					"title":    {Type: "string", Description: "Optional title (auto-generated if empty)"},
					"type":     {Type: "string", Description: "Optional type: 'prompt', 'code', 'secret', or 'note'"},
					"language": {Type: "string", Description: "Programming language (e.g. 'go', 'python', 'sql', 'bash')"},
				},
				Required: []string{"content"},
			},
		},
		{
			Name:        "devflow_update_snippet",
			Description: "Update an existing snippet's title, content, or metadata in DevFlow.",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]PropertyDef{
					"id":      {Type: "string", Description: "Snippet ID to update"},
					"title":   {Type: "string", Description: "New title"},
					"content": {Type: "string", Description: "New content"},
					"type":    {Type: "string", Description: "New type: 'prompt', 'code', 'secret', 'note'"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "devflow_delete_snippet",
			Description: "Permanently delete a snippet from DevFlow vault by ID.",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]PropertyDef{
					"id": {Type: "string", Description: "Snippet UUID to delete"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "devflow_run_prompt",
			Description: "Render and interpolate a prompt template with given variable parameters ({{variable}}).",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]PropertyDef{
					"id":        {Type: "string", Description: "Prompt snippet ID"},
					"variables": {Type: "object", Description: "Key-value map of variable replacements"},
				},
				Required: []string{"id", "variables"},
			},
		},
		{
			Name:        "devflow_get_tags",
			Description: "Retrieve all available tags in DevFlow with snippet counts.",
			InputSchema: InputSchema{
				Type:       "object",
				Properties: map[string]PropertyDef{},
			},
		},
	}
}

func (s *Server) executeTool(name string, args map[string]interface{}) (string, error) {
	switch name {
	case "devflow_list_snippets":
		params := []string{}
		if q, ok := args["query"].(string); ok && q != "" {
			params = append(params, "q="+q)
		}
		if t, ok := args["type"].(string); ok && t != "" {
			params = append(params, "type="+t)
		}
		if tag, ok := args["tag"].(string); ok && tag != "" {
			params = append(params, "tag="+tag)
		}
		limit := "20"
		if l, ok := args["limit"].(float64); ok && l > 0 {
			limit = fmt.Sprintf("%d", int(l))
		}
		params = append(params, "limit="+limit)

		url := fmt.Sprintf("%s/snippets?%s", s.baseURL, strings.Join(params, "&"))
		return s.doRequest("GET", url, nil)

	case "devflow_get_snippet":
		id, _ := args["id"].(string)
		if id == "" {
			return "", fmt.Errorf("missing 'id' argument")
		}
		url := fmt.Sprintf("%s/snippets/%s", s.baseURL, id)
		return s.doRequest("GET", url, nil)

	case "devflow_create_snippet":
		content, _ := args["content"].(string)
		if content == "" {
			return "", fmt.Errorf("missing 'content' argument")
		}
		payload := map[string]interface{}{
			"content": content,
		}
		if title, ok := args["title"].(string); ok && title != "" {
			payload["title"] = title
		}
		if sType, ok := args["type"].(string); ok && sType != "" {
			payload["type"] = sType
		}
		if lang, ok := args["language"].(string); ok && lang != "" {
			payload["language"] = lang
		}
		url := fmt.Sprintf("%s/snippets", s.baseURL)
		return s.doRequest("POST", url, payload)

	case "devflow_update_snippet":
		id, _ := args["id"].(string)
		if id == "" {
			return "", fmt.Errorf("missing 'id' argument")
		}
		payload := map[string]interface{}{}
		if content, ok := args["content"].(string); ok {
			payload["content"] = content
		}
		if title, ok := args["title"].(string); ok {
			payload["title"] = title
		}
		if sType, ok := args["type"].(string); ok {
			payload["type"] = sType
		}
		url := fmt.Sprintf("%s/snippets/%s", s.baseURL, id)
		return s.doRequest("PUT", url, payload)

	case "devflow_delete_snippet":
		id, _ := args["id"].(string)
		if id == "" {
			return "", fmt.Errorf("missing 'id' argument")
		}
		url := fmt.Sprintf("%s/snippets/%s", s.baseURL, id)
		return s.doRequest("DELETE", url, nil)

	case "devflow_run_prompt":
		id, _ := args["id"].(string)
		if id == "" {
			return "", fmt.Errorf("missing 'id' argument")
		}
		vars, _ := args["variables"].(map[string]interface{})
		payload := map[string]interface{}{
			"variables": vars,
		}
		url := fmt.Sprintf("%s/snippets/%s/run", s.baseURL, id)
		return s.doRequest("POST", url, payload)

	case "devflow_get_tags":
		url := fmt.Sprintf("%s/tags", s.baseURL)
		return s.doRequest("GET", url, nil)

	default:
		return "", fmt.Errorf("unknown tool: %s", name)
	}
}

func (s *Server) doRequest(method, url string, body interface{}) (string, error) {
	var bodyReader io.Reader
	if body != nil {
		jsonBytes, err := json.Marshal(body)
		if err != nil {
			return "", err
		}
		bodyReader = bytes.NewReader(jsonBytes)
	}

	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "DevFlow-MCP/1.0")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(respBytes))
	}

	// Prettify JSON output for AI Agent readability
	var prettyJSON bytes.Buffer
	if err := json.Indent(&prettyJSON, respBytes, "", "  "); err == nil {
		return prettyJSON.String(), nil
	}

	return string(respBytes), nil
}

func (s *Server) sendResult(w *bufio.Writer, id interface{}, result interface{}) {
	resp := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
	}
	data, _ := json.Marshal(resp)
	w.Write(data)
	w.WriteByte('\n')
	w.Flush()
}

func (s *Server) sendError(w *bufio.Writer, id interface{}, code int, message string, data interface{}) {
	resp := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error: &RPCError{
			Code:    code,
			Message: message,
			Data:    data,
		},
	}
	dataBytes, _ := json.Marshal(resp)
	w.Write(dataBytes)
	w.WriteByte('\n')
	w.Flush()
}
