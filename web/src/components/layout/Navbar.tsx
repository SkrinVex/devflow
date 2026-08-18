import React from 'react';
import { 
  Search, 
  Sun, 
  Moon, 
  Terminal, 
  ShieldAlert,
  LogIn
} from 'lucide-react';
import { Logo } from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/LanguageContext';
import type { SnippetType } from '../../types';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenSettings?: () => void;
  onOpen2FASetup: () => void;
  onOpenApiDocs: () => void;
  onTypeChange: (type: SnippetType | '') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAuth,
  onOpenProfile,
  onOpen2FASetup,
  onOpenApiDocs,
  onTypeChange,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();

  const avatarColor = localStorage.getItem('devflow_avatar_color') || '#818cf8';

  return (
    <header className="header-panel">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '8px 14px' }}>
        
        {/* Main Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          
          {/* Brand Logo */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }} 
            onClick={() => onTypeChange('')}
          >
            <Logo size={22} />
            <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px', color: 'var(--text)' }}>
              devflow
            </span>
          </div>

          {/* Desktop Search Bar */}
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

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            
            {/* Theme Toggle (Dark / Light) */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ padding: '6px' }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Language Switcher */}
            <button
              className="btn btn-ghost"
              onClick={toggleLang}
              title={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
              style={{ fontSize: '11px', padding: '4px 6px', fontFamily: 'monospace', textTransform: 'uppercase', color: 'var(--text-muted)' }}
            >
              {lang}
            </button>

            {/* API & MCP Documentation Button */}
            <button
              className="btn btn-ghost btn-icon desktop-actions"
              onClick={onOpenApiDocs}
              title={t.apiDocsBtn}
              style={{ padding: '6px' }}
            >
              <Terminal size={15} />
            </button>

            {isAuthenticated && user ? (
              <>
                {/* 2FA Setup Prompt (Only if disabled) */}
                {!user.is_2fa_enabled && (
                  <button
                    className="btn btn-ghost desktop-actions"
                    onClick={onOpen2FASetup}
                    style={{ fontSize: '11px', padding: '3px 7px', color: 'var(--badge-secret-text)', background: 'var(--badge-secret-bg)', border: '1px solid var(--badge-secret-border)' }}
                    title={t.unprotected2FA}
                  >
                    <ShieldAlert size={12} />
                    <span>2FA</span>
                  </button>
                )}

                {/* Profile Avatar Button */}
                <button
                  onClick={onOpenProfile}
                  title={`${user.username} (${user.email})`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--bg-subtle)',
                    border: `1.5px solid ${avatarColor}`,
                    color: avatarColor,
                    fontSize: '13px',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'transform 0.1s ease',
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={onOpenAuth}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                <LogIn size={13} />
                <span>{t.signInRegister}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Full-Width Search Row */}
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
  );
};
