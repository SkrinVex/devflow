import Prism from 'prismjs';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';

const langMap: Record<string, string> = {
  go: 'go',
  golang: 'go',
  python: 'python',
  py: 'python',
  sql: 'sql',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  docker: 'docker',
  dockerfile: 'docker',
  md: 'markdown',
  markdown: 'markdown',
};

export function highlightCode(code: string, language: string): string {
  const normalized = langMap[language?.toLowerCase()] || 'plaintext';
  const grammar = Prism.languages[normalized];

  if (!grammar) {
    // Basic HTML escape for plaintext
    return escapeHtml(code);
  }

  try {
    return Prism.highlight(code, grammar, normalized);
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
