import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useI18n } from './context/LanguageContext';

import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { SmartCapture } from './components/snippets/SmartCapture';
import { SnippetList } from './components/snippets/SnippetList';
import { Toast } from './components/ui/Toast';

import { AuthModal } from './components/modals/AuthModal';
import { TwoFASetupModal } from './components/modals/TwoFASetupModal';
import { SettingsModal } from './components/modals/SettingsModal';
import type { SettingsTab } from './components/modals/SettingsModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { ApiDocsModal } from './components/modals/ApiDocsModal';
import { PromptRunnerModal } from './components/modals/PromptRunnerModal';
import { SnippetEditModal } from './components/modals/SnippetEditModal';
import { ConfirmModal } from './components/modals/ConfirmModal';

import { useToast } from './hooks/useToast';
import { useSnippets } from './hooks/useSnippets';
import { useWebSocket } from './hooks/useWebSocket';
import type { Snippet, WebSocketEvent } from './types';

const MainApp: React.FC = () => {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const { t } = useI18n();
  const { toasts, showToast, removeToast } = useToast();

  // Snippets Hook
  const {
    snippets,
    setSnippets,
    totalSnippets,
    setTotalSnippets,
    tags,
    loading: snippetsLoading,
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
  } = useSnippets(isAuthenticated);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [is2FAOpen, setIs2FAOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<SettingsTab>('security');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);
  const [activePromptRunner, setActivePromptRunner] = useState<Snippet | null>(null);
  const [activeSnippetEdit, setActiveSnippetEdit] = useState<Snippet | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadSnippets();
      loadTags();
    }
  }, [isAuthenticated, loadSnippets, loadTags]);

  // Keep stable refs for WebSocket live sync
  const loadSnippetsRef = useRef(loadSnippets);
  loadSnippetsRef.current = loadSnippets;
  const loadTagsRef = useRef(loadTags);
  loadTagsRef.current = loadTags;

  // Real-Time Multi-Device Sync over Gorilla WebSocket
  const handleWebSocketEvent = useCallback((event: WebSocketEvent) => {
    if (!event || !event.type || event.type === 'connected') return;

    // 1. Instant 0ms Optimistic DOM State Updates
    if (event.type === 'snippet:deleted' && event.payload?.id) {
      setSnippets((prev) => prev.filter((s) => s.id !== event.payload.id));
      setTotalSnippets((prev) => Math.max(0, prev - 1));
      showToast(t.toastDeleted, 'default');
    } else if (event.type === 'snippet:created' && event.payload?.id) {
      setSnippets((prev) => [event.payload, ...prev.filter((s) => s.id !== event.payload.id)]);
      setTotalSnippets((prev) => prev + 1);
      showToast(t.toastSaved, 'success');
    } else if ((event.type === 'snippet:updated' || event.type === 'snippet:pinned' || event.type === 'snippet:favorited') && event.payload?.id) {
      setSnippets((prev) => prev.map((s) => (s.id === event.payload.id ? event.payload : s)));
    }

    // 2. Full background re-sync
    if (loadSnippetsRef.current) loadSnippetsRef.current();
    if (loadTagsRef.current) loadTagsRef.current();
  }, [showToast, t.toastDeleted, t.toastSaved, setSnippets, setTotalSnippets]);

  useWebSocket({
    isAuthenticated,
    onEvent: handleWebSocketEvent,
  });

  const handleCopyToast = () => {
    showToast(t.toastCopied, 'success');
  };

  const handleRequestDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t.confirmDeleteTitle,
      description: t.confirmDeleteDesc,
      confirmText: t.delete,
      isDanger: true,
      onConfirm: () => {
        deleteSnippet(id);
        showToast(t.toastDeleted, 'default');
      },
    });
  };

  const handleRequestLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: t.confirmSignOutTitle,
      description: t.confirmSignOutDesc,
      confirmText: t.signOut,
      isDanger: true,
      onConfirm: async () => {
        await logout();
        showToast(t.signedOut, 'default');
      },
    });
  };

  const handleOpenSettingsTab = (tab: SettingsTab) => {
    setSettingsDefaultTab(tab);
    setIsSettingsOpen(true);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-dim)', fontSize: '13px' }}>
        {t.loading}
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Fixed Header Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => handleOpenSettingsTab('security')}
        onOpen2FASetup={() => setIs2FAOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onTypeChange={setActiveType}
      />

      {/* Fixed Desktop Sidebar */}
      <Sidebar
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

      {/* Main Content Feed */}
      <main className="main-content">
        <div className="content-wrapper">
          
          {/* Quick Capture Box (Only if authenticated) */}
          {isAuthenticated && (
            <SmartCapture
              onSnippetCreated={() => {
                loadSnippets();
                loadTags();
                showToast(t.toastSaved, 'success');
              }}
            />
          )}

          {/* Unauthenticated Landing / Sign In Hero */}
          {!isAuthenticated && (
            <div className="panel-card" style={{ padding: '36px 20px', textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
                {t.guestWelcomeTitle}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 18px auto', lineHeight: '1.5' }}>
                {t.guestWelcomeSubtitle}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setIsAuthOpen(true)}
                style={{ padding: '8px 20px', fontSize: '13.5px' }}
              >
                {t.signInRegister}
              </button>
            </div>
          )}

          {/* Snippet Feed List */}
          {isAuthenticated && (
            <SnippetList
              snippets={snippets}
              loading={snippetsLoading}
              searchQuery={searchQuery}
              activeType={activeType}
              activeTag={activeTag}
              onlyPinned={onlyPinned}
              onlyFavorites={onlyFavorites}
              sortOrder={sortOrder}
              onSearchChange={setSearchQuery}
              onTypeChange={setActiveType}
              onTagChange={setActiveTag}
              onToggleOnlyPinned={() => setOnlyPinned(!onlyPinned)}
              onToggleOnlyFavorites={() => setOnlyFavorites(!onlyFavorites)}
              onSortChange={setSortOrder}
              onClearFilters={clearFilters}
              onCopy={handleCopyToast}
              onTogglePin={togglePin}
              onToggleFavorite={toggleFavorite}
              onEdit={(s) => setActiveSnippetEdit(s)}
              onDelete={handleRequestDelete}
              onDuplicate={(s) => {
                duplicateSnippet(s);
                showToast(t.toastDuplicated, 'success');
              }}
              onRunPrompt={(s) => setActivePromptRunner(s)}
            />
          )}
        </div>
      </main>

      {/* Fixed Mobile Bottom Bar */}
      <MobileBottomNav
        activeType={activeType}
        onTypeChange={setActiveType}
      />

      {/* Floating Toast Notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Feature Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          loadSnippets();
          loadTags();
          showToast(t.welcomeBack, 'success');
        }}
      />

      <TwoFASetupModal
        isOpen={is2FAOpen}
        onClose={() => setIs2FAOpen(false)}
        onSuccess={() => {
          showToast(t.twoFAActivated, 'success');
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        defaultTab={settingsDefaultTab}
        onClose={() => setIsSettingsOpen(false)}
        onOpen2FASetup={() => setIs2FAOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onVaultChanged={() => {
          loadSnippets();
          loadTags();
          showToast(t.vaultUpdated, 'success');
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenSettings={() => handleOpenSettingsTab('security')}
        onOpen2FA={() => setIs2FAOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
        onRequestLogout={handleRequestLogout}
      />

      <ApiDocsModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
      />

      <PromptRunnerModal
        snippet={activePromptRunner}
        onClose={() => setActivePromptRunner(null)}
      />

      <SnippetEditModal
        snippet={activeSnippetEdit}
        isOpen={!!activeSnippetEdit}
        onClose={() => setActiveSnippetEdit(null)}
        onSuccess={() => {
          loadSnippets();
          loadTags();
          showToast(t.toastSaved, 'success');
        }}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        isDanger={confirmDialog.isDanger}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
