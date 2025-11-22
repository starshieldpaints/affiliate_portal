import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const resolveValue = (envKey: string) => {
  const val = process.env[envKey as keyof NodeJS.ProcessEnv];
  if (!val) {
    const msg = `[firebase] Missing required env ${envKey}. Create apps/affiliate/.env.local with your Firebase web config.`;
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(msg);
    } else {
      throw new Error(msg);
    }
  }
  return val as string;
};

const firebaseConfig = {
  apiKey: resolveValue('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: resolveValue('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: resolveValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: resolveValue('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: resolveValue('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: resolveValue('NEXT_PUBLIC_FIREBASE_APP_ID')
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
