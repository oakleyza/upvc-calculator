// ------------------------------------------------------------------
// Firebase initialization — ใช้ env vars แทน hardcode (S-6)
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
let _db: Firestore | null = null;

try {
  if (firebaseConfig.apiKey) {
    // ป้องกัน "Firebase App named '[DEFAULT]' already exists" จาก Vite HMR
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    _db = getFirestore(app);
    console.log('[Firebase] initialized OK, project:', firebaseConfig.projectId);
  } else {
    console.error('[Firebase] VITE_FIREBASE_API_KEY is missing — check .env file');
  }
} catch (e) {
  console.error('[Firebase] init error:', e);
}

export const db = _db;
export const isFirebaseConfigured = (): boolean => _db !== null;
