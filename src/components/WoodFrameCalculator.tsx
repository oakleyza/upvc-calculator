import React from 'react';
import { TreePine, Grid3x3, Maximize, PlusSquare, Palette } from 'lucide-react';
import type { WoodFrameFormData } from '../types';
import { WOOD_FRAME_TYPE_NAMES, WOOD_FRAME_SECTIONS, WOOD_FRAME_SECTION_MAX } from '../constants';

interface Props {
  form: WoodFrameFormData;
  onInput: (field: keyof WoodFrameFormData, value: string | boolean) => void;
}

const SIZE_OPTIONS = [
  { id: '70x200cm', l: '70×200' },
  { id: '80x200cm', l: '80×200' },
  { id: '90x200cm', l: '90×200' },
  { id: 'custom',   l: 'Custom' },
];

// ปัดค่าขนาดไม่ให้เกิน 400
const clampDim = (v: string) => {
  if (v === '') return '';
  if (Number(v) > 400) return '400';
  return v;
};

// ── ช่องแสง: checkbox + ช่องกรอกขนาด ──
// นิยามที่ระดับ module เพื่อไม่ให้ React remount input ทุกครั้งที่พิมพ์ (โฟกัสจะได้ไม่หลุด)
const Sidelight: React.FC<{
  form: WoodFrameFormData;
  onInput: (field: keyof WoodFrameFormData, value: string | boolean) => void;
  field: keyof WoodFrameFormData; label: string;
  wField: keyof WoodFrameFormData; hField: keyof WoodFrameFormData;
}> = ({ form, onInput, field, label, wField, hField }) => {
  const on = form[field] as boolean;
  return (
    <div className="border rounded-lg overflow-hidden">
      <label className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors">
        <input type="checkbox" checked={on} onChange={() => onInput(field, !on)}
          className="w-5 h-5 rounded text-blue-600" />
        <span className="text-sm text-slate-700 font-medium">{label}</span>
        <span className="text-xs text-slate-400">+3 ท่อน (ข้าง·บน·ล่าง)</span>
      </label>
      {on && (
        <div className="grid grid-cols-2 gap-4 bg-slate-50 border-t p-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">กว้างช่อง (cm)</label>
            <input type="number" min={1} max={400} value={form[wField] as string}
              onChange={e => onInput(wField, clampDim(e.target.value))}
              className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">สูงช่อง (cm)</label>
            <input type="number" min={1} max={400} value={form[hField] as string}
              onChange={e => onInput(hField, clampDim(e.target.value))}
              className="w-full p-2 border rounded" />
          </div>
        </div>
      )}
    </div>
  );
};

export const WoodFrameCalculator: React.FC<Props> = ({ form, onInput }) => {
  const isSadao = form.frameType === 'sadao';

  const maxSectionW = WOOD_FRAME_SECTION_MAX[form.frameType] ?? 99;
  const allowedSections = WOOD_FRAME_SECTIONS.filter(s => s.w <= maxSectionW);
  const largestAllowed = allowedSections[allowedSections.length - 1];

  const selectWood = (key: string) => {
    onInput('frameType', key);
    if (key === 'sadao') {
      // สะเดา = เฉพาะ 3 ขนาด, ไม่มีธรณี/ช่องแสง
      if (form.sizeType === 'custom') onInput('sizeType', '80x200cm');
      onInput('threshold', false);
      onInput('slLeft', false); onInput('slRight', false); onInput('slTop', false);
      return;
    }
    // ถ้าหน้าตัดที่เลือกอยู่เกินที่ไม้ชนิดใหม่รองรับ → ปรับลงมาที่ไซส์ใหญ่สุดที่เลือกได้
    const newMax = WOOD_FRAME_SECTION_MAX[key] ?? 99;
    const cur = WOOD_FRAME_SECTIONS.find(s => s.id === form.section);
    if (cur && cur.w > newMax) {
      const allowed = WOOD_FRAME_SECTIONS.filter(s => s.w <= newMax);
      const largest = allowed[allowed.length - 1];
      if (largest) onInput('section', largest.id);
    }
  };

  return (
    <div className="space-y-8">

      {/* ชนิดไม้ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TreePine className="w-5 h-5 text-green-600" /> ชนิดวงกบไม้
        </h3>
        <label className="block text-sm font-medium text-slate-600 mb-2">ชนิดไม้</label>
        <select
          value={form.frameType}
          onChange={e => selectWood(e.target.value)}
          className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-green-400 outline-none"
        >
          {Object.entries(WOOD_FRAME_TYPE_NAMES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {isSadao && <p className="text-xs text-slate-400 mt-2">ราคาเหมา 3 ขนาด (70×200, 80×200, 90×200)</p>}
        {form.frameType === 'curve_pluang' && <p className="text-xs text-amber-500 mt-2">* ยังไม่มีสูตรคำนวณ — กรุณาสอบถามราคา</p>}
      </div>

      {/* หน้าตัดไม้ — ซ่อนสำหรับสะเดา */}
      {!isSadao && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-blue-600" /> หน้าตัดไม้
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {WOOD_FRAME_SECTIONS.map(s => {
              const allowed = s.w <= maxSectionW;
              const selected = form.section === s.id;
              return (
                <div key={s.id} onClick={() => allowed && onInput('section', s.id)}
                  className={`border-2 rounded-lg p-3 text-center transition-all ${
                    !allowed ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                      : selected ? 'cursor-pointer border-blue-500 bg-blue-50'
                      : 'cursor-pointer border-slate-200'
                  }`}>
                  <div className={`text-sm ${selected && allowed ? 'font-bold text-blue-700' : 'text-slate-700'}`}>{s.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.cm}</div>
                </div>
              );
            })}
          </div>
          {largestAllowed && maxSectionW < 99 && (
            <p className="text-xs text-amber-600 mt-3">
              * {WOOD_FRAME_TYPE_NAMES[form.frameType]} เลือกหน้าตัดได้ถึง {largestAllowed.label} เท่านั้น
            </p>
          )}
        </div>
      )}

      {/* ขนาด */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Maximize className="w-5 h-5 text-blue-600" /> ขนาดวงกบ (บานหลัก)
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {SIZE_OPTIONS.map(s => (
            <div key={s.id} onClick={() => onInput('sizeType', s.id)}
              className={`cursor-pointer border-2 rounded-lg p-3 text-center text-sm transition-all ${
                form.sizeType === s.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200'
              }`}>{s.l}</div>
          ))}
        </div>

        {form.sizeType === 'custom' && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4 flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-600">กว้าง (cm)</label>
              <input type="number" min={1} max={400} value={form.customWidth}
                onChange={e => onInput('customWidth', clampDim(e.target.value))}
                className="w-full p-2 border rounded" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-600">สูง (cm)</label>
              <input type="number" min={1} max={400} value={form.customHeight}
                onChange={e => onInput('customHeight', clampDim(e.target.value))}
                className="w-full p-2 border rounded" />
            </div>
          </div>
        )}

        {isSadao && (
          <p className="text-xs text-amber-600 mt-3">
            * ไม้สะเดามีเฉพาะ 70×200, 80×200, 90×200 — ขนาดอื่นกรุณาเลือกไม้พลวง / เต็ง / แดง
          </p>
        )}
      </div>

      {/* ธรณี & ช่องแสง — ซ่อนสำหรับสะเดา */}
      {!isSadao && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PlusSquare className="w-5 h-5 text-amber-600" /> เพิ่มเติม — ธรณี &amp; ช่องแสง
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input type="checkbox" checked={form.threshold} onChange={() => onInput('threshold', !form.threshold)}
                className="w-5 h-5 rounded text-blue-600" />
              <span className="text-sm text-slate-700 font-medium">เพิ่มธรณี (ขาล่าง)</span>
              <span className="text-xs text-slate-400">+1 ท่อน = ความกว้าง</span>
            </label>

            <Sidelight form={form} onInput={onInput} field="slLeft"  label="ช่องแสงด้านซ้าย"        wField="slLeftW"  hField="slLeftH" />
            <Sidelight form={form} onInput={onInput} field="slRight" label="ช่องแสงด้านขวา"         wField="slRightW" hField="slRightH" />
            <Sidelight form={form} onInput={onInput} field="slTop"   label="ช่องแสงด้านบน (transom)" wField="slTopW"   hField="slTopH" />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            * ช่องแสงงานสีจะสรุปเป็น “เหมาต่อช่อง” ภายหลัง — ตอนนี้คิดค่าไม้ตามความยาว
          </p>
        </div>
      )}

      {/* การทำสี */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" /> การทำสี
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[{ v: true, l: 'ทำสี' }, { v: false, l: 'ไม่ทำสี (งานดิบ)' }].map(o => (
            <div key={String(o.v)}
              onClick={() => onInput('painted', o.v)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                form.painted === o.v ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
              }`}>
              <label className="flex items-center gap-2 pointer-events-none">
                <div className={`w-4 h-4 rounded-full border-2 ${form.painted === o.v ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`} />
                <span className="text-sm">{o.l}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
