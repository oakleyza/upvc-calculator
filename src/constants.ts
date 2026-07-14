import type { PricingStructure, DoorFormData, FrameFormData, WoodDoorFormData, WoodFrameFormData } from './types';

// ------------------------------------------------------------------
// Frame material constants (แทน magic strings ที่กระจายทั่ว codebase)
// ------------------------------------------------------------------
export const FRAME_MATERIALS = {
  T2:             'wpc_4in_t2',
  F10:            'wpc_4in_f10',
  ADJUST_X:       'wpc_adjust_x',
  ADJUST_ECO:     'wpc_adjust_eco',
  ADJUST_BIG_SIX: 'wpc_adjust_bsx',
} as const;

export type FrameMaterialKey = typeof FRAME_MATERIALS[keyof typeof FRAME_MATERIALS];

// วงกบรุ่นที่มีซับ (สามารถเลือก SVL ได้)
export const FRAME_WITH_SUB: FrameMaterialKey[] = [
  FRAME_MATERIALS.ADJUST_X,
  FRAME_MATERIALS.ADJUST_ECO,
  FRAME_MATERIALS.ADJUST_BIG_SIX,
];

export const isFrameWithSub = (material: string): boolean =>
  FRAME_WITH_SUB.includes(material as FrameMaterialKey);

// ------------------------------------------------------------------
// Wood door constants
// ------------------------------------------------------------------
export const WOOD_TYPE_NAMES: Record<string, string> = {
  sadao: 'ไม้สะเดา',
  tabak: 'ไม้ตะแบก',
  teak:  'ไม้สัก',
};

export const WOOD_MODEL_NAMES: Record<string, string> = {
  // ── ประตูทึบ ──────────────────────────────────────────────────────
  m1:  'ประตูฟักหนึ่งลูก',
  m2:  'ประตูฟักหนึ่งลูกคิ้วเสริมหนึ่งชั้น',
  m3:  'ประตูฟักหนึ่งลูกคิ้วเสริมสองชั้น',
  m4:  'ประตูฟักสองลูก',
  m5:  'ประตูฟักสองลูกคิ้วเสริมหนึ่งชั้น',
  m6:  'ประตูฟักสองลูก คิ้วเสริมสองชั้น',
  m7:  'ประตูฟักสองลูก คิ้วเสริมสองชั้น คิ้วใหญ่',
  m8:  'ประตูฟักสามลูก คิ้วเสริมหนึ่งชั้น',
  m9:  'ประตูโมเดิร์นนอน',
  m10: 'ประตูโมเดิร์นนอนมุมโค้ง',
  m11: 'ประตูโมเดิร์นตั้งไม่มีขอบ',
  m12: 'ประตูซี่ระแนง',
  m13: 'ประตูฟักสองลูกคิ้วเสริมหนึ่งชั้น ฟักโค้งบน',
  // ── ประตูกระจก ────────────────────────────────────────────────────
  m14: 'ประตูกระจกโค้งหกช่อง ฟักลูกเดียวคิ้วเสริมสองชั้น',
  m15: 'ประตูกระจกโค้งครึ่งบาน ฟักลูกเดียว',
  m16: 'ประตูกระจกโค้งครึ่งบาน ฟักลูกเดียว เซาะร่องลูกฟัก',
  m17: 'ประตูกระจกโค้งครึ่งบาน ฟักลูกเดียว คิ้วเสริมหนึ่งชั้น',
  m18: 'ประตูกระจกครึ่งบาน ฟักลูกเดียว',
  m19: 'ประตูกระจกเก้าช่อง ฟักสองลูก',
  m20: 'ประตูกระจกหกช่อง ฟักลูกเดียว',
  m21: 'ประตูกระจกสิบช่อง ฟักลูกเดียวเสมอขอบ',
  m22: 'ประตูกระจกหกช่อง ฟักลูกเดียว คิ้วเสริมหนึ่งชั้น',
  m23: 'ประตูกระจกหกช่อง ฟักลูกเดียว คิ้วเสริมสองชั้น',
  m24: 'ประตูกระจกสี่ช่อง ฟักลูกเดียวสองชั้น คิ้วเสริมสองชั้น',
  m25: 'ประตูกระจกสองช่องมุมโค้ง',
  m26: 'ประตูกระจกสิบช่อง',
  m27: 'ประตูกระจกหกช่อง ทึบล่าง',
  m28: 'ประตูกระจกหกช่องเล็ก ฟักสองลูก',
  m29: 'ประตูกรอบโล่งแคปซูล',
  m30: 'ประตูกรอบโล่ง',
  m31: 'ประตูทึบเรียบ เจาะกระจกกลม',
  // ── ประตูโค้ง ─────────────────────────────────────────────────────
  m32: 'ประตูโค้ง ฟักลูกเดียว',
  m33: 'ประตูโค้ง ฟักสองลูก คิ้วเสริมหนึ่งชั้น',
  m34: 'ประตูโค้ง กระจกครึ่งบาน ฟักลูกเดียว',
  m35: 'ประตูโค้ง กระจกหกช่อง',
  m36: 'ประตูโค้ง กรอบโล่ง',
  m37: 'ประตูโค้ง กระจกหกช่อง ฟักลูกเดียว',
};

// ภาพประจำแต่ละรุ่น — วางไฟล์ที่ public/wood-models/m1.jpg ... m37.jpg
export const WOOD_MODEL_IMAGES: Record<string, string> = {
  m1:  '/wood-models/m1.jpg',
  m2:  '/wood-models/m2.jpg',
  m3:  '/wood-models/m3.jpg',
  m4:  '/wood-models/m4.jpg',
  m5:  '/wood-models/m5.jpg',
  m6:  '/wood-models/m6.jpg',
  m7:  '/wood-models/m7.jpg',
  m8:  '/wood-models/m8.jpg',
  m9:  '/wood-models/m9.jpg',
  m10: '/wood-models/m10.jpg',
  m11: '/wood-models/m11.jpg',
  m12: '/wood-models/m12.jpg',
  m13: '/wood-models/m13.jpg',
  m14: '/wood-models/m14.jpg',
  m15: '/wood-models/m15.jpg',
  m16: '/wood-models/m16.jpg',
  m17: '/wood-models/m17.jpg',
  m18: '/wood-models/m18.jpg',
  m19: '/wood-models/m19.jpg',
  m20: '/wood-models/m20.jpg',
  m21: '/wood-models/m21.jpg',
  m22: '/wood-models/m22.jpg',
  m23: '/wood-models/m23.jpg',
  m24: '/wood-models/m24.jpg',
  m25: '/wood-models/m25.jpg',
  m26: '/wood-models/m26.jpg',
  m27: '/wood-models/m27.jpg',
  m28: '/wood-models/m28.jpg',
  m29: '/wood-models/m29.jpg',
  m30: '/wood-models/m30.jpg',
  m31: '/wood-models/m31.jpg',
  m32: '/wood-models/m32.jpg',
  m33: '/wood-models/m33.jpg',
  m34: '/wood-models/m34.jpg',
  m35: '/wood-models/m35.jpg',
  m36: '/wood-models/m36.jpg',
  m37: '/wood-models/m37.jpg',
};

// ชื่อประเภทกระจกที่มีในระบบ
export const WOOD_GLASS_NAMES: Record<string, string> = {
  plain: 'กระจกใส',
};

// รุ่นประตูโค้ง — ใช้ wd_curve_w_* / wd_curve_h_* สำหรับส่วนต่างขนาด (แทน wd_w_* / wd_h_*)
export const WOOD_CURVE_MODEL_IDS = new Set(['m32', 'm33', 'm34', 'm35', 'm36', 'm37']);

// ------------------------------------------------------------------
// Wood frame constants (วงกบไม้)
// ------------------------------------------------------------------
export const WOOD_FRAME_TYPE_NAMES: Record<string, string> = {
  pluang:       'วงกบไม้พลวง',
  teng:         'วงกบไม้เต็ง',
  daeng:        'วงกบไม้แดง',
  curve_pluang: 'วงกบโค้งไม้พลวง',
};

// ------------------------------------------------------------------
// Label mapping (admin price editor + summary panel)
// ------------------------------------------------------------------
export const LABEL_MAP: Record<string, string> = {
  'uPVC': 'โครงสร้าง uPVC',
  'WPC RIGID': 'โครงสร้าง WPC RIGID',
  'WPC MAX': 'โครงสร้าง WPC MAX',
  '70x200cm': 'ไซส์มาตรฐาน 70x200',
  '80x200cm': 'ไซส์มาตรฐาน 80x200',
  '90x200cm': 'ไซส์มาตรฐาน 90x200',
  'custom': 'ค่าดำเนินการสั่งทำ (Custom)',
  'custom_w_81_89': 'ส่วนต่าง กว้าง 81-89cm',
  'custom_w_90': 'ส่วนต่าง กว้าง 90cm',
  'custom_w_91_100': 'ส่วนต่าง กว้าง 91-100cm',
  'custom_w_101_110': 'ส่วนต่าง กว้าง 101-120cm',
  'custom_h_under_200': 'ส่วนต่าง สูง < 200cm',
  'custom_h_201_210': 'ส่วนต่าง สูง 201-210cm',
  'custom_h_211_220': 'ส่วนต่าง สูง 211-220cm',
  'custom_h_221_240': 'ส่วนต่าง สูง 221-240cm',
  'TOA_h_under_200': 'สี TOA (สูงต่ำกว่า 2.00m)',
  'TOA_h200': 'สี TOA (สูงไม่เกิน 2.00m)',
  'TOA_h220': 'สี TOA (สูง 2.01-2.20m)',
  'TOA_h240': 'สี TOA (สูง 2.21-2.40m)',
  'TOA_plain_extra': 'ส่วนเพิ่ม: บานเรียบพ่นสี TOA (ไม่มีลวดลาย/กระจก)',
  'SVL_h_under_200': 'ผิว SVL (สูงต่ำกว่า 2.00m)',
  'SVL_h200': 'ผิว SVL (สูงไม่เกิน 2.00m)',
  'SVL_h220': 'ผิว SVL (สูง 2.01-2.20m)',
  'SVL_h240': 'ผิว SVL (สูง 2.21-2.40m)',
  'none': 'ไม่เลือก — ราคา 0',
  'standard': 'เซาะร่องมาตรฐาน',
  'black_line': 'เซาะร่องเส้นดำ',
  'painted': 'เซาะร่องทำสี',
  'first_1': 'คิ้ว First Class 1 ช่อง',
  'first_2': 'คิ้ว First Class 2 ช่อง',
  'roma_1': 'คิ้ว ROMA 1 ช่อง',
  'roma_2': 'คิ้ว ROMA 2 ช่อง',
  'frosted': 'กระจกฝ้าเต็มบาน',
  'frosted_half': 'กระจกฝ้าครึ่งบาน',
  'frosted_side': 'กระจกฝ้าข้าง',
  'green_full': 'เขียวตัดแสงเต็มบาน',
  'green_half': 'เขียวตัดแสงครึ่งบาน',
  'green_side': 'เขียวตัดแสงข้าง',
  'wavy_half': 'กระจกลอนครึ่งบาน',
  'full': 'เกล็ดเต็มบาน',
  'half': 'เกล็ดครึ่งบาน',
  'side': 'เกล็ดข้าง',
  'bottom': 'เกล็ดล่าง',
  'full_painted': 'เกล็ดเต็มบาน (ทำสี)',
  'half_painted': 'เกล็ดครึ่งบาน (ทำสี)',
  'side_painted': 'เกล็ดข้าง (ทำสี)',
  'bottom_painted': 'เกล็ดล่าง (ทำสี)',
  'knob': 'เจาะลูกบิดทั่วไป',
  'lever': 'เจาะ/เสริม ก้านโยก',
  'digital': 'เจาะ/เสริม ดิจิตอลล็อก',
  'recessed': 'เจาะ/เสริม มือจับฝัง',
  'shock_up': 'เสริมโครงโช้คอัพ (Shock Up)',
  'handle': 'เสริมโครงด้ามจับ',
  'sliding': 'เสริมโครงบานเลื่อน',
  'stopper': 'เสริมโครง Stopper',
  'peephole': 'เจาะตาแมว',
  'rabbet': 'ทำบังใบ',
  'knob_plate_40': 'เสริมแป้นลูกบิด 40cm',
  'wood_top_bottom': 'เสริมไม้ บน/ล่าง',
  // === ประตูไม้ — base price keys (ใช้สำหรับ validation error fallback) ===
  // Admin ใช้ custom render ไม่ผ่าน renderInput แล้ว จึงไม่ต้องแสดงทุก key ใน LABEL_MAP
  // === ประตูไม้ — ช่วงความกว้าง (งานไม้ & งานทำสี ใช้ key เดียวกัน) ===
  'wd_w_71_80':    'กว้าง 71–80 cm',
  'wd_w_81_90':    'กว้าง 81–90 cm',
  'wd_w_91_100':   'กว้าง 91–100 cm',
  'wd_w_101_110':  'กว้าง 101–110 cm',
  'wd_w_111_120':  'กว้าง 111–120 cm',
  'wd_w_121_plus': 'กว้าง 121 cm ขึ้นไป',
  // === ประตูไม้ — ช่วงความสูง ===
  'wd_h_201_210':  'สูง 201–210 cm',
  'wd_h_211_220':  'สูง 211–220 cm',
  'wd_h_221_230':  'สูง 221–230 cm',
  'wd_h_231_240':  'สูง 231–240 cm',
  'wd_h_241_250':  'สูง 241–250 cm',
  'wd_h_251_260':  'สูง 251–260 cm',
  'wd_h_261_270':  'สูง 261–270 cm',
  'wd_h_271_280':  'สูง 271–280 cm',
  'wd_h_281_290':  'สูง 281–290 cm',
  'wd_h_291_plus': 'สูง 291 cm ขึ้นไป',
  // === ประตูโค้ง — ส่วนต่างความกว้าง (แยกจากปกติ) ===
  'wd_curve_w_71_80':    'โค้ง: กว้าง 71–80 cm',
  'wd_curve_w_81_90':    'โค้ง: กว้าง 81–90 cm',
  'wd_curve_w_91_100':   'โค้ง: กว้าง 91–100 cm',
  'wd_curve_w_101_110':  'โค้ง: กว้าง 101–110 cm',
  'wd_curve_w_111_120':  'โค้ง: กว้าง 111–120 cm',
  'wd_curve_w_121_plus': 'โค้ง: กว้าง 121 cm ขึ้นไป',
  // === ประตูโค้ง — ส่วนต่างความสูง ===
  'wd_curve_h_201_210':  'โค้ง: สูง 201–210 cm',
  'wd_curve_h_211_220':  'โค้ง: สูง 211–220 cm',
  'wd_curve_h_221_230':  'โค้ง: สูง 221–230 cm',
  'wd_curve_h_231_240':  'โค้ง: สูง 231–240 cm',
  'wd_curve_h_241_250':  'โค้ง: สูง 241–250 cm',
  'wd_curve_h_251_260':  'โค้ง: สูง 251–260 cm',
  'wd_curve_h_261_270':  'โค้ง: สูง 261–270 cm',
  'wd_curve_h_271_280':  'โค้ง: สูง 271–280 cm',
  'wd_curve_h_281_290':  'โค้ง: สูง 281–290 cm',
  'wd_curve_h_291_plus': 'โค้ง: สูง 291 cm ขึ้นไป',
  // === กระจกประตูไม้ — ส่วนต่างความกว้าง ===
  'wd_glass_w_71_80':    'กระจก: กว้าง 71–80 cm',
  'wd_glass_w_81_90':    'กระจก: กว้าง 81–90 cm',
  'wd_glass_w_91_100':   'กระจก: กว้าง 91–100 cm',
  'wd_glass_w_101_110':  'กระจก: กว้าง 101–110 cm',
  'wd_glass_w_111_120':  'กระจก: กว้าง 111–120 cm',
  'wd_glass_w_121_plus': 'กระจก: กว้าง 121 cm ขึ้นไป',
  // === กระจกประตูไม้ — ส่วนต่างความสูง ===
  'wd_glass_h_201_210':  'กระจก: สูง 201–210 cm',
  'wd_glass_h_211_220':  'กระจก: สูง 211–220 cm',
  'wd_glass_h_221_230':  'กระจก: สูง 221–230 cm',
  'wd_glass_h_231_240':  'กระจก: สูง 231–240 cm',
  'wd_glass_h_241_250':  'กระจก: สูง 241–250 cm',
  'wd_glass_h_251_260':  'กระจก: สูง 251–260 cm',
  'wd_glass_h_261_270':  'กระจก: สูง 261–270 cm',
  'wd_glass_h_271_280':  'กระจก: สูง 271–280 cm',
  'wd_glass_h_281_290':  'กระจก: สูง 281–290 cm',
  'wd_glass_h_291_plus': 'กระจก: สูง 291 cm ขึ้นไป',
  // === วงกบ — ราคาตั้งต้น ===
  'wpc_4in_t2': 'วงกบ T2 — ราคาเริ่มต้นชุดวงกบ',
  'wpc_4in_f10': 'วงกบ F10 — ราคาเริ่มต้นชุดวงกบ',
  'wpc_adjust_x': 'วงกบ Adjust X — ราคาเริ่มต้นชุดวงกบ',
  'wpc_adjust_eco': 'วงกบ Adjust Eco — ราคาเริ่มต้นชุดวงกบ',
  // === T2 ===
  't2_std_70': 'T2 — ไซส์มาตรฐาน 70×200 (ไม่มีค่าเพิ่ม)',
  't2_std_80': 'T2 — ไซส์มาตรฐาน 80×200 (ไม่มีค่าเพิ่ม)',
  't2_std_90': 'T2 — ไซส์มาตรฐาน 90×200 (ไม่มีค่าเพิ่ม)',
  't2_w_71_80': 'T2 — ค่าเพิ่มความกว้าง 71–80 cm',
  't2_w_81_89': 'T2 — ค่าเพิ่มความกว้าง 81–89 cm',
  't2_w_90': 'T2 — ค่าเพิ่มความกว้าง 90 cm',
  't2_w_91_140': 'T2 — ค่าเพิ่มความกว้าง 91–140 cm',
  't2_w_141_180': 'T2 — ค่าเพิ่มความกว้าง 141–180 cm',
  't2_h_under_200': 'T2 — ค่าลดไซส์ ความสูงต่ำกว่า 200 cm',
  't2_h_201_220': 'T2 — ค่าเพิ่มความสูง 201–220 cm',
  't2_h_221_240': 'T2 — ค่าเพิ่มความสูง 221–240 cm',
  't2_color_h200': 'T2 — ค่าทำสี (สูงไม่เกิน 200 cm)',
  't2_color_h220': 'T2 — ค่าทำสี (สูง 201–220 cm)',
  't2_color_h240': 'T2 — ค่าทำสี (สูง 221–240 cm)',
  // === F10 ===
  'f10_std_70': 'F10 — ไซส์มาตรฐาน 70×200 (ไม่มีค่าเพิ่ม)',
  'f10_std_80': 'F10 — ไซส์มาตรฐาน 80×200 (ไม่มีค่าเพิ่ม)',
  'f10_std_90': 'F10 — ไซส์มาตรฐาน 90×200 (ไม่มีค่าเพิ่ม)',
  'f10_w_71_80': 'F10 — ค่าเพิ่มความกว้าง 71–80 cm',
  'f10_w_81_90': 'F10 — ค่าเพิ่มความกว้าง 81–90 cm',
  'f10_w_91_140': 'F10 — ค่าเพิ่มความกว้าง 91–140 cm',
  'f10_w_141_180': 'F10 — ค่าเพิ่มความกว้าง 141–180 cm',
  'f10_h_under_200': 'F10 — ค่าลดไซส์ ความสูงต่ำกว่า 200 cm',
  'f10_h_201_220': 'F10 — ค่าเพิ่มความสูง 201–220 cm',
  'f10_color_h200': 'F10 — ค่าทำสี (สูงไม่เกิน 200 cm)',
  'f10_color_h220': 'F10 — ค่าทำสี (สูง 201–220 cm)',
  // === Adjust X ===
  'x_std_70': 'Adjust X — ไซส์มาตรฐาน 70×200 (ไม่มีค่าเพิ่ม)',
  'x_std_80': 'Adjust X — ไซส์มาตรฐาน 80×200 (ไม่มีค่าเพิ่ม)',
  'x_std_90': 'Adjust X — ไซส์มาตรฐาน 90×200 (ไม่มีค่าเพิ่ม)',
  'x_w_81_90': 'Adjust X — ค่าเพิ่มความกว้าง 81–90 cm',
  'x_w_91_140': 'Adjust X — ค่าเพิ่มความกว้าง 91–140 cm',
  'x_w_141_180': 'Adjust X — ค่าเพิ่มความกว้าง 141–180 cm',
  'x_h_under_200': 'Adjust X — ค่าลดไซส์ ความสูงต่ำกว่า 200 cm',
  'x_h_201_210': 'Adjust X — ค่าเพิ่มความสูง 201–210 cm',
  'x_h_211_220': 'Adjust X — ค่าเพิ่มความสูง 211–220 cm',
  'x_h_221_240': 'Adjust X — ค่าเพิ่มความสูง 221–240 cm',
  'x_toa_h_200': 'Adjust X — ค่าพ่นสี TOA (สูงไม่เกิน 200 cm)',
  'x_toa_h_201_210': 'Adjust X — ค่าพ่นสี TOA (สูง 201–210 cm)',
  'x_toa_h_211_220': 'Adjust X — ค่าพ่นสี TOA (สูง 211–220 cm)',
  'x_toa_h_221_240': 'Adjust X — ค่าพ่นสี TOA (สูง 221–240 cm)',
  'x_svl_h_200': 'Adjust X — ค่าปิดผิว SVL (สูงไม่เกิน 200 cm)',
  'x_svl_h_201_210': 'Adjust X — ค่าปิดผิว SVL (สูง 201–210 cm)',
  'x_svl_h_211_220': 'Adjust X — ค่าปิดผิว SVL (สูง 211–220 cm)',
  'x_svl_h_221_240': 'Adjust X — ค่าปิดผิว SVL (สูง 221–240 cm)',
  // === Adjust Big Six ===
  'wpc_adjust_bsx': 'วงกบ Adjust Big Six — ราคาเริ่มต้นชุดวงกบ',
  'bsx_std_70': 'Adjust Big Six — ไซส์มาตรฐาน 70×200 (ไม่มีค่าเพิ่ม)',
  'bsx_std_80': 'Adjust Big Six — ไซส์มาตรฐาน 80×200 (ไม่มีค่าเพิ่ม)',
  'bsx_std_90': 'Adjust Big Six — ไซส์มาตรฐาน 90×200 (ไม่มีค่าเพิ่ม)',
  'bsx_w_81_90': 'Adjust Big Six — ค่าเพิ่มความกว้าง 81–90 cm',
  'bsx_w_91_140': 'Adjust Big Six — ค่าเพิ่มความกว้าง 91–140 cm',
  'bsx_w_141_180': 'Adjust Big Six — ค่าเพิ่มความกว้าง 141–180 cm',
  'bsx_h_under_200': 'Adjust Big Six — ค่าลดไซส์ ความสูงต่ำกว่า 200 cm',
  'bsx_h_201_210': 'Adjust Big Six — ค่าเพิ่มความสูง 201–210 cm',
  'bsx_h_211_220': 'Adjust Big Six — ค่าเพิ่มความสูง 211–220 cm',
  'bsx_h_221_240': 'Adjust Big Six — ค่าเพิ่มความสูง 221–240 cm',
  'bsx_toa_h_200': 'Adjust Big Six — ค่าพ่นสี TOA (สูงไม่เกิน 200 cm)',
  'bsx_toa_h_201_210': 'Adjust Big Six — ค่าพ่นสี TOA (สูง 201–210 cm)',
  'bsx_toa_h_211_220': 'Adjust Big Six — ค่าพ่นสี TOA (สูง 211–220 cm)',
  'bsx_toa_h_221_240': 'Adjust Big Six — ค่าพ่นสี TOA (สูง 221–240 cm)',
  'bsx_svl_h_200': 'Adjust Big Six — ค่าปิดผิว SVL (สูงไม่เกิน 200 cm)',
  'bsx_svl_h_201_210': 'Adjust Big Six — ค่าปิดผิว SVL (สูง 201–210 cm)',
  'bsx_svl_h_211_220': 'Adjust Big Six — ค่าปิดผิว SVL (สูง 211–220 cm)',
  'bsx_svl_h_221_240': 'Adjust Big Six — ค่าปิดผิว SVL (สูง 221–240 cm)',
  // === วงกบไม้ ===
  'wf_pluang_70x200cm':       'วงกบไม้พลวง 70×200 (ไม่ทำสี)',
  'wf_pluang_80x200cm':       'วงกบไม้พลวง 80×200 (ไม่ทำสี)',
  'wf_pluang_90x200cm':       'วงกบไม้พลวง 90×200 (ไม่ทำสี)',
  'wf_pluang_70x200cm_paint': 'วงกบไม้พลวง 70×200 (ทำสี)',
  'wf_pluang_80x200cm_paint': 'วงกบไม้พลวง 80×200 (ทำสี)',
  'wf_pluang_90x200cm_paint': 'วงกบไม้พลวง 90×200 (ทำสี)',
  'wf_teng_70x200cm':         'วงกบไม้เต็ง 70×200 (ไม่ทำสี)',
  'wf_teng_80x200cm':         'วงกบไม้เต็ง 80×200 (ไม่ทำสี)',
  'wf_teng_90x200cm':         'วงกบไม้เต็ง 90×200 (ไม่ทำสี)',
  'wf_teng_70x200cm_paint':   'วงกบไม้เต็ง 70×200 (ทำสี)',
  'wf_teng_80x200cm_paint':   'วงกบไม้เต็ง 80×200 (ทำสี)',
  'wf_teng_90x200cm_paint':   'วงกบไม้เต็ง 90×200 (ทำสี)',
  'wf_daeng_70x200cm':        'วงกบไม้แดง 70×200 (ไม่ทำสี)',
  'wf_daeng_80x200cm':        'วงกบไม้แดง 80×200 (ไม่ทำสี)',
  'wf_daeng_90x200cm':        'วงกบไม้แดง 90×200 (ไม่ทำสี)',
  'wf_daeng_70x200cm_paint':  'วงกบไม้แดง 70×200 (ทำสี)',
  'wf_daeng_80x200cm_paint':  'วงกบไม้แดง 80×200 (ทำสี)',
  'wf_daeng_90x200cm_paint':  'วงกบไม้แดง 90×200 (ทำสี)',
  'wf_curve_pluang_70x200cm':       'วงกบโค้งไม้พลวง 70×200 (ไม่ทำสี)',
  'wf_curve_pluang_80x200cm':       'วงกบโค้งไม้พลวง 80×200 (ไม่ทำสี)',
  'wf_curve_pluang_90x200cm':       'วงกบโค้งไม้พลวง 90×200 (ไม่ทำสี)',
  'wf_curve_pluang_70x200cm_paint': 'วงกบโค้งไม้พลวง 70×200 (ทำสี)',
  'wf_curve_pluang_80x200cm_paint': 'วงกบโค้งไม้พลวง 80×200 (ทำสี)',
  'wf_curve_pluang_90x200cm_paint': 'วงกบโค้งไม้พลวง 90×200 (ทำสี)',
  // === Adjust Eco ===
  'eco_std_70': 'Adjust Eco — ไซส์มาตรฐาน 70×200 (ไม่มีค่าเพิ่ม)',
  'eco_std_80': 'Adjust Eco — ไซส์มาตรฐาน 80×200 (ไม่มีค่าเพิ่ม)',
  'eco_std_90': 'Adjust Eco — ไซส์มาตรฐาน 90×200 (ไม่มีค่าเพิ่ม)',
  'eco_w_81_90': 'Adjust Eco — ค่าเพิ่มความกว้าง 81–90 cm',
  'eco_w_91_140': 'Adjust Eco — ค่าเพิ่มความกว้าง 91–140 cm',
  'eco_w_141_180': 'Adjust Eco — ค่าเพิ่มความกว้าง 141–180 cm',
  'eco_h_under_200': 'Adjust Eco — ค่าลดไซส์ ความสูงต่ำกว่า 200 cm',
  'eco_h_201_210': 'Adjust Eco — ค่าเพิ่มความสูง 201–210 cm',
  'eco_h_211_220': 'Adjust Eco — ค่าเพิ่มความสูง 211–220 cm',
  'eco_h_221_240': 'Adjust Eco — ค่าเพิ่มความสูง 221–240 cm',
  'eco_toa_h_200_210': 'Adjust Eco — ค่าพ่นสี TOA (สูง 200–210 cm)',
  'eco_toa_h_211_220': 'Adjust Eco — ค่าพ่นสี TOA (สูง 211–220 cm)',
  'eco_toa_h_221_240': 'Adjust Eco — ค่าพ่นสี TOA (สูง 221–240 cm)',
  'eco_svl_h_under_200': 'Adjust Eco — ค่าปิดผิว SVL (สูงต่ำกว่า 200 cm)',
  'eco_svl_h_200_210': 'Adjust Eco — ค่าปิดผิว SVL (สูง 200–210 cm)',
  'eco_svl_h_211_220': 'Adjust Eco — ค่าปิดผิว SVL (สูง 211–220 cm)',
  'eco_svl_h_221_240': 'Adjust Eco — ค่าปิดผิว SVL (สูง 221–240 cm)',
};

// ------------------------------------------------------------------
// Default prices
// ------------------------------------------------------------------
export const DEFAULT_PRICES: PricingStructure = {
  door_base: { 'uPVC': 3200, 'WPC RIGID': 3700, 'WPC MAX': 4500 },
  door_size: {
    '70x200cm': 0, '80x200cm': 0, '90x200cm': 300, 'custom': 0,
    'custom_w_81_89': 300, 'custom_w_90': 300, 'custom_w_91_100': 1900, 'custom_w_101_110': 2200,
    'custom_h_under_200': 200, 'custom_h_201_210': 400, 'custom_h_211_220': 999, 'custom_h_221_240': 999,
  },
  door_surface: {
    'TOA_h_under_200': 999, 'TOA_h200': 999, 'TOA_h220': 999, 'TOA_h240': 999,
    'TOA_plain_extra': 0,
    'SVL_h_under_200': 999, 'SVL_h200': 999, 'SVL_h220': 999, 'SVL_h240': 999,
  },
  frame_base: {
    [FRAME_MATERIALS.T2]: 900,
    [FRAME_MATERIALS.F10]: 950,
    [FRAME_MATERIALS.ADJUST_X]: 1200,
    [FRAME_MATERIALS.ADJUST_ECO]: 999,
    [FRAME_MATERIALS.ADJUST_BIG_SIX]: 999,
  },
  frame_size: {
    '70x200cm': 0, '80x200cm': 0, '90x200cm': 0, 'custom': 0,
    't2_std_70': 0, 't2_std_80': 0, 't2_std_90': 0,
    't2_w_71_80': 0, 't2_w_81_89': 0, 't2_w_90': 0, 't2_w_91_140': 0, 't2_w_141_180': 0,
    't2_h_201_220': 0, 't2_h_221_240': 0, 't2_h_under_200': 200,
    'f10_std_70': 0, 'f10_std_80': 0, 'f10_std_90': 0,
    'f10_w_71_80': 0, 'f10_w_81_90': 0, 'f10_w_91_140': 0, 'f10_w_141_180': 0,
    'f10_h_201_220': 0, 'f10_h_under_200': 200,
    'x_std_70': 0, 'x_std_80': 0, 'x_std_90': 0,
    'x_w_81_90': 0,                                   // กว้างสูงสุด 90cm เท่านั้น
    'x_h_201_210': 0, 'x_h_211_220': 0, 'x_h_221_240': 0, 'x_h_under_200': 200,
    'eco_std_70': 0, 'eco_std_80': 0, 'eco_std_90': 0,
    'eco_w_81_90': 80, 'eco_w_91_140': 200, 'eco_w_141_180': 280,
    'eco_h_201_210': 200, 'eco_h_211_220': 400, 'eco_h_221_240': 600, 'eco_h_under_200': 200,
    'bsx_std_70': 0, 'bsx_std_80': 0, 'bsx_std_90': 0,
    'bsx_w_81_90': 0, 'bsx_w_91_140': 0, 'bsx_w_141_180': 0,
    'bsx_h_under_200': 200, 'bsx_h_201_210': 0, 'bsx_h_211_220': 0, 'bsx_h_221_240': 0,
  },
  frame_surface: {
    'none': 0,
    't2_color_h200': 0, 't2_color_h220': 0, 't2_color_h240': 0,
    'f10_color_h200': 0, 'f10_color_h220': 0,
    'x_toa_h_200': 0, 'x_toa_h_201_210': 0, 'x_toa_h_211_220': 0, 'x_toa_h_221_240': 0,
    'x_svl_h_200': 0, 'x_svl_h_201_210': 0, 'x_svl_h_211_220': 0, 'x_svl_h_221_240': 0,
    'eco_toa_h_200_210': 600, 'eco_toa_h_211_220': 700, 'eco_toa_h_221_240': 800,
    'eco_svl_h_under_200': 1200, 'eco_svl_h_200_210': 1200, 'eco_svl_h_211_220': 1500, 'eco_svl_h_221_240': 1700,
    'bsx_toa_h_200': 0, 'bsx_toa_h_201_210': 0, 'bsx_toa_h_211_220': 0, 'bsx_toa_h_221_240': 0,
    'bsx_svl_h_200': 0, 'bsx_svl_h_201_210': 0, 'bsx_svl_h_211_220': 0, 'bsx_svl_h_221_240': 0,
  },
  wood_door_price: {
    // ค่าไม้ตั้งต้น ตามชนิดไม้ × รุ่น (sadao)
    'wd_base_sadao_m1_wood': 999, 'wd_base_sadao_m2_wood': 999, 'wd_base_sadao_m3_wood': 999,
    'wd_base_sadao_m4_wood': 999, 'wd_base_sadao_m5_wood': 999, 'wd_base_sadao_m6_wood': 999,
    'wd_base_sadao_m7_wood': 999, 'wd_base_sadao_m8_wood': 999, 'wd_base_sadao_m9_wood': 999,
    'wd_base_sadao_m10_wood': 999, 'wd_base_sadao_m11_wood': 999, 'wd_base_sadao_m12_wood': 999,
    'wd_base_sadao_m13_wood': 999, 'wd_base_sadao_m14_wood': 999, 'wd_base_sadao_m15_wood': 999,
    'wd_base_sadao_m16_wood': 999, 'wd_base_sadao_m17_wood': 999, 'wd_base_sadao_m18_wood': 999,
    'wd_base_sadao_m19_wood': 999, 'wd_base_sadao_m20_wood': 999, 'wd_base_sadao_m21_wood': 999,
    'wd_base_sadao_m22_wood': 999, 'wd_base_sadao_m23_wood': 999, 'wd_base_sadao_m24_wood': 999,
    'wd_base_sadao_m25_wood': 999, 'wd_base_sadao_m26_wood': 999, 'wd_base_sadao_m27_wood': 999,
    'wd_base_sadao_m28_wood': 999, 'wd_base_sadao_m29_wood': 999, 'wd_base_sadao_m30_wood': 999,
    'wd_base_sadao_m31_wood': 999, 'wd_base_sadao_m32_wood': 999, 'wd_base_sadao_m33_wood': 999,
    'wd_base_sadao_m34_wood': 999, 'wd_base_sadao_m35_wood': 999, 'wd_base_sadao_m36_wood': 999,
    'wd_base_sadao_m37_wood': 999,
    // ค่าไม้ตั้งต้น (tabak)
    'wd_base_tabak_m1_wood': 999, 'wd_base_tabak_m2_wood': 999, 'wd_base_tabak_m3_wood': 999,
    'wd_base_tabak_m4_wood': 999, 'wd_base_tabak_m5_wood': 999, 'wd_base_tabak_m6_wood': 999,
    'wd_base_tabak_m7_wood': 999, 'wd_base_tabak_m8_wood': 999, 'wd_base_tabak_m9_wood': 999,
    'wd_base_tabak_m10_wood': 999, 'wd_base_tabak_m11_wood': 999, 'wd_base_tabak_m12_wood': 999,
    'wd_base_tabak_m13_wood': 999, 'wd_base_tabak_m14_wood': 999, 'wd_base_tabak_m15_wood': 999,
    'wd_base_tabak_m16_wood': 999, 'wd_base_tabak_m17_wood': 999, 'wd_base_tabak_m18_wood': 999,
    'wd_base_tabak_m19_wood': 999, 'wd_base_tabak_m20_wood': 999, 'wd_base_tabak_m21_wood': 999,
    'wd_base_tabak_m22_wood': 999, 'wd_base_tabak_m23_wood': 999, 'wd_base_tabak_m24_wood': 999,
    'wd_base_tabak_m25_wood': 999, 'wd_base_tabak_m26_wood': 999, 'wd_base_tabak_m27_wood': 999,
    'wd_base_tabak_m28_wood': 999, 'wd_base_tabak_m29_wood': 999, 'wd_base_tabak_m30_wood': 999,
    'wd_base_tabak_m31_wood': 999, 'wd_base_tabak_m32_wood': 999, 'wd_base_tabak_m33_wood': 999,
    'wd_base_tabak_m34_wood': 999, 'wd_base_tabak_m35_wood': 999, 'wd_base_tabak_m36_wood': 999,
    'wd_base_tabak_m37_wood': 999,
    // ค่าไม้ตั้งต้น (teak)
    'wd_base_teak_m1_wood': 999, 'wd_base_teak_m2_wood': 999, 'wd_base_teak_m3_wood': 999,
    'wd_base_teak_m4_wood': 999, 'wd_base_teak_m5_wood': 999, 'wd_base_teak_m6_wood': 999,
    'wd_base_teak_m7_wood': 999, 'wd_base_teak_m8_wood': 999, 'wd_base_teak_m9_wood': 999,
    'wd_base_teak_m10_wood': 999, 'wd_base_teak_m11_wood': 999, 'wd_base_teak_m12_wood': 999,
    'wd_base_teak_m13_wood': 999, 'wd_base_teak_m14_wood': 999, 'wd_base_teak_m15_wood': 999,
    'wd_base_teak_m16_wood': 999, 'wd_base_teak_m17_wood': 999, 'wd_base_teak_m18_wood': 999,
    'wd_base_teak_m19_wood': 999, 'wd_base_teak_m20_wood': 999, 'wd_base_teak_m21_wood': 999,
    'wd_base_teak_m22_wood': 999, 'wd_base_teak_m23_wood': 999, 'wd_base_teak_m24_wood': 999,
    'wd_base_teak_m25_wood': 999, 'wd_base_teak_m26_wood': 999, 'wd_base_teak_m27_wood': 999,
    'wd_base_teak_m28_wood': 999, 'wd_base_teak_m29_wood': 999, 'wd_base_teak_m30_wood': 999,
    'wd_base_teak_m31_wood': 999, 'wd_base_teak_m32_wood': 999, 'wd_base_teak_m33_wood': 999,
    'wd_base_teak_m34_wood': 999, 'wd_base_teak_m35_wood': 999, 'wd_base_teak_m36_wood': 999,
    'wd_base_teak_m37_wood': 999,
    // งานไม้ — ส่วนต่างความกว้าง (ประตูทั่วไป)
    'wd_w_71_80': 0, 'wd_w_81_90': 500, 'wd_w_91_100': 1000,
    'wd_w_101_110': 1500, 'wd_w_111_120': 2000, 'wd_w_121_plus': 2500,
    // งานไม้ — ส่วนต่างความสูง (ประตูทั่วไป)
    'wd_h_201_210': 500,  'wd_h_211_220': 1000, 'wd_h_221_230': 1500,
    'wd_h_231_240': 2000, 'wd_h_241_250': 2500, 'wd_h_251_260': 3000,
    'wd_h_261_270': 3500, 'wd_h_271_280': 4000, 'wd_h_281_290': 4500,
    'wd_h_291_plus': 5000,
    // งานไม้ — ส่วนต่างความกว้าง (ประตูโค้ง — แยกต่างหาก)
    'wd_curve_w_71_80': 0, 'wd_curve_w_81_90': 0, 'wd_curve_w_91_100': 0,
    'wd_curve_w_101_110': 0, 'wd_curve_w_111_120': 0, 'wd_curve_w_121_plus': 0,
    // งานไม้ — ส่วนต่างความสูง (ประตูโค้ง — แยกต่างหาก)
    'wd_curve_h_201_210': 0,  'wd_curve_h_211_220': 0,  'wd_curve_h_221_230': 0,
    'wd_curve_h_231_240': 0,  'wd_curve_h_241_250': 0,  'wd_curve_h_251_260': 0,
    'wd_curve_h_261_270': 0,  'wd_curve_h_271_280': 0,  'wd_curve_h_281_290': 0,
    'wd_curve_h_291_plus': 0,
  },
  wood_door_paint: {
    // ค่าทำสีตั้งต้น ตามชนิดไม้ × รุ่น (sadao)
    'wd_base_sadao_m1_paint': 999, 'wd_base_sadao_m2_paint': 999, 'wd_base_sadao_m3_paint': 999,
    'wd_base_sadao_m4_paint': 999, 'wd_base_sadao_m5_paint': 999, 'wd_base_sadao_m6_paint': 999,
    'wd_base_sadao_m7_paint': 999, 'wd_base_sadao_m8_paint': 999, 'wd_base_sadao_m9_paint': 999,
    'wd_base_sadao_m10_paint': 999, 'wd_base_sadao_m11_paint': 999, 'wd_base_sadao_m12_paint': 999,
    'wd_base_sadao_m13_paint': 999, 'wd_base_sadao_m14_paint': 999, 'wd_base_sadao_m15_paint': 999,
    'wd_base_sadao_m16_paint': 999, 'wd_base_sadao_m17_paint': 999, 'wd_base_sadao_m18_paint': 999,
    'wd_base_sadao_m19_paint': 999, 'wd_base_sadao_m20_paint': 999, 'wd_base_sadao_m21_paint': 999,
    'wd_base_sadao_m22_paint': 999, 'wd_base_sadao_m23_paint': 999, 'wd_base_sadao_m24_paint': 999,
    'wd_base_sadao_m25_paint': 999, 'wd_base_sadao_m26_paint': 999, 'wd_base_sadao_m27_paint': 999,
    'wd_base_sadao_m28_paint': 999, 'wd_base_sadao_m29_paint': 999, 'wd_base_sadao_m30_paint': 999,
    'wd_base_sadao_m31_paint': 999, 'wd_base_sadao_m32_paint': 999, 'wd_base_sadao_m33_paint': 999,
    'wd_base_sadao_m34_paint': 999, 'wd_base_sadao_m35_paint': 999, 'wd_base_sadao_m36_paint': 999,
    'wd_base_sadao_m37_paint': 999,
    // ค่าทำสีตั้งต้น (tabak)
    'wd_base_tabak_m1_paint': 999, 'wd_base_tabak_m2_paint': 999, 'wd_base_tabak_m3_paint': 999,
    'wd_base_tabak_m4_paint': 999, 'wd_base_tabak_m5_paint': 999, 'wd_base_tabak_m6_paint': 999,
    'wd_base_tabak_m7_paint': 999, 'wd_base_tabak_m8_paint': 999, 'wd_base_tabak_m9_paint': 999,
    'wd_base_tabak_m10_paint': 999, 'wd_base_tabak_m11_paint': 999, 'wd_base_tabak_m12_paint': 999,
    'wd_base_tabak_m13_paint': 999, 'wd_base_tabak_m14_paint': 999, 'wd_base_tabak_m15_paint': 999,
    'wd_base_tabak_m16_paint': 999, 'wd_base_tabak_m17_paint': 999, 'wd_base_tabak_m18_paint': 999,
    'wd_base_tabak_m19_paint': 999, 'wd_base_tabak_m20_paint': 999, 'wd_base_tabak_m21_paint': 999,
    'wd_base_tabak_m22_paint': 999, 'wd_base_tabak_m23_paint': 999, 'wd_base_tabak_m24_paint': 999,
    'wd_base_tabak_m25_paint': 999, 'wd_base_tabak_m26_paint': 999, 'wd_base_tabak_m27_paint': 999,
    'wd_base_tabak_m28_paint': 999, 'wd_base_tabak_m29_paint': 999, 'wd_base_tabak_m30_paint': 999,
    'wd_base_tabak_m31_paint': 999, 'wd_base_tabak_m32_paint': 999, 'wd_base_tabak_m33_paint': 999,
    'wd_base_tabak_m34_paint': 999, 'wd_base_tabak_m35_paint': 999, 'wd_base_tabak_m36_paint': 999,
    'wd_base_tabak_m37_paint': 999,
    // ค่าทำสีตั้งต้น (teak)
    'wd_base_teak_m1_paint': 999, 'wd_base_teak_m2_paint': 999, 'wd_base_teak_m3_paint': 999,
    'wd_base_teak_m4_paint': 999, 'wd_base_teak_m5_paint': 999, 'wd_base_teak_m6_paint': 999,
    'wd_base_teak_m7_paint': 999, 'wd_base_teak_m8_paint': 999, 'wd_base_teak_m9_paint': 999,
    'wd_base_teak_m10_paint': 999, 'wd_base_teak_m11_paint': 999, 'wd_base_teak_m12_paint': 999,
    'wd_base_teak_m13_paint': 999, 'wd_base_teak_m14_paint': 999, 'wd_base_teak_m15_paint': 999,
    'wd_base_teak_m16_paint': 999, 'wd_base_teak_m17_paint': 999, 'wd_base_teak_m18_paint': 999,
    'wd_base_teak_m19_paint': 999, 'wd_base_teak_m20_paint': 999, 'wd_base_teak_m21_paint': 999,
    'wd_base_teak_m22_paint': 999, 'wd_base_teak_m23_paint': 999, 'wd_base_teak_m24_paint': 999,
    'wd_base_teak_m25_paint': 999, 'wd_base_teak_m26_paint': 999, 'wd_base_teak_m27_paint': 999,
    'wd_base_teak_m28_paint': 999, 'wd_base_teak_m29_paint': 999, 'wd_base_teak_m30_paint': 999,
    'wd_base_teak_m31_paint': 999, 'wd_base_teak_m32_paint': 999, 'wd_base_teak_m33_paint': 999,
    'wd_base_teak_m34_paint': 999, 'wd_base_teak_m35_paint': 999, 'wd_base_teak_m36_paint': 999,
    'wd_base_teak_m37_paint': 999,
    // งานทำสี — ส่วนต่างความกว้าง (ประตูทั่วไป)
    'wd_w_71_80': 0, 'wd_w_81_90': 0, 'wd_w_91_100': 0,
    'wd_w_101_110': 500, 'wd_w_111_120': 500, 'wd_w_121_plus': 1000,
    // งานทำสี — ส่วนต่างความสูง (ประตูทั่วไป)
    'wd_h_201_210': 0,    'wd_h_211_220': 0,    'wd_h_221_230': 1000,
    'wd_h_231_240': 1000, 'wd_h_241_250': 1500, 'wd_h_251_260': 1500,
    'wd_h_261_270': 2000, 'wd_h_271_280': 2000, 'wd_h_281_290': 2500,
    'wd_h_291_plus': 2500,
    // งานทำสี — ส่วนต่างความกว้าง (ประตูโค้ง — แยกต่างหาก)
    'wd_curve_w_71_80': 0, 'wd_curve_w_81_90': 0, 'wd_curve_w_91_100': 0,
    'wd_curve_w_101_110': 0, 'wd_curve_w_111_120': 0, 'wd_curve_w_121_plus': 0,
    // งานทำสี — ส่วนต่างความสูง (ประตูโค้ง — แยกต่างหาก)
    'wd_curve_h_201_210': 0,  'wd_curve_h_211_220': 0,  'wd_curve_h_221_230': 0,
    'wd_curve_h_231_240': 0,  'wd_curve_h_241_250': 0,  'wd_curve_h_251_260': 0,
    'wd_curve_h_261_270': 0,  'wd_curve_h_271_280': 0,  'wd_curve_h_281_290': 0,
    'wd_curve_h_291_plus': 0,
  },
  wood_door_glass: {
    // ราคากระจกตั้งต้น ตามรุ่น (กระจกใส = plain)
    'wd_glass_plain_m14': 0, 'wd_glass_plain_m15': 0, 'wd_glass_plain_m16': 0,
    'wd_glass_plain_m17': 0, 'wd_glass_plain_m18': 0, 'wd_glass_plain_m19': 0,
    'wd_glass_plain_m20': 0, 'wd_glass_plain_m21': 0, 'wd_glass_plain_m22': 0,
    'wd_glass_plain_m23': 0, 'wd_glass_plain_m24': 0, 'wd_glass_plain_m25': 0,
    'wd_glass_plain_m26': 0, 'wd_glass_plain_m27': 0, 'wd_glass_plain_m28': 0,
    'wd_glass_plain_m31': 0,
    'wd_glass_plain_m34': 0, 'wd_glass_plain_m35': 0, 'wd_glass_plain_m37': 0,
    // กระจก — ส่วนต่างความกว้าง
    'wd_glass_w_71_80': 0, 'wd_glass_w_81_90': 0, 'wd_glass_w_91_100': 0,
    'wd_glass_w_101_110': 0, 'wd_glass_w_111_120': 0, 'wd_glass_w_121_plus': 0,
    // กระจก — ส่วนต่างความสูง
    'wd_glass_h_201_210': 0,  'wd_glass_h_211_220': 0,  'wd_glass_h_221_230': 0,
    'wd_glass_h_231_240': 0,  'wd_glass_h_241_250': 0,  'wd_glass_h_251_260': 0,
    'wd_glass_h_261_270': 0,  'wd_glass_h_271_280': 0,  'wd_glass_h_281_290': 0,
    'wd_glass_h_291_plus': 0,
  },
  wood_frame_price: {
    // ราคารวมทั้งชุดวงกบไม้ ตาม type × size (ไม่ทำสี)
    'wf_pluang_70x200cm': 0, 'wf_pluang_80x200cm': 0, 'wf_pluang_90x200cm': 0,
    'wf_teng_70x200cm':   0, 'wf_teng_80x200cm':   0, 'wf_teng_90x200cm':   0,
    'wf_daeng_70x200cm':  0, 'wf_daeng_80x200cm':  0, 'wf_daeng_90x200cm':  0,
    'wf_curve_pluang_70x200cm': 0, 'wf_curve_pluang_80x200cm': 0, 'wf_curve_pluang_90x200cm': 0,
    // ราคารวมทั้งชุดวงกบไม้ ตาม type × size (ทำสี — ราคารวมทั้งหมด ไม่ใช่ส่วนต่าง)
    'wf_pluang_70x200cm_paint': 0, 'wf_pluang_80x200cm_paint': 0, 'wf_pluang_90x200cm_paint': 0,
    'wf_teng_70x200cm_paint':   0, 'wf_teng_80x200cm_paint':   0, 'wf_teng_90x200cm_paint':   0,
    'wf_daeng_70x200cm_paint':  0, 'wf_daeng_80x200cm_paint':  0, 'wf_daeng_90x200cm_paint':  0,
    'wf_curve_pluang_70x200cm_paint': 0, 'wf_curve_pluang_80x200cm_paint': 0, 'wf_curve_pluang_90x200cm_paint': 0,
  },
  structure: {}, size: {}, surface: {},
  grooving: { 'none': 0, 'standard': 999, 'black_line': 999, 'painted': 999 },
  molding: { 'none': 0, 'first_1': 999, 'first_2': 999, 'roma_1': 999, 'roma_2': 999 },
  glass: { 'none': 0, 'frosted': 999, 'frosted_half': 999, 'frosted_side': 999, 'green_full': 999, 'green_half': 999, 'green_side': 999, 'wavy_half': 999 },
  louver: { 'none': 0, 'full': 999, 'half': 999, 'side': 999, 'bottom': 999, 'full_painted': 999, 'half_painted': 999, 'side_painted': 999, 'bottom_painted': 999 },
  reinforce: { 'none': 0, 'lever': 200, 'digital': 400, 'recessed': 200 },
  drilling: { 'none': 0, 'knob': 300, 'lever': 300, 'digital': 300, 'recessed': 300 },
  options: { 'shock_up': 200, 'handle': 200, 'sliding': 500, 'stopper': 100, 'peephole': 200, 'rabbet': 400, 'knob_plate_40': 0, 'wood_top_bottom': 0 },
};

// ------------------------------------------------------------------
// Default form states (ลบ dead fields: toaCode, svlCode, wallThickness, type)
// ------------------------------------------------------------------
export const DEFAULT_DOOR_FORM: DoorFormData = {
  structure: 'uPVC',
  sizeType: '70x200cm',
  customWidth: '',
  customHeight: '',
  surfaceType: 'TOA',
  grooving: 'none',
  molding: 'none',
  glass: 'none',
  louver: 'none',
  reinforce: 'none',
  drilling: 'none',
  options: {
    shock_up: false, handle: false, sliding: false, stopper: false,
    peephole: false, rabbet: false, knob_plate_40: false, wood_top_bottom: false,
  },
};

export const DEFAULT_FRAME_FORM: FrameFormData = {
  frameMaterial: FRAME_MATERIALS.T2,
  sizeType: '70x200cm',
  customWidth: '',
  customHeight: '',
  surfaceType: 'TOA',
};

export const DEFAULT_WOOD_DOOR_FORM: WoodDoorFormData = {
  woodType: 'sadao',
  modelId: 'm1',
  sizeType: '70x200cm',
  customWidth: '',
  customHeight: '',
  painted: true,    // ค่าเริ่มต้น: มีการทำสี (ติ๊กออกถ้าไม่ทำสี)
  glassType: 'none', // 'none' | 'plain' — auto-set เมื่อเลือกรุ่นที่มีกระจก
};

export const DEFAULT_WOOD_FRAME_FORM: WoodFrameFormData = {
  frameType:    'pluang',
  sizeType:     '70x200cm',
  customWidth:  '',
  customHeight: '',
  painted:      true,
};

// ------------------------------------------------------------------
// Default users seed (เก็บ plain-text สำหรับ seed ครั้งแรกเท่านั้น — จะ hash ก่อน save)
// ------------------------------------------------------------------
export const DEFAULT_USERS_SEED = [
  { id: 'admin_01', username: 'admin',   password: '1234', name: 'Administrator', role: 'admin'  as const },
  { id: 'staff_01', username: 'staff01', password: '1234', name: 'General Staff', role: 'staff' as const },
];

// ------------------------------------------------------------------
// Session expiry
// ------------------------------------------------------------------
export const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 วัน
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS   = 30 * 1000; // 30 วินาที
