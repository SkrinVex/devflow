import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Play } from 'lucide-react';
import type { Snippet } from '../../types';
import { useI18n } from '../../context/LanguageContext';

export interface PromptRunnerModalProps {
  snippet: Snippet | null;
  onClose: () => void;
}

export const PromptRunnerModal: React.FC<PromptRunnerModalProps> = ({ snippet, onClose }) => {
  const { t } = useI18n();
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [renderedContent, setRenderedContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!snippet) return;
    const initial: Record<string, string> = {};
    (snippet.variables || []).forEach((v) => {
      initial[v] = '';
    });
    setVariables(initial);
  }, [snippet]);

  useEffect(() => {
    if (!snippet) return;
    let result = snippet.content;
    Object.entries(variables).forEach(([k, v]) => {
      const val = v || `{{${k}}}`;
      result = result.split(`{{${k}}}`).join(val);
    });
    setRenderedContent(result);
  }, [snippet, variables]);

  if (!snippet) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVarChange = (key: string, val: string) => {
    setVariables((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={15} />
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>{t.promptRunnerTitle}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
              {t.templateLabel}
            </span>
            <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text)', marginTop: '2px' }}>
              {snippet.title}
            </div>
          </div>

          {/* Variables Inputs */}
          {snippet.variables && snippet.variables.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                {t.fillVariables}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {snippet.variables.map((v) => (
                  <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontFamily: 'monospace',
                        color: 'var(--badge-prompt-text)',
                        background: 'var(--badge-prompt-bg)',
                        border: '1px solid var(--badge-prompt-border)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-xs)',
                        minWidth: '90px',
                      }}
                    >
                      {v}
                    </span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={`Enter value for ${v}`}
                      value={variables[v] || ''}
                      onChange={(e) => handleVarChange(v, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rendered Preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                {t.interpolatedPreview}
              </span>
              <button
                className={`btn btn-secondary ${copied ? 'btn-copied' : ''}`}
                style={{ fontSize: '11.5px', padding: '3px 8px' }}
                onClick={handleCopy}
              >
                {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                <span>{copied ? t.copied : t.copyInterpolated}</span>
              </button>
            </div>
            <pre
              className="font-mono"
              style={{
                background: 'var(--bg-subtle)',
                padding: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)',
                fontSize: '12.5px',
                lineHeight: '1.5',
                maxHeight: '220px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--text)',
                margin: 0,
              }}
            >
              {renderedContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
