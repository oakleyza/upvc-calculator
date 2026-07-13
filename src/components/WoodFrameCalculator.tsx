import React from 'react';
import { Layers, Palette } from 'lucide-react';
import type { WoodFrameFormData } from '../types';
import { WOOD_FRAME_TYPE_NAMES } from '../constants';

interface Props {
  form: WoodFrameFormData;
  onInput: (field: keyof WoodFrameFormData, value: string | boolean) => void;
}

const STANDARD_SIZES = ['70x200cm', '80x200cm', '90x200cm'] as const;

export const WoodFrameCalculator: React.FC<Props> = ({ form, onInput }) => {
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
    <div className="space-y-6">

      {/* ชนิดวงกบ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-600" /> ชนิดวงกบไม้
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(WOOD_FRAME_TYPE_NAMES).map(([key, label]) => (
            <div
              key={key}
              onClick={() => onInput('frameType', key)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                form.frameType === key
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-slate-700'
              }`}
            >
              <span className="font-medium text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ขนาด */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" /> ขนาด (กว้าง × สูง)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STANDARD_SIZES.map(size => (
            <div
              key={size}
              onClick={() => onInput('sizeType', size)}
              className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                form.sizeType === size
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-slate-200 hover:border-blue-300 text-slate-700'
              }`}
            >
              <span className="font-medium text-sm">{size}</span>
            </div>
          ))}
          <div
            onClick={() => onInput('sizeType', 'custom')}
            className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
              form.sizeType === 'custom'
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-slate-200 hover:border-blue-300 text-slate-700'
            }`}
          >
            <span className="font-medium text-sm">Custom</span>
          </div>
        </div>

        {form.sizeType === 'custom' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">กว้าง (cm)</label>
              <input
                type="number"
                value={form.customWidth}
                onChange={handleWidthChange}
                placeholder="เช่น 85"
                min={1}
                max={999}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">สูง (cm)</label>
              <input
                type="number"
                value={form.customHeight}
                onChange={handleHeightChange}
                placeholder="เช่น 205"
                min={1}
                max={999}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="col-span-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ ขนาด Custom ยังไม่มีราคาในระบบ — กรุณาสอบถามราคาเพิ่มเติม
            </div>
          </div>
        )}
      </div>

      {/* การทำสี */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" /> การทำสี
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onInput('painted', false)}
            className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all ${
              !form.painted
                ? 'border-slate-500 bg-slate-50 text-slate-800'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            <span className="font-medium text-sm">ไม่ทำสี (งานดิบ)</span>
          </div>
          <div
            onClick={() => onInput('painted', true)}
            className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all ${
              form.painted
                ? 'border-purple-500 bg-purple-50 text-purple-800'
                : 'border-slate-200 hover:border-purple-300 text-slate-600'
            }`}
          >
            <span className="font-medium text-sm">ทำสี</span>
          </div>
        </div>
      </div>

    </div>
  );
};
