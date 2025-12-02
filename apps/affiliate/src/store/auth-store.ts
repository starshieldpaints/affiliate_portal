// 'use client';

// import { create } from 'zustand';
// import { createJSONStorage, persist } from 'zustand/middleware';
// import { authApi } from '../lib/api-client';
// import type { AuthUser } from '../types/auth';

// type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

// interface AuthState {
//   user: AuthUser | null;
//   status: AuthStatus;
//   error?: string;
//   initialize: () => Promise<void>;
//   restoreSession: () => Promise<boolean>;
//   login: (payload: { email: string; password: string }) => Promise<void>;
//   register: (payload: {
//     email: string;
//     password: string;
//     displayName: string;
//     phone: string;
//     country?: string;
//     marketingOptIn?: boolean;
//     termsAccepted: boolean;
//   }) => Promise<void>;
//   logout: () => Promise<void>;
//   updateAffiliateProfile: (updates: Partial<NonNullable<AuthUser['affiliate']>>) => void;
//   markEmailVerified: (verifiedAt: string) => void;
//   markPhoneVerified: (verifiedAt: string) => void;
// }

// const memoryStorage: Storage = {
//   get length() {
//     return 0;
//   },
//   clear: () => undefined,
//   getItem: () => null,
//   key: () => null,
//   removeItem: () => undefined,
//   setItem: () => undefined
// };

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set, get) => ({
//       user: null,
//       status: 'idle',
//       async restoreSession() {
//         try {
//           const refreshedUser = await authApi.refresh();
//           if (refreshedUser) {
//             set({ user: refreshedUser, status: 'authenticated', error: undefined });
//             return true;
//           }
//         } catch (refreshError) {
//           set({
//             user: null,
//             status: 'unauthenticated',
//             error:
//               refreshError instanceof Error
//                 ? refreshError.message
//                 : 'Unable to refresh session'
//           });
//         }
//         return false;
//       },
//       async initialize() {
//         // Always attempt to resume the cookie-backed session, even if a cached user exists.
//         set({ status: 'loading' });
//         try {
//           const user = await authApi.me();
//           if (user) {
//             set({ user, status: 'authenticated', error: undefined });
//             return;
//           }
//           const restored = await get().restoreSession();
//           if (!restored) {
//             set({ user: null, status: 'unauthenticated', error: undefined });
//           }
//         } catch (error) {
//           const restored = await get().restoreSession();
//           if (!restored) {
//             set({
//               user: null,
//               status: 'unauthenticated',
//               error: error instanceof Error ? error.message : 'Unable to load session'
//             });
//           }
//         }
//       },
//       async login(payload) {
//         set({ status: 'loading', error: undefined });
//         try {
//           const user = await authApi.login(payload);
//           set({ user, status: 'authenticated', error: undefined });
//         } catch (error) {
//           set({
//             status: 'unauthenticated',
//             error: error instanceof Error ? error.message : 'Login failed'
//           });
//           throw error;
//         }
//       },
//       async register(payload) {
//         set({ status: 'loading', error: undefined });
//         try {
//           const user = await authApi.register(payload);
//           set({ user, status: 'authenticated', error: undefined });
//         } catch (error) {
//           set({
//             status: 'unauthenticated',
//             error: error instanceof Error ? error.message : 'Registration failed'
//           });
//           throw error;
//         }
//       },
//       async logout() {
//         try {
//           await authApi.logout();
//         } finally {
//           set({ user: null, status: 'unauthenticated' });
//         }
//       },
//       updateAffiliateProfile(updates) {
//         set((state) => {
//           if (!state.user) return state;
//           const fallbackAffiliate = state.user.affiliate ?? {
//             id: 'local-profile',
//             displayName: state.user.email ?? 'Affiliate',
//             defaultReferralCode: state.user.email ?? 'AFFILIATE',
//             kycStatus: 'pending',
//             payoutMethod: null,
//             payoutDetails: null,
//             phone: null,
//             phoneVerifiedAt: null,
//             panNumber: null,
//             aadhaarNumber: null,
//             panImageUrl: null,
//             aadhaarFrontUrl: null,
//             aadhaarBackUrl: null
//           };
//           return {
//             ...state,
//             user: {
//               ...state.user,
//               affiliate: { ...fallbackAffiliate, ...updates }
//             }
//           };
//         });
//       },
//       markEmailVerified(verifiedAt) {
//         set((state) => {
//           if (!state.user) {
//             return state;
//           }
//           return {
//             ...state,
//             user: {
//               ...state.user,
//               emailVerifiedAt: verifiedAt
//             }
//           };
//         });
//       },
//       markPhoneVerified(verifiedAt) {
//         set((state) => {
//           if (!state.user || !state.user.affiliate) {
//             return state;
//           }
//           return {
//             ...state,
//             user: {
//               ...state.user,
//               affiliate: {
//                 ...state.user.affiliate,
//                 phoneVerifiedAt: verifiedAt
//               }
//             }
//           };
//         });
//       }
//     }),
//     {
//       name: 'auth-store',
//       storage: createJSONStorage(() =>
//         typeof window === 'undefined' ? memoryStorage : window.localStorage
//       ),
//       // Persist minimal session state so UI can render quickly; backend still authorizes via cookies.
//       partialize: (state) => ({
//         user: state.user,
//         status: state.status
//       })
//     }
//   )
// );












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
  wasLoggedOut: boolean;

  initialize: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: any) => Promise<void>;
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

/**
 * NOTE:
 * - We persist only the minimal state (user + wasLoggedOut) to avoid hydration issues.
 * - We NEVER persist `status`. Persisting transient fields like status causes rehydration bugs.
 * - The logout flow clears the persisted storage via `useAuthStore.persist.clearStorage()` which is the safe API.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: 'idle',
      error: undefined,
      wasLoggedOut: false,

      async restoreSession() {
        try {
          const refreshedUser = await authApi.refresh();
          if (refreshedUser) {
            set({ user: refreshedUser, status: 'authenticated', error: undefined });
            return true;
          }
        } catch (err) {
          set({
            user: null,
            status: 'unauthenticated',
            error: err instanceof Error ? err.message : 'Unable to refresh session'
          });
        }
        return false;
      },

      async initialize() {
        const { wasLoggedOut } = get();

        // If user explicitly logged out, do not auto-restore
        if (wasLoggedOut) {
          set({ user: null, status: 'unauthenticated', error: undefined });
          return;
        }

        set({ status: 'loading', error: undefined });

        try {
          // Important: api-client should fetch /auth/me with cache: 'no-store' to avoid 304-cached responses.
          const user = await authApi.me();
          if (user) {
            set({ user, status: 'authenticated', error: undefined });
            return;
          }

          const restored = await get().restoreSession();
          if (!restored) {
            set({ user: null, status: 'unauthenticated', error: undefined });
          }
        } catch (err) {
          const restored = await get().restoreSession();
          if (!restored) {
            set({
              user: null,
              status: 'unauthenticated',
              error: err instanceof Error ? err.message : 'Unable to load session'
            });
          }
        }
      },

      async login(payload) {
        set({ status: 'loading', error: undefined });
        try {
          const user = await authApi.login(payload);
          set({ user, status: 'authenticated', wasLoggedOut: false, error: undefined });
        } catch (err) {
          set({
            status: 'unauthenticated',
            error: err instanceof Error ? err.message : 'Login failed'
          });
          throw err;
        }
      },

      async register(payload) {
        set({ status: 'loading', error: undefined });
        try {
          const user = await authApi.register(payload);
          set({ user, status: 'authenticated', wasLoggedOut: false, error: undefined });
        } catch (err) {
          set({
            status: 'unauthenticated',
            error: err instanceof Error ? err.message : 'Registration failed'
          });
          throw err;
        }
      },

      async logout() {
        try {
          // Make sure server gets a shot at revoking the refresh token.
          await authApi.logout();
        } catch (err) {
          // swallow: we still want to clear local client state/cookies regardless
          // console.warn('logout request failed (ignored):', err.message ?? err);
        }

        // Safely clear persistent storage using Zustand's API (don't manipulate localStorage directly here)
        // This removes the persisted key so rehydration cannot reintroduce the old user.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - `persist` is a runtime prop on the resulting hook object
        if (typeof useAuthStore.persist?.clearStorage === 'function') {
          // prefer the provided API
          useAuthStore.persist.clearStorage();
        } else if (typeof window !== 'undefined') {
          // fallback (shouldn't be necessary, but safe)
          try {
            window.localStorage.removeItem('auth-store');
          } catch { }
        }

        // Reset in-memory state
        set({
          user: null,
          status: 'unauthenticated',
          error: undefined,
          wasLoggedOut: true
        });

        // Force navigation to login via hard reload so that no stale React state remains
        if (typeof window !== 'undefined') {
          window.location.replace('/auth/login');
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
            user: { ...state.user, affiliate: { ...fallbackAffiliate, ...updates } }
          };
        });
      },

      markEmailVerified(verifiedAt) {
        set((state) => {
          if (!state.user) return state;
          return { ...state, user: { ...state.user, emailVerifiedAt: verifiedAt } };
        });
      },

      markPhoneVerified(verifiedAt) {
        set((state) => {
          if (!state.user || !state.user.affiliate) return state;
          return {
            ...state,
            user: { ...state.user, affiliate: { ...state.user.affiliate, phoneVerifiedAt: verifiedAt } }
          };
        });
      }
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? memoryStorage : window.localStorage)),
      // Persist only what's required — not transient status values.
      partialize: (state) => ({
        user: state.user,
        wasLoggedOut: state.wasLoggedOut
      })
    }
  )
);
