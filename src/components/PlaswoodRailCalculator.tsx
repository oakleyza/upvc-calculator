import React from 'react';
import { Ruler } from 'lucide-react';
import type { PlaswoodRailFormData } from '../types';
import { PLASWOOD_RAIL_SIZES } from '../constants';

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
    </div>
  );
};
