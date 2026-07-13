# CLAUDE.md — บันทึกสำคัญสำหรับโปรเจกต์ upvc-dashboard

## 🚀 Deployment

**Platform: Vercel** (ไม่มี `vercel.json` ในโปรเจกต์ — connect ผ่าน GitHub โดยตรง)

- **Repo:** `https://github.com/oakleyza/upvc-calculator.git`
- **Branch:** `main` → auto-deploy ทันทีเมื่อ push

**คำสั่ง deploy:**
```bash
git add .
git commit -m "..."
git push origin main
```
Vercel build และ deploy อัตโนมัติ ไม่ต้องทำอะไรเพิ่ม

> ⚠️ ข้อผิดพลาดที่เคยเกิด: ตรวจสอบแค่ไฟล์ config (`firebase.json`, `vercel.json`) แล้วสรุปว่ายังไม่มี hosting
> การเช็คที่ถูกต้องต้องดู **git log** ด้วยเสมอ เพราะ Vercel ไม่จำเป็นต้องมีไฟล์ config ในโปรเจกต์

---

## 🔥 Firebase

- **Project ID:** `upvc-calc`
- **ใช้:** Firestore เท่านั้น (ไม่ใช้ Firebase Hosting)
- **Config:** hardcode ใน `src/lib/firebase.ts` (ไม่ใช้ `.env` — จงใจเพื่อให้ build ผ่านโดยไม่ต้องพึ่ง env)
- **Security Rules:** `allow read, write: if true` (ใช้ password hash แทน Firebase Auth)

---

## 🏗️ Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v3
- Firebase Firestore (real-time price sync)
- SHA-256 + salt password hashing, session ใน localStorage (30 วัน)

---

## 📁 โครงสร้างสำคัญ

| ไฟล์ | หน้าที่ |
|------|---------|
| `src/types.ts` | TypeScript interfaces ทั้งหมด |
| `src/constants.ts` | WOOD_MODEL_NAMES (m1–m37), DEFAULT_PRICES, LABEL_MAP |
| `src/lib/calculations.ts` | pure functions คำนวณราคา |
| `src/lib/auth.ts` | hash, session, rate limit |
| `src/components/WoodDoorCalculator.tsx` | หน้าคำนวณประตูไม้ |
| `src/components/AdminPriceEditor.tsx` | หลังบ้านตั้งราคา |
| `src/components/PriceSummary.tsx` | สรุปราคาขวามือ |
| `public/wood-models/` | รูปประตูไม้ m1.jpg–m37.jpg |

---

## 🪵 ระบบประตูไม้

### Price key format
- ค่าไม้ตั้งต้น: `wd_base_{woodType}_{modelId}_wood`
- ค่าทำสีตั้งต้น: `wd_base_{woodType}_{modelId}_paint`
- ส่วนต่างกว้าง (ปกติ): `wd_w_71_80` ... `wd_w_121_plus`
- ส่วนต่างสูง (ปกติ): `wd_h_201_210` ... `wd_h_291_plus`
- ส่วนต่างกว้าง (โค้ง): `wd_curve_w_71_80` ... `wd_curve_w_121_plus`
- ส่วนต่างสูง (โค้ง): `wd_curve_h_201_210` ... `wd_curve_h_291_plus`
- ราคากระจก: `wd_glass_plain_{modelId}`, `wd_glass_w_*`, `wd_glass_h_*`

### Model IDs
- m1–m12: ประตูทึบรุ่นพื้นฐาน
- m13: ประตูฟักสองลูกคิ้วเสริมหนึ่งชั้น ฟักโค้งบน
- m14–m31: ประตูกระจก (ชื่อมีคำว่า "กระจก" → auto-show glass selector)
- m32–m37: ประตูโค้ง (WOOD_CURVE_MODEL_IDS) → ใช้ `wd_curve_*` surcharge

### Feature detection
- **มีกระจก:** `modelName.includes('กระจก')` — ไม่ต้องมี config แยก
- **ประตูโค้ง:** `WOOD_CURVE_MODEL_IDS.has(modelId)` = Set(['m32'...'m37'])
