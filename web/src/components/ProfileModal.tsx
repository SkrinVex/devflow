import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  Settings, 
  Download, 
  LogOut, 
  Briefcase, 
  Palette,
  Calendar,
  Sparkles,
  Code,
  KeyRound,
  FileText,
  Terminal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import { api } from '../lib/api';
import type { Snippet } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpen2FA: () => void;
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

  const [copiedId, setCopiedId] = useState(false);
  const [role, setRole] = useState<string>(() => {
    return localStorage.getItem('devflow_dev_role') || 'Full-Stack Developer';
  });
  const [avatarColor, setAvatarColor] = useState<string>(() => {
    return localStorage.getItem('devflow_avatar_color') || '#818cf8';
  });

  const [vaultCounts, setVaultCounts] = useState({
    prompts: 0,
    code: 0,
    secrets: 0,
    notes: 0,
  });

  useEffect(() => {
    if (isOpen) {
      api.listSnippets({ limit: 500 }).then((res) => {
        const items: Snippet[] = res.items || [];
        let prompts = 0, code = 0, secrets = 0, notes = 0;
        items.forEach((s) => {
          if (s.type === 'prompt') prompts++;
          else if (s.type === 'code') code++;
          else if (s.type === 'secret') secrets++;
          else notes++;
        });
        setVaultCounts({ prompts, code, secrets, notes });
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSelectRole = (r: string) => {
    setRole(r);
    localStorage.setItem('devflow_dev_role', r);
  };

  const handleSelectColor = (hex: string) => {
    setAvatarColor(hex);
    localStorage.setItem('devflow_avatar_color', hex);
  };

  const handleExport = async () => {
    try {
      const data = await api.exportVault();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devflow_vault_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '2026';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} />
            <h3 style={{ fontSize: '14.5px', fontWeight: '600' }}>{t.profileTitle}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '18px' }}>
          {/* User Hero Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            marginBottom: '16px',
          }}>
            {/* Customizable Avatar */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-main)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
                  {user.username}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}>
                  {role}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>

          {/* User ID & Registration Details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 12px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border)',
            fontSize: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>{t.userIdLabel}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {user.id.substring(0, 16)}...
                </span>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '1px 5px' }}
                  onClick={handleCopyId}
                  title={t.copyId}
                >
                  {copiedId ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                  <span>{copiedId ? t.idCopied : t.copy}</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
              <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> {t.memberSince}
              </span>
              <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>
                {formatDate(user.created_at)}
              </span>
            </div>
          </div>

          {/* 2FA Status Card */}
          <div style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-xs)',
            background: user.is_2fa_enabled ? 'var(--badge-note-bg)' : 'var(--badge-secret-bg)',
            border: `1px solid ${user.is_2fa_enabled ? 'var(--badge-note-border)' : 'var(--badge-secret-border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.is_2fa_enabled ? (
                <ShieldCheck size={18} color="var(--badge-note-text)" />
              ) : (
                <ShieldAlert size={18} color="var(--badge-secret-text)" />
              )}
              <span style={{ fontSize: '12px', fontWeight: '500', color: user.is_2fa_enabled ? 'var(--badge-note-text)' : 'var(--badge-secret-text)' }}>
                {user.is_2fa_enabled ? t.protectedBy2FA : t.unprotected2FA}
              </span>
            </div>

            {!user.is_2fa_enabled && (
              <button
                className="btn btn-primary"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={() => {
                  onClose();
                  onOpen2FA();
                }}
              >
                {t.setup2FANow}
              </button>
            )}
          </div>

          {/* Developer Role & Avatar Color Customization */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '5px' }}>
                <Briefcase size={12} />
                <span>{t.developerRoleLabel}</span>
              </label>
              <select
                className="input-field"
                style={{ fontSize: '12px', cursor: 'pointer' }}
                value={role}
                onChange={(e) => handleSelectRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '5px' }}>
                <Palette size={12} />
                <span>{t.customAvatarColor}</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {AVATAR_COLORS.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectColor(c.hex)}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: c.hex,
                      cursor: 'pointer',
                      border: avatarColor === c.hex ? '2px solid #ffffff' : '2px solid transparent',
                      boxShadow: avatarColor === c.hex ? '0 0 0 1px var(--border-focus)' : 'none',
                      transition: 'transform 0.1s ease',
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Vault Mini-Snapshot */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: '500', color: 'var(--text-dim)', marginBottom: '6px' }}>
              {t.vaultSnapshot}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <div style={{ padding: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', color: 'var(--badge-prompt-text)', fontSize: '10.5px' }}>
                  <Sparkles size={11} /> Prompts
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace' }}>{vaultCounts.prompts}</div>
              </div>

              <div style={{ padding: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', color: 'var(--badge-code-text)', fontSize: '10.5px' }}>
                  <Code size={11} /> Code
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace' }}>{vaultCounts.code}</div>
              </div>

              <div style={{ padding: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', color: 'var(--badge-secret-text)', fontSize: '10.5px' }}>
                  <KeyRound size={11} /> Keys
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace' }}>{vaultCounts.secrets}</div>
              </div>

              <div style={{ padding: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', color: 'var(--badge-note-text)', fontSize: '10.5px' }}>
                  <FileText size={11} /> Notes
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace' }}>{vaultCounts.notes}</div>
              </div>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '11.5px', padding: '6px 8px' }}
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
            >
              <Settings size={13} />
              <span>{t.settingsTitle}</span>
            </button>

            {onOpenApiDocs && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '11.5px', padding: '6px 8px' }}
                onClick={() => {
                  onClose();
                  onOpenApiDocs();
                }}
              >
                <Terminal size={13} />
                <span>API</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '11.5px', padding: '6px 8px' }}
              onClick={handleExport}
            >
              <Download size={13} />
              <span>JSON</span>
            </button>

            <button
              type="button"
              className="btn btn-danger btn-icon"
              title={t.logOut}
              onClick={() => {
                onClose();
                onRequestLogout();
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
