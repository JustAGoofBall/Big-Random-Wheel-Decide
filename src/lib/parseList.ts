export const MAX_LABEL = 60;
export const MAX_WEIGHT = 10;

export type ParsedItem = { label: string; weight: number; emoji?: string };

// One emoji, including skin tones, variation selectors, ZWJ sequences and flags.
const EMOJI_RE =
  /^((?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic})(?:\p{Emoji_Modifier}|️|⃣|‍(?:\p{Extended_Pictographic})️?)*)\s*(.*)$/u;

/** Splits a leading emoji off a label: "🍕 Pizza" → { emoji: "🍕", label: "Pizza" }. */
export function splitEmoji(text: string): { emoji?: string; label: string } {
  const t = text.trim();
  const m = EMOJI_RE.exec(t);
  if (!m) return { label: t };
  const rest = m[2].trim();
  return { emoji: m[1], label: rest || m[1] };
}

export function clampWeight(w: number): number {
  if (!Number.isFinite(w)) return 1;
  return Math.min(MAX_WEIGHT, Math.max(1, Math.round(w)));
}

/**
 * Parses one line of the paste syntax:
 *   "🍕 Pizza *3"  → emoji 🍕, label Pizza, weight 3
 *   "Pizza, 3"     → CSV style, weight 3
 */
export function parseLine(line: string): ParsedItem | null {
  let text = line.replace(/\t/g, ' ').trim();
  if (!text) return null;
  let weight = 1;
  const w = /\s*(?:[*×]|,)\s*(\d{1,3})\s*$/.exec(text);
  if (w) {
    weight = clampWeight(parseInt(w[1], 10));
    text = text.slice(0, w.index).trim();
  }
  // Strip surrounding CSV quotes.
  text = text.replace(/^"(.*)"$/, '$1').trim();
  if (!text) return null;
  const { emoji, label } = splitEmoji(text);
  return { label: label.slice(0, MAX_LABEL), weight, ...(emoji && emoji !== label ? { emoji } : {}) };
}

export function parseList(text: string): ParsedItem[] {
  return text
    .split(/\r?\n/)
    .map(parseLine)
    .filter((x): x is ParsedItem => x !== null);
}
