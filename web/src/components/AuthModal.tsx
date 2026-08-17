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
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import { api } from '../lib/api';
import type { PasswordStrength } from '../types';

interface AuthModalProps {
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

  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (tab !== 'register' || !password) {
      setStrength(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.checkPasswordStrength(password);
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t.passwordsMismatch);
      return;
    }

    if (strength && !strength.is_valid) {
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

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 4: return 'var(--success)';
      case 3: return 'var(--badge-code-text)';
      case 2: return 'var(--badge-secret-text)';
      case 1: return '#fb923c';
      default: return 'var(--danger)';
    }
  };

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 4: return t.strengthStrong;
      case 3: return t.strengthGood;
      case 2: return t.strengthFair;
      case 1: return t.strengthWeak;
      default: return t.strengthVeryWeak;
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        
        {/* Header with Close */}
        <div style={{ padding: '16px 18px 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600' }}>
            {requires2FA ? t.twoFATitle : tab === 'login' ? t.signInTitle : t.signUpTitle}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>

        {/* 2FA Challenge Screen */}
        {requires2FA ? (
          <form onSubmit={handle2FASubmit} style={{ padding: '18px' }}>
            <div style={{ textAlign: 'center', margin: '6px 0 16px 0' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <ShieldCheck size={22} color="var(--text)" />
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {t.twoFASubtitle}
              </p>
            </div>

            {error && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                fontSize: '12.5px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="input-field font-mono"
                style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px', height: '42px' }}
                placeholder="000000"
                maxLength={12}
                value={code2FA}
                onChange={(e) => setCode2FA(e.target.value.trim())}
                autoFocus
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={cancel2FA}>
                {t.cancel}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || !code2FA}>
                {loading ? t.verifying : t.verifyButton}
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', padding: '12px 18px 0 18px', gap: '6px' }}>
              <button
                type="button"
                className={`btn ${tab === 'login' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '12.5px', borderBottom: tab === 'login' ? '2px solid var(--text)' : undefined }}
                onClick={() => { setTab('login'); setError(null); }}
              >
                {t.signInButton}
              </button>
              <button
                type="button"
                className={`btn ${tab === 'register' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '12.5px', borderBottom: tab === 'register' ? '2px solid var(--text)' : undefined }}
                onClick={() => { setTab('register'); setError(null); }}
              >
                {t.signUpButton}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                margin: '12px 18px 0 18px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Forms */}
            <form onSubmit={tab === 'login' ? handleLoginSubmit : handleRegisterSubmit} style={{ padding: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Username Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {tab === 'login' ? t.usernameOrEmail : t.username}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '32px' }}
                      placeholder="e.g. lexa"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email (only on Register) */}
                {tab === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t.email}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="email"
                        className="input-field"
                        style={{ paddingLeft: '32px' }}
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t.password}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      style={{ paddingLeft: '32px', paddingRight: '32px' }}
                      placeholder="••••••••••••"
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
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {tab === 'register' && password && strength && (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-dim)' }}>{t.strengthLabel}</span>
                        <span style={{ fontWeight: '600', color: getStrengthColor(strength.score), fontFamily: 'monospace' }}>
                          {getStrengthLabel(strength.score)} ({strength.entropy} bits)
                        </span>
                      </div>
                      
                      <div style={{ height: '3px', width: '100%', background: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, ((strength.score + 1) / 5) * 100)}%`,
                            backgroundColor: getStrengthColor(strength.score),
                            transition: 'width 0.15s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password (only on Register) */}
                {tab === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t.confirmPassword}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input-field"
                        style={{ paddingLeft: '32px' }}
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '16px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '36px' }}
                  disabled={loading}
                >
                  {loading
                    ? t.processing
                    : tab === 'login'
                    ? t.signInButton
                    : t.signUpButton}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
