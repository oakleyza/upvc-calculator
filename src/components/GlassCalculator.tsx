import React from 'react';
import { Square, Ruler } from 'lucide-react';
import type { GlassFormData } from '../types';
import { WOOD_GLASS_TYPES } from '../constants';

interface Props {
  form: GlassFormData;
  onInput: (field: keyof GlassFormData, value: string) => void;
}

export const GlassCalculator: React.FC<Props> = ({ form, onInput }) => {
  return (
    <div className="space-y-8">
      {/* ชนิดกระจก */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Square className="w-5 h-5 text-cyan-600" /> ชนิดกระจก
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {WOOD_GLASS_TYPES.map(g => (
            <div key={g.id}
              onClick={() => onInput('glassType', g.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                form.glassType === g.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <label className="flex items-center gap-2 pointer-events-none">
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${form.glassType === g.id ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300'}`} />
                <span className="text-sm">{g.label}</span>
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          ลอนใหญ่: ราคาขึ้นกับด้านยาวสุดของแผ่น (≤244cm = ถูกกว่า)
        </p>
      </div>

      {/* ขนาดแผ่น */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5 text-blue-600" /> ขนาดแผ่นกระจก (cm)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">กว้าง (cm)</label>
            <input
              type="number" min={0} placeholder="เช่น 60"
              value={form.glassWidth}
              onChange={e => onInput('glassWidth', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">สูง (cm)</label>
            <input
              type="number" min={0} placeholder="เช่น 200"
              value={form.glassHeight}
              onChange={e => onInput('glassHeight', e.target.value)}
              className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
