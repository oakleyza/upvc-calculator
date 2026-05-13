// ------------------------------------------------------------------
// Firebase initialization
// หมายเหตุ: Firebase client config ไม่ใช่ความลับ — ปลอดภัยที่จะฝังในโค้ด
// ความปลอดภัยอยู่ที่ Firestore Security Rules ไม่ใช่ที่ API key
// ------------------------------------------------------------------
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyArPJYIIChxZiZXRAIS_MTLlAKoVxr2qEc',
  authDomain:        'upvc-calc.firebaseapp.com',
  projectId:         'upvc-calc',
  storageBucket:     'upvc-calc.firebasestorage.app',
  messagingSenderId: '994926197400',
  appId:             '1:994926197400:web:087ef98f9dac042dbeeeed',
};

let app: FirebaseApp | null = null;
let _db: Firestore | null = null;

try {
  // ป้องกัน "Firebase App named '[DEFAULT]' already exists" จาก Vite HMR
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  _db = getFirestore(app);
} catch (e) {
  console.error('[Firebase] init error:', e);
}

export const db = _db;
export const isFirebaseConfigured = (): boolean => _db !== null;
