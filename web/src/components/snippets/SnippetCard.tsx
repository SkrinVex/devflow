import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Pin, 
  Star, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Play, 
  Variable,
  FileCode,
  CopyCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Snippet, SnippetType } from '../../types';
import { useI18n } from '../../context/LanguageContext';
import { highlightCode } from '../../lib/highlighter';

export interface SnippetCardProps {
  snippet: Snippet;
  onCopy: (content: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (snippet: Snippet) => void;
  onRunPrompt: (snippet: Snippet) => void;
  onTagClick: (tag: string) => void;
}

export const SnippetCard: React.FC<SnippetCardProps> = ({
  snippet,
  onCopy,
  onTogglePin,
  onToggleFavorite,
  onEdit,
  onDelete,
  onDuplicate,
  onRunPrompt,
  onTagClick,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [isSecretRevealed, setIsSecretRevealed] = useState(false);
  const [isLongExpanded, setIsLongExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.content);
    setCopied(true);
    onCopy(snippet.content);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleCopyMarkdown = () => {
    const lang = snippet.language || (snippet.type === 'code' ? 'text' : '');
    const md = `\`\`\`${lang}\n${snippet.content}\n\`\`\``;
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 1800);
  };

  const getTypeBadge = (type: SnippetType) => {
    switch (type) {
      case 'prompt':
        return <span className="badge badge-prompt">{t.typePrompt}</span>;
      case 'code':
        return <span className="badge badge-code">{snippet.language || 'code'}</span>;
      case 'secret':
        return <span className="badge badge-secret">{t.typeSecret}</span>;
      default:
        return <span className="badge badge-note">{t.typeNote}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const isSecret = snippet.type === 'secret';
  const hasVariables = snippet.type === 'prompt' && snippet.variables && snippet.variables.length > 0;
  const isCodeOrPrompt = snippet.type === 'code' || snippet.type === 'prompt';
  const isLongContent = snippet.content.length > 450 || snippet.content.split('\n').length > 10;

  // Syntax highlighting
  const highlightedHTML = isCodeOrPrompt
    ? highlightCode(snippet.content, snippet.language || (snippet.type === 'code' ? 'javascript' : 'markdown'))
    : null;

  return (
    <div
      className="panel-card"
      style={{
        padding: '14px 16px',
        marginBottom: '12px',
        borderLeft: snippet.is_pinned ? '2.5px solid var(--text)' : undefined,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {getTypeBadge(snippet.type)}
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text)' }}>
            {snippet.title}
          </span>
        </div>

        {/* Quick Actions (Pin, Star, Duplicate, Edit, Delete) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => onTogglePin(snippet.id)}
            title={snippet.is_pinned ? t.unpin : t.pin}
            style={{ color: snippet.is_pinned ? 'var(--text)' : 'var(--text-dim)' }}
          >
            <Pin size={14} style={{ fill: snippet.is_pinned ? 'var(--text)' : 'none' }} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => onToggleFavorite(snippet.id)}
            title={snippet.is_favorite ? t.removeFromFavorites : t.addToFavorites}
            style={{ color: snippet.is_favorite ? '#fcd34d' : 'var(--text-dim)' }}
          >
            <Star size={14} style={{ fill: snippet.is_favorite ? '#fcd34d' : 'none' }} />
          </button>
          {onDuplicate && (
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => onDuplicate(snippet)}
              title={t.duplicate}
            >
              <CopyCheck size={14} />
            </button>
          )}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => onEdit(snippet)}
            title={t.edit}
          >
            <Edit3 size={14} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => onDelete(snippet.id)}
            title={t.delete}
            style={{ color: 'var(--text-dim)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div style={{ position: 'relative', margin: '6px 0 10px 0' }}>
        {isSecret && !isSecretRevealed ? (
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'monospace',
              color: 'var(--text-dim)',
              fontSize: '12.5px',
            }}
          >
            <span>••••••••••••••••••••••••••••••••</span>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '11px', padding: '3px 6px' }}
              onClick={() => setIsSecretRevealed(true)}
            >
              <Eye size={13} /> {t.reveal}
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <pre
              className="font-mono"
              style={{
                background: 'var(--bg-subtle)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)',
                fontSize: '12.5px',
                lineHeight: '1.5',
                maxHeight: isLongContent && !isLongExpanded ? '200px' : 'none',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--text)',
                margin: 0,
              }}
            >
              {highlightedHTML ? (
                <code dangerouslySetInnerHTML={{ __html: highlightedHTML }} />
              ) : (
                snippet.content
              )}
            </pre>

            {isLongContent && (
              <div style={{
                position: isLongExpanded ? 'relative' : 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: isLongExpanded ? 'transparent' : 'linear-gradient(transparent, var(--bg-subtle) 70%)',
                paddingTop: isLongExpanded ? '4px' : '24px',
                display: 'flex',
                justifyContent: 'center',
              }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  onClick={() => setIsLongExpanded(!isLongExpanded)}
                >
                  {isLongExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  <span>{isLongExpanded ? 'Свернуть' : 'Развернуть'}</span>
                </button>
              </div>
            )}

            {isSecret && isSecretRevealed && (
              <button
                className="btn btn-ghost"
                style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '11px', padding: '2px 6px' }}
                onClick={() => setIsSecretRevealed(false)}
              >
                <EyeOff size={12} /> {t.hide}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tags & Variables Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
          {snippet.tags && snippet.tags.map((tag) => (
            <span
              key={tag}
              className="tag-chip"
              onClick={() => onTagClick(tag)}
            >
              #{tag}
            </span>
          ))}

          {snippet.variables && snippet.variables.map((v) => (
            <span key={v} className="var-chip">
              <Variable size={10} />
              <span>{`{{${v}}}`}</span>
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginRight: '4px' }}>
            {formatDate(snippet.created_at)}
          </span>

          {hasVariables && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: '11.5px', padding: '3px 8px' }}
              onClick={() => onRunPrompt(snippet)}
            >
              <Play size={12} />
              <span>{t.runTemplate}</span>
            </button>
          )}

          {isCodeOrPrompt && (
            <button
              className={`btn btn-secondary ${copiedMd ? 'btn-copied' : ''}`}
              style={{ fontSize: '11.5px', padding: '3px 8px' }}
              onClick={handleCopyMarkdown}
              title={t.copyAsMarkdown}
            >
              {copiedMd ? <Check size={12} color="var(--success)" /> : <FileCode size={12} />}
              <span>{copiedMd ? t.markdownCopied : 'MD'}</span>
            </button>
          )}

          <button
            className={`btn btn-secondary ${copied ? 'btn-copied' : ''}`}
            style={{ fontSize: '11.5px', padding: '3px 8px' }}
            onClick={handleCopy}
          >
            {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
            <span>{copied ? t.copied : t.copy}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
