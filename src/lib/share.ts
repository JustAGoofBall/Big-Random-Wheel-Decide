import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Item, PaletteId, Wheel } from '../types';
import { PALETTE_IDS, isHexColor } from './colors';
import { MAX_LABEL, clampWeight } from './parseList';

export const MAX_ITEMS = 100;
const HASH_KEY = 'w';

/** Compact wire format: { n: name, p: palette, i: [label, weight, emoji?, color?][] } */
type Wire = { v: 1; n: string; p: PaletteId; i: [string, number, string?, string?][] };

export type SharedWheel = { name: string; palette: PaletteId; items: Omit<Item, 'id'>[] };

export function encodeWheel(wheel: Pick<Wheel, 'name' | 'palette' | 'items'>): string {
  const wire: Wire = {
    v: 1,
    n: wheel.name,
    p: wheel.palette,
    i: wheel.items.map((it) => {
      const row: [string, number, string?, string?] = [it.label, it.weight];
      if (it.emoji || it.color) row.push(it.emoji ?? '');
      if (it.color) row.push(it.color);
      return row;
    }),
  };
  return compressToEncodedURIComponent(JSON.stringify(wire));
}

/** Decodes and validates a payload. Returns null for anything malformed. */
export function decodeWheel(payload: string): SharedWheel | null {
  try {
    const json = decompressFromEncodedURIComponent(payload);
    return json ? fromWire(JSON.parse(json)) : null;
  } catch {
    return null;
  }
}

/** Validates untrusted wire data: caps sizes, clamps weights and drops bad fields. */
function fromWire(wire: unknown): SharedWheel | null {
  if (!wire || typeof wire !== 'object') return null;
  const w = wire as Partial<Wire>;
  if (!Array.isArray(w.i)) return null;
  const items: SharedWheel['items'] = [];
  for (const row of w.i.slice(0, MAX_ITEMS)) {
    if (!Array.isArray(row) || typeof row[0] !== 'string') continue;
    const label = row[0].trim().slice(0, MAX_LABEL);
    if (!label) continue;
    const item: Omit<Item, 'id'> = { label, weight: clampWeight(Number(row[1])), hidden: false };
    if (typeof row[2] === 'string' && row[2] && row[2].length <= 16) item.emoji = row[2];
    if (isHexColor(row[3])) item.color = row[3];
    items.push(item);
  }
  if (items.length === 0) return null;
  const name = typeof w.n === 'string' && w.n.trim() ? w.n.trim().slice(0, MAX_LABEL) : 'Wheel';
  const palette = PALETTE_IDS.includes(w.p as PaletteId) ? (w.p as PaletteId) : 'snoep';
  return { name, palette, items };
}

export function shareUrl(wheel: Pick<Wheel, 'name' | 'palette' | 'items'>, base: string = location.href): string {
  const url = new URL(base);
  url.hash = `${HASH_KEY}=${encodeWheel(wheel)}`;
  return url.toString();
}

/** Reads the share payload from a location hash like "#w=…". */
export function payloadFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.get(HASH_KEY);
}

/** Readable JSON for "Export .json". */
export function wheelToFile(wheel: Pick<Wheel, 'name' | 'palette' | 'items'>): string {
  const items = wheel.items.map((it) => ({
    label: it.label,
    weight: it.weight,
    ...(it.emoji ? { emoji: it.emoji } : {}),
    ...(it.color ? { color: it.color } : {}),
  }));
  return JSON.stringify({ app: 'SpinDecide', version: 1, name: wheel.name, palette: wheel.palette, items }, null, 2);
}

/** Parses an exported .json file (or anything shaped like one). */
export function wheelFromFile(text: string): SharedWheel | null {
  try {
    const data = JSON.parse(text) as { name?: unknown; palette?: unknown; items?: unknown };
    if (!data || !Array.isArray(data.items)) return null;
    const rows = data.items.map((it: unknown) => {
      if (typeof it === 'string') return [it, 1];
      const o = (it ?? {}) as Record<string, unknown>;
      return [o.label, o.weight ?? 1, typeof o.emoji === 'string' ? o.emoji : '', o.color];
    });
    return fromWire({ v: 1, n: data.name, p: data.palette, i: rows });
  } catch {
    return null;
  }
}
