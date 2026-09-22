import React from 'react';
import { Ruler, Palette } from 'lucide-react';
import type { PlaswoodRailFormData } from '../types';
import { PLASWOOD_RAIL_SIZES, PLASWOOD_RAIL_FINISHES } from '../constants';

interface Props {
  form: PlaswoodRailFormData;
  onInput: (field: keyof PlaswoodRailFormData, value: string) => void;
}

export const PlaswoodRailCalculator: React.FC<Props> = ({ form, onInput }) => {
  return (
    <div className="space-y-8">
      {/* ขนาด */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5 text-blue-600" /> ขนาดบังราง Plaswood
        </h3>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          ขนาด (ยาว × กว้าง × หนา)
        </label>
        <select
          value={form.sizeId}
          onChange={e => onInput('sizeId', e.target.value)}
          className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-400 outline-none"
        >
          {PLASWOOD_RAIL_SIZES.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-2">แสดงเฉพาะขนาดที่มีราคา</p>
      </div>

      {/* รูปแบบการทำสี */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" /> รูปแบบการทำสี
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLASWOOD_RAIL_FINISHES.map(f => (
            <div key={f.id}
              onClick={() => onInput('finish', f.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                form.finish === f.id ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
              }`}>
              <label className="flex items-center gap-2 pointer-events-none">
                <div className={`w-4 h-4 rounded-full border-2 ${form.finish === f.id ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`} />
                <span className="text-sm">{f.label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
