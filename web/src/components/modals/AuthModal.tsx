import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff
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

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code2FA, setCode2FA] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await verify2FA(code2FA);
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'var(--danger)';
      case 2:
        return '#fbbf24';
      case 3:
      case 4:
        return 'var(--success)';
      default:
        return 'var(--text-dim)';
    }
  };

  const getStrengthText = (score: number) => {
    switch (score) {
      case 0: return t.strengthVeryWeak;
      case 1: return t.strengthWeak;
      case 2: return t.strengthFair;
      case 3: return t.strengthGood;
      case 4: return t.strengthStrong;
      default: return '';
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: '600' }}>
            {requires2FA ? t.twoFATitle : tab === 'login' ? t.signInTitle : t.signUpTitle}
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher (Only if not in 2FA mode) */}
        {!requires2FA && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 18px 0 18px', gap: '8px', borderBottom: '1px solid var(--border)' }}>
            <button
              type="button"
              className={`btn ${tab === 'login' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ fontSize: '12.5px', padding: '6px 8px', borderBottom: tab === 'login' ? '2px solid var(--text)' : undefined }}
              onClick={() => {
                setTab('login');
                setError(null);
              }}
            >
              {t.signInButton}
            </button>
            <button
              type="button"
              className={`btn ${tab === 'register' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ fontSize: '12.5px', padding: '6px 8px', borderBottom: tab === 'register' ? '2px solid var(--text)' : undefined }}
              onClick={() => {
                setTab('register');
                setError(null);
              }}
            >
              {t.signUpButton}
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '18px' }}>
          
          {/* Error Alert */}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
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
                  {password && strength && (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>{t.strengthLabel}</span>
                        <span style={{ fontSize: '10.5px', fontWeight: '600', color: getStrengthColor(strength.score) }}>
                          {getStrengthText(strength.score)}
                        </span>
                      </div>
                      <div style={{ height: '3px', width: '100%', background: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${((strength.score + 1) / 5) * 100}%`,
                            background: getStrengthColor(strength.score),
                            transition: 'width 0.2s ease, background 0.2s ease',
                          }}
                        />
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
                      type="password"
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
