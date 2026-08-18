import { useState, useCallback } from 'react';
import type { Snippet, SnippetType, TagCount } from '../types';
import { api } from '../services/api';

export const useSnippets = (isAuthenticated: boolean) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [totalSnippets, setTotalSnippets] = useState(0);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<SnippetType | ''>('');
  const [activeTag, setActiveTag] = useState('');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Load Snippets
  const loadSnippets = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.listSnippets({
        q: searchQuery || undefined,
        type: activeType || undefined,
        tag: activeTag || undefined,
        is_pinned: onlyPinned ? true : undefined,
        is_favorite: onlyFavorites ? true : undefined,
        limit: 100,
      });

      let items = res.items || [];
      if (sortOrder === 'oldest') {
        items = [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
      setSnippets(items);
      setTotalSnippets(res.total || 0);
    } catch (err) {
      console.error('Failed to load snippets', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, searchQuery, activeType, activeTag, onlyPinned, onlyFavorites, sortOrder]);

  // Load Tags
  const loadTags = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getTags();
      setTags(res || []);
    } catch (err) {
      console.error('Failed to load tags', err);
    }
  }, [isAuthenticated]);

  // Actions
  const togglePin = useCallback(async (id: string) => {
    try {
      await api.togglePin(id);
      setSnippets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_pinned: !s.is_pinned } : s))
      );
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    try {
      await api.toggleFavorite(id);
      setSnippets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_favorite: !s.is_favorite } : s))
      );
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const deleteSnippet = useCallback(async (id: string) => {
    try {
      await api.deleteSnippet(id);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      setTotalSnippets((prev) => Math.max(0, prev - 1));
      loadTags();
    } catch (err: any) {
      console.error(err);
    }
  }, [loadTags]);

  const duplicateSnippet = useCallback(async (snippet: Snippet) => {
    try {
      const copyTitle = snippet.title.includes('(Copy)') ? snippet.title : `${snippet.title} (Copy)`;
      const created = await api.createSnippet({
        title: copyTitle,
        content: snippet.content,
        type: snippet.type,
        language: snippet.language,
        tags: snippet.tags,
      });
      setSnippets((prev) => [created, ...prev]);
      setTotalSnippets((prev) => prev + 1);
      loadTags();
    } catch (err: any) {
      console.error(err);
    }
  }, [loadTags]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveType('');
    setActiveTag('');
    setOnlyPinned(false);
    setOnlyFavorites(false);
  }, []);

  return {
    snippets,
    setSnippets,
    totalSnippets,
    setTotalSnippets,
    tags,
    setTags,
    loading,
    searchQuery,
    setSearchQuery,
    activeType,
    setActiveType,
    activeTag,
    setActiveTag,
    onlyPinned,
    setOnlyPinned,
    onlyFavorites,
    setOnlyFavorites,
    sortOrder,
    setSortOrder,
    loadSnippets,
    loadTags,
    togglePin,
    toggleFavorite,
    deleteSnippet,
    duplicateSnippet,
    clearFilters,
  };
};
