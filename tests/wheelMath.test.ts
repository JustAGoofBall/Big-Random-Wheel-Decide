import { PALETTES } from '../src/lib/colors';
import { randomFloat } from '../src/lib/random';
import { angleUnderPointer, buildSegments, landingAngle, mod360, segmentIndexAt, targetRotation } from '../src/lib/wheelMath';
import type { Item } from '../src/types';

const item = (id: string, weight = 1, extra: Partial<Item> = {}): Item => ({ id, label: id, weight, hidden: false, ...extra });
const palette = PALETTES.snoep;

describe('buildSegments', () => {
  it('sizes segments by weight and covers the full circle', () => {
    const segs = buildSegments([item('a', 2), item('b', 1), item('c', 1)], palette);
    expect(segs.map((s) => s.end - s.start)).toEqual([180, 90, 90]);
    expect(segs[0].start).toBe(0);
    expect(segs[2].end).toBeCloseTo(360);
  });

  it('never gives neighbours (including last/first) the same colour', () => {
    for (let n = 2; n <= 20; n++) {
      const segs = buildSegments(Array.from({ length: n }, (_, i) => item(`i${i}`)), palette);
      segs.forEach((s, i) => expect(s.color).not.toBe(segs[(i + 1) % n].color));
    }
  });

  it('keeps custom colours and stable palette colours when items are hidden', () => {
    const all = [item('a'), item('b'), item('c', 1, { color: '#123456' })];
    const segs = buildSegments([all[1], all[2]], palette, all);
    expect(segs[0].color).toBe(palette[1]);
    expect(segs[1].color).toBe('#123456');
  });

  it('returns nothing for an empty wheel', () => {
    expect(buildSegments([], palette)).toEqual([]);
  });
});

describe('targetRotation', () => {
  it('always lands the chosen angle under the pointer', () => {
    const segs = buildSegments([item('a', 3), item('b', 1), item('c', 2), item('d', 1)], palette);
    for (let i = 0; i < 500; i++) {
      const current = (randomFloat() - 0.5) * 100000;
      const idx = Math.floor(randomFloat() * segs.length);
      const land = landingAngle(segs[idx], randomFloat);
      const dir = randomFloat() < 0.5 ? 1 : -1;
      const turns = 3 + Math.floor(randomFloat() * 10);
      const end = targetRotation(current, land, turns, dir);
      expect(segmentIndexAt(segs, angleUnderPointer(end))).toBe(idx);
      const off = mod360(angleUnderPointer(end) - land);
      expect(Math.min(off, 360 - off)).toBeCloseTo(0, 6);
      // It really turns at least `turns` rounds in the asked direction.
      expect((end - current) * dir).toBeGreaterThanOrEqual(turns * 360);
      expect((end - current) * dir).toBeLessThan((turns + 1) * 360);
    }
  });

  it('lands away from segment edges', () => {
    const [seg] = buildSegments([item('a'), item('b')], palette);
    expect(landingAngle(seg, () => 0)).toBeCloseTo(27);
    expect(landingAngle(seg, () => 0.999999)).toBeLessThan(153.01);
  });
});
