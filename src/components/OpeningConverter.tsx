import React from 'react';
import { ArrowLeftRight, BrickWall, DoorClosed, Info } from 'lucide-react';
import type { OpeningFormData } from '../types';
import { calculateOpening } from '../lib/calculations';

interface Props {
  form: OpeningFormData;
  onInput: (field: keyof OpeningFormData, value: string) => void;
}

/** ตัดทศนิยม .0 ทิ้ง แต่คง .5 ไว้ */
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export const OpeningConverter: React.FC<Props> = ({ form, onInput }) => {
  const result = calculateOpening(form);
  const isFromDoor = form.mode === 'fromDoor';
  const isUpvc = form.material === 'upvc';

  const handleNum = (field: 'width' | 'height') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '' || /^\d{0,3}(\.\d?)?$/.test(v)) onInput(field, v);
  };

  return (
    <div className="space-y-6">
      {/* โจทย์ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-blue-600" /> ลูกค้าแจ้งขนาดอะไรมา?
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'fromDoor',    icon: DoorClosed, top: 'แจ้งขนาดประตู',  sub: 'คำนวณช่องปูนให้' },
            { id: 'fromOpening', icon: BrickWall,  top: 'แจ้งขนาดช่องปูน', sub: 'คำนวณขนาดประตูให้' },
          ].map(m => {
            const active = form.mode === m.id;
            return (
              <button key={m.id} type="button" onClick={() => onInput('mode', m.id)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                  active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                <m.icon className={`w-6 h-6 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <div className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-slate-700'}`}>{m.top}</div>
                  <div className="text-xs text-slate-400">{m.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* วัสดุ — เฉพาะโหมด ช่องปูน→ประตู */}
        {!isFromDoor && (
          <div className="mt-5">
            <label className="block text-sm font-medium text-slate-600 mb-2">ประเภทประตูที่จะทำ</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'wood', top: 'ประตูไม้', sub: 'ไสได้ ตัดตรงตามช่อง' },
                { id: 'upvc', top: 'ประตู uPVC / WPC', sub: 'ต้องลงท้าย 0 หรือ 5' },
              ].map(mt => {
                const active = form.material === mt.id;
                return (
                  <button key={mt.id} type="button" onClick={() => onInput('material', mt.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                    <div className={`text-sm font-semibold ${active ? 'text-emerald-700' : 'text-slate-700'}`}>{mt.top}</div>
                    <div className="text-xs text-slate-400">{mt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ขนาดที่กรอก */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-slate-600 mb-2">
            {isFromDoor ? 'ขนาดประตู (บานประตู)' : 'ขนาดช่องปูน (ช่องเปิดผนัง)'} — หน่วย cm
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500">กว้าง</label>
              <input type="number" inputMode="decimal" value={form.width} onChange={handleNum('width')}
                placeholder={isFromDoor ? '70' : '80'} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-slate-500">สูง</label>
              <input type="number" inputMode="decimal" value={form.height} onChange={handleNum('height')}
                placeholder={isFromDoor ? '200' : '200'} className="w-full p-3 border rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* ผลลัพธ์ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {!result.ok ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {result.error ?? 'กรอกขนาดเพื่อคำนวณ'}
          </div>
        ) : isFromDoor ? (
          /* ===== ประตู → ช่องปูน ===== */
          <div>
            <p className="text-sm text-slate-500 mb-1">ก่อช่องปูนที่ขนาด</p>
            <div className="text-4xl font-bold text-blue-600 mb-4">
              {fmt(result.openingW!)}<span className="text-2xl text-slate-400 mx-1">×</span>{fmt(result.openingH!)}
              <span className="text-lg text-slate-400 ml-2">cm</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="ประตู (บาน)" value={`${fmt(result.doorW!)} × ${fmt(result.doorH!)}`} />
              <Stat label="วงกบวัดนอก" value={`${fmt(result.frameW!)} × ${fmt(result.frameH!)}`} />
            </div>
            <Note>เผื่อกว้างข้างละ 3cm (บังใบ) + 0.5cm (ยัดวงกบ) และสูง +3cm (บังใบบน) + 1cm (ลอยพื้น)</Note>
          </div>
        ) : (
          /* ===== ช่องปูน → ประตู ===== */
          <div>
            <p className="text-sm text-slate-500 mb-1">
              ทำประตู{isUpvc ? ' uPVC/WPC' : 'ไม้'}ได้ที่ขนาด
            </p>
            <div className="text-4xl font-bold text-emerald-600 mb-4">
              {fmt(result.doorW!)}<span className="text-2xl text-slate-400 mx-1">×</span>{fmt(result.doorH!)}
              <span className="text-lg text-slate-400 ml-2">cm</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="ช่องปูน" value={`${fmt(result.openingW!)} × ${fmt(result.openingH!)}`} />
              <Stat label="วงกบวัดนอก" value={`${fmt(result.frameW!)} × ${fmt(result.frameH!)}`} />
            </div>

            {/* หมายเหตุการติดตั้ง (เฉพาะ uPVC) */}
            {isUpvc && (() => {
              const warn = (result.notes?.length ?? 0) > 0;
              return (
                <div className={`mt-4 rounded-lg p-4 border ${warn ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-sm font-semibold mb-2 flex items-center gap-1.5 ${warn ? 'text-amber-800' : 'text-slate-600'}`}>
                    <Info className="w-4 h-4" /> {warn ? 'ต้องแจ้งลูกค้าก่อนสั่ง' : 'การติดตั้ง'}
                  </p>
                  <ul className={`text-sm space-y-1.5 ${warn ? 'text-amber-900' : 'text-slate-600'}`}>
                    {result.notes?.map((n, i) => <li key={i}>{n}</li>)}
                    <li className={warn ? 'text-amber-700' : 'text-slate-500'}>
                      เก็บปูนเพิ่ม: ข้าง <b>{fmt(result.fillSide!)}</b> cm/ข้าง · บน <b>{fmt(result.fillTop!)}</b> cm · ล่างลอยพื้น ~{fmt(result.floorLift!)} cm (ไม่ต้องเก็บ)
                    </li>
                  </ul>
                </div>
              );
            })()}
            {/* ทางเลือกสุดท้าย: ไสบานขึ้น 1 ไซส์ */}
            {isUpvc && result.shaveHint && (
              <p className="mt-3 text-xs text-slate-400 flex items-start gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>{result.shaveHint}</span>
              </p>
            )}
            {!isUpvc && (
              <Note>ประตูไม้ไสได้ จึงตัดตรงตามช่องปูน (ช่องกว้าง −7, สูง −4)</Note>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-slate-50 rounded-lg p-3">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="font-semibold text-slate-800">{value} <span className="text-xs text-slate-400">cm</span></div>
  </div>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-4 text-xs text-slate-400 flex items-start gap-1.5">
    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>{children}</span>
  </p>
);
