// ------------------------------------------------------------------
// Firebase initialization — ใช้ env vars แทน hardcode (S-6)
// FIX: ใช้ getApps() ป้องกัน "already exists" error จาก Vite HMR
// ------------------------------------------------------------------
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  if (firebaseConfig.apiKey) {
    // ป้องกัน "Firebase App named '[DEFAULT]' already exists" จาก Vite HMR
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } else {
    console.warn('Firebase config missing — check .env file');
  }
} catch (e) {
  console.error('Firebase init error', e);
}

export { db };
export const isFirebaseConfigured = (): boolean => db !== null;
