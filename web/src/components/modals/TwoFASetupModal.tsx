import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertTriangle, 
  Download, 
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/LanguageContext';

export interface TwoFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TwoFASetupModal: React.FC<TwoFASetupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { refreshUser } = useAuth();
  const { t } = useI18n();

  const [step, setStep] = useState<'scan' | 'backup'>('scan');
  const [secret, setSecret] = useState('');
  const [qrCodeURI, setQrCodeURI] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep('scan');
      setSecret('');
      setQrCodeURI('');
      setCode('');
      setBackupCodes([]);
      setError(null);
      return;
    }

    const init2FA = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.setup2FA();
        setSecret(res.secret);
        setQrCodeURI(res.qr_code_url || (res as any).qr_code);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize 2FA setup');
      } finally {
        setLoading(false);
      }
    };

    init2FA();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const text = `DevFlow 2FA Emergency Backup Codes\nGenerated: ${new Date().toISOString()}\n\n` + backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devflow-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 6) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.confirm2FA(code);
      setBackupCodes(res.backup_codes);
      setStep('backup');
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Invalid 6-digit code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--success)" />
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>
              {step === 'scan' ? t.twoFASetupTitle : t.twoFABackupTitle}
            </h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px' }}>
          {error && (
            <div style={{
              padding: '8px 12px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--danger)',
              fontSize: '12px',
              marginBottom: '14px',
            }}>
              {error}
            </div>
          )}

          {step === 'scan' ? (
            <div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                {t.twoFAScanInstructions}
              </p>

              {/* QR Code Container */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '14px',
                background: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                width: 'fit-content',
                margin: '0 auto 16px auto',
              }}>
                {qrCodeURI ? (
                  <QRCodeSVG value={qrCodeURI} size={150} level="M" />
                ) : (
                  <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px' }}>
                    {loading ? t.loading : 'No QR'}
                  </div>
                )}
              </div>

              {/* Secret Key Copy */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  {t.manualEntryKey}
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}>
                  <span style={{ letterSpacing: '1px', wordBreak: 'break-all' }}>{secret || '••••••••'}</span>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '2px 6px', fontSize: '11px' }}
                    onClick={handleCopySecret}
                  >
                    {copiedSecret ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Verification Code Form */}
              <form onSubmit={handleConfirm}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', marginBottom: '4px' }}>
                  {t.enterCodeToVerify}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={8}
                    placeholder="000 000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="input-field font-mono"
                    style={{ fontSize: '16px', letterSpacing: '3px', textAlign: 'center' }}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || code.length < 6}
                    style={{ flexShrink: 0 }}
                  >
                    {loading ? t.verifying : t.activate2FA}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Backup Codes Screen */
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                background: 'var(--badge-prompt-bg)',
                border: '1px solid var(--badge-prompt-border)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--badge-prompt-text)',
                fontSize: '12px',
                marginBottom: '14px',
                lineHeight: '1.4',
              }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.twoFABackupWarning}</span>
              </div>

              {/* Codes Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                padding: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xs)',
                fontFamily: 'monospace',
                fontSize: '12.5px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                {backupCodes.map((c, idx) => (
                  <div key={idx} style={{ padding: '3px', letterSpacing: '1px' }}>
                    {c}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '12px' }}
                  onClick={handleCopyBackupCodes}
                >
                  {copiedBackup ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                  <span>{copiedBackup ? t.copied : t.copyCodes}</span>
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '12px' }}
                  onClick={handleDownloadBackupCodes}
                >
                  <Download size={13} />
                  <span>{t.downloadTxt}</span>
                </button>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', height: '36px', fontSize: '13px' }}
                onClick={handleFinish}
              >
                <span>{t.savedDone}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
