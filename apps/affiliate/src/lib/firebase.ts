import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Public web keys -- safe to fallback to unblock dev if env loading is flaky.
const DEFAULT_PUBLIC_CONFIG = {
  apiKey: 'AIzaSyDrlghDvok0_oqWuGD9mqDysgHRKzbxxbg',
  authDomain: 'affiliate-portal-2025.firebaseapp.com',
  projectId: 'affiliate-portal-2025',
  storageBucket: 'affiliate-portal-2025.firebasestorage.app',
  messagingSenderId: '30046204699',
  appId: '1:30046204699:web:891e39624d820114ccd9be'
};

const resolveValue = <K extends keyof typeof DEFAULT_PUBLIC_CONFIG>(key: K, envKey: string) => {
  const val = process.env[envKey as keyof NodeJS.ProcessEnv];
  if (!val && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(`[firebase] Using fallback for ${key}; set ${envKey} in .env.local`);
  }
  return val ?? DEFAULT_PUBLIC_CONFIG[key];
};

const firebaseConfig = {
  apiKey: resolveValue('apiKey', 'NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: resolveValue('authDomain', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: resolveValue('projectId', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: resolveValue('storageBucket', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: resolveValue('messagingSenderId', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: resolveValue('appId', 'NEXT_PUBLIC_FIREBASE_APP_ID')
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

// Skip reCAPTCHA in local dev (or when explicitly toggled) to avoid phone auth failures from missing site keys.
const envWantsDisable = process.env.NEXT_PUBLIC_FIREBASE_DISABLE_APP_VERIFICATION === 'true';
const shouldDisableAppVerification =
  process.env.NODE_ENV === 'development' ||
  envWantsDisable ||
  // Also auto-disable when running on typical local hosts even if built as "production".
  (typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname));

if (typeof window !== 'undefined' && shouldDisableAppVerification) {
  firebaseAuth.settings.appVerificationDisabledForTesting = true;
}
