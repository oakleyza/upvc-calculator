import React from 'react';
import { Maximize, Palette } from 'lucide-react';
import type { FrameFormData } from '../types';
import { FRAME_MATERIALS, isFrameWithSub } from '../constants';

interface Props {
  form: FrameFormData;
  onInput: (field: keyof FrameFormData, value: string) => void;
}

export const FrameCalculator: React.FC<Props> = ({ form, onInput }) => {
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') { onInput('customWidth', ''); return; }
    const n = Number(v);
    if (n > 999) return; // บล็อกแค่ค่าไม่สมเหตุสมผล
    onInput('customWidth', v);
  };

  const handleWidthBlur = () => {
    const n = Number(form.customWidth);
    if (!form.customWidth || n === 0) return;
    if (n < 45) {
      alert('ความกว้างต้องไม่น้อยกว่า 45 cm\nกรุณากรอกใหม่');
      onInput('customWidth', ''); return;
    }
    if (n > maxW) {
      alert(`ความกว้างสูงสุดคือ ${maxW} cm\nกรุณากรอกใหม่`);
      onInput('customWidth', ''); return;
    }
    if (n % 5 !== 0) {
      alert('ขนาดต้องลงท้ายด้วยเลข 0 หรือ 5 เท่านั้น\nกรุณากรอกใหม่');
      onInput('customWidth', '');
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') { onInput('customHeight', ''); return; }
    const n = Number(v);
    if (n > 999) return; // บล็อกแค่ค่าไม่สมเหตุสมผล
    onInput('customHeight', v);
  };

  const handleHeightBlur = () => {
    const n = Number(form.customHeight);
    if (!form.customHeight || n === 0) return;
    if (n < 150) {
      alert('ความสูงต้องไม่น้อยกว่า 150 cm\nกรุณากรอกใหม่');
      onInput('customHeight', ''); return;
    }
    if (n > maxH) {
      alert(`ความสูงสูงสุดคือ ${maxH} cm\nกรุณากรอกใหม่`);
      onInput('customHeight', ''); return;
    }
    if (n % 5 !== 0) {
      alert('ขนาดต้องลงท้ายด้วยเลข 0 หรือ 5 เท่านั้น\nกรุณากรอกใหม่');
      onInput('customHeight', '');
    }
  };

  const canSVL = isFrameWithSub(form.frameMaterial);
  const maxW   = form.frameMaterial === FRAME_MATERIALS.ADJUST_X ? 90 : 180;
  const maxH   = (form.frameMaterial === FRAME_MATERIALS.F10 || form.frameMaterial === FRAME_MATERIALS.ADJUST_X) ? 220 : 240;

  return (
    <div className="space-y-8">
      {/* สเปควงกบ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Maximize className="w-5 h-5 text-blue-600" /> สเปควงกบ
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-2">ประเภท/รุ่น ของวงกบ</label>
            <select value={form.frameMaterial} onChange={e => onInput('frameMaterial', e.target.value)}
              className="w-full p-3 border rounded-lg">
              <optgroup label="--- ไม้สังเคราะห์ (WPC) ---">
                <option value={FRAME_MATERIALS.T2}>วงกบไม้สังเคราะห์ 4 นิ้ว เหลี่ยม (T2) — สูงสุด 240cm</option>
                <option value={FRAME_MATERIALS.F10}>วงกบไม้สังเคราะห์ 4 นิ้ว เหลี่ยม (F10) — สูงสุด 220cm</option>
                <option value={FRAME_MATERIALS.ADJUST_ECO}>วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust Eco — สูงสุด 240cm</option>
                <option value={FRAME_MATERIALS.ADJUST_X}>วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust X — สูงสุด 220cm</option>
                <option value={FRAME_MATERIALS.ADJUST_BIG_SIX}>วงกบไม้สังเคราะห์ รุ่น Adjust Big Six (ไม่มีซับ) — สูงสุด 240cm</option>
                <option value={FRAME_MATERIALS.WPC_5IN}>วงกบไม้สังเคราะห์ 5 นิ้ว เหลี่ยม — สูงสุด 240cm</option>
              </optgroup>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-2">ขนาดวงกบ (วัดใน)</label>
            <div className="grid grid-cols-4 gap-3">
              {[{id:'70x200cm',l:'70×200'},{id:'80x200cm',l:'80×200'},{id:'90x200cm',l:'90×200'},{id:'custom',l:'Custom'}].map(s => (
                <div key={s.id} onClick={() => onInput('sizeType', s.id)}
                  className={`cursor-pointer border-2 rounded-lg p-3 text-center text-sm transition-all ${
                    form.sizeType === s.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200'
                  }`}>{s.l}</div>
              ))}
            </div>

            {form.sizeType === 'custom' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4 flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-slate-600">
                    กว้าง <span className="text-red-500">(45–{maxW} cm)</span>
                  </label>
                  <input type="number" value={form.customWidth} onChange={handleWidthChange} onBlur={handleWidthBlur}
                    min={45} max={maxW} className="w-full p-2 border rounded" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-600">
                    สูง <span className="text-red-500">(150–{maxH} cm)</span>
                  </label>
                  <input type="number" value={form.customHeight} onChange={handleHeightChange} onBlur={handleHeightBlur}
                    min={150} max={maxH} className="w-full p-2 border rounded" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* สีวงกบ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" /> สีวงกบ
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {(['TOA', 'SVL', 'none'] as const).map(t => {
            const disabled = t === 'SVL' && !canSVL;
            return (
              <div key={t}
                onClick={() => !disabled && onInput('surfaceType', t)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  form.surfaceType === t ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
                } ${disabled ? 'opacity-40 cursor-not-allowed bg-slate-100' : 'cursor-pointer'}`}>
                <label className="flex items-center gap-2 pointer-events-none">
                  <div className={`w-4 h-4 rounded-full border-2 ${form.surfaceType === t ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`} />
                  <span className="text-sm">
                    {t === 'TOA' ? 'พ่นสี TOA' : t === 'SVL' ? 'ปิดผิว SVL' : 'ไม่ทำสี (งานดิบ)'}
                  </span>
                </label>
                {disabled && <p className="text-[10px] text-red-500 mt-1">* เฉพาะรุ่นที่มีซับ</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
