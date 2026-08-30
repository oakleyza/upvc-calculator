import React, { useState, useRef, useCallback } from 'react';
import { X, Save, Database, Tag, Maximize, Palette, LayoutDashboard, Hammer, ShieldAlert, GripVertical, Pencil, Trash2, Upload, Plus, Check } from 'lucide-react';
import type { PricingStructure, CatalogueItem } from '../types';
import { LABEL_MAP, WOOD_MODEL_NAMES, WOOD_GLASS_NAMES, WOOD_CURVE_MODEL_IDS, WOOD_FRAME_TYPE_NAMES, WOOD_TYPE_MULTIPLIER } from '../constants';
import { addCatalogueItem, updateCatalogueItem, deleteCatalogueItem, saveSortOrder } from '../lib/woodCatalogue';
import { compressAndUpload } from '../lib/cloudinary';

interface Props {
  currentPrices: PricingStructure;
  catalogue:     CatalogueItem[];
  onSave: (newPrices: PricingStructure) => void;
  onClose: () => void;
}

type ActiveCategory = 'door' | 'frame_t2' | 'frame_f10' | 'frame_x' | 'frame_eco' | 'frame_bsx' | 'wood' | 'wood_frame';

export const AdminPriceEditor: React.FC<Props> = ({ currentPrices, catalogue, onSave, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('wood');
  const [localPrices, setLocalPrices] = useState<PricingStructure>(
    JSON.parse(JSON.stringify(currentPrices))
  );
  const [errors, setErrors] = useState<string[]>([]);

  // ── Catalogue state ────────────────────────────────────────────────
  const [catItems,    setCatItems]    = useState<CatalogueItem[]>(catalogue);
  const [catEditId,   setCatEditId]   = useState<string | null>(null);
  const [catEditName, setCatEditName] = useState('');
  const [catUploading,setCatUploading]= useState<string | null>(null);
  const [catSaving,   setCatSaving]   = useState(false);
  const [catDeleteId, setCatDeleteId] = useState<string | null>(null);
  const [newName,    setNewName]    = useState('');
  const [newFile,    setNewFile]    = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState('');
  const [adding,     setAdding]     = useState(false);
  const newFileRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => { setCatItems(catalogue); }, [catalogue]);

  // drag
  const dragIdx = useRef<number | null>(null);
  const catListRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    setCatItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
    const container = catListRef.current;
    if (!container) return;
    cancelAnimationFrame(rafRef.current);
    const { top, bottom } = container.getBoundingClientRect();
    const y = e.clientY;
    const ZONE = 64, SPEED = 4;
    const scroll = () => {
      if (y < top + ZONE) container.scrollTop -= SPEED;
      else if (y > bottom - ZONE) container.scrollTop += SPEED;
      rafRef.current = requestAnimationFrame(scroll);
    };
    if (y < top + ZONE || y > bottom - ZONE) rafRef.current = requestAnimationFrame(scroll);
  }, []);
  const onDragEnd = async () => {
    cancelAnimationFrame(rafRef.current);
    dragIdx.current = null;
    setCatSaving(true);
    await saveSortOrder(catItems);
    setCatSaving(false);
  };

  const startEdit = (item: CatalogueItem) => { setCatEditId(item.id); setCatEditName(item.name); };
  const confirmEdit = async () => {
    if (!catEditId || !catEditName.trim()) return;
    await updateCatalogueItem(catEditId, { name: catEditName.trim() });
    setCatItems(prev => prev.map(i => i.id === catEditId ? { ...i, name: catEditName.trim() } : i));
    setCatEditId(null);
  };
  const changeImage = async (id: string, file: File) => {
    setCatUploading(id);
    try {
      const url = await compressAndUpload(file);
      await updateCatalogueItem(id, { imageUrl: url });
      setCatItems(prev => prev.map(i => i.id === id ? { ...i, imageUrl: url } : i));
    } catch { alert('อัพโหลดรูปไม่สำเร็จ'); }
    finally { setCatUploading(null); }
  };
  const confirmDelete = async () => {
    if (!catDeleteId) return;
    await deleteCatalogueItem(catDeleteId);
    setCatItems(prev => prev.filter(i => i.id !== catDeleteId));
    setCatDeleteId(null);
  };
  const pickNewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNewFile(f); setNewPreview(URL.createObjectURL(f));
  };
  const handleAdd = async () => {
    if (!newName.trim() || !newFile) return;
    setAdding(true);
    try {
      const url = await compressAndUpload(newFile);
      await addCatalogueItem(newName.trim(), url, catItems.length);
      setNewName(''); setNewFile(null); setNewPreview('');
      if (newFileRef.current) newFileRef.current.value = '';
    } catch { alert('เพิ่มสินค้าไม่สำเร็จ'); }
    finally { setAdding(false); }
  };

  const handlePriceChange = (category: keyof PricingStructure, key: string, val: string) => {
    const num = parseFloat(val);
    setLocalPrices(prev => ({
      ...prev,
      [category]: { ...(prev[category] ?? {}), [key]: isNaN(num) ? 0 : num },
    }));
  };

  const handleSaveWithValidation = () => {
    const errs: string[] = [];
    const cats: (keyof PricingStructure)[] = [
      'door_base','door_size','door_surface','frame_base','frame_size','frame_surface',
      'grooving','molding','glass','louver','reinforce','drilling','options',
      'wood_door_price','wood_door_paint','wood_door_glass','wood_frame_price',
    ];
    cats.forEach(cat => {
      Object.entries(localPrices[cat] ?? {}).forEach(([key, val]) => {
        if (typeof val === 'number' && val < 0) {
          errs.push(`"${LABEL_MAP[key] ?? key}" มีค่าติดลบ (${val})`);
        }
      });
    });
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    onSave(localPrices);
  };

  // C-2 FIX: ใช้ฟังก์ชันแทน IIFE ใน JSX
  const renderInput = (category: keyof PricingStructure, key: string) => {
    if (key === 'custom') return null;
    if (!LABEL_MAP[key]) return null;
    const value = localPrices[category]?.[key] ?? 0;
    const isNeg = value < 0;
    return (
      <div key={key} className="flex justify-between items-center p-2.5 border-b last:border-0 hover:bg-slate-50 transition-colors">
        <span className="text-sm font-medium text-slate-700">{LABEL_MAP[key]}</span>
        <div className="flex items-center gap-2">
          <input
            type="number" value={value} min={0}
            onChange={e => handlePriceChange(category, key, e.target.value)}
            className={`w-20 p-1.5 text-right border rounded focus:ring-2 outline-none text-sm font-semibold ${
              isNeg ? 'border-red-400 bg-red-50 focus:ring-red-500' : 'bg-white focus:ring-blue-500'
            }`}
          />
          <span className="text-xs text-slate-400">฿</span>
        </div>
      </div>
    );
  };

  const tabs: { id: ActiveCategory; label: string }[] = [
    { id: 'wood',       label: '🪵 ประตูไม้' },
    { id: 'wood_frame', label: '🔶 วงกบไม้' },
    { id: 'door',       label: '🚪 ประตู uPVC' },
    { id: 'frame_t2',  label: '🔲 วงกบ T2' },
    { id: 'frame_f10', label: '🔲 วงกบ F10' },
    { id: 'frame_x',   label: '✨ Adjust X' },
    { id: 'frame_eco', label: '✨ Adjust Eco' },
    { id: 'frame_bsx', label: '⬡ Big Six' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400">
            <Database className="w-5 h-5" /> จัดการราคากลาง
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 hover:text-red-400 transition-colors" /></button>
        </div>

        {/* Tab bar */}
        <div className="flex bg-slate-100 border-b p-2 gap-2 overflow-x-auto shrink-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveCategory(t.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeCategory === t.id
                  ? 'bg-white text-blue-700 shadow-sm border-t-2 border-blue-600'
                  : 'bg-transparent text-slate-500 hover:bg-slate-200'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeCategory === 'door' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <h4 className="font-bold text-blue-700 mb-4 pb-2 border-b flex items-center gap-2">
                    <Tag className="w-4 h-4" /> โครงสร้าง & ราคาตั้งต้น
                  </h4>
                  {Object.keys(localPrices.door_base).map(k => renderInput('door_base', k))}
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-4 pb-2 border-b flex items-center gap-2">
                    <Maximize className="w-4 h-4" /> Surcharge ขนาดประตู
                  </h4>
                  {Object.keys(localPrices.door_size).map(k => renderInput('door_size', k))}
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-purple-600 mb-4 pb-2 border-b flex items-center gap-2">
                  <Palette className="w-4 h-4" /> งานสี & ดีไซน์หน้าบาน
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ทำสี/ปิดผิว</h5>{Object.keys(localPrices.door_surface).map(k => renderInput('door_surface', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">เซาะร่อง</h5>{Object.keys(localPrices.grooving).map(k => renderInput('grooving', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ติดคิ้ว</h5>{Object.keys(localPrices.molding).map(k => renderInput('molding', k))}</div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-teal-600 mb-4 pb-2 border-b flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> งานกระจก & เกล็ดระบายอากาศ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ช่องกระจก</h5>{Object.keys(localPrices.glass).map(k => renderInput('glass', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">เกล็ดระบายอากาศ</h5>{Object.keys(localPrices.louver).map(k => renderInput('louver', k))}</div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-slate-700 mb-4 pb-2 border-b flex items-center gap-2">
                  <Hammer className="w-4 h-4" /> การเจาะ & อุปกรณ์เสริม
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ค่าเจาะ</h5>{Object.keys(localPrices.drilling).map(k => renderInput('drilling', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ค่าเสริมโครง</h5>{Object.keys(localPrices.reinforce).map(k => renderInput('reinforce', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">Option อื่นๆ</h5>{Object.keys(localPrices.options).map(k => renderInput('options', k))}</div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'frame_t2' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> วงกบ T2 (Max 180x240)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                  {renderInput('frame_base', 'wpc_4in_t2')}
                  {['t2_std_70','t2_std_80','t2_std_90'].map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('t2_w_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('t2_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี</h4>
                  {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('t2_color_')).map(k => renderInput('frame_surface', k))}
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'frame_f10' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="font-bold text-indigo-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> วงกบ F10 (Max 180x220)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                  {renderInput('frame_base', 'wpc_4in_f10')}
                  {['f10_std_70','f10_std_80','f10_std_90'].map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('f10_w_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('f10_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี</h4>
                  {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('f10_color_')).map(k => renderInput('frame_surface', k))}
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'frame_x' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-bold text-yellow-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Adjust X (Max 90x220)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                  {renderInput('frame_base', 'wpc_adjust_x')}
                  {['x_std_70','x_std_80','x_std_90'].map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('x_w_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('x_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี/ผิว (X)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-3 rounded">
                      <h5 className="font-bold text-orange-800 text-sm mb-2">สี TOA</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('x_toa_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <h5 className="font-bold text-purple-800 text-sm mb-2">ผิว SVL</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('x_svl_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'frame_bsx' && (
            <div className="space-y-6">
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <h4 className="font-bold text-cyan-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Adjust Big Six (Max 180x240, ไม่มีซับ)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                  {renderInput('frame_base', 'wpc_adjust_bsx')}
                  {['bsx_std_70','bsx_std_80','bsx_std_90'].map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('bsx_w_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('bsx_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี/ผิว (Big Six)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-3 rounded">
                      <h5 className="font-bold text-orange-800 text-sm mb-2">สี TOA</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('bsx_toa_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <h5 className="font-bold text-purple-800 text-sm mb-2">ผิว SVL</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('bsx_svl_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'wood' && (
            <div className="space-y-6">

              {/* ── Catalogue management ─────────────────────────────── */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-amber-50 px-4 py-3 border-b flex items-center justify-between">
                  <h4 className="font-bold text-amber-800">🖼 จัดการรุ่นประตูไม้ (ลาก-วาง เพื่อเรียงลำดับ)</h4>
                  {catSaving && <span className="text-xs text-slate-400">กำลังบันทึก...</span>}
                </div>

                {/* list */}
                <div ref={catListRef} className="divide-y max-h-72 overflow-y-auto">
                  {catItems.map((item, idx) => (
                    <div key={item.id} draggable
                      onDragStart={() => onDragStart(idx)}
                      onDragOver={e => onDragOver(e, idx)}
                      onDragEnd={onDragEnd}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-amber-50 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      {/* thumbnail */}
                      <div className="w-7 h-12 flex-shrink-0 rounded overflow-hidden border border-slate-200 bg-amber-50 relative">
                        {catUploading === item.id
                          ? <div className="absolute inset-0 flex items-center justify-center"><div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"/></div>
                          : item.imageUrl
                            ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain"/>
                            : <div className="w-full h-full bg-slate-100"/>}
                      </div>
                      {/* name */}
                      <div className="flex-1 min-w-0">
                        {catEditId === item.id
                          ? <div className="flex items-center gap-1">
                              <input autoFocus value={catEditName} onChange={e => setCatEditName(e.target.value)}
                                onKeyDown={e => { if (e.key==='Enter') confirmEdit(); if (e.key==='Escape') setCatEditId(null); }}
                                className="flex-1 text-xs border rounded px-2 py-1 focus:ring-2 focus:ring-amber-400 outline-none"/>
                              <button onClick={confirmEdit} className="text-green-600"><Check className="w-3.5 h-3.5"/></button>
                              <button onClick={() => setCatEditId(null)} className="text-slate-400"><X className="w-3.5 h-3.5"/></button>
                            </div>
                          : <p className="text-xs font-medium text-slate-700 truncate">{idx+1}. {item.name}</p>}
                      </div>
                      {/* actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        <label className="cursor-pointer p-1 rounded hover:bg-slate-100 text-slate-400" title="เปลี่ยนรูป">
                          <Upload className="w-3.5 h-3.5"/>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { const f=e.target.files?.[0]; if(f) changeImage(item.id,f); e.target.value=''; }}/>
                        </label>
                        <button onClick={() => startEdit(item)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><Pencil className="w-3.5 h-3.5"/></button>
                        <button onClick={() => setCatDeleteId(item.id)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* add new */}
                <div className="px-3 py-3 bg-slate-50 border-t flex items-center gap-2">
                  <label className="cursor-pointer w-7 h-12 flex-shrink-0 rounded border-2 border-dashed border-slate-300 bg-white flex items-center justify-center hover:border-amber-400 overflow-hidden">
                    {newPreview ? <img src={newPreview} alt="" className="w-full h-full object-contain"/> : <Plus className="w-4 h-4 text-slate-300"/>}
                    <input ref={newFileRef} type="file" accept="image/*" className="hidden" onChange={pickNewFile}/>
                  </label>
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="ชื่อรุ่นประตูใหม่"
                    onKeyDown={e => { if (e.key==='Enter') handleAdd(); }}
                    className="flex-1 text-xs border rounded px-2 py-1.5 focus:ring-2 focus:ring-amber-400 outline-none"/>
                  <button onClick={handleAdd} disabled={adding || !newName.trim() || !newFile}
                    className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded hover:bg-amber-600 disabled:opacity-40">
                    {adding ? '...' : 'เพิ่ม'}
                  </button>
                </div>
              </div>

              {/* Delete confirm */}
              {catDeleteId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
                  <div className="bg-white rounded-xl p-5 shadow-xl max-w-xs w-full text-center">
                    <p className="font-semibold text-slate-800 mb-1">ยืนยันการลบ</p>
                    <p className="text-xs text-slate-500 mb-4">รายการจะถูกลบถาวร</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={() => setCatDeleteId(null)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">ยกเลิก</button>
                      <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">ลบ</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-800 flex items-center gap-2">🪵 ตั้งราคาประตูไม้</h4>
                <p className="text-sm text-green-700 mt-1">
                  ราคาสุทธิ = ราคาตั้งต้น (ไม้×รุ่น) + ส่วนต่างกว้าง (งานไม้+งานสี) + ส่วนต่างสูง (งานไม้+งานสี)
                </p>
              </div>

              {/* ราคาตั้งต้น — กรอกเฉพาะไม้สะเดา ตะแบก/สักคำนวณอัตโนมัติ */}
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-slate-800 mb-1 pb-2 border-b">ราคาตั้งต้น (กรอกเฉพาะไม้สะเดา — ตะแบก/สักคำนวณอัตโนมัติ)</h4>
                <p className="text-xs text-slate-500 mt-2 mb-4">
                  ค่าไม้: ไม้ตะแบก = ไม้สะเดา × {WOOD_TYPE_MULTIPLIER.tabak} &nbsp;|&nbsp; ไม้สัก = ไม้สะเดา × {WOOD_TYPE_MULTIPLIER.teak.toFixed(2)}
                  &nbsp;(คอลัมน์ท้ายเป็น preview คำนวณให้ดู แก้ไขไม่ได้)<br/>
                  ค่าทำสี: ใช้เรทไม้สะเดาเรทเดียวกันทุกชนิดไม้ ไม่ปรับตามชนิดไม้
                </p>
                {/* header row */}
                <div className="flex items-center gap-2 px-2.5 mb-1">
                  <span className="flex-1 text-xs font-semibold text-slate-400">รุ่น</span>
                  <span className="w-24 text-xs font-semibold text-orange-600 text-right">ค่าไม้ (สะเดา) ฿</span>
                  <span className="w-24 text-xs font-semibold text-orange-300 text-right">→ ตะแบก ฿</span>
                  <span className="w-24 text-xs font-semibold text-orange-300 text-right">→ สัก ฿</span>
                  <span className="w-24 text-xs font-semibold text-purple-600 text-right">ค่าทำสี ฿</span>
                </div>
                {catItems.map((item, idx) => {
                  const modelId = item.legacyKey ?? item.id;
                  const baseWood = localPrices.wood_door_price?.[`wd_base_sadao_${modelId}_wood`] ?? 0;
                  return (
                    <div key={modelId} className="flex items-center gap-2 p-2.5 border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <span className="flex-1 text-sm font-medium text-slate-700">{idx + 1}. {item.name}</span>
                      <input
                        type="number" min={0}
                        value={baseWood}
                        onChange={e => handlePriceChange('wood_door_price', `wd_base_sadao_${modelId}_wood`, e.target.value)}
                        className="w-24 p-1.5 text-right border rounded text-sm font-semibold focus:ring-2 focus:ring-orange-400 outline-none bg-white"
                      />
                      <span className="w-24 text-right text-sm text-slate-400">
                        {Math.round(baseWood * WOOD_TYPE_MULTIPLIER.tabak).toLocaleString()}
                      </span>
                      <span className="w-24 text-right text-sm text-slate-400">
                        {Math.round(baseWood * WOOD_TYPE_MULTIPLIER.teak).toLocaleString()}
                      </span>
                      <input
                        type="number" min={0}
                        value={localPrices.wood_door_paint?.[`wd_base_sadao_${modelId}_paint`] ?? 0}
                        onChange={e => handlePriceChange('wood_door_paint', `wd_base_sadao_${modelId}_paint`, e.target.value)}
                        className="w-24 p-1.5 text-right border rounded text-sm font-semibold focus:ring-2 focus:ring-purple-400 outline-none bg-white"
                      />
                    </div>
                  );
                })}
              </div>

              {/* ส่วนต่างความกว้าง */}
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-orange-600 mb-4 pb-2 border-b">ส่วนต่างตามความกว้าง</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-bold text-slate-500 mb-2 bg-orange-50 p-2 rounded">งานไม้ (ตามกว้าง)</h5>
                    <p className="text-xs text-slate-400 mb-2">กรอกเป็นเรทไม้สะเดา — ตะแบก/สักจะคูณอัตโนมัติเหมือนราคาตั้งต้น</p>
                    {Object.keys(localPrices.wood_door_price).filter(k => k.startsWith('wd_w_')).map(k => renderInput('wood_door_price', k))}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-500 mb-2 bg-purple-50 p-2 rounded">งานทำสี (ตามกว้าง)</h5>
                    <p className="text-xs text-slate-400 mb-2">เรทเดียวใช้ร่วมกันทุกชนิดไม้ ไม่ปรับตามชนิดไม้</p>
                    {Object.keys(localPrices.wood_door_paint).filter(k => k.startsWith('wd_w_')).map(k => renderInput('wood_door_paint', k))}
                  </div>
                </div>
              </div>

              {/* ส่วนต่างความสูง */}
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-blue-600 mb-4 pb-2 border-b">ส่วนต่างตามความสูง</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-bold text-slate-500 mb-2 bg-orange-50 p-2 rounded">งานไม้ (ตามสูง)</h5>
                    <p className="text-xs text-slate-400 mb-2">กรอกเป็นเรทไม้สะเดา — ตะแบก/สักจะคูณอัตโนมัติเหมือนราคาตั้งต้น</p>
                    {Object.keys(localPrices.wood_door_price).filter(k => k.startsWith('wd_h_')).map(k => renderInput('wood_door_price', k))}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-500 mb-2 bg-purple-50 p-2 rounded">งานทำสี (ตามสูง)</h5>
                    <p className="text-xs text-slate-400 mb-2">เรทเดียวใช้ร่วมกันทุกชนิดไม้ ไม่ปรับตามชนิดไม้</p>
                    {Object.keys(localPrices.wood_door_paint).filter(k => k.startsWith('wd_h_')).map(k => renderInput('wood_door_paint', k))}
                  </div>
                </div>
              </div>

              {/* ส่วนต่างประตูโค้ง — กว้าง */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-amber-200">
                <h4 className="font-bold text-amber-700 mb-2 pb-2 border-b flex items-center gap-2">
                  🌙 ส่วนต่างประตูโค้ง — ตามความกว้าง
                </h4>
                <p className="text-xs text-amber-600 mb-4">
                  ใช้กับรุ่น: {[...WOOD_CURVE_MODEL_IDS].join(', ')} — แยกจากส่วนต่างประตูปกติ
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-bold text-slate-500 mb-2 bg-orange-50 p-2 rounded">งานไม้ (โค้ง ตามกว้าง)</h5>
                    <p className="text-xs text-slate-400 mb-2">กรอกเป็นเรทไม้สะเดา — ตะแบก/สักจะคูณอัตโนมัติเหมือนราคาตั้งต้น</p>
                    {Object.keys(localPrices.wood_door_price).filter(k => k.startsWith('wd_curve_w_')).map(k => renderInput('wood_door_price', k))}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-500 mb-2 bg-purple-50 p-2 rounded">งานทำสี (โค้ง ตามกว้าง)</h5>
                    <p className="text-xs text-slate-400 mb-2">เรทเดียวใช้ร่วมกันทุกชนิดไม้ ไม่ปรับตามชนิดไม้</p>
                    {Object.keys(localPrices.wood_door_paint).filter(k => k.startsWith('wd_curve_w_')).map(k => renderInput('wood_door_paint', k))}
                  </div>
                </div>
              </div>

              {/* ส่วนต่างประตูโค้ง — สูง */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-amber-200">
                <h4 className="font-bold text-amber-700 mb-4 pb-2 border-b flex items-center gap-2">
                  🌙 ส่วนต่างประตูโค้ง — ตามความสูง
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-bold text-slate-500 mb-2 bg-orange-50 p-2 rounded">งานไม้ (โค้ง ตามสูง)</h5>
                    <p className="text-xs text-slate-400 mb-2">กรอกเป็นเรทไม้สะเดา — ตะแบก/สักจะคูณอัตโนมัติเหมือนราคาตั้งต้น</p>
                    {Object.keys(localPrices.wood_door_price).filter(k => k.startsWith('wd_curve_h_')).map(k => renderInput('wood_door_price', k))}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-500 mb-2 bg-purple-50 p-2 rounded">งานทำสี (โค้ง ตามสูง)</h5>
                    <p className="text-xs text-slate-400 mb-2">เรทเดียวใช้ร่วมกันทุกชนิดไม้ ไม่ปรับตามชนิดไม้</p>
                    {Object.keys(localPrices.wood_door_paint).filter(k => k.startsWith('wd_curve_h_')).map(k => renderInput('wood_door_paint', k))}
                  </div>
                </div>
              </div>

              {/* ราคากระจก */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-cyan-200">
                <h4 className="font-bold text-cyan-700 mb-2 pb-2 border-b flex items-center gap-2">
                  💎 ราคากระจก
                </h4>
                <p className="text-xs text-cyan-600 mb-4">
                  ราคาตั้งต้นกระจก (ต่อรุ่น) + ส่วนต่างตามขนาด — บวกทับราคาไม้และสี
                </p>

                {/* ราคาตั้งต้นกระจก ตามรุ่น */}
                <div className="bg-white border rounded-lg p-4 mb-4">
                  <h5 className="text-sm font-bold text-slate-700 mb-3 bg-cyan-50 p-2 rounded">ราคาตั้งต้นกระจก (ตามรุ่น)</h5>
                  {Object.entries(WOOD_GLASS_NAMES).map(([glassKey, glassLabel]) => (
                    <div key={glassKey} className="mb-4">
                      <h6 className="text-xs font-bold text-cyan-700 mb-2">{glassLabel}</h6>
                      <div className="flex items-center gap-2 px-2.5 mb-1">
                        <span className="flex-1 text-xs font-semibold text-slate-400">รุ่น</span>
                        <span className="w-24 text-xs font-semibold text-cyan-600 text-right">ราคา ฿</span>
                      </div>
                      {Object.entries(WOOD_MODEL_NAMES)
                        .filter(([modelId, modelName]) => modelName.includes('กระจก') && localPrices.wood_door_glass?.[`wd_glass_${glassKey}_${modelId}`] !== undefined)
                        .map(([modelId, modelName]) => {
                          const key = `wd_glass_${glassKey}_${modelId}`;
                          const val = localPrices.wood_door_glass?.[key] ?? 0;
                          return (
                            <div key={modelId} className="flex items-center gap-2 p-2.5 border-b last:border-0 hover:bg-slate-50 transition-colors">
                              <span className="flex-1 text-sm font-medium text-slate-700">{modelName}</span>
                              <input
                                type="number" min={0} value={val}
                                onChange={e => handlePriceChange('wood_door_glass', key, e.target.value)}
                                className="w-24 p-1.5 text-right border rounded text-sm font-semibold focus:ring-2 focus:ring-cyan-400 outline-none bg-white"
                              />
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>

                {/* ส่วนต่างขนาดกระจก */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-bold text-slate-500 mb-2 bg-cyan-50 p-2 rounded">กระจก: ส่วนต่างความกว้าง</h5>
                    {Object.keys(localPrices.wood_door_glass ?? {}).filter(k => k.startsWith('wd_glass_w_')).map(k => renderInput('wood_door_glass', k))}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-500 mb-2 bg-cyan-50 p-2 rounded">กระจก: ส่วนต่างความสูง</h5>
                    {Object.keys(localPrices.wood_door_glass ?? {}).filter(k => k.startsWith('wd_glass_h_')).map(k => renderInput('wood_door_glass', k))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'wood_frame' && (
            <div className="space-y-6">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-bold text-amber-800 flex items-center gap-2">🔶 ตั้งราคาวงกบไม้</h4>
                <p className="text-sm text-amber-700 mt-1">
                  กรอกราคารวมทั้งชุดต่อขนาด แยกระหว่าง "ไม่ทำสี" และ "ทำสี"
                </p>
              </div>

              {Object.entries(WOOD_FRAME_TYPE_NAMES).map(([frameType, frameLabel]) => (
                <div key={frameType} className="bg-white p-5 rounded-xl shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b">{frameLabel}</h4>
                  {/* header */}
                  <div className="flex items-center gap-2 px-2.5 mb-1">
                    <span className="flex-1 text-xs font-semibold text-slate-400">ขนาด</span>
                    <span className="w-28 text-xs font-semibold text-slate-600 text-right">ไม่ทำสี ฿</span>
                    <span className="w-28 text-xs font-semibold text-purple-600 text-right">ทำสี ฿</span>
                  </div>
                  {(['70x200cm', '80x200cm', '90x200cm'] as const).map(size => {
                    const keyNoP  = `wf_${frameType}_${size}`;
                    const keyPaint = `wf_${frameType}_${size}_paint`;
                    const valNoP  = localPrices.wood_frame_price?.[keyNoP]   ?? 0;
                    const valPaint = localPrices.wood_frame_price?.[keyPaint] ?? 0;
                    return (
                      <div key={size} className="flex items-center gap-2 p-2.5 border-b last:border-0 hover:bg-slate-50 transition-colors">
                        <span className="flex-1 text-sm font-medium text-slate-700">{size}</span>
                        <input
                          type="number" min={0} value={valNoP}
                          onChange={e => handlePriceChange('wood_frame_price', keyNoP, e.target.value)}
                          className="w-28 p-1.5 text-right border rounded text-sm font-semibold focus:ring-2 focus:ring-slate-400 outline-none bg-white"
                        />
                        <input
                          type="number" min={0} value={valPaint}
                          onChange={e => handlePriceChange('wood_frame_price', keyPaint, e.target.value)}
                          className="w-28 p-1.5 text-right border rounded text-sm font-semibold focus:ring-2 focus:ring-purple-400 outline-none bg-white"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {activeCategory === 'frame_eco' && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Adjust Eco (Max 180x240)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                  {renderInput('frame_base', 'wpc_adjust_eco')}
                  {['eco_std_70','eco_std_80','eco_std_90'].map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('eco_w_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('eco_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี/ผิว (Eco)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-3 rounded">
                      <h5 className="font-bold text-orange-800 text-sm mb-2">สี TOA</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('eco_toa_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <h5 className="font-bold text-purple-800 text-sm mb-2">ผิว SVL</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('eco_svl_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200 shrink-0">
            <p className="text-sm font-bold text-red-700 mb-1 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4" /> พบข้อผิดพลาด — กรุณาแก้ไขก่อนบันทึก:
            </p>
            <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-white border-t flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold transition-colors">
            ยกเลิก
          </button>
          <button onClick={handleSaveWithValidation} className="px-8 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg flex items-center gap-2 transition-colors">
            <Save className="w-5 h-5" /> บันทึกราคาใหม่
          </button>
        </div>
      </div>
    </div>
  );
};
