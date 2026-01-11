import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { 
  Calculator, Check, DoorOpen, Layers, Maximize, Palette, Settings, 
  ShoppingCart, Grid, FileText, Upload, Download, X, AlertCircle, LogOut, User,
  FileSpreadsheet, Users, Edit, Save, Trash2, Database
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, setDoc, getDoc, collection, 
  onSnapshot, query, where, getDocs, updateDoc, deleteDoc 
} from "firebase/firestore";

// ------------------------------------------------------------------
// 🔴 CONFIG FIREBASE (ใส่ค่าให้เรียบร้อยแล้ว) 🔴
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

// --- Default Data (ใช้สำหรับสร้างครั้งแรก) ---
const DEFAULT_PRICES: PricingStructure = {
  structure: { 'uPVC': 2500, 'WPC RIGID': 3500, 'WPC MAX': 4500 },
  size: { '70x200cm': 0, '80x200cm': 200, '90x200cm': 400, 'custom': 1000, 'custom_w_81_89': 300, 'custom_w_91_95': 500, 'custom_h_201_210': 400, 'custom_h_211_220': 600, 'custom_h_221_240': 1000 },
  surface: { 'TOA': 500, 'SVL': 800 },
  grooving: { 'none': 0, 'standard': 300, 'black_line': 400, 'painted': 500 },
  molding: { 'none': 0, 'first_1': 800, 'first_2': 1000, 'roma_1': 900, 'roma_2': 1100 },
  glass: { 'none': 0, 'frosted': 1500 },
  louver: { 'none': 0, 'full': 1200 },
  reinforce: { 'none': 0, 'lever': 300 },
  drilling: { 'none': 0, 'knob': 100 },
  options: { 'shock_up': 200, 'handle': 150, 'sliding': 400, 'stopper': 100, 'peephole': 150, 'rabbet': 250, 'knob_plate_40': 100, 'wood_top_bottom': 300 }
};

const DEFAULT_USERS: UserAccount[] = [
  { id: 'admin_01', username: 'admin', password: '1234', name: 'Administrator', role: 'admin' },
  { id: 'staff_01', username: 'staff01', password: '1234', name: 'General Staff', role: 'staff' }
];

const TABS: TabInfo[] = [
  { id: 'exclusive', label: 'ประตู Exclusive', icon: DoorOpen },
  { id: 'standard', label: 'ประตู Standard', icon: Layers },
  { id: 'frame', label: 'วงกบ (Frame)', icon: Maximize },
  { id: 'architrave', label: 'บังราง (Architrave)', icon: Grid },
];

// --- Login Component ---
const LoginScreen = ({ 
  onLogin,
  isFirebaseReady
}: { 
  onLogin: (user: UserAccount) => void,
  isFirebaseReady: boolean
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
      // Query Firestore for matching username & password
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as UserAccount;
        onLogin(userData);
      } else {
        setError("Username หรือ Password ไม่ถูกต้อง");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล (กรุณาเช็ค Firestore Rules)");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <DoorOpen className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">เข้าสู่ระบบ</h2>
        <p className="text-center text-slate-500 mb-6 text-sm">uPVC Calculator System</p>
        
        {!isFirebaseReady && (
           <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs mb-4 border border-yellow-200 text-center">
             ⚠️ ยังไม่ได้ใส่ Firebase Config (แก้ไขไฟล์เพื่อเริ่มใช้งาน)
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
const UserManagementPanel = ({ 
  onClose 
}: { 
  onClose: () => void 
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserAccount | null>(null);

  // Load Users from Firestore
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
    const newUser: UserAccount = {
      id: newId,
      username: 'new_user',
      password: 'password',
      name: 'New Staff',
      role: 'staff'
    };
    try {
      await setDoc(doc(db, "users", newId), newUser);
      // Auto enter edit mode
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
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400">
            <Users className="w-5 h-5" /> จัดการข้อมูลผู้ใช้งาน (Cloud DB)
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 hover:text-red-400" /></button>
        </div>
        
        <div className="p-6 bg-slate-50 overflow-y-auto grow">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-700">รายชื่อผู้ใช้ทั้งหมด</h4>
            <button onClick={handleCreateNew} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
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
                      <div className="text-sm text-slate-500 flex gap-4">
                        <span>User: <strong className="text-slate-700">{u.username}</strong></span>
                        {/* ซ่อน Password ใน View Mode */}
                        <span>Pass: <strong className="text-slate-700">••••</strong></span>
                      </div>
                    </div>
                  )}
                  <div className="shrink-0 flex gap-2">
                    {editingId === u.id ? (
                      <>
                        <button onClick={handleSave} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(u.id); setEditForm({...u}); }} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-blue-50 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                        {u.username !== 'admin' && (
                          <button onClick={() => handleDelete(u.id)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        )}
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

// --- Main App Component ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('exclusive');
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [showUserPanel, setShowUserPanel] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Data State
  const [prices, setPrices] = useState<PricingStructure>(DEFAULT_PRICES);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Form State
  const [formData, setFormData] = useState<DoorFormData>({
    type: 'ภายนอก', structure: 'uPVC', sizeType: '70x200cm', customWidth: '', customHeight: '',
    surfaceType: 'TOA', toaCode: '', svlCode: 'SVL F-102', grooving: 'none', molding: 'none',
    glass: 'none', louver: 'none', reinforce: 'none', drilling: 'none',
    options: { shock_up: false, handle: false, sliding: false, stopper: false, peephole: false, rabbet: false, knob_plate_40: false, wood_top_bottom: false }
  });
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [activeSurcharges, setActiveSurcharges] = useState<string[]>([]);

  // 1. Initial Setup (Auto-create Users & Prices if empty)
  useEffect(() => {
    if (!db) return;
    setIsFirebaseReady(true);

    const initSystem = async () => {
      // Check/Create Users
      const usersRef = collection(db, "users");
      const userSnapshot = await getDocs(usersRef);
      if (userSnapshot.empty) {
        console.log("First run: Creating default users...");
        for (const u of DEFAULT_USERS) {
          await setDoc(doc(db, "users", u.id), u);
        }
      }

      // Check/Create Prices
      const priceDocRef = doc(db, "config", "prices");
      const priceDoc = await getDoc(priceDocRef);
      if (!priceDoc.exists()) {
        console.log("First run: Creating default prices...");
        await setDoc(priceDocRef, DEFAULT_PRICES);
      }
    };
    initSystem();
  }, []);

  // 2. Real-time Price Listener
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "config", "prices"), (doc) => {
      if (doc.exists()) {
        setPrices(doc.data() as PricingStructure);
      }
    });
    return () => unsub();
  }, []);

  // 3. Pricing Logic
  useEffect(() => {
    let price = 0;
    let surcharges: string[] = [];
    // (Calculation Logic - same as before)
    price += prices.structure[formData.structure] || 0;
    if (formData.sizeType === 'custom') {
      price += prices.size['custom'];
      const width = parseInt(formData.customWidth) || 0;
      const height = parseInt(formData.customHeight) || 0;
      if (width >= 81 && width <= 89) { price += prices.size['custom_w_81_89']; surcharges.push(`กว้าง 81-89cm (+${prices.size['custom_w_81_89']})`); }
      else if (width >= 91 && width <= 95) { price += prices.size['custom_w_91_95']; surcharges.push(`กว้าง 91-95cm (+${prices.size['custom_w_91_95']})`); }
      if (height >= 201 && height <= 210) { price += prices.size['custom_h_201_210']; surcharges.push(`สูง 201-210cm (+${prices.size['custom_h_201_210']})`); }
      else if (height >= 211 && height <= 220) { price += prices.size['custom_h_211_220']; surcharges.push(`สูง 211-220cm (+${prices.size['custom_h_211_220']})`); }
      else if (height >= 221 && height <= 240) { price += prices.size['custom_h_221_240']; surcharges.push(`สูง 221-240cm (+${prices.size['custom_h_221_240']})`); }
    } else {
      price += prices.size[formData.sizeType] || 0;
    }
    if (formData.surfaceType === 'TOA') price += prices.surface['TOA'] || 0;
    else if (formData.surfaceType === 'SVL') price += prices.surface['SVL'] || 0;
    price += prices.grooving[formData.grooving] || 0;
    price += prices.molding[formData.molding] || 0;
    price += prices.glass[formData.glass] || 0;
    price += prices.louver[formData.louver] || 0;
    price += prices.reinforce[formData.reinforce] || 0;
    price += prices.drilling[formData.drilling] || 0;
    Object.keys(formData.options).forEach(key => {
      if (formData.options[key]) price += prices.options[key] || 0;
    });
    setTotalPrice(price);
    setActiveSurcharges(surcharges);
  }, [formData, prices]);

  // Handlers
  const handleInputChange = (field: keyof DoorFormData, value: any) => {
    if (field === 'customWidth' && Number(value) > 95) return;
    if (field === 'customHeight' && Number(value) > 240) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionToggle = (optionKey: string) => {
    setFormData(prev => ({ ...prev, options: { ...prev.options, [optionKey]: !prev.options[optionKey] } }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowAdminPanel(false);
    setShowUserPanel(false);
  };

  // --- CSV Logic ---
  const handleDownloadTemplate = () => {
    // (Template code remains the same)
    const csvContent = `Category,Key,Description,Price
structure,uPVC,ราคาตั้งต้น ประตู uPVC,2500
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
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "price_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
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
            if (category in newPrices && category !== 'options') {
               const cat = category as keyof Omit<PricingStructure, 'options'>;
               if (newPrices[cat][key] !== undefined) { newPrices[cat][key] = price; updatedCount++; }
            } else if (category === 'option' && newPrices.options[key] !== undefined) {
               newPrices.options[key] = price; updatedCount++;
            }
          }
        }
      }

      // Save to Firebase
      if (db) {
        try {
          await setDoc(doc(db, "config", "prices"), newPrices);
          alert(`✅ บันทึกราคาลง Cloud เรียบร้อย (${updatedCount} รายการ) \nทุกคนจะเห็นราคานี้ทันที`);
          setShowAdminPanel(false);
        } catch (error) {
          alert("บันทึกไม่สำเร็จ เช็คการเชื่อมต่อเน็ต");
        }
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // --- Render ---

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} isFirebaseReady={isFirebaseReady} />;

  const isAdminUser = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg"><DoorOpen className="w-8 h-8 text-white" /></div>
              ระบบคำนวณราคาประตู uPVC
            </h1>
            <div className="flex items-center gap-3 mt-2 ml-14">
               <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1.5 font-medium ${isAdminUser ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>
                  <User className="w-3 h-3"/> {currentUser.name}
                  <span className="text-xs opacity-75">({currentUser.role === 'admin' ? 'Admin' : 'Staff'})</span>
               </span>
               <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                  <LogOut className="w-3 h-3"/> ออกจากระบบ
               </button>
            </div>
          </div>
          
          {/* Admin Buttons */}
          {isAdminUser && (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowUserPanel(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-bold transition-all shadow-sm"
              >
                <Users className="w-4 h-4 text-blue-600" />
                จัดการผู้ใช้งาน
              </button>
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Settings className="w-4 h-4 text-yellow-400" />
                จัดการราคา (CSV)
              </button>
            </div>
          )}
        </header>

        {/* User Management Panel (Cloud) */}
        {showUserPanel && isAdminUser && (
          <UserManagementPanel onClose={() => setShowUserPanel(false)} />
        )}

        {/* Admin CSV Panel (Cloud) */}
        {showAdminPanel && isAdminUser && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                 <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-400">
                   <FileSpreadsheet className="w-5 h-5" /> อัปเดตราคากลางด้วย CSV (Cloud)
                 </h3>
                 <button onClick={() => setShowAdminPanel(false)}><X className="w-5 h-5 hover:text-red-400" /></button>
               </div>
               
               <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50">
                  <div className="space-y-4">
                     <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                        <Download className="w-6 h-6 text-green-600" />
                     </div>
                     <h4 className="font-bold text-slate-800">1. ดาวน์โหลด Template</h4>
                     <p className="text-sm text-slate-500">ดาวน์โหลดไฟล์ตารางราคาล่าสุดออกมาแก้ไข</p>
                     <button onClick={handleDownloadTemplate} className="w-full py-2.5 border-2 border-green-600 text-green-700 hover:bg-green-50 rounded-lg font-bold transition-colors text-sm">
                      ดาวน์โหลด (.csv)
                    </button>
                  </div>

                  <div className="space-y-4 border-l border-slate-200 pl-8 relative">
                     <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-xs">Step</div>
                     <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                        <Upload className="w-6 h-6 text-blue-600" />
                     </div>
                     <h4 className="font-bold text-slate-800">2. อัปโหลดไฟล์ใหม่</h4>
                     <p className="text-sm text-slate-500">นำไฟล์ที่แก้ไขแล้วมาอัปโหลดเพื่อใช้คำนวณ</p>
                     <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors text-sm shadow-md">
                      เลือกไฟล์ & อัปเดต
                    </button>
                  </div>
               </div>
               <div className="p-4 bg-yellow-50 text-xs text-yellow-800 border-t border-yellow-100 text-center">
                  ✅ การอัปโหลดไฟล์นี้จะบันทึกราคาลง Database ทันที (พนักงานทุกคนจะเห็นราคาใหม่นี้)
               </div>
             </div>
           </div>
        )}

        {/* Main Interface (Calculator) */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex overflow-x-auto gap-2 no-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Icon className="w-4 h-4" /> {tab.label}
                  </button>
                );
              })}
            </div>
            {/* Form Content */}
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 1. Structure & Size */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600"/> ข้อมูลโครงสร้างและขนาด</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">ประเภทการใช้งาน</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                                {['ภายนอก', 'ภายใน'].map(t => (
                                    <button key={t} onClick={() => handleInputChange('type', t)} className={`flex-1 py-2 text-sm rounded-md transition-all ${formData.type === t ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}>{t}</button>
                                ))}
                            </div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">โครงสร้างวัสดุ</label>
                            <select value={formData.structure} onChange={(e) => handleInputChange('structure', e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="uPVC">ประตู uPVC</option>
                                <option value="WPC RIGID">ประตู WPC RIGID</option>
                                <option value="WPC MAX">ประตู WPC MAX</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">ขนาดประตู</label>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {[{id: '70x200cm', label: '70x200cm'}, {id: '80x200cm', label: '80x200cm'}, {id: '90x200cm', label: '90x200cm'}, {id: 'custom', label: 'อื่นๆ (Custom)'}].map(s => (
                                    <div key={s.id} onClick={() => handleInputChange('sizeType', s.id)} className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${formData.sizeType === s.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200 hover:border-blue-300'}`}><div className="text-sm">{s.label}</div></div>
                                ))}
                            </div>
                            {formData.sizeType === 'custom' && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 animate-in fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs text-slate-600 font-medium">กว้าง (Max 95cm)</label><input type="number" step="1" min={1} max={95} value={formData.customWidth} onChange={(e) => handleInputChange('customWidth', e.target.value)} className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-yellow-400 outline-none bg-white"/></div>
                                        <div><label className="text-xs text-slate-600 font-medium">สูง (Max 240cm)</label><input type="number" step="1" min={1} max={240} value={formData.customHeight} onChange={(e) => handleInputChange('customHeight', e.target.value)} className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-yellow-400 outline-none bg-white"/></div>
                                    </div>
                                    {activeSurcharges.length > 0 && <div className="mt-3 pt-3 border-t border-yellow-200 text-xs text-orange-700"><div className="font-semibold flex items-center gap-1 mb-1"><AlertCircle className="w-3 h-3"/> เงื่อนไขราคาพิเศษ:</div><ul className="list-disc list-inside space-y-1">{activeSurcharges.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* 2. Surface */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-purple-600"/> สีและดีไซน์หน้าบาน</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-3">
                            <label className="block text-sm font-medium text-slate-600">เลือกชนิดผิว/สี</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div onClick={() => handleInputChange('surfaceType', 'TOA')} className={`p-4 rounded-lg border-2 cursor-pointer ${formData.surfaceType === 'TOA' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                                    <div className="flex items-center gap-2 mb-2"><div className={`w-4 h-4 rounded-full border ${formData.surfaceType === 'TOA' ? 'bg-purple-500' : 'bg-white'}`}></div>ผิวเรียบพ่นสี TOA</div>
                                    {formData.surfaceType === 'TOA' && <input type="text" placeholder="ระบุโค้ดสี TOA" value={formData.toaCode} onChange={(e) => handleInputChange('toaCode', e.target.value)} className="w-full p-2 text-sm border rounded focus:outline-none focus:border-purple-500" onClick={(e) => e.stopPropagation()}/>}
                                </div>
                                <div onClick={() => handleInputChange('surfaceType', 'SVL')} className={`p-4 rounded-lg border-2 cursor-pointer ${formData.surfaceType === 'SVL' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                                    <div className="flex items-center gap-2 mb-2"><div className={`w-4 h-4 rounded-full border ${formData.surfaceType === 'SVL' ? 'bg-purple-500' : 'bg-white'}`}></div>ปิดผิว SVL</div>
                                    {formData.surfaceType === 'SVL' && <select value={formData.svlCode} onChange={(e) => handleInputChange('svlCode', e.target.value)} className="w-full p-2 text-sm border rounded focus:outline-none focus:border-purple-500" onClick={(e) => e.stopPropagation()}><option value="SVL F-102">SVL F-102</option><option value="M-304-1">M-304-1</option></select>}
                                </div>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">การเซาะร่อง</label>
                            <select value={formData.grooving} onChange={(e) => handleInputChange('grooving', e.target.value)} className="w-full p-2.5 border rounded-lg"><option value="none">ไม่เซาะร่อง</option><option value="standard">เซาะร่องปกติ</option><option value="black_line">เซาะร่องแปะเส้นดำ</option><option value="painted">เซาะร่องทำสี</option></select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">ติดคิ้วพ่นสี</label>
                            <select value={formData.molding} onChange={(e) => handleInputChange('molding', e.target.value)} className="w-full p-2.5 border rounded-lg"><option value="none">ไม่ติดคิ้ว</option><option value="first_1">First Class 1 ช่อง</option><option value="first_2">First Class 2 ช่อง</option><option value="roma_1">ROMA 1 ช่อง</option><option value="roma_2">ROMA 2 ช่อง</option></select>
                        </div>
                         <div><label className="block text-sm font-medium text-slate-600 mb-1">กระจก</label><select value={formData.glass} onChange={(e) => handleInputChange('glass', e.target.value)} className="w-full p-2.5 border rounded-lg"><option value="none">ไม่ติดกระจก</option><option value="frosted">กระจกฝ้าเต็มบาน</option></select></div>
                         <div><label className="block text-sm font-medium text-slate-600 mb-1">เกล็ดระบายอากาศ</label><select value={formData.louver} onChange={(e) => handleInputChange('louver', e.target.value)} className="w-full p-2.5 border rounded-lg"><option value="none">ไม่ใส่เกล็ด</option><option value="full">เกล็ดเต็มบาน</option></select></div>
                    </div>
                </div>

                {/* 3. Drilling & Reinforce */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-orange-600"/> การเจาะและเสริมโครง</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium text-slate-600 mb-1">เสริมโครง</label><select value={formData.reinforce} onChange={(e) => handleInputChange('reinforce', e.target.value)} className="w-full p-2.5 border rounded-lg"><option value="none">ไม่เสริมโครง</option><option value="lever">เสริมโครงก้านโยก</option></select></div>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1">การเจาะลูกบิด</label><select value={formData.drilling} onChange={(e) => handleInputChange('drilling', e.target.value)} className="w-full p-2.5 border rounded-lg"><option value="none">ไม่เจาะลูกบิด</option><option value="knob">เจาะลูกบิด</option></select></div>
                    </div>
                </div>

                {/* 4. Options */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-green-600"/> Option เสริม</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { key: 'shock_up', label: 'เสริมโครงติด SHOCK UP' }, { key: 'handle', label: 'เสริมโครงด้ามจับ' },
                            { key: 'sliding', label: 'เสริมโครงบานเลื่อน' }, { key: 'stopper', label: 'เสริมโครง Stopper' },
                            { key: 'peephole', label: 'เจาะตาแมว' }, { key: 'rabbet', label: 'ทำบังใบ' },
                            { key: 'knob_plate_40', label: 'เสริมโครงแป้นรองลูกบิด 40cm' }, { key: 'wood_top_bottom', label: 'เสริมโครงไม้สังเคราะห์ บน หรือ ล่าง' },
                        ].map(opt => (
                            <label key={opt.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                <div className="flex items-center space-x-3"><input type="checkbox" checked={formData.options[opt.key]} onChange={() => handleOptionToggle(opt.key)} className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"/><span className="text-slate-700 text-sm">{opt.label}</span></div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:w-96 shrink-0">
             <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-8 overflow-hidden">
                <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2"><FileText className="w-5 h-5" /> สรุปรายการ</h2>
                  <span className="text-xs bg-slate-700 px-2 py-1 rounded">Draft</span>
                </div>
                <div className="p-6 space-y-6">
                  <div className="text-center pb-6 border-b border-slate-100">
                    <p className="text-slate-500 text-sm mb-1">ราคาสุทธิ (อัปเดตล่าสุด)</p>
                    <div className="text-4xl font-bold text-blue-600">฿{totalPrice.toLocaleString()}</div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">รายละเอียดสินค้า</h4>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">ประเภท</span><span className="text-slate-800 font-medium">{formData.structure} ({formData.type})</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">ขนาด</span><span className="text-slate-800 font-medium">{formData.sizeType === 'custom' ? `${formData.customWidth}x${formData.customHeight}cm` : formData.sizeType}</span></div>
                    {(formData.grooving !== 'none' || formData.molding !== 'none' || formData.glass !== 'none' || formData.reinforce !== 'none') && <div className="text-xs text-slate-400 mt-2">มีงานเพิ่มเติม (เซาะร่อง/คิ้ว/กระจก/โครง)</div>}
                    {Object.values(formData.options).some(Boolean) && <div className="text-xs text-slate-400">มี Option เสริม</div>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                     <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium"><Check className="w-4 h-4" /> บันทึก</button>
                     <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium shadow-sm"><ShoppingCart className="w-4 h-4" /> สั่งซื้อ</button>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}