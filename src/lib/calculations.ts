// ------------------------------------------------------------------
// Price calculation pure functions
// B-2 FIX: TOA_h_under_200 / SVL_h_under_200 ถูกใช้จริงแล้ว
// ------------------------------------------------------------------

import type { DoorFormData, FrameFormData, WoodDoorFormData, PricingStructure, PriceResult } from '../types';
import { FRAME_MATERIALS } from '../constants';

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

  // TOA ไม่ติดคิ้ว → บวก extra
  if (form.surfaceType === 'TOA' && form.molding === 'none') {
    const extraP = prices.door_surface?.['TOA_plain_extra'] ?? 0;
    price += extraP;
    if (extraP) surcharges.push(`TOA ไม่ติดคิ้ว (+฿${extraP.toLocaleString()})`);
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
// ------------------------------------------------------------------
export const calculateWoodDoorPrice = (form: WoodDoorFormData, prices: PricingStructure): PriceResult => {
  const surcharges: string[] = [];
  const getP     = (k: string) => prices.wood_door_price?.[k] ?? 0;
  const getPaint = (k: string) => prices.wood_door_paint?.[k]  ?? 0;

  // ค่าไม้ตั้งต้น (เสมอ) + ค่าทำสีตั้งต้น (เฉพาะเมื่อ painted)
  const baseWoodKey  = `wd_base_${form.woodType}_${form.modelId}_wood`;
  let price = getP(baseWoodKey);
  if (form.painted) {
    const basePaintKey = `wd_base_${form.woodType}_${form.modelId}_paint`;
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
    // ---- ส่วนต่างความกว้าง ----
    const widthKey: string | null =
      width <= 70  ? null
      : width <= 80  ? 'wd_w_71_80'
      : width <= 90  ? 'wd_w_81_90'
      : width <= 100 ? 'wd_w_91_100'
      : width <= 110 ? 'wd_w_101_110'
      : width <= 120 ? 'wd_w_111_120'
      :                'wd_w_121_plus';

    if (widthKey) {
      const wp = getP(widthKey);
      price += wp;
      if (wp) surcharges.push(`งานไม้ ส่วนต่างกว้าง (+฿${wp.toLocaleString()})`);
      if (form.painted) {
        const wpp = getPaint(widthKey);
        price += wpp;
        if (wpp) surcharges.push(`งานสี ส่วนต่างกว้าง (+฿${wpp.toLocaleString()})`);
      }
    }

    // ---- ส่วนต่างความสูง ----
    const heightKey: string | null =
      height <= 200 ? null
      : height <= 210 ? 'wd_h_201_210'
      : height <= 220 ? 'wd_h_211_220'
      : height <= 230 ? 'wd_h_221_230'
      : height <= 240 ? 'wd_h_231_240'
      : height <= 250 ? 'wd_h_241_250'
      : height <= 260 ? 'wd_h_251_260'
      : height <= 270 ? 'wd_h_261_270'
      : height <= 280 ? 'wd_h_271_280'
      : height <= 290 ? 'wd_h_281_290'
      :                 'wd_h_291_plus';

    if (heightKey) {
      const hp = getP(heightKey);
      price += hp;
      if (hp) surcharges.push(`งานไม้ ส่วนต่างสูง (+฿${hp.toLocaleString()})`);
      if (form.painted) {
        const hpp = getPaint(heightKey);
        price += hpp;
        if (hpp) surcharges.push(`งานสี ส่วนต่างสูง (+฿${hpp.toLocaleString()})`);
      }
    }
  }

  return { total: price, surcharges };
};
