// ─── Firebase Configuration ──────────────────────────────────────────────────
// To enable Phone OTP login, uncomment and fill VITE_FIREBASE_* in your .env
// ─────────────────────────────────────────────────────────────────────────────

const apiKey =            import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain =        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId =         import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket =     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId =             import.meta.env.VITE_FIREBASE_APP_ID;

// True only when ALL keys are present and are not placeholder strings
export const isFirebaseConfigured =
  !!apiKey && apiKey !== 'your_api_key' &&
  !!authDomain && !!projectId;

export const firebaseConfig = {
  apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId,
};
