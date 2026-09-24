// ------------------------------------------------------------------
// Price calculation pure functions
// B-2 FIX: TOA_h_under_200 / SVL_h_under_200 ถูกใช้จริงแล้ว
// ------------------------------------------------------------------

import type { DoorFormData, FrameFormData, WoodDoorFormData, WoodFrameFormData, PlaswoodRailFormData, GlassFormData, PricingStructure, PriceResult, OpeningFormData, OpeningResult } from '../types';
import { FRAME_MATERIALS, WOOD_CURVE_MODEL_IDS, WOOD_MODEL_NAMES, WOOD_TYPE_MULTIPLIER, WOOD_FRAME_SECTIONS, WOOD_FRAME_FACTOR, WOOD_GLASS_TYPES, WOOD_GLASS_NAMES, SQFT_PER_SQM, GLASS_LON_YAI_MAX_CM, PLASWOOD_RAIL_SIZES, PLASWOOD_RAIL_FINISH_NAMES, PLASWOOD_RAIL_MARGIN_PCT, OPENING_CALC, WOOD_STOCK_STEPS, WOOD_FRAME_INNER_OUTER_GAP } from '../constants';

// ------------------------------------------------------------------
// stockLength — ความยาวไม้ที่ต้องซื้อจริง (cm) จากท่อนที่ยาว outerCm
//   ไม้หั่นเป็นสเตป [100,210,250,300] · ปัดขึ้นสเตปเล็กสุดที่ ≥ ท่อน
//   เกิน 300 → ต่อไม้ (300 + สเตปของส่วนที่เหลือ)
// ------------------------------------------------------------------
const stockLength = (outerCm: number): number => {
  if (outerCm <= 0) return 0;
  const maxStep = WOOD_STOCK_STEPS[WOOD_STOCK_STEPS.length - 1];
  if (outerCm > maxStep) return maxStep + stockLength(outerCm - maxStep);
  return WOOD_STOCK_STEPS.find(s => s >= outerCm) ?? maxStep;
};

// ------------------------------------------------------------------
// calculateOpening — แปลงระหว่างขนาดประตู ↔ ช่องปูน (ไม่มีราคา)
//   โหมด fromDoor:    ประตู → ช่องปูน (ใช้ได้ทั้งไม้/uPVC — สูตรเดียวกัน)
//   โหมด fromOpening: ช่องปูน → ประตู
//     • ไม้  → ไสได้ ตรงตามสูตร
//     • uPVC → ปัดประตูลงเป็นทวีคูณของ 5 (การันตีวงกบยัดเข้าได้) แล้วบอกระยะเก็บปูนเพิ่ม
// ------------------------------------------------------------------
const floorToStep = (n: number, step: number) => Math.floor(n / step) * step;

export function calculateOpening(form: OpeningFormData): OpeningResult {
  const C = OPENING_CALC;
  const w = Number(form.width);
  const h = Number(form.height);
  if (!form.width || !form.height || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { ok: false, error: 'กรุณากรอกขนาดกว้าง–สูง' };
  }

  // ประตู → ช่องปูน
  if (form.mode === 'fromDoor') {
    return {
      ok: true,
      doorW: w, doorH: h,
      openingW: w + C.WIDTH_OFFSET,
      openingH: h + C.HEIGHT_OFFSET,
      frameW: w + C.FRAME_WIDTH_OFFSET,
      frameH: h + C.FRAME_HEIGHT_OFFSET,
    };
  }

  // ช่องปูน → ประตู
  // ไม้ — ไสได้ ไม่ต้องปัดเลข
  if (form.material === 'wood') {
    const rawDoorW = w - C.WIDTH_OFFSET;
    const rawDoorH = h - C.HEIGHT_OFFSET;
    if (rawDoorW < C.MIN_DOOR_W || rawDoorH < C.MIN_DOOR_H) {
      return { ok: false, error: `ช่องปูนเล็กเกินไป (ประตูจะได้ต่ำกว่า ${C.MIN_DOOR_W}×${C.MIN_DOOR_H} cm)` };
    }
    return {
      ok: true,
      openingW: w, openingH: h,
      doorW: rawDoorW, doorH: rawDoorH,
      frameW: rawDoorW + C.FRAME_WIDTH_OFFSET,
      frameH: rawDoorH + C.FRAME_HEIGHT_OFFSET,
    };
  }

  // uPVC/WPC — เลือกประตู (ทวีคูณ 5) ตัวใหญ่สุดที่ใส่ได้ "โดยไม่ต้องไสบาน"
  //   กว้าง: วงกบ (door+6) ≤ ช่อง        → door = floor5(ช่อง − 6)   [+6 พอดี = กระแทก]
  //   สูง:   วงกบวางพื้น (door+3) + ลอย 1 ≤ ช่อง → door = floor5(ช่อง − 4)
  const doorW = floorToStep(w - C.FRAME_WIDTH_OFFSET, C.STEP);
  const doorH = floorToStep(h - C.HEIGHT_OFFSET, C.STEP);
  if (doorW < C.MIN_DOOR_W || doorH < C.MIN_DOOR_H) {
    return { ok: false, error: `ช่องปูนเล็กเกินไป (ประตูจะได้ต่ำกว่า ${C.MIN_DOOR_W}×${C.MIN_DOOR_H} cm)` };
  }

  const frameW = doorW + C.FRAME_WIDTH_OFFSET;   // วงกบวัดนอก
  const frameH = doorH + C.FRAME_HEIGHT_OFFSET;
  const fillSide = (w - frameW) / 2;             // เก็บปูนต่อข้าง
  const fillTop  = h - (doorH + C.HEIGHT_OFFSET); // = ช่องสูง − หัววงกบ − ลอยพื้น

  const nf = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const notes: string[] = [];
  if (fillSide < 0.001)
    notes.push('↔ วงกบด้านกว้างพอดีช่องเป๊ะ (ไม่มีร่องเผื่อ) อาจต้องกระแทกเข้าเล็กน้อย');
  if (fillTop < 0.001)
    notes.push(`↕ ความสูงพอดีช่องเป๊ะ วงกบชนคานบน (ลอยพื้น ${nf(C.FLOOR_LIFT)} cm)`);

  // ทางเลือกสุดท้าย: ขยับขึ้นอีก 1 ไซส์ได้ ถ้ายอมไสบานพอดี ≤1cm (เลี่ยงได้ไม่แนะนำ)
  //   กว้าง: (door+5)+6−1 ≤ ช่อง  → ช่องลงท้าย 0/5
  //   สูง:   (door+5)+3+1−1 ≤ ช่อง → ช่องลงท้าย 3/8
  const canUpW = (doorW + C.STEP) + C.FRAME_WIDTH_OFFSET  - C.MAX_SHAVE <= w;
  const canUpH = (doorH + C.STEP) + C.FRAME_HEIGHT_OFFSET + C.FLOOR_LIFT - C.MAX_SHAVE <= h;
  let shaveHint: string | undefined;
  if (canUpW || canUpH) {
    const aw = canUpW ? doorW + C.STEP : doorW;
    const ah = canUpH ? doorH + C.STEP : doorH;
    const how = [
      canUpW && 'ไสด้านกว้างข้างละ 0.5 cm',
      canUpH && 'ไสด้านสูง 1 cm',
    ].filter(Boolean).join(' + ');
    shaveHint = `ถ้าต้องการประตูใหญ่ขึ้นเป็น ${aw}×${ah} cm ก็ได้ แต่ต้อง${how} (ทางเลือกสุดท้าย เลี่ยงได้ไม่แนะนำ)`;
  }

  return {
    ok: true,
    openingW: w, openingH: h,
    doorW, doorH,
    frameW, frameH,
    fillSide, fillTop,
    floorLift: C.FLOOR_LIFT,
    notes,
    shaveHint,
  };
}

// ------------------------------------------------------------------
// computeGlassCost — core logic ราคากระจก (หลักการเดิม ใช้ร่วมกัน)
//   ต้นทุน/ตร.ฟุต × พื้นที่(ตร.ฟุต) × (1+กำไร%) → ปัดขึ้นหลักร้อย
//   ลอนใหญ่: เรทขึ้นกับด้านยาวสุดของแผ่น (≤244cm = ถูก)
//   panes: ขนาดแผ่น (cm) หลายแผ่นได้ (วงกบมีหลายช่องแสง)
//   เรทกระจก (glass_rate) ใช้ชุดเดียวกันทั้งประตูไม้/วงกบไม้ (หลังบ้าน tab "กระจก")
// ------------------------------------------------------------------
const computeGlassCost = (
  panes: { w: number; h: number }[],
  glassType: string,
  prices: PricingStructure,
): number => {
  if (!glassType || glassType === 'none') return 0;
  const type = WOOD_GLASS_TYPES.find(g => g.id === glassType);
  if (!type) return 0;
  const marginPct = prices.glass_rate?.['margin_pct'] ?? 0;

  let cost = 0;
  for (const p of panes) {
    if (p.w <= 0 || p.h <= 0) continue;
    const sqft = (p.w / 100) * (p.h / 100) * SQFT_PER_SQM;
    let rate = 0;
    if ('lengthTiered' in type && type.lengthTiered) {
      const longest = Math.max(p.w, p.h);
      rate = prices.glass_rate?.[longest > GLASS_LON_YAI_MAX_CM ? 'lon_yai_gt244' : 'lon_yai_le244'] ?? 0;
    } else {
      rate = prices.glass_rate?.[('rateKey' in type ? type.rateKey : '')] ?? 0;
    }
    cost += sqft * rate;
  }
  if (cost <= 0) return 0;
  return Math.ceil((cost * (1 + marginPct / 100)) / 100) * 100;   // ปัดขึ้นหลักร้อย
};

// ราคากระจก — ประตูไม้ (ใช้หลักการคำนวนเดิม / ชุดเรทเดียวกับหลังบ้าน)
export const calculateWoodDoorGlassCost = (
  panes: { w: number; h: number }[],
  glassType: string,
  prices: PricingStructure,
): number => computeGlassCost(panes, glassType, prices);

// ราคากระจก — วงกบไม้ (ใช้หลักการคำนวนเดิม / ชุดเรทเดียวกับหลังบ้าน)
export const calculateWoodFrameGlassCost = (
  panes: { w: number; h: number }[],
  glassType: string,
  prices: PricingStructure,
): number => computeGlassCost(panes, glassType, prices);

// ------------------------------------------------------------------
// calculateGlassPrice — แท็บ "กระจก" (คำนวณราคาขายกระจกแบบเดี่ยว)
//   ใช้หลักการคำนวนเดิม (computeGlassCost) + เรท glass_rate ชุดเดียวกับหลังบ้าน
//   กรอกกว้าง×สูง(cm) → ราคาขายต่อแผ่น (ปัดขึ้นหลักร้อย)
// ------------------------------------------------------------------
export const calculateGlassPrice = (form: GlassFormData, prices: PricingStructure): PriceResult => {
  const surcharges: string[] = [];
  const w = Number(form.glassWidth)  || 0;
  const h = Number(form.glassHeight) || 0;

  if (!form.glassType || form.glassType === 'none') {
    return { total: 0, surcharges: ['กรุณาเลือกชนิดกระจก'] };
  }
  if (w <= 0 || h <= 0) {
    return { total: 0, surcharges: ['กรุณากรอกขนาดกว้าง × สูง (cm)'] };
  }

  const total = computeGlassCost([{ w, h }], form.glassType, prices);

  const glassName = WOOD_GLASS_NAMES[form.glassType] ?? form.glassType;
  surcharges.push(`${glassName} · ${w}×${h} cm`);

  return { total, surcharges };
};

// ------------------------------------------------------------------
// Door price calculation
// ------------------------------------------------------------------
export const calculateDoorPrice = (form: DoorFormData, prices: PricingStructure): PriceResult => {
  let price = 0;
  const surcharges: string[] = [];

  // ราคาโครงสร้างหลัก
  price += prices.door_base?.[form.structure] ?? prices.structure?.[form.structure] ?? 0;

  let height = 200;

  if (form.sizeType === 'custom') {
    price += prices.door_size?.['custom'] ?? 0;
    const width  = parseInt(form.customWidth)  || 0;
    const h      = parseInt(form.customHeight) || 0;
    height = h;

    const getSizeP = (k: string) => prices.door_size?.[k] ?? prices.size?.[k] ?? 0;

    // Surcharge ความกว้าง
    if (width >= 81 && width <= 89)     { const p = getSizeP('custom_w_81_89');   price += p; if (p) surcharges.push(`กว้าง 81-89cm (+฿${p.toLocaleString()})`); }
    else if (width === 90)              { const p = getSizeP('custom_w_90');       price += p; if (p) surcharges.push(`กว้าง 90cm (+฿${p.toLocaleString()})`); }
    else if (width >= 91 && width <= 100) { const p = getSizeP('custom_w_91_100');  price += p; if (p) surcharges.push(`กว้าง 91-100cm (+฿${p.toLocaleString()})`); }
    else if (width >= 101 && width <= 120){ const p = getSizeP('custom_w_101_110'); price += p; if (p) surcharges.push(`กว้าง 101-120cm (+฿${p.toLocaleString()})`); }

    // Surcharge ความสูง
    if (h < 200)                        { const p = getSizeP('custom_h_under_200'); price += p; if (p) surcharges.push(`ลดความสูง < 200cm (+฿${p.toLocaleString()})`); }
    else if (h >= 201 && h <= 210)      { const p = getSizeP('custom_h_201_210');   price += p; if (p) surcharges.push(`สูง 201-210cm (+฿${p.toLocaleString()})`); }
    else if (h >= 211 && h <= 220)      { const p = getSizeP('custom_h_211_220');   price += p; if (p) surcharges.push(`สูง 211-220cm (+฿${p.toLocaleString()})`); }
    else if (h >= 221 && h <= 240)      { const p = getSizeP('custom_h_221_240');   price += p; if (p) surcharges.push(`สูง 221-240cm (+฿${p.toLocaleString()})`); }
  } else {
    price += prices.door_size?.[form.sizeType] ?? prices.size?.[form.sizeType] ?? 0;
    height = 200;
  }

  // B-2 FIX: ราคาสี — ใช้ _h_under_200 จริงเมื่อ h < 200 (ไม่ fallback ไป _h200 อีกต่อไป)
  let surfaceSuffix: string;
  if (height < 200)        surfaceSuffix = '_h_under_200';
  else if (height >= 221)  surfaceSuffix = '_h240';
  else if (height >= 201)  surfaceSuffix = '_h220';
  else                     surfaceSuffix = '_h200';  // h === 200

  const surfaceKey   = form.surfaceType + surfaceSuffix;
  const surfacePrice = prices.door_surface?.[surfaceKey] ?? prices.surface?.[surfaceKey] ?? 0;
  price += surfacePrice;

  // บานทึบเรียบ (ไม่ติดคิ้ว) → บวก extra ทั้ง TOA และ ไม่ทำสี (ค่าดำเนินการบานเรียบ)
  if ((form.surfaceType === 'TOA' || form.surfaceType === 'none') && form.molding === 'none') {
    const extraP = prices.door_surface?.['TOA_plain_extra'] ?? 0;
    price += extraP;
    if (extraP) surcharges.push(`บานทึบเรียบ (+฿${extraP.toLocaleString()})`);
  }

  price += prices.grooving?.[form.grooving]   ?? 0;
  price += prices.molding?.[form.molding]     ?? 0;
  price += prices.glass?.[form.glass]         ?? 0;
  price += prices.louver?.[form.louver]       ?? 0;
  price += prices.reinforce?.[form.reinforce] ?? 0;
  price += prices.drilling?.[form.drilling]   ?? 0;

  Object.entries(form.options).forEach(([key, active]) => {
    if (active) price += prices.options?.[key] ?? 0;
  });

  return { total: price, surcharges };
};

// ------------------------------------------------------------------
// Frame price calculation
// ------------------------------------------------------------------
export const calculateFramePrice = (form: FrameFormData, prices: PricingStructure): PriceResult => {
  let price = 0;
  const surcharges: string[] = [];

  price += prices.frame_base?.[form.frameMaterial] ?? 0;

  let height = 200, width = 0;

  if (form.sizeType === 'custom') {
    price += prices.frame_size?.['custom'] ?? 0;
    width  = parseInt(form.customWidth)  || 0;
    height = parseInt(form.customHeight) || 0;
  } else {
    const [wStr, hStr] = form.sizeType.split('x');
    width  = parseInt(wStr);
    height = parseInt(hStr);
  }

  const getSize = (k: string) => prices.frame_size?.[k]    ?? 0;
  const getSurf = (k: string) => prices.frame_surface?.[k] ?? 0;

  // ─── T2 ────────────────────────────────────────────────────────
  if (form.frameMaterial === FRAME_MATERIALS.T2) {
    if      (form.sizeType === '70x200cm') price += getSize('t2_std_70');
    else if (form.sizeType === '80x200cm') price += getSize('t2_std_80');
    else if (form.sizeType === '90x200cm') price += getSize('t2_std_90');
    else if (form.sizeType === 'custom') {
      if      (width >= 71 && width <= 80)   { const p = getSize('t2_w_71_80');   price += p; if (p) surcharges.push(`T2: กว้าง 71-80cm (+฿${p.toLocaleString()})`); }
      else if (width >= 81 && width <= 89)   { const p = getSize('t2_w_81_89');   price += p; if (p) surcharges.push(`T2: กว้าง 81-89cm (+฿${p.toLocaleString()})`); }
      else if (width === 90)                 { const p = getSize('t2_w_90');      price += p; if (p) surcharges.push(`T2: กว้าง 90cm (+฿${p.toLocaleString()})`); }
      else if (width >= 91 && width <= 140)  { const p = getSize('t2_w_91_140');  price += p; if (p) surcharges.push(`T2: กว้าง 91-140cm (+฿${p.toLocaleString()})`); }
      else if (width >= 141 && width <= 180) { const p = getSize('t2_w_141_180'); price += p; if (p) surcharges.push(`T2: กว้าง 141-180cm (+฿${p.toLocaleString()})`); }

      if      (height < 200)                 { const p = getSize('t2_h_under_200'); price += p; if (p) surcharges.push(`T2: ค่าลดไซส์ < 200cm (+฿${p.toLocaleString()})`); }
      else if (height >= 201 && height <= 220){ const p = getSize('t2_h_201_220');  price += p; if (p) surcharges.push(`T2: สูง 201-220cm (+฿${p.toLocaleString()})`); }
      else if (height >= 221 && height <= 240){ const p = getSize('t2_h_221_240');  price += p; if (p) surcharges.push(`T2: สูง 221-240cm (+฿${p.toLocaleString()})`); }
    }
    if (form.surfaceType !== 'none') {
      if      (height <= 200) price += getSurf('t2_color_h200');
      else if (height <= 220) price += getSurf('t2_color_h220');
      else                    price += getSurf('t2_color_h240');
    }
  }

  // ─── F10 ───────────────────────────────────────────────────────
  else if (form.frameMaterial === FRAME_MATERIALS.F10) {
    if      (form.sizeType === '70x200cm') price += getSize('f10_std_70');
    else if (form.sizeType === '80x200cm') price += getSize('f10_std_80');
    else if (form.sizeType === '90x200cm') price += getSize('f10_std_90');
    else if (form.sizeType === 'custom') {
      if      (width >= 71 && width <= 80)   { const p = getSize('f10_w_71_80');   price += p; if (p) surcharges.push(`F10: กว้าง 71-80cm (+฿${p.toLocaleString()})`); }
      else if (width >= 81 && width <= 90)   { const p = getSize('f10_w_81_90');   price += p; if (p) surcharges.push(`F10: กว้าง 81-90cm (+฿${p.toLocaleString()})`); }
      else if (width >= 91 && width <= 140)  { const p = getSize('f10_w_91_140');  price += p; if (p) surcharges.push(`F10: กว้าง 91-140cm (+฿${p.toLocaleString()})`); }
      else if (width >= 141 && width <= 180) { const p = getSize('f10_w_141_180'); price += p; if (p) surcharges.push(`F10: กว้าง 141-180cm (+฿${p.toLocaleString()})`); }

      if      (height < 200)                 { const p = getSize('f10_h_under_200'); price += p; if (p) surcharges.push(`F10: ค่าลดไซส์ < 200cm (+฿${p.toLocaleString()})`); }
      else if (height >= 201 && height <= 220){ const p = getSize('f10_h_201_220');  price += p; if (p) surcharges.push(`F10: สูง 201-220cm (+฿${p.toLocaleString()})`); }
    }
    if (form.surfaceType !== 'none') {
      if (height <= 200) price += getSurf('f10_color_h200');
      else               price += getSurf('f10_color_h220');
    }
  }

  // ─── Adjust X ──────────────────────────────────────────────────
  else if (form.frameMaterial === FRAME_MATERIALS.ADJUST_X) {
    if      (form.sizeType === '70x200cm') price += getSize('x_std_70');
    else if (form.sizeType === '80x200cm') price += getSize('x_std_80');
    else if (form.sizeType === '90x200cm') price += getSize('x_std_90');
    else if (form.sizeType === 'custom') {
      // Adjust X: กว้างสูงสุด 90cm — ไม่มี bracket เกิน 90
      if      (height < 200)                 { const p = getSize('x_h_under_200'); price += p; if (p) surcharges.push(`X: ค่าลดไซส์ < 200cm (+฿${p.toLocaleString()})`); }
      else if (height >= 201 && height <= 210){ const p = getSize('x_h_201_210');  price += p; if (p) surcharges.push(`X: สูง 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height >= 211 && height <= 220){ const p = getSize('x_h_211_220');  price += p; if (p) surcharges.push(`X: สูง 211-220cm (+฿${p.toLocaleString()})`); }
      else if (height >= 221 && height <= 240){ const p = getSize('x_h_221_240');  price += p; if (p) surcharges.push(`X: สูง 221-240cm (+฿${p.toLocaleString()})`); }

      if (width >= 81 && width <= 90) { const p = getSize('x_w_81_90'); price += p; if (p) surcharges.push(`X: กว้าง 81-90cm (+฿${p.toLocaleString()})`); }
    }
    if (form.surfaceType === 'TOA') {
      if      (height <= 200) { const p = getSurf('x_toa_h_200');     price += p; if (p) surcharges.push(`X: TOA ≤200cm (+฿${p.toLocaleString()})`); }
      else if (height <= 210) { const p = getSurf('x_toa_h_201_210'); price += p; if (p) surcharges.push(`X: TOA 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('x_toa_h_211_220'); price += p; if (p) surcharges.push(`X: TOA 211-220cm (+฿${p.toLocaleString()})`); }
      else                    { const p = getSurf('x_toa_h_221_240'); price += p; if (p) surcharges.push(`X: TOA 221-240cm (+฿${p.toLocaleString()})`); }
    } else if (form.surfaceType === 'SVL') {
      if      (height <= 200) { const p = getSurf('x_svl_h_200');     price += p; if (p) surcharges.push(`X: SVL ≤200cm (+฿${p.toLocaleString()})`); }
      else if (height <= 210) { const p = getSurf('x_svl_h_201_210'); price += p; if (p) surcharges.push(`X: SVL 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('x_svl_h_211_220'); price += p; if (p) surcharges.push(`X: SVL 211-220cm (+฿${p.toLocaleString()})`); }
      else                    { const p = getSurf('x_svl_h_221_240'); price += p; if (p) surcharges.push(`X: SVL 221-240cm (+฿${p.toLocaleString()})`); }
    }
  }

  // ─── Adjust Big Six ────────────────────────────────────────────
  else if (form.frameMaterial === FRAME_MATERIALS.ADJUST_BIG_SIX) {
    if      (form.sizeType === '70x200cm') price += getSize('bsx_std_70');
    else if (form.sizeType === '80x200cm') price += getSize('bsx_std_80');
    else if (form.sizeType === '90x200cm') price += getSize('bsx_std_90');
    else if (form.sizeType === 'custom') {
      if      (width >= 81 && width <= 90)   { const p = getSize('bsx_w_81_90');   price += p; if (p) surcharges.push(`Big Six: กว้าง 81-90cm (+฿${p.toLocaleString()})`); }
      else if (width >= 91 && width <= 140)  { const p = getSize('bsx_w_91_140');  price += p; if (p) surcharges.push(`Big Six: กว้าง 91-140cm (+฿${p.toLocaleString()})`); }
      else if (width >= 141 && width <= 180) { const p = getSize('bsx_w_141_180'); price += p; if (p) surcharges.push(`Big Six: กว้าง 141-180cm (+฿${p.toLocaleString()})`); }

      if      (height < 200)                  { const p = getSize('bsx_h_under_200'); price += p; if (p) surcharges.push(`Big Six: ค่าลดไซส์ < 200cm (+฿${p.toLocaleString()})`); }
      else if (height >= 201 && height <= 210) { const p = getSize('bsx_h_201_210');  price += p; if (p) surcharges.push(`Big Six: สูง 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height >= 211 && height <= 220) { const p = getSize('bsx_h_211_220');  price += p; if (p) surcharges.push(`Big Six: สูง 211-220cm (+฿${p.toLocaleString()})`); }
      else if (height >= 221 && height <= 240) { const p = getSize('bsx_h_221_240');  price += p; if (p) surcharges.push(`Big Six: สูง 221-240cm (+฿${p.toLocaleString()})`); }
    }
    if (form.surfaceType === 'TOA') {
      if      (height <= 200) { const p = getSurf('bsx_toa_h_200');     price += p; if (p) surcharges.push(`Big Six: TOA ≤200cm (+฿${p.toLocaleString()})`); }
      else if (height <= 210) { const p = getSurf('bsx_toa_h_201_210'); price += p; if (p) surcharges.push(`Big Six: TOA 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('bsx_toa_h_211_220'); price += p; if (p) surcharges.push(`Big Six: TOA 211-220cm (+฿${p.toLocaleString()})`); }
      else                    { const p = getSurf('bsx_toa_h_221_240'); price += p; if (p) surcharges.push(`Big Six: TOA 221-240cm (+฿${p.toLocaleString()})`); }
    } else if (form.surfaceType === 'SVL') {
      if      (height <= 200) { const p = getSurf('bsx_svl_h_200');     price += p; if (p) surcharges.push(`Big Six: SVL ≤200cm (+฿${p.toLocaleString()})`); }
      else if (height <= 210) { const p = getSurf('bsx_svl_h_201_210'); price += p; if (p) surcharges.push(`Big Six: SVL 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('bsx_svl_h_211_220'); price += p; if (p) surcharges.push(`Big Six: SVL 211-220cm (+฿${p.toLocaleString()})`); }
      else                    { const p = getSurf('bsx_svl_h_221_240'); price += p; if (p) surcharges.push(`Big Six: SVL 221-240cm (+฿${p.toLocaleString()})`); }
    }
  }

  // ─── วงกบไม้สังเคราะห์ 5 นิ้ว เหลี่ยม (เหมือน Big Six แต่ไม่มี SVL) ──
  else if (form.frameMaterial === FRAME_MATERIALS.WPC_5IN) {
    if      (form.sizeType === '70x200cm') price += getSize('w5_std_70');
    else if (form.sizeType === '80x200cm') price += getSize('w5_std_80');
    else if (form.sizeType === '90x200cm') price += getSize('w5_std_90');
    else if (form.sizeType === 'custom') {
      if      (width >= 81 && width <= 90)   { const p = getSize('w5_w_81_90');   price += p; if (p) surcharges.push(`5 นิ้ว: กว้าง 81-90cm (+฿${p.toLocaleString()})`); }
      else if (width >= 91 && width <= 140)  { const p = getSize('w5_w_91_140');  price += p; if (p) surcharges.push(`5 นิ้ว: กว้าง 91-140cm (+฿${p.toLocaleString()})`); }
      else if (width >= 141 && width <= 180) { const p = getSize('w5_w_141_180'); price += p; if (p) surcharges.push(`5 นิ้ว: กว้าง 141-180cm (+฿${p.toLocaleString()})`); }

      if      (height < 200)                  { const p = getSize('w5_h_under_200'); price += p; if (p) surcharges.push(`5 นิ้ว: ค่าลดไซส์ < 200cm (+฿${p.toLocaleString()})`); }
      else if (height >= 201 && height <= 210) { const p = getSize('w5_h_201_210');  price += p; if (p) surcharges.push(`5 นิ้ว: สูง 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height >= 211 && height <= 220) { const p = getSize('w5_h_211_220');  price += p; if (p) surcharges.push(`5 นิ้ว: สูง 211-220cm (+฿${p.toLocaleString()})`); }
      else if (height >= 221 && height <= 240) { const p = getSize('w5_h_221_240');  price += p; if (p) surcharges.push(`5 นิ้ว: สูง 221-240cm (+฿${p.toLocaleString()})`); }
    }
    if (form.surfaceType === 'TOA') {
      if      (height <= 200) { const p = getSurf('w5_toa_h_200');     price += p; if (p) surcharges.push(`5 นิ้ว: TOA ≤200cm (+฿${p.toLocaleString()})`); }
      else if (height <= 210) { const p = getSurf('w5_toa_h_201_210'); price += p; if (p) surcharges.push(`5 นิ้ว: TOA 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('w5_toa_h_211_220'); price += p; if (p) surcharges.push(`5 นิ้ว: TOA 211-220cm (+฿${p.toLocaleString()})`); }
      else                    { const p = getSurf('w5_toa_h_221_240'); price += p; if (p) surcharges.push(`5 นิ้ว: TOA 221-240cm (+฿${p.toLocaleString()})`); }
    }
  }

  // ─── Adjust Eco ────────────────────────────────────────────────
  else if (form.frameMaterial === FRAME_MATERIALS.ADJUST_ECO) {
    if      (form.sizeType === '70x200cm') price += getSize('eco_std_70');
    else if (form.sizeType === '80x200cm') price += getSize('eco_std_80');
    else if (form.sizeType === '90x200cm') price += getSize('eco_std_90');
    else if (form.sizeType === 'custom') {
      if      (height < 200)                 { const p = getSize('eco_h_under_200'); price += p; if (p) surcharges.push(`Eco: ค่าลดไซส์ < 200cm (+฿${p.toLocaleString()})`); }
      else if (height >= 201 && height <= 210){ const p = getSize('eco_h_201_210');  price += p; if (p) surcharges.push(`Eco: สูง 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height >= 211 && height <= 220){ const p = getSize('eco_h_211_220');  price += p; if (p) surcharges.push(`Eco: สูง 211-220cm (+฿${p.toLocaleString()})`); }
      else if (height >= 221 && height <= 240){ const p = getSize('eco_h_221_240');  price += p; if (p) surcharges.push(`Eco: สูง 221-240cm (+฿${p.toLocaleString()})`); }

      if      (width >= 81 && width <= 90)   { const p = getSize('eco_w_81_90');   price += p; if (p) surcharges.push(`Eco: กว้าง 81-90cm (+฿${p.toLocaleString()})`); }
      else if (width >= 91 && width <= 140)  { const p = getSize('eco_w_91_140');  price += p; if (p) surcharges.push(`Eco: กว้าง 91-140cm (+฿${p.toLocaleString()})`); }
      else if (width >= 141 && width <= 180) { const p = getSize('eco_w_141_180'); price += p; if (p) surcharges.push(`Eco: กว้าง 141-180cm (+฿${p.toLocaleString()})`); }
    }
    if (form.surfaceType === 'TOA') {
      if      (height < 200)  { /* ไม่บวกค่าสี */ }
      else if (height <= 210) { const p = getSurf('eco_toa_h_200_210'); price += p; if (p) surcharges.push(`Eco: TOA 200-210cm (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('eco_toa_h_211_220'); price += p; if (p) surcharges.push(`Eco: TOA 211-220cm (+฿${p.toLocaleString()})`); }
      else                    { const p = getSurf('eco_toa_h_221_240'); price += p; if (p) surcharges.push(`Eco: TOA 221-240cm (+฿${p.toLocaleString()})`); }
    } else if (form.surfaceType === 'SVL') {
      if      (height < 200)  { const p = getSurf('eco_svl_h_under_200'); price += p; if (p) surcharges.push(`Eco: SVL < 200cm (+฿${p.toLocaleString()})`); }
      else if (height <= 210) { const p = getSurf('eco_svl_h_200_210');   price += p; if (p) surcharges.push(`Eco: SVL 200-210cm (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('eco_svl_h_211_220');   price += p; if (p) surcharges.push(`Eco: SVL 211-220cm (+฿${p.toLocaleString()})`); }
      else                    { const p = getSurf('eco_svl_h_221_240');   price += p; if (p) surcharges.push(`Eco: SVL 221-240cm (+฿${p.toLocaleString()})`); }
    }
    // เซาะร่องใส่ซีลยาง — เรทเดียวทุกขนาด (เฉพาะ Adjust Eco)
    if (form.rubberSeal) {
      const p = getSize('eco_rubber_seal');
      price += p;
      if (p) surcharges.push(`Eco: เซาะร่องใส่ซีลยาง (+฿${p.toLocaleString()})`);
    }
  }

  return { total: price, surcharges };
};

// ------------------------------------------------------------------
// calculateWoodDoorPrice — ระบบ bracket ตามช่วงขนาด (กว้าง + สูง)
// รองรับ: ประตูทั่วไป / ประตูโค้ง (surcharge แยก) / ประตูกระจก (ราคากระจกแยก)
//
// Auto-pricing ตะแบก/สัก: ราคากรอกในระบบมีแค่ของ "ไม้สะเดา" เท่านั้น
// ค่าไม้ (base + ส่วนต่างกว้าง/สูง/โค้ง) ของตะแบก/สัก = ค่าไม้สะเดา × WOOD_TYPE_MULTIPLIER
// ค่าทำสี ไม่ถูกปรับ — ใช้เรทไม้สะเดาเสมอไม่ว่าจะเลือกไม้ชนิดใด
// ------------------------------------------------------------------
export const calculateWoodDoorPrice = (form: WoodDoorFormData, prices: PricingStructure): PriceResult => {
  const surcharges: string[] = [];
  const getP      = (k: string) => prices.wood_door_price?.[k] ?? 0;
  const getPaint  = (k: string) => prices.wood_door_paint?.[k]  ?? 0;

  const isCurve = WOOD_CURVE_MODEL_IDS.has(form.modelId);
  const modelName = WOOD_MODEL_NAMES[form.modelId] ?? '';
  const hasGlass = modelName.includes('กระจก');
  const woodMultiplier = WOOD_TYPE_MULTIPLIER[form.woodType] ?? 1;

  // ค่าไม้ตั้งต้น — อ่านจากเรทไม้สะเดาเสมอ แล้วปรับตามชนิดไม้ที่เลือก
  const baseWoodKey = `wd_base_sadao_${form.modelId}_wood`;
  let price = getP(baseWoodKey) * woodMultiplier;

  // ค่าทำสีตั้งต้น — อ่านจากเรทไม้สะเดาเสมอ ไม่ปรับตามชนิดไม้
  if (form.painted) {
    const basePaintKey = `wd_base_sadao_${form.modelId}_paint`;
    const basePaint = getPaint(basePaintKey);
    price += basePaint;
    if (basePaint) surcharges.push(`ค่าทำสีพื้นฐาน (+฿${basePaint.toLocaleString()})`);
  }

  // แปลง sizeType → ขนาดจริง (cm)
  const presetDim: Record<string, [number, number]> = {
    '70x200cm': [70, 200],
    '80x200cm': [80, 200],
    '90x200cm': [90, 200],
  };
  const [width, height] = form.sizeType === 'custom'
    ? [Number(form.customWidth) || 0, Number(form.customHeight) || 0]
    : (presetDim[form.sizeType] ?? [0, 0]);

  if (width > 0 && height > 0) {
    // prefix สำหรับ surcharge — โค้งใช้ wd_curve_w_* / wd_curve_h_*
    const wPrefix = isCurve ? 'wd_curve_w_' : 'wd_w_';
    const hPrefix = isCurve ? 'wd_curve_h_' : 'wd_h_';
    const wLabel  = isCurve ? 'โค้ง ' : '';

    // ---- ส่วนต่างความกว้าง ----
    const widthSuffix: string | null =
      width <= 70  ? null
      : width <= 80  ? '71_80'
      : width <= 90  ? '81_90'
      : width <= 100 ? '91_100'
      : width <= 110 ? '101_110'
      : width <= 120 ? '111_120'
      :                '121_plus';

    if (widthSuffix) {
      const widthKey = wPrefix + widthSuffix;
      const wp = getP(widthKey) * woodMultiplier;
      price += wp;
      if (wp) surcharges.push(`${wLabel}งานไม้ ส่วนต่างกว้าง (+฿${wp.toLocaleString()})`);
      if (form.painted) {
        const wpp = getPaint(widthKey);
        price += wpp;
        if (wpp) surcharges.push(`${wLabel}งานสี ส่วนต่างกว้าง (+฿${wpp.toLocaleString()})`);
      }
    }

    // ---- ส่วนต่างความสูง ----
    const heightSuffix: string | null =
      height <= 200 ? null
      : height <= 210 ? '201_210'
      : height <= 220 ? '211_220'
      : height <= 230 ? '221_230'
      : height <= 240 ? '231_240'
      : height <= 250 ? '241_250'
      : height <= 260 ? '251_260'
      : height <= 270 ? '261_270'
      : height <= 280 ? '271_280'
      : height <= 290 ? '281_290'
      :                 '291_plus';

    if (heightSuffix) {
      const heightKey = hPrefix + heightSuffix;
      const hp = getP(heightKey) * woodMultiplier;
      price += hp;
      if (hp) surcharges.push(`${wLabel}งานไม้ ส่วนต่างสูง (+฿${hp.toLocaleString()})`);
      if (form.painted) {
        const hpp = getPaint(heightKey);
        price += hpp;
        if (hpp) surcharges.push(`${wLabel}งานสี ส่วนต่างสูง (+฿${hpp.toLocaleString()})`);
      }
    }

    // ---- ราคากระจก (เฉพาะรุ่นกระจก + เลือกชนิด + กรอกขนาดแผ่น) ----
    if (hasGlass && form.glassType && form.glassType !== 'none') {
      const gw = Number(form.glassWidth)  || 0;
      const gh = Number(form.glassHeight) || 0;
      const glass = calculateWoodDoorGlassCost([{ w: gw, h: gh }], form.glassType, prices);
      price += glass;
      if (glass) surcharges.push(`ค่ากระจก ฿${glass.toLocaleString()}`);
    }
  }

  // ปัดราคาสุทธิขึ้นเป็นหลักร้อยเสมอ (หลักหน่วย/หลักสิบ → 00) เช่น 13,240 → 13,300
  const roundedTotal = Math.ceil(price / 100) * 100;

  return { total: roundedTotal, surcharges };
};

// ------------------------------------------------------------------
// calculateWoodFramePrice — วงกบไม้
//   • สะเดา = ราคาเหมา 3 ขนาด (งานดิบ) + ค่าทำสีเหมา
//   • พลวง/เต็ง/แดง = คำนวณต่อเมตร
//       ค่าไม้ = หน้าตัด(นิ้ว²) × ยาวรวม(ม.) × factor × ต้นทุน/คิว × (1+กำไร%)
//       ค่าสี  = เส้นรอบรูป(นิ้ว) × ยาวรวม(ม.) × เรทสี   (ตามพื้นที่ผิว)
//   ยาวรวม = โครงหลัก(บน+ซ้าย+ขวา) + ธรณี(กว้าง) + ช่องแสง(สูง+2กว้าง ต่อช่อง)
// ------------------------------------------------------------------
export const calculateWoodFramePrice = (form: WoodFrameFormData, prices: PricingStructure): PriceResult => {
  const surcharges: string[] = [];
  const num = (s: string) => { const n = parseFloat(s); return isNaN(n) ? 0 : n; };
  const round100 = (n: number) => Math.ceil(n / 100) * 100;   // ปัดขึ้นหลักร้อยเสมอ

  // ขนาดใช้งานจริง — จาก preset หรือ custom (ให้ตรงแพตเทิร์นหน้าอื่น)
  let W: number, H: number;
  if (form.sizeType === 'custom') {
    W = num(form.customWidth);
    H = num(form.customHeight);
  } else {
    const m = form.sizeType.match(/(\d+)x(\d+)/);
    W = m ? Number(m[1]) : 0;
    H = m ? Number(m[2]) : 0;
  }

  // ─── สะเดา: ราคาเหมา ───────────────────────────────────────────
  if (form.frameType === 'sadao') {
    const key = `${W}x${H}`;
    const isValid = key === '70x200' || key === '80x200' || key === '90x200';
    if (!isValid) {
      return { total: 0, surcharges: ['ไม้สะเดามีเฉพาะ 70×200, 80×200, 90×200 — ขนาดอื่นกรุณาเลือกไม้พลวง/เต็ง/แดง'] };
    }
    const base = round100(prices.wood_frame_price?.[`wf_sadao_${key}`] ?? 0);
    surcharges.push(`วงกบสะเดา ${W}×${H} · งานไม้ ฿${base.toLocaleString()}`);
    let total = base;
    if (form.painted) {
      const paint = round100(prices.wood_frame_price?.['wf_sadao_paint'] ?? 0);   // ค่าทำสีบวกเพิ่ม
      total += paint;
      surcharges.push(`ค่าทำสี ฿${paint.toLocaleString()}`);
    }
    return { total, surcharges };
  }

  // ─── พลวง/เต็ง/แดง/โค้ง: คำนวณต่อเมตร ──────────────────────────
  const sec = WOOD_FRAME_SECTIONS.find(s => s.id === form.section) ?? WOOD_FRAME_SECTIONS[0];
  const area  = sec.t * sec.w;         // หน้าตัด นิ้ว²
  const perim = 2 * (sec.t + sec.w);   // เส้นรอบรูป นิ้ว

  if (W <= 0 || H <= 0) {
    return { total: 0, surcharges: ['กรุณากรอกขนาดกว้าง × สูง'] };
  }

  // เก็บทุกท่อน (ความยาววัดใน cm) — ใช้ 2 แบบ:
  //   ค่าสี = ความยาวจริงของวงกบ · ค่าไม้ = ปัดขึ้นสเตปไม้ที่ซื้อได้ ทีละท่อน (+7 วัดใน→วัดนอก)
  const pieces: number[] = [W, H, H];              // โครงหลัก: บน + ซ้าย + ขวา
  if (form.threshold) pieces.push(W);              // ธรณี
  const addSidelight = (on: boolean, w: string, h: string, n: string) => {
    if (!on) return;
    const sw = num(w), sh = num(h);
    pieces.push(sh, sw, sw);                        // ข้าง + บน + ล่าง
    // เอ็นขั้นกลาง: N ช่อง → (N-1) เส้น ยาว = ด้านสั้นของช่องแสง
    const count = Math.max(1, Math.min(10, Math.round(num(n) || 1)));
    for (let i = 0; i < count - 1; i++) pieces.push(Math.min(sw, sh));
  };
  addSidelight(form.slLeft,  form.slLeftW,  form.slLeftH,  form.slLeftN);
  addSidelight(form.slRight, form.slRightW, form.slRightH, form.slRightN);
  addSidelight(form.slTop,   form.slTopW,   form.slTopH,   form.slTopN);

  const Lactual = pieces.reduce((a, l) => a + l, 0) / 100;                                                // ยาวจริง (ค่าสี)
  const Lstock  = pieces.reduce((a, l) => a + stockLength(l + WOOD_FRAME_INNER_OUTER_GAP), 0) / 100;      // ไม้ที่ซื้อ (ค่าไม้)

  const cube      = prices.wood_frame_rate?.[`cube_${form.frameType}`] ?? 0;
  const marginPct = prices.wood_frame_rate?.['margin_pct'] ?? 0;
  const paintRate = prices.wood_frame_rate?.['paint_rate'] ?? 0;

  if (cube <= 0) {
    return { total: 0, surcharges: ['ยังไม่ได้ตั้งต้นทุนไม้ชนิดนี้ — กรุณาสอบถามราคา'] };
  }

  const cost     = area * Lstock * WOOD_FRAME_FACTOR * cube;             // ต้นทุนไม้ (ตามสเตปไม้ที่ซื้อ)
  const woodSale = round100(cost * (1 + marginPct / 100));              // ค่าไม้ขาย (ปัดขึ้นหลักร้อย)
  const paint    = form.painted ? round100(perim * Lactual * paintRate) : 0;  // ค่าสี (ยาวจริง)

  // ค่ากระจกช่องแสง (แต่ละช่องแสงเป็น 1 แผ่น)
  const glassPanes: { w: number; h: number }[] = [];
  if (form.slLeft)  glassPanes.push({ w: num(form.slLeftW),  h: num(form.slLeftH) });
  if (form.slRight) glassPanes.push({ w: num(form.slRightW), h: num(form.slRightH) });
  if (form.slTop)   glassPanes.push({ w: num(form.slTopW),   h: num(form.slTopH) });
  const glass = glassPanes.length ? calculateWoodFrameGlassCost(glassPanes, form.glassType, prices) : 0;

  const total = woodSale + paint + glass;

  surcharges.push(`วงกบยาว ${Lactual.toFixed(2)} ม. · ไม้ตัดสเตป ${Lstock.toFixed(2)} ม. · ${sec.label}`);
  surcharges.push(`ค่าไม้ ฿${woodSale.toLocaleString()}`);
  if (form.painted) surcharges.push(`ค่าสี ฿${paint.toLocaleString()}`);
  if (glass) surcharges.push(`ค่ากระจกช่องแสง ฿${glass.toLocaleString()}`);

  return { total, surcharges };
};

// ------------------------------------------------------------------
// calculatePlaswoodRailPrice — บังราง Plaswood
//   ราคาทุน = ฐาน(ไม่ทำสี) ตามขนาด + ค่าทำสีตามรูปแบบ (พ่นสี TOA / ปิดผิว SVL)
//   ราคาแสดง = ราคาทุน × (1 + 60%) → ปัดขึ้นหลักร้อย
//   ทุกค่ามาจากราคาทุนที่ตั้งไว้ในหลังบ้าน (ตามขนาด)
// ------------------------------------------------------------------
export const calculatePlaswoodRailPrice = (form: PlaswoodRailFormData, prices: PricingStructure): PriceResult => {
  const surcharges: string[] = [];
  const size = PLASWOOD_RAIL_SIZES.find(s => s.id === form.sizeId);
  if (!size) return { total: 0, surcharges: ['กรุณาเลือกขนาดบังราง'] };

  const pw = prices.plaswood_rail ?? {};
  const base = pw[`pw_${size.id}`] ?? 0;

  let finishCost = 0;
  if (form.finish === 'paint')    finishCost = pw[`pw_paint_${size.id}`] ?? 0;
  else if (form.finish === 'svl') finishCost = pw[`pw_svl_${size.id}`]   ?? 0;

  // ราคาทุนรวม → บวกกำไร 60% → ปัดขึ้นหลักร้อย
  const cost  = base + finishCost;
  const total = cost > 0 ? Math.ceil((cost * (1 + PLASWOOD_RAIL_MARGIN_PCT / 100)) / 100) * 100 : 0;

  surcharges.push(`บังราง Plaswood ${size.label}`);
  surcharges.push(`รูปแบบ: ${PLASWOOD_RAIL_FINISH_NAMES[form.finish] ?? form.finish}`);

  return { total, surcharges };
};