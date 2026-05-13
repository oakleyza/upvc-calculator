import React from 'react';
import { FileText, Check, Loader2 } from 'lucide-react';
import type { DoorFormData, FrameFormData, PriceResult } from '../types';
import { LABEL_MAP } from '../constants';

const FRAME_DISPLAY: Record<string, string> = {
  'wpc_4in_t2':    'วงกบไม้สังเคราะห์ 4" เหลี่ยม (T2) — สูงสุด 240cm',
  'wpc_4in_f10':   'วงกบไม้สังเคราะห์ 4" เหลี่ยม (F10) — สูงสุด 220cm',
  'wpc_adjust_eco':'วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust Eco — สูงสุด 240cm',
  'wpc_adjust_x':  'วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust X — สูงสุด 220cm',
};

interface Props {
  activeTab: string;
  doorForm: DoorFormData;
  frameForm: FrameFormData;
  priceResult: PriceResult;
  isPricesLoading: boolean;
}

export const PriceSummary: React.FC<Props> = ({
  activeTab, doorForm, frameForm, priceResult, isPricesLoading,
}) => {
  const isDoor = activeTab === 'exclusive';

  return (
    <div className="lg:w-96 shrink-0">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-8 overflow-hidden">
        <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            สรุปรายการ ({isDoor ? 'ประตู' : 'วงกบ'})
          </h2>
        </div>

        {isPricesLoading ? (
          <div className="p-6 space-y-3">
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-slate-500">กำลังโหลดราคาจากฐานข้อมูล...</p>
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* ราคารวม */}
            <div className="text-center pb-6 border-b">
              <p className="text-slate-500 text-sm mb-1">ราคาสุทธิ</p>
              <div className="text-4xl font-bold text-blue-600">
                ฿{priceResult.total.toLocaleString()}
              </div>
            </div>

            {/* รายละเอียด */}
            <div className="space-y-3 text-sm">
              {isDoor ? (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-900 font-bold">รายการที่เลือก</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">โครงสร้าง</span>
                    <span className="font-medium">{doorForm.structure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ขนาด</span>
                    <span className="font-medium">
                      {doorForm.sizeType === 'custom'
                        ? `${doorForm.customWidth}×${doorForm.customHeight} cm`
                        : doorForm.sizeType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">สี/ผิว</span>
                    <span className="font-medium">{doorForm.surfaceType}</span>
                  </div>
                  {doorForm.grooving !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">เซาะร่อง</span>
                      <span className="font-medium text-right">{LABEL_MAP[doorForm.grooving]}</span>
                    </div>
                  )}
                  {doorForm.molding !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">คิ้ว</span>
                      <span className="font-medium text-right">{LABEL_MAP[doorForm.molding]}</span>
                    </div>
                  )}
                  {doorForm.glass !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">กระจก</span>
                      <span className="font-medium text-right">{LABEL_MAP[doorForm.glass]}</span>
                    </div>
                  )}
                  {doorForm.louver !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">เกล็ด</span>
                      <span className="font-medium text-right">{LABEL_MAP[doorForm.louver]}</span>
                    </div>
                  )}
                  {doorForm.reinforce !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">เสริมโครง</span>
                      <span className="font-medium text-right">{LABEL_MAP[doorForm.reinforce]}</span>
                    </div>
                  )}
                  {doorForm.drilling !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">เจาะ</span>
                      <span className="font-medium text-right">{LABEL_MAP[doorForm.drilling]}</span>
                    </div>
                  )}
                  {Object.keys(doorForm.options).some(k => doorForm.options[k]) && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-500 font-medium block mb-1">Option เสริม:</span>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {Object.entries(doorForm.options).filter(([, v]) => v).map(([k]) => (
                          <li key={k} className="flex items-start gap-1">
                            <Check className="w-3 h-3 text-green-500 mt-0.5" />
                            {LABEL_MAP[k] ?? k}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-900 font-bold">รายการที่เลือก</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 shrink-0">รุ่น</span>
                    <span className="font-medium text-right ml-4">
                      {FRAME_DISPLAY[frameForm.frameMaterial] ?? frameForm.frameMaterial}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ขนาด</span>
                    <span className="font-medium">
                      {frameForm.sizeType === 'custom'
                        ? `${frameForm.customWidth}×${frameForm.customHeight} cm`
                        : frameForm.sizeType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">สี</span>
                    <span className="font-medium">
                      {frameForm.surfaceType === 'none' ? 'ไม่ทำสี (งานดิบ)' : frameForm.surfaceType}
                    </span>
                  </div>
                </>
              )}

              {/* ค่าเพิ่มเติมถูกรวมในราคาสุทธิแล้ว — ไม่แสดงรายละเอียด */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
