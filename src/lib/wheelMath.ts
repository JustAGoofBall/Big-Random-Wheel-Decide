import type { Item } from '../types';

/** A wheel segment. Angles are in degrees, clockwise from 12 o'clock. */
export type Segment = {
  item: Item;
  start: number;
  end: number;
  color: string;
};

/**
 * Lays out items around the wheel, sized by weight. Colours come from the item
 * or the palette (by position in `allItems`, so they stay stable when items are
 * hidden), with a pass that keeps neighbours from sharing a colour.
 */
export function buildSegments(items: Item[], palette: string[], allItems: Item[] = items): Segment[] {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return [];
  let angle = 0;
  const segs = items.map((item) => {
    const span = (item.weight / total) * 360;
    const idx = Math.max(0, allItems.findIndex((x) => x.id === item.id));
    const seg: Segment = { item, start: angle, end: angle + span, color: item.color ?? palette[idx % palette.length] };
    angle += span;
    return seg;
  });
  if (segs.length > 1) {
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].item.color) continue;
      const prev = segs[(i - 1 + segs.length) % segs.length].color;
      const next = i === segs.length - 1 ? segs[0].color : undefined;
      if (segs[i].color === prev || segs[i].color === next) {
        const alt = palette.find((c) => c !== prev && c !== next);
        if (alt) segs[i].color = alt;
      }
    }
  }
  return segs;
}

export function mod360(a: number): number {
  return ((a % 360) + 360) % 360;
}

/** The wheel angle that sits under the pointer at the top for a given rotation. */
export function angleUnderPointer(rotation: number): number {
  return mod360(-rotation);
}

export function segmentIndexAt(segments: Segment[], angle: number): number {
  const a = mod360(angle);
  for (let i = 0; i < segments.length; i++) {
    if (a >= segments[i].start && a < segments[i].end) return i;
  }
  return segments.length - 1;
}

/**
 * Final rotation that turns `fullTurns` full rounds in `direction` and then
 * stops with `landAt` (a wheel angle) under the pointer.
 */
export function targetRotation(current: number, landAt: number, fullTurns: number, direction: 1 | -1 = 1): number {
  const finalMod = mod360(-landAt);
  if (direction === 1) {
    return current + fullTurns * 360 + mod360(finalMod - current);
  }
  return current - fullTurns * 360 - mod360(current - finalMod);
}

/** A random spot inside the segment, away from its edges so it never looks like a near miss. */
export function landingAngle(seg: Segment, rnd: () => number): number {
  const span = seg.end - seg.start;
  return seg.start + span * (0.15 + 0.7 * rnd());
}

export function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}
