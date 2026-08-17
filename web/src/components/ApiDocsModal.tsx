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
  Database 
} from 'lucide-react';
import { useI18n } from '../context/LanguageContext';

interface ApiDocsModalProps {
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
  const [copiedToken, setCopiedToken] = useState(false);
  const [activeTabCode, setActiveTabCode] = useState<'curl' | 'js' | 'py'>('curl');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'auth' | 'snippets' | 'prompts' | 'vault'>('all');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string>('create-snippet');

  const token = localStorage.getItem('devflow_token') || 'YOUR_JWT_BEARER_TOKEN';
  const baseUrl = window.location.origin + '/api/v1';

  if (!isOpen) return null;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const endpoints: EndpointDoc[] = [
    {
      id: 'create-snippet',
      method: 'POST',
      path: '/snippets',
      group: 'snippets',
      summary: 'Create a snippet, AI prompt, code or secret with auto-detection',
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
      id: 'auth-login',
      method: 'POST',
      path: '/auth/login',
      group: 'auth',
      summary: 'Authenticate with username/password to receive JWT token',
      authRequired: false,
      requestBody: JSON.stringify({
        username: "lexa",
        password: "SuperSecure#Password2026!"
      }, null, 2),
      responseBody: JSON.stringify({
        success: true,
        data: {
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          user: {
            id: "225088e1-ce1a-4d76-8097-4001d84ea2fb",
            username: "lexa",
            email: "lexa@devflow.local",
            is_2fa_enabled: false
          }
        }
      }, null, 2),
      curlExample: `curl -X POST "${baseUrl}/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"username": "lexa", "password": "SuperSecure#Password2026!"}'`,
      jsExample: `const res = await fetch("${baseUrl}/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "lexa", password: "SuperSecure#Password2026!" })
});
const data = await res.json();
console.log("Token:", data.data.token);`,
      pyExample: `import requests

res = requests.post("${baseUrl}/auth/login", json={
    "username": "lexa", "password": "SuperSecure#Password2026!"
})
token = res.json()["data"]["token"]
print("Token:", token)`,
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
        user_id: "225088e1-ce1a-4d76-8097-4001d84ea2fb",
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        
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

        <div style={{ padding: '16px 18px', overflowY: 'auto', maxHeight: 'calc(85vh - 60px)' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            {t.apiDocsSubtitle}
          </p>

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

          {/* Filter Categories */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <button
              className={`tag-chip ${selectedGroup === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedGroup('all')}
            >
              All Endpoints
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

          {/* Endpoints Accordion List */}
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
                  {/* Endpoint Row Title */}
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
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        — {ep.summary}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-dim)' }}>
                      {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </div>
                  </div>

                  {/* Expanded Endpoint Documentation */}
                  {isExpanded && (
                    <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
                      {/* Code Examples Tabs */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
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
                      </div>

                      {/* Code Block */}
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
                          marginBottom: '12px',
                          color: 'var(--text)',
                        }}
                      >
                        {activeTabCode === 'curl' ? ep.curlExample : activeTabCode === 'js' ? ep.jsExample : ep.pyExample}
                      </pre>

                      {/* Request Body if present */}
                      {ep.requestBody && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '4px' }}>
                            {t.apiReqBody}
                          </div>
                          <pre
                            className="font-mono"
                            style={{
                              background: 'var(--bg-subtle)',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border)',
                              fontSize: '11.5px',
                              lineHeight: '1.4',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {ep.requestBody}
                          </pre>
                        </div>
                      )}

                      {/* Response Body */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '4px' }}>
                          {t.apiResponse}
                        </div>
                        <pre
                          className="font-mono"
                          style={{
                            background: 'var(--bg-subtle)',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border)',
                            fontSize: '11.5px',
                            lineHeight: '1.4',
                            color: 'var(--badge-note-text)',
                          }}
                        >
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
      </div>
    </div>
  );
};
