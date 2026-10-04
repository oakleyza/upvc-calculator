import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TreePine, Maximize, Palette, ChevronDown, Gem, X } from 'lucide-react';
import type { WoodDoorFormData, CatalogueItem } from '../types';
import { WOOD_TYPE_NAMES, WOOD_GLASS_TYPES } from '../constants';

interface Props {
  form:      WoodDoorFormData;
  onInput:   (field: keyof WoodDoorFormData, value: string | boolean) => void;
  catalogue: CatalogueItem[];
}

// Fallback door icon (SVG inline) แสดงเมื่อไม่มีรูปภาพ
const DoorPlaceholder: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center bg-amber-50 border border-amber-200 rounded ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 60" className="w-6 h-8 opacity-40">
      <rect x="2" y="2" width="36" height="56" rx="2" fill="none" stroke="#92400e" strokeWidth="2" />
      <rect x="6" y="8" width="28" height="20" rx="1" fill="none" stroke="#b45309" strokeWidth="1.5" />
      <rect x="6" y="32" width="28" height="20" rx="1" fill="none" stroke="#b45309" strokeWidth="1.5" />
      <circle cx="30" cy="30" r="2" fill="#b45309" />
    </svg>
  </div>
);

export const WoodDoorCalculator: React.FC<Props> = ({ form, onInput, catalogue }) => {
  const [modelOpen, setModelOpen] = useState(false);
  const selectedTileRef = useRef<HTMLButtonElement>(null);

  // form.modelId ยังคงเป็น legacyKey ('m1','m2'...) เพื่อ backward-compat กับระบบราคา
  // catalogue ใช้ legacyKey เป็น key lookup; รายการใหม่ที่ไม่มี legacyKey ใช้ id แทน
  const findByModelId = (id: string) =>
    catalogue.find(c => (c.legacyKey ?? c.id) === id) ?? null;

  const selectedItem  = findByModelId(form.modelId);
  const selectedIdx   = selectedItem ? catalogue.indexOf(selectedItem) : -1;
  const selectedLabel = selectedItem?.name ?? form.modelId;

  // popup เลือกรุ่น: ล็อก scroll หน้าหลัง, กด Esc ปิด, เลื่อนไปรุ่นที่เลือกอยู่
  useEffect(() => {
    if (!modelOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModelOpen(false); };
    document.addEventListener('keydown', handleKey);
    selectedTileRef.current?.scrollIntoView({ block: 'center' });
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [modelOpen]);

  // เปลี่ยนไปรุ่นที่ไม่มีกระจก → ล้างชนิด/ขนาดกระจก (รุ่นกระจกให้พนักงานเลือกเอง)
  useEffect(() => {
    const name = findByModelId(form.modelId)?.name ?? '';
    const hasGlass = name.includes('กระจก');
    if (!hasGlass && form.glassType !== 'none') {
      onInput('glassType', 'none');
      onInput('glassWidth', '');
      onInput('glassHeight', '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.modelId]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') { onInput('customWidth', ''); return; }
    if (Number(v) > 999) return;
    onInput('customWidth', v);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') { onInput('customHeight', ''); return; }
    if (Number(v) > 999) return;
    onInput('customHeight', v);
  };

  return (
    <div className="space-y-8">
      {/* ชนิดไม้ + รุ่น */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TreePine className="w-5 h-5 text-green-600" /> ชนิดไม้ & รุ่นประตู
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ชนิดไม้ — native select (ไม่ต้องการรูป) */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">ชนิดไม้</label>
            <select
              value={form.woodType}
              onChange={e => onInput('woodType', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-green-400 outline-none"
            >
              {Object.entries(WOOD_TYPE_NAMES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* รุ่นประตู — กดแล้วเปิด popup เต็มจอ เป็นตารางรูป */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">รุ่นประตู</label>
            <div>
              {/* Button แสดงค่าที่เลือก */}
              <button
                type="button"
                onClick={() => setModelOpen(true)}
                className="w-full flex items-center gap-3 p-2 border-2 rounded-lg bg-white hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              >
                {/* thumbnail รูป — key บังคับ remount ทุกครั้งที่เปลี่ยนรุ่น */}
                <CatalogueThumb key={form.modelId} imageUrl={selectedItem?.imageUrl} size="sm" />
                <span className="flex-1 text-left text-sm font-medium text-slate-800 truncate">
                  {selectedIdx >= 0 ? `${selectedIdx + 1}. ` : ''}{selectedLabel}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${modelOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Popup เต็มจอ — ตารางรูปรุ่นประตู (มือถือ 3 รูป/แถว) */}
              {modelOpen && createPortal(
                <div className="fixed inset-0 z-50 flex flex-col bg-white">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-amber-50">
                    <h3 className="text-base font-bold text-amber-900">เลือกรุ่นประตู ({catalogue.length} รุ่น)</h3>
                    <button
                      type="button"
                      onClick={() => setModelOpen(false)}
                      className="p-2 -mr-2 rounded-full text-slate-500 hover:bg-amber-100"
                      aria-label="ปิด"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                      {catalogue.map((item, idx) => {
                        const key = item.legacyKey ?? item.id;
                        const isSelected = form.modelId === key;
                        return (
                          <button
                            key={item.id}
                            ref={isSelected ? selectedTileRef : undefined}
                            type="button"
                            onClick={() => { onInput('modelId', key); setModelOpen(false); }}
                            className={`flex flex-col rounded-lg border-2 p-1 text-left transition-colors ${
                              isSelected ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300'
                            }`}
                          >
                            <CatalogueThumb imageUrl={item.imageUrl} size="tile" />
                            <span className={`mt-1 px-0.5 text-xs leading-snug line-clamp-2 ${isSelected ? 'font-semibold text-amber-800' : 'text-slate-700'}`}>
                              <span className="font-bold text-amber-700 mr-1">{idx + 1}.</span>
                              {item.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>,
                document.body,
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ขนาด */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Maximize className="w-5 h-5 text-blue-600" /> ขนาดประตู
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: '70x200cm', l: '70×200' },
            { id: '80x200cm', l: '80×200' },
            { id: '90x200cm', l: '90×200' },
            { id: 'custom',   l: 'Custom' },
          ].map(s => (
            <div
              key={s.id}
              onClick={() => onInput('sizeType', s.id)}
              className={`cursor-pointer border-2 rounded-lg p-3 text-center text-sm transition-all ${
                form.sizeType === s.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {s.l}
            </div>
          ))}
        </div>

        {form.sizeType === 'custom' && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4 flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-600">กว้าง (cm)</label>
              <input
                type="number"
                value={form.customWidth}
                onChange={handleWidthChange}
                placeholder="เช่น 80"
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-600">สูง (cm)</label>
              <input
                type="number"
                value={form.customHeight}
                onChange={handleHeightChange}
                placeholder="เช่น 200"
                className="w-full p-2 border rounded mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* การทำสี */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" /> การทำสี
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onInput('painted', true)}
            className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
              form.painted
                ? 'border-purple-500 bg-purple-50 text-purple-800 font-bold'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            ทำสี
          </div>
          <div
            onClick={() => onInput('painted', false)}
            className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
              !form.painted
                ? 'border-slate-500 bg-slate-100 text-slate-800 font-bold'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            ไม่ทำสี
          </div>
        </div>
      </div>

      {/* กระจก — แสดงเฉพาะรุ่นที่มี "กระจก" ในชื่อ */}
      {(findByModelId(form.modelId)?.name ?? '').includes('กระจก') && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-cyan-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Gem className="w-5 h-5 text-cyan-600" /> กระจก
          </h3>
          <label className="block text-sm font-medium text-slate-600 mb-2">ชนิดกระจก</label>
          <select
            value={form.glassType === 'none' ? '' : form.glassType}
            onChange={e => onInput('glassType', e.target.value || 'none')}
            className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-cyan-400 outline-none"
          >
            <option value="">— ไม่ใส่กระจก —</option>
            {WOOD_GLASS_TYPES.map(g => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>

          {form.glassType !== 'none' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">กว้างแผ่นกระจก (cm)</label>
                <input
                  type="number" min={1} max={400} value={form.glassWidth}
                  onChange={e => onInput('glassWidth', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">สูงแผ่นกระจก (cm)</label>
                <input
                  type="number" min={1} max={400} value={form.glassHeight}
                  onChange={e => onInput('glassHeight', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            คิดตามพื้นที่ (ตร.ฟุต) — กรอกขนาดแผ่นกระจกจริง ราคาคำนวณรวมในราคาสุทธิ
          </p>
        </div>
      )}
    </div>
  );
};

// ─── thumbnail helper ────────────────────────────────────────────────────────
interface ThumbProps { imageUrl?: string; size: 'sm' | 'tile'; }

const CatalogueThumb: React.FC<ThumbProps> = ({ imageUrl, size }) => {
  const [imgOk, setImgOk] = useState(true);
  const cls = size === 'sm'
    ? 'w-9 h-16 rounded flex-shrink-0'
    : 'w-full aspect-[3/4] rounded';   // รูปรุ่นเป็นสัดส่วน 3:4

  if (!imageUrl || !imgOk) {
    return <DoorPlaceholder className={cls} />;
  }
  return (
    <img
      src={imageUrl}
      alt=""
      className={`${cls} object-contain bg-amber-50 border border-slate-200`}
      onError={() => setImgOk(false)}
    />
  );
};
