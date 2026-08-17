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
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';

interface TwoFASetupModalProps {
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
        setQrCodeURI(res.qr_code);
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
    const text = `DevFlow Emergency Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place!`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devflow_backup_codes_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.confirm2FA(secret, code);
      if (res.backup_codes && res.backup_codes.length > 0) {
        setBackupCodes(res.backup_codes);
        setStep('backup');
        await refreshUser();
      } else {
        await refreshUser();
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
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
            <ShieldCheck size={18} />
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>
              {step === 'scan' ? t.twoFASetupTitle : t.backupCodesTitle}
            </h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {step === 'scan' ? (
          <div style={{ padding: '18px' }}>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {t.twoFAScanSubtitle}
            </p>

            {/* QR Code Container */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '14px',
              background: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              maxWidth: '190px',
              margin: '0 auto 14px auto',
            }}>
              {qrCodeURI ? (
                <QRCodeSVG value={qrCodeURI} size={160} level="M" />
              ) : (
                <div style={{ height: '160px', display: 'flex', alignItems: 'center', color: '#666', fontSize: '12px' }}>
                  Loading QR Code...
                </div>
              )}
            </div>

            {/* Manual Secret Key */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{t.orManualKey}</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '1px 5px' }}
                  onClick={handleCopySecret}
                >
                  {copiedSecret ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                  <span>{copiedSecret ? t.keyCopied : t.copyKey}</span>
                </button>
              </div>
              <div style={{
                background: 'var(--bg-subtle)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)',
                fontFamily: 'monospace',
                fontSize: '11.5px',
                textAlign: 'center',
                color: 'var(--badge-prompt-text)',
                letterSpacing: '0.8px',
              }}>
                {secret || '••••••••••••••••'}
              </div>
            </div>

            {error && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                fontSize: '12px',
                marginBottom: '14px',
              }}>
                {error}
              </div>
            )}

            {/* 6-Digit Code Verification */}
            <form onSubmit={handleVerify}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  {t.enter6DigitCode}
                </label>
                <input
                  type="text"
                  className="input-field font-mono"
                  style={{ textAlign: 'center', fontSize: '17px', letterSpacing: '4px', height: '38px' }}
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  {t.cancel}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || code.length !== 6}>
                  <Check size={14} />
                  <span>{loading ? t.activating : t.activate2FA}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ padding: '18px' }}>
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--badge-secret-bg)',
              border: '1px solid var(--badge-secret-border)',
              color: 'var(--badge-secret-text)',
              fontSize: '12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                {t.backupCodesWarning}
              </div>
            </div>

            {/* Backup Codes Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              background: 'var(--bg-subtle)',
              padding: '12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border)',
              marginBottom: '16px',
            }}>
              {backupCodes.map((c, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text)', textAlign: 'center', padding: '2px' }}>
                  {c}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCopyBackupCodes}>
                {copiedBackup ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                <span>{copiedBackup ? t.codesCopied : t.copyAllCodes}</span>
              </button>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleDownloadBackupCodes}>
                <Download size={13} />
                <span>{t.downloadTxt}</span>
              </button>
            </div>

            <button type="button" className="btn btn-primary" style={{ width: '100%', height: '36px' }} onClick={handleFinish}>
              <span>{t.codesSavedConfirm}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
