import { del, get, set } from 'idb-keyval';
import { uid } from './random';

// Uploaded images live in IndexedDB (localStorage is too small for them).

const SIZE = 256;
const urls = new Map<string, Promise<string | null>>();
const elements = new Map<string, Promise<HTMLImageElement | null>>();

/** Centre-crops to a square and scales down to 256×256 WebP (PNG as fallback). */
export async function resizeImage(file: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const out = Math.min(SIZE, side);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('Canvas not supported');
  g.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out);
  bmp.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (blob && blob.type === 'image/webp') return blob;
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed'))), 'image/png'),
  );
}

export async function saveImage(file: Blob): Promise<string> {
  const blob = await resizeImage(file);
  const id = `img_${uid()}`;
  await set(id, blob);
  return id;
}

export function getImageUrl(id: string): Promise<string | null> {
  let p = urls.get(id);
  if (!p) {
    p = get<Blob>(id)
      .then((blob) => (blob ? URL.createObjectURL(blob) : null))
      .catch(() => null);
    urls.set(id, p);
  }
  return p;
}

export function loadImage(id: string): Promise<HTMLImageElement | null> {
  let p = elements.get(id);
  if (!p) {
    p = getImageUrl(id).then(
      (url) =>
        new Promise<HTMLImageElement | null>((resolve) => {
          if (!url) return resolve(null);
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = url;
        }),
    );
    elements.set(id, p);
  }
  return p;
}

export async function deleteImage(id: string): Promise<void> {
  const url = await urls.get(id);
  if (url) URL.revokeObjectURL(url);
  urls.delete(id);
  elements.delete(id);
  await del(id);
}
