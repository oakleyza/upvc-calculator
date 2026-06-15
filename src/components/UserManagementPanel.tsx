import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Trash2, Users, Loader2, UserPlus } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { secureHash, generateSalt } from '../lib/auth';
import type { UserAccount, SessionUser } from '../types';

interface Props {
  currentUser: SessionUser;
  onClose: () => void;
}

interface NewUserForm {
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'staff';
}

const EMPTY_NEW_FORM: NewUserForm = { name: '', username: '', password: '', role: 'staff' };

export const UserManagementPanel: React.FC<Props> = ({ currentUser, onClose }) => {
  const [users, setUsers]           = useState<UserAccount[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<(UserAccount & { newPassword?: string }) | null>(null);

  // state สำหรับ modal เพิ่มผู้ใช้ใหม่
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm]           = useState<NewUserForm>(EMPTY_NEW_FORM);
  const [newFormError, setNewFormError] = useState('');
  const [isSavingNew, setIsSavingNew]   = useState(false);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'users'), snapshot => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserAccount)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── บันทึกผู้ใช้ใหม่จาก modal ──────────────────────────────────
  const handleCreateNew = async () => {
    setNewFormError('');
    if (!newForm.name.trim())     { setNewFormError('กรุณากรอกชื่อ'); return; }
    if (!newForm.username.trim()) { setNewFormError('กรุณากรอก Username'); return; }
    if (!newForm.password)        { setNewFormError('กรุณากรอก Password'); return; }
    if (users.some(u => u.username === newForm.username.trim())) {
      setNewFormError('Username นี้มีอยู่แล้ว');
      return;
    }
    if (!db) return;
    setIsSavingNew(true);
    try {
      const newId   = 'user_' + Date.now();
      const newSalt = generateSalt();
      const newHash = await secureHash(newForm.password, newSalt);
      await setDoc(doc(db, 'users', newId), {
        id: newId,
        username: newForm.username.trim(),
        name: newForm.name.trim(),
        role: newForm.role,
        passwordHash: newHash,
        passwordSalt: newSalt,
      });
      setShowNewModal(false);
      setNewForm(EMPTY_NEW_FORM);
    } catch {
      setNewFormError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSavingNew(false);
    }
  };

  // ── บันทึกการแก้ไขผู้ใช้เดิม ────────────────────────────────────
  const handleSave = async () => {
    if (!editForm || !db) return;
    try {
      let passwordHash = editForm.passwordHash;
      let passwordSalt = editForm.passwordSalt;
      if (editForm.newPassword) {
        const newSalt = generateSalt();
        passwordHash  = await secureHash(editForm.newPassword, newSalt);
        passwordSalt  = newSalt;
      }
      await setDoc(doc(db, 'users', editForm.id), {
        id: editForm.id, username: editForm.username,
        name: editForm.name, role: editForm.role,
        passwordHash, passwordSalt,
      });
      setEditingId(null);
      setEditForm(null);
    } catch {
      alert('บันทึกไม่สำเร็จ');
    }
  };

  const canDelete = (u: UserAccount) => u.role !== 'admin' && u.id !== currentUser.id;

  const handleDelete = async (id: string) => {
    if (confirm('ยืนยันการลบผู้ใช้งานนี้?') && db) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  return (
    <>
      {/* ── หน้าต่างหลัก ─────────────────────────────────────────── */}
      {/* คลิก backdrop เพื่อปิด */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400">
              <Users className="w-5 h-5" /> จัดการข้อมูลผู้ใช้งาน
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 bg-slate-50 overflow-y-auto grow">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-700">รายชื่อผู้ใช้ทั้งหมด ({users.length} คน)</h4>
              <button
                onClick={() => { setNewForm(EMPTY_NEW_FORM); setNewFormError(''); setShowNewModal(true); }}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> เพิ่มผู้ใช้ใหม่
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
            ) : (
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {editingId === u.id && editForm ? (
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 font-bold">ชื่อ</label>
                          <input type="text" value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full p-2 text-sm border rounded mt-0.5" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Username</label>
                          <input type="text" value={editForm.username}
                            onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                            className="w-full p-2 text-sm border rounded mt-0.5" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Password ใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</label>
                          <input type="password" placeholder="••••"
                            onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                            className="w-full p-2 text-sm border rounded mt-0.5" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold">Role</label>
                          <select value={editForm.role}
                            onChange={e => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'staff' })}
                            className="w-full p-2 text-sm border rounded mt-0.5">
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.role}
                          </span>
                          <span className="font-bold text-slate-800">{u.name}</span>
                          {u.id === currentUser.id && <span className="text-xs text-green-600 font-medium">(คุณ)</span>}
                        </div>
                        <div className="text-sm text-slate-500">Username: {u.username}</div>
                      </div>
                    )}

                    <div className="shrink-0 flex gap-2">
                      {editingId === u.id ? (
                        <>
                          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                            <Save className="w-3.5 h-3.5" /> บันทึก
                          </button>
                          <button onClick={() => { setEditingId(null); setEditForm(null); }}
                            className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-300">
                            ยกเลิก
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(u.id); setEditForm({ ...u }); }}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          {canDelete(u) && (
                            <button onClick={() => handleDelete(u.id)}
                              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal เพิ่มผู้ใช้ใหม่ ────────────────────────────────── */}
      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowNewModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> เพิ่มผู้ใช้งานใหม่
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={newForm.name}
                  onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newForm.username}
                  onChange={e => setNewForm({ ...newForm, username: e.target.value })}
                  placeholder="เช่น staff02"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newForm.password}
                  onChange={e => setNewForm({ ...newForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">สิทธิ์การใช้งาน</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['staff', 'admin'] as const).map(r => (
                    <div key={r}
                      onClick={() => setNewForm({ ...newForm, role: r })}
                      className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                        newForm.role === r
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      <div className="text-sm font-semibold">{r === 'admin' ? 'Admin' : 'Staff'}</div>
                      <div className="text-xs mt-0.5 font-normal">
                        {r === 'admin' ? 'แก้ไขราคาได้' : 'ดูและคำนวณได้'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {newFormError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                  {newFormError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateNew}
                disabled={isSavingNew}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingNew
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
                  : <><UserPlus className="w-4 h-4" /> เพิ่มผู้ใช้</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
