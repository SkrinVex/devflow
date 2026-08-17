import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { Snippet, SnippetType } from '../types';
import { useI18n } from '../context/LanguageContext';
import { api } from '../lib/api';

interface SnippetEditModalProps {
  snippet: Snippet | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SnippetEditModal: React.FC<SnippetEditModalProps> = ({
  snippet,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<SnippetType>('note');
  const [language, setLanguage] = useState('plaintext');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title);
      setContent(snippet.content);
      setType(snippet.type);
      setLanguage(snippet.language);
      setTags(snippet.tags || []);
    }
  }, [snippet]);

  if (!isOpen || !snippet) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = newTag.trim().toLowerCase().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setNewTag('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await api.updateSnippet(snippet.id, {
        title: title.trim() || undefined,
        content: content.trim(),
        type,
        language: language.trim() || undefined,
        tags,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600' }}>{t.edit}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Title
              </label>
              <input
                type="text"
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Type & Language */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {t.categories}
                </label>
                <select
                  className="input-field"
                  value={type}
                  onChange={(e) => setType(e.target.value as SnippetType)}
                >
                  <option value="prompt">{t.typePrompt}</option>
                  <option value="code">{t.typeCode}</option>
                  <option value="secret">{t.typeSecret}</option>
                  <option value="note">{t.typeNote}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Language
                </label>
                <input
                  type="text"
                  className="input-field font-mono"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value.toLowerCase())}
                  placeholder="e.g. go, python, sql, ts"
                />
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Content
              </label>
              <textarea
                className="input-field font-mono"
                style={{ minHeight: '160px', resize: 'vertical', fontSize: '12.5px' }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {t.tags}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                {tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                    <X size={11} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag)} />
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="input-field"
                placeholder={t.addTagPlaceholder}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t.cancel}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Check size={14} />
              <span>{loading ? t.saving : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
