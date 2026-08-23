// รัน: node seed-catalogue.mjs
// seed ข้อมูล wood_catalogue ลง Firestore โดยใช้ Firebase JS SDK
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyArPJYIIChxZiZXRAIS_MTLlAKoVxr2qEc',
  authDomain:        'upvc-calc.firebaseapp.com',
  projectId:         'upvc-calc',
  storageBucket:     'upvc-calc.firebasestorage.app',
  messagingSenderId: '994926197400',
  appId:             '1:994926197400:web:087ef98f9dac042dbeeeed',
};

const WOOD_MODEL_NAMES = {
  m1:'ประตูฟักหนึ่งลูก', m2:'ประตูฟักหนึ่งลูกคิ้วเสริมหนึ่งชั้น',
  m3:'ประตูฟักหนึ่งลูกคิ้วเสริมสองชั้น', m4:'ประตูฟักสองลูก',
  m5:'ประตูฟักสองลูกคิ้วเสริมหนึ่งชั้น', m6:'ประตูฟักสองลูก คิ้วเสริมสองชั้น',
  m7:'ประตูฟักสองลูก คิ้วเสริมสองชั้น คิ้วใหญ่', m8:'ประตูฟักสามลูก คิ้วเสริมหนึ่งชั้น',
  m9:'ประตูโมเดิร์นนอน', m10:'ประตูโมเดิร์นนอนมุมโค้ง',
  m11:'ประตูโมเดิร์นตั้งไม่มีขอบ', m12:'ประตูซี่ระแนง',
  m13:'ประตูฟักสองลูกคิ้วเสริมหนึ่งชั้น ฟักโค้งบน',
  m14:'ประตูกระจกโค้งหกช่อง ฟักลูกเดียวคิ้วเสริมสองชั้น',
  m15:'ประตูกระจกโค้งครึ่งบาน ฟักลูกเดียว',
  m16:'ประตูกระจกโค้งครึ่งบาน ฟักลูกเดียว เซาะร่องลูกฟัก',
  m17:'ประตูกระจกโค้งครึ่งบาน ฟักลูกเดียว คิ้วเสริมหนึ่งชั้น',
  m18:'ประตูกระจกครึ่งบาน ฟักลูกเดียว', m19:'ประตูกระจกเก้าช่อง ฟักสองลูก',
  m20:'ประตูกระจกหกช่อง ฟักลูกเดียว', m21:'ประตูกระจกสิบช่อง ฟักลูกเดียวเสมอขอบ',
  m22:'ประตูกระจกหกช่อง ฟักลูกเดียว คิ้วเสริมหนึ่งชั้น',
  m23:'ประตูกระจกหกช่อง ฟักลูกเดียว คิ้วเสริมสองชั้น',
  m24:'ประตูกระจกสี่ช่อง ฟักลูกเดียวสองชั้น คิ้วเสริมสองชั้น',
  m25:'ประตูกระจกสองช่องมุมโค้ง', m26:'ประตูกระจกสิบช่อง',
  m27:'ประตูกระจกหกช่อง ทึบล่าง', m28:'ประตูกระจกหกช่องเล็ก ฟักสองลูก',
  m29:'ประตูกรอบโล่งแคปซูล', m30:'ประตูกรอบโล่ง',
  m31:'ประตูทึบเรียบ เจาะกระจกกลม', m32:'ประตูโค้ง ฟักลูกเดียว',
  m33:'ประตูโค้ง ฟักสองลูก คิ้วเสริมหนึ่งชั้น',
  m34:'ประตูโค้ง กระจกครึ่งบาน ฟักลูกเดียว',
  m35:'ประตูโค้ง กระจกหกช่อง', m36:'ประตูโค้ง กรอบโล่ง',
  m37:'ประตูโค้ง กระจกหกช่อง ฟักลูกเดียว',
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

async function seed() {
  const ref  = collection(db, 'wood_catalogue');
  const snap = await getDocs(ref);
  if (!snap.empty) {
    console.log(`มีข้อมูลอยู่แล้ว ${snap.size} รายการ — ไม่ seed ซ้ำ`);
    process.exit(0);
  }

  const entries = Object.entries(WOOD_MODEL_NAMES);
  const batch   = writeBatch(db);
  entries.forEach(([key, name], idx) => {
    batch.set(doc(ref), {
      name, imageUrl: '', sortOrder: idx,
      legacyKey: key, createdAt: new Date().toISOString(),
    });
  });

  await batch.commit();
  console.log(`✅ seed สำเร็จ ${entries.length} รายการ`);
  process.exit(0);
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
