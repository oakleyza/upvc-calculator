import type { PricingStructure, DoorFormData, FrameFormData } from './types';

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
