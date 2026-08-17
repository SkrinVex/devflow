import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Download, 
  Upload, 
  Database,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import { api } from '../lib/api';

export type SettingsTab = 'security' | 'password' | 'vault' | 'api';

interface SettingsModalProps {
  isOpen: boolean;
  defaultTab?: SettingsTab;
  onClose: () => void;
  onOpen2FASetup: () => void;
  onOpenApiDocs?: () => void;
  onVaultChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  defaultTab = 'security',
  onClose,
  onOpen2FASetup,
  onOpenApiDocs,
  onVaultChanged,
}) => {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();

  const [tab, setTab] = useState<SettingsTab>(defaultTab);

  // Sync tab with defaultTab whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Disable 2FA state
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Import/Export state
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: t.passwordsMismatch });
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordMsg({ type: 'success', text: t.passwordUpdated });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError(null);
    setLoading(true);

    try {
      await api.disable2FA(disablePassword);
      await refreshUser();
      setIsDisabling2FA(false);
      setDisablePassword('');
    } catch (err: any) {
      setDisableError(err.message || 'Failed to disable 2FA. Check password.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportVault = async () => {
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

  const handleImportVault = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('...');
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const json = JSON.parse(evt.target?.result as string);
          const res = await api.importVault(json);
          setImportStatus(`${t.importSuccess} ${res.imported_count}`);
          onVaultChanged();
        } catch (err: any) {
          setImportStatus('Error: ' + err.message);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setImportStatus('File error: ' + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: '600' }}>{t.settingsModalTitle}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation - Clean 4-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '10px 14px 0 14px', gap: '4px', borderBottom: '1px solid var(--border)' }}>
          <button
            type="button"
            className={`btn ${tab === 'security' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '11.5px', padding: '6px 4px', borderBottom: tab === 'security' ? '2px solid var(--text)' : undefined, whiteSpace: 'nowrap' }}
            onClick={() => setTab('security')}
          >
            <ShieldCheck size={13} /> {t.tabSecurity}
          </button>
          <button
            type="button"
            className={`btn ${tab === 'password' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '11.5px', padding: '6px 4px', borderBottom: tab === 'password' ? '2px solid var(--text)' : undefined, whiteSpace: 'nowrap' }}
            onClick={() => setTab('password')}
          >
            <Key size={13} /> {t.tabPassword}
          </button>
          <button
            type="button"
            className={`btn ${tab === 'vault' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '11.5px', padding: '6px 4px', borderBottom: tab === 'vault' ? '2px solid var(--text)' : undefined, whiteSpace: 'nowrap' }}
            onClick={() => setTab('vault')}
          >
            <Database size={13} /> {t.tabVault}
          </button>
          <button
            type="button"
            className={`btn ${tab === 'api' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '11.5px', padding: '6px 4px', borderBottom: tab === 'api' ? '2px solid var(--text)' : undefined, whiteSpace: 'nowrap' }}
            onClick={() => setTab('api')}
          >
            <Terminal size={13} /> {t.tabApi}
          </button>
        </div>

        <div style={{ padding: '18px' }}>
          {/* TAB 1: 2FA Security */}
          {tab === 'security' && (
            <div>
              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {user.is_2fa_enabled ? (
                    <ShieldCheck size={22} color="var(--success)" />
                  ) : (
                    <ShieldAlert size={22} color="var(--badge-secret-text)" />
                  )}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>
                      {user.is_2fa_enabled ? t.twoFAEnabledStatus : t.twoFADisabledStatus}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {user.is_2fa_enabled ? t.twoFAEnabledDesc : t.twoFADisabledDesc}
                    </div>
                  </div>
                </div>

                {!user.is_2fa_enabled && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={() => {
                      onClose();
                      onOpen2FASetup();
                    }}
                  >
                    {t.enable2FA}
                  </button>
                )}
              </div>

              {user.is_2fa_enabled && !isDisabling2FA && (
                <div>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ fontSize: '12px' }}
                    onClick={() => setIsDisabling2FA(true)}
                  >
                    {t.disable2FAButton}
                  </button>
                </div>
              )}

              {user.is_2fa_enabled && isDisabling2FA && (
                <form onSubmit={handleDisable2FA} style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '6px' }}>
                    {t.confirmDisableTitle}
                  </div>
                  {disableError && (
                    <div style={{ fontSize: '11.5px', color: 'var(--danger)', marginBottom: '6px' }}>
                      {disableError}
                    </div>
                  )}
                  <input
                    type="password"
                    className="input-field"
                    style={{ marginBottom: '10px' }}
                    placeholder="••••••••••••"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setIsDisabling2FA(false)}>
                      {t.cancel}
                    </button>
                    <button type="submit" className="btn btn-danger" disabled={loading}>
                      {t.confirmDisableButton}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Change Password */}
          {tab === 'password' && (
            <form onSubmit={handleChangePassword}>
              {passwordMsg && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  background: passwordMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  border: `1px solid ${passwordMsg.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  color: passwordMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
                  fontSize: '12px',
                  marginBottom: '12px',
                }}>
                  {passwordMsg.text}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.currentPassword}
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.newPassword}
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.confirmNewPassword}
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading || !newPassword}>
                {loading ? t.updating : t.updatePasswordButton}
              </button>
            </form>
          )}

          {/* TAB 3: Vault Backup & Export */}
          {tab === 'vault' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Export Card */}
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{t.exportTitle}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>{t.exportSubtitle}</div>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={handleExportVault}>
                    <Download size={13} />
                    <span>{t.exportButton}</span>
                  </button>
                </div>

                {/* Import Card */}
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{t.importTitle}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>{t.importSubtitle}</div>
                  </div>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                    <Upload size={13} />
                    <span>{t.importButton}</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      style={{ display: 'none' }}
                      onChange={handleImportVault}
                    />
                  </label>
                </div>

                {importStatus && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {importStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REST API */}
          {tab === 'api' && (
            <div>
              <div style={{
                padding: '14px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)',
                marginBottom: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Terminal size={16} />
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>DevFlow REST API v1</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
                  Управляйте своими промптами, кодом и хранилищем удаленно из терминала, Raycast или сторонних приложений.
                </p>
                <div style={{
                  padding: '8px 10px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border)',
                  fontFamily: 'monospace',
                  fontSize: '11.5px',
                  marginBottom: '12px',
                }}>
                  http://localhost:1451/api/v1
                </div>

                {onOpenApiDocs && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '12px', width: '100%' }}
                    onClick={() => {
                      onClose();
                      onOpenApiDocs();
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>Открыть интерактивную документацию API</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
