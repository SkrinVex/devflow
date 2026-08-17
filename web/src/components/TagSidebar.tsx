import React from 'react';
import { 
  Sparkles, 
  Code, 
  KeyRound, 
  FileText, 
  Pin, 
  Star, 
  Hash, 
  Layers
} from 'lucide-react';
import type { SnippetType, TagCount } from '../types';
import { useI18n } from '../context/LanguageContext';

interface TagSidebarProps {
  activeType: SnippetType | '';
  onTypeChange: (type: SnippetType | '') => void;
  activeTag: string;
  onTagChange: (tag: string) => void;
  onlyPinned: boolean;
  onToggleOnlyPinned: () => void;
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
  tags: TagCount[];
  totalSnippets: number;
}

export const TagSidebar: React.FC<TagSidebarProps> = ({
  activeType,
  onTypeChange,
  activeTag,
  onTagChange,
  onlyPinned,
  onToggleOnlyPinned,
  onlyFavorites,
  onToggleOnlyFavorites,
  tags,
  totalSnippets,
}) => {
  const { t } = useI18n();
  const isAllActive = activeType === '' && !activeTag && !onlyPinned && !onlyFavorites;

  return (
    <aside className="sidebar" style={{ padding: '16px 12px', overflowY: 'auto' }}>
      
      {/* Views Nav */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.5px', marginBottom: '6px', paddingLeft: '8px' }}>
          {t.vaultViews}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* All Items */}
          <button
            className={`btn ${isAllActive ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              justifyContent: 'space-between',
              width: '100%',
              fontSize: '12.5px',
              padding: '6px 8px',
              background: isAllActive ? 'var(--bg-subtle)' : undefined,
              borderColor: isAllActive ? 'var(--border)' : 'transparent',
            }}
            onClick={() => {
              onTypeChange('');
              onTagChange('');
              if (onlyPinned) onToggleOnlyPinned();
              if (onlyFavorites) onToggleOnlyFavorites();
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Layers size={14} />
              <span>{t.allItems}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'var(--border-subtle)', padding: '1px 5px', borderRadius: 'var(--radius-xs)', fontFamily: 'monospace' }}>
              {totalSnippets}
            </span>
          </button>

          {/* Pinned */}
          <button
            className={`btn ${onlyPinned ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              fontSize: '12.5px',
              padding: '6px 8px',
              background: onlyPinned ? 'var(--bg-subtle)' : undefined,
              borderColor: onlyPinned ? 'var(--border)' : 'transparent',
            }}
            onClick={onToggleOnlyPinned}
          >
            <Pin size={14} style={{ fill: onlyPinned ? 'var(--text)' : 'none' }} />
            <span>{t.pinned}</span>
          </button>

          {/* Favorites */}
          <button
            className={`btn ${onlyFavorites ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              fontSize: '12.5px',
              padding: '6px 8px',
              background: onlyFavorites ? 'var(--bg-subtle)' : undefined,
              borderColor: onlyFavorites ? 'var(--border)' : 'transparent',
            }}
            onClick={onToggleOnlyFavorites}
          >
            <Star size={14} style={{ fill: onlyFavorites ? '#fcd34d' : 'none' }} />
            <span>{t.starred}</span>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.5px', marginBottom: '6px', paddingLeft: '8px' }}>
          {t.categories}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            className={`btn ${activeType === 'prompt' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              fontSize: '12.5px',
              padding: '6px 8px',
              background: activeType === 'prompt' ? 'var(--bg-subtle)' : undefined,
              borderColor: activeType === 'prompt' ? 'var(--border)' : 'transparent',
            }}
            onClick={() => onTypeChange(activeType === 'prompt' ? '' : 'prompt')}
          >
            <Sparkles size={14} />
            <span>{t.prompts}</span>
          </button>

          <button
            className={`btn ${activeType === 'code' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              fontSize: '12.5px',
              padding: '6px 8px',
              background: activeType === 'code' ? 'var(--bg-subtle)' : undefined,
              borderColor: activeType === 'code' ? 'var(--border)' : 'transparent',
            }}
            onClick={() => onTypeChange(activeType === 'code' ? '' : 'code')}
          >
            <Code size={14} />
            <span>{t.codeSnippets}</span>
          </button>

          <button
            className={`btn ${activeType === 'secret' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              fontSize: '12.5px',
              padding: '6px 8px',
              background: activeType === 'secret' ? 'var(--bg-subtle)' : undefined,
              borderColor: activeType === 'secret' ? 'var(--border)' : 'transparent',
            }}
            onClick={() => onTypeChange(activeType === 'secret' ? '' : 'secret')}
          >
            <KeyRound size={14} />
            <span>{t.secrets}</span>
          </button>

          <button
            className={`btn ${activeType === 'note' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              fontSize: '12.5px',
              padding: '6px 8px',
              background: activeType === 'note' ? 'var(--bg-subtle)' : undefined,
              borderColor: activeType === 'note' ? 'var(--border)' : 'transparent',
            }}
            onClick={() => onTypeChange(activeType === 'note' ? '' : 'note')}
          >
            <FileText size={14} />
            <span>{t.notes}</span>
          </button>
        </div>
      </div>

      {/* Tags Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', paddingLeft: '8px', paddingRight: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.5px' }}>
            {t.tags}
          </div>
          {activeTag && (
            <button
              onClick={() => onTagChange('')}
              style={{ fontSize: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              {t.clearTag}
            </button>
          )}
        </div>

        {tags.length === 0 ? (
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', paddingLeft: '8px', lineHeight: '1.4' }}>
            {t.noTags}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {tags.map((tagItem) => (
              <span
                key={tagItem.name}
                className={`tag-chip ${activeTag.toLowerCase() === tagItem.name.toLowerCase() ? 'active' : ''}`}
                onClick={() => onTagChange(activeTag === tagItem.name ? '' : tagItem.name)}
              >
                <Hash size={10} />
                <span>{tagItem.name}</span>
                <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px' }}>{tagItem.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
