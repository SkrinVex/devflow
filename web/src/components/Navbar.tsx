import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  LogIn, 
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import { Logo } from './Logo';
import { ConfirmModal } from './ConfirmModal';
import type { SnippetType } from '../types';
import type { SettingsTab } from './SettingsModal';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeType: SnippetType | '';
  onTypeChange: (type: SnippetType | '') => void;
  onOpenAuth: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onTypeChange,
  onOpenAuth,
  onOpenSettings,
  onOpenProfile,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { lang, t, toggleLang } = useI18n();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const avatarColor = localStorage.getItem('devflow_avatar_color') || '#818cf8';

  return (
    <>
      <header className="header-panel" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 16px' }}>
          
          {/* Main Navbar Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            
            {/* Brand Logo & Title */}
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', flexShrink: 0 }} 
              onClick={() => onTypeChange('')}
            >
              <Logo size={24} />
              <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px', color: 'var(--text)' }}>
                devflow
              </span>
            </div>

            {/* Desktop Search Bar (Hidden on Mobile) */}
            <div className="desktop-search" style={{ flex: 1, maxWidth: '440px', position: 'relative' }}>
              <Search size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '30px', paddingRight: '50px', height: '32px', fontSize: '12.5px' }}
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  {t.clear}
                </button>
              )}
            </div>

            {/* Right Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              
              {/* Language Switcher Button */}
              <button
                className="btn btn-ghost"
                onClick={toggleLang}
                title={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
                style={{ fontSize: '11.5px', padding: '4px 7px', fontFamily: 'monospace', textTransform: 'uppercase', color: 'var(--text-muted)' }}
              >
                <Globe size={13} />
                <span>{lang === 'ru' ? 'RU' : 'EN'}</span>
              </button>

              {isAuthenticated && user ? (
                <>
                  {/* Desktop Only 2FA & Settings Buttons */}
                  <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div 
                      title={user.is_2fa_enabled ? '2FA Active' : '2FA Disabled'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 7px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '11px',
                        background: user.is_2fa_enabled ? 'var(--badge-note-bg)' : 'var(--badge-secret-bg)',
                        color: user.is_2fa_enabled ? 'var(--badge-note-text)' : 'var(--badge-secret-text)',
                        border: `1px solid ${user.is_2fa_enabled ? 'var(--badge-note-border)' : 'var(--badge-secret-border)'}`,
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                      }}
                      onClick={() => onOpenSettings('security')}
                    >
                      {user.is_2fa_enabled ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                      <span>{user.is_2fa_enabled ? t.twoFAActive : t.enable2FA}</span>
                    </div>

                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => onOpenSettings()}
                      title={t.settingsTitle}
                      style={{ width: '30px', height: '30px' }}
                    >
                      <Settings size={13} />
                    </button>
                  </div>

                  {/* Profile Avatar Button (Always visible - opens Profile Hub) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingLeft: '4px', borderLeft: '1px solid var(--border)' }}>
                    <button
                      onClick={onOpenProfile}
                      title="Profile & Vault Hub"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-subtle)',
                        border: `1.5px solid ${avatarColor}`,
                        color: avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease',
                        outline: 'none',
                      }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </button>

                    {/* Desktop Logout Button */}
                    <button
                      className="btn btn-ghost btn-icon desktop-actions"
                      onClick={() => setIsLogoutConfirmOpen(true)}
                      title={t.logOut}
                      style={{ width: '28px', height: '28px' }}
                    >
                      <LogOut size={13} />
                    </button>
                  </div>
                </>
              ) : (
                <button className="btn btn-primary" onClick={onOpenAuth} style={{ fontSize: '12px', padding: '4px 10px' }}>
                  <LogIn size={13} />
                  <span>{t.signInRegister}</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Full-Width Search Row (Only shown on mobile <= 768px) */}
          <div className="mobile-search" style={{ marginTop: '8px', position: 'relative' }}>
            <Search size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '30px', paddingRight: '50px', height: '34px', fontSize: '13px' }}
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                {t.clear}
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Styled Log Out Confirmation Dialog */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title={t.confirmLogoutTitle}
        description={t.confirmLogoutDesc}
        confirmText={t.logOut}
        isDanger={false}
        onConfirm={logout}
        onClose={() => setIsLogoutConfirmOpen(false)}
      />
    </>
  );
};
