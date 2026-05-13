import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  secureHash, legacyHash, isLegacyHash, generateSalt,
  saveSession, checkRateLimit, recordFailedAttempt, resetAttempts,
} from '../lib/auth';
import type { UserAccount, SessionUser } from '../types';
import { LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_MS } from '../constants';

interface Props {
  onLogin: (user: SessionUser) => void;
  isFirebaseReady: boolean;
  permissionError: boolean;
}

export const LoginScreen: React.FC<Props> = ({ onLogin, isFirebaseReady, permissionError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // S-5: Rate limiting
    const { allowed, remainingMs } = checkRateLimit(username);
    if (!allowed) {
      const secs = Math.ceil(remainingMs / 1000);
      setError(`พยายาม login ผิดหลายครั้ง กรุณารอ ${secs} วินาที`);
      return;
    }

    if (!isFirebaseReady) { setError('ไม่สามารถเชื่อมต่อ Database ได้'); return; }
    setLoading(true);

    try {
      const usersRef = collection(db!, 'users');
      const q = query(usersRef, where('username', '==', username));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        recordFailedAttempt(username, LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_MS);
        setError('Username หรือ Password ไม่ถูกต้อง');
        return;
      }

      const userData = snapshot.docs[0].data() as UserAccount;
      const storedHash = userData.passwordHash;

      let matched = false;
      let needsUpgrade = false;

      if (isLegacyHash(storedHash)) {
        // Lazy migration: ตรวจ old djb2 hash ก่อน
        if (storedHash === legacyHash(password)) {
          matched = true;
          needsUpgrade = true; // จะ upgrade เป็น SHA-256 หลัง login สำเร็จ
        }
      } else {
        // ตรวจ SHA-256 hash ใหม่
        const salt = userData.passwordSalt ?? '';
        const newHash = await secureHash(password, salt);
        matched = storedHash === newHash;
      }

      if (!matched) {
        recordFailedAttempt(username, LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_MS);
        setError('Username หรือ Password ไม่ถูกต้อง');
        return;
      }

      // Login สำเร็จ
      resetAttempts(username);

      // Lazy migration: upgrade hash เป็น SHA-256 ในพื้นหลัง
      if (needsUpgrade && db) {
        const newSalt = generateSalt();
        const newHash = await secureHash(password, newSalt);
        setDoc(doc(db, 'users', userData.id), {
          ...userData, passwordHash: newHash, passwordSalt: newSalt,
        }).catch(console.error);
      }

      const session: SessionUser = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        loginAt: Date.now(), // S-4: timestamp สำหรับ expiry
      };
      saveSession(session);
      onLogin(session);

    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr.code === 'permission-denied') setError('สิทธิ์การเข้าถึงถูกปฏิเสธ (Permission Denied)');
      else setError('เกิดข้อผิดพลาด: ' + (firebaseErr.message ?? 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-white flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">ระบบคำนวณราคาประตู</h2>
        <h3 className="text-lg font-medium text-center text-blue-600 mb-6">-กลางซอยค้าไม้-</h3>

        {!isFirebaseReady && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-lg mb-4 text-sm">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>กำลังเชื่อมต่อฐานข้อมูล...</span>
          </div>
        )}
        {permissionError && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-xs rounded">
            <p className="font-bold text-sm mb-1">🚨 ตรวจพบปัญหา: Permission Denied</p>
            <p>กรุณาแก้ Firestore Rules ใน Firebase Console</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Username" required autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••" required autoComplete="current-password"
            />
          </div>
          <button
            type="submit" disabled={loading || !isFirebaseReady}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังตรวจสอบ...</> : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
};
