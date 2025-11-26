import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Note: Next.js only inlines env vars when accessed statically. Do not use computed keys.
const firebaseEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const sanitize = (value: string | undefined | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toUpperCase().startsWith('YOUR_')) return undefined;
  return trimmed;
};

const firebaseConfig = {
  apiKey: sanitize(firebaseEnv.apiKey),
  authDomain: sanitize(firebaseEnv.authDomain),
  projectId: sanitize(firebaseEnv.projectId),
  storageBucket: sanitize(firebaseEnv.storageBucket),
  messagingSenderId: sanitize(firebaseEnv.messagingSenderId),
  appId: sanitize(firebaseEnv.appId)
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([key]) => key);

export const firebaseReady = missingKeys.length === 0;

if (missingKeys.length && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.warn(
    `[firebase] Missing required envs (${missingKeys.join(
      ', '
    )}). Create apps/affiliate/.env.local with your Firebase web config.`
  );
}

let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;

if (firebaseReady) {
  try {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `[firebase] Failed to initialize client SDK${
        error instanceof Error ? `: ${error.message}` : ''
      }. The profile page will fall back to a disabled state until config is fixed.`
    );
    firebaseApp = undefined;
    firebaseAuth = undefined;
  }
}

export { firebaseApp, firebaseAuth };

// Skip reCAPTCHA in local dev (or when explicitly toggled) to avoid phone auth failures from missing site keys.
const envWantsDisable = process.env.NEXT_PUBLIC_FIREBASE_DISABLE_APP_VERIFICATION === 'true';
const shouldDisableAppVerification =
  process.env.NODE_ENV === 'development' ||
  envWantsDisable ||
  // Also auto-disable when running on typical local hosts even if built as "production".
  (typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname));

if (typeof window !== 'undefined' && shouldDisableAppVerification && firebaseAuth?.settings) {
  firebaseAuth.settings.appVerificationDisabledForTesting = true;
}
