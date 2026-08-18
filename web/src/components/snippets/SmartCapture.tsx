import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Code, 
  KeyRound, 
  FileText, 
  Plus, 
  X, 
  CornerDownLeft, 
  Variable, 
  Hash
} from 'lucide-react';
import type { SnippetType, DetectResponse } from '../../types';
import { useI18n } from '../../context/LanguageContext';
import { api } from '../../services/api';

export interface SmartCaptureProps {
  onSnippetCreated: () => void;
}

export const SmartCapture: React.FC<SmartCaptureProps> = ({ onSnippetCreated }) => {
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [detectedType, setDetectedType] = useState<SnippetType>('note');
  const [language, setLanguage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [extractedVars, setExtractedVars] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const debounceTimeout = useRef<any>(null);

  // Auto-detect on input
  useEffect(() => {
    if (!content.trim()) {
      setDetectedType('note');
      setLanguage('');
      setTags([]);
      setExtractedVars([]);
      return;
    }

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res: DetectResponse = await api.detect(content);
        setDetectedType(res.detected_type);
        setLanguage(res.detected_language);
        if (!title && res.suggested_title) {
          setTitle(res.suggested_title);
        }
        setTags(res.auto_tags || []);
        setExtractedVars(res.extracted_vars || []);
      } catch {
        // Fallback
      }
    }, 280);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [content]);

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = customTagInput.trim().toLowerCase().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setCustomTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!content.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await api.createSnippet({
        content: content.trim(),
        title: title.trim() || undefined,
        type: detectedType,
        language: language.trim() || undefined,
        tags,
      });

      setContent('');
      setTitle('');
      setTags([]);
      setExtractedVars([]);
      setIsFocused(false);
      onSnippetCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const getTypeIcon = () => {
    switch (detectedType) {
      case 'prompt':
        return <Sparkles size={13} />;
      case 'code':
        return <Code size={13} />;
      case 'secret':
        return <KeyRound size={13} />;
      default:
        return <FileText size={13} />;
    }
  };

  const getTypeName = () => {
    switch (detectedType) {
      case 'prompt':
        return t.typePrompt;
      case 'code':
        return language ? `${t.typeCode} (${language})` : t.typeCode;
      case 'secret':
        return t.typeSecret;
      default:
        return t.typeNote;
    }
  };

  return (
    <div
      className="panel-card"
      style={{
        padding: '12px 14px',
        marginBottom: '16px',
        borderColor: isFocused ? 'var(--border-focus)' : 'var(--border)',
      }}
    >
      {/* Title (Shows when focused or content exists) */}
      {(isFocused || content.trim()) && (
        <input
          type="text"
          placeholder={t.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '4px 0 8px 0',
            marginBottom: '8px',
            color: 'var(--text)',
            fontSize: '13.5px',
            fontWeight: '600',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      )}

      {/* Main Content Input */}
      <textarea
        placeholder={t.capturePlaceholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        className="font-mono"
        style={{
          width: '100%',
          minHeight: isFocused || content.length > 80 ? '90px' : '44px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          fontSize: '13px',
          lineHeight: '1.45',
          resize: 'vertical',
          outline: 'none',
        }}
      />

      {/* Meta Footer: Detected Type, Variables, Tags, Action Controls */}
      {content.trim() && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '6px' }}>
          
          {/* Metadata Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
              
              {/* Type Badge */}
              <span className={`badge badge-${detectedType}`}>
                {getTypeIcon()}
                <span>{getTypeName()}</span>
              </span>

              {/* Extracted Prompt Variables */}
              {extractedVars.map((v) => (
                <span key={v} className="var-chip" title="Template parameter">
                  <Variable size={10} />
                  <span>{`{{${v}}}`}</span>
                </span>
              ))}

              {/* Tags */}
              {tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  #{tag}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag)} />
                </span>
              ))}

              {/* Tag Input */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Hash size={11} color="var(--text-dim)" />
                <input
                  type="text"
                  placeholder={t.addTagPlaceholder}
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text)',
                    fontSize: '11px',
                    width: '65px',
                    outline: 'none',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>

            {/* Save Shortcut Hint */}
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CornerDownLeft size={11} /> {t.saveShortcut}
            </span>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '12px', padding: '4px 8px' }}
              onClick={() => {
                setContent('');
                setTitle('');
                setTags([]);
                setExtractedVars([]);
                setIsFocused(false);
              }}
            >
              {t.clearInput}
            </button>

            <button
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '4px 12px' }}
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
            >
              {isSaving ? (
                <span>{t.saving}</span>
              ) : (
                <>
                  <Plus size={13} />
                  <span>{t.saveToVault}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
