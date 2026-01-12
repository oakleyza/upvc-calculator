import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { 
  Calculator, Check, DoorOpen, Layers, Maximize, Palette, Settings, 
  Grid, FileText, Upload, Download, X, AlertCircle, LogOut, User,
  FileSpreadsheet, Users, Edit, Save, Trash2
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
  structure: PriceCategory; size: PriceCategory; surface: PriceCategory;
  grooving: PriceCategory; molding: PriceCategory; glass: PriceCategory;
  louver: PriceCategory; reinforce: PriceCategory; drilling: PriceCategory;
  options: PriceCategory;
}
interface DoorOptions { [key: string]: boolean; }
interface DoorFormData {
  type: string; structure: string; sizeType: string; customWidth: string; customHeight: string;
  surfaceType: string; toaCode: string; svlCode: string; grooving: string; molding: string;
  glass: string; louver: string; reinforce: string; drilling: string; options: DoorOptions;
}
interface TabInfo { id: string; label: string; icon: React.ElementType; }

interface UserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'staff';
}

// ------------------------------------------------------------------
// 👥 Default Users
// ------------------------------------------------------------------
const DEFAULT_USERS: UserAccount[] = [
  { 
    id: 'admin_01', 
    username: 'admin', 
    password: '1234', 
    name: 'Administrator', 
    role: 'admin' 
  },
  { 
    id: 'staff_01', 
    username: 'staff01', 
    password: '1234', 
    name: 'General Staff', 
    role: 'staff' 
  }
];

// --- Default Prices ---
const DEFAULT_PRICES: PricingStructure = {
  structure: { 'uPVC': 2500, 'WPC RIGID': 3500, 'WPC MAX': 4500 },
  size: { 
    '70x200cm': 0, '80x200cm': 200, '90x200cm': 400, 
    'custom': 1000, 
    'custom_w_81_89': 300, 
    'custom_w_90': 400, // ✅ เพิ่มรายการใหม่: กว้าง 90cm
    'custom_w_91_95': 500, 
    'custom_h_under_200': 100,
    'custom_h_201_210': 400, 'custom_h_211_220': 600, 'custom_h_221_240': 1000 
  },
  surface: { 'TOA': 500, 'SVL': 800 },
  grooving: { 'none': 0, 'standard': 300, 'black_line': 400, 'painted': 500 },
  molding: { 'none': 0, 'first_1': 800, 'first_2': 1000, 'roma_1': 900, 'roma_2': 1100 },
  glass: { 
    'none': 0, 
    'frosted': 1500, 'frosted_half': 1000, 'frosted_side': 800,
    'green_full': 1800, 'green_half': 1200, 'green_side': 1000 
  },
  louver: { 
    'none': 0, 
    'full': 1200, 'half': 800, 'side': 600, 'bottom': 600,
    'full_painted': 1500, 'half_painted': 1000, 'side_painted': 800, 'bottom_painted': 800 
  },
  reinforce: { 
    'none': 0, 
    'lever': 300, 'digital': 400, 'recessed': 400 
  },
  drilling: { 
    'none': 0, 
    'knob': 100, 'lever': 150, 'digital': 200, 'recessed': 200 
  },
  options: { 'shock_up': 200, 'handle': 150, 'sliding': 400, 'stopper': 100, 'peephole': 150, 'rabbet': 250, 'knob_plate_40': 100, 'wood_top_bottom': 300 }
};

const TABS: TabInfo[] = [
  { id: 'exclusive', label: 'ประตู Exclusive', icon: DoorOpen },
  { id: 'standard', label: 'ประตู Standard', icon: Layers },
  { id: 'frame', label: 'วงกบ (Frame)', icon: Maximize },
  { id: 'architrave', label: 'บังราง (Architrave)', icon: Grid },
];

// --- Login Component ---
const LoginScreen = ({ 
  onLogin,
  isFirebaseReady,
  permissionError
}: { 
  onLogin: (user: UserAccount) => void,
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
      if (err.code === 'permission-denied') {
        setError("สิทธิ์การเข้าถึงถูกปฏิเสธ (Permission Denied)");
      } else {
        setError("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-white flex items-center justify-center">
            <img 
              src="https://i.ibb.co/r2cZ0GYB/image.png" 
              alt="Logo กลางซอยค้าไม้" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">ระบบคำนวนราคาประตู</h2>
        <h3 className="text-lg font-medium text-center text-blue-600 mb-6">-กลางซอยค้าไม้-</h3>
        
        {permissionError && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-xs rounded shadow-sm">
            <p className="font-bold text-sm mb-1">🚨 ตรวจพบปัญหา: Permission Denied</p>
            <p className="mb-2">ฐานข้อมูลถูกล็อกอยู่ กรุณาแก้ Rules ใน Firebase Console</p>
          </div>
        )}

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              placeholder="Username" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              placeholder="••••••••" 
              required 
            />
          </div>
          <button type="submit" disabled={loading || !isFirebaseReady} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-blue-200">
            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- User Management Panel ---
const UserManagementPanel = ({ onClose }: { onClose: () => void }) => {
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
      try {
        await setDoc(doc(db, "users", editForm.id), editForm);
        setEditingId(null);
        setEditForm(null);
      } catch (error) {
        alert("บันทึกไม่สำเร็จ");
      }
    }
  };

  const handleCreateNew = async () => {
    if (!db) return;
    const newId = 'user_' + Date.now();
    const newUser: UserAccount = { id: newId, username: 'new_user', password: 'password', name: 'New Staff', role: 'staff' };
    try {
      await setDoc(doc(db, "users", newId), newUser);
      setEditingId(newId);
      setEditForm(newUser);
    } catch (error) {
      alert("สร้าง User ไม่สำเร็จ");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("ยืนยันการลบผู้ใช้งานนี้?") && db) {
      await deleteDoc(doc(db, "users", id));
    }
  };

  const handleChange = (field: keyof UserAccount, value: string) => {
    if (editForm) setEditForm({ ...editForm, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400">
            <Users className="w-5 h-5" /> จัดการข้อมูลผู้ใช้งาน
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 hover:text-red-400" /></button>
        </div>
        <div className="p-6 bg-slate-50 overflow-y-auto grow">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-700">รายชื่อผู้ใช้ทั้งหมด</h4>
            <button onClick={handleCreateNew} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
              + เพิ่มผู้ใช้ใหม่
            </button>
          </div>
          {loading ? <div className="text-center py-8">Loading...</div> : (
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {editingId === u.id && editForm ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className="text-xs text-slate-500 font-bold">ชื่อ</label><input type="text" value={editForm.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full p-2 text-sm border rounded"/></div>
                      <div><label className="text-xs text-slate-500 font-bold">Username</label><input type="text" value={editForm.username} onChange={(e) => handleChange('username', e.target.value)} className="w-full p-2 text-sm border rounded"/></div>
                      <div><label className="text-xs text-slate-500 font-bold">Password</label><input type="text" value={editForm.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full p-2 text-sm border rounded"/></div>
                      <div>
                        <label className="text-xs text-slate-500 font-bold">Role</label>
                        <select value={editForm.role} onChange={(e) => handleChange('role', e.target.value as any)} className="w-full p-2 text-sm border rounded">
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                        <span className="font-bold text-slate-800">{u.name}</span>
                      </div>
                      <div className="text-sm text-slate-500">User: {u.username}</div>
                    </div>
                  )}
                  <div className="shrink-0 flex gap-2">
                    {editingId === u.id ? (
                      <><button onClick={handleSave} className="p-2 bg-green-100 text-green-700 rounded"><Save className="w-4 h-4" /></button><button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded"><X className="w-4 h-4" /></button></>
                    ) : (
                      <><button onClick={() => { setEditingId(u.id); setEditForm({...u}); }} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-blue-50 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                        {u.username !== 'admin' && <button onClick={() => handleDelete(u.id)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                      </>
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

// --- Main App ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('exclusive');
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [showUserPanel, setShowUserPanel] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [prices, setPrices] = useState<PricingStructure>(DEFAULT_PRICES);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const [formData, setFormData] = useState<DoorFormData>({
    type: 'ภายใน', 
    structure: 'uPVC', sizeType: '70x200cm', customWidth: '', customHeight: '',
    surfaceType: 'TOA', toaCode: '', svlCode: 'SVL F-102', grooving: 'none', molding: 'none',
    glass: 'none', louver: 'none', reinforce: 'none', drilling: 'none',
    options: { shock_up: false, handle: false, sliding: false, stopper: false, peephole: false, rabbet: false, knob_plate_40: false, wood_top_bottom: false }
  });
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [activeSurcharges, setActiveSurcharges] = useState<string[]>([]);

  // 0. Set Browser Title
  useEffect(() => {
    document.title = "ระบบคำนวณราคา - กลางซอยค้าไม้";
  }, []);

  // 1. Initial Setup
  useEffect(() => {
    const savedUser = localStorage.getItem('upvc_user');
    if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); } catch (e) { localStorage.removeItem('upvc_user'); }
    }

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
    const unsub = onSnapshot(doc(db, "config", "prices"), (doc) => {
      if (doc.exists()) setPrices(doc.data() as PricingStructure);
    }, (error) => {
      if (error.code === 'permission-denied') setPermissionError(true);
    });
    return () => unsub();
  }, []);

  // 3. Logic
  useEffect(() => {
    let price = 0;
    let surcharges: string[] = [];
    price += prices.structure[formData.structure] || 0;
    if (formData.sizeType === 'custom') {
      price += prices.size['custom'];
      const width = parseInt(formData.customWidth) || 0;
      const height = parseInt(formData.customHeight) || 0;
      
      // ✅ Logic ใหม่: ซ่อนราคาบวกเพิ่มในการแสดงผล (เอา +${price} ออก)
      if (width >= 81 && width <= 89) { 
        price += prices.size['custom_w_81_89']; 
        surcharges.push(`กว้าง 81-89cm`); 
      }
      // ✅ Logic ใหม่: เพิ่มเคสสำหรับ กว้าง 90cm
      else if (width === 90) {
        price += prices.size['custom_w_90'] || 0;
        surcharges.push(`กว้าง 90cm`);
      }
      else if (width >= 91 && width <= 95) { 
        price += prices.size['custom_w_91_95']; 
        surcharges.push(`กว้าง 91-95cm`); 
      }

      // ✅ Logic ใหม่: สูงน้อยกว่า 200cm
      if (height < 200) {
        price += prices.size['custom_h_under_200'] || 0;
      }
      else if (height >= 201 && height <= 210) { 
        price += prices.size['custom_h_201_210']; 
      }
      else if (height >= 211 && height <= 220) { 
        price += prices.size['custom_h_211_220']; 
      }
      else if (height >= 221 && height <= 240) { 
        price += prices.size['custom_h_221_240']; 
      }
    } else { price += prices.size[formData.sizeType] || 0; }
    
    if (formData.surfaceType === 'TOA') price += prices.surface['TOA'] || 0;
    else if (formData.surfaceType === 'SVL') price += prices.surface['SVL'] || 0;
    
    price += prices.grooving[formData.grooving] || 0;
    price += prices.molding[formData.molding] || 0;
    price += prices.glass[formData.glass] || 0;
    price += prices.louver[formData.louver] || 0;
    price += prices.reinforce[formData.reinforce] || 0;
    price += prices.drilling[formData.drilling] || 0;
    Object.keys(formData.options).forEach(key => { if (formData.options[key]) price += prices.options[key] || 0; });
    
    setTotalPrice(price);
    setActiveSurcharges(surcharges);
  }, [formData, prices]);

  // ✅ เปลี่ยน Max Width เป็น 110cm
  const handleInputChange = (field: keyof DoorFormData, value: any) => {
    if (field === 'customWidth' && Number(value) > 110) return;
    if (field === 'customHeight' && Number(value) > 240) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleOptionToggle = (optionKey: string) => setFormData(prev => ({ ...prev, options: { ...prev.options, [optionKey]: !prev.options[optionKey] } }));
  const handleLogout = () => { localStorage.removeItem('upvc_user'); setCurrentUser(null); };

  const handleDownloadTemplate = () => {
    // ✅ อัปเดต CSV Template เพิ่ม custom_w_90
    const csvContent = `Category,Key,Description,Price
structure,uPVC,ราคาตั้งต้น ประตู uPVC,2500
structure,WPC RIGID,ราคาตั้งต้น ประตู WPC RIGID,3500
structure,WPC MAX,ราคาตั้งต้น ประตู WPC MAX,4500
size,70x200cm,ขนาด 70x200cm (ราคาบวกเพิ่ม),0
size,80x200cm,ขนาด 80x200cm (ราคาบวกเพิ่ม),200
size,90x200cm,ขนาด 90x200cm (ราคาบวกเพิ่ม),400
size,custom,ขนาดสั่งทำพิเศษ (ค่าดำเนินการพื้นฐาน),1000
size,custom_w_81_89,Surcharge กว้าง 81-89cm,300
size,custom_w_90,Surcharge กว้าง 90cm,400
size,custom_w_91_95,Surcharge กว้าง 91-95cm,500
size,custom_h_under_200,Surcharge สูงน้อยกว่า 200cm,100
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
glass,frosted_half,กระจกฝ้าครึ่งบาน,1000
glass,frosted_side,กระจกฝ้าข้าง,800
glass,green_full,กระจกเขียวตัดแสงเต็มบาน,1800
glass,green_half,กระจกเขียวตัดแสงครึ่งบาน,1200
glass,green_side,กระจกเขียวตัดแสงข้าง,1000
louver,none,ไม่ติดเกล็ด,0
louver,full,เกล็ดเต็มบาน,1200
louver,half,เกล็ดครึ่งบาน,800
louver,side,เกล็ดข้าง,600
louver,bottom,เกล็ดล่าง,600
louver,full_painted,เกล็ดเต็มบาน พ่นสี,1500
louver,half_painted,เกล็ดครึ่งบาน พ่นสี,1000
louver,side_painted,เกล็ดข้าง พ่นสี,800
louver,bottom_painted,เกล็ดล่าง พ่นสี,800
reinforce,none,ไม่เสริมโครง,0
reinforce,lever,เสริมโครงก้านโยก,300
reinforce,digital,เสริมโครงดิจิตอลล็อก,400
reinforce,recessed,เสริมโครงมือจับฝัง,400
drilling,none,ไม่เจาะลูกบิด,0
drilling,knob,เจาะลูกบิด,100
drilling,lever,เจาะก้านโยก,150
drilling,digital,เจาะดิจิตอลล็อค,200
drilling,recessed,เจาะมือจับฝัง,200
options,shock_up,เสริมโครง SHOCK UP,200
options,handle,เสริมโครงด้ามจับ,150
options,sliding,เสริมโครงบานเลื่อน,400
options,stopper,เสริมโครง Stopper,100
options,peephole,เจาะตาแมว,150
options,rabbet,ทำบังใบ,250
options,knob_plate_40,เสริมโครงแป้นรอง 40cm,100
options,wood_top_bottom,เสริมโครงไม้ บน/ล่าง,300`;
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "price_template.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string; const lines = text.split('\n');
      const newPrices: PricingStructure = JSON.parse(JSON.stringify(DEFAULT_PRICES));
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(','); if (parts.length < 4) continue;
        const [cat, key, , prc] = parts.map(s => s.trim());
        const price = parseFloat(prc);
        if (!isNaN(price) && cat in newPrices) {
            if (cat === 'options') newPrices.options[key] = price;
            else (newPrices as any)[cat][key] = price;
        }
      }
      if (db) await setDoc(doc(db, "config", "prices"), newPrices);
      alert("✅ อัปเดตราคากลางเรียบร้อย"); setShowAdminPanel(false);
    };
    reader.readAsText(file); event.target.value = '';
  };

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
        {showAdminPanel && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="bg-slate-800 text-white p-4 flex justify-between items-center"><h3 className="text-lg font-semibold flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" /> จัดการราคากลาง (CSV)</h3><button onClick={() => setShowAdminPanel(false)}><X className="w-5 h-5"/></button></div>
               <div className="p-8 grid grid-cols-2 gap-8 bg-slate-50">
                  <div className="space-y-4">
                    <h4 className="font-bold">1. ดาวน์โหลด Template</h4>
                    <button onClick={handleDownloadTemplate} className="w-full py-2.5 border-2 border-green-600 text-green-700 hover:bg-green-50 rounded-lg font-bold flex items-center justify-center gap-2"><Download className="w-5 h-5"/> ดาวน์โหลด (.csv)</button>
                  </div>
                  <div className="space-y-4 border-l pl-8">
                    <h4 className="font-bold">2. อัปโหลดไฟล์ใหม่</h4>
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"><Upload className="w-5 h-5"/> เลือกไฟล์ & อัปเดต</button>
                  </div>
               </div>
             </div>
           </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex overflow-x-auto gap-2 no-scrollbar">
              {TABS.map((tab) => {
                const isDisabled = tab.id !== 'exclusive';
                return (
                  <button key={tab.id} onClick={() => !isDisabled && setActiveTab(tab.id)} disabled={isDisabled}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : isDisabled ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600"/> ข้อมูลโครงสร้างและขนาด</h3>
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
                                    {/* ✅ แสดงข้อความแจ้งเตือนแบบเรียบง่าย (ไม่มีราคา) */}
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
                            {/* ✅ TOA แบบ Clean (เอาช่องกรอกรหัสสีออก) */}
                            <div onClick={() => handleInputChange('surfaceType', 'TOA')} className={`p-4 rounded-lg border-2 cursor-pointer ${formData.surfaceType === 'TOA' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                                <label className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border ${formData.surfaceType === 'TOA' ? 'bg-purple-500' : ''}`}></div>พ่นสี TOA</label>
                            </div>
                            {/* ✅ SVL แบบ Clean (เอาตัวเลือกย่อยออก) */}
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

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"> {/* Removed opacity/pointer-events/grayscale */}
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-green-600"/> Option เสริม</h3> {/* Removed (ปิดปรับปรุง) */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {k: 'shock_up', l: 'เสริมโครงติด SHOCK UP'},
                            {k: 'handle', l: 'เสริมโครงด้ามจับ'},
                            {k: 'sliding', l: 'เสริมโครงบานเลื่อน'},
                            {k: 'stopper', l: 'เสริมโครง Stopper'},
                            {k: 'peephole', l: 'เจาะตาแมว'},
                            {k: 'rabbet', l: 'ทำบังใบ'},
                            {k: 'knob_plate_40', l: 'เสริมโครงแป้นรอง 40cm'},
                            {k: 'wood_top_bottom', l: 'เสริมโครงไม้ บน/ล่าง'}
                        ].map(o => (
                            <label key={o.k} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={formData.options[o.k]} 
                                    onChange={() => handleOptionToggle(o.k)} 
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" // Removed disabled, added styles
                                />
                                <span className="text-sm text-slate-700 font-medium">{o.l}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          <div className="lg:w-96 shrink-0">
             <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-8 overflow-hidden">
                <div className="bg-slate-800 p-4 text-white flex items-center justify-between"><h2 className="font-semibold flex items-center gap-2"><FileText className="w-5 h-5" /> สรุปรายการ</h2></div>
                <div className="p-6 space-y-6">
                  <div className="text-center pb-6 border-b"><p className="text-slate-500 text-sm mb-1">ราคาสุทธิ</p><div className="text-4xl font-bold text-blue-600">฿{totalPrice.toLocaleString()}</div></div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">โครงสร้าง</span><span className="font-medium">{formData.structure}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">ขนาด</span><span className="font-medium">{formData.sizeType === 'custom' ? `${formData.customWidth}x${formData.customHeight}` : formData.sizeType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">สี</span><span className="font-medium">{formData.surfaceType}</span></div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}