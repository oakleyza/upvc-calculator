import React, { useState, useEffect, useRef } from 'react';
import { TreePine, Maximize, Palette, ChevronDown } from 'lucide-react';
import type { WoodDoorFormData } from '../types';
import { WOOD_TYPE_NAMES, WOOD_MODEL_NAMES, WOOD_MODEL_IMAGES } from '../constants';

interface Props {
  form: WoodDoorFormData;
  onInput: (field: keyof WoodDoorFormData, value: string | boolean) => void;
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

export const WoodDoorCalculator: React.FC<Props> = ({ form, onInput }) => {
  const [modelOpen, setModelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const modelEntries = Object.entries(WOOD_MODEL_NAMES);
  const selectedIdx = modelEntries.findIndex(([k]) => k === form.modelId);
  const selectedLabel = WOOD_MODEL_NAMES[form.modelId] ?? form.modelId;

  // ปิด dropdown เมื่อคลิกนอกกล่อง
  useEffect(() => {
    if (!modelOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [modelOpen]);

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

          {/* รุ่นประตู — custom dropdown พร้อมรูปและเลขลำดับ */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">รุ่นประตู</label>
            <div ref={dropdownRef} className="relative">
              {/* Button แสดงค่าที่เลือก */}
              <button
                type="button"
                onClick={() => setModelOpen(o => !o)}
                className="w-full flex items-center gap-3 p-2 border-2 rounded-lg bg-white hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              >
                {/* thumbnail รูป */}
                <ModelThumb modelId={form.modelId} size="sm" />
                <span className="flex-1 text-left text-sm font-medium text-slate-800 truncate">
                  {selectedIdx >= 0 ? `${selectedIdx + 1}. ` : ''}{selectedLabel}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${modelOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown list */}
              {modelOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border-2 border-amber-300 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                  {modelEntries.map(([key, name], idx) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { onInput('modelId', key); setModelOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-amber-50 ${
                        form.modelId === key
                          ? 'bg-amber-50 font-semibold text-amber-800'
                          : 'text-slate-700'
                      }`}
                    >
                      <ModelThumb modelId={key} size="md" />
                      <span className="text-sm leading-tight">
                        <span className="font-bold text-amber-700 mr-1">{idx + 1}.</span>
                        {name}
                      </span>
                    </button>
                  ))}
                </div>
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
    </div>
  );
};

// ─── thumbnail helper ────────────────────────────────────────────────────────
interface ThumbProps { modelId: string; size: 'sm' | 'md'; }

const ModelThumb: React.FC<ThumbProps> = ({ modelId, size }) => {
  const [imgOk, setImgOk] = useState(true);
  const src = WOOD_MODEL_IMAGES[modelId];
  const cls = size === 'sm'
    ? 'w-10 h-10 rounded flex-shrink-0'
    : 'w-12 h-12 rounded flex-shrink-0';

  if (!src || !imgOk) {
    return <DoorPlaceholder className={cls} />;
  }
  return (
    <img
      src={src}
      alt={modelId}
      className={`${cls} object-cover border border-slate-200`}
      onError={() => setImgOk(false)}
    />
  );
};
