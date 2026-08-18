import React from 'react';
import { Filter, X, Inbox } from 'lucide-react';
import type { Snippet, SnippetType } from '../../types';
import { SnippetCard } from './SnippetCard';
import { useI18n } from '../../context/LanguageContext';

export interface SnippetListProps {
  snippets: Snippet[];
  loading: boolean;
  searchQuery: string;
  activeType: SnippetType | '';
  activeTag: string;
  onlyPinned: boolean;
  onlyFavorites: boolean;
  sortOrder: 'newest' | 'oldest';
  onSearchChange: (q: string) => void;
  onTypeChange: (type: SnippetType | '') => void;
  onTagChange: (tag: string) => void;
  onToggleOnlyPinned: () => void;
  onToggleOnlyFavorites: () => void;
  onSortChange: (sort: 'newest' | 'oldest') => void;
  onClearFilters: () => void;
  onCopy: (content: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (snippet: Snippet) => void;
  onRunPrompt: (snippet: Snippet) => void;
}

export const SnippetList: React.FC<SnippetListProps> = ({
  snippets,
  loading,
  searchQuery,
  activeType,
  activeTag,
  onlyPinned,
  onlyFavorites,
  sortOrder,
  onSearchChange,
  onTypeChange,
  onTagChange,
  onToggleOnlyPinned,
  onToggleOnlyFavorites,
  onSortChange,
  onClearFilters,
  onCopy,
  onTogglePin,
  onToggleFavorite,
  onEdit,
  onDelete,
  onDuplicate,
  onRunPrompt,
}) => {
  const { t } = useI18n();

  const hasActiveFilters = !!(searchQuery || activeType || activeTag || onlyPinned || onlyFavorites);

  return (
    <div>
      {/* Filter & Sort Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        {hasActiveFilters ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 7px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border)',
              fontSize: '11px',
            }}
          >
            <Filter size={11} color="var(--text-muted)" />
            {searchQuery && (
              <span className="tag-chip">
                "{searchQuery}"
                <X size={10} style={{ cursor: 'pointer' }} onClick={() => onSearchChange('')} />
              </span>
            )}
            {activeType && (
              <span className="tag-chip">
                {activeType}
                <X size={10} style={{ cursor: 'pointer' }} onClick={() => onTypeChange('')} />
              </span>
            )}
            {activeTag && (
              <span className="tag-chip">
                #{activeTag}
                <X size={10} style={{ cursor: 'pointer' }} onClick={() => onTagChange('')} />
              </span>
            )}
            {onlyPinned && (
              <span className="tag-chip">
                {t.pinnedOnly}
                <X size={10} style={{ cursor: 'pointer' }} onClick={onToggleOnlyPinned} />
              </span>
            )}
            {onlyFavorites && (
              <span className="tag-chip">
                {t.starredOnly}
                <X size={10} style={{ cursor: 'pointer' }} onClick={onToggleOnlyFavorites} />
              </span>
            )}
            <button
              onClick={onClearFilters}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '10.5px',
                marginLeft: '2px',
              }}
            >
              {t.clearAll}
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Sort Order Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{t.sortBy}</span>
          <select
            className="tag-chip"
            style={{ outline: 'none', cursor: 'pointer', padding: '3px 6px', fontSize: '11px' }}
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest')}
          >
            <option value="newest">{t.sortNewest}</option>
            <option value="oldest">{t.sortOldest}</option>
          </select>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-dim)', fontSize: '13px' }}>
          {t.loadingSnippets}
        </div>
      ) : snippets.length === 0 ? (
        <div className="panel-card" style={{ padding: '36px 18px', textAlign: 'center' }}>
          <Inbox size={30} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            {hasActiveFilters ? t.noFilterMatchTitle : t.vaultEmptyTitle}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto 12px auto' }}>
            {hasActiveFilters ? t.noFilterMatchSubtitle : t.vaultEmptySubtitle}
          </p>
          {hasActiveFilters && (
            <button className="btn btn-secondary" onClick={onClearFilters} style={{ fontSize: '11.5px' }}>
              {t.resetFilters}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onCopy={onCopy}
              onTogglePin={onTogglePin}
              onToggleFavorite={onToggleFavorite}
              onDuplicate={onDuplicate}
              onEdit={onEdit}
              onDelete={onDelete}
              onRunPrompt={onRunPrompt}
              onTagClick={onTagChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
