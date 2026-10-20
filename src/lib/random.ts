// All randomness in the app goes through here and uses the Web Crypto API.

const UINT32_RANGE = 0x1_0000_0000;

export function randomUint32(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

/** Uniform integer in [0, max). Rejection sampling avoids modulo bias. */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > UINT32_RANGE) {
    throw new RangeError(`randomInt: invalid max ${max}`);
  }
  const limit = UINT32_RANGE - (UINT32_RANGE % max);
  let x: number;
  do {
    x = randomUint32();
  } while (x >= limit);
  return x % max;
}

/** Uniform float in [0, 1) with 53 bits of precision. */
export function randomFloat(): number {
  const hi = randomUint32() >>> 5; // 27 bits
  const lo = randomUint32() >>> 6; // 26 bits
  return (hi * 67108864 + lo) / 9007199254740992;
}

/**
 * Picks an index with probability proportional to its (integer) weight.
 * Weights are whole numbers, so drawing an integer in [0, total) is exact.
 */
export function pickWeightedIndex(weights: number[], rndInt: (max: number) => number = randomInt): number {
  const ints = weights.map((w) => Math.max(0, Math.round(w)));
  const total = ints.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new RangeError('pickWeightedIndex: total weight must be > 0');
  let r = rndInt(total);
  for (let i = 0; i < ints.length; i++) {
    if (r < ints[i]) return i;
    r -= ints[i];
  }
  return ints.length - 1;
}

/** Fisher–Yates shuffle, returns a new array. */
export function shuffle<T>(arr: readonly T[], rndInt: (max: number) => number = randomInt): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rndInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Splits a list into `teamCount` teams whose sizes differ by at most one. */
export function makeTeams<T>(arr: readonly T[], teamCount: number, rndInt: (max: number) => number = randomInt): T[][] {
  const n = Math.max(1, Math.floor(teamCount));
  const teams: T[][] = Array.from({ length: n }, () => []);
  shuffle(arr, rndInt).forEach((x, i) => teams[i % n].push(x));
  return teams;
}

export function uid(): string {
  return randomUint32().toString(36) + randomUint32().toString(36);
}
