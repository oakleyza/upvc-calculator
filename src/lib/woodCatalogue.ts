// ------------------------------------------------------------------
// Firestore CRUD สำหรับ collection `wood_catalogue`
// Auto-seed จาก constants ถ้า collection ว่างเปล่าครั้งแรก
// ------------------------------------------------------------------
import {
  collection, doc, onSnapshot, writeBatch,
  addDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { WOOD_MODEL_NAMES, WOOD_MODEL_IMAGES } from '../constants';
import type { CatalogueItem } from '../types';

let seeding = false;

/** Subscribe realtime — คืน unsubscribe fn */
export function subscribeCatalogue(cb: (items: CatalogueItem[]) => void): () => void {
  if (!db) { cb([]); return () => {}; }
  const ref = collection(db, 'wood_catalogue');
  return onSnapshot(ref, async (snap) => {
    if (snap.empty && !seeding) {
      seeding = true;
      await seedCatalogue();
      return; // snapshot จะถูกยิงอีกครั้งหลัง seed เสร็จ
    }
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CatalogueItem));
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    seeding = false;
    cb(items);
  });
}

/** Seed ข้อมูลเริ่มต้นจาก WOOD_MODEL_NAMES + WOOD_MODEL_IMAGES */
async function seedCatalogue() {
  if (!db) return;
  const ref     = collection(db, 'wood_catalogue');
  const batch   = writeBatch(db);
  const entries = Object.entries(WOOD_MODEL_NAMES);
  entries.forEach(([key, name], idx) => {
    const docRef = doc(ref);
    batch.set(docRef, {
      name,
      imageUrl:   WOOD_MODEL_IMAGES[key] ?? '',
      sortOrder:  idx,
      legacyKey:  key,
      createdAt:  new Date().toISOString(),
    });
  });
  await batch.commit();
}

/** เพิ่มรายการใหม่ */
export async function addCatalogueItem(
  name: string,
  imageUrl: string,
  sortOrder: number,
): Promise<void> {
  if (!db) return;
  await addDoc(collection(db, 'wood_catalogue'), {
    name, imageUrl, sortOrder,
    createdAt: new Date().toISOString(),
  });
}

/** แก้ไขรายการ */
export async function updateCatalogueItem(
  id: string,
  data: Partial<Omit<CatalogueItem, 'id'>>,
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'wood_catalogue', id), data as Record<string, unknown>);
}

/** ลบรายการ */
export async function deleteCatalogueItem(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'wood_catalogue', id));
}

/** บันทึกลำดับใหม่ทั้งหมดใน batch */
export async function saveSortOrder(items: CatalogueItem[]): Promise<void> {
  if (!db) return;
  const batch = writeBatch(db);
  items.forEach((item, idx) => {
    batch.update(doc(db!, 'wood_catalogue', item.id), { sortOrder: idx });
  });
  await batch.commit();
}
