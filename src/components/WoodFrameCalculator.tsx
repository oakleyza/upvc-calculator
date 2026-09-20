import React from 'react';
import { Layers, Palette, Ruler, Grid3x3, PlusSquare } from 'lucide-react';
import type { WoodFrameFormData } from '../types';
import { WOOD_FRAME_TYPE_NAMES, WOOD_FRAME_SECTIONS } from '../constants';

interface Props {
  form: WoodFrameFormData;
  onInput: (field: keyof WoodFrameFormData, value: string | boolean) => void;
}

const SIZE_PRESETS: [number, number][] = [[70, 200], [80, 200], [90, 200]];
const SADAO_WIDTHS = [70, 80, 90];

export const WoodFrameCalculator: React.FC<Props> = ({ form, onInput }) => {
  const isSadao = form.frameType === 'sadao';

  const clampDim = (v: string) => {
    if (v === '') return '';
    if (Number(v) > 400) return '400';
    return v;
  };

  const selectWood = (key: string) => {
    onInput('frameType', key);
    if (key === 'sadao') {
      // สะเดา = เฉพาะ 3 ขนาด, ไม่มีธรณี/ช่องแสง
      const w = SADAO_WIDTHS.includes(Number(form.width)) ? form.width : '80';
      onInput('width', w);
      onInput('height', '200');
      onInput('threshold', false);
      onInput('slLeft', false); onInput('slRight', false); onInput('slTop', false);
    }
  };

  const applyPreset = (w: number, h: number) => {
    onInput('width', String(w));
    onInput('height', String(h));
  };

  // ── reusable toggle row ──
  const Toggle: React.FC<{ on: boolean; onToggle: () => void; title: string; sub: string }> = ({ on, onToggle, title, sub }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
        on ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300'
      }`}
    >
      <span className={`w-10 h-6 rounded-full flex-none relative transition-colors ${on ? 'bg-amber-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-slate-700">{title}</span>
        <span className="block text-xs text-slate-500">{sub}</span>
      </span>
    </button>
  );

  // ── sidelight size inputs ──
  const SidelightInputs: React.FC<{ wField: keyof WoodFrameFormData; hField: keyof WoodFrameFormData }> = ({ wField, hField }) => (
    <div className="mt-2 ml-12 pl-1 grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1">กว้างช่อง (cm)</label>
        <input
          type="number" min={1} max={300} value={form[wField] as string}
          onChange={e => onInput(wField, clampDim(e.target.value))}
          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">สูงช่อง (cm)</label>
        <input
          type="number" min={1} max={400} value={form[hField] as string}
          onChange={e => onInput(hField, clampDim(e.target.value))}
          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ชนิดไม้ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-600" /> ชนิดวงกบไม้
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(WOOD_FRAME_TYPE_NAMES).map(([key, label]) => (
            <div
              key={key}
              onClick={() => selectWood(key)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                form.frameType === key
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-slate-700'
              }`}
            >
              <span className="font-medium text-sm">{label}</span>
              {key === 'sadao' && <span className="block text-xs text-slate-400 mt-0.5">ราคาเหมา 3 ขนาด</span>}
              {key === 'curve_pluang' && <span className="block text-xs text-amber-500 mt-0.5">สอบถามราคา</span>}
            </div>
          ))}
        </div>
      </div>

      {/* หน้าตัดไม้ — ซ่อนสำหรับสะเดา */}
      {!isSadao && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-blue-600" /> หน้าตัดไม้
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {WOOD_FRAME_SECTIONS.map(s => (
              <div
                key={s.id}
                onClick={() => onInput('section', s.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                  form.section === s.id
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 hover:border-blue-300 text-slate-700'
                }`}
              >
                <span className="font-medium text-sm">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ขนาด */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5 text-emerald-600" /> ขนาดวงกบ (บานหลัก)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">กว้าง (cm)</label>
            <input
              type="number" min={1} max={400} value={form.width}
              onChange={e => onInput('width', clampDim(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              สูง (cm){isSadao && <span className="text-slate-400 font-normal"> — ล็อค 200</span>}
            </label>
            <input
              type="number" min={1} max={400} value={form.height} disabled={isSadao}
              onChange={e => onInput('height', clampDim(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {SIZE_PRESETS.map(([w, h]) => (
            <button
              key={w}
              type="button"
              onClick={() => applyPreset(w, h)}
              className="px-3 py-1 rounded-lg border border-slate-200 text-xs text-slate-500 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
            >
              {w}×{h}
            </button>
          ))}
        </div>
        {isSadao && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ไม้สะเดามีเฉพาะ 70×200, 80×200, 90×200 — ขนาดอื่นกรุณาเลือกไม้พลวง / เต็ง / แดง
          </div>
        )}
      </div>

      {/* ธรณี & ช่องแสง — ซ่อนสำหรับสะเดา */}
      {!isSadao && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PlusSquare className="w-5 h-5 text-amber-600" /> เพิ่มเติม — ธรณี &amp; ช่องแสง
          </h3>
          <div className="space-y-3">
            <Toggle
              on={form.threshold}
              onToggle={() => onInput('threshold', !form.threshold)}
              title="เพิ่มธรณี (ขาล่าง)"
              sub="+1 ท่อน = ความกว้างบานหลัก"
            />

            <div>
              <Toggle on={form.slLeft} onToggle={() => onInput('slLeft', !form.slLeft)}
                title="ช่องแสงด้านซ้าย" sub="+3 ท่อน (ข้าง·บน·ล่าง)" />
              {form.slLeft && <SidelightInputs wField="slLeftW" hField="slLeftH" />}
            </div>

            <div>
              <Toggle on={form.slRight} onToggle={() => onInput('slRight', !form.slRight)}
                title="ช่องแสงด้านขวา" sub="+3 ท่อน (ข้าง·บน·ล่าง)" />
              {form.slRight && <SidelightInputs wField="slRightW" hField="slRightH" />}
            </div>

            <div>
              <Toggle on={form.slTop} onToggle={() => onInput('slTop', !form.slTop)}
                title="ช่องแสงด้านบน (transom)" sub="+3 ท่อน (ข้าง·บน·ล่าง)" />
              {form.slTop && <SidelightInputs wField="slTopW" hField="slTopH" />}
            </div>
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
        <div className="grid grid-cols-2 gap-3">
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
        </div>
      </div>

    </div>
  );
};
