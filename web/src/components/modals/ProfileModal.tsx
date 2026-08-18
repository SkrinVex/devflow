import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  Settings, 
  Download, 
  LogOut, 
  Briefcase, 
  Palette,
  Terminal,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/LanguageContext';
import { api } from '../../services/api';
import type { Snippet } from '../../types';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpen2FA?: () => void;
  onOpenApiDocs?: () => void;
  onRequestLogout: () => void;
}

const AVATAR_COLORS = [
  { id: 'indigo', hex: '#818cf8', label: 'Indigo' },
  { id: 'emerald', hex: '#34d399', label: 'Emerald' },
  { id: 'amber', hex: '#fbbf24', label: 'Amber' },
  { id: 'rose', hex: '#f87171', label: 'Rose' },
  { id: 'cyan', hex: '#38bdf8', label: 'Cyan' },
  { id: 'violet', hex: '#c084fc', label: 'Violet' },
];

const ROLES = [
  'Full-Stack Developer',
  'Backend Engineer',
  'Frontend Developer',
  'AI / LLM Engineer',
  'DevOps / SRE',
  'Security Researcher',
  'Solo Maker',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpen2FA,
  onOpenApiDocs,
  onRequestLogout,
}) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [avatarColor, setAvatarColor] = useState(() => {
    return localStorage.getItem('devflow_avatar_color') || '#818cf8';
  });

  const [role, setRole] = useState(() => {
    return localStorage.getItem('devflow_user_role') || 'Full-Stack Developer';
  });

  const [copiedId, setCopiedId] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    prompts: 0,
    code: 0,
    secrets: 0,
    notes: 0,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setPwaInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      alert(t.pwaManualGuide);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setPwaInstalled(true);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (!isOpen || !user) return;

    const loadStats = async () => {
      try {
        const res = await api.listSnippets({ limit: 500 });
        const items: Snippet[] = res.items || [];
        setStats({
          total: res.total || items.length,
          prompts: items.filter((s) => s.type === 'prompt').length,
          code: items.filter((s) => s.type === 'code').length,
          secrets: items.filter((s) => s.type === 'secret').length,
          notes: items.filter((s) => s.type === 'note').length,
        });
      } catch (err) {
        console.error(err);
      }
    };

    loadStats();
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleColorChange = (hex: string) => {
    setAvatarColor(hex);
    localStorage.setItem('devflow_avatar_color', hex);
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    localStorage.setItem('devflow_user_role', newRole);
  };

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const data = await api.exportVault();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devflow-vault-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: '600' }}>
            {t.developerProfile}
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px' }}>
          
          {/* User Info Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: `2px solid ${avatarColor}`,
              color: avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: '700',
              fontFamily: 'monospace',
              flexShrink: 0,
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
                  {user.username}
                </span>
                {user.is_2fa_enabled ? (
                  <span className="badge" style={{ background: 'var(--badge-note-bg)', color: 'var(--badge-note-text)', borderColor: 'var(--badge-note-border)', fontSize: '10.5px' }}>
                    <ShieldCheck size={10} /> 2FA Active
                  </span>
                ) : (
                  <span
                    className="badge"
                    style={{ background: 'var(--badge-secret-bg)', color: 'var(--badge-secret-text)', borderColor: 'var(--badge-secret-border)', fontSize: '10.5px', cursor: onOpen2FA ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (onOpen2FA) {
                        onClose();
                        onOpen2FA();
                      }
                    }}
                  >
                    <ShieldAlert size={10} /> 2FA Off
                  </span>
                )}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                  ID: {user.id.substring(0, 8)}...
                </span>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '1px 4px', fontSize: '10px' }}
                  onClick={handleCopyUserId}
                  title="Copy full UUID"
                >
                  {copiedId ? <Check size={10} color="var(--success)" /> : <Copy size={10} />}
                </button>
              </div>
            </div>
          </div>

          {/* Accent Color & Role Customization */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.5px' }}>
                <Palette size={11} style={{ display: 'inline', marginRight: '4px' }} />
                {t.accentColor}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleColorChange(c.hex)}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: c.hex,
                      border: avatarColor === c.hex ? '2px solid var(--text)' : '1px solid transparent',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                <Briefcase size={11} style={{ display: 'inline', marginRight: '4px' }} />
                {t.roleTitle}
              </span>
              <select
                className="input-field"
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                style={{ fontSize: '12.5px', height: '32px' }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vault Stats Breakdown */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              {t.vaultStatistics}
            </span>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              textAlign: 'center',
            }}>
              <div style={{ padding: '8px 4px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--badge-prompt-text)' }}>{stats.prompts}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{t.prompts}</div>
              </div>
              <div style={{ padding: '8px 4px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--badge-code-text)' }}>{stats.code}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{t.code}</div>
              </div>
              <div style={{ padding: '8px 4px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--badge-secret-text)' }}>{stats.secrets}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{t.secrets}</div>
              </div>
              <div style={{ padding: '8px 4px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--badge-note-text)' }}>{stats.notes}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{t.notes}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            
            {/* PWA Install Button */}
            {pwaInstalled ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}>
                <CheckCircle2 size={15} color="var(--success)" />
                <span>{t.pwaInstalledBadge}</span>
              </div>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={handleInstallPWA}
              >
                <Smartphone size={15} />
                <span>{t.installPwaButton}</span>
              </button>
            )}

            {/* API Docs Trigger */}
            {onOpenApiDocs && (
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={() => {
                  onClose();
                  onOpenApiDocs();
                }}
              >
                <Terminal size={15} />
                <span>{t.apiDocsBtn} (REST & MCP)</span>
              </button>
            )}

            {/* Settings Trigger */}
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
            >
              <Settings size={15} />
              <span>{t.settingsTitle}</span>
            </button>

            {/* Quick Export Button */}
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={handleExportJSON}
              disabled={exporting}
            >
              <Download size={15} />
              <span>{exporting ? t.exporting : t.quickExportVault}</span>
            </button>

            {/* Logout Trigger */}
            <button
              className="btn btn-danger"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', marginTop: '6px' }}
              onClick={() => {
                onClose();
                onRequestLogout();
              }}
            >
              <LogOut size={15} />
              <span>{t.signOut}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
