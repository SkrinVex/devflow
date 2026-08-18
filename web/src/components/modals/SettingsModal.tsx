import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Download, 
  Upload, 
  Terminal,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/LanguageContext';
import { api } from '../../services/api';

export type SettingsTab = 'security' | 'password' | 'vault' | 'api';

export interface SettingsModalProps {
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
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: t.passwordsMismatch });
      return;
    }

    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordMsg({ type: 'success', text: t.passwordChangedSuccess });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password' });
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError(null);
    try {
      await api.disable2FA(disablePassword);
      setIsDisabling2FA(false);
      setDisablePassword('');
      await refreshUser();
    } catch (err: any) {
      setDisableError(err.message || 'Failed to disable 2FA');
    }
  };

  const handleExportVault = async () => {
    setIsExporting(true);
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
      alert(err.message || 'Failed to export vault');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsImporting(true);
        setImportStatus(null);
        const parsed = JSON.parse(event.target?.result as string);
        const res = await api.importVault(parsed);
        setImportStatus(`Successfully imported ${res.imported_count} snippets!`);
        onVaultChanged();
      } catch (err: any) {
        setImportStatus(`Import error: ${err.message || 'Invalid JSON file'}`);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: '600' }}>
            {t.settingsTitle}
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
          <button
            className={`btn ${tab === 'security' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, border: 'none', borderBottom: tab === 'security' ? '2px solid var(--text)' : undefined, fontSize: '12px', padding: '8px 4px' }}
            onClick={() => setTab('security')}
          >
            {t.tab2FA}
          </button>
          <button
            className={`btn ${tab === 'password' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, border: 'none', borderBottom: tab === 'password' ? '2px solid var(--text)' : undefined, fontSize: '12px', padding: '8px 4px' }}
            onClick={() => setTab('password')}
          >
            {t.tabPassword}
          </button>
          <button
            className={`btn ${tab === 'vault' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, border: 'none', borderBottom: tab === 'vault' ? '2px solid var(--text)' : undefined, fontSize: '12px', padding: '8px 4px' }}
            onClick={() => setTab('vault')}
          >
            {t.tabVault}
          </button>
          <button
            className={`btn ${tab === 'api' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, border: 'none', borderBottom: tab === 'api' ? '2px solid var(--text)' : undefined, fontSize: '12px', padding: '8px 4px' }}
            onClick={() => setTab('api')}
          >
            {t.tabApiMcp}
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '18px' }}>
          
          {/* 1. Security & 2FA Tab */}
          {tab === 'security' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
              }}>
                {user.is_2fa_enabled ? (
                  <ShieldCheck size={24} color="var(--success)" style={{ flexShrink: 0 }} />
                ) : (
                  <ShieldAlert size={24} color="var(--badge-secret-text)" style={{ flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text)' }}>
                    {user.is_2fa_enabled ? t.twoFAEnabledTitle : t.twoFADisabledTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.4' }}>
                    {user.is_2fa_enabled ? t.twoFAEnabledDesc : t.twoFADisabledDesc}
                  </div>
                </div>
              </div>

              {user.is_2fa_enabled ? (
                <div>
                  {isDisabling2FA ? (
                    <form onSubmit={handleDisable2FA}>
                      {disableError && (
                        <div style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '8px' }}>
                          {disableError}
                        </div>
                      )}
                      <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {t.confirmPasswordToDisable}
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoFocus
                        style={{ marginBottom: '10px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setIsDisabling2FA(false);
                            setDisablePassword('');
                            setDisableError(null);
                          }}
                        >
                          {t.cancel}
                        </button>
                        <button type="submit" className="btn btn-danger">
                          {t.confirmDisable}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="btn btn-danger"
                      onClick={() => setIsDisabling2FA(true)}
                    >
                      {t.disable2FA}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onOpen2FASetup();
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>{t.enable2FAButton}</span>
                </button>
              )}
            </div>
          )}

          {/* 2. Password Tab */}
          {tab === 'password' && (
            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {passwordMsg && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12px',
                    background: passwordMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: passwordMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${passwordMsg.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  }}>
                    {passwordMsg.text}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.currentPassword}
                  </label>
                  <input
                    type="password"
                    className="input-field"
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
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                >
                  <Key size={13} />
                  <span>{t.updatePassword}</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. Vault Backup & Restore Tab */}
          {tab === 'vault' && (
            <div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                {t.vaultBackupDescription}
              </p>

              {importStatus && (
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12px',
                  color: 'var(--text)',
                  marginBottom: '14px',
                }}>
                  {importStatus}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Export Button */}
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px 14px' }}
                  onClick={handleExportVault}
                  disabled={isExporting}
                >
                  <Download size={15} />
                  <span>{isExporting ? t.exporting : t.exportJsonButton}</span>
                </button>

                {/* Import Button */}
                <label className="btn btn-secondary" style={{ flex: 1, padding: '10px 14px', cursor: 'pointer' }}>
                  <Upload size={15} />
                  <span>{isImporting ? t.importing : t.importJsonButton}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* 4. API & MCP Documentation Tab */}
          {tab === 'api' && (
            <div>
              <div style={{
                padding: '14px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Terminal size={16} />
                  <span style={{ fontSize: '13.5px', fontWeight: '600' }}>REST API & Model Context Protocol (MCP)</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {t.apiDocsIntro}
                </p>
              </div>

              {onOpenApiDocs && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    onClose();
                    onOpenApiDocs();
                  }}
                >
                  <ExternalLink size={14} />
                  <span>{t.openFullApiDocs}</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
