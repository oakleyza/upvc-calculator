// ------------------------------------------------------------------
// Types & Interfaces
// ------------------------------------------------------------------

/** รายการในแคตาล็อกประตูไม้ */
export interface CatalogueItem {
  id:         string;   // Firestore doc ID
  name:       string;   // ชื่อแสดง
  imageUrl:   string;   // Cloudinary URL หรือ /wood-models/m1.jpg
  sortOrder:  number;
  legacyKey?: string;   // 'm1', 'm2' ... สำหรับ backward compat
  createdAt:  string;
}

export interface PriceCategory {
  [key: string]: number;
}

export interface PricingStructure {
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
  wood_door_price: PriceCategory;   // base(ไม้×รุ่น) + size surcharge + curve surcharge
  wood_door_paint: PriceCategory;   // ค่าทำสี ตามขนาด + curve surcharge
  wood_door_glass: PriceCategory;   // ค่ากระจก ตามรุ่น + ขนาด
  wood_frame_price: PriceCategory;  // ราคาวงกบไม้ ตาม type × size × painted
  // Legacy fallback fields (kept for Firestore backward compatibility)
  structure?: PriceCategory;
  size?: PriceCategory;
  surface?: PriceCategory;
}

export interface WoodDoorFormData {
  woodType: string;    // 'sadao' | 'tabak' | 'teak'
  modelId: string;     // 'm1' | 'm2' ... 'm37'
  sizeType: string;    // '70x200cm' | '80x200cm' | '90x200cm' | 'custom'
  customWidth: string;
  customHeight: string;
  painted: boolean;
  glassType: string;   // 'none' | 'plain' — แสดงเฉพาะรุ่นที่มีชื่อว่า "กระจก"
}

export interface DoorOptions {
  [key: string]: boolean;
}

export interface DoorFormData {
  structure: string;
  sizeType: string;
  customWidth: string;
  customHeight: string;
  surfaceType: string;
  grooving: string;
  molding: string;
  glass: string;
  louver: string;
  reinforce: string;
  drilling: string;
  options: DoorOptions;
}

export interface FrameFormData {
  frameMaterial: string;
  sizeType: string;
  customWidth: string;
  customHeight: string;
  surfaceType: string;
}

export interface WoodFrameFormData {
  frameType: string;    // 'pluang' | 'teng' | 'daeng' | 'curve_pluang'
  sizeType: string;     // '70x200cm' | '80x200cm' | '90x200cm' | 'custom'
  customWidth: string;
  customHeight: string;
  painted: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt?: string; // เพิ่มสำหรับ SHA-256 migration
  name: string;
  role: 'admin' | 'staff';
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'staff';
  loginAt: number; // timestamp สำหรับ session expiry
}

export interface PriceResult {
  total: number;
  surcharges: string[];
}

export interface TabInfo {
  id: string;
  label: string;
  icon: React.ElementType;
}
