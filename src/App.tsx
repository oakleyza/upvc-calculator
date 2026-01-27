import React, { useState, useEffect } from 'react';
import { 
  Calculator, Check, DoorOpen, Layers, Maximize, Palette, Settings, 
  Grid, FileText, X, AlertCircle, LogOut, User,
  Users, Edit, Save, Trash2, Tag,
  Database, Hammer, LayoutDashboard
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
let app, db: any;
try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase init error", e);
}

// ------------------------------------------------------------------

// --- Types & Interfaces ---
interface PriceCategory { [key: string]: number; }
interface PricingStructure {
  // 🚪 หมวดประตู
  door_base: PriceCategory;     
  door_size: PriceCategory;     
  door_surface: PriceCategory;  
  
  // 🔲 หมวดวงกบ (แยกอิสระ)
  frame_base: PriceCategory;    
  frame_size: PriceCategory;    
  frame_surface: PriceCategory; 

  // 🛠️ หมวด Option
  grooving: PriceCategory; 
  molding: PriceCategory; 
  glass: PriceCategory;
  louver: PriceCategory; 
  reinforce: PriceCategory; 
  drilling: PriceCategory;
  options: PriceCategory;

  // Legacy Support
  structure?: PriceCategory;
  size?: PriceCategory;
  surface?: PriceCategory;
}

interface DoorOptions { [key: string]: boolean; }
interface DoorFormData {
  type: string; structure: string; sizeType: string; customWidth: string; customHeight: string;
  surfaceType: string; toaCode: string; svlCode: string; grooving: string; molding: string;
  glass: string; louver: string; reinforce: string; drilling: string; options: DoorOptions;
  frameMaterial: string; wallThickness: string; 
}
interface TabInfo { id: string; label: string; icon: React.ElementType; }
interface UserAccount { id: string; username: string; password: string; name: string; role: 'admin' | 'staff'; }

// ------------------------------------------------------------------
// 🏷️ LABEL MAPPING
// ------------------------------------------------------------------
const LABEL_MAP: {[key: string]: string} = {
  // --- Door Base ---
  'uPVC': 'โครงสร้าง uPVC',
  'WPC RIGID': 'โครงสร้าง WPC RIGID',
  'WPC MAX': 'โครงสร้าง WPC MAX',
  
  // --- Door Size ---
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

  // --- Door Surface ---
  'TOA_h200': 'สี TOA (สูงไม่เกิน 2.00m)',
  'TOA_h220': 'สี TOA (สูง 2.01-2.20m)',
  'TOA_h240': 'สี TOA (สูง 2.21-2.40m)',
  'SVL_h200': 'ผิว SVL (สูงไม่เกิน 2.00m)',
  'SVL_h220': 'ผิว SVL (สูง 2.01-2.20m)',
  'SVL_h240': 'ผิว SVL (สูง 2.21-2.40m)',

  // --- Option Labels ---
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

  // === 🔲 FRAME SPECIFIC KEYS ===
  
  // 1. T2 (Max 180x240)
  'wpc_4in_t2': 'วงกบไม้สังเคราะห์ 4" (T2)',
  't2_std_70': 'T2: มาตรฐาน 70x200',
  't2_std_80': 'T2: มาตรฐาน 80x200',
  't2_std_90': 'T2: มาตรฐาน 90x200',
  't2_w_71_80': 'T2: กว้าง 71-80cm',
  't2_w_81_89': 'T2: กว้าง 81-89cm',
  't2_w_90': 'T2: กว้าง 90cm',
  't2_w_91_140': 'T2: กว้าง 91-140cm',
  't2_w_141_180': 'T2: กว้าง 141-180cm',
  't2_h_201_220': 'T2: สูง 201-220cm',
  't2_h_221_240': 'T2: สูง 221-240cm',
  't2_h_under_200': 'T2: ค่าลดไซส์ (สูง < 2.00m)',
  't2_color_h200': 'T2: ทำสี (สูง<2.0m)',
  't2_color_h220': 'T2: ทำสี (สูง 2.0-2.2m)',
  't2_color_h240': 'T2: ทำสี (สูง 2.2-2.4m)',

  // 2. F10 (Max 180x220)
  'wpc_4in_f10': 'วงกบไม้สังเคราะห์ 4" (F10)',
  'f10_std_70': 'F10: มาตรฐาน 70x200',
  'f10_std_80': 'F10: มาตรฐาน 80x200',
  'f10_std_90': 'F10: มาตรฐาน 90x200',
  'f10_w_71_80': 'F10: กว้าง 71-80cm',
  'f10_w_81_90': 'F10: กว้าง 81-90cm',
  'f10_w_91_140': 'F10: กว้าง 91-140cm',
  'f10_w_141_180': 'F10: กว้าง 141-180cm',
  'f10_h_201_220': 'F10: สูง 201-220cm',
  'f10_h_under_200': 'F10: ค่าลดไซส์ (สูง < 2.00m)',
  'f10_color_h200': 'F10: ทำสี (สูง<2.0m)',
  'f10_color_h220': 'F10: ทำสี (สูง 2.0-2.2m)',

  // 3. Adjust X
  'wpc_adjust_x': 'วงกบ Adjust X (มีซับ)',
  'x_std_70': 'X: มาตรฐาน 70x200',
  'x_std_80': 'X: มาตรฐาน 80x200',
  'x_std_90': 'X: มาตรฐาน 90x200',
  'x_w_81_90': 'X: กว้าง 81-90cm',
  'x_w_91_140': 'X: กว้าง 91-140cm',
  'x_w_141_180': 'X: กว้าง 141-180cm',
  'x_h_201_210': 'X: สูง 201-210cm',
  'x_h_211_220': 'X: สูง 211-220cm',
  'x_h_221_240': 'X: สูง 221-240cm',
  'x_h_under_200': 'X: ค่าลดไซส์ (สูง < 2.00m)',
  
  // New Adjust X Surface Keys
  'x_toa_h_200': 'X: สี TOA (สูง<2.0m)',
  'x_toa_h_201_210': 'X: สี TOA (สูง 2.0-2.1m)',
  'x_toa_h_211_220': 'X: สี TOA (สูง 2.1-2.2m)',
  'x_toa_h_221_240': 'X: สี TOA (สูง 2.2-2.4m)',
  'x_svl_h_200': 'X: ผิว SVL (สูง<2.0m)',
  'x_svl_h_201_210': 'X: ผิว SVL (สูง 2.0-2.1m)',
  'x_svl_h_211_220': 'X: ผิว SVL (สูง 2.1-2.2m)',
  'x_svl_h_221_240': 'X: ผิว SVL (สูง 2.2-2.4m)',

  // 4. Adjust Eco
  'wpc_adjust_eco': 'วงกบ Adjust Eco (มีซับ)',
  'eco_std_70': 'Eco: มาตรฐาน 70x200',
  'eco_std_80': 'Eco: มาตรฐาน 80x200',
  'eco_std_90': 'Eco: มาตรฐาน 90x200',
  'eco_w_81_90': 'Eco: กว้าง 81-90cm',
  'eco_w_91_140': 'Eco: กว้าง 91-140cm',
  'eco_w_141_180': 'Eco: กว้าง 141-180cm',
  'eco_h_201_210': 'Eco: สูง 201-210cm',
  'eco_h_211_220': 'Eco: สูง 211-220cm',
  'eco_h_221_240': 'Eco: สูง 221-240cm',
  'eco_h_under_200': 'Eco: ค่าลดไซส์ (สูง < 2.00m)',
  'eco_toa_w_70_90': 'Eco: สี TOA กว้าง 70-90cm',
  'eco_toa_w_91_140': 'Eco: สี TOA กว้าง 91-140cm',
  'eco_toa_w_141_180': 'Eco: สี TOA กว้าง 141-180cm',
  'eco_svl_h_200_210': 'Eco: ผิว SVL สูง 200-210cm',
  'eco_svl_h_211_220': 'Eco: ผิว SVL สูง 211-220cm',
  'eco_svl_h_221_240': 'Eco: ผิว SVL สูง 221-240cm',
};

// ------------------------------------------------------------------
// 👥 Default Users
// ------------------------------------------------------------------
const DEFAULT_USERS: UserAccount[] = [
  { id: 'admin_01', username: 'admin', password: '1234', name: 'Administrator', role: 'admin' },
  { id: 'staff_01', username: 'staff01', password: '1234', name: 'General Staff', role: 'staff' }
];

// --- Default Prices (Independent Structure) ---
const DEFAULT_PRICES: PricingStructure = {
  // 🚪 --- ราคาประตู ---
  door_base: { 'uPVC': 3200, 'WPC RIGID': 3700, 'WPC MAX': 4500 },
  door_size: { 
    '70x200cm': 0, '80x200cm': 0, '90x200cm': 300, 'custom': 0, 
    'custom_w_81_89': 300, 'custom_w_90': 300, 'custom_w_91_100': 1900, 'custom_w_101_110': 2200,
    'custom_h_under_200': 200, 'custom_h_201_210': 400, 'custom_h_211_220': 999, 'custom_h_221_240': 999,
  },
  door_surface: { 
    'TOA_h200': 999,  'TOA_h220': 999,  'TOA_h240': 999,
    'SVL_h200': 999,  'SVL_h220': 999,  'SVL_h240': 999 
  },

  // 🔲 --- ราคาวงกบ (Base) ---
  frame_base: {
    'wpc_4in_t2': 900, 
    'wpc_4in_f10': 950,
    'wpc_adjust_x': 1200,
    'wpc_adjust_eco': 999
  },
  
  // 🔲 --- ราคาวงกบ (Surcharge Size) - แยกตามรุ่น ---
  frame_size: {
    '70x200cm': 0, '80x200cm': 0, '90x200cm': 0, 'custom': 0,

    // T2 Specifics
    't2_std_70': 0, 't2_std_80': 0, 't2_std_90': 0,
    't2_w_71_80': 0, 't2_w_81_89': 0, 't2_w_90': 0, 't2_w_91_140': 0, 't2_w_141_180': 0,
    't2_h_201_220': 0, 't2_h_221_240': 0,
    't2_h_under_200': 200,

    // F10 Specifics
    'f10_std_70': 0, 'f10_std_80': 0, 'f10_std_90': 0,
    'f10_w_71_80': 0, 'f10_w_81_90': 0, 'f10_w_91_140': 0, 'f10_w_141_180': 0,
    'f10_h_201_220': 0,
    'f10_h_under_200': 200,

    // Adjust X Specifics
    'x_std_70': 0, 'x_std_80': 0, 'x_std_90': 0, // NEW
    'x_w_81_90': 0, 'x_w_91_140': 0, 'x_w_141_180': 0,
    'x_h_201_210': 0, 'x_h_211_220': 0, 'x_h_221_240': 0,
    'x_h_under_200': 200,

    // Adjust Eco Specifics
    'eco_std_70': 0, 'eco_std_80': 0, 'eco_std_90': 0, // NEW
    'eco_w_81_90': 80, 'eco_w_91_140': 200, 'eco_w_141_180': 280,
    'eco_h_201_210': 200, 'eco_h_211_220': 400, 'eco_h_221_240': 600,
    'eco_h_under_200': 200,
  },

  // 🔲 --- ราคาวงกบ (Surface) - แยกตามรุ่น ---
  frame_surface: {
    'none': 0,
    
    // T2 Color
    't2_color_h200': 0, 't2_color_h220': 0, 't2_color_h240': 0,
    
    // F10 Color
    'f10_color_h200': 0, 'f10_color_h220': 0,

    // Adjust X Color (Changed to Height Based)
    'x_toa_h_200': 0, 'x_toa_h_201_210': 0, 'x_toa_h_211_220': 0, 'x_toa_h_221_240': 0,
    'x_svl_h_200': 0, 'x_svl_h_201_210': 0, 'x_svl_h_211_220': 0, 'x_svl_h_221_240': 0,
    // (Deprecated Width keys for X but kept for structure compatibility if needed)
    'x_toa_w_70_90': 0, 'x_toa_w_91_140': 0, 'x_toa_w_141_180': 0, 

    // Adjust Eco Color
    'eco_toa_w_70_90': 600, 'eco_toa_w_91_140': 720, 'eco_toa_w_141_180': 800,
    'eco_svl_h_200_210': 1200, 'eco_svl_h_211_220': 1500, 'eco_svl_h_221_240': 1700,
  },

  // Legacy & Options
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
  { id: 'standard', label: 'ประตู Standard', icon: Layers }, 
  { id: 'frame', label: 'วงกบ (Frame)', icon: Maximize },
  { id: 'architrave', label: 'บังราง (Architrave)', icon: Grid },
];

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

  // ✅ Fix 1: Handle undefined categories in state update
  const handlePriceChange = (category: keyof PricingStructure, key: string, val: string) => {
    const num = parseFloat(val);
    setLocalPrices(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}), 
        [key]: isNaN(num) ? 0 : num
      }
    }));
  };

  // ✅ Fix 2: Handle undefined values in render
  const renderInput = (category: keyof PricingStructure, key: string) => {
    const label = LABEL_MAP[key] || key; 
    if (key === 'custom') return null; 

    // Safe access using optional chaining and nullish coalescing
    const value = localPrices[category]?.[key] ?? 0;

    return (
      <div key={key} className="flex justify-between items-center p-2.5 border-b last:border-0 hover:bg-slate-50 transition-colors">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            value={value} 
            onChange={(e) => handlePriceChange(category, key, e.target.value)}
            className="w-20 p-1.5 text-right border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
          />
          <span className="text-xs text-slate-400">฿</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0 shadow-md z-10">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400">
            <Database className="w-5 h-5" /> จัดการราคากลาง
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 hover:text-red-400 transition-colors" /></button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 border-b p-2 gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'door', label: '🚪 ราคาประตู' },
            { id: 'frame_t2', label: '🔲 วงกบ T2' },
            { id: 'frame_f10', label: '🔲 วงกบ F10' },
            { id: 'frame_x', label: '✨ Adjust X' },
            { id: 'frame_eco', label: '✨ Adjust Eco' },
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveCategory(t.id as any)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeCategory === t.id 
                ? 'bg-white text-blue-700 shadow-sm border-t-2 border-blue-600' 
                : 'bg-transparent text-slate-500 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* --- DOOR TAB --- */}
          {activeCategory === 'door' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <h4 className="font-bold text-blue-700 mb-4 pb-2 border-b flex items-center gap-2"><Tag className="w-4 h-4"/> โครงสร้าง & ราคาตั้งต้น</h4>
                  {Object.keys(localPrices.door_base).map(k => renderInput('door_base', k))}
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <h4 className="font-bold text-orange-600 mb-4 pb-2 border-b flex items-center gap-2"><Maximize className="w-4 h-4"/> Surcharge ขนาดประตู</h4>
                  {Object.keys(localPrices.door_size).map(k => renderInput('door_size', k))}
                </div>
              </div>
              {/* Other door sections... */}
               <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h4 className="font-bold text-purple-600 mb-4 pb-2 border-b flex items-center gap-2"><Palette className="w-4 h-4"/> งานสี & ดีไซน์หน้าบาน</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ทำสี/ปิดผิว</h5>{Object.keys(localPrices.door_surface).map(k => renderInput('door_surface', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">เซาะร่อง</h5>{Object.keys(localPrices.grooving).map(k => renderInput('grooving', k))}</div>
                  <div><h5 className="text-sm font-bold text-slate-500 mb-2">ติดคิ้ว</h5>{Object.keys(localPrices.molding).map(k => renderInput('molding', k))}</div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-4 pb-2 border-b flex items-center gap-2"><Hammer className="w-4 h-4"/> การเจาะ & อุปกรณ์เสริม</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div><h5 className="text-sm font-bold text-slate-500 mb-2">ค่าเจาะ</h5>{Object.keys(localPrices.drilling).map(k => renderInput('drilling', k))}</div>
                   <div><h5 className="text-sm font-bold text-slate-500 mb-2">ค่าเสริมโครง</h5>{Object.keys(localPrices.reinforce).map(k => renderInput('reinforce', k))}</div>
                   <div><h5 className="text-sm font-bold text-slate-500 mb-2">Option อื่นๆ</h5>{Object.keys(localPrices.options).map(k => renderInput('options', k))}</div>
                </div>
              </div>
            </div>
          )}

          {/* --- FRAME T2 TAB --- */}
          {activeCategory === 'frame_t2' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4"><h4 className="font-bold text-blue-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> การตั้งค่า วงกบ T2 (Max 180x240)</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>{renderInput('frame_base', 'wpc_4in_t2')}{renderInput('frame_size', 't2_std_70')}{renderInput('frame_size', 't2_std_80')}{renderInput('frame_size', 't2_std_90')}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง (T2)</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('t2_w_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง (T2)</h4>
                    {Object.keys(localPrices.frame_size).filter(k => k.startsWith('t2_h_')).map(k => renderInput('frame_size', k))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี (T2)</h4>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('t2_color_')).map(k => renderInput('frame_surface', k))}</div>
              </div>
            </div>
          )}

          {/* --- FRAME F10 TAB --- */}
          {activeCategory === 'frame_f10' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-4"><h4 className="font-bold text-indigo-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> การตั้งค่า วงกบ F10 (Max 180x220)</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>{renderInput('frame_base', 'wpc_4in_f10')}{renderInput('frame_size', 'f10_std_70')}{renderInput('frame_size', 'f10_std_80')}{renderInput('frame_size', 'f10_std_90')}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง (F10)</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('f10_w_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง (F10)</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('f10_h_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี (F10)</h4>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('f10_color_')).map(k => renderInput('frame_surface', k))}</div>
              </div>
            </div>
          )}

          {/* --- FRAME ADJUST X TAB --- */}
          {activeCategory === 'frame_x' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4"><h4 className="font-bold text-yellow-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> การตั้งค่า Adjust X</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                    {renderInput('frame_base', 'wpc_adjust_x')}
                    {renderInput('frame_size', 'x_std_70')}
                    {renderInput('frame_size', 'x_std_80')}
                    {renderInput('frame_size', 'x_std_90')}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง (X)</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('x_w_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง (X)</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('x_h_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2"><h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี/ผิว (X) - คิดตามความสูง</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-orange-50 p-3 rounded"><h5 className="font-bold text-orange-800 text-sm mb-2">สี TOA (ความสูง)</h5>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('x_toa_h_')).map(k => renderInput('frame_surface', k))}</div>
                      <div className="bg-purple-50 p-3 rounded"><h5 className="font-bold text-purple-800 text-sm mb-2">ผิว SVL (ความสูง)</h5>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('x_svl_h_')).map(k => renderInput('frame_surface', k))}</div>
                   </div>
                </div>
              </div>
            </div>
          )}

           {/* --- FRAME ADJUST ECO TAB --- */}
           {activeCategory === 'frame_eco' && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4"><h4 className="font-bold text-green-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> การตั้งค่า Adjust Eco</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-slate-800 mb-3 pb-2 border-b">ราคาตั้งต้น & มาตรฐาน</h4>
                    {renderInput('frame_base', 'wpc_adjust_eco')}
                    {renderInput('frame_size', 'eco_std_70')}
                    {renderInput('frame_size', 'eco_std_80')}
                    {renderInput('frame_size', 'eco_std_90')}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความกว้าง (Eco)</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('eco_w_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border"><h4 className="font-bold text-orange-600 mb-3 pb-2 border-b">Surcharge ความสูง (Eco)</h4>{Object.keys(localPrices.frame_size).filter(k => k.startsWith('eco_h_')).map(k => renderInput('frame_size', k))}</div>
                <div className="bg-white p-4 rounded-lg shadow-sm border md:col-span-2"><h4 className="font-bold text-purple-600 mb-3 pb-2 border-b">ราคาทำสี/ผิว (Eco)</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-orange-50 p-3 rounded"><h5 className="font-bold text-orange-800 text-sm mb-2">สี TOA (คิดตามความกว้าง)</h5>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('eco_toa_')).map(k => renderInput('frame_surface', k))}</div>
                      <div className="bg-purple-50 p-3 rounded"><h5 className="font-bold text-purple-800 text-sm mb-2">ผิว SVL (คิดตามความสูง)</h5>{Object.keys(localPrices.frame_surface).filter(k => k.startsWith('eco_svl_')).map(k => renderInput('frame_surface', k))}</div>
                   </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] shrink-0 z-10">
          <button onClick={onClose} className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold transition-colors">ยกเลิก</button>
          <button onClick={() => onSave(localPrices)} className="px-8 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-colors">
            <Save className="w-5 h-5"/> บันทึกราคาใหม่
          </button>
        </div>
      </div>
    </div>
  );
};


// ------------------------------------------------------------------
// LOGIN & USER PANEL COMPONENT (UNCHANGED BUT INCLUDED FOR CONTEXT)
// ------------------------------------------------------------------
const LoginScreen = ({ onLogin, isFirebaseReady, permissionError }: { onLogin: (user: UserAccount) => void, isFirebaseReady: boolean, permissionError: boolean }) => {
  // ... (Login Code same as before) ...
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isFirebaseReady) {
      setError("ไม่สามารถเชื่อมต่อ Database ได้ กรุณาเช็ค Config");
      setLoading(false);
      return;
    }
    
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as UserAccount;
        localStorage.setItem('upvc_user', JSON.stringify(userData));
        onLogin(userData);
      } else {
        setError("Username หรือ Password ไม่ถูกต้อง");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') setError("สิทธิ์การเข้าถึงถูกปฏิเสธ (Permission Denied)");
      else setError("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-white flex items-center justify-center">
            <img src="https://i.ibb.co/r2cZ0GYB/image.png" alt="Logo กลางซอยค้าไม้" className="w-full h-full object-cover"/>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">ระบบคำนวนราคาประตู</h2>
        <h3 className="text-lg font-medium text-center text-blue-600 mb-6">-กลางซอยค้าไม้-</h3>
        {permissionError && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-xs rounded shadow-sm"><p className="font-bold text-sm mb-1">🚨 ตรวจพบปัญหา: Permission Denied</p><p className="mb-2">ฐานข้อมูลถูกล็อกอยู่ กรุณาแก้ Rules ใน Firebase Console</p></div>}
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Username" required /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" required /></div>
          <button type="submit" disabled={loading || !isFirebaseReady} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-blue-200">{loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}</button>
        </form>
      </div>
    </div>
  );
};

const UserManagementPanel = ({ onClose }: { onClose: () => void }) => {
  // ... (User Management Code same as before) ...
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserAccount | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const loadedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserAccount));
      setUsers(loadedUsers);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (editForm && db) {
      try { await setDoc(doc(db, "users", editForm.id), editForm); setEditingId(null); setEditForm(null); } catch (error) { alert("บันทึกไม่สำเร็จ"); }
    }
  };

  const handleCreateNew = async () => {
    if (!db) return;
    const newId = 'user_' + Date.now();
    const newUser: UserAccount = { id: newId, username: 'new_user', password: 'password', name: 'New Staff', role: 'staff' };
    try { await setDoc(doc(db, "users", newId), newUser); setEditingId(newId); setEditForm(newUser); } catch (error) { alert("สร้าง User ไม่สำเร็จ"); }
  };

  const handleDelete = async (id: string) => { if (confirm("ยืนยันการลบผู้ใช้งานนี้?") && db) await deleteDoc(doc(db, "users", id)); };
  const handleChange = (field: keyof UserAccount, value: string) => { if (editForm) setEditForm({ ...editForm, [field]: value }); };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0"><h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400"><Users className="w-5 h-5" /> จัดการข้อมูลผู้ใช้งาน</h3><button onClick={onClose}><X className="w-5 h-5 hover:text-red-400" /></button></div>
        <div className="p-6 bg-slate-50 overflow-y-auto grow">
          <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-slate-700">รายชื่อผู้ใช้ทั้งหมด</h4><button onClick={handleCreateNew} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">+ เพิ่มผู้ใช้ใหม่</button></div>
          {loading ? <div className="text-center py-8">Loading...</div> : (
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {editingId === u.id && editForm ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className="text-xs text-slate-500 font-bold">ชื่อ</label><input type="text" value={editForm.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full p-2 text-sm border rounded"/></div>
                      <div><label className="text-xs text-slate-500 font-bold">Username</label><input type="text" value={editForm.username} onChange={(e) => handleChange('username', e.target.value)} className="w-full p-2 text-sm border rounded"/></div>
                      <div><label className="text-xs text-slate-500 font-bold">Password</label><input type="text" value={editForm.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full p-2 text-sm border rounded"/></div>
                      <div><label className="text-xs text-slate-500 font-bold">Role</label><select value={editForm.role} onChange={(e) => handleChange('role', e.target.value as any)} className="w-full p-2 text-sm border rounded"><option value="admin">Admin</option><option value="staff">Staff</option></select></div>
                    </div>
                  ) : (
                    <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span><span className="font-bold text-slate-800">{u.name}</span></div><div className="text-sm text-slate-500">User: {u.username}</div></div>
                  )}
                  <div className="shrink-0 flex gap-2">
                    {editingId === u.id ? (<><button onClick={handleSave} className="p-2 bg-green-100 text-green-700 rounded"><Save className="w-4 h-4" /></button><button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded"><X className="w-4 h-4" /></button></>) : (<><button onClick={() => { setEditingId(u.id); setEditForm({...u}); }} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-blue-50 hover:text-blue-600"><Edit className="w-4 h-4" /></button>{u.username !== 'admin' && <button onClick={() => handleDelete(u.id)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}</>)}
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

// --- Main App ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('exclusive');
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [showUserPanel, setShowUserPanel] = useState<boolean>(false);
  
  const [prices, setPrices] = useState<PricingStructure>(DEFAULT_PRICES);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const [formData, setFormData] = useState<DoorFormData>({
    type: 'ภายใน', 
    structure: 'uPVC', sizeType: '70x200cm', customWidth: '', customHeight: '',
    surfaceType: 'TOA', toaCode: '', svlCode: 'SVL F-102', grooving: 'none', molding: 'none',
    glass: 'none', louver: 'none', reinforce: 'none', drilling: 'none',
    options: { shock_up: false, handle: false, sliding: false, stopper: false, peephole: false, rabbet: false, knob_plate_40: false, wood_top_bottom: false },
    frameMaterial: 'wpc_4in_t2', 
    wallThickness: 'standard'
  });
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [activeSurcharges, setActiveSurcharges] = useState<string[]>([]);

  // 0. Set Browser Title
  useEffect(() => { document.title = "ระบบคำนวณราคา - กลางซอยค้าไม้"; }, []);

  // 1. Initial Setup
  useEffect(() => {
    const savedUser = localStorage.getItem('upvc_user');
    if (savedUser) { try { setCurrentUser(JSON.parse(savedUser)); } catch (e) { localStorage.removeItem('upvc_user'); } }

    if (!db) return;
    setIsFirebaseReady(true);

    const initSystem = async () => {
      try {
        for (const u of DEFAULT_USERS) {
          const userRef = doc(db, "users", u.id);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) await setDoc(userRef, u);
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
        
        // ✅ MERGE LOGIC: Combine DEFAULT_PRICES with Firestore Data
        // This ensures new keys added to the code appear even if not in DB yet
        const mergedPrices = {
            ...DEFAULT_PRICES,
            ...firestoreData,
            // Manually merge nested objects to prevent overwriting
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
    }, (error) => {
      if (error.code === 'permission-denied') setPermissionError(true);
    });
    return () => unsub();
  }, []);

  const handlePriceUpdate = async (newPrices: PricingStructure) => {
    if (!db) return;
    try {
      await setDoc(doc(db, "config", "prices"), newPrices);
      alert("✅ บันทึกราคาเรียบร้อยแล้ว");
      setShowAdminPanel(false);
    } catch (error) {
      alert("❌ เกิดข้อผิดพลาดในการบันทึก");
      console.error(error);
    }
  };

  // Mapping Key to Label for Display in Summary and Logic
  const getFrameLabel = (key: string) => {
      const map: {[key:string]: string} = {
        'wpc_4in_t2': 'วงกบไม้สังเคราะห์ 4" เหลียม (T2)',
        'wpc_4in_f10': 'วงกบไม้สังเคราะห์ 4" เหลียม (F10)',
        'wpc_adjust_eco': 'วงกบไม้สังเคราะห์ มีซับ (Adjust Eco)',
        'wpc_adjust_x': 'วงกบไม้สังเคราะห์ มีซับ (Adjust X)',
      };
      return map[key] || key;
  };

  // Auto-switch logic
  useEffect(() => {
      if (activeTab === 'frame') {
          const label = getFrameLabel(formData.frameMaterial);
          if (!label.includes('มีซับ') && formData.surfaceType === 'SVL') {
              setFormData(prev => ({ ...prev, surfaceType: 'TOA' }));
          }
      }
  }, [formData.frameMaterial, activeTab, formData.surfaceType]);

  // 3. Logic คำนวณราคา
  useEffect(() => {
    let price = 0;
    let surcharges: string[] = [];

    // ✅ แยกการคำนวณตาม Tab ที่เลือก
    if (activeTab === 'exclusive' || activeTab === 'standard') {
        // --- 🚪 สูตรคำนวณประตู ---
        price += prices.door_base?.[formData.structure] || prices.structure?.[formData.structure] || 0;
        
        let height = 200; // Default height
        
        if (formData.sizeType === 'custom') {
            price += prices.door_size?.['custom'] || prices.size?.['custom'] || 0;
            const width = parseInt(formData.customWidth) || 0;
            const h = parseInt(formData.customHeight) || 0;
            height = h;

            const getDoorSizePrice = (key: string) => prices.door_size?.[key] || prices.size?.[key] || 0;

            if (width >= 81 && width <= 89) { price += getDoorSizePrice('custom_w_81_89'); surcharges.push(`กว้าง 81-89cm`); }
            else if (width === 90) { price += getDoorSizePrice('custom_w_90'); surcharges.push(`กว้าง 90cm`); }
            else if (width >= 91 && width <= 100) { price += getDoorSizePrice('custom_w_91_100'); surcharges.push(`กว้าง 91-100cm`); }
            else if (width >= 101 && width <= 110) { price += getDoorSizePrice('custom_w_101_110'); surcharges.push(`กว้าง 101-110cm`); }

            if (h < 200) { price += getDoorSizePrice('custom_h_under_200'); }
            else if (h >= 201 && h <= 210) { price += getDoorSizePrice('custom_h_201_210'); }
            else if (h >= 211 && h <= 220) { price += getDoorSizePrice('custom_h_211_220'); }
            else if (h >= 221 && h <= 240) { price += getDoorSizePrice('custom_h_221_240'); }
        } else { 
            price += prices.door_size?.[formData.sizeType] || prices.size?.[formData.sizeType] || 0; 
            height = 200;
        }
        
        let surfaceSuffix = '_h200';
        if (height >= 201 && height <= 220) surfaceSuffix = '_h220';
        else if (height >= 221) surfaceSuffix = '_h240';

        const surfaceKey = formData.surfaceType + surfaceSuffix;
        const surfacePrice = prices.door_surface?.[surfaceKey] || prices.surface?.[surfaceKey] || 0;
        price += surfacePrice;
        
        price += prices.grooving[formData.grooving] || 0;
        price += prices.molding[formData.molding] || 0;
        price += prices.glass[formData.glass] || 0;
        price += prices.louver[formData.louver] || 0;
        price += prices.reinforce[formData.reinforce] || 0;
        price += prices.drilling[formData.drilling] || 0;
        Object.keys(formData.options).forEach(key => { if (formData.options[key]) price += prices.options[key] || 0; });
    
    } else if (activeTab === 'frame') {
        // --- 🔲 สูตรคำนวณวงกบ (INDEPENDENT LOGIC) ---
        price += prices.frame_base?.[formData.frameMaterial] || 0;

        let height = 200;
        let width = 0;
        
        // Size extraction
        if (formData.sizeType === 'custom') {
             price += prices.frame_size?.['custom'] || 0;
             width = parseInt(formData.customWidth) || 0;
             height = parseInt(formData.customHeight) || 0;
        } else {
             const [wStr, hStr] = formData.sizeType.split('x');
             width = parseInt(wStr);
             height = parseInt(hStr);
        }

        const getSize = (k: string) => prices.frame_size?.[k] || 0;
        const getSurf = (k: string) => prices.frame_surface?.[k] || 0;

        // ============================================
        // 1. T2 SPECIFIC LOGIC
        // ============================================
        if (formData.frameMaterial === 'wpc_4in_t2') {
             // Standard Size Pricing
             if (formData.sizeType === '70x200cm') price += getSize('t2_std_70');
             else if (formData.sizeType === '80x200cm') price += getSize('t2_std_80');
             else if (formData.sizeType === '90x200cm') price += getSize('t2_std_90');
             
             // Custom Size Surcharges
             else if (formData.sizeType === 'custom') {
                 // Width Logic
                 if (width >= 71 && width <= 80) { price += getSize('t2_w_71_80'); surcharges.push('T2: กว้าง 71-80cm'); }
                 else if (width >= 81 && width <= 89) { price += getSize('t2_w_81_89'); surcharges.push('T2: กว้าง 81-89cm'); }
                 else if (width === 90) { price += getSize('t2_w_90'); surcharges.push('T2: กว้าง 90cm'); }
                 else if (width >= 91 && width <= 140) { price += getSize('t2_w_91_140'); surcharges.push('T2: กว้าง 91-140cm'); }
                 else if (width >= 141 && width <= 180) { price += getSize('t2_w_141_180'); surcharges.push('T2: กว้าง 141-180cm'); }

                 // Height Logic
                 if (height < 200) { price += getSize('t2_h_under_200'); surcharges.push('T2: ค่าลดไซส์ (สูง < 2.00m)'); }
                 else if (height >= 201 && height <= 220) { price += getSize('t2_h_201_220'); surcharges.push('T2: สูง 201-220cm'); }
                 else if (height >= 221 && height <= 240) { price += getSize('t2_h_221_240'); surcharges.push('T2: สูง 221-240cm'); }
             }
             
             // Surface T2
             if (formData.surfaceType !== 'none') {
                 if (height <= 200) price += getSurf('t2_color_h200');
                 else if (height <= 220) price += getSurf('t2_color_h220');
                 else price += getSurf('t2_color_h240');
             }
        }
        
        // ============================================
        // 2. F10 SPECIFIC LOGIC
        // ============================================
        else if (formData.frameMaterial === 'wpc_4in_f10') {
             // Standard Size Pricing
             if (formData.sizeType === '70x200cm') price += getSize('f10_std_70');
             else if (formData.sizeType === '80x200cm') price += getSize('f10_std_80');
             else if (formData.sizeType === '90x200cm') price += getSize('f10_std_90');
             
             // Custom Size Surcharges
             else if (formData.sizeType === 'custom') {
                 if (width >= 71 && width <= 80) { price += getSize('f10_w_71_80'); surcharges.push('F10: กว้าง 71-80cm'); }
                 else if (width >= 81 && width <= 90) { price += getSize('f10_w_81_90'); surcharges.push('F10: กว้าง 81-90cm'); }
                 else if (width >= 91 && width <= 140) { price += getSize('f10_w_91_140'); surcharges.push('F10: กว้าง 91-140cm'); }
                 else if (width >= 141 && width <= 180) { price += getSize('f10_w_141_180'); surcharges.push('F10: กว้าง 141-180cm'); }

                 if (height < 200) { price += getSize('f10_h_under_200'); surcharges.push('F10: ค่าลดไซส์ (สูง < 2.00m)'); }
                 else if (height >= 201 && height <= 220) { price += getSize('f10_h_201_220'); surcharges.push('F10: สูง 201-220cm'); }
             }

             // Surface F10 (Max height 220)
             if (formData.surfaceType !== 'none') {
                 if (height <= 200) price += getSurf('f10_color_h200');
                 else price += getSurf('f10_color_h220');
             }
        }

        // ============================================
        // 3. ADJUST X SPECIFIC LOGIC
        // ============================================
        else if (formData.frameMaterial === 'wpc_adjust_x') {
             // Handle Standard Sizes
             if (formData.sizeType === '70x200cm') price += getSize('x_std_70');
             else if (formData.sizeType === '80x200cm') price += getSize('x_std_80');
             else if (formData.sizeType === '90x200cm') price += getSize('x_std_90');

             // Handle Custom Sizes
             else if (formData.sizeType === 'custom') {
                 // Height Surcharges (Custom)
                 if (height < 200) { price += getSize('x_h_under_200'); surcharges.push('X: ค่าลดไซส์ (สูง < 2.00m)'); }
                 else if (height >= 201 && height <= 210) { price += getSize('x_h_201_210'); surcharges.push('X: สูง 201-210cm'); }
                 else if (height >= 211 && height <= 220) { price += getSize('x_h_211_220'); surcharges.push('X: สูง 211-220cm'); }
                 else if (height >= 221 && height <= 240) { price += getSize('x_h_221_240'); surcharges.push('X: สูง 221-240cm'); }

                 // Width Surcharges (Custom)
                 if (width >= 81 && width <= 90) { price += getSize('x_w_81_90'); surcharges.push('X: กว้าง 81-90cm'); }
                 else if (width >= 91 && width <= 140) { price += getSize('x_w_91_140'); surcharges.push('X: กว้าง 91-140cm'); }
                 else if (width >= 141 && width <= 180) { price += getSize('x_w_141_180'); surcharges.push('X: กว้าง 141-180cm'); }
             }

             // Surface X (Height Based for both TOA and SVL)
             // Note: Standard sizes have height=200, so they fall into the first bucket automatically
             if (formData.surfaceType === 'TOA') {
                if (height <= 200) price += getSurf('x_toa_h_200');
                else if (height <= 210) price += getSurf('x_toa_h_201_210');
                else if (height <= 220) price += getSurf('x_toa_h_211_220');
                else price += getSurf('x_toa_h_221_240');
             } else if (formData.surfaceType === 'SVL') {
                if (height <= 200) price += getSurf('x_svl_h_200');
                else if (height <= 210) price += getSurf('x_svl_h_201_210');
                else if (height <= 220) price += getSurf('x_svl_h_211_220');
                else price += getSurf('x_svl_h_221_240');
             }
        }

        // ============================================
        // 4. ADJUST ECO SPECIFIC LOGIC
        // ============================================
        else if (formData.frameMaterial === 'wpc_adjust_eco') {
             // Handle Standard Sizes
             if (formData.sizeType === '70x200cm') price += getSize('eco_std_70');
             else if (formData.sizeType === '80x200cm') price += getSize('eco_std_80');
             else if (formData.sizeType === '90x200cm') price += getSize('eco_std_90');

             // Handle Custom Sizes
             else if (formData.sizeType === 'custom') {
                 // Height Surcharges (Custom)
                 if (height < 200) { price += getSize('eco_h_under_200'); surcharges.push('Eco: ค่าลดไซส์ (สูง < 2.00m)'); }
                 else if (height >= 201 && height <= 210) { price += getSize('eco_h_201_210'); surcharges.push('Eco: สูง 201-210cm'); }
                 else if (height >= 211 && height <= 220) { price += getSize('eco_h_211_220'); surcharges.push('Eco: สูง 211-220cm'); }
                 else if (height >= 221 && height <= 240) { price += getSize('eco_h_221_240'); surcharges.push('Eco: สูง 221-240cm'); }

                 // Width Surcharges (Custom)
                 if (width >= 81 && width <= 90) { price += getSize('eco_w_81_90'); surcharges.push('Eco: กว้าง 81-90cm'); }
                 else if (width >= 91 && width <= 140) { price += getSize('eco_w_91_140'); surcharges.push('Eco: กว้าง 91-140cm'); }
                 else if (width >= 141 && width <= 180) { price += getSize('eco_w_141_180'); surcharges.push('Eco: กว้าง 141-180cm'); }
             }

             // Surface Eco (Standard Logic: TOA=Width, SVL=Height)
             // Note: Standard sizes have height=200 and specific widths (70,80,90)
             if (formData.surfaceType === 'TOA') {
                if (width >= 70 && width <= 90) price += getSurf('eco_toa_w_70_90');
                else if (width >= 91 && width <= 140) price += getSurf('eco_toa_w_91_140');
                else if (width >= 141 && width <= 180) price += getSurf('eco_toa_w_141_180');
             } else if (formData.surfaceType === 'SVL') {
                if (height >= 200 && height <= 210) price += getSurf('eco_svl_h_200_210'); // Standard sizes hit this (h=200)
                else if (height >= 211 && height <= 220) price += getSurf('eco_svl_h_211_220');
                else if (height >= 221 && height <= 240) price += getSurf('eco_svl_h_221_240');
             }
        }
    }
    
    setTotalPrice(price);
    setActiveSurcharges(surcharges);
  }, [formData, prices, activeTab]);

  const handleInputChange = (field: keyof DoorFormData, value: any) => {
    // Limits
    if (activeTab === 'exclusive') {
        if (field === 'customWidth' && Number(value) > 110) return;
        if (field === 'customHeight' && Number(value) > 240) return;
    }
    if (activeTab === 'frame') {
        if (field === 'customWidth' && Number(value) > 180) return; 
        
        // Height Limits per model
        if (field === 'customHeight') {
           const h = Number(value);
           if (formData.frameMaterial === 'wpc_4in_f10' && h > 220) return; // F10 Max 220
           if (h > 240) return; // General Max 240
        }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleOptionToggle = (optionKey: string) => setFormData(prev => ({ ...prev, options: { ...prev.options, [optionKey]: !prev.options[optionKey] } }));
  const handleLogout = () => { localStorage.removeItem('upvc_user'); setCurrentUser(null); };


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
          <div className="flex gap-2">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><User className="w-3 h-3"/> {currentUser.name} ({currentUser.role})</span>
              <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><LogOut className="w-3 h-3"/> ออกจากระบบ</button>
            </div>
            {currentUser.role === 'admin' && (
              <><button onClick={() => setShowUserPanel(true)} className="p-2.5 bg-white border rounded-lg shadow-sm"><Users className="w-4 h-4 text-blue-600"/></button>
                <button onClick={() => setShowAdminPanel(true)} className="p-2.5 bg-slate-800 text-white rounded-lg"><Settings className="w-4 h-4 text-yellow-400"/></button></>
            )}
          </div>
        </header>

        {showUserPanel && <UserManagementPanel onClose={() => setShowUserPanel(false)} />}
        
        {/* NEW ADMIN PANEL */}
        {showAdminPanel && (
           <AdminPriceEditor 
              currentPrices={prices} 
              onSave={handlePriceUpdate} 
              onClose={() => setShowAdminPanel(false)} 
           />
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex overflow-x-auto gap-2 no-scrollbar">
              {TABS.map((tab) => {
                const isDisabled = tab.id === 'architrave' || tab.id === 'standard'; 
                return (
                  <button key={tab.id} onClick={() => !isDisabled && setActiveTab(tab.id)} disabled={isDisabled}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : isDisabled ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* --- DOOR TAB CONTENT --- */}
            {activeTab === 'exclusive' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600"/> ข้อมูลโครงสร้างและขนาด (ประตู)</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">ประเภทการใช้งาน</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    {['ภายนอก', 'ภายใน'].map(t => {
                                      const isDis = t === 'ภายนอก';
                                      return (
                                        <button key={t} disabled={isDis} onClick={() => handleInputChange('type', t)}
                                          className={`flex-1 py-2 text-sm rounded-md ${formData.type === t ? 'bg-white shadow text-blue-600 font-bold' : isDis ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500'}`}>{t}</button>
                                      );
                                    })}
                                </div>
                                <label className="block text-sm font-medium text-slate-600 mt-4 mb-1">โครงสร้างวัสดุ</label>
                                <select value={formData.structure} onChange={(e) => handleInputChange('structure', e.target.value)} className="w-full p-2.5 border rounded-lg">
                                    <option value="uPVC">ประตู uPVC</option><option value="WPC RIGID">ประตู WPC RIGID</option><option value="WPC MAX">ประตู WPC MAX</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">ขนาดประตู</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[{id: '70x200cm', l: '70x200'}, {id: '80x200cm', l: '80x200'}, {id: '90x200cm', l: '90x200'}, {id: 'custom', l: 'Custom'}].map(s => (
                                        <div key={s.id} onClick={() => handleInputChange('sizeType', s.id)} className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${formData.sizeType === s.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200'}`}>{s.l}</div>
                                    ))}
                                </div>
                                {formData.sizeType === 'custom' && (
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="text-xs text-slate-600">กว้าง (Max 110cm)</label><input type="number" value={formData.customWidth} onChange={(e) => handleInputChange('customWidth', e.target.value)} className="w-full p-2 border rounded"/></div>
                                            <div><label className="text-xs text-slate-600">สูง (Max 240cm)</label><input type="number" value={formData.customHeight} onChange={(e) => handleInputChange('customHeight', e.target.value)} className="w-full p-2 border rounded"/></div>
                                        </div>
                                        {activeSurcharges.map((s, i) => <div key={i} className="text-xs text-orange-700 mt-1">{s}</div>)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-purple-600"/> สีและดีไซน์หน้าบาน</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                                <div onClick={() => handleInputChange('surfaceType', 'TOA')} className={`p-4 rounded-lg border-2 cursor-pointer ${formData.surfaceType === 'TOA' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                                    <label className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border ${formData.surfaceType === 'TOA' ? 'bg-purple-500' : ''}`}></div>พ่นสี TOA</label>
                                </div>
                                <div onClick={() => handleInputChange('surfaceType', 'SVL')} className={`p-4 rounded-lg border-2 cursor-pointer ${formData.surfaceType === 'SVL' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                                    <label className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border ${formData.surfaceType === 'SVL' ? 'bg-purple-500' : ''}`}></div>ปิดผิว SVL</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">การเซาะร่อง</label>
                                <select value={formData.grooving} onChange={(e) => handleInputChange('grooving', e.target.value)} className="w-full p-2.5 border rounded-lg">
                                    <option value="none">ไม่เซาะร่อง</option>
                                    <option value="standard">เซาะร่องปกติ</option>
                                    <option value="black_line">เซาะร่องแปะเส้นดำ</option>
                                    <option value="painted">เซาะร่องทำสี</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">ติดคิ้วพ่นสี</label>
                                <select value={formData.molding} onChange={(e) => handleInputChange('molding', e.target.value)} className="w-full p-2.5 border rounded-lg">
                                    <option value="none">ไม่ติดคิ้ว</option>
                                    <option value="first_1">First Class 1 ช่อง</option>
                                    <option value="first_2">First Class 2 ช่อง</option>
                                    <option value="roma_1">ROMA 1 ช่อง</option>
                                    <option value="roma_2">ROMA 2 ช่อง</option>
                                </select>
                            </div>
                            <div><label className="block text-sm font-medium text-slate-600 mb-1">กระจก</label>
                              <select value={formData.glass} onChange={(e) => handleInputChange('glass', e.target.value)} className="w-full p-2.5 border rounded-lg">
                                <option value="none">ไม่ติดกระจก</option>
                                <option value="frosted">กระจกฝ้าเต็มบาน</option>
                                <option value="frosted_half">กระจกฝ้าครึ่งบาน</option>
                                <option value="frosted_side">กระจกฝ้าข้าง</option>
                                <option value="green_full">กระจกเขียวตัดแสงเต็มบาน</option>
                                <option value="green_half">กระจกเขียวตัดแสงครึ่งบาน</option>
                                <option value="green_side">กระจกเขียวตัดแสงข้าง</option>
                              </select>
                            </div>
                            <div><label className="block text-sm font-medium text-slate-600 mb-1">เกล็ดระบายอากาศ</label>
                              <select value={formData.louver} onChange={(e) => handleInputChange('louver', e.target.value)} className="w-full p-2.5 border rounded-lg">
                                <option value="none">ไม่ใส่เกล็ด</option>
                                <option value="full">เกล็ดเต็มบาน</option>
                                <option value="half">เกล็ดครึ่งบาน</option>
                                <option value="side">เกล็ดข้าง</option>
                                <option value="bottom">เกล็ดล่าง</option>
                                <option value="full_painted">เกล็ดเต็มบาน พ่นสี</option>
                                <option value="half_painted">เกล็ดครึ่งบาน พ่นสี</option>
                                <option value="side_painted">เกล็ดข้าง พ่นสี</option>
                                <option value="bottom_painted">เกล็ดล่าง พ่นสี</option>
                              </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-orange-600"/> การเจาะและเสริมโครง</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-sm font-medium text-slate-600 mb-1">เสริมโครง</label>
                              <select value={formData.reinforce} onChange={(e) => handleInputChange('reinforce', e.target.value)} className="w-full p-2.5 border rounded-lg">
                                <option value="none">ไม่เสริมโครง</option>
                                <option value="lever">เสริมโครงก้านโยก</option>
                                <option value="digital">เสริมโครงดิจิตอลล็อก</option>
                                <option value="recessed">เสริมโครงมือจับฝัง</option>
                              </select>
                            </div>
                            <div><label className="block text-sm font-medium text-slate-600 mb-1">การเจาะลูกบิด</label>
                              <select value={formData.drilling} onChange={(e) => handleInputChange('drilling', e.target.value)} className="w-full p-2.5 border rounded-lg">
                                <option value="none">ไม่เจาะลูกบิด</option>
                                <option value="knob">เจาะลูกบิด</option>
                                <option value="lever">เจาะก้านโยก</option>
                                <option value="digital">เจาะดิจิตอลล็อค</option>
                                <option value="recessed">เจาะมือจับฝัง</option>
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
                                    <input type="checkbox" checked={formData.options[o.k]} onChange={() => handleOptionToggle(o.k)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"/>
                                    <span className="text-sm text-slate-700 font-medium">{o.l}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- FRAME TAB CONTENT --- */}
            {activeTab === 'frame' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Maximize className="w-5 h-5 text-blue-600"/> สเปควงกบ</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                            {/* วัสดุวงกบ */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-2">ประเภท/รุ่น ของวงกบ</label>
                                <select value={formData.frameMaterial} onChange={(e) => handleInputChange('frameMaterial', e.target.value)} className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-slate-700">
                                    <optgroup label="--- ไม้สังเคราะห์ (WPC) ---">
                                        <option value="wpc_4in_t2">วงกบไม้สังเคราะห์ 4 นิ้ว เหลียม (T2)</option>
                                        <option value="wpc_4in_f10">วงกบไม้สังเคราะห์ 4 นิ้ว เหลียม (F10)</option>
                                        <option value="wpc_adjust_eco">วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust Eco</option>
                                        <option value="wpc_adjust_x">วงกบไม้สังเคราะห์ มีซับ รุ่น Adjust X</option>
                                    </optgroup>
                                </select>
                            </div>

                             {/* ขนาด */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-2">ขนาดวงกบ (วัดใน)</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[{id: '70x200cm', l: '70x200'}, {id: '80x200cm', l: '80x200'}, {id: '90x200cm', l: '90x200'}, {id: 'custom', l: 'Custom'}].map(s => (
                                        <div key={s.id} onClick={() => handleInputChange('sizeType', s.id)} className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${formData.sizeType === s.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200'}`}>{s.l}</div>
                                    ))}
                                </div>
                                {formData.sizeType === 'custom' && (
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4 flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-slate-600">กว้าง {formData.frameMaterial === 'wpc_4in_t2' && <span className="text-red-500">(Max 180)</span>}</label>
                                            <input type="number" value={formData.customWidth} onChange={(e) => handleInputChange('customWidth', e.target.value)} className="w-full p-2 border rounded"/>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-slate-600">สูง {formData.frameMaterial === 'wpc_4in_t2' && <span className="text-red-500">(Max 240)</span>}{formData.frameMaterial === 'wpc_4in_f10' && <span className="text-red-500">(Max 220)</span>}</label>
                                            <input type="number" value={formData.customHeight} onChange={(e) => handleInputChange('customHeight', e.target.value)} className="w-full p-2 border rounded"/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-purple-600"/> สีวงกบ</h3>
                        <div className="grid grid-cols-2 gap-4">
                                <div onClick={() => handleInputChange('surfaceType', 'TOA')} className={`p-4 rounded-lg border-2 cursor-pointer ${formData.surfaceType === 'TOA' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                                    <label className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border ${formData.surfaceType === 'TOA' ? 'bg-purple-500' : ''}`}></div>พ่นสี TOA</label>
                                </div>
                                {(() => {
                                    const canDoSVL = getFrameLabel(formData.frameMaterial).includes('มีซับ');
                                    return (
                                        <div 
                                            onClick={() => canDoSVL && handleInputChange('surfaceType', 'SVL')} 
                                            className={`p-4 rounded-lg border-2 relative overflow-hidden transition-all ${
                                                formData.surfaceType === 'SVL' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
                                            } ${!canDoSVL ? 'opacity-50 cursor-not-allowed grayscale bg-slate-100' : 'cursor-pointer'}`}
                                        >
                                            <label className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border ${formData.surfaceType === 'SVL' ? 'bg-purple-500' : ''}`}></div>ปิดผิว SVL</label>
                                            {!canDoSVL && <div className="text-[10px] text-red-500 mt-1">* เฉพาะรุ่นที่มีซับ</div>}
                                        </div>
                                    );
                                })()}
                                <div onClick={() => handleInputChange('surfaceType', 'none')} className={`p-4 rounded-lg border-2 cursor-pointer ${formData.surfaceType === 'none' ? 'border-gray-500 bg-gray-50' : 'border-slate-200'}`}>
                                    <label className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border ${formData.surfaceType === 'none' ? 'bg-gray-500' : ''}`}></div><span className="text-gray-700">ไม่ทำสี (งานดิบ)</span></label>
                                </div>
                        </div>
                    </div>
                </div>
            )}
          </div>

          <div className="lg:w-96 shrink-0">
             <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-8 overflow-hidden">
                <div className="bg-slate-800 p-4 text-white flex items-center justify-between"><h2 className="font-semibold flex items-center gap-2"><FileText className="w-5 h-5" /> สรุปรายการ ({activeTab === 'exclusive' ? 'ประตู' : 'วงกบ'})</h2></div>
                <div className="p-6 space-y-6">
                  <div className="text-center pb-6 border-b"><p className="text-slate-500 text-sm mb-1">ราคาสุทธิ</p><div className="text-4xl font-bold text-blue-600">฿{totalPrice.toLocaleString()}</div></div>
                  <div className="space-y-3 text-sm">
                    {activeTab === 'exclusive' ? (
                        <>
                            <div className="flex justify-between"><span className="text-slate-500">โครงสร้าง</span><span className="font-medium">{formData.structure}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">ขนาด</span><span className="font-medium">{formData.sizeType === 'custom' ? `${formData.customWidth}x${formData.customHeight}` : formData.sizeType}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">สี</span><span className="font-medium">{formData.surfaceType}</span></div>
                        </>
                    ) : (
                        <>
                             {/* สรุปของวงกบ */}
                             <div className="flex justify-between items-start">
                                <span className="text-slate-500 shrink-0">รุ่น</span>
                                <span className="font-medium text-right ml-4">{getFrameLabel(formData.frameMaterial)}</span>
                             </div>
                             <div className="flex justify-between"><span className="text-slate-500">ขนาด</span><span className="font-medium">{formData.sizeType === 'custom' ? `${formData.customWidth}x${formData.customHeight}` : formData.sizeType}</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">สี</span><span className="font-medium">{formData.surfaceType === 'none' ? 'ไม่ทำสี (งานดิบ)' : formData.surfaceType}</span></div>
                             
                             {/* แสดง Surcharges ของวงกบ */}
                             {activeSurcharges.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                   <span className="text-xs text-slate-400 block mb-1">รายละเอียดราคาเพิ่มเติม:</span>
                                   {activeSurcharges.map((s, i) => (
                                     <div key={i} className="flex justify-between text-xs text-orange-600">
                                       <span>- {s}</span>
                                     </div>
                                   ))}
                                </div>
                             )}
                        </>
                    )}
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}