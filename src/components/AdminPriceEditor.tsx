import React, { useState } from 'react';
import { X, Save, Database, Tag, Maximize, Palette, LayoutDashboard, Hammer, ShieldAlert } from 'lucide-react';
import type { PricingStructure } from '../types';
import { LABEL_MAP } from '../constants';

interface Props {
  currentPrices: PricingStructure;
  onSave: (newPrices: PricingStructure) => void;
  onClose: () => void;
}

type ActiveCategory = 'door' | 'frame_t2' | 'frame_f10' | 'frame_x' | 'frame_eco' | 'frame_bsx';

export const AdminPriceEditor: React.FC<Props> = ({ currentPrices, onSave, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('door');
  const [localPrices, setLocalPrices] = useState<PricingStructure>(
    JSON.parse(JSON.stringify(currentPrices))
  );
  const [errors, setErrors] = useState<string[]>([]);

  const handlePriceChange = (category: keyof PricingStructure, key: string, val: string) => {
    const num = parseFloat(val);
    setLocalPrices(prev => ({
      ...prev,
      [category]: { ...(prev[category] ?? {}), [key]: isNaN(num) ? 0 : num },
    }));
  };

  const handleSaveWithValidation = () => {
    const errs: string[] = [];
    const cats: (keyof PricingStructure)[] = [
      'door_base','door_size','door_surface','frame_base','frame_size','frame_surface',
      'grooving','molding','glass','louver','reinforce','drilling','options',
    ];
    cats.forEach(cat => {
      Object.entries(localPrices[cat] ?? {}).forEach(([key, val]) => {
        if (typeof val === 'number' && val < 0) {
          errs.push(`"${LABEL_MAP[key] ?? key}" มีค่าติดลบ (${val})`);
        }
      });
    });
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    onSave(localPrices);
  };

  // C-2 FIX: ใช้ฟังก์ชันแทน IIFE ใน JSX
  const renderInput = (category: keyof PricingStructure, key: string) => {
    if (key === 'custom') return null;
    if (!LABEL_MAP[key]) return null;
    const value = localPrices[category]?.[key] ?? 0;
    const isNeg = value < 0;
    return (
      <div key={key} className="flex justify-between items-center p-2.5 border-b last:border-0 hover:bg-slate-50 transition-colors">
        <span className="text-sm font-medium text-slate-700">{LABEL_MAP[key]}</span>
        <div className="flex items-center gap-2">
          <input
            type="number" value={value} min={0}
            onChange={e => handlePriceChange(category, key, e.target.value)}
            className={`w-20 p-1.5 text-right border rounded focus:ring-2 outline-none text-sm font-semibold ${
              isNeg ? 'border-red-400 bg-red-50 focus:ring-red-500' : 'bg-white focus:ring-blue-500'
            }`}
          />
          <span className="text-xs text-slate-400">฿</span>
        </div>
      </div>
    );
  };

  const tabs: { id: ActiveCategory; label: string }[] = [
    { id: 'door',      label: '🚪 ราคาประตู' },
    { id: 'frame_t2',  label: '🔲 วงกบ T2' },
    { id: 'frame_f10', label: '🔲 วงกบ F10' },
    { id: 'frame_x',   label: '✨ Adjust X' },
    { id: 'frame_eco', label: '✨ Adjust Eco' },
    { id: 'frame_bsx', label: '⬡ Big Six' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400">
            <Database className="w-5 h-5" /> จัดการราคากลาง
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 hover:text-red-400 transition-colors" /></button>
        </div>

        {/* Tab bar */}
        <div className="flex bg-slate-100 border-b p-2 gap-2 overflow-x-auto shrink-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveCategory(t.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeCategory === t.id
                  ? 'bg-white text-blue-700 shadow-sm border-t-2 border-blue-600'
                  : 'bg-transparent text-slate-500 hover:bg-slate-200'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeCategory === 'door' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <h4 className="font-bold text-blue-700 mb-4 pb-2 border-b flex items-center gap-2">
                    <Tag className="w-4 h-4" /> โครงสร้าง & ราคาตั้งต้น
                  </h4>
                  {Object.keys(localPrices.door_base).map(k => renderInput('door_base', k))}
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-4 pb-2 border-b flex items-center gap-2">
                    <Maximize className="w-4 h-4" /> Surcharge ขนาดประตู
                  </h4>
                  {Object.keys(localPrices.door_size).map(k => renderInput('door_size', k))}
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-purple-600 mb-4 pb-2 border-b flex items-center gap-2">
                  <Palette className="w-4 h-4" /> งานสี & ดีไซน์หน้าบาน
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ทำสี/ปิดผิว</h5>{Object.keys(localPrices.door_surface).map(k => renderInput('door_surface', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">เซาะร่อง</h5>{Object.keys(localPrices.grooving).map(k => renderInput('grooving', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ติดคิ้ว</h5>{Object.keys(localPrices.molding).map(k => renderInput('molding', k))}</div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-teal-600 mb-4 pb-2 border-b flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> งานกระจก & เกล็ดระบายอากาศ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ช่องกระจก</h5>{Object.keys(localPrices.glass).map(k => renderInput('glass', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">เกล็ดระบายอากาศ</h5>{Object.keys(localPrices.louver).map(k => renderInput('louver', k))}</div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-slate-700 mb-4 pb-2 border-b flex items-center gap-2">
                  <Hammer className="w-4 h-4" /> การเจาะ & อุปกรณ์เสริม
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ค่าเจาะ</h5>{Object.keys(localPrices.drilling).map(k => renderInput('drilling', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ค่าเสริมโครง</h5>{Object.keys(localPrices.reinforce).map(k => renderInput('reinforce', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">Option อื่นๆ</h5>{Object.keys(localPrices.options).map(k => renderInput('options', k))}</div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'frame_t2' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> วงกบ T2 (Max 180x240)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                  {renderInput('frame_base', 'wpc_4in_t2')}
                  {['t2_std_70','t2_std_80','t2_std_90'].map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('t2_w_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('t2_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี</h4>
                  {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('t2_color_')).map(k => renderInput('frame_surface', k))}
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'frame_f10' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="font-bold text-indigo-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> วงกบ F10 (Max 180x220)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                  {renderInput('frame_base', 'wpc_4in_f10')}
                  {['f10_std_70','f10_std_80','f10_std_90'].map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('f10_w_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('f10_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี</h4>
                  {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('f10_color_')).map(k => renderInput('frame_surface', k))}
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'frame_x' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-bold text-yellow-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Adjust X (Max 90x220)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                  {renderInput('frame_base', 'wpc_adjust_x')}
                  {['x_std_70','x_std_80','x_std_90'].map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('x_w_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('x_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี/ผิว (X)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-3 rounded">
                      <h5 className="font-bold text-orange-800 text-sm mb-2">สี TOA</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('x_toa_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <h5 className="font-bold text-purple-800 text-sm mb-2">ผิว SVL</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('x_svl_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'frame_bsx' && (
            <div className="space-y-6">
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <h4 className="font-bold text-cyan-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Adjust Big Six (Max 180x240, ไม่มีซับ)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                  {renderInput('frame_base', 'wpc_adjust_bsx')}
                  {['bsx_std_70','bsx_std_80','bsx_std_90'].map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('bsx_w_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('bsx_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี/ผิว (Big Six)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-3 rounded">
                      <h5 className="font-bold text-orange-800 text-sm mb-2">สี TOA</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('bsx_toa_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <h5 className="font-bold text-purple-800 text-sm mb-2">ผิว SVL</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('bsx_svl_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'frame_eco' && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Adjust Eco (Max 180x240)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                  {renderInput('frame_base', 'wpc_adjust_eco')}
                  {['eco_std_70','eco_std_80','eco_std_90'].map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('eco_w_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>
                  {Object.keys(localPrices.frame_size).filter(k => k.startsWith('eco_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี/ผิว (Eco)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-3 rounded">
                      <h5 className="font-bold text-orange-800 text-sm mb-2">สี TOA</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('eco_toa_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <h5 className="font-bold text-purple-800 text-sm mb-2">ผิว SVL</h5>
                      {Object.keys(localPrices.frame_surface).filter(k => k.startsWith('eco_svl_h_')).map(k => renderInput('frame_surface', k))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200 shrink-0">
            <p className="text-sm font-bold text-red-700 mb-1 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4" /> พบข้อผิดพลาด — กรุณาแก้ไขก่อนบันทึก:
            </p>
            <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-white border-t flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold transition-colors">
            ยกเลิก
          </button>
          <button onClick={handleSaveWithValidation} className="px-8 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg flex items-center gap-2 transition-colors">
            <Save className="w-5 h-5" /> บันทึกราคาใหม่
          </button>
        </div>
      </div>
    </div>
  );
};
