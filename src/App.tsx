import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { 
  Calculator, 
  Check, 
  DoorOpen, 
  Layers, 
  Maximize, 
  Palette, 
  Settings, 
  ShoppingCart, 
  Grid,
  FileText,
  Upload,
  Download,
  X,
  AlertCircle
} from 'lucide-react';

// --- Types & Interfaces ---
interface PriceCategory {
  [key: string]: number;
}

interface PricingStructure {
  structure: PriceCategory;
  size: PriceCategory;
  surface: PriceCategory;
  grooving: PriceCategory;
  molding: PriceCategory;
  glass: PriceCategory;
  louver: PriceCategory;
  reinforce: PriceCategory;
  drilling: PriceCategory;
  options: PriceCategory;
}

interface DoorOptions {
  [key: string]: boolean;
}

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

interface TabInfo {
  id: string;
  label: string;
  icon: React.ElementType;
}

// --- Default Prices (ราคาเริ่มต้น) ---
const DEFAULT_PRICES: PricingStructure = {
  structure: {
    'uPVC': 2500,
    'WPC RIGID': 3500,
    'WPC MAX': 4500,
  },
  size: {
    '70x200cm': 0,
    '80x200cm': 200,
    '90x200cm': 400,
    'custom': 1000, // ค่าดำเนินการพื้นฐาน (Base Fee)
    
    // Width Ranges (Max 95)
    'custom_w_81_89': 300,
    'custom_w_91_95': 500,
    
    // Height Ranges (Max 240)
    'custom_h_201_210': 400,
    'custom_h_211_220': 600,
    'custom_h_221_240': 1000,
  },
  surface: {
    'TOA': 500,
    'SVL': 800,
  },
  grooving: {
    'none': 0,
    'standard': 300,
    'black_line': 400,
    'painted': 500,
  },
  molding: {
    'none': 0,
    'first_1': 800,
    'first_2': 1000,
    'roma_1': 900,
    'roma_2': 1100,
  },
  glass: {
    'none': 0,
    'frosted': 1500,
  },
  louver: {
    'none': 0,
    'full': 1200,
  },
  reinforce: {
    'none': 0,
    'lever': 300,
  },
  drilling: {
    'none': 0,
    'knob': 100,
  },
  options: {
    'shock_up': 200,
    'handle': 150,
    'sliding': 400,
    'stopper': 100,
    'peephole': 150,
    'rabbet': 250,
    'knob_plate_40': 100,
    'wood_top_bottom': 300,
  }
};

const TABS: TabInfo[] = [
  { id: 'exclusive', label: 'ประตู Exclusive', icon: DoorOpen },
  { id: 'standard', label: 'ประตู Standard', icon: Layers },
  { id: 'frame', label: 'วงกบ (Frame)', icon: Maximize },
  { id: 'architrave', label: 'บังราง (Architrave)', icon: Grid },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('exclusive');
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Prices State
  const [prices, setPrices] = useState<PricingStructure>(DEFAULT_PRICES);
  
  // State for Exclusive Door
  const [formData, setFormData] = useState<DoorFormData>({
    type: 'ภายนอก',
    structure: 'uPVC',
    sizeType: '70x200cm',
    customWidth: '',
    customHeight: '',
    surfaceType: 'TOA',
    toaCode: '',
    svlCode: 'SVL F-102',
    grooving: 'none',
    molding: 'none',
    glass: 'none',
    louver: 'none',
    reinforce: 'none',
    drilling: 'none',
    options: {
      shock_up: false,
      handle: false,
      sliding: false,
      stopper: false,
      peephole: false,
      rabbet: false,
      knob_plate_40: false,
      wood_top_bottom: false,
    }
  });

  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [activeSurcharges, setActiveSurcharges] = useState<string[]>([]);

  // --- Handlers ---
  const handleInputChange = (field: keyof DoorFormData, value: any) => {
    // Input Limitation Logic
    if (field === 'customWidth') {
       const num = Number(value);
       if (num > 95) return; // Limit width to 95
    }
    if (field === 'customHeight') {
       const num = Number(value);
       if (num > 240) return; // Limit height to 240
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionToggle = (optionKey: string) => {
    setFormData(prev => ({
      ...prev,
      options: { ...prev.options, [optionKey]: !prev.options[optionKey] }
    }));
  };

  const handleIntegerInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '.' || e.key === ',' || e.key === '-') e.preventDefault();
  };

  // --- CSV Import/Export Logic ---
  
  const handleDownloadTemplate = () => {
    const csvHeader = "Category,Key,Description,Price\n";
    // Add new range keys to the CSV (Removed Oversize keys)
    const csvRows = `structure,uPVC,ราคาตั้งต้น ประตู uPVC,2500
structure,WPC RIGID,ราคาตั้งต้น ประตู WPC RIGID,3500
structure,WPC MAX,ราคาตั้งต้น ประตู WPC MAX,4500
size,70x200cm,ขนาด 70x200cm (ราคาบวกเพิ่ม),0
size,80x200cm,ขนาด 80x200cm (ราคาบวกเพิ่ม),200
size,90x200cm,ขนาด 90x200cm (ราคาบวกเพิ่ม),400
size,custom,ขนาดสั่งทำพิเศษ (ค่าดำเนินการพื้นฐาน),1000
size,custom_w_81_89,Surcharge กว้าง 81-89cm,300
size,custom_w_91_95,Surcharge กว้าง 91-95cm,500
size,custom_h_201_210,Surcharge สูง 201-210cm,400
size,custom_h_211_220,Surcharge สูง 211-220cm,600
size,custom_h_221_240,Surcharge สูง 221-240cm,1000
surface,TOA,งานสี TOA (ราคาเหมาต่อบาน),500
surface,SVL,งานปิดผิว SVL (ราคาเหมาต่อบาน),800
grooving,none,ไม่เซาะร่อง,0
grooving,standard,เซาะร่องมาตรฐาน,300
grooving,black_line,เซาะร่องเส้นดำ,400
grooving,painted,เซาะร่องทำสี,500
molding,none,ไม่ติดคิ้ว,0
molding,first_1,คิ้ว First Class 1 ช่อง,800
molding,first_2,คิ้ว First Class 2 ช่อง,1000
molding,roma_1,คิ้ว ROMA 1 ช่อง,900
molding,roma_2,คิ้ว ROMA 2 ช่อง,1100
glass,none,ไม่ติดกระจก,0
glass,frosted,กระจกฝ้าเต็มบาน,1500
louver,none,ไม่ติดเกล็ด,0
louver,full,เกล็ดเต็มบาน,1200
reinforce,none,ไม่เสริมโครง,0
reinforce,lever,เสริมโครงก้านโยก,300
drilling,none,ไม่เจาะลูกบิด,0
drilling,knob,เจาะลูกบิด,100
option,shock_up,เสริมโครง SHOCK UP,200
option,handle,เสริมโครงด้ามจับ,150
option,sliding,เสริมโครงบานเลื่อน,400
option,stopper,เสริมโครง Stopper,100
option,peephole,เจาะตาแมว,150
option,rabbet,ทำบังใบ,250
option,knob_plate_40,เสริมโครงแป้นรอง 40cm,100
option,wood_top_bottom,เสริมโครงไม้ บน/ล่าง,300`;

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "price_template_v4_limited.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      const newPrices: PricingStructure = JSON.parse(JSON.stringify(DEFAULT_PRICES));
      
      let updatedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 4) {
          const category = parts[0].trim();
          const key = parts[1].trim();
          const priceRaw = parts[3].trim();
          const price = parseFloat(priceRaw);

          if (!isNaN(price)) {
            // Type safe check
            if (category in newPrices && category !== 'options') {
               const cat = category as keyof Omit<PricingStructure, 'options'>;
               if (newPrices[cat][key] !== undefined) {
                   newPrices[cat][key] = price;
                   updatedCount++;
               }
            } else if (category === 'option') { // CSV uses 'option' (singular), state uses 'options' (plural)
                if (newPrices.options && newPrices.options[key] !== undefined) {
                    newPrices.options[key] = price;
                    updatedCount++;
                }
            }
          }
        }
      }
      
      setPrices(newPrices);
      alert(`อัปเดตราคาเรียบร้อยแล้ว (${updatedCount} รายการ)`);
      setShowAdminPanel(false);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // --- Pricing Logic ---
  useEffect(() => {
    let price = 0;
    let surcharges: string[] = [];

    // 1. Structure Base Price
    price += prices.structure[formData.structure] || 0;

    // 2. Size Price
    if (formData.sizeType === 'custom') {
      price += prices.size['custom'];
      
      const width = parseInt(formData.customWidth) || 0;
      const height = parseInt(formData.customHeight) || 0;

      // --- Width Logic ---
      if (width >= 81 && width <= 89) {
        price += prices.size['custom_w_81_89'];
        surcharges.push(`กว้าง 81-89cm (ชาร์จเพิ่ม)`);
      } else if (width >= 91 && width <= 95) {
        price += prices.size['custom_w_91_95'];
        surcharges.push(`กว้าง 91-95cm (ชาร์จเพิ่ม)`);
      } 

      // --- Height Logic ---
      if (height >= 201 && height <= 210) {
        price += prices.size['custom_h_201_210'];
        surcharges.push(`สูง 201-210cm (ชาร์จเพิ่ม)`);
      } else if (height >= 211 && height <= 220) {
        price += prices.size['custom_h_211_220'];
        surcharges.push(`สูง 211-220cm (ชาร์จเพิ่ม)`);
      } else if (height >= 221 && height <= 240) {
        price += prices.size['custom_h_221_240'];
        surcharges.push(`สูง 221-240cm (ชาร์จเพิ่ม)`);
      }

    } else {
      price += prices.size[formData.sizeType] || 0;
    }

    // 3. Surface Price
    if (formData.surfaceType === 'TOA') {
      price += prices.surface['TOA'] || 0;
    } else if (formData.surfaceType === 'SVL') {
      price += prices.surface['SVL'] || 0;
    }

    // 4. Add-ons (Type assertion for dynamic access)
    price += prices.grooving[formData.grooving] || 0;
    price += prices.molding[formData.molding] || 0;
    price += prices.glass[formData.glass] || 0;
    price += prices.louver[formData.louver] || 0;
    price += prices.reinforce[formData.reinforce] || 0;
    price += prices.drilling[formData.drilling] || 0;

    // 5. Options
    Object.keys(formData.options).forEach(key => {
      if (formData.options[key]) {
        price += prices.options[key] || 0;
      }
    });

    setTotalPrice(price);
    setActiveSurcharges(surcharges);
  }, [formData, prices]);


  // --- Render Components ---

  const renderExclusiveForm = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Group 1: ข้อมูลพื้นฐาน */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" /> ข้อมูลโครงสร้างและขนาด
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ประเภท & โครงสร้าง */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">ประเภทการใช้งาน</label>
            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
              {['ภายนอก', 'ภายใน'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleInputChange('type', type)}
                  className={`flex-1 py-2 text-sm rounded-md transition-all ${
                    formData.type === type ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-slate-600 mb-1">โครงสร้างวัสดุ</label>
            <select 
              value={formData.structure}
              onChange={(e) => handleInputChange('structure', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="uPVC">ประตู uPVC</option>
              <option value="WPC RIGID">ประตู WPC RIGID</option>
              <option value="WPC MAX">ประตู WPC MAX</option>
            </select>
          </div>

          {/* ขนาด */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">ขนาดประตู</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                {id: '70x200cm', label: '70x200cm'},
                {id: '80x200cm', label: '80x200cm'},
                {id: '90x200cm', label: '90x200cm'},
                {id: 'custom', label: 'อื่นๆ (Custom)'}
              ].map((size) => (
                <div 
                  key={size.id}
                  onClick={() => handleInputChange('sizeType', size.id)}
                  className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
                    formData.sizeType === size.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' 
                      : 'border-slate-200 hover:border-blue-300 text-slate-600'
                  }`}
                >
                  <div className="text-sm">{size.label}</div>
                </div>
              ))}
            </div>
            
            {/* Custom Input Logic UI */}
            {formData.sizeType === 'custom' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 animate-in fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-600 font-medium">กว้าง (Max 95cm)</label>
                    <input 
                      type="number" 
                      step="1"
                      min={1}
                      max={95}
                      placeholder="เช่น 95"
                      value={formData.customWidth}
                      onKeyDown={handleIntegerInput}
                      onChange={(e) => handleInputChange('customWidth', e.target.value)}
                      className="w-full mt-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 font-medium">สูง (Max 240cm)</label>
                    <input 
                      type="number" 
                      step="1"
                      min={1}
                      max={240}
                      placeholder="เช่น 210"
                      value={formData.customHeight}
                      onKeyDown={handleIntegerInput}
                      onChange={(e) => handleInputChange('customHeight', e.target.value)}
                      className="w-full mt-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
                    />
                  </div>
                </div>
                
                {/* Active Surcharges Warning */}
                {activeSurcharges.length > 0 && (
                   <div className="mt-3 pt-3 border-t border-yellow-200 text-xs text-orange-700">
                     <div className="font-semibold flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3 h-3" /> เงื่อนไขราคาพิเศษ:
                     </div>
                     <ul className="list-disc list-inside space-y-1">
                        {activeSurcharges.map((s, idx) => (
                           <li key={idx}>{s}</li>
                        ))}
                     </ul>
                   </div>
                )}
                
                <div className="mt-2 text-[10px] text-slate-400 text-right">* มีค่าดำเนินการสำหรับขนาดพิเศษ</div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Group 2: ดีไซน์และผิวสัมผัส */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" /> สีและดีไซน์หน้าบาน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* สี/ผิว */}
          <div className="md:col-span-2 space-y-3">
             <label className="block text-sm font-medium text-slate-600">เลือกชนิดผิว/สี</label>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TOA Option */}
                <div 
                  onClick={() => handleInputChange('surfaceType', 'TOA')}
                  className={`p-4 rounded-lg border-2 cursor-pointer flex flex-col gap-2 ${
                    formData.surfaceType === 'TOA' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                       <div className={`w-4 h-4 rounded-full border ${formData.surfaceType === 'TOA' ? 'bg-purple-500 border-purple-500' : 'bg-white border-slate-400'}`}></div>
                       ผิวเรียบพ่นสี TOA
                    </div>
                  </div>
                  {formData.surfaceType === 'TOA' && (
                    <input 
                      type="text"
                      placeholder="ระบุโค้ดสี TOA (เช่น 8290)"
                      value={formData.toaCode}
                      onChange={(e) => handleInputChange('toaCode', e.target.value)}
                      className="w-full p-2 text-sm border border-purple-200 rounded focus:outline-none focus:border-purple-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>

                {/* SVL Option */}
                <div 
                  onClick={() => handleInputChange('surfaceType', 'SVL')}
                  className={`p-4 rounded-lg border-2 cursor-pointer flex flex-col gap-2 ${
                    formData.surfaceType === 'SVL' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border ${formData.surfaceType === 'SVL' ? 'bg-purple-500 border-purple-500' : 'bg-white border-slate-400'}`}></div>
                        ปิดผิว SVL
                    </div>
                  </div>
                  {formData.surfaceType === 'SVL' && (
                    <select 
                      value={formData.svlCode}
                      onChange={(e) => handleInputChange('svlCode', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full p-2 text-sm border border-purple-200 rounded focus:outline-none focus:border-purple-500"
                    >
                      <option value="SVL F-102">SVL F-102</option>
                      <option value="M-304-1">M-304-1</option>
                    </select>
                  )}
                </div>
             </div>
          </div>

          {/* เซาะร่อง */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">การเซาะร่อง</label>
            <select 
              value={formData.grooving}
              onChange={(e) => handleInputChange('grooving', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            >
              <option value="none">ไม่เซาะร่อง</option>
              <option value="standard">เซาะร่องปกติ</option>
              <option value="black_line">เซาะร่องแปะเส้นดำ</option>
              <option value="painted">เซาะร่องทำสี</option>
            </select>
          </div>

          {/* ติดคิ้ว */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">ติดคิ้วพ่นสี</label>
            <select 
              value={formData.molding}
              onChange={(e) => handleInputChange('molding', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            >
              <option value="none">ไม่ติดคิ้ว</option>
              <option value="first_1">First Class 1 ช่อง</option>
              <option value="first_2">First Class 2 ช่อง</option>
              <option value="roma_1">ROMA 1 ช่อง</option>
              <option value="roma_2">ROMA 2 ช่อง</option>
            </select>
          </div>

           {/* กระจก & เกล็ด */}
           <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">กระจก</label>
            <select 
              value={formData.glass}
              onChange={(e) => handleInputChange('glass', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            >
              <option value="none">ไม่ติดกระจก</option>
              <option value="frosted">กระจกฝ้าเต็มบาน</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">เกล็ดระบายอากาศ</label>
            <select 
              value={formData.louver}
              onChange={(e) => handleInputChange('louver', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            >
              <option value="none">ไม่ใส่เกล็ด</option>
              <option value="full">เกล็ดเต็มบาน</option>
            </select>
          </div>

        </div>
      </div>

      {/* Group 3: โครงสร้างและการเจาะ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-orange-600" /> การเจาะและเสริมโครง
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">เสริมโครง</label>
            <select 
              value={formData.reinforce}
              onChange={(e) => handleInputChange('reinforce', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            >
              <option value="none">ไม่เสริมโครง</option>
              <option value="lever">เสริมโครงก้านโยก</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">การเจาะลูกบิด</label>
            <select 
              value={formData.drilling}
              onChange={(e) => handleInputChange('drilling', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            >
              <option value="none">ไม่เจาะลูกบิด</option>
              <option value="knob">เจาะลูกบิด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Group 4: Option เสริม */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" /> Option เสริม
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'shock_up', label: 'เสริมโครงติด SHOCK UP' },
            { key: 'handle', label: 'เสริมโครงด้ามจับ' },
            { key: 'sliding', label: 'เสริมโครงบานเลื่อน' },
            { key: 'stopper', label: 'เสริมโครง Stopper' },
            { key: 'peephole', label: 'เจาะตาแมว' },
            { key: 'rabbet', label: 'ทำบังใบ' },
            { key: 'knob_plate_40', label: 'เสริมโครงแป้นรองลูกบิด 40cm' },
            { key: 'wood_top_bottom', label: 'เสริมโครงไม้สังเคราะห์ บน หรือ ล่าง' },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox"
                  checked={formData.options[opt.key]}
                  onChange={() => handleOptionToggle(opt.key)}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                />
                <span className="text-slate-700 text-sm">{opt.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

    </div>
  );

  const renderPlaceholder = (title: string) => (
    <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 text-slate-400">
      <Settings className="w-12 h-12 mb-3 opacity-20" />
      <p className="text-lg font-medium">ส่วนของ {title}</p>
      <p className="text-sm">อยู่ระหว่างการพัฒนา (Coming Soon)</p>
    </div>
  );

  const getSummaryItems = () => {
    const items = [];
    
    // Core details
    items.push({ label: 'ประเภท', value: `${formData.structure} (${formData.type})` });
    items.push({ 
      label: 'ขนาด', 
      value: formData.sizeType === 'custom' 
        ? `${formData.customWidth || 0} x ${formData.customHeight || 0} cm` 
        : formData.sizeType 
    });
    
    // Surface
    if (formData.surfaceType === 'TOA') {
      items.push({ label: 'สี/ผิว', value: `พ่นสี TOA: ${formData.toaCode || '-'}` });
    } else {
      items.push({ label: 'สี/ผิว', value: `ปิดผิว SVL: ${formData.svlCode}` });
    }

    // Details
    if (formData.grooving !== 'none') items.push({ label: 'เซาะร่อง', value: formData.grooving });
    if (formData.molding !== 'none') items.push({ label: 'ติดคิ้ว', value: formData.molding });
    if (formData.glass !== 'none') items.push({ label: 'กระจก', value: formData.glass });
    if (formData.louver !== 'none') items.push({ label: 'เกล็ด', value: formData.louver });
    if (formData.reinforce !== 'none') items.push({ label: 'เสริมโครง', value: formData.reinforce });
    if (formData.drilling !== 'none') items.push({ label: 'เจาะ', value: formData.drilling });

    // Options
    const activeOptions = Object.entries(formData.options)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => key);
    
    if (activeOptions.length > 0) {
      items.push({ label: 'Option เสริม', value: `${activeOptions.length} รายการ` });
    }

    return items;
  };

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Admin Toggle */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <DoorOpen className="w-8 h-8 text-white" />
              </div>
              ระบบคำนวณราคาประตู uPVC
            </h1>
            <p className="text-slate-500 mt-2 ml-14">Dashboard สำหรับประเมินราคาสินค้าและสร้างใบรายการ</p>
          </div>
          
          <button 
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4" />
            ตั้งค่าราคา / อัปโหลดไฟล์
          </button>
        </header>

        {/* Admin Panel (Hidden by default) */}
        {showAdminPanel && (
           <div className="mb-8 p-6 bg-slate-800 rounded-xl text-white shadow-xl animate-in slide-in-from-top-4">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                 <Upload className="w-5 h-5 text-blue-400" /> ตั้งค่าราคากลาง (Price Settings)
               </h3>
               <button onClick={() => setShowAdminPanel(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Download Section */}
                <div className="space-y-4">
                   <h4 className="font-semibold text-blue-300 text-sm flex items-center gap-2">
                      <Download className="w-4 h-4" /> 1. ดาวน์โหลด Template ใหม่ (v4 Limited)
                   </h4>
                   <p className="text-slate-400 text-xs">
                      ดาวน์โหลดไฟล์ Template สำหรับกรอกราคา (ตัดรายการ Oversize ออกแล้ว)
                   </p>
                   <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" /> ดาวน์โหลด Template (CSV)
                  </button>
                </div>

                {/* Upload Section */}
                <div className="space-y-4 border-l border-slate-600 pl-8 md:block hidden">
                   <h4 className="font-semibold text-blue-300 text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4" /> 2. อัปโหลดไฟล์ราคาใหม่
                   </h4>
                   <p className="text-slate-400 text-xs">
                      นำไฟล์ที่แก้ไขราคาเสร็จแล้ว มาอัปโหลดที่นี่เพื่ออัปเดตระบบทันที
                   </p>
                   <input 
                    type="file" 
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button 
                    onClick={triggerFileUpload}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" /> เลือกไฟล์ CSV ที่แก้ไขแล้ว
                  </button>
                </div>
                
                {/* Mobile Upload Section */}
                <div className="space-y-4 md:hidden block pt-4 border-t border-slate-600">
                   <h4 className="font-semibold text-blue-300 text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4" /> 2. อัปโหลดไฟล์ราคาใหม่
                   </h4>
                   <button 
                    onClick={triggerFileUpload}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" /> เลือกไฟล์ CSV ที่แก้ไขแล้ว
                  </button>
                </div>

             </div>
           </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex overflow-x-auto gap-2 no-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content Render */}
            {activeTab === 'exclusive' ? renderExclusiveForm() : renderPlaceholder(currentTab?.label || 'Unknown')}

          </div>

          {/* Sticky Sidebar / Summary */}
          <div className="lg:w-96 shrink-0">
             <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-8 overflow-hidden">
                <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5" /> สรุปรายการ
                  </h2>
                  <span className="text-xs bg-slate-700 px-2 py-1 rounded">Draft</span>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Price Big Display */}
                  <div className="text-center pb-6 border-b border-slate-100">
                    <p className="text-slate-500 text-sm mb-1">ราคาสุทธิ (ประมาณการ)</p>
                    <div className="text-4xl font-bold text-blue-600">
                      ฿{totalPrice.toLocaleString()}
                    </div>
                  </div>

                  {/* Details List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">รายละเอียดสินค้า</h4>
                    {getSummaryItems().map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-500">{item.label}</span>
                        <span className="text-slate-800 font-medium text-right truncate ml-4 max-w-[150px]" title={item.value}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                    
                    {/* List active options specifically */}
                    {Object.entries(formData.options).filter(([_, v]) => v).length > 0 && (
                      <div className="pt-2 border-t border-dashed mt-2">
                        <p className="text-xs text-slate-400 mb-1">Option ที่เลือก:</p>
                        <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                          {Object.entries(formData.options)
                            .filter(([_, isActive]) => isActive)
                            .map(([key, _]) => {
                              const labels: {[key:string]: string} = {
                                'shock_up': 'Shock UP',
                                'handle': 'โครงด้ามจับ',
                                'sliding': 'โครงบานเลื่อน',
                                'stopper': 'Stopper',
                                'peephole': 'เจาะตาแมว',
                                'rabbet': 'ทำบังใบ',
                                'knob_plate_40': 'แป้นรอง 40cm',
                                'wood_top_bottom': 'โครงไม้ บน/ล่าง',
                              };
                              return <li key={key}>{labels[key] || key}</li>;
                            })
                          }
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                     <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium">
                        <Check className="w-4 h-4" /> บันทึก
                     </button>
                     <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium shadow-sm">
                        <ShoppingCart className="w-4 h-4" /> สั่งซื้อ
                     </button>
                  </div>

                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}