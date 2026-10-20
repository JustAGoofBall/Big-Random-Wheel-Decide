import { makeTeams, pickWeightedIndex, randomFloat, randomInt, shuffle } from '../src/lib/random';

describe('randomInt', () => {
  it('stays in range and hits every value', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const x = randomInt(7);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(7);
      expect(Number.isInteger(x)).toBe(true);
      seen.add(x);
    }
    expect(seen.size).toBe(7);
  });

  it('rejects invalid bounds', () => {
    expect(() => randomInt(0)).toThrow(RangeError);
    expect(() => randomInt(2.5)).toThrow(RangeError);
  });
});

describe('randomFloat', () => {
  it('is in [0, 1)', () => {
    for (let i = 0; i < 1000; i++) {
      const x = randomFloat();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('pickWeightedIndex', () => {
  it('maps each integer draw to the right bucket', () => {
    // weights 2,1,3 → draws 0-1 → 0, 2 → 1, 3-5 → 2
    const expected = [0, 0, 1, 2, 2, 2];
    expected.forEach((want, r) => expect(pickWeightedIndex([2, 1, 3], () => r)).toBe(want));
  });

  it('roughly follows the weights', () => {
    const counts = [0, 0];
    const n = 20000;
    for (let i = 0; i < n; i++) counts[pickWeightedIndex([3, 1])]++;
    expect(counts[0] / n).toBeGreaterThan(0.72);
    expect(counts[0] / n).toBeLessThan(0.78);
  });

  it('throws when nothing can win', () => {
    expect(() => pickWeightedIndex([0, 0])).toThrow(RangeError);
  });
});

describe('shuffle and makeTeams', () => {
  it('shuffle keeps every element', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(arr);
    expect(out).toHaveLength(arr.length);
    expect([...out].sort()).toEqual(arr);
    expect(arr).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('makes balanced teams', () => {
    const teams = makeTeams(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 3);
    expect(teams).toHaveLength(3);
    expect(teams.map((t) => t.length).sort()).toEqual([2, 2, 3]);
    expect(teams.flat().sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });
});
