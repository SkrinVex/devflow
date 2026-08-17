import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useI18n } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { TagSidebar } from './components/TagSidebar';
import { SmartCapture } from './components/SmartCapture';
import { SnippetCard } from './components/SnippetCard';
import { PromptRunnerModal } from './components/PromptRunnerModal';
import { SnippetEditModal } from './components/SnippetEditModal';
import { AuthModal } from './components/AuthModal';
import { TwoFASetupModal } from './components/TwoFASetupModal';
import { SettingsModal } from './components/SettingsModal';
import type { SettingsTab } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { ApiDocsModal } from './components/ApiDocsModal';
import { ConfirmModal } from './components/ConfirmModal';
import type { Snippet, SnippetType, TagCount } from './types';
import { api } from './lib/api';
import { 
  Layers, 
  Inbox, 
  X,
  Filter,
  Sparkles,
  Code,
  KeyRound,
  FileText,
  Hash
} from 'lucide-react';

const DevFlowApp: React.FC = () => {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const { t } = useI18n();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<SnippetType | ''>('');
  const [activeTag, setActiveTag] = useState('');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Data states
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [totalSnippets, setTotalSnippets] = useState(0);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('security');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);
  const [promptRunnerSnippet, setPromptRunnerSnippet] = useState<Snippet | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);

  // Styled Confirmation Modal for Delete & Logout
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Fetch snippets
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
    } catch (err: any) {
      console.error('Failed to load snippets', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, searchQuery, activeType, activeTag, onlyPinned, onlyFavorites, sortOrder]);

  // Fetch tags
  const loadTags = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getTags();
      setTags(res || []);
    } catch (err) {
      console.error('Failed to load tags', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSnippets();
      loadTags();
    } else {
      setSnippets([]);
      setTags([]);
      setTotalSnippets(0);
    }
  }, [isAuthenticated, loadSnippets, loadTags]);

  const handleTogglePin = async (id: string) => {
    try {
      await api.togglePin(id);
      loadSnippets();
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await api.toggleFavorite(id);
      loadSnippets();
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.deleteSnippet(deleteTargetId);
      showToast(t.itemDeleted);
      loadSnippets();
      loadTags();
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleDuplicate = async (snippet: Snippet) => {
    try {
      await api.createSnippet({
        title: `${snippet.title} (copy)`,
        content: snippet.content,
        type: snippet.type,
        language: snippet.language,
        tags: snippet.tags,
      });
      showToast(t.duplicated);
      loadSnippets();
      loadTags();
    } catch (err: any) {
      showToast('Error duplicating: ' + err.message);
    }
  };

  const handleOpenSettingsWithTab = (tab?: SettingsTab) => {
    if (tab) setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveType('');
    setActiveTag('');
    setOnlyPinned(false);
    setOnlyFavorites(false);
  };

  const hasActiveFilters = searchQuery || activeType || activeTag || onlyPinned || onlyFavorites;

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'monospace', marginBottom: '4px' }}>devflow</div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          right: '16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 1000,
          fontSize: '12.5px',
          fontWeight: '500',
        }}>
          {toastMessage}
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeType={activeType}
        onTypeChange={setActiveType}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSettings={handleOpenSettingsWithTab}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <div className="app-container">
        {/* Sidebar (Desktop) */}
        {isAuthenticated && (
          <TagSidebar
            activeType={activeType}
            onTypeChange={setActiveType}
            activeTag={activeTag}
            onTagChange={setActiveTag}
            onlyPinned={onlyPinned}
            onToggleOnlyPinned={() => setOnlyPinned(!onlyPinned)}
            onlyFavorites={onlyFavorites}
            onToggleOnlyFavorites={() => setOnlyFavorites(!onlyFavorites)}
            tags={tags}
            totalSnippets={totalSnippets}
          />
        )}

        {/* Main Content Area */}
        <main className="main-content">
          <div className="content-wrapper">
            
            {/* Guest View */}
            {!isAuthenticated ? (
              <div className="panel-card" style={{ padding: '32px 20px', textAlign: 'center', marginTop: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  color: 'var(--text)'
                }}>
                  <Layers size={22} />
                </div>
                <h1 style={{ fontSize: '19px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                  {t.heroTitle}
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 18px auto', lineHeight: '1.5' }}>
                  {t.heroSubtitle}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => setIsAuthOpen(true)}>
                    {t.getStarted}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Horizontal Scrolling Tags Bar */}
                {tags.length > 0 && (
                  <div 
                    className="mobile-tags-bar" 
                    style={{ 
                      gap: '5px', 
                      overflowX: 'auto', 
                      paddingBottom: '8px', 
                      marginBottom: '8px',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none',
                    }}
                  >
                    {tags.map((tagItem) => (
                      <span
                        key={tagItem.name}
                        className={`tag-chip ${activeTag.toLowerCase() === tagItem.name.toLowerCase() ? 'active' : ''}`}
                        onClick={() => setActiveTag(activeTag === tagItem.name ? '' : tagItem.name)}
                        style={{ fontSize: '11.5px', padding: '3px 8px' }}
                      >
                        <Hash size={10} />
                        <span>{tagItem.name}</span>
                        <span style={{ fontSize: '9.5px', opacity: 0.6, marginLeft: '2px' }}>{tagItem.count}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Smart Quick Capture Box */}
                <SmartCapture
                  onSnippetCreated={() => {
                    showToast(t.savedToVault);
                    loadSnippets();
                    loadTags();
                  }}
                />

                {/* Filter & Sort Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}>
                  {hasActiveFilters ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 7px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border)',
                      fontSize: '11px',
                    }}>
                      <Filter size={11} color="var(--text-muted)" />
                      {searchQuery && (
                        <span className="tag-chip">
                          "{searchQuery}"
                          <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
                        </span>
                      )}
                      {activeType && (
                        <span className="tag-chip">
                          {activeType}
                          <X size={10} style={{ cursor: 'pointer' }} onClick={() => setActiveType('')} />
                        </span>
                      )}
                      {activeTag && (
                        <span className="tag-chip">
                          #{activeTag}
                          <X size={10} style={{ cursor: 'pointer' }} onClick={() => setActiveTag('')} />
                        </span>
                      )}
                      {onlyPinned && (
                        <span className="tag-chip">
                          {t.pinnedOnly}
                          <X size={10} style={{ cursor: 'pointer' }} onClick={() => setOnlyPinned(false)} />
                        </span>
                      )}
                      {onlyFavorites && (
                        <span className="tag-chip">
                          {t.starredOnly}
                          <X size={10} style={{ cursor: 'pointer' }} onClick={() => setOnlyFavorites(false)} />
                        </span>
                      )}
                      <button
                        onClick={clearAllFilters}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '10.5px', marginLeft: '2px' }}
                      >
                        {t.clearAll}
                      </button>
                    </div>
                  ) : <div />}

                  {/* Sort Order Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{t.sortBy}</span>
                    <select
                      className="tag-chip"
                      style={{ outline: 'none', cursor: 'pointer', padding: '3px 6px', fontSize: '11px' }}
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    >
                      <option value="newest">{t.sortNewest}</option>
                      <option value="oldest">{t.sortOldest}</option>
                    </select>
                  </div>
                </div>

                {/* Feed List */}
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-dim)', fontSize: '13px' }}>
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
                      <button className="btn btn-secondary" onClick={clearAllFilters} style={{ fontSize: '11.5px' }}>
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
                        onCopy={() => showToast(t.copied)}
                        onTogglePin={handleTogglePin}
                        onToggleFavorite={handleToggleFavorite}
                        onDuplicate={handleDuplicate}
                        onEdit={(s) => setEditingSnippet(s)}
                        onDelete={(id) => setDeleteTargetId(id)}
                        onRunPrompt={(s) => setPromptRunnerSnippet(s)}
                        onTagClick={(tag) => setActiveTag(tag)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar for Android/iOS with concise labels */}
      {isAuthenticated && (
        <nav className="mobile-bottom-bar">
          <button
            className={`mobile-nav-btn ${activeType === '' ? 'active' : ''}`}
            onClick={() => setActiveType('')}
          >
            <Layers size={17} />
            <span>{t.mobileNavAll}</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeType === 'prompt' ? 'active' : ''}`}
            onClick={() => setActiveType('prompt')}
          >
            <Sparkles size={17} />
            <span>{t.mobileNavPrompts}</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeType === 'code' ? 'active' : ''}`}
            onClick={() => setActiveType('code')}
          >
            <Code size={17} />
            <span>{t.mobileNavCode}</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeType === 'secret' ? 'active' : ''}`}
            onClick={() => setActiveType('secret')}
          >
            <KeyRound size={17} />
            <span>{t.mobileNavSecrets}</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeType === 'note' ? 'active' : ''}`}
            onClick={() => setActiveType('note')}
          >
            <FileText size={17} />
            <span>{t.mobileNavNotes}</span>
          </button>
        </nav>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          loadSnippets();
          loadTags();
        }}
      />

      <TwoFASetupModal
        isOpen={is2FASetupOpen}
        onClose={() => setIs2FASetupOpen(false)}
        onSuccess={() => {
          showToast(t.twoFAActive);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        defaultTab={settingsTab}
        onClose={() => setIsSettingsOpen(false)}
        onOpen2FASetup={() => setIs2FASetupOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onVaultChanged={() => {
          loadSnippets();
          loadTags();
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenSettings={() => {
          setSettingsTab('security');
          setIsSettingsOpen(true);
        }}
        onOpen2FA={() => setIs2FASetupOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onRequestLogout={() => setIsLogoutConfirmOpen(true)}
      />

      <ApiDocsModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
      />

      <PromptRunnerModal
        snippet={promptRunnerSnippet}
        onClose={() => setPromptRunnerSnippet(null)}
      />

      <SnippetEditModal
        snippet={editingSnippet}
        isOpen={!!editingSnippet}
        onClose={() => setEditingSnippet(null)}
        onSuccess={() => {
          showToast(t.updatedSuccessfully);
          loadSnippets();
          loadTags();
        }}
      />

      {/* Styled Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title={t.confirmDeleteTitle}
        description={t.confirmDeleteDesc}
        confirmText={t.delete}
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />

      {/* Styled Logout Confirmation Dialog */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title={t.confirmLogoutTitle}
        description={t.confirmLogoutDesc}
        confirmText={t.logOut}
        isDanger={false}
        onConfirm={logout}
        onClose={() => setIsLogoutConfirmOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DevFlowApp />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
