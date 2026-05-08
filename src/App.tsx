import React, { useState, useEffect } from 'react';
import { 
  Calculator, Check, DoorOpen, Maximize, Palette, Settings, 
  FileText, X, AlertCircle, LogOut, User,
  Users, Edit, Save, Trash2, Tag,
  Database, Hammer, LayoutDashboard, ShieldAlert, Loader2
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, setDoc, getDoc, collection, 
  onSnapshot, query, where, getDocs, deleteDoc 
} from "firebase/firestore";

// ------------------------------------------------------------------
// 🔴 CONFIG FIREBASE 🔴
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyArPJYIIChxZiZXRAIS_MTLlAKoVxr2qEc",
  authDomain: "upvc-calc.firebaseapp.com",
  projectId: "upvc-calc",
  storageBucket: "upvc-calc.firebasestorage.app",
  messagingSenderId: "994926197400",
  appId: "1:994926197400:web:087ef98f9dac042dbeeeed"
};

// Initialize Firebase
let app: any, db: any;
try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase init error", e);
}

// ------------------------------------------------------------------
// 🔐 SIMPLE HASH (ไม่ใช้ bcrypt เพื่อไม่ต้องติดตั้ง dep เพิ่ม)
// ใน Production จริงควรใช้ Firebase Auth แทนทั้งหมด
// ------------------------------------------------------------------
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

// ------------------------------------------------------------------
// --- Types & Interfaces ---
// ------------------------------------------------------------------
interface PriceCategory { [key: string]: number; }
interface PricingStructure {
  door_base: PriceCategory;
  door_size: PriceCategory;
  door_surface: PriceCategory;
  frame_base: PriceCategory;
  frame_size: PriceCategory;
  frame_surface: PriceCategory;
  grooving: PriceCategory;
  molding: PriceCategory;
  glass: PriceCategory;
  louver: PriceCategory;
  reinforce: PriceCategory;
  drilling: PriceCategory;
  options: PriceCategory;
  structure?: PriceCategory;
  size?: PriceCategory;
  surface?: PriceCategory;
}

interface DoorOptions { [key: string]: boolean; }

// ✅ FIX #7: แยก state ของ Door และ Frame ออกจากกันอย่างชัดเจน
interface DoorFormData {
  type: string;
  structure: string;
  sizeType: string;
  customWidth: string;
  customHeight: string;
  surfaceType: string;
  toaCode: string;
  svlCode: string;
  grooving: string;
  molding: string;
  glass: string;
  louver: string;
  reinforce: string;
  drilling: string;
  options: DoorOptions;
}

interface FrameFormData {
  frameMaterial: string;
  sizeType: string;
  customWidth: string;
  customHeight: string;
  surfaceType: string;
  wallThickness: string;
}

interface UserAccount {
  id: string;
  username: string;
  passwordHash: string; // ✅ FIX #1: เก็บ hash แทน plain text
  name: string;
  role: 'admin' | 'staff';
}

interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'staff';
}

interface TabInfo { id: string; label: string; icon: React.ElementType; }

// ------------------------------------------------------------------
// 🏷️ LABEL MAPPING
// ------------------------------------------------------------------
const LABEL_MAP: {[key: string]: string} = {
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
  'custom_w_101_110': 'ส่วนต่าง กว้าง 101-110cm',
  'custom_h_under_200': 'ส่วนต่าง สูง < 200cm',
  'custom_h_201_210': 'ส่วนต่าง สูง 201-210cm',
  'custom_h_211_220': 'ส่วนต่าง สูง 211-220cm',
  'custom_h_221_240': 'ส่วนต่าง สูง 221-240cm',
  'TOA_h200': 'สี TOA (สูงไม่เกิน 2.00m)',
  'TOA_h220': 'สี TOA (สูง 2.01-2.20m)',
  'TOA_h240': 'สี TOA (สูง 2.21-2.40m)',
  'TOA_plain_extra': 'ส่วนเพิ่ม: บานเรียบพ่นสี TOA (ไม่มีลวดลาย/กระจก)',
  'SVL_h200': 'ผิว SVL (สูงไม่เกิน 2.00m)',
  'SVL_h220': 'ผิว SVL (สูง 2.01-2.20m)',
  'SVL_h240': 'ผิว SVL (สูง 2.21-2.40m)',
  'none': 'ไม่เลือก/ไม่ทำ',
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
  'full': 'เกล็ดเต็มบาน', 'half': 'เกล็ดครึ่งบาน', 'side': 'เกล็ดข้าง', 'bottom': 'เกล็ดล่าง',
  'full_painted': 'เกล็ดเต็มบาน (ทำสี)', 'half_painted': 'เกล็ดครึ่งบาน (ทำสี)',
  'side_painted': 'เกล็ดข้าง (ทำสี)', 'bottom_painted': 'เกล็ดล่าง (ทำสี)',
  'knob': 'เจาะลูกบิดทั่วไป', 'lever': 'เจาะ/เสริม ก้านโยก',
  'digital': 'เจาะ/เสริม ดิจิตอลล็อก', 'recessed': 'เจาะ/เสริม มือจับฝัง',
  'shock_up': 'เสริมโครงโช้คอัพ (Shock Up)', 'handle': 'เสริมโครงด้ามจับ',
  'sliding': 'เสริมโครงบานเลื่อน', 'stopper': 'เสริมโครง Stopper',
  'peephole': 'เจาะตาแมว', 'rabbet': 'ทำบังใบ',
  'knob_plate_40': 'เสริมแป้นลูกบิด 40cm', 'wood_top_bottom': 'เสริมไม้ บน/ล่าง',
  'wpc_4in_t2': 'วงกบไม้สังเคราะห์ 4" (T2)',
  'wpc_4in_f10': 'วงกบไม้สังเคราะห์ 4" (F10)',
  'wpc_adjust_x': 'วงกบ Adjust X (มีซับ)',
  'wpc_adjust_eco': 'วงกบ Adjust Eco (มีซับ)',
};

// ------------------------------------------------------------------
// 👥 Default Users — ✅ FIX #1 & #10: hash password, ไม่ seed อัตโนมัติ
// ใช้เฉพาะตอน init ครั้งแรกเท่านั้น และ hash ก่อน save
// ------------------------------------------------------------------
const DEFAULT_USERS_SEED = [
  { id: 'admin_01', username: 'admin', password: '1234', name: 'Administrator', role: 'admin' as const },
  { id: 'staff_01', username: 'staff01', password: '1234', name: 'General Staff', role: 'staff' as const }
];

// --- Default Prices ---
const DEFAULT_PRICES: PricingStructure = {
  door_base: { 'uPVC': 3200, 'WPC RIGID': 3700, 'WPC MAX': 4500 },
  door_size: {
    '70x200cm': 0, '80x200cm': 0, '90x200cm': 300, 'custom': 0,
    'custom_w_81_89': 300, 'custom_w_90': 300, 'custom_w_91_100': 1900, 'custom_w_101_110': 2200,
    'custom_h_under_200': 200, 'custom_h_201_210': 400, 'custom_h_211_220': 999, 'custom_h_221_240': 999,
  },
  door_surface: {
    'TOA_h200': 999, 'TOA_h220': 999, 'TOA_h240': 999,
    'TOA_plain_extra': 0,
    'SVL_h200': 999, 'SVL_h220': 999, 'SVL_h240': 999
  },
  frame_base: { 'wpc_4in_t2': 900, 'wpc_4in_f10': 950, 'wpc_adjust_x': 1200, 'wpc_adjust_eco': 999 },
  frame_size: {
    '70x200cm': 0, '80x200cm': 0, '90x200cm': 0, 'custom': 0,
    't2_std_70': 0, 't2_std_80': 0, 't2_std_90': 0,
    't2_w_71_80': 0, 't2_w_81_89': 0, 't2_w_90': 0, 't2_w_91_140': 0, 't2_w_141_180': 0,
    't2_h_201_220': 0, 't2_h_221_240': 0, 't2_h_under_200': 200,
    'f10_std_70': 0, 'f10_std_80': 0, 'f10_std_90': 0,
    'f10_w_71_80': 0, 'f10_w_81_90': 0, 'f10_w_91_140': 0, 'f10_w_141_180': 0,
    'f10_h_201_220': 0, 'f10_h_under_200': 200,
    'x_std_70': 0, 'x_std_80': 0, 'x_std_90': 0,
    'x_w_81_90': 0, 'x_w_91_140': 0, 'x_w_141_180': 0,
    'x_h_201_210': 0, 'x_h_211_220': 0, 'x_h_221_240': 0, 'x_h_under_200': 200,
    'eco_std_70': 0, 'eco_std_80': 0, 'eco_std_90': 0,
    'eco_w_81_90': 80, 'eco_w_91_140': 200, 'eco_w_141_180': 280,
    'eco_h_201_210': 200, 'eco_h_211_220': 400, 'eco_h_221_240': 600, 'eco_h_under_200': 200,
  },
  frame_surface: {
    'none': 0,
    't2_color_h200': 0, 't2_color_h220': 0, 't2_color_h240': 0,
    'f10_color_h200': 0, 'f10_color_h220': 0,
    'x_toa_h_200': 0, 'x_toa_h_201_210': 0, 'x_toa_h_211_220': 0, 'x_toa_h_221_240': 0,
    'x_svl_h_200': 0, 'x_svl_h_201_210': 0, 'x_svl_h_211_220': 0, 'x_svl_h_221_240': 0,
    'eco_toa_h_under_200': 0, 'eco_toa_h_200_210': 600, 'eco_toa_h_211_220': 700, 'eco_toa_h_221_240': 800,
    'eco_svl_h_under_200': 1200, 'eco_svl_h_200_210': 1200, 'eco_svl_h_211_220': 1500, 'eco_svl_h_221_240': 1700,
  },
  structure: {}, size: {}, surface: {},
  grooving: { 'none': 0, 'standard': 999, 'black_line': 999, 'painted': 999 },
  molding: { 'none': 0, 'first_1': 999, 'first_2': 999, 'roma_1': 999, 'roma_2': 999 },
  glass: { 'none': 0, 'frosted': 999, 'frosted_half': 999, 'frosted_side': 999, 'green_full': 999, 'green_half': 999, 'green_side': 999 },
  louver: { 'none': 0, 'full': 999, 'half': 999, 'side': 999, 'bottom': 999, 'full_painted': 999, 'half_painted': 999, 'side_painted': 999, 'bottom_painted': 999 },
  reinforce: { 'none': 0, 'lever': 200, 'digital': 400, 'recessed': 200 },
  drilling: { 'none': 0, 'knob': 300, 'lever': 300, 'digital': 300, 'recessed': 300 },
  options: { 'shock_up': 200, 'handle': 200, 'sliding': 500, 'stopper': 100, 'peephole': 200, 'rabbet': 400, 'knob_plate_40': 0, 'wood_top_bottom': 0 }
};

const TABS: TabInfo[] = [
  { id: 'exclusive', label: 'ประตู Exclusive', icon: DoorOpen },
  { id: 'frame', label: 'วงกบ (Frame)', icon: Maximize },
];

// ------------------------------------------------------------------
// ✅ FIX #8: แยก Price Calculation เป็น Pure Functions
// ------------------------------------------------------------------
interface PriceResult { total: number; surcharges: string[]; }

const calculateDoorPrice = (form: DoorFormData, prices: PricingStructure): PriceResult => {
  let price = 0;
  const surcharges: string[] = [];

  price += prices.door_base?.[form.structure] || prices.structure?.[form.structure] || 0;

  let height = 200;

  if (form.sizeType === 'custom') {
    price += prices.door_size?.['custom'] || 0;
    const width = parseInt(form.customWidth) || 0;
    const h = parseInt(form.customHeight) || 0;
    height = h;

    const getSizeP = (k: string) => prices.door_size?.[k] || prices.size?.[k] || 0;

    if (width >= 81 && width <= 89) { const p = getSizeP('custom_w_81_89'); price += p; if(p) surcharges.push(`กว้าง 81-89cm (+฿${p.toLocaleString()})`); }
    else if (width === 90) { const p = getSizeP('custom_w_90'); price += p; if(p) surcharges.push(`กว้าง 90cm (+฿${p.toLocaleString()})`); }
    else if (width >= 91 && width <= 100) { const p = getSizeP('custom_w_91_100'); price += p; if(p) surcharges.push(`กว้าง 91-100cm (+฿${p.toLocaleString()})`); }
    else if (width >= 101 && width <= 110) { const p = getSizeP('custom_w_101_110'); price += p; if(p) surcharges.push(`กว้าง 101-110cm (+฿${p.toLocaleString()})`); }

    // ✅ FIX #4: ใช้ boundary เดียวกัน — h < 200 / h >= 201
    if (h < 200) { const p = getSizeP('custom_h_under_200'); price += p; if(p) surcharges.push(`ลดความสูง < 200cm (+฿${p.toLocaleString()})`); }
    else if (h >= 201 && h <= 210) { const p = getSizeP('custom_h_201_210'); price += p; if(p) surcharges.push(`สูง 201-210cm (+฿${p.toLocaleString()})`); }
    else if (h >= 211 && h <= 220) { const p = getSizeP('custom_h_211_220'); price += p; if(p) surcharges.push(`สูง 211-220cm (+฿${p.toLocaleString()})`); }
    else if (h >= 221 && h <= 240) { const p = getSizeP('custom_h_221_240'); price += p; if(p) surcharges.push(`สูง 221-240cm (+฿${p.toLocaleString()})`); }
  } else {
    price += prices.door_size?.[form.sizeType] || prices.size?.[form.sizeType] || 0;
    height = 200;
  }

  let surfaceSuffix = '_h200';
  if (height >= 221) surfaceSuffix = '_h240';
  else if (height >= 201) surfaceSuffix = '_h220';

  const surfaceKey = form.surfaceType + surfaceSuffix;
  const surfacePrice = prices.door_surface?.[surfaceKey] || prices.surface?.[surfaceKey] || 0;
  price += surfacePrice;

  const isPlainDoor = form.grooving === 'none' && form.molding === 'none' && form.glass === 'none' && form.louver === 'none';
  if (form.surfaceType === 'TOA' && isPlainDoor) {
    const extraP = prices.door_surface?.['TOA_plain_extra'] || 0;
    price += extraP;
    if (extraP) surcharges.push(`บานเรียบพ่นสี TOA เพิ่ม (+฿${extraP.toLocaleString()})`);
  }

  price += prices.grooving?.[form.grooving] || 0;
  price += prices.molding?.[form.molding] || 0;
  price += prices.glass?.[form.glass] || 0;
  price += prices.louver?.[form.louver] || 0;
  price += prices.reinforce?.[form.reinforce] || 0;
  price += prices.drilling?.[form.drilling] || 0;
  Object.keys(form.options).forEach(key => { if (form.options[key]) price += prices.options?.[key] || 0; });

  return { total: price, surcharges };
};

const isFrameWithSub = (material: string) => ['wpc_adjust_x', 'wpc_adjust_eco'].includes(material);

const calculateFramePrice = (form: FrameFormData, prices: PricingStructure): PriceResult => {
  let price = 0;
  const surcharges: string[] = [];

  price += prices.frame_base?.[form.frameMaterial] || 0;

  let height = 200, width = 0;

  if (form.sizeType === 'custom') {
    price += prices.frame_size?.['custom'] || 0;
    width = parseInt(form.customWidth) || 0;
    height = parseInt(form.customHeight) || 0;
  } else {
    const [wStr, hStr] = form.sizeType.split('x');
    width = parseInt(wStr);
    height = parseInt(hStr);
  }

  const getSize = (k: string) => prices.frame_size?.[k] || 0;
  const getSurf = (k: string) => prices.frame_surface?.[k] || 0;

  if (form.frameMaterial === 'wpc_4in_t2') {
    if (form.sizeType === '70x200cm') price += getSize('t2_std_70');
    else if (form.sizeType === '80x200cm') price += getSize('t2_std_80');
    else if (form.sizeType === '90x200cm') price += getSize('t2_std_90');
    else if (form.sizeType === 'custom') {
      if (width >= 71 && width <= 80) { const p = getSize('t2_w_71_80'); price += p; if(p) surcharges.push(`T2: กว้าง 71-80cm (+฿${p.toLocaleString()})`); }
      else if (width >= 81 && width <= 89) { const p = getSize('t2_w_81_89'); price += p; if(p) surcharges.push(`T2: กว้าง 81-89cm (+฿${p.toLocaleString()})`); }
      else if (width === 90) { const p = getSize('t2_w_90'); price += p; if(p) surcharges.push(`T2: กว้าง 90cm (+฿${p.toLocaleString()})`); }
      else if (width >= 91 && width <= 140) { const p = getSize('t2_w_91_140'); price += p; if(p) surcharges.push(`T2: กว้าง 91-140cm (+฿${p.toLocaleString()})`); }
      else if (width >= 141 && width <= 180) { const p = getSize('t2_w_141_180'); price += p; if(p) surcharges.push(`T2: กว้าง 141-180cm (+฿${p.toLocaleString()})`); }
      // ✅ FIX #4: ใช้ h < 200 / h >= 201 อย่างสม่ำเสมอ
      if (height < 200) { const p = getSize('t2_h_under_200'); price += p; if(p) surcharges.push(`T2: ค่าลดไซส์ (สูง < 200cm) (+฿${p.toLocaleString()})`); }
      else if (height >= 201 && height <= 220) { const p = getSize('t2_h_201_220'); price += p; if(p) surcharges.push(`T2: สูง 201-220cm (+฿${p.toLocaleString()})`); }
      else if (height >= 221 && height <= 240) { const p = getSize('t2_h_221_240'); price += p; if(p) surcharges.push(`T2: สูง 221-240cm (+฿${p.toLocaleString()})`); }
    }
    if (form.surfaceType !== 'none') {
      if (height <= 200) price += getSurf('t2_color_h200');
      else if (height <= 220) price += getSurf('t2_color_h220');
      else price += getSurf('t2_color_h240');
    }
  }

  else if (form.frameMaterial === 'wpc_4in_f10') {
    if (form.sizeType === '70x200cm') price += getSize('f10_std_70');
    else if (form.sizeType === '80x200cm') price += getSize('f10_std_80');
    else if (form.sizeType === '90x200cm') price += getSize('f10_std_90');
    else if (form.sizeType === 'custom') {
      if (width >= 71 && width <= 80) { const p = getSize('f10_w_71_80'); price += p; if(p) surcharges.push(`F10: กว้าง 71-80cm (+฿${p.toLocaleString()})`); }
      else if (width >= 81 && width <= 90) { const p = getSize('f10_w_81_90'); price += p; if(p) surcharges.push(`F10: กว้าง 81-90cm (+฿${p.toLocaleString()})`); }
      else if (width >= 91 && width <= 140) { const p = getSize('f10_w_91_140'); price += p; if(p) surcharges.push(`F10: กว้าง 91-140cm (+฿${p.toLocaleString()})`); }
      else if (width >= 141 && width <= 180) { const p = getSize('f10_w_141_180'); price += p; if(p) surcharges.push(`F10: กว้าง 141-180cm (+฿${p.toLocaleString()})`); }
      if (height < 200) { const p = getSize('f10_h_under_200'); price += p; if(p) surcharges.push(`F10: ค่าลดไซส์ (สูง < 200cm) (+฿${p.toLocaleString()})`); }
      else if (height >= 201 && height <= 220) { const p = getSize('f10_h_201_220'); price += p; if(p) surcharges.push(`F10: สูง 201-220cm (+฿${p.toLocaleString()})`); }
    }
    if (form.surfaceType !== 'none') {
      if (height <= 200) price += getSurf('f10_color_h200');
      else price += getSurf('f10_color_h220');
    }
  }

  else if (form.frameMaterial === 'wpc_adjust_x') {
    if (form.sizeType === '70x200cm') price += getSize('x_std_70');
    else if (form.sizeType === '80x200cm') price += getSize('x_std_80');
    else if (form.sizeType === '90x200cm') price += getSize('x_std_90');
    else if (form.sizeType === 'custom') {
      if (height < 200) { const p = getSize('x_h_under_200'); price += p; if(p) surcharges.push(`X: ค่าลดไซส์ (สูง < 200cm) (+฿${p.toLocaleString()})`); }
      else if (height >= 201 && height <= 210) { const p = getSize('x_h_201_210'); price += p; if(p) surcharges.push(`X: สูง 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height >= 211 && height <= 220) { const p = getSize('x_h_211_220'); price += p; if(p) surcharges.push(`X: สูง 211-220cm (+฿${p.toLocaleString()})`); }
      else if (height >= 221 && height <= 240) { const p = getSize('x_h_221_240'); price += p; if(p) surcharges.push(`X: สูง 221-240cm (+฿${p.toLocaleString()})`); }
      if (width >= 81 && width <= 90) { const p = getSize('x_w_81_90'); price += p; if(p) surcharges.push(`X: กว้าง 81-90cm (+฿${p.toLocaleString()})`); }
      else if (width >= 91 && width <= 140) { const p = getSize('x_w_91_140'); price += p; if(p) surcharges.push(`X: กว้าง 91-140cm (+฿${p.toLocaleString()})`); }
      else if (width >= 141 && width <= 180) { const p = getSize('x_w_141_180'); price += p; if(p) surcharges.push(`X: กว้าง 141-180cm (+฿${p.toLocaleString()})`); }
    }
    if (form.surfaceType === 'TOA') {
      if (height <= 200) { const p = getSurf('x_toa_h_200'); price += p; if(p) surcharges.push(`X: ทำสี TOA (สูง≤200cm) (+฿${p.toLocaleString()})`); }
      else if (height <= 210) { const p = getSurf('x_toa_h_201_210'); price += p; if(p) surcharges.push(`X: ทำสี TOA (201-210cm) (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('x_toa_h_211_220'); price += p; if(p) surcharges.push(`X: ทำสี TOA (211-220cm) (+฿${p.toLocaleString()})`); }
      else { const p = getSurf('x_toa_h_221_240'); price += p; if(p) surcharges.push(`X: ทำสี TOA (221-240cm) (+฿${p.toLocaleString()})`); }
    } else if (form.surfaceType === 'SVL') {
      if (height <= 200) { const p = getSurf('x_svl_h_200'); price += p; if(p) surcharges.push(`X: ปิดผิว SVL (สูง≤200cm) (+฿${p.toLocaleString()})`); }
      else if (height <= 210) { const p = getSurf('x_svl_h_201_210'); price += p; if(p) surcharges.push(`X: ปิดผิว SVL (201-210cm) (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('x_svl_h_211_220'); price += p; if(p) surcharges.push(`X: ปิดผิว SVL (211-220cm) (+฿${p.toLocaleString()})`); }
      else { const p = getSurf('x_svl_h_221_240'); price += p; if(p) surcharges.push(`X: ปิดผิว SVL (221-240cm) (+฿${p.toLocaleString()})`); }
    }
  }

  else if (form.frameMaterial === 'wpc_adjust_eco') {
    if (form.sizeType === '70x200cm') price += getSize('eco_std_70');
    else if (form.sizeType === '80x200cm') price += getSize('eco_std_80');
    else if (form.sizeType === '90x200cm') price += getSize('eco_std_90');
    else if (form.sizeType === 'custom') {
      // ✅ FIX #4: Eco ใช้ h < 200 / h >= 201 เหมือนกันกับ Door ไม่ใช้ h >= 200
      if (height < 200) { const p = getSize('eco_h_under_200'); price += p; if(p) surcharges.push(`Eco: ค่าลดไซส์ (สูง < 200cm) (+฿${p.toLocaleString()})`); }
      else if (height >= 201 && height <= 210) { const p = getSize('eco_h_201_210'); price += p; if(p) surcharges.push(`Eco: สูง 201-210cm (+฿${p.toLocaleString()})`); }
      else if (height >= 211 && height <= 220) { const p = getSize('eco_h_211_220'); price += p; if(p) surcharges.push(`Eco: สูง 211-220cm (+฿${p.toLocaleString()})`); }
      else if (height >= 221 && height <= 240) { const p = getSize('eco_h_221_240'); price += p; if(p) surcharges.push(`Eco: สูง 221-240cm (+฿${p.toLocaleString()})`); }
      if (width >= 81 && width <= 90) { const p = getSize('eco_w_81_90'); price += p; if(p) surcharges.push(`Eco: กว้าง 81-90cm (+฿${p.toLocaleString()})`); }
      else if (width >= 91 && width <= 140) { const p = getSize('eco_w_91_140'); price += p; if(p) surcharges.push(`Eco: กว้าง 91-140cm (+฿${p.toLocaleString()})`); }
      else if (width >= 141 && width <= 180) { const p = getSize('eco_w_141_180'); price += p; if(p) surcharges.push(`Eco: กว้าง 141-180cm (+฿${p.toLocaleString()})`); }
    }
    if (form.surfaceType === 'TOA') {
      // ✅ FIX #4: ใช้ h < 200 / h >= 201 ให้สม่ำเสมอ
      if (height < 200) { const p = getSurf('eco_toa_h_under_200'); price += p; if(p) surcharges.push(`Eco: ทำสี TOA (สูง<200cm) (+฿${p.toLocaleString()})`); }
      else if (height <= 210) { const p = getSurf('eco_toa_h_200_210'); price += p; if(p) surcharges.push(`Eco: ทำสี TOA (200-210cm) (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('eco_toa_h_211_220'); price += p; if(p) surcharges.push(`Eco: ทำสี TOA (211-220cm) (+฿${p.toLocaleString()})`); }
      else { const p = getSurf('eco_toa_h_221_240'); price += p; if(p) surcharges.push(`Eco: ทำสี TOA (221-240cm) (+฿${p.toLocaleString()})`); }
    } else if (form.surfaceType === 'SVL') {
      if (height < 200) { const p = getSurf('eco_svl_h_under_200'); price += p; if(p) surcharges.push(`Eco: ปิดผิว SVL (สูง<200cm) (+฿${p.toLocaleString()})`); }
      else if (height <= 210) { const p = getSurf('eco_svl_h_200_210'); price += p; if(p) surcharges.push(`Eco: ปิดผิว SVL (200-210cm) (+฿${p.toLocaleString()})`); }
      else if (height <= 220) { const p = getSurf('eco_svl_h_211_220'); price += p; if(p) surcharges.push(`Eco: ปิดผิว SVL (211-220cm) (+฿${p.toLocaleString()})`); }
      else { const p = getSurf('eco_svl_h_221_240'); price += p; if(p) surcharges.push(`Eco: ปิดผิว SVL (221-240cm) (+฿${p.toLocaleString()})`); }
    }
  }

  return { total: price, surcharges };
};

// ------------------------------------------------------------------
// 🛠️ ADMIN PRICE EDITOR COMPONENT
// ------------------------------------------------------------------
const AdminPriceEditor = ({
  currentPrices,
  onSave,
  onClose
}: {
  currentPrices: PricingStructure,
  onSave: (newPrices: PricingStructure) => void,
  onClose: () => void
}) => {
  const [activeCategory, setActiveCategory] = useState<'door' | 'frame_t2' | 'frame_f10' | 'frame_x' | 'frame_eco'>('door');
  const [localPrices, setLocalPrices] = useState<PricingStructure>(JSON.parse(JSON.stringify(currentPrices)));
  const [errors, setErrors] = useState<string[]>([]); // ✅ FIX #9: Validation state

  const handlePriceChange = (category: keyof PricingStructure, key: string, val: string) => {
    const num = parseFloat(val);
    setLocalPrices(prev => ({
      ...prev,
      [category]: { ...(prev[category] || {}), [key]: isNaN(num) ? 0 : num }
    }));
  };

  // ✅ FIX #9: Validate ก่อน Save
  const handleSaveWithValidation = () => {
    const errs: string[] = [];
    const allCategories: (keyof PricingStructure)[] = ['door_base', 'door_size', 'door_surface', 'frame_base', 'frame_size', 'frame_surface', 'grooving', 'molding', 'glass', 'louver', 'reinforce', 'drilling', 'options'];
    allCategories.forEach(cat => {
      Object.entries(localPrices[cat] || {}).forEach(([key, val]) => {
        if (typeof val === 'number' && val < 0) {
          errs.push(`"${LABEL_MAP[key] || key}" มีค่าติดลบ (${val})`);
        }
      });
    });
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    onSave(localPrices);
  };

  const renderInput = (category: keyof PricingStructure, key: string) => {
    const label = LABEL_MAP[key] || key;
    if (key === 'custom') return null;
    const value = localPrices[category]?.[key] ?? 0;
    const isNeg = value < 0;
    return (
      <div key={key} className="flex justify-between items-center p-2.5 border-b last:border-0 hover:bg-slate-50 transition-colors">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            min={0}
            onChange={(e) => handlePriceChange(category, key, e.target.value)}
            className={`w-20 p-1.5 text-right border rounded focus:ring-2 outline-none text-sm font-semibold ${isNeg ? 'border-red-400 bg-red-50 focus:ring-red-500' : 'bg-white focus:ring-blue-500'}`}
          />
          <span className="text-xs text-slate-400">฿</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400"><Database className="w-5 h-5" /> จัดการราคากลาง</h3>
          <button onClick={onClose}><X className="w-5 h-5 hover:text-red-400 transition-colors" /></button>
        </div>
        <div className="flex bg-slate-100 border-b p-2 gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'door', label: '🚪 ราคาประตู' },
            { id: 'frame_t2', label: '🔲 วงกบ T2' },
            { id: 'frame_f10', label: '🔲 วงกบ F10' },
            { id: 'frame_x', label: '✨ Adjust X' },
            { id: 'frame_eco', label: '✨ Adjust Eco' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveCategory(t.id as any)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeCategory === t.id ? 'bg-white text-blue-700 shadow-sm border-t-2 border-blue-600' : 'bg-transparent text-slate-500 hover:bg-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeCategory === 'door' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border"><h4 className="font-bold text-blue-700 mb-4 pb-2 border-b flex items-center gap-2"><Tag className="w-4 h-4"/> โครงสร้าง & ราคาตั้งต้น</h4>{Object.keys(localPrices.door_base).map(k => renderInput('door_base', k))}</div>
                <div className="bg-white p-5 rounded-xl shadow-sm border"><h4 className="font-bold text-orange-600 mb-4 pb-2 border-b flex items-center gap-2"><Maximize className="w-4 h-4"/> Surcharge ขนาดประตู</h4>{Object.keys(localPrices.door_size).map(k => renderInput('door_size', k))}</div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-purple-600 mb-4 pb-2 border-b flex items-center gap-2"><Palette className="w-4 h-4"/> งานสี & ดีไซน์หน้าบาน</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ทำสี/ปิดผิว</h5>{Object.keys(localPrices.door_surface).map(k => renderInput('door_surface', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">เซาะร่อง</h5>{Object.keys(localPrices.grooving).map(k => renderInput('grooving', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ติดคิ้ว</h5>{Object.keys(localPrices.molding).map(k => renderInput('molding', k))}</div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-teal-600 mb-4 pb-2 border-b flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> งานกระจก & เกล็ดระบายอากาศ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ช่องกระจก</h5>{Object.keys(localPrices.glass).map(k => renderInput('glass', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">เกล็ดระบายอากาศ</h5>{Object.keys(localPrices.louver).map(k => renderInput('louver', k))}</div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border">
                <h4 className="font-bold text-slate-700 mb-4 pb-2 border-b flex items-center gap-2"><Hammer className="w-4 h-4"/> การเจาะ & อุปกรณ์เสริม</h4>
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
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200"><h4 className="font-bold text-blue-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> วงกบ T2 (Max 180x240)</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>{renderInput('frame_base', 'wpc_4in_t2')}{renderInput('frame_size', 't2_std_70')}{renderInput('frame_size', 't2_std_80')}{renderInput('frame_size', 't2_std_90')}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('t2_w_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('t2_h_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี</h4>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('t2_color_')).map(k => renderInput('frame_surface', k))}</div>
              </div>
            </div>
          )}
          {activeCategory === 'frame_f10' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200"><h4 className="font-bold text-indigo-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> วงกบ F10 (Max 180x220)</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>{renderInput('frame_base', 'wpc_4in_f10')}{renderInput('frame_size', 'f10_std_70')}{renderInput('frame_size', 'f10_std_80')}{renderInput('frame_size', 'f10_std_90')}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('f10_w_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('f10_h_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี</h4>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('f10_color_')).map(k => renderInput('frame_surface', k))}</div>
              </div>
            </div>
          )}
          {activeCategory === 'frame_x' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"><h4 className="font-bold text-yellow-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> Adjust X (Max 90x220)</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>{renderInput('frame_base', 'wpc_adjust_x')}{renderInput('frame_size', 'x_std_70')}{renderInput('frame_size', 'x_std_80')}{renderInput('frame_size', 'x_std_90')}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('x_w_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('x_h_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี/ผิว (X)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-3 rounded"><h5 className="font-bold text-orange-800 text-sm mb-2">สี TOA</h5>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('x_toa_h_')).map(k => renderInput('frame_surface', k))}</div>
                    <div className="bg-purple-50 p-3 rounded"><h5 className="font-bold text-purple-800 text-sm mb-2">ผิว SVL</h5>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('x_svl_h_')).map(k => renderInput('frame_surface', k))}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeCategory === 'frame_eco' && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200"><h4 className="font-bold text-green-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> Adjust Eco (Max 180x240)</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>{renderInput('frame_base', 'wpc_adjust_eco')}{renderInput('frame_size', 'eco_std_70')}{renderInput('frame_size', 'eco_std_80')}{renderInput('frame_size', 'eco_std_90')}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('eco_w_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('eco_h_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2">
                  <h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี/ผิว (Eco)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-3 rounded"><h5 className="font-bold text-orange-800 text-sm mb-2">สี TOA</h5>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('eco_toa_h_')).map(k => renderInput('frame_surface', k))}</div>
                    <div className="bg-purple-50 p-3 rounded"><h5 className="font-bold text-purple-800 text-sm mb-2">ผิว SVL</h5>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('eco_svl_h_')).map(k => renderInput('frame_surface', k))}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* ✅ FIX #9: แสดง Validation Errors */}
        {errors.length > 0 && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200">
            <p className="text-sm font-bold text-red-700 mb-1 flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> พบข้อผิดพลาด — กรุณาแก้ไขก่อนบันทึก:</p>
            <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
        <div className="p-4 bg-white border-t flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold transition-colors">ยกเลิก</button>
          <button onClick={handleSaveWithValidation} className="px-8 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg flex items-center gap-2 transition-colors">
            <Save className="w-5 h-5"/> บันทึกราคาใหม่
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// LOGIN COMPONENT — ✅ FIX #12: Loading skeleton ขณะรอ Firebase
// ------------------------------------------------------------------
const LoginScreen = ({ onLogin, isFirebaseReady, permissionError }: {
  onLogin: (user: SessionUser) => void,
  isFirebaseReady: boolean,
  permissionError: boolean
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!isFirebaseReady) { setError("ไม่สามารถเชื่อมต่อ Database ได้"); setLoading(false); return; }
    try {
      const hashed = simpleHash(password);
      const usersRef = collection(db, "users");
      // ค้นหา username ก่อน แล้วค่อยเช็ค hash ฝั่ง client (เพราะ Firestore ไม่สามารถ query hash ตรงๆ ได้ง่าย)
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as UserAccount;
        // ✅ FIX #1: เช็ค hash แทน plain text
        if (userData.passwordHash === hashed) {
          // ✅ FIX #11: เก็บเฉพาะข้อมูลที่จำเป็น ไม่เก็บ password/hash
          const session: SessionUser = { id: userData.id, username: userData.username, name: userData.name, role: userData.role };
          sessionStorage.setItem('upvc_session', JSON.stringify(session));
          onLogin(session);
        } else {
          setError("Username หรือ Password ไม่ถูกต้อง");
        }
      } else {
        setError("Username หรือ Password ไม่ถูกต้อง");
      }
    } catch (err: any) {
      if (err.code === 'permission-denied') setError("สิทธิ์การเข้าถึงถูกปฏิเสธ (Permission Denied)");
      else setError("เกิดข้อผิดพลาด: " + err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-white flex items-center justify-center">
            <img src="https://i.ibb.co/r2cZ0GYB/image.png" alt="Logo" className="w-full h-full object-cover"/>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">ระบบคำนวนราคาประตู</h2>
        <h3 className="text-lg font-medium text-center text-blue-600 mb-6">-กลางซอยค้าไม้-</h3>
        {/* ✅ FIX #12: แสดงสถานะ Firebase */}
        {!isFirebaseReady && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-lg mb-4 text-sm">
            <Loader2 className="w-4 h-4 animate-spin shrink-0"/>
            <span>กำลังเชื่อมต่อฐานข้อมูล...</span>
          </div>
        )}
        {permissionError && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-xs rounded">
            <p className="font-bold text-sm mb-1">🚨 ตรวจพบปัญหา: Permission Denied</p>
            <p>กรุณาแก้ Firestore Rules ใน Firebase Console</p>
          </div>
        )}
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Username" required /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" required /></div>
          <button type="submit" disabled={loading || !isFirebaseReady} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>กำลังตรวจสอบ...</> : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// USER MANAGEMENT — ✅ FIX #1 & #3: hash password + ป้องกันลบ admin
// ------------------------------------------------------------------
const UserManagementPanel = ({ currentUser, onClose }: { currentUser: SessionUser, onClose: () => void }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<(UserAccount & { newPassword?: string }) | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserAccount)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!editForm || !db) return;
    try {
      const toSave: UserAccount = {
        id: editForm.id,
        username: editForm.username,
        name: editForm.name,
        role: editForm.role,
        // ✅ FIX #1: hash password ใหม่ถ้ามีการเปลี่ยน
        passwordHash: editForm.newPassword ? simpleHash(editForm.newPassword) : editForm.passwordHash
      };
      await setDoc(doc(db, "users", toSave.id), toSave);
      setEditingId(null); setEditForm(null);
    } catch { alert("บันทึกไม่สำเร็จ"); }
  };

  const handleCreateNew = async () => {
    if (!db) return;
    const newId = 'user_' + Date.now();
    const newUser: UserAccount = { id: newId, username: 'new_user', passwordHash: simpleHash('password'), name: 'New Staff', role: 'staff' };
    try { await setDoc(doc(db, "users", newId), newUser); setEditingId(newId); setEditForm({ ...newUser, newPassword: 'password' }); }
    catch { alert("สร้าง User ไม่สำเร็จ"); }
  };

  // ✅ FIX #3: ป้องกันไม่ให้ลบ admin role ทุกคน ไม่ใช่แค่ username 'admin'
  const canDelete = (u: UserAccount) => u.role !== 'admin' && u.id !== currentUser.id;

  const handleDelete = async (id: string) => {
    if (confirm("ยืนยันการลบผู้ใช้งานนี้?") && db) await deleteDoc(doc(db, "users", id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400"><Users className="w-5 h-5"/> จัดการข้อมูลผู้ใช้งาน</h3>
          <button onClick={onClose}><X className="w-5 h-5 hover:text-red-400"/></button>
        </div>
        <div className="p-6 bg-slate-50 overflow-y-auto grow">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-700">รายชื่อผู้ใช้ทั้งหมด</h4>
            <button onClick={handleCreateNew} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">+ เพิ่มผู้ใช้ใหม่</button>
          </div>
          {loading ? <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600"/></div> : (
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {editingId === u.id && editForm ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className="text-xs text-slate-500 font-bold">ชื่อ</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full p-2 text-sm border rounded"/></div>
                      <div><label className="text-xs text-slate-500 font-bold">Username</label><input type="text" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} className="w-full p-2 text-sm border rounded"/></div>
                      <div><label className="text-xs text-slate-500 font-bold">Password ใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</label><input type="password" placeholder="••••" onChange={(e) => setEditForm({...editForm, newPassword: e.target.value})} className="w-full p-2 text-sm border rounded"/></div>
                      <div><label className="text-xs text-slate-500 font-bold">Role</label><select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value as any})} className="w-full p-2 text-sm border rounded"><option value="admin">Admin</option><option value="staff">Staff</option></select></div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                        <span className="font-bold text-slate-800">{u.name}</span>
                        {u.id === currentUser.id && <span className="text-xs text-green-600 font-medium">(คุณ)</span>}
                      </div>
                      <div className="text-sm text-slate-500">User: {u.username}</div>
                    </div>
                  )}
                  <div className="shrink-0 flex gap-2">
                    {editingId === u.id ? (
                      <><button onClick={handleSave} className="p-2 bg-green-100 text-green-700 rounded"><Save className="w-4 h-4"/></button>
                      <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded"><X className="w-4 h-4"/></button></>
                    ) : (
                      <><button onClick={() => { setEditingId(u.id); setEditForm({...u}); }} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-blue-50 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                      {canDelete(u) && <button onClick={() => handleDelete(u.id)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>}</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// MAIN APP
// ------------------------------------------------------------------
const DEFAULT_DOOR_FORM: DoorFormData = {
  type: 'ภายใน', structure: 'uPVC', sizeType: '70x200cm', customWidth: '', customHeight: '',
  surfaceType: 'TOA', toaCode: '', svlCode: 'SVL F-102', grooving: 'none', molding: 'none',
  glass: 'none', louver: 'none', reinforce: 'none', drilling: 'none',
  options: { shock_up: false, handle: false, sliding: false, stopper: false, peephole: false, rabbet: false, knob_plate_40: false, wood_top_bottom: false }
};

const DEFAULT_FRAME_FORM: FrameFormData = {
  frameMaterial: 'wpc_4in_t2', sizeType: '70x200cm', customWidth: '', customHeight: '',
  surfaceType: 'TOA', wallThickness: 'standard'
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('exclusive');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [prices, setPrices] = useState<PricingStructure>(DEFAULT_PRICES);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [isPricesLoading, setIsPricesLoading] = useState(true); // ✅ FIX #12
  const [permissionError, setPermissionError] = useState(false);

  // ✅ FIX #7: แยก state ของ Door และ Frame ออกจากกัน
  const [doorForm, setDoorForm] = useState<DoorFormData>(DEFAULT_DOOR_FORM);
  const [frameForm, setFrameForm] = useState<FrameFormData>(DEFAULT_FRAME_FORM);

  const [priceResult, setPriceResult] = useState<PriceResult>({ total: 0, surcharges: [] });

  useEffect(() => { document.title = "ระบบคำนวณราคา - กลางซอยค้าไม้"; }, []);

  // 1. Restore session — ✅ FIX #11: sessionStorage แทน localStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('upvc_session');
    if (saved) { try { setCurrentUser(JSON.parse(saved)); } catch { sessionStorage.removeItem('upvc_session'); } }
    if (!db) return;
    setIsFirebaseReady(true);

    // ✅ FIX #1 & #10: Seed users พร้อม hashed password
    const initSystem = async () => {
      try {
        for (const u of DEFAULT_USERS_SEED) {
          const userRef = doc(db, "users", u.id);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              id: u.id, username: u.username,
              passwordHash: simpleHash(u.password), // ✅ hash ก่อน save
              name: u.name, role: u.role
            });
          }
        }
        const priceDocRef = doc(db, "config", "prices");
        const priceDoc = await getDoc(priceDocRef);
        if (!priceDoc.exists()) await setDoc(priceDocRef, DEFAULT_PRICES);
      } catch (err: any) {
        if (err.code === 'permission-denied') setPermissionError(true);
      }
    };
    initSystem();
  }, []);

  // 2. Listen for Prices
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "config", "prices"), (docSnap) => {
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as PricingStructure;
        const mergedPrices: PricingStructure = {
          ...DEFAULT_PRICES, ...firestoreData,
          frame_size: { ...DEFAULT_PRICES.frame_size, ...(firestoreData.frame_size || {}) },
          frame_surface: { ...DEFAULT_PRICES.frame_surface, ...(firestoreData.frame_surface || {}) },
          frame_base: { ...DEFAULT_PRICES.frame_base, ...(firestoreData.frame_base || {}) },
          door_base: { ...DEFAULT_PRICES.door_base, ...(firestoreData.door_base || {}) },
          door_size: { ...DEFAULT_PRICES.door_size, ...(firestoreData.door_size || {}) },
          door_surface: { ...DEFAULT_PRICES.door_surface, ...(firestoreData.door_surface || {}) },
          grooving: { ...DEFAULT_PRICES.grooving, ...(firestoreData.grooving || {}) },
          molding: { ...DEFAULT_PRICES.molding, ...(firestoreData.molding || {}) },
          glass: { ...DEFAULT_PRICES.glass, ...(firestoreData.glass || {}) },
          louver: { ...DEFAULT_PRICES.louver, ...(firestoreData.louver || {}) },
          reinforce: { ...DEFAULT_PRICES.reinforce, ...(firestoreData.reinforce || {}) },
          drilling: { ...DEFAULT_PRICES.drilling, ...(firestoreData.drilling || {}) },
          options: { ...DEFAULT_PRICES.options, ...(firestoreData.options || {}) },
        };
        setPrices(mergedPrices);
      } else {
        setPrices(DEFAULT_PRICES);
      }
      setIsPricesLoading(false); // ✅ FIX #12
    }, (error) => {
      if (error.code === 'permission-denied') setPermissionError(true);
      setIsPricesLoading(false);
    });
    return () => unsub();
  }, []);

  // ✅ FIX #8: คำนวณราคาโดยเรียก pure function แทนการคำนวณใน useEffect โดยตรง
  useEffect(() => {
    if (activeTab === 'exclusive') {
      setPriceResult(calculateDoorPrice(doorForm, prices));
    } else if (activeTab === 'frame') {
      setPriceResult(calculateFramePrice(frameForm, prices));
    }
  }, [doorForm, frameForm, prices, activeTab]);

  // Auto-switch: SVL ไม่ได้สำหรับวงกบที่ไม่มีซับ
  useEffect(() => {
    if (activeTab === 'frame' && !isFrameWithSub(frameForm.frameMaterial) && frameForm.surfaceType === 'SVL') {
      setFrameForm(prev => ({ ...prev, surfaceType: 'TOA' }));
    }
  }, [frameForm.frameMaterial, activeTab]);

  // Auto-switch: SVL + molding ไม่ได้
  useEffect(() => {
    if (doorForm.surfaceType === 'SVL' && doorForm.molding !== 'none') {
      setDoorForm(prev => ({ ...prev, molding: 'none' }));
    }
  }, [doorForm.surfaceType]);

  const handlePriceUpdate = async (newPrices: PricingStructure) => {
    if (!db) return;
    try { await setDoc(doc(db, "config", "prices"), newPrices); alert("✅ บันทึกราคาเรียบร้อยแล้ว"); setShowAdminPanel(false); }
    catch { alert("❌ เกิดข้อผิดพลาดในการบันทึก"); }
  };

  // ✅ FIX #7: Input handlers แยกสำหรับ Door และ Frame
  const handleDoorInput = (field: keyof DoorFormData, value: any) => {
    if (field === 'customWidth' && Number(value) > 110) return;
    if (field === 'customHeight' && Number(value) > 240) return;
    setDoorForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFrameInput = (field: keyof FrameFormData, value: any) => {
    if (field === 'customWidth') {
      const w = Number(value);
      if (frameForm.frameMaterial === 'wpc_adjust_x' && w > 90) return;
      if (w > 180) return;
    }
    if (field === 'customHeight') {
      const h = Number(value);
      if ((frameForm.frameMaterial === 'wpc_4in_f10' || frameForm.frameMaterial === 'wpc_adjust_x') && h > 220) return;
      if (h > 240) return;
    }
    setFrameForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionToggle = (optionKey: string) =>
    setDoorForm(prev => ({ ...prev, options: { ...prev.options, [optionKey]: !prev.options[optionKey] } }));

  // ✅ FIX #6: Reset form เมื่อเปลี่ยน Tab
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'exclusive') setDoorForm(DEFAULT_DOOR_FORM);
    if (tabId === 'frame') setFrameForm(DEFAULT_FRAME_FORM);
  };

  const handleLogout = () => { sessionStorage.removeItem('upvc_session'); setCurrentUser(null); };

  const getFrameDisplayLabel = (key: string) => ({
    'wpc_4in_t2': 'วงกบไม้สังเคราะห์ 4" เหลี่ยม (T2) — สูงสุด 240cm',
    'wpc_4in_f10': 'วงกบไม้สังเคราะห์ 4" เหลี่ยม (F10) — สูงสุด 220cm',
    'wpc_adjust_eco': 'วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust Eco — สูงสุด 240cm',
    'wpc_adjust_x': 'วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust X — สูงสุด 220cm',
  }[key] || key);

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} isFirebaseReady={isFirebaseReady} permissionError={permissionError} />;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200">
              <img src="https://i.ibb.co/r2cZ0GYB/image.png" alt="Logo" className="w-full h-full object-cover"/>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">ระบบคำนวณราคาประตู uPVC</h1>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><User className="w-3 h-3"/> {currentUser.name} ({currentUser.role})</span>
              <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><LogOut className="w-3 h-3"/> ออกจากระบบ</button>
            </div>
            {currentUser.role === 'admin' && (
              <><button onClick={() => setShowUserPanel(true)} className="p-2.5 bg-white border rounded-lg shadow-sm hover:bg-slate-50 transition-colors"><Users className="w-4 h-4 text-blue-600"/></button>
              <button onClick={() => setShowAdminPanel(true)} className="p-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"><Settings className="w-4 h-4 text-yellow-400"/></button></>
            )}
          </div>
        </header>

        {showUserPanel && <UserManagementPanel currentUser={currentUser} onClose={() => setShowUserPanel(false)} />}
        {showAdminPanel && <AdminPriceEditor currentPrices={prices} onSave={handlePriceUpdate} onClose={() => setShowAdminPanel(false)} />}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex overflow-x-auto gap-2">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <tab.icon className="w-4 h-4"/> {tab.label}
                </button>
              ))}
            </div>

            {/* DOOR TAB */}
            {activeTab === 'exclusive' && (
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600"/> ข้อมูลโครงสร้างและขนาด (ประตู)</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">ประเภทการใช้งาน</label>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        {['ภายนอก', 'ภายใน'].map(t => (
                          <button key={t} disabled={t === 'ภายนอก'} onClick={() => handleDoorInput('type', t)}
                            className={`flex-1 py-2 text-sm rounded-md ${doorForm.type === t ? 'bg-white shadow text-blue-600 font-bold' : t === 'ภายนอก' ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500'}`}>{t}</button>
                        ))}
                      </div>
                      <label className="block text-sm font-medium text-slate-600 mt-4 mb-1">โครงสร้างวัสดุ</label>
                      <select value={doorForm.structure} onChange={(e) => handleDoorInput('structure', e.target.value)} className="w-full p-2.5 border rounded-lg">
                        <option value="uPVC">ประตู uPVC</option><option value="WPC RIGID">ประตู WPC RIGID</option><option value="WPC MAX">ประตู WPC MAX</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">ขนาดประตู</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[{id: '70x200cm', l: '70×200'}, {id: '80x200cm', l: '80×200'}, {id: '90x200cm', l: '90×200'}, {id: 'custom', l: 'Custom'}].map(s => (
                          <div key={s.id} onClick={() => handleDoorInput('sizeType', s.id)} className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${doorForm.sizeType === s.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200'}`}>{s.l}</div>
                        ))}
                      </div>
                      {doorForm.sizeType === 'custom' && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs text-slate-600">กว้าง (Max 110cm)</label><input type="number" value={doorForm.customWidth} onChange={(e) => handleDoorInput('customWidth', e.target.value)} className="w-full p-2 border rounded"/></div>
                            <div><label className="text-xs text-slate-600">สูง (Max 240cm)</label><input type="number" value={doorForm.customHeight} onChange={(e) => handleDoorInput('customHeight', e.target.value)} className="w-full p-2 border rounded"/></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-purple-600"/> สีและดีไซน์หน้าบาน</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      {['TOA', 'SVL'].map(t => (
                        <div key={t} onClick={() => handleDoorInput('surfaceType', t)} className={`p-4 rounded-lg border-2 cursor-pointer ${doorForm.surfaceType === t ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                          <label className="flex items-center gap-2 pointer-events-none"><div className={`w-4 h-4 rounded-full border-2 ${doorForm.surfaceType === t ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`}></div>{t === 'TOA' ? 'พ่นสี TOA' : 'ปิดผิว SVL'}</label>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">การเซาะร่อง</label>
                      <select value={doorForm.grooving} onChange={(e) => handleDoorInput('grooving', e.target.value)} className="w-full p-2.5 border rounded-lg">
                        <option value="none">ไม่เซาะร่อง</option><option value="standard">เซาะร่องปกติ</option>
                        <option value="black_line">เซาะร่องแปะเส้นดำ</option><option value="painted">เซาะร่องทำสี</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">ติดคิ้วพ่นสี</label>
                      <select value={doorForm.molding} onChange={(e) => handleDoorInput('molding', e.target.value)} disabled={doorForm.surfaceType === 'SVL'} className={`w-full p-2.5 border rounded-lg ${doorForm.surfaceType === 'SVL' ? 'bg-slate-100 text-slate-400' : ''}`}>
                        <option value="none">ไม่ติดคิ้ว</option><option value="first_1">First Class 1 ช่อง</option>
                        <option value="first_2">First Class 2 ช่อง</option><option value="roma_1">ROMA 1 ช่อง</option><option value="roma_2">ROMA 2 ช่อง</option>
                      </select>
                      {doorForm.surfaceType === 'SVL' && <p className="text-[10px] text-red-500 mt-1">* ปิดผิว SVL ไม่สามารถติดคิ้วได้</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">กระจก</label>
                      <select value={doorForm.glass} onChange={(e) => handleDoorInput('glass', e.target.value)} className="w-full p-2.5 border rounded-lg">
                        <option value="none">ไม่ติดกระจก</option><option value="frosted">กระจกฝ้าเต็มบาน</option>
                        <option value="frosted_half">กระจกฝ้าครึ่งบาน</option><option value="frosted_side">กระจกฝ้าข้าง</option>
                        <option value="green_full">กระจกเขียวตัดแสงเต็มบาน</option><option value="green_half">กระจกเขียวตัดแสงครึ่งบาน</option>
                        <option value="green_side">กระจกเขียวตัดแสงข้าง</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">เกล็ดระบายอากาศ</label>
                      <select value={doorForm.louver} onChange={(e) => handleDoorInput('louver', e.target.value)} className="w-full p-2.5 border rounded-lg">
                        <option value="none">ไม่ใส่เกล็ด</option><option value="full">เกล็ดเต็มบาน</option>
                        <option value="half">เกล็ดครึ่งบาน</option><option value="side">เกล็ดข้าง</option><option value="bottom">เกล็ดล่าง</option>
                        <option value="full_painted">เกล็ดเต็มบาน พ่นสี</option><option value="half_painted">เกล็ดครึ่งบาน พ่นสี</option>
                        <option value="side_painted">เกล็ดข้าง พ่นสี</option><option value="bottom_painted">เกล็ดล่าง พ่นสี</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-orange-600"/> การเจาะและเสริมโครง</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">เสริมโครง</label>
                      <select value={doorForm.reinforce} onChange={(e) => handleDoorInput('reinforce', e.target.value)} className="w-full p-2.5 border rounded-lg">
                        <option value="none">ไม่เสริมโครง</option><option value="lever">เสริมโครงก้านโยก</option>
                        <option value="digital">เสริมโครงดิจิตอลล็อก</option><option value="recessed">เสริมโครงมือจับฝัง</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">การเจาะลูกบิด</label>
                      <select value={doorForm.drilling} onChange={(e) => handleDoorInput('drilling', e.target.value)} className="w-full p-2.5 border rounded-lg">
                        <option value="none">ไม่เจาะลูกบิด</option><option value="knob">เจาะลูกบิด</option>
                        <option value="lever">เจาะก้านโยก</option><option value="digital">เจาะดิจิตอลล็อค</option><option value="recessed">เจาะมือจับฝัง</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-green-600"/> Option เสริม</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {k: 'shock_up', l: 'เสริมโครงติด SHOCK UP'}, {k: 'handle', l: 'เสริมโครงด้ามจับ'},
                      {k: 'sliding', l: 'เสริมโครงบานเลื่อน'}, {k: 'stopper', l: 'เสริมโครง Stopper'},
                      {k: 'peephole', l: 'เจาะตาแมว'}, {k: 'rabbet', l: 'ทำบังใบ'},
                      {k: 'knob_plate_40', l: 'เสริมโครงแป้นรอง 40cm'}, {k: 'wood_top_bottom', l: 'เสริมโครงไม้ บน/ล่าง'}
                    ].map(o => (
                      <label key={o.k} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="checkbox" checked={doorForm.options[o.k]} onChange={() => handleOptionToggle(o.k)} className="w-5 h-5 rounded text-blue-600"/>
                        <span className="text-sm text-slate-700 font-medium">{o.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FRAME TAB */}
            {activeTab === 'frame' && (
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Maximize className="w-5 h-5 text-blue-600"/> สเปควงกบ</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-600 mb-2">ประเภท/รุ่น ของวงกบ</label>
                      <select value={frameForm.frameMaterial} onChange={(e) => handleFrameInput('frameMaterial', e.target.value)} className="w-full p-3 border rounded-lg">
                        <optgroup label="--- ไม้สังเคราะห์ (WPC) ---">
                          <option value="wpc_4in_t2">วงกบไม้สังเคราะห์ 4 นิ้ว เหลี่ยม (T2) — สูงสุด 240cm</option>
                          <option value="wpc_4in_f10">วงกบไม้สังเคราะห์ 4 นิ้ว เหลี่ยม (F10) — สูงสุด 220cm</option>
                          <option value="wpc_adjust_eco">วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust Eco — สูงสุด 240cm</option>
                          <option value="wpc_adjust_x">วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust X — สูงสุด 220cm</option>
                        </optgroup>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-600 mb-2">ขนาดวงกบ (วัดใน)</label>
                      <div className="grid grid-cols-4 gap-3">
                        {[{id: '70x200cm', l: '70×200'}, {id: '80x200cm', l: '80×200'}, {id: '90x200cm', l: '90×200'}, {id: 'custom', l: 'Custom'}].map(s => (
                          <div key={s.id} onClick={() => handleFrameInput('sizeType', s.id)} className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${frameForm.sizeType === s.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200'}`}>{s.l}</div>
                        ))}
                      </div>
                      {frameForm.sizeType === 'custom' && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4 flex gap-4">
                          <div className="flex-1">
                            <label className="text-xs text-slate-600">กว้าง {frameForm.frameMaterial === 'wpc_adjust_x' ? <span className="text-red-500">(Max 90cm)</span> : <span className="text-red-500">(Max 180cm)</span>}</label>
                            <input type="number" value={frameForm.customWidth} onChange={(e) => handleFrameInput('customWidth', e.target.value)} className="w-full p-2 border rounded"/>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-slate-600">สูง {(frameForm.frameMaterial === 'wpc_4in_f10' || frameForm.frameMaterial === 'wpc_adjust_x') ? <span className="text-red-500">(Max 220cm)</span> : <span className="text-red-500">(Max 240cm)</span>}</label>
                            <input type="number" value={frameForm.customHeight} onChange={(e) => handleFrameInput('customHeight', e.target.value)} className="w-full p-2 border rounded"/>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-purple-600"/> สีวงกบ</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(['TOA', 'SVL', 'none'] as const).map(t => {
                      const canSVL = isFrameWithSub(frameForm.frameMaterial);
                      const disabled = t === 'SVL' && !canSVL;
                      return (
                        <div key={t} onClick={() => !disabled && handleFrameInput('surfaceType', t)}
                          className={`p-4 rounded-lg border-2 transition-all ${frameForm.surfaceType === t ? 'border-purple-500 bg-purple-50' : 'border-slate-200'} ${disabled ? 'opacity-40 cursor-not-allowed bg-slate-100' : 'cursor-pointer'}`}>
                          <label className="flex items-center gap-2 pointer-events-none">
                            <div className={`w-4 h-4 rounded-full border-2 ${frameForm.surfaceType === t ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`}></div>
                            <span className="text-sm">{t === 'TOA' ? 'พ่นสี TOA' : t === 'SVL' ? 'ปิดผิว SVL' : 'ไม่ทำสี (งานดิบ)'}</span>
                          </label>
                          {disabled && <p className="text-[10px] text-red-500 mt-1">* เฉพาะรุ่นที่มีซับ</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PRICE SUMMARY PANEL */}
          <div className="lg:w-96 shrink-0">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-8 overflow-hidden">
              <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2"><FileText className="w-5 h-5"/> สรุปรายการ ({activeTab === 'exclusive' ? 'ประตู' : 'วงกบ'})</h2>
              </div>

              {/* ✅ FIX #12: Loading State ขณะรอ Firestore */}
              {isPricesLoading ? (
                <div className="p-6 space-y-3">
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2"/>
                    <p className="text-sm text-slate-500">กำลังโหลดราคาจากฐานข้อมูล...</p>
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-slate-100 rounded animate-pulse"/>
                  ))}
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="text-center pb-6 border-b">
                    <p className="text-slate-500 text-sm mb-1">ราคาสุทธิ</p>
                    <div className="text-4xl font-bold text-blue-600">฿{priceResult.total.toLocaleString()}</div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {activeTab === 'exclusive' ? (
                      <>
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-900 font-bold">รายการที่เลือก</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">ประเภท</span><span className="font-medium">{doorForm.type}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">โครงสร้าง</span><span className="font-medium">{doorForm.structure}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">ขนาด</span><span className="font-medium">{doorForm.sizeType === 'custom' ? `${doorForm.customWidth}×${doorForm.customHeight} cm` : doorForm.sizeType}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">สี/ผิว</span><span className="font-medium">{doorForm.surfaceType}</span></div>
                        {doorForm.grooving !== 'none' && <div className="flex justify-between"><span className="text-slate-500">เซาะร่อง</span><span className="font-medium text-right">{LABEL_MAP[doorForm.grooving]}</span></div>}
                        {doorForm.molding !== 'none' && <div className="flex justify-between"><span className="text-slate-500">คิ้ว</span><span className="font-medium text-right">{LABEL_MAP[doorForm.molding]}</span></div>}
                        {doorForm.glass !== 'none' && <div className="flex justify-between"><span className="text-slate-500">กระจก</span><span className="font-medium text-right">{LABEL_MAP[doorForm.glass]}</span></div>}
                        {doorForm.louver !== 'none' && <div className="flex justify-between"><span className="text-slate-500">เกล็ด</span><span className="font-medium text-right">{LABEL_MAP[doorForm.louver]}</span></div>}
                        {doorForm.reinforce !== 'none' && <div className="flex justify-between"><span className="text-slate-500">เสริมโครง</span><span className="font-medium text-right">{LABEL_MAP[doorForm.reinforce]}</span></div>}
                        {doorForm.drilling !== 'none' && <div className="flex justify-between"><span className="text-slate-500">เจาะ</span><span className="font-medium text-right">{LABEL_MAP[doorForm.drilling]}</span></div>}
                        {Object.keys(doorForm.options).some(k => doorForm.options[k]) && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-slate-500 font-medium block mb-1">Option เสริม:</span>
                            <ul className="text-xs text-slate-700 space-y-1">
                              {Object.entries(doorForm.options).filter(([, v]) => v).map(([k]) => (
                                <li key={k} className="flex items-start gap-1"><Check className="w-3 h-3 text-green-500 mt-0.5"/>{LABEL_MAP[k] || k}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-900 font-bold">รายการที่เลือก</span></div>
                        <div className="flex justify-between items-start"><span className="text-slate-500 shrink-0">รุ่น</span><span className="font-medium text-right ml-4">{getFrameDisplayLabel(frameForm.frameMaterial)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">ขนาด</span><span className="font-medium">{frameForm.sizeType === 'custom' ? `${frameForm.customWidth}×${frameForm.customHeight} cm` : frameForm.sizeType}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">สี</span><span className="font-medium">{frameForm.surfaceType === 'none' ? 'ไม่ทำสี (งานดิบ)' : frameForm.surfaceType}</span></div>
                      </>
                    )}

                    {/* ✅ FIX #5: แสดง Surcharges ทั้งในส่วนประตูและวงกบ */}
                    {priceResult.surcharges.length > 0 && (
                      <div className="pt-3 border-t border-orange-100 bg-orange-50 -mx-6 px-6 py-3 mt-3">
                        <p className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1">
                          <Calculator className="w-3 h-3"/> ค่าเพิ่มพิเศษ (Surcharges):
                        </p>
                        <ul className="space-y-1">
                          {priceResult.surcharges.map((s, i) => (
                            <li key={i} className="text-xs text-orange-800 flex items-start gap-1">
                              <span className="text-orange-400 mt-0.5">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}