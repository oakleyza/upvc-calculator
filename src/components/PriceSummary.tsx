import React, { useState, useEffect } from 'react';
import { FileText, Check, Loader2 } from 'lucide-react';
import type { DoorFormData, FrameFormData, WoodDoorFormData, WoodFrameFormData, PlaswoodRailFormData, GlassFormData, PriceResult, CatalogueItem } from '../types';
import { LABEL_MAP, WOOD_TYPE_NAMES, WOOD_GLASS_NAMES, WOOD_FRAME_TYPE_NAMES, PLASWOOD_RAIL_SIZES, PLASWOOD_RAIL_FINISH_NAMES } from '../constants';

// ─── Wood section with model image ──────────────────────────────────────────
const WoodSummarySection: React.FC<{ woodForm: WoodDoorFormData; catalogue: CatalogueItem[] }> = ({ woodForm, catalogue }) => {
  const [imgOk, setImgOk] = useState(true);

  // รีเซ็ต imgOk ทุกครั้งที่เปลี่ยนรุ่น เพื่อให้โหลดรูปใหม่
  useEffect(() => { setImgOk(true); }, [woodForm.modelId]);

  const modelItem = catalogue.find(c => (c.legacyKey ?? c.id) === woodForm.modelId) ?? null;
  const modelIdx  = modelItem ? catalogue.indexOf(modelItem) : -1;
  const modelName = modelItem?.name ?? woodForm.modelId;
  const imgSrc    = modelItem?.imageUrl ?? '';
  const numPrefix = modelIdx >= 0 ? `${modelIdx + 1}. ` : '';

  return (
    <>
      <div className="flex justify-between border-b pb-2">
        <span className="text-slate-900 font-bold">รายการที่เลือก</span>
      </div>

      {/* รูปประตูที่เลือก — แสดงเหนือชื่อ */}
      {imgSrc && imgOk ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <img
            key={woodForm.modelId}
            src={imgSrc}
            alt={modelName}
            className="w-full object-contain"
            style={{ maxHeight: '220px' }}
            onError={() => setImgOk(false)}
          />
        </div>
      ) : (
        <div className="w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-sm" style={{ minHeight: '80px' }}>
          ยังไม่มีรูป
        </div>
      )}

      <div className="flex justify-between">
        <span className="text-slate-500">ประเภทไม้</span>
        <span className="font-medium">{WOOD_TYPE_NAMES[woodForm.woodType] ?? woodForm.woodType}</span>
      </div>
      <div className="flex justify-between items-start">
        <span className="text-slate-500 shrink-0">รุ่น</span>
        <span className="font-medium text-right ml-2">{numPrefix}{modelName}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">ขนาด</span>
        <span className="font-medium">
          {woodForm.sizeType === 'custom'
            ? `${woodForm.customWidth}×${woodForm.customHeight} cm`
            : woodForm.sizeType}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">ทำสี</span>
        <span className={`font-medium ${woodForm.painted ? 'text-purple-700' : 'text-slate-400'}`}>
          {woodForm.painted ? 'ใช่ (มีค่าทำสี)' : 'ไม่ทำสี'}
        </span>
      </div>
      {woodForm.glassType && woodForm.glassType !== 'none' && (
        <div className="flex justify-between items-start">
          <span className="text-slate-500 shrink-0">กระจก</span>
          <span className="font-medium text-cyan-700 text-right ml-2">
            {WOOD_GLASS_NAMES[woodForm.glassType] ?? woodForm.glassType}
            {woodForm.glassWidth && woodForm.glassHeight && (
              <span className="block text-xs text-slate-400 font-normal">{woodForm.glassWidth}×{woodForm.glassHeight} cm</span>
            )}
          </span>
        </div>
      )}
    </>
  );
};

// ─── Frame display map ───────────────────────────────────────────────────────
const FRAME_DISPLAY: Record<string, string> = {
  'wpc_4in_t2':    'วงกบไม้สังเคราะห์ 4" เหลี่ยม (T2) — สูงสุด 240cm',
  'wpc_4in_f10':   'วงกบไม้สังเคราะห์ 4" เหลี่ยม (F10) — สูงสุด 220cm',
  'wpc_adjust_eco':'วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust Eco — สูงสุด 240cm',
  'wpc_adjust_x':  'วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust X — สูงสุด 220cm',
  'wpc_adjust_bsx':'วงกบไม้สังเคราะห์ รุ่น Adjust Big Six (ไม่มีซับ) — สูงสุด 240cm',
  'wpc_5in':       'วงกบไม้สังเคราะห์ 5 นิ้ว เหลี่ยม — สูงสุด 240cm',
};

interface Props {
  activeTab: string;
  doorForm: DoorFormData;
  frameForm: FrameFormData;
  woodForm: WoodDoorFormData;
  woodFrameForm: WoodFrameFormData;
  plaswoodForm: PlaswoodRailFormData;
  glassForm: GlassFormData;
  catalogue: CatalogueItem[];
  priceResult: PriceResult;
  isPricesLoading: boolean;
}

export const PriceSummary: React.FC<Props> = ({
  activeTab, doorForm, frameForm, woodForm, woodFrameForm, plaswoodForm, glassForm, catalogue, priceResult, isPricesLoading,
}) => {
  const isDoor      = activeTab === 'exclusive';
  const isWood      = activeTab === 'wood';
  const isWoodFrame = activeTab === 'wood_frame';
  const isFrame     = activeTab === 'frame';
  const isPlaswood  = activeTab === 'plaswood';
  const isGlass     = activeTab === 'glass';

  return (
    <div className="lg:w-96 shrink-0">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-8 overflow-hidden">
        <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            สรุปรายการ ({isDoor ? 'ประตู uPVC' : isWood ? 'ประตูไม้' : isWoodFrame ? 'วงกบไม้' : isPlaswood ? 'บังราง Plaswood' : isGlass ? 'กระจก' : 'วงกบ WPC'})
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
              {isDoor && (
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
                    <span className="font-medium">
                      {doorForm.surfaceType === 'TOA' ? 'พ่นสี TOA'
                        : doorForm.surfaceType === 'SVL' ? 'ปิดผิว SVL'
                        : 'ไม่ทำสี (งานดิบ)'}
                    </span>
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
              )}

              {isWood && (
                <WoodSummarySection woodForm={woodForm} catalogue={catalogue} />
              )}

              {isWoodFrame && (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-900 font-bold">รายการที่เลือก</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ชนิดวงกบ</span>
                    <span className="font-medium">{WOOD_FRAME_TYPE_NAMES[woodFrameForm.frameType] ?? woodFrameForm.frameType}</span>
                  </div>
                  {woodFrameForm.frameType !== 'sadao' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">หน้าตัดไม้</span>
                      <span className="font-medium">{woodFrameForm.section.replace('x', '"×') + '"'}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">ขนาด</span>
                    <span className="font-medium">
                      {woodFrameForm.sizeType === 'custom'
                        ? `${woodFrameForm.customWidth}×${woodFrameForm.customHeight} cm`
                        : woodFrameForm.sizeType}
                    </span>
                  </div>
                  {woodFrameForm.frameType !== 'sadao' && (woodFrameForm.threshold || woodFrameForm.slLeft || woodFrameForm.slRight || woodFrameForm.slTop) && (
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 shrink-0">เพิ่มเติม</span>
                      <span className="font-medium text-right ml-2 text-xs">
                        {[
                          woodFrameForm.threshold && 'ธรณี',
                          woodFrameForm.slLeft && 'ช่องแสงซ้าย',
                          woodFrameForm.slRight && 'ช่องแสงขวา',
                          woodFrameForm.slTop && 'ช่องแสงบน',
                        ].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">ทำสี</span>
                    <span className={`font-medium ${woodFrameForm.painted ? 'text-purple-700' : 'text-slate-400'}`}>
                      {woodFrameForm.painted ? 'ทำสี' : 'ไม่ทำสี (งานดิบ)'}
                    </span>
                  </div>
                  {priceResult.surcharges.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-slate-100 space-y-1">
                      {priceResult.surcharges.map((s, i) => (
                        <div key={i} className="text-xs text-slate-500">{s}</div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {isFrame && (
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

              {isPlaswood && (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-900 font-bold">รายการที่เลือก</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">สินค้า</span>
                    <span className="font-medium">บังราง Plaswood</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ขนาด</span>
                    <span className="font-medium">
                      {PLASWOOD_RAIL_SIZES.find(s => s.id === plaswoodForm.sizeId)?.label ?? plaswoodForm.sizeId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">การทำสี</span>
                    <span className={`font-medium ${plaswoodForm.finish !== 'raw' ? 'text-purple-700' : 'text-slate-400'}`}>
                      {PLASWOOD_RAIL_FINISH_NAMES[plaswoodForm.finish] ?? plaswoodForm.finish}
                    </span>
                  </div>
                  {priceResult.surcharges.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-slate-100 space-y-1">
                      {priceResult.surcharges.map((s, i) => (
                        <div key={i} className="text-xs text-slate-500">{s}</div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {isGlass && (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-900 font-bold">รายการที่เลือก</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ชนิดกระจก</span>
                    <span className="font-medium text-cyan-700">{WOOD_GLASS_NAMES[glassForm.glassType] ?? glassForm.glassType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ขนาดแผ่น</span>
                    <span className="font-medium">
                      {glassForm.glassWidth && glassForm.glassHeight
                        ? `${glassForm.glassWidth}×${glassForm.glassHeight} cm`
                        : '—'}
                    </span>
                  </div>
                  {priceResult.surcharges.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-slate-100 space-y-1">
                      {priceResult.surcharges.map((s, i) => (
                        <div key={i} className="text-xs text-slate-500">{s}</div>
                      ))}
                    </div>
                  )}
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
