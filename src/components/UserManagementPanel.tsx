import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { secureHash, generateSalt } from '../lib/auth';
import type { UserAccount, SessionUser } from '../types';

interface Props {
  currentUser: SessionUser;
  onClose: () => void;
}

export const UserManagementPanel: React.FC<Props> = ({ currentUser, onClose }) => {
  const [users, setUsers]         = useState<UserAccount[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm]   = useState<(UserAccount & { newPassword?: string }) | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'users'), snapshot => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserAccount)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!editForm || !db) return;
    try {
      let passwordHash = editForm.passwordHash;
      let passwordSalt = editForm.passwordSalt;

      if (editForm.newPassword) {
        // ตั้งรหัสใหม่ด้วย SHA-256 + salt
        const newSalt = generateSalt();
        passwordHash  = await secureHash(editForm.newPassword, newSalt);
        passwordSalt  = newSalt;
      }

      const toSave: UserAccount = {
        id: editForm.id,
        username: editForm.username,
        name: editForm.name,
        role: editForm.role,
        passwordHash,
        passwordSalt,
      };
      await setDoc(doc(db, 'users', toSave.id), toSave);
      setEditingId(null);
      setEditForm(null);
    } catch {
      alert('บันทึกไม่สำเร็จ');
    }
  };

  const handleCreateNew = async () => {
    if (!db) return;
    const newId   = 'user_' + Date.now();
    const newSalt = generateSalt();
    const newHash = await secureHash('password', newSalt);
    const newUser: UserAccount = {
      id: newId, username: 'new_user', passwordHash: newHash,
      passwordSalt: newSalt, name: 'New Staff', role: 'staff',
    };
    try {
      await setDoc(doc(db, 'users', newId), newUser);
      setEditingId(newId);
      setEditForm({ ...newUser, newPassword: 'password' });
    } catch {
      alert('สร้าง User ไม่สำเร็จ');
    }
  };

  // ป้องกันลบ admin role และตัวเอง
  const canDelete = (u: UserAccount) => u.role !== 'admin' && u.id !== currentUser.id;

  const handleDelete = async (id: string) => {
    if (confirm('ยืนยันการลบผู้ใช้งานนี้?') && db) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400">
            <Users className="w-5 h-5" /> จัดการข้อมูลผู้ใช้งาน
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 hover:text-red-400" /></button>
        </div>

        <div className="p-6 bg-slate-50 overflow-y-auto grow">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-700">รายชื่อผู้ใช้ทั้งหมด</h4>
            <button onClick={handleCreateNew} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
              + เพิ่มผู้ใช้ใหม่
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
          ) : (
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {editingId === u.id && editForm ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 font-bold">ชื่อ</label>
                        <input type="text" value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full p-2 text-sm border rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-bold">Username</label>
                        <input type="text" value={editForm.username}
                          onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                          className="w-full p-2 text-sm border rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-bold">Password ใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</label>
                        <input type="password" placeholder="••••"
                          onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                          className="w-full p-2 text-sm border rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-bold">Role</label>
                        <select value={editForm.role}
                          onChange={e => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'staff' })}
                          className="w-full p-2 text-sm border rounded">
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
                      <div className="text-sm text-slate-500">User: {u.username}</div>
                    </div>
                  )}

                  <div className="shrink-0 flex gap-2">
                    {editingId === u.id ? (
                      <>
                        <button onClick={handleSave} className="p-2 bg-green-100 text-green-700 rounded"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(u.id); setEditForm({ ...u }); }}
                          className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-blue-50 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        {canDelete(u) && (
                          <button onClick={() => handleDelete(u.id)}
                            className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-red-50 hover:text-red-600">
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
  );
};
