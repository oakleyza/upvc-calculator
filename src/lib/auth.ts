// ------------------------------------------------------------------
// Authentication utilities
// S-3: SHA-256 + salt แทน simpleHash
// S-4: Session expiry 8 ชั่วโมง
// S-5: Rate limiting 5 attempts / 30 วินาที
// B-1: ใช้ localStorage อย่างถูกต้อง (ไม่ใช้ sessionStorage ผิด)
// ------------------------------------------------------------------

import type { SessionUser } from '../types';
import { SESSION_EXPIRY_MS } from '../constants';

const SESSION_KEY = 'upvc_session';

// ------------------------------------------------------------------
// SHA-256 hash ด้วย Web Crypto API (async, ปลอดภัยกว่า djb2)
// ------------------------------------------------------------------
export const sha256 = async (str: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateSalt = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

// secureHash: SHA-256(salt + password + salt) — ต้านทาน rainbow table
export const secureHash = async (password: string, salt: string): Promise<string> =>
  sha256(salt + password + salt);

// ------------------------------------------------------------------
// Legacy hash (djb2) — ใช้เฉพาะ lazy migration เท่านั้น
// เมื่อ user login ด้วย old hash สำเร็จ จะ upgrade เป็น SHA-256 ทันที
// ------------------------------------------------------------------
export const legacyHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

// ตรวจว่าเป็น old format หรือเปล่า (old = hex string ≤ 8 chars, ไม่มี salt)
export const isLegacyHash = (hash: string): boolean =>
  hash.length <= 8 && /^[0-9a-f]+$/.test(hash);

// ------------------------------------------------------------------
// Session management (B-1: ใช้ localStorage อย่างสม่ำเสมอ)
// ------------------------------------------------------------------
export const saveSession = (user: SessionUser): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const loadSession = (): SessionUser | null => {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const session = JSON.parse(saved) as SessionUser;
    // S-4: ตรวจ session expiry
    if (Date.now() - session.loginAt > SESSION_EXPIRY_MS) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    // B-1: ถ้า parse ล้มเหลว ลบออกจาก localStorage (ไม่ใช่ sessionStorage)
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

// ------------------------------------------------------------------
// Rate limiting (S-5) — เก็บ state ใน memory (ไม่ persist ข้าม refresh)
// ------------------------------------------------------------------
interface AttemptRecord {
  count: number;
  lockedUntil: number;
}

const attemptMap = new Map<string, AttemptRecord>();

export const checkRateLimit = (username: string): { allowed: boolean; remainingMs: number } => {
  const record = attemptMap.get(username);
  if (!record) return { allowed: true, remainingMs: 0 };

  if (record.lockedUntil > Date.now()) {
    return { allowed: false, remainingMs: record.lockedUntil - Date.now() };
  }
  return { allowed: true, remainingMs: 0 };
};

export const recordFailedAttempt = (username: string, maxAttempts: number, lockoutMs: number): void => {
  const record = attemptMap.get(username) ?? { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= maxAttempts) {
    record.lockedUntil = Date.now() + lockoutMs;
    record.count = 0; // reset หลัง lock
  }
  attemptMap.set(username, record);
};

export const resetAttempts = (username: string): void => {
  attemptMap.delete(username);
};
