import React, { useState, useRef, useCallback } from 'react';
import { X, GripVertical, Pencil, Trash2, Plus, Upload, Check } from 'lucide-react';
import type { CatalogueItem } from '../types';
import {
  addCatalogueItem, updateCatalogueItem,
  deleteCatalogueItem, saveSortOrder,
} from '../lib/woodCatalogue';
import { compressAndUpload } from '../lib/cloudinary';

interface Props {
  items:    CatalogueItem[];
  onClose:  () => void;
}

export const CatalogueManagementModal: React.FC<Props> = ({ items, onClose }) => {
  const [localItems, setLocalItems] = useState<CatalogueItem[]>(items);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editName,   setEditName]   = useState('');
  const [uploading,  setUploading]  = useState<string | null>(null); // item id ที่กำลัง upload
  const [saving,     setSaving]     = useState(false);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);

  // ── New item form ─────────────────────────────────────────────────
  const [newName,      setNewName]      = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newPreview,   setNewPreview]   = useState<string>('');
  const [adding,       setAdding]       = useState(false);
  const newFileRef = useRef<HTMLInputElement>(null);

  // ── Drag & drop ───────────────────────────────────────────────────
  const dragIdx   = useRef<number | null>(null);
  const listRef   = useRef<HTMLDivElement>(null);
  const rafRef    = useRef<number>(0);

  // sync items when prop changes (first render)
  React.useEffect(() => { setLocalItems(items); }, [items]);

  // ── Handlers: drag ────────────────────────────────────────────────
  const onDragStart = (idx: number) => { dragIdx.current = idx; };

  const onDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    setLocalItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
    // auto-scroll
    const container = listRef.current;
    if (!container) return;
    cancelAnimationFrame(rafRef.current);
    const { top, bottom } = container.getBoundingClientRect();
    const y = e.clientY;
    const ZONE = 64, SPEED = 10;
    const scroll = () => {
      if (y < top + ZONE)    container.scrollTop -= SPEED;
      else if (y > bottom - ZONE) container.scrollTop += SPEED;
      rafRef.current = requestAnimationFrame(scroll);
    };
    if (y < top + ZONE || y > bottom - ZONE) rafRef.current = requestAnimationFrame(scroll);
  }, []);

  const onDragEnd = async () => {
    cancelAnimationFrame(rafRef.current);
    dragIdx.current = null;
    setSaving(true);
    await saveSortOrder(localItems);
    setSaving(false);
  };

  // ── Handlers: edit name ───────────────────────────────────────────
  const startEdit = (item: CatalogueItem) => {
    setEditId(item.id);
    setEditName(item.name);
  };
  const confirmEdit = async () => {
    if (!editId || !editName.trim()) return;
    await updateCatalogueItem(editId, { name: editName.trim() });
    setLocalItems(prev => prev.map(i => i.id === editId ? { ...i, name: editName.trim() } : i));
    setEditId(null);
  };

  // ── Handlers: change image ────────────────────────────────────────
  const changeImage = async (id: string, file: File) => {
    setUploading(id);
    try {
      const url = await compressAndUpload(file);
      await updateCatalogueItem(id, { imageUrl: url });
      setLocalItems(prev => prev.map(i => i.id === id ? { ...i, imageUrl: url } : i));
    } catch (err) {
      alert('อัพโหลดรูปไม่สำเร็จ กรุณาลองใหม่');
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  // ── Handlers: delete ─────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteCatalogueItem(deleteId);
    setLocalItems(prev => prev.filter(i => i.id !== deleteId));
    setDeleteId(null);
  };

  // ── Handlers: add new ─────────────────────────────────────────────
  const pickNewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNewImageFile(f);
    setNewPreview(URL.createObjectURL(f));
  };
  const handleAdd = async () => {
    if (!newName.trim() || !newImageFile) return;
    setAdding(true);
    try {
      const url = await compressAndUpload(newImageFile);
      await addCatalogueItem(newName.trim(), url, localItems.length);
      setNewName(''); setNewImageFile(null); setNewPreview('');
      if (newFileRef.current) newFileRef.current.value = '';
    } catch (err) {
      alert('เพิ่มสินค้าไม่สำเร็จ กรุณาลองใหม่');
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">
            จัดการแคตาล็อกประตูไม้
            {saving && <span className="ml-2 text-xs text-slate-400 font-normal">กำลังบันทึก...</span>}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {localItems.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDragEnd={onDragEnd}
              className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-grab active:cursor-grabbing"
            >
              {/* Drag handle */}
              <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />

              {/* Thumbnail */}
              <div className="relative w-10 h-16 flex-shrink-0 rounded overflow-hidden border border-slate-200 bg-amber-50">
                {uploading === item.id ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">ไม่มีรูป</div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                {editId === item.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditId(null); }}
                      className="flex-1 text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                    <button onClick={confirmEdit} className="text-green-600 hover:text-green-700">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-700 truncate">{idx + 1}. {item.name}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* เปลี่ยนรูป */}
                <label className="cursor-pointer p-1.5 rounded hover:bg-slate-100 text-slate-500" title="เปลี่ยนรูป">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) changeImage(item.id, f); e.target.value = ''; }} />
                </label>
                {/* แก้ชื่อ */}
                <button onClick={() => startEdit(item)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="แก้ชื่อ">
                  <Pencil className="w-4 h-4" />
                </button>
                {/* ลบ */}
                <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="ลบ">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new item */}
        <div className="px-4 py-4 border-t bg-slate-50 rounded-b-2xl">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">เพิ่มรุ่นใหม่</p>
          <div className="flex items-center gap-3">
            {/* Preview + upload */}
            <label className="cursor-pointer w-10 h-16 flex-shrink-0 rounded border-2 border-dashed border-slate-300 bg-white flex items-center justify-center hover:border-amber-400 overflow-hidden">
              {newPreview
                ? <img src={newPreview} alt="preview" className="w-full h-full object-contain" />
                : <Plus className="w-5 h-5 text-slate-300" />}
              <input ref={newFileRef} type="file" accept="image/*" className="hidden" onChange={pickNewFile} />
            </label>
            {/* ชื่อ */}
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="ชื่อรุ่นประตู"
              className="flex-1 text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            />
            {/* เพิ่ม */}
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim() || !newImageFile}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {adding ? '...' : 'เพิ่ม'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-xs w-full text-center">
            <p className="font-semibold text-slate-800 mb-1">ยืนยันการลบ</p>
            <p className="text-sm text-slate-500 mb-4">รายการนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                ยกเลิก
              </button>
              <button onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
