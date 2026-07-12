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
      {/* ชนิดไม้ + รุ่น (Dropdowns) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TreePine className="w-5 h-5 text-green-600" /> ชนิดไม้ & รุ่นประตู
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">รุ่นประตู</label>
            <select
              value={form.modelId}
              onChange={e => onInput('modelId', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-amber-400 outline-none"
            >
              {Object.entries(WOOD_MODEL_NAMES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
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
