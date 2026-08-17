import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Play } from 'lucide-react';
import type { Snippet } from '../types';
import { useI18n } from '../context/LanguageContext';

interface PromptRunnerModalProps {
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

        <div style={{ padding: '18px' }}>
          <div style={{ marginBottom: '14px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {t.promptRunnerSubtitle}
          </div>

          {/* Variables Inputs Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {snippet.variables && snippet.variables.map((v) => (
              <div key={v}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'monospace' }}>
                  {`{{${v}}}`}
                </label>
                <input
                  type="text"
                  className="input-field font-mono"
                  placeholder={`value for ${v}...`}
                  value={variables[v] || ''}
                  onChange={(e) => handleVarChange(v, e.target.value)}
                  autoFocus={snippet.variables[0] === v}
                />
              </div>
            ))}
          </div>

          {/* Live Preview */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '5px' }}>
              {t.renderedPreview}
            </label>
            <pre
              className="font-mono"
              style={{
                background: 'var(--bg-subtle)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)',
                fontSize: '12.5px',
                lineHeight: '1.5',
                maxHeight: '180px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--text)',
              }}
            >
              {renderedContent}
            </pre>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <button className="btn btn-ghost" onClick={onClose}>
              {t.cancel}
            </button>
            <button
              className={`btn ${copied ? 'btn-copied' : 'btn-primary'}`}
              onClick={handleCopy}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? t.copied : t.copyInterpolated}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
