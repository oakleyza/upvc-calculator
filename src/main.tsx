import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ป้องกัน scroll เมาส์เปลี่ยนค่าใน input[type=number] ทั่วทั้งแอป
// capture:true  → ดักจับ event ก่อน browser จะส่งต่อลงถึง input
// passive:false → อนุญาตให้เรียก preventDefault() เพื่อยกเลิกการเปลี่ยนค่า
document.addEventListener('wheel', (e: WheelEvent) => {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement && active.type === 'number') {
    e.preventDefault(); // ยกเลิกการเปลี่ยนค่าก่อน browser ประมวลผล
    active.blur();      // เอา focus ออกเพื่อป้องกัน scroll ครั้งถัดไปด้วย
  }
}, { passive: false, capture: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
