import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  X, 
  Tag as TagIcon,
  Variable
} from 'lucide-react';
import type { SnippetType, DetectResponse } from '../types';
import { api } from '../lib/api';
import { useI18n } from '../context/LanguageContext';

interface SmartCaptureProps {
  onSnippetCreated: () => void;
}

export const SmartCapture: React.FC<SmartCaptureProps> = ({ onSnippetCreated }) => {
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SnippetType>('note');
  const [language, setLanguage] = useState('plaintext');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto detect when content changes
  useEffect(() => {
    if (!content.trim()) {
      setType('note');
      setLanguage('plaintext');
      setVariables([]);
      setTags([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res: DetectResponse = await api.detectContent(content);
        setType(res.detected_type);
        setLanguage(res.detected_language);
        setVariables(res.extracted_vars || []);
        
        setTags(prev => {
          const combined = Array.from(new Set([...res.auto_tags, ...prev]));
          return combined;
        });

        if (!title && res.suggested_title) {
          setTitle(res.suggested_title);
        }
      } catch (err) {
        console.error('Detection error', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [content]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = newTagInput.trim().toLowerCase().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setNewTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.createSnippet({
        title: title.trim() || undefined,
        content: content.trim(),
        type,
        language,
        tags,
      });

      // Reset form
      setContent('');
      setTitle('');
      setTags([]);
      setVariables([]);
      onSnippetCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadgeClass = (tVal: SnippetType) => {
    switch (tVal) {
      case 'prompt': return 'badge-prompt';
      case 'code': return 'badge-code';
      case 'secret': return 'badge-secret';
      default: return 'badge-note';
    }
  };

  return (
    <div className="panel-card" style={{ padding: '14px 16px', marginBottom: '20px' }}>
      
      {/* Title Bar if content is entered */}
      {content.trim().length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            className="input-field"
            style={{ fontSize: '13.5px', fontWeight: '500', height: '34px' }}
            placeholder={t.titlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      )}

      {/* Main Quick Drop Textarea */}
      <div>
        <textarea
          ref={textareaRef}
          className="input-field font-mono"
          style={{
            minHeight: content ? '110px' : '64px',
            resize: 'vertical',
            fontSize: '13px',
            lineHeight: '1.5',
            padding: '10px 12px',
          }}
          placeholder={t.capturePlaceholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Live Auto-Detection & Tagging Bar */}
      {content.trim().length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Metadata Badges & Type Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              
              {/* Type Switcher */}
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SnippetType)}
                className={`badge ${getTypeBadgeClass(type)}`}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <option value="prompt">{t.typePrompt}</option>
                <option value="code">{t.typeCode}</option>
                <option value="secret">{t.typeSecret}</option>
                <option value="note">{t.typeNote}</option>
              </select>

              {/* Language Tag */}
              {type === 'code' && (
                <input
                  type="text"
                  className="tag-chip"
                  style={{ width: '80px', padding: '2px 6px', fontSize: '11px', textAlign: 'center' }}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value.toLowerCase())}
                  placeholder="lang"
                />
              )}

              {/* Extracted Variables for Prompts */}
              {variables.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{t.variables}</span>
                  {variables.map((v) => (
                    <span key={v} className="var-chip">
                      <Variable size={10} />
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              Ctrl+Enter
            </span>
          </div>

          {/* Tags Cloud & Tag Input */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
            <TagIcon size={12} color="var(--text-dim)" />
            {tags.map((tag) => (
              <span key={tag} className="tag-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                #{tag}
                <X
                  size={11}
                  style={{ cursor: 'pointer', opacity: 0.7 }}
                  onClick={() => handleRemoveTag(tag)}
                />
              </span>
            ))}
            <input
              type="text"
              className="tag-chip"
              style={{ width: '100px', background: 'transparent', border: '1px dashed var(--border)', outline: 'none' }}
              placeholder={t.addTagPlaceholder}
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
          </div>
        </div>
      )}

      {/* Action Footer */}
      {content.trim().length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '12.5px', padding: '5px 10px' }}
            onClick={() => {
              setContent('');
              setTitle('');
              setTags([]);
              setVariables([]);
            }}
          >
            {t.clearInput}
          </button>
          <button
            className="btn btn-primary"
            style={{ fontSize: '12.5px', padding: '5px 12px' }}
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            <Send size={13} />
            <span>{isSubmitting ? t.saving : t.saveToVault}</span>
          </button>
        </div>
      )}
    </div>
  );
};
