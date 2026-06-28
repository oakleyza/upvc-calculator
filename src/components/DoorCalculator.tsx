import React from 'react';
import { Settings, Palette, Calculator, Check } from 'lucide-react';
import type { DoorFormData } from '../types';

interface Props {
  form: DoorFormData;
  onInput: (field: keyof DoorFormData, value: string | boolean | Record<string, boolean>) => void;
  onOptionToggle: (key: string) => void;
}

export const DoorCalculator: React.FC<Props> = ({ form, onInput, onOptionToggle }) => {
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') { onInput('customWidth', ''); return; }
    const n = Number(v);
    if (n < 1 || n > 120) return; // ไม่บล็อกระหว่างพิมพ์
    onInput('customWidth', v);
  };

  // clamp ต่ำสุด 45 ตอนออกจากช่อง (ไม่บล็อกขณะพิมพ์)
  const handleWidthBlur = () => {
    const n = Number(form.customWidth);
    if (n > 0 && n < 45) onInput('customWidth', '45');
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') { onInput('customHeight', ''); return; }
    const n = Number(v);
    if (n < 1 || n > 240) return; // ไม่บล็อกระหว่างพิมพ์
    onInput('customHeight', v);
  };

  // clamp ต่ำสุด 150 ตอนออกจากช่อง (ไม่บล็อกขณะพิมพ์)
  const handleHeightBlur = () => {
    const n = Number(form.customHeight);
    if (n > 0 && n < 150) onInput('customHeight', '150');
  };

  // C-2 FIX: Constraint flags เป็น computed variables ธรรมดา (ไม่ใช้ IIFE)
  const groovingDisabled = form.molding !== 'none';
  const moldingDisabled  = form.surfaceType === 'SVL';
  const glassDisabled    = form.molding !== 'none' && form.louver !== 'none';
  const louverDisabled   = form.molding !== 'none' && form.glass  !== 'none';

  return (
    <div className="space-y-8">
      {/* โครงสร้างและขนาด */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" /> ข้อมูลโครงสร้างและขนาด (ประตู)
        </h3>
        <div className="space-y-4">
          {/* แถว 1: โครงสร้างวัสดุ */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">โครงสร้างวัสดุ</label>
            <select value={form.structure} onChange={e => onInput('structure', e.target.value)}
              className="w-full p-2.5 border rounded-lg">
              <option value="uPVC">ประตู uPVC</option>
              <option value="WPC RIGID">ประตู WPC RIGID</option>
              <option value="WPC MAX">ประตู WPC MAX</option>
            </select>
          </div>
          {/* แถว 2: ขนาดประตู — เต็มความกว้าง 4 ปุ่มเรียง */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">ขนาดประตู</label>
            <div className="grid grid-cols-4 gap-2">
              {[{id:'70x200cm',l:'70×200'},{id:'80x200cm',l:'80×200'},{id:'90x200cm',l:'90×200'},{id:'custom',l:'Custom'}].map(s => (
                <div key={s.id} onClick={() => onInput('sizeType', s.id)}
                  className={`cursor-pointer border-2 rounded-lg p-3 text-center text-sm transition-all ${
                    form.sizeType === s.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200'
                  }`}>{s.l}</div>
              ))}
            </div>
            {form.sizeType === 'custom' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-600">กว้าง <span className="text-red-500">(45–120 cm)</span></label>
                    <input type="number" value={form.customWidth} onChange={handleWidthChange} onBlur={handleWidthBlur}
                      min={45} max={120} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">สูง <span className="text-red-500">(150–240 cm)</span></label>
                    <input type="number" value={form.customHeight} onChange={handleHeightChange} onBlur={handleHeightBlur}
                      min={150} max={240} className="w-full p-2 border rounded" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* สีและดีไซน์ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" /> สีและดีไซน์หน้าบาน
        </h3>
        <div className="grid grid-cols-2 gap-6">
          {/* เลือกสี */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {(['TOA', 'SVL'] as const).map(t => (
              <div key={t} onClick={() => onInput('surfaceType', t)}
                className={`p-4 rounded-lg border-2 cursor-pointer ${form.surfaceType === t ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                <label className="flex items-center gap-2 pointer-events-none">
                  <div className={`w-4 h-4 rounded-full border-2 ${form.surfaceType === t ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`} />
                  {t === 'TOA' ? 'พ่นสี TOA' : 'ปิดผิว SVL'}
                </label>
              </div>
            ))}
          </div>

          {/* เซาะร่อง */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${groovingDisabled ? 'text-slate-400' : 'text-slate-600'}`}>การเซาะร่อง</label>
            <select value={form.grooving} onChange={e => onInput('grooving', e.target.value)}
              disabled={groovingDisabled}
              className={`w-full p-2.5 border rounded-lg ${groovingDisabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}>
              <option value="none">ไม่เซาะร่อง</option>
              <option value="standard">เซาะร่องปกติ</option>
              <option value="black_line">เซาะร่องแปะเส้นดำ</option>
              <option value="painted">เซาะร่องทำสี</option>
            </select>
            {groovingDisabled && <p className="text-[10px] text-red-500 mt-1">* ติดคิ้วแล้ว ไม่สามารถเซาะร่องได้</p>}
          </div>

          {/* ติดคิ้ว */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${moldingDisabled ? 'text-slate-400' : 'text-slate-600'}`}>ติดคิ้วพ่นสี</label>
            <select value={form.molding} onChange={e => onInput('molding', e.target.value)}
              disabled={moldingDisabled}
              className={`w-full p-2.5 border rounded-lg ${moldingDisabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}>
              <option value="none">ไม่ติดคิ้ว</option>
              <option value="first_1">First Class 1 ช่อง</option>
              <option value="first_2">First Class 2 ช่อง</option>
              <option value="roma_1">ROMA 1 ช่อง</option>
              <option value="roma_2">ROMA 2 ช่อง</option>
            </select>
            {moldingDisabled && <p className="text-[10px] text-red-500 mt-1">* SVL ไม่สามารถติดคิ้วได้</p>}
          </div>

          {/* กระจก */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${glassDisabled ? 'text-slate-400' : 'text-slate-600'}`}>กระจก</label>
            <select value={form.glass} onChange={e => onInput('glass', e.target.value)}
              disabled={glassDisabled}
              className={`w-full p-2.5 border rounded-lg ${glassDisabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}>
              <option value="none">ไม่ติดกระจก</option>
              <option value="frosted">กระจกฝ้าเต็มบาน</option>
              <option value="frosted_half">กระจกฝ้าครึ่งบาน</option>
              <option value="frosted_side">กระจกฝ้าข้าง</option>
              <option value="green_full">กระจกเขียวตัดแสงเต็มบาน</option>
              <option value="green_half">กระจกเขียวตัดแสงครึ่งบาน</option>
              <option value="green_side">กระจกเขียวตัดแสงข้าง</option>
            </select>
            {glassDisabled && <p className="text-[10px] text-red-500 mt-1">* ติดคิ้วและมีเกล็ดแล้ว เลือกได้แค่อันเดียว</p>}
          </div>

          {/* เกล็ด */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${louverDisabled ? 'text-slate-400' : 'text-slate-600'}`}>เกล็ดระบายอากาศ</label>
            <select value={form.louver} onChange={e => onInput('louver', e.target.value)}
              disabled={louverDisabled}
              className={`w-full p-2.5 border rounded-lg ${louverDisabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}>
              <option value="none">ไม่ใส่เกล็ด</option>
              <option value="full">เกล็ดเต็มบาน</option>
              <option value="half">เกล็ดครึ่งบาน</option>
              <option value="side">เกล็ดข้าง</option>
              <option value="bottom">เกล็ดล่าง</option>
              <option value="full_painted">เกล็ดเต็มบาน พ่นสี</option>
              <option value="half_painted">เกล็ดครึ่งบาน พ่นสี</option>
              <option value="side_painted">เกล็ดข้าง พ่นสี</option>
              <option value="bottom_painted">เกล็ดล่าง พ่นสี</option>
            </select>
            {louverDisabled && <p className="text-[10px] text-red-500 mt-1">* ติดคิ้วและมีกระจกแล้ว เลือกได้แค่อันเดียว</p>}
          </div>
        </div>
      </div>

      {/* การเจาะและเสริมโครง */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-orange-600" /> การเจาะและเสริมโครง
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">เสริมโครง</label>
            <select value={form.reinforce} onChange={e => onInput('reinforce', e.target.value)} className="w-full p-2.5 border rounded-lg">
              <option value="none">ไม่เสริมโครง</option>
              <option value="lever">เสริมโครงก้านโยก</option>
              <option value="digital">เสริมโครงดิจิตอลล็อก</option>
              <option value="recessed">เสริมโครงมือจับฝัง</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">การเจาะลูกบิด</label>
            <select value={form.drilling} onChange={e => onInput('drilling', e.target.value)} className="w-full p-2.5 border rounded-lg">
              <option value="none">ไม่เจาะลูกบิด</option>
              <option value="knob">เจาะลูกบิด</option>
              <option value="lever">เจาะก้านโยก</option>
              <option value="digital">เจาะดิจิตอลล็อค</option>
              <option value="recessed">เจาะมือจับฝัง</option>
            </select>
          </div>
        </div>
      </div>

      {/* Option เสริม */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" /> Option เสริม
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            {k:'shock_up',     l:'เสริมโครงติด SHOCK UP'},
            {k:'handle',       l:'เสริมโครงด้ามจับ'},
            {k:'sliding',      l:'เสริมโครงบานเลื่อน'},
            {k:'stopper',      l:'เสริมโครง Stopper'},
            {k:'peephole',     l:'เจาะตาแมว'},
            {k:'rabbet',       l:'ทำบังใบ'},
            {k:'knob_plate_40',l:'เสริมโครงแป้นรอง 40cm'},
            {k:'wood_top_bottom',l:'เสริมโครงไม้ บน/ล่าง'},
          ].map(o => (
            <label key={o.k} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input type="checkbox" checked={!!form.options[o.k]} onChange={() => onOptionToggle(o.k)}
                className="w-5 h-5 rounded text-blue-600" />
              <span className="text-sm text-slate-700 font-medium">{o.l}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
