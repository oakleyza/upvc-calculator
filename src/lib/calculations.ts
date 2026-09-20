// ------------------------------------------------------------------
// Price calculation pure functions
// B-2 FIX: TOA_h_under_200 / SVL_h_under_200 ถูกใช้จริงแล้ว
// ------------------------------------------------------------------

import type { DoorFormData, FrameFormData, WoodDoorFormData, WoodFrameFormData, PricingStructure, PriceResult } from '../types';
import { FRAME_MATERIALS, WOOD_CURVE_MODEL_IDS, WOOD_MODEL_NAMES, WOOD_TYPE_MULTIPLIER, WOOD_FRAME_SECTIONS, WOOD_FRAME_FACTOR } from '../constants';

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
  const getGlass  = (k: string) => prices.wood_door_glass?.[k]  ?? 0;

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

    // ---- ราคากระจก (เฉพาะรุ่นที่มีกระจก และ glassType ไม่ใช่ 'none') ----
    if (hasGlass && form.glassType && form.glassType !== 'none') {
      const glassBaseKey = `wd_glass_${form.glassType}_${form.modelId}`;
      const glassBase = getGlass(glassBaseKey);
      price += glassBase;
      if (glassBase) surcharges.push(`ราคากระจก (+฿${glassBase.toLocaleString()})`);

      // ส่วนต่างขนาดกระจก
      if (widthSuffix) {
        const gw = getGlass(`wd_glass_w_${widthSuffix}`);
        price += gw;
        if (gw) surcharges.push(`กระจก ส่วนต่างกว้าง (+฿${gw.toLocaleString()})`);
      }
      if (heightSuffix) {
        const gh = getGlass(`wd_glass_h_${heightSuffix}`);
        price += gh;
        if (gh) surcharges.push(`กระจก ส่วนต่างสูง (+฿${gh.toLocaleString()})`);
      }
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
  const W = num(form.width);
  const H = num(form.height);

  // ─── สะเดา: ราคาเหมา ───────────────────────────────────────────
  if (form.frameType === 'sadao') {
    const key = `${W}x${H}`;
    const isValid = key === '70x200' || key === '80x200' || key === '90x200';
    if (!isValid) {
      return { total: 0, surcharges: ['ไม้สะเดามีเฉพาะ 70×200, 80×200, 90×200 — ขนาดอื่นกรุณาเลือกไม้พลวง/เต็ง/แดง'] };
    }
    if (form.painted) {
      const paint = prices.wood_frame_price?.['wf_sadao_paint'] ?? 0;
      surcharges.push(`วงกบสะเดา ${W}×${H} · ทำสี (ราคาเหมา)`);
      return { total: paint, surcharges };
    }
    const base = prices.wood_frame_price?.[`wf_sadao_${key}`] ?? 0;
    surcharges.push(`วงกบสะเดา ${W}×${H} · งานดิบ`);
    return { total: base, surcharges };
  }

  // ─── พลวง/เต็ง/แดง/โค้ง: คำนวณต่อเมตร ──────────────────────────
  const sec = WOOD_FRAME_SECTIONS.find(s => s.id === form.section) ?? WOOD_FRAME_SECTIONS[0];
  const area  = sec.t * sec.w;         // หน้าตัด นิ้ว²
  const perim = 2 * (sec.t + sec.w);   // เส้นรอบรูป นิ้ว

  if (W <= 0 || H <= 0) {
    return { total: 0, surcharges: ['กรุณากรอกขนาดกว้าง × สูง'] };
  }

  // ความยาวรวมทุกท่อน (เมตร)
  let L = (W + 2 * H) / 100;                       // โครงหลัก: บน + ซ้าย + ขวา
  if (form.threshold) L += W / 100;                // ธรณี
  const addSidelight = (on: boolean, w: string, h: string) => {
    if (!on) return;
    L += (num(h) + 2 * num(w)) / 100;              // ข้าง + บน + ล่าง
  };
  addSidelight(form.slLeft,  form.slLeftW,  form.slLeftH);
  addSidelight(form.slRight, form.slRightW, form.slRightH);
  addSidelight(form.slTop,   form.slTopW,   form.slTopH);

  const cube      = prices.wood_frame_rate?.[`cube_${form.frameType}`] ?? 0;
  const marginPct = prices.wood_frame_rate?.['margin_pct'] ?? 0;
  const paintRate = prices.wood_frame_rate?.['paint_rate'] ?? 0;

  if (cube <= 0) {
    return { total: 0, surcharges: ['ยังไม่ได้ตั้งต้นทุนไม้ชนิดนี้ — กรุณาสอบถามราคา'] };
  }

  const cost     = area * L * WOOD_FRAME_FACTOR * cube;   // ต้นทุนไม้
  const woodSale = cost * (1 + marginPct / 100);          // ค่าไม้ขาย
  const paint    = form.painted ? perim * L * paintRate : 0;
  const total    = Math.round(woodSale + paint);

  surcharges.push(`ความยาวรวม ${L.toFixed(2)} ม. · หน้าตัด ${sec.label}`);
  surcharges.push(`ค่าไม้ ฿${Math.round(woodSale).toLocaleString()}`);
  if (form.painted) surcharges.push(`ค่าสี ฿${Math.round(paint).toLocaleString()}`);

  return { total, surcharges };
};