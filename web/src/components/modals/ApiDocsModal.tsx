import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  Key, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Lock, 
  FileCode, 
  Database,
  Bot,
  Layers
} from 'lucide-react';
import { useI18n } from '../../context/LanguageContext';

export interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EndpointDoc {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  group: 'auth' | 'snippets' | 'prompts' | 'vault';
  summary: string;
  authRequired: boolean;
  requestBody?: string;
  responseBody: string;
  curlExample: string;
  jsExample: string;
  pyExample: string;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<'rest' | 'mcp'>('rest');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedMcpConfig, setCopiedMcpConfig] = useState<string | null>(null);
  const [activeTabCode, setActiveTabCode] = useState<'curl' | 'js' | 'py'>('curl');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'auth' | 'snippets' | 'prompts' | 'vault'>('all');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string>('create-snippet');

  const token = localStorage.getItem('devflow_token') || 'YOUR_JWT_BEARER_TOKEN';
  const origin = window.location.origin;
  const baseUrl = origin + '/api/v1';

  if (!isOpen) return null;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyConfig = (configKey: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMcpConfig(configKey);
    setTimeout(() => setCopiedMcpConfig(null), 2000);
  };

  const claudeDesktopConfig = JSON.stringify({
    mcpServers: {
      devflow: {
        command: "devflow",
        args: ["mcp", `--url=${origin}`, `--token=${token}`],
        env: {
          DEVFLOW_URL: origin,
          DEVFLOW_TOKEN: token
        }
      }
    }
  }, null, 2);

  const cursorMcpConfig = JSON.stringify({
    mcpServers: {
      devflow: {
        command: "devflow",
        args: ["mcp"],
        env: {
          DEVFLOW_URL: origin,
          DEVFLOW_TOKEN: token
        }
      }
    }
  }, null, 2);

  const endpoints: EndpointDoc[] = [
    {
      id: 'create-snippet',
      method: 'POST',
      path: '/snippets',
      group: 'snippets',
      summary: 'Create a snippet, AI prompt, code or AES-256-GCM encrypted secret',
      authRequired: true,
      requestBody: JSON.stringify({
        content: "You are an expert in {{framework}}. Write an API router in {{language}} #prompt #ai",
        title: "AI API Builder (Optional)",
        type: "prompt",
        language: "plaintext",
        tags: ["prompt", "ai"]
      }, null, 2),
      responseBody: JSON.stringify({
        success: true,
        message: "Snippet created successfully",
        data: {
          id: "35d87369-5347-4fcd-bef8-43c83d9aa49d",
          title: "AI API Builder",
          content: "You are an expert in {{framework}}...",
          type: "prompt",
          language: "plaintext",
          variables: ["framework", "language"],
          tags: ["prompt", "ai"],
          created_at: "2026-08-18T00:00:00Z"
        }
      }, null, 2),
      curlExample: `curl -X POST "${baseUrl}/snippets" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "You are an expert in {{framework}} #prompt"}'`,
      jsExample: `const res = await fetch("${baseUrl}/snippets", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    content: "You are an expert in {{framework}} #prompt"
  })
});
const data = await res.json();
console.log(data);`,
      pyExample: `import requests

url = "${baseUrl}/snippets"
headers = {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
}
payload = {
    "content": "You are an expert in {{framework}} #prompt"
}
response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    },
    {
      id: 'list-snippets',
      method: 'GET',
      path: '/snippets',
      group: 'snippets',
      summary: 'List and search snippets with filters (type, tag, query)',
      authRequired: true,
      responseBody: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: "35d87369-5347-4fcd-bef8-43c83d9aa49d",
              title: "AI API Builder",
              type: "prompt",
              tags: ["prompt", "ai"],
              is_pinned: false,
              is_favorite: true
            }
          ],
          total: 1,
          limit: 50,
          offset: 0
        }
      }, null, 2),
      curlExample: `curl "${baseUrl}/snippets?q=ai&type=prompt&limit=20" \\
  -H "Authorization: Bearer ${token}"`,
      jsExample: `const res = await fetch("${baseUrl}/snippets?q=ai&type=prompt", {
  headers: { "Authorization": "Bearer ${token}" }
});
const data = await res.json();
console.log(data.data.items);`,
      pyExample: `import requests

res = requests.get("${baseUrl}/snippets?q=ai&type=prompt", headers={
    "Authorization": "Bearer ${token}"
})
print(res.json()["data"]["items"])`,
    },
    {
      id: 'run-prompt',
      method: 'POST',
      path: '/snippets/:id/run',
      group: 'prompts',
      summary: 'Interpolate prompt variables and return rendered prompt',
      authRequired: true,
      requestBody: JSON.stringify({
        variables: {
          framework: "Go Chi",
          language: "Golang"
        }
      }, null, 2),
      responseBody: JSON.stringify({
        success: true,
        data: {
          rendered_content: "You are an expert in Go Chi. Write an API router in Golang #prompt #ai"
        }
      }, null, 2),
      curlExample: `curl -X POST "${baseUrl}/snippets/SNIPPET_ID/run" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"variables": {"framework": "Go Chi"}}'`,
      jsExample: `const res = await fetch("${baseUrl}/snippets/SNIPPET_ID/run", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ variables: { framework: "Go Chi" } })
});
const data = await res.json();
console.log(data.data.rendered_content);`,
      pyExample: `import requests

res = requests.post("${baseUrl}/snippets/SNIPPET_ID/run", json={
    "variables": {"framework": "Go Chi"}
}, headers={"Authorization": "Bearer ${token}"})
print(res.json()["data"]["rendered_content"])`,
    },
    {
      id: 'export-vault',
      method: 'GET',
      path: '/vault/export',
      group: 'vault',
      summary: 'Export complete JSON backup of all user snippets and tags',
      authRequired: true,
      responseBody: JSON.stringify({
        version: "1.0",
        exported_at: "2026-08-18T00:00:00Z",
        user: {
          id: "225088e1-ce1a-4d76-8097-4001d84ea2fb",
          username: "dev",
          email: "dev@example.com"
        },
        snippets: []
      }, null, 2),
      curlExample: `curl "${baseUrl}/vault/export" \\
  -H "Authorization: Bearer ${token}" > devflow_backup.json`,
      jsExample: `const res = await fetch("${baseUrl}/vault/export", {
  headers: { "Authorization": "Bearer ${token}" }
});
const backupJson = await res.json();
console.log(backupJson);`,
      pyExample: `import requests

res = requests.get("${baseUrl}/vault/export", headers={"Authorization": "Bearer ${token}"})
with open("devflow_backup.json", "w") as f:
    f.write(res.text)`,
    },
  ];

  const filteredEndpoints = selectedGroup === 'all'
    ? endpoints
    : endpoints.filter(e => e.group === selectedGroup);

  const getMethodBadgeClass = (m: string) => {
    switch (m) {
      case 'GET': return 'badge-code';
      case 'POST': return 'badge-note';
      case 'PUT': return 'badge-secret';
      case 'DELETE': return 'badge-prompt';
      default: return 'badge-note';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={17} />
            <h3 style={{ fontSize: '14.5px', fontWeight: '600' }}>{t.apiDocsTitle}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Section Switcher: REST API vs MCP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 18px 0 18px', gap: '8px', borderBottom: '1px solid var(--border)' }}>
          <button
            type="button"
            className={`btn ${activeSection === 'rest' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '12.5px', padding: '6px 8px', borderBottom: activeSection === 'rest' ? '2px solid var(--text)' : undefined }}
            onClick={() => setActiveSection('rest')}
          >
            <Layers size={14} />
            <span>{t.tabRestApi}</span>
          </button>
          <button
            type="button"
            className={`btn ${activeSection === 'mcp' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '12.5px', padding: '6px 8px', borderBottom: activeSection === 'mcp' ? '2px solid var(--text)' : undefined }}
            onClick={() => setActiveSection('mcp')}
          >
            <Bot size={14} />
            <span>{t.tabMcp}</span>
          </button>
        </div>

        <div style={{ padding: '16px 18px', overflowY: 'auto', maxHeight: 'calc(85vh - 100px)' }}>
          
          {/* Quick Connection Info Card */}
          <div style={{
            padding: '12px 14px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border)',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>{t.apiBaseUrl}</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{baseUrl}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>{t.apiAuthHeader}</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>Authorization: Bearer &lt;token&gt;</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Key size={12} /> {t.apiYourToken}
              </span>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '2px 8px' }}
                onClick={handleCopyToken}
              >
                {copiedToken ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                <span>{copiedToken ? t.apiTokenCopied : t.apiCopyToken}</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: REST API */}
          {activeSection === 'rest' && (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                {t.apiDocsSubtitle}
              </p>

              {/* Filter Categories */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <button
                  className={`tag-chip ${selectedGroup === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedGroup('all')}
                >
                  All
                </button>
                <button
                  className={`tag-chip ${selectedGroup === 'snippets' ? 'active' : ''}`}
                  onClick={() => setSelectedGroup('snippets')}
                >
                  <FileCode size={11} /> {t.apiGroupSnippets}
                </button>
                <button
                  className={`tag-chip ${selectedGroup === 'prompts' ? 'active' : ''}`}
                  onClick={() => setSelectedGroup('prompts')}
                >
                  <Sparkles size={11} /> {t.apiGroupPrompts}
                </button>
                <button
                  className={`tag-chip ${selectedGroup === 'auth' ? 'active' : ''}`}
                  onClick={() => setSelectedGroup('auth')}
                >
                  <Lock size={11} /> {t.apiGroupAuth}
                </button>
                <button
                  className={`tag-chip ${selectedGroup === 'vault' ? 'active' : ''}`}
                  onClick={() => setSelectedGroup('vault')}
                >
                  <Database size={11} /> {t.apiGroupVault}
                </button>
              </div>

              {/* Endpoints List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredEndpoints.map((ep) => {
                  const isExpanded = expandedEndpoint === ep.id;
                  return (
                    <div
                      key={ep.id}
                      style={{
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        onClick={() => setExpandedEndpoint(isExpanded ? '' : ep.id)}
                        style={{
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: isExpanded ? 'var(--bg-subtle)' : undefined,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className={`badge ${getMethodBadgeClass(ep.method)}`}>
                            {ep.method}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                            {ep.path}
                          </span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                            — {ep.summary}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-dim)' }}>
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                            <button
                              className={`btn ${activeTabCode === 'curl' ? 'btn-secondary' : 'btn-ghost'}`}
                              style={{ fontSize: '11px', padding: '2px 6px' }}
                              onClick={() => setActiveTabCode('curl')}
                            >
                              {t.apiExampleCurl}
                            </button>
                            <button
                              className={`btn ${activeTabCode === 'js' ? 'btn-secondary' : 'btn-ghost'}`}
                              style={{ fontSize: '11px', padding: '2px 6px' }}
                              onClick={() => setActiveTabCode('js')}
                            >
                              {t.apiExampleJs}
                            </button>
                            <button
                              className={`btn ${activeTabCode === 'py' ? 'btn-secondary' : 'btn-ghost'}`}
                              style={{ fontSize: '11px', padding: '2px 6px' }}
                              onClick={() => setActiveTabCode('py')}
                            >
                              {t.apiExamplePy}
                            </button>
                          </div>

                          <pre
                            className="font-mono"
                            style={{
                              background: 'var(--bg-subtle)',
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border)',
                              fontSize: '11.5px',
                              lineHeight: '1.4',
                              maxHeight: '180px',
                              overflowY: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              marginBottom: '10px',
                            }}
                          >
                            {activeTabCode === 'curl' ? ep.curlExample : activeTabCode === 'js' ? ep.jsExample : ep.pyExample}
                          </pre>

                          {ep.requestBody && (
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '3px' }}>
                                {t.apiReqBody}
                              </div>
                              <pre className="font-mono" style={{ background: 'var(--bg-subtle)', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', fontSize: '11px' }}>
                                {ep.requestBody}
                              </pre>
                            </div>
                          )}

                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '3px' }}>
                              {t.apiResponse}
                            </div>
                            <pre className="font-mono" style={{ background: 'var(--bg-subtle)', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--badge-note-text)' }}>
                              {ep.responseBody}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: AI MODEL CONTEXT PROTOCOL (MCP) */}
          {activeSection === 'mcp' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: '600', marginBottom: '4px' }}>{t.mcpTitle}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {t.mcpSubtitle}
                </p>
              </div>

              {/* Claude Desktop Configuration */}
              <div style={{ marginBottom: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: '600' }}>
                    {t.mcpClaudeConfig} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>(claude_desktop_config.json)</span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => handleCopyConfig('claude', claudeDesktopConfig)}
                  >
                    {copiedMcpConfig === 'claude' ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                    <span>{copiedMcpConfig === 'claude' ? t.configCopied : t.copyConfig}</span>
                  </button>
                </div>
                <pre
                  className="font-mono"
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border)',
                    fontSize: '11.5px',
                    lineHeight: '1.4',
                    overflowX: 'auto',
                    color: 'var(--text)',
                  }}
                >
                  {claudeDesktopConfig}
                </pre>
              </div>

              {/* Cursor / VS Code Configuration */}
              <div style={{ marginBottom: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: '600' }}>
                    {t.mcpCursorConfig} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>(mcp.json / .cursor/mcp.json)</span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => handleCopyConfig('cursor', cursorMcpConfig)}
                  >
                    {copiedMcpConfig === 'cursor' ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                    <span>{copiedMcpConfig === 'cursor' ? t.configCopied : t.copyConfig}</span>
                  </button>
                </div>
                <pre
                  className="font-mono"
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border)',
                    fontSize: '11.5px',
                    lineHeight: '1.4',
                    overflowX: 'auto',
                    color: 'var(--text)',
                  }}
                >
                  {cursorMcpConfig}
                </pre>
              </div>

              {/* Tools List for AI Agents */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '600', marginBottom: '8px' }}>
                  {t.mcpToolsList}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', fontSize: '12px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--badge-code-text)' }}>devflow_list_snippets</span>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>Поиск и фильтрация промптов, сниппетов, секретов и заметок по тегу, типу или тексту.</p>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', fontSize: '12px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--badge-prompt-text)' }}>devflow_run_prompt</span>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>Интерполяция параметров шаблона <code>{'{{variable}}'}</code> и возврат готового промпта.</p>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', fontSize: '12px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--badge-note-text)' }}>devflow_create_snippet</span>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>Автоматическое сохранение сгенерированного кода или промпта прямо из чата в хранилище.</p>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', fontSize: '12px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--badge-secret-text)' }}>devflow_get_snippet</span>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>Получение полного содержимого записи (включая расшифрованные AES-256 секреты).</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
