import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  requires2FA: boolean;
  tempToken: string | null;
  login: (loginStr: string, password: string) => Promise<AuthResponse>;
  verify2FA: (code: string) => Promise<void>;
  cancel2FA: () => void;
  register: (username: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const refreshUser = async () => {
    const token = localStorage.getItem('devflow_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch {
      setUser(null);
      localStorage.removeItem('devflow_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
      setRequires2FA(false);
      setTempToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (loginStr: string, password: string): Promise<AuthResponse> => {
    const res = await api.login({ login: loginStr, password });
    if (res.requires_2fa && res.temp_token) {
      setRequires2FA(true);
      setTempToken(res.temp_token);
      return res;
    }

    if (res.token) {
      localStorage.setItem('devflow_token', res.token);
    }

    setRequires2FA(false);
    setTempToken(null);
    if (res.user) {
      setUser(res.user);
    } else {
      await refreshUser();
    }
    return res;
  };

  const verify2FA = async (code: string): Promise<void> => {
    if (!tempToken) throw new Error('No 2FA challenge active');
    const res = await api.verify2FATemp(tempToken, code);
    if (res.token) {
      localStorage.setItem('devflow_token', res.token);
    }
    setRequires2FA(false);
    setTempToken(null);
    if (res.user) {
      setUser(res.user);
    } else {
      await refreshUser();
    }
  };

  const cancel2FA = () => {
    setRequires2FA(false);
    setTempToken(null);
  };

  const register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await api.register({ username, email, password });
    if (res.token) {
      localStorage.setItem('devflow_token', res.token);
    }
    if (res.user) {
      setUser(res.user);
    } else {
      await refreshUser();
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      localStorage.removeItem('devflow_token');
      setUser(null);
      setRequires2FA(false);
      setTempToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        requires2FA,
        tempToken,
        login,
        verify2FA,
        cancel2FA,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
