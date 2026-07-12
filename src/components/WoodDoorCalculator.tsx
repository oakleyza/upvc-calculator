import React from 'react';
import { TreePine, Maximize, Palette } from 'lucide-react';
import type { WoodDoorFormData } from '../types';
import { WOOD_TYPE_NAMES, WOOD_MODEL_NAMES } from '../constants';

interface Props {
  form: WoodDoorFormData;
  onInput: (field: keyof WoodDoorFormData, value: string | boolean) => void;
}

export const WoodDoorCalculator: React.FC<Props> = ({ form, onInput }) => {
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') { onInput('customWidth', ''); return; }
    const n = Number(v);
    if (n > 999) return;
    onInput('customWidth', v);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') { onInput('customHeight', ''); return; }
    const n = Number(v);
    if (n > 999) return;
    onInput('customHeight', v);
  };

  return (
    <div className="space-y-8">
      {/* ประเภทไม้ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TreePine className="w-5 h-5 text-green-600" /> ประเภทไม้
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(WOOD_TYPE_NAMES).map(([key, label]) => (
            <div
              key={key}
              onClick={() => onInput('woodType', key)}
              className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                form.woodType === key
                  ? 'border-green-500 bg-green-50 text-green-800 font-bold'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <TreePine className="w-6 h-6 mx-auto mb-1 opacity-70" />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* รุ่น */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <LayoutDashboardIcon /> รุ่นประตู
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(WOOD_MODEL_NAMES).map(([key, label]) => (
            <div
              key={key}
              onClick={() => onInput('modelId', key)}
              className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                form.modelId === key
                  ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-sm font-medium">{label}</span>
              <span className="block text-xs text-slate-500 mt-0.5">{key.toUpperCase()}</span>
            </div>
          ))}
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

      {/* ทำสี */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" /> การทำสี
        </h3>
        <div
          onClick={() => onInput('painted', !form.painted)}
          className={`cursor-pointer border-2 rounded-lg p-4 transition-all flex items-center gap-3 ${
            form.painted
              ? 'border-purple-500 bg-purple-50 text-purple-800'
              : 'border-slate-200 bg-slate-50 text-slate-400'
          }`}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
            form.painted ? 'bg-purple-500 border-purple-500' : 'border-slate-300 bg-white'
          }`}>
            {form.painted && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <div>
            <span className="font-medium">
              {form.painted ? 'ทำสี (ค่าเริ่มต้น)' : 'ไม่ทำสี'}
            </span>
            <p className={`text-xs mt-0.5 ${form.painted ? 'text-purple-600' : 'text-slate-400'}`}>
              {form.painted
                ? 'ค่าสีคำนวณตามช่วงขนาด — ติ๊กออกถ้าไม่ต้องการทำสี'
                : 'ราคาไม่รวมค่าทำสี — ติ๊กกลับถ้าต้องการทำสี'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline icon component (no extra import needed)
const LayoutDashboardIcon = () => (
  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <rect x={3} y={3} width={7} height={7} rx={1} />
    <rect x={14} y={3} width={7} height={7} rx={1} />
    <rect x={3} y={14} width={7} height={7} rx={1} />
    <rect x={14} y={14} width={7} height={7} rx={1} />
  </svg>
);
