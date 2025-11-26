'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken } from '../lib/api';

type User = {
  id: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    try {
      const me = await api.get<User | { data: User | null }>('/auth/admin/me');
      const userData = (me as any)?.data ?? me;
      if (userData && (userData as User).id) {
        setUser(userData as User);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      // Swallow 401s to avoid noisy crashes; user stays logged out.
      setUser(null);
      const message =
        typeof err?.message === 'string' && !err.message.startsWith('<')
          ? err.message
          : 'Not authenticated';
      setError(message);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      await api.post('/auth/admin/refresh', {});
      await fetchMe();
    } catch (err: any) {
      setUser(null);
      setAccessToken(null);
      const message =
        typeof err?.message === 'string' && !err.message.startsWith('<')
          ? err.message
          : 'Session expired. Please sign in again.';
      setError(message);
    }
  }, [fetchMe]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setLoading(true);
      setError(null);
      try {
        await api.post('/auth/admin/login', { email, password });
        // Tokens are set via HttpOnly cookies; fetch profile next.
        setAccessToken(null);
        await fetchMe();
      } catch (err: any) {
        const raw = typeof err?.message === 'string' ? err.message : '';
        const looksLikeJson = raw.trim().startsWith('{') || raw.includes('statusCode');
        const message =
          !raw || looksLikeJson || raw.length > 160
            ? 'Invalid credentials or insufficient permissions.'
            : raw;
        setError(message);
        setUser(null);
        setAccessToken(null);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchMe]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/admin/logout', {});
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await fetchMe();
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchMe]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      refreshToken
    }),
    [user, loading, error, login, logout, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
