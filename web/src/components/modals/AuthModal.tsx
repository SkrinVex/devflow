import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/LanguageContext';
import { api } from '../../services/api';
import type { PasswordStrengthResponse } from '../../types';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, register, requires2FA, verify2FA, cancel2FA } = useAuth();
  const { t } = useI18n();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code2FA, setCode2FA] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const [strength, setStrength] = useState<PasswordStrengthResponse | null>(null);

  useEffect(() => {
    if (tab !== 'register' || !password) {
      setStrength(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.checkPassword(password);
        setStrength(res);
      } catch (err) {
        console.error(err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [password, tab]);

  if (!isOpen) return null;

  const handleClose = () => {
    setError(null);
    setForgotSent(false);
    cancel2FA();
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(username, password);
      if (!res.requires_2fa) {
        handleClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t.passwordsMismatch);
      return;
    }

    if (strength && strength.score < 2) {
      setError(t.passwordWeak);
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await verify2FA(code2FA);
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code');
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
        {/* Header Tabs */}
        {!requires2FA && tab !== 'forgot' && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
          }}>
            <button
              type="button"
              className="tab-btn"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: tab === 'login' ? 'var(--bg-card)' : 'transparent',
                color: tab === 'login' ? 'var(--text)' : 'var(--text-dim)',
                borderBottom: tab === 'login' ? '2px solid var(--text)' : '2px solid transparent',
                fontWeight: tab === 'login' ? '600' : '400',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setTab('login');
                setError(null);
              }}
            >
              {t.signInTitle}
            </button>
            <button
              type="button"
              className="tab-btn"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: tab === 'register' ? 'var(--bg-card)' : 'transparent',
                color: tab === 'register' ? 'var(--text)' : 'var(--text-dim)',
                borderBottom: tab === 'register' ? '2px solid var(--text)' : '2px solid transparent',
                fontWeight: tab === 'register' ? '600' : '400',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setTab('register');
                setError(null);
              }}
            >
              {t.signUpTitle}
            </button>
            <button 
              className="btn btn-ghost btn-icon" 
              onClick={handleClose}
              style={{ margin: '8px 8px 0 0' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Header when in 2FA or Forgot mode */}
        {(requires2FA || tab === 'forgot') && (
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {tab === 'forgot' && (
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  style={{ width: '26px', height: '26px' }}
                  onClick={() => {
                    setTab('login');
                    setForgotSent(false);
                    setError(null);
                  }}
                >
                  <ArrowLeft size={14} />
                </button>
              )}
              <h3 style={{ fontSize: '14.5px', fontWeight: '600' }}>
                {requires2FA ? t.twoFATitle : t.forgotPasswordTitle}
              </h3>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={handleClose}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* Modal Body */}
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

          {/* 2FA Challenge Form */}
          {requires2FA ? (
            <form onSubmit={handle2FASubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.4' }}>
                  <ShieldCheck size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span>{t.twoFASubtitle}</span>
                </div>

                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    autoComplete="one-time-code"
                    maxLength={10}
                    placeholder="000 000"
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                    className="input-field font-mono"
                    style={{ fontSize: '20px', letterSpacing: '4px', textAlign: 'center', height: '44px' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ flex: 1 }}
                    onClick={cancel2FA}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1.5 }}
                    disabled={loading || code2FA.length < 6}
                  >
                    {loading ? t.verifying : t.verifyButton}
                  </button>
                </div>
              </div>
            </form>
          ) : tab === 'forgot' ? (

            /* Forgot Password Form */
            forgotSent ? (
              <div style={{ textAlign: 'center', padding: '12px 6px' }}>
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
                  margin: '0 auto 14px auto',
                }}>
                  <CheckCircle2 size={24} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>
                  {t.resetLinkSentTitle}
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}>
                  {t.resetLinkSentDesc}
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setTab('login');
                    setForgotSent(false);
                  }}
                >
                  {t.backToSignIn}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 4px 0' }}>
                    {t.forgotPasswordSubtitle}
                  </p>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t.email}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="email"
                        className="input-field"
                        style={{ paddingLeft: '32px' }}
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', height: '36px', marginTop: '6px', fontSize: '13px' }}
                    disabled={loading || !forgotEmail}
                  >
                    {loading ? t.sendingResetLink : t.sendResetLink}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: '100%', fontSize: '12px' }}
                    onClick={() => {
                      setTab('login');
                      setError(null);
                    }}
                  >
                    {t.backToSignIn}
                  </button>
                </div>
              </form>
            )
          ) : tab === 'login' ? (
            
            /* Login Form */
            <form onSubmit={handleLoginSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.usernameOrEmail}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '32px' }}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)' }}>
                      {t.password}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('forgot');
                        setError(null);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      {t.forgotPassword}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      style={{ paddingLeft: '32px', paddingRight: '34px' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '36px', marginTop: '6px', fontSize: '13px' }}
                  disabled={loading}
                >
                  {loading ? t.processing : t.signInButton}
                </button>
              </div>
            </form>
          ) : (
            
            /* Register Form */
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.username}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '32px' }}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.email}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      className="input-field"
                      style={{ paddingLeft: '32px' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.password}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      style={{ paddingLeft: '32px', paddingRight: '34px' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.confirmPassword}
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
                  disabled={loading}
                >
                  {loading ? t.processing : t.signUpButton}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
