import { useState, useEffect } from 'react';
import { DoorOpen, Maximize, Settings, User, LogOut, Users, TreePine, Layers } from 'lucide-react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

import { db, isFirebaseConfigured } from './lib/firebase';
import { loadSession, clearSession, secureHash, generateSalt } from './lib/auth';
import { calculateDoorPrice, calculateFramePrice, calculateWoodDoorPrice } from './lib/calculations';

import type { SessionUser, PricingStructure, DoorFormData, FrameFormData, WoodDoorFormData, PriceResult, TabInfo } from './types';
import {
  DEFAULT_PRICES, DEFAULT_DOOR_FORM, DEFAULT_FRAME_FORM, DEFAULT_WOOD_DOOR_FORM,
  DEFAULT_USERS_SEED, isFrameWithSub,
} from './constants';

import { LoginScreen }           from './components/LoginScreen';
import { AdminPriceEditor }      from './components/AdminPriceEditor';
import { UserManagementPanel }   from './components/UserManagementPanel';
import { DoorCalculator }        from './components/DoorCalculator';
import { FrameCalculator }       from './components/FrameCalculator';
import { WoodDoorCalculator }    from './components/WoodDoorCalculator';
import { PriceSummary }          from './components/PriceSummary';

// ------------------------------------------------------------------
const TABS: TabInfo[] = [
  { id: 'wood',       label: 'ประตูไม้ (ทดลองใช้)', icon: TreePine },
  { id: 'wood_frame', label: 'วงกบไม้',              icon: Layers   },
  { id: 'exclusive',  label: 'ประตู uPVC',           icon: DoorOpen },
  { id: 'frame',      label: 'วงกบ WPC',             icon: Maximize },
];

// ------------------------------------------------------------------
export default function App() {
  const [currentUser,    setCurrentUser]    = useState<SessionUser | null>(null);
  const [activeTab,      setActiveTab]      = useState<string>('wood');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel,  setShowUserPanel]  = useState(false);
  const [prices,         setPrices]         = useState<PricingStructure>(DEFAULT_PRICES);
  const [isFirebaseReady,setIsFirebaseReady]= useState(false);
  const [isPricesLoading,setIsPricesLoading]= useState(true);
  const [permissionError,setPermissionError]= useState(false);

  // C-3 FIX: ลบ dead fields ออก (toaCode, svlCode, wallThickness, door type)
  const [doorForm,    setDoorForm]    = useState<DoorFormData>(DEFAULT_DOOR_FORM);
  const [frameForm,   setFrameForm]   = useState<FrameFormData>(DEFAULT_FRAME_FORM);
  const [woodForm,    setWoodForm]    = useState<WoodDoorFormData>(DEFAULT_WOOD_DOOR_FORM);
  const [priceResult, setPriceResult] = useState<PriceResult>({ total: 0, surcharges: [] });

  useEffect(() => { document.title = 'ระบบคำนวนราคา -กลางซอยค้าไม้-'; }, []);

  // 1. Restore session (S-4: expiry ตรวจภายใน loadSession)
  useEffect(() => {
    const session = loadSession();
    if (session) setCurrentUser(session);

    // FIX: ถ้า Firebase ไม่ configured ให้ set ready=true ทันทีพร้อม error
    // (แทนที่จะ stuck ที่ "กำลังเชื่อมต่อ..." ตลอดไป)
    if (!isFirebaseConfigured()) {
      setIsFirebaseReady(true);
      setPermissionError(true);
      return;
    }

    // B-5 FIX: seed users ก่อน แล้วค่อย setIsFirebaseReady(true)
    const initSystem = async () => {
      try {
        for (const u of DEFAULT_USERS_SEED) {
          const userRef  = doc(db!, 'users', u.id);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const salt = generateSalt();
            const hash = await secureHash(u.password, salt);
            await setDoc(userRef, {
              id: u.id, username: u.username,
              passwordHash: hash, passwordSalt: salt,
              name: u.name, role: u.role,
            });
          }
        }
        const priceRef = doc(db!, 'config', 'prices');
        const priceDoc = await getDoc(priceRef);
        if (!priceDoc.exists()) await setDoc(priceRef, DEFAULT_PRICES);
      } catch (err: unknown) {
        const fe = err as { code?: string };
        // แจ้ง warning ทุกกรณี เพื่อให้ admin รู้ว่ามีปัญหาการเชื่อมต่อ
        setPermissionError(true);
        console.error('[initSystem] error:', fe.code ?? err);
      } finally {
        // B-5 FIX: ตั้ง ready หลัง seed เสร็จ (ไม่ใช่ก่อน)
        setIsFirebaseReady(true);
      }
    };
    initSystem();
  }, []);

  // 2. Listen for prices (real-time)
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsub = onSnapshot(doc(db!, 'config', 'prices'), docSnap => {
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as PricingStructure;
        const merged: PricingStructure = {
          ...DEFAULT_PRICES, ...firestoreData,
          frame_size:    { ...DEFAULT_PRICES.frame_size,    ...(firestoreData.frame_size    ?? {}) },
          frame_surface: { ...DEFAULT_PRICES.frame_surface, ...(firestoreData.frame_surface ?? {}) },
          frame_base:    { ...DEFAULT_PRICES.frame_base,    ...(firestoreData.frame_base    ?? {}) },
          door_base:     { ...DEFAULT_PRICES.door_base,     ...(firestoreData.door_base     ?? {}) },
          door_size:     { ...DEFAULT_PRICES.door_size,     ...(firestoreData.door_size     ?? {}) },
          door_surface:  { ...DEFAULT_PRICES.door_surface,  ...(firestoreData.door_surface  ?? {}) },
          grooving:      { ...DEFAULT_PRICES.grooving,      ...(firestoreData.grooving      ?? {}) },
          molding:       { ...DEFAULT_PRICES.molding,       ...(firestoreData.molding       ?? {}) },
          glass:         { ...DEFAULT_PRICES.glass,         ...(firestoreData.glass         ?? {}) },
          louver:        { ...DEFAULT_PRICES.louver,        ...(firestoreData.louver        ?? {}) },
          reinforce:     { ...DEFAULT_PRICES.reinforce,     ...(firestoreData.reinforce     ?? {}) },
          drilling:      { ...DEFAULT_PRICES.drilling,      ...(firestoreData.drilling      ?? {}) },
          options:          { ...DEFAULT_PRICES.options,          ...(firestoreData.options          ?? {}) },
          wood_door_price:  { ...DEFAULT_PRICES.wood_door_price,  ...(firestoreData.wood_door_price  ?? {}) },
          wood_door_paint:  { ...DEFAULT_PRICES.wood_door_paint,  ...(firestoreData.wood_door_paint  ?? {}) },
          wood_door_glass:  { ...DEFAULT_PRICES.wood_door_glass,  ...(firestoreData.wood_door_glass  ?? {}) },
        };
        setPrices(merged);
      } else {
        setPrices(DEFAULT_PRICES);
      }
      setIsPricesLoading(false);
    }, error => {
      const fe = error as { code?: string };
      if (fe.code === 'permission-denied') setPermissionError(true);
      setIsPricesLoading(false);
    });
    return () => unsub();
  }, []);

  // 3. คำนวณราคา (pure function)
  useEffect(() => {
    if (activeTab === 'exclusive') {
      setPriceResult(calculateDoorPrice(doorForm, prices));
    } else if (activeTab === 'frame') {
      setPriceResult(calculateFramePrice(frameForm, prices));
    } else if (activeTab === 'wood') {
      setPriceResult(calculateWoodDoorPrice(woodForm, prices));
    } else if (activeTab === 'wood_frame') {
      setPriceResult({ total: 0, surcharges: [] });
    }
  }, [doorForm, frameForm, woodForm, prices, activeTab]);

  // Auto-switch: วงกบที่ไม่มีซับ → SVL ไม่ได้
  useEffect(() => {
    if (!isFrameWithSub(frameForm.frameMaterial) && frameForm.surfaceType === 'SVL') {
      setFrameForm(prev => ({ ...prev, surfaceType: 'TOA' }));
    }
  }, [frameForm.frameMaterial]);

  // Auto-switch: SVL → ติดคิ้วไม่ได้
  useEffect(() => {
    if (doorForm.surfaceType === 'SVL') {
      setDoorForm(prev => ({ ...prev, molding: 'none' }));
    }
  }, [doorForm.surfaceType]);

  // Auto-switch: ติดคิ้ว → เซาะร่องไม่ได้
  useEffect(() => {
    if (doorForm.molding !== 'none' && doorForm.grooving !== 'none') {
      setDoorForm(prev => ({ ...prev, grooving: 'none' }));
    }
  }, [doorForm.molding]);

  // Auto-switch: ติดคิ้ว + เกล็ด → ไม่มีกระจกพร้อมกัน
  useEffect(() => {
    if (doorForm.molding !== 'none' && doorForm.glass !== 'none' && doorForm.louver !== 'none') {
      setDoorForm(prev => ({ ...prev, louver: 'none' }));
    }
  }, [doorForm.glass]);

  useEffect(() => {
    if (doorForm.molding !== 'none' && doorForm.glass !== 'none' && doorForm.louver !== 'none') {
      setDoorForm(prev => ({ ...prev, glass: 'none' }));
    }
  }, [doorForm.louver]);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  const handlePriceUpdate = async (newPrices: PricingStructure) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'config', 'prices'), newPrices);
      alert('✅ บันทึกราคาเรียบร้อยแล้ว');
      setShowAdminPanel(false);
    } catch {
      alert('❌ เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // C-4 FIX: ใช้ type ที่ถูกต้องแทน any
  const handleDoorInput = (field: keyof DoorFormData, value: string | boolean | Record<string, boolean>) => {
    setDoorForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFrameInput = (field: keyof FrameFormData, value: string) => {
    setFrameForm(prev => ({ ...prev, [field]: value }));
  };

  const handleWoodInput = (field: keyof WoodDoorFormData, value: string | boolean) => {
    setWoodForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionToggle = (optionKey: string) =>
    setDoorForm(prev => ({
      ...prev,
      options: { ...prev.options, [optionKey]: !prev.options[optionKey] },
    }));

  // B-3 FIX: Guard ป้องกัน reset form เมื่อคลิก tab เดิมซ้ำ
  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);
    if (tabId === 'exclusive') setDoorForm(DEFAULT_DOOR_FORM);
    if (tabId === 'frame')     setFrameForm(DEFAULT_FRAME_FORM);
    if (tabId === 'wood')      setWoodForm(DEFAULT_WOOD_DOOR_FORM);
  };

  const handleLogout = () => { clearSession(); setCurrentUser(null); };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={setCurrentUser}
        isFirebaseReady={isFirebaseReady}
        permissionError={permissionError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200">
              {/* C-6 FIX: ใช้ local file แทน external URL */}
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">ระบบคำนวนราคา -กลางซอยค้าไม้-</h1>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <User className="w-3 h-3" /> {currentUser.name} ({currentUser.role})
              </span>
              <button onClick={handleLogout}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <LogOut className="w-3 h-3" /> ออกจากระบบ
              </button>
            </div>
            {currentUser.role === 'admin' && (
              <>
                <button onClick={() => setShowUserPanel(true)}
                  className="p-2.5 bg-white border rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                  <Users className="w-4 h-4 text-blue-600" />
                </button>
                <button onClick={() => setShowAdminPanel(true)}
                  className="p-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                  <Settings className="w-4 h-4 text-yellow-400" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Modals */}
        {showUserPanel  && (
          <UserManagementPanel currentUser={currentUser} onClose={() => setShowUserPanel(false)} />
        )}
        {showAdminPanel && (
          <AdminPriceEditor currentPrices={prices} onSave={handlePriceUpdate} onClose={() => setShowAdminPanel(false)} />
        )}

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {/* Tab bar */}
            <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex overflow-x-auto gap-2">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'wood' && (
              <WoodDoorCalculator form={woodForm} onInput={handleWoodInput} />
            )}
            {activeTab === 'wood_frame' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 flex flex-col items-center justify-center text-center gap-3">
                <Layers className="w-14 h-14 text-slate-200" />
                <p className="text-lg font-semibold text-slate-400">วงกบไม้</p>
                <p className="text-sm text-slate-300">กำลังพัฒนา</p>
              </div>
            )}
            {activeTab === 'exclusive' && (
              <DoorCalculator
                form={doorForm}
                onInput={handleDoorInput}
                onOptionToggle={handleOptionToggle}
              />
            )}
            {activeTab === 'frame' && (
              <FrameCalculator form={frameForm} onInput={handleFrameInput} />
            )}
          </div>

          {/* Price summary */}
          <PriceSummary
            activeTab={activeTab}
            doorForm={doorForm}
            frameForm={frameForm}
            woodForm={woodForm}
            priceResult={priceResult}
            isPricesLoading={isPricesLoading}
          />
        </div>
      </div>
    </div>
  );
}
