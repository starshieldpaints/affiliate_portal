'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authApi } from '../lib/api-client';
import type { AuthUser } from '../types/auth';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error?: string;
  initialize: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    phone: string;
    country?: string;
    marketingOptIn?: boolean;
    termsAccepted: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateAffiliateProfile: (updates: Partial<NonNullable<AuthUser['affiliate']>>) => void;
  markEmailVerified: (verifiedAt: string) => void;
  markPhoneVerified: (verifiedAt: string) => void;
}

const memoryStorage: Storage = {
  get length() {
    return 0;
  },
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: 'idle',
      async restoreSession() {
        try {
          const refreshedUser = await authApi.refresh();
          if (refreshedUser) {
            set({ user: refreshedUser, status: 'authenticated', error: undefined });
            return true;
          }
        } catch (refreshError) {
          set({
            user: null,
            status: 'unauthenticated',
            error:
              refreshError instanceof Error
                ? refreshError.message
                : 'Unable to refresh session'
          });
        }
        return false;
      },
      async initialize() {
        // Always attempt to resume the cookie-backed session, even if a cached user exists.
        set({ status: 'loading' });
        try {
          const user = await authApi.me();
          if (user) {
            set({ user, status: 'authenticated', error: undefined });
            return;
          }
          const restored = await get().restoreSession();
          if (!restored) {
            set({ user: null, status: 'unauthenticated', error: undefined });
          }
        } catch (error) {
          const restored = await get().restoreSession();
          if (!restored) {
            set({
              user: null,
              status: 'unauthenticated',
              error: error instanceof Error ? error.message : 'Unable to load session'
            });
          }
        }
      },
      async login(payload) {
        set({ status: 'loading', error: undefined });
        try {
          const user = await authApi.login(payload);
          set({ user, status: 'authenticated', error: undefined });
        } catch (error) {
          set({
            status: 'unauthenticated',
            error: error instanceof Error ? error.message : 'Login failed'
          });
          throw error;
        }
      },
      async register(payload) {
        set({ status: 'loading', error: undefined });
        try {
          const user = await authApi.register(payload);
          set({ user, status: 'authenticated', error: undefined });
        } catch (error) {
          set({
            status: 'unauthenticated',
            error: error instanceof Error ? error.message : 'Registration failed'
          });
          throw error;
        }
      },
      async logout() {
        try {
          await authApi.logout();
        } finally {
          set({ user: null, status: 'unauthenticated' });
        }
      },
      updateAffiliateProfile(updates) {
        set((state) => {
          if (!state.user) return state;
          const fallbackAffiliate = state.user.affiliate ?? {
            id: 'local-profile',
            displayName: state.user.email ?? 'Affiliate',
            defaultReferralCode: state.user.email ?? 'AFFILIATE',
            kycStatus: 'pending',
            payoutMethod: null,
            payoutDetails: null,
            phone: null,
            phoneVerifiedAt: null,
            panNumber: null,
            aadhaarNumber: null,
            panImageUrl: null,
            aadhaarFrontUrl: null,
            aadhaarBackUrl: null
          };
          return {
            ...state,
            user: {
              ...state.user,
              affiliate: { ...fallbackAffiliate, ...updates }
            }
          };
        });
      },
      markEmailVerified(verifiedAt) {
        set((state) => {
          if (!state.user) {
            return state;
          }
          return {
            ...state,
            user: {
              ...state.user,
              emailVerifiedAt: verifiedAt
            }
          };
        });
      },
      markPhoneVerified(verifiedAt) {
        set((state) => {
          if (!state.user || !state.user.affiliate) {
            return state;
          }
          return {
            ...state,
            user: {
              ...state.user,
              affiliate: {
                ...state.user.affiliate,
                phoneVerifiedAt: verifiedAt
              }
            }
          };
        });
      }
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? memoryStorage : window.localStorage
      ),
      // Persist minimal session state so UI can render quickly; backend still authorizes via cookies.
      partialize: (state) => ({
        user: state.user,
        status: state.status
      })
    }
  )
);
