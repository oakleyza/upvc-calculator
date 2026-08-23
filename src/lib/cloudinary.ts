// ------------------------------------------------------------------
// Cloudinary upload helper — compress ก่อน แล้วค่อย upload
// ------------------------------------------------------------------
const CLOUD_NAME   = 'djztwnvnx';
const UPLOAD_PRESET = 'x54zzclg';

/** Compress + upload ไฟล์รูป → คืน secure_url */
export async function compressAndUpload(
  file: File,
  folder = 'wood-catalogue',
): Promise<string> {
  const compressed = await compressImage(file, 800, 800, 0.75);
  const formData   = new FormData();
  formData.append('file',           compressed);
  formData.append('upload_preset',  UPLOAD_PRESET);
  formData.append('folder',         folder);

  const res  = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'Cloudinary upload failed');
  return data.secure_url as string;
}

/** Compress รูปให้ไม่เกิน maxW×maxH ด้วย canvas */
function compressImage(
  file: File,
  maxW: number,
  maxH: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img    = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      let { width, height } = img;
      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('canvas.toBlob failed')),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = reject;
    img.src = objUrl;
  });
}
