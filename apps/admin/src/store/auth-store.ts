'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminAuthApi } from '../lib/api-client';
import type { AdminUser } from '../types/auth';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AdminUser | null;
  status: AuthStatus;
  error?: string;
  initialize: () => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: 'idle',
      async initialize() {
        if (get().status !== 'idle') {
          return;
        }
        set({ status: 'loading' });
        try {
          const user = await adminAuthApi.me();
          if (user) {
            set({ user, status: 'authenticated', error: undefined });
          } else {
            set({ user: null, status: 'unauthenticated', error: undefined });
          }
        } catch (error) {
          set({
            user: null,
            status: 'unauthenticated',
            error: error instanceof Error ? error.message : 'Unable to load session'
          });
        }
      },
      async login(payload) {
        set({ status: 'loading', error: undefined });
        try {
          const user = await adminAuthApi.login(payload);
          set({ user, status: 'authenticated', error: undefined });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to login';
          set({ status: 'unauthenticated', error: message });
          throw error;
        }
      },
      async logout() {
        try {
          await adminAuthApi.logout();
        } finally {
          set({ user: null, status: 'unauthenticated', error: undefined });
        }
      }
    }),
    {
      name: 'admin-auth-store',
      partialize: (state) => ({
        user: state.user
      })
    }
  )
);
