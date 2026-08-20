import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound 
} from 'lucide-react';
import { useI18n } from '../../context/LanguageContext';
import { api } from '../../services/api';
import type { PasswordStrengthResponse } from '../../types';

export interface ResetPasswordModalProps {
  token: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  token,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [strength, setStrength] = useState<PasswordStrengthResponse | null>(null);

  useEffect(() => {
    if (!newPassword) {
      setStrength(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.checkPassword(newPassword);
        setStrength(res);
      } catch (err) {
        console.error(err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [newPassword]);

  if (!isOpen || !token) return null;

  const handleClose = () => {
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t.passwordsMismatch);
      return;
    }

    if (strength && strength.score < 2) {
      setError(t.passwordWeak);
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || t.invalidToken);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthBarColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'var(--danger)';
      case 2:
        return 'var(--warning)';
      case 3:
        return 'var(--accent)';
      case 4:
        return 'var(--success)';
      default:
        return 'var(--border)';
    }
  };

  const getStrengthText = (score: number) => {
    switch (score) {
      case 0:
        return t.strengthVeryWeak;
      case 1:
        return t.strengthWeak;
      case 2:
        return t.strengthFair;
      case 3:
        return t.strengthGood;
      case 4:
        return t.strengthStrong;
      default:
        return '';
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '380px' }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={16} color="var(--accent)" />
            <h3 style={{ fontSize: '14.5px', fontWeight: '600' }}>
              {t.resetPasswordTitle}
            </h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleClose}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px' }}>
          
          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--danger)',
              fontSize: '12px',
              marginBottom: '14px',
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'var(--badge-note-bg)',
                border: '1px solid var(--badge-note-border)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
              }}>
                <CheckCircle2 size={24} />
              </div>
              <h4 style={{ fontSize: '14.5px', fontWeight: '600', marginBottom: '6px' }}>
                {t.resetPasswordSuccess}
              </h4>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 4px 0' }}>
                  {t.resetPasswordSubtitle}
                </p>

                {/* New Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.newPasswordLabel}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      style={{ paddingLeft: '32px', paddingRight: '34px' }}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {strength && (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                        <span style={{ color: 'var(--text-dim)' }}>{t.strengthLabel}</span>
                        <span style={{ color: getStrengthBarColor(strength.score), fontWeight: '600' }}>
                          {getStrengthText(strength.score)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '3px', height: '3px' }}>
                        {[0, 1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            style={{
                              flex: 1,
                              borderRadius: '2px',
                              background: idx <= strength.score ? getStrengthBarColor(strength.score) : 'var(--border)',
                              transition: 'background 0.2s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.confirmNewPasswordLabel}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      style={{ paddingLeft: '32px' }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '36px', marginTop: '6px', fontSize: '13px' }}
                  disabled={loading || !newPassword || !confirmPassword}
                >
                  {loading ? t.processing : t.resetPasswordButton}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
