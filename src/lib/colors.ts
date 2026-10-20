import type { PaletteId } from '../types';

export const INK = '#2B2240';
export const WHITE = '#FFFFFF';

export const PALETTES: Record<PaletteId, string[]> = {
  snoep: ['#FF6B6B', '#FFB547', '#3DD6A3', '#4CB8FF', '#A88BFF', '#FF7EB6'],
  oceaan: ['#4CB8FF', '#3DD6C9', '#8FD3FF', '#6C9BFF', '#A0E7E5', '#2EC4B6'],
  zonsondergang: ['#FF7A59', '#FFB547', '#FF8FA3', '#FFD166', '#F6A6FF', '#FF9F68'],
  regenboog: ['#FF6B6B', '#FFA94D', '#FFE066', '#69DB7C', '#4DABF7', '#B197FC'],
  pastel: ['#FFC9DE', '#FFE5B4', '#C3F5DD', '#C5E4FF', '#E0D4FF', '#FFF3B0'],
};

export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Dark ink or white, whichever reads better on `bg`. */
export function textColorFor(bg: string): string {
  return contrastRatio(bg, INK) >= contrastRatio(bg, WHITE) ? INK : WHITE;
}

export function isHexColor(s: unknown): s is string {
  return typeof s === 'string' && parseHex(s) !== null;
}

/** CSS conic-gradient with equal slices, for small wheel previews. */
export function conic(colors: string[]): string {
  const step = 100 / colors.length;
  return `conic-gradient(${colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(', ')})`;
}
