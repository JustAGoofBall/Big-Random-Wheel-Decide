import confetti from 'canvas-confetti';
import type { TFunction } from '../i18n/useT';
import { useSettings } from '../store/useSettings';
import { useUi, type Winner } from '../store/useUi';
import { useWheels } from '../store/useWheels';
import type { Item, Wheel } from '../types';
import { playWin, unlockAudio } from './audio';
import { PALETTES } from './colors';
import { pickWeightedIndex, randomFloat } from './random';
import { spinner } from './spinner';
import { buildSegments, landingAngle, targetRotation, type Segment } from './wheelMath';

const FLING_MIN = 0.25;
const FLING_MAX = 2.75;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The segments currently on screen: visible items minus those already drawn this round. */
export function wheelSegments(wheel: Wheel, excluded: string[]): Segment[] {
  const pool = wheel.items.filter((i) => !i.hidden && !excluded.includes(i.id));
  return buildSegments(pool, PALETTES[wheel.palette], wheel.items);
}

function celebrate(colors: string[]): void {
  const opts = { colors, zIndex: 100, disableForReducedMotion: true } as const;
  void confetti({ ...opts, particleCount: 120, spread: 80, origin: { y: 0.55 } });
  setTimeout(() => {
    void confetti({ ...opts, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
    void confetti({ ...opts, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
  }, 180);
}

let running = false;

/**
 * Spins the active wheel. The winner is chosen first with crypto randomness
 * (weighted); the animation then lands inside that winner's segment.
 * `velocity` (deg/ms) comes from a flick and sets strength and direction.
 */
export async function spinWheel(t: TFunction, velocity?: number): Promise<void> {
  if (running) return;
  const ws = useWheels.getState();
  const wheel = ws.wheels[ws.activeId];
  if (!wheel) return;
  const ui = useUi.getState();
  const settings = useSettings.getState();
  const visible = wheel.items.filter((i) => !i.hidden);
  if (visible.length === 0) {
    ui.showToast(t('spin.noItems'));
    spinner.set(spinner.rotation);
    return;
  }

  running = true;
  if (settings.sound) unlockAudio();
  const reduced = prefersReducedMotion();
  const count = Math.min(ui.winnerCount, visible.length);
  const flung = velocity !== undefined;
  const strength = flung ? clamp01((Math.abs(velocity) - FLING_MIN) / (FLING_MAX - FLING_MIN)) : 0.4 + 0.2 * randomFloat();
  const direction: 1 | -1 = flung && velocity < 0 ? -1 : 1;
  const drawn: Winner[] = [];
  let excluded: string[] = [];
  useUi.setState({ spinning: true, winners: null, excluded: [], dialog: null });

  try {
    for (let k = 0; k < count; k++) {
      const pool: Item[] = visible.filter((i) => !excluded.includes(i.id));
      const segs = buildSegments(pool, PALETTES[wheel.palette], wheel.items);
      const idx = pickWeightedIndex(pool.map((p) => p.weight));
      const seg = segs[idx];
      const first = k === 0;
      const turns = reduced ? 1 : first ? Math.round(3 + 9 * strength) : 3;
      const duration = reduced ? 1000 : first ? 3200 + 4800 * strength : 2600;
      await spinner.animate(targetRotation(spinner.rotation, landingAngle(seg, randomFloat), turns, first ? direction : 1), duration);
      const total = pool.reduce((s, i) => s + i.weight, 0);
      drawn.push({ ...seg.item, color: seg.color, chance: Math.round((seg.item.weight / total) * 100) });
      if (k < count - 1) {
        excluded = [...excluded, seg.item.id];
        useUi.setState({ excluded });
        await sleep(reduced ? 200 : 700);
      }
    }
  } catch (e) {
    useUi.setState({ spinning: false, excluded: [] });
    throw e;
  } finally {
    running = false;
  }

  const at = Date.now();
  useWheels.getState().addHistory(
    wheel.id,
    drawn.map((w) => ({ itemId: w.id, label: w.label, emoji: w.emoji, color: w.color, at })),
  );
  const now = useSettings.getState();
  if (now.sound) playWin();
  if (now.confetti && !reduced) celebrate([...new Set(drawn.map((w) => w.color)), '#FFE08A', '#FFFFFF']);
  useUi.setState({ spinning: false, winners: drawn });
}

/**
 * Closes the winner pop-up and applies `action`, or else the wheel's
 * "after a win" rule. Returns the winners that were removed, if any.
 */
export function closeWinners(action?: 'hide' | 'remove'): Winner[] {
  const { winners } = useUi.getState();
  const ws = useWheels.getState();
  const wheel = ws.wheels[ws.activeId];
  useUi.setState({ winners: null, excluded: [] });
  if (!winners || !wheel) return [];
  const ids = winners.map((w) => w.id);
  const rule = action ?? (wheel.afterWin === 'hide' || wheel.afterWin === 'remove' ? wheel.afterWin : undefined);
  if (rule === 'hide') ws.setHidden(ids, true);
  if (rule === 'remove') {
    ws.removeItems(ids);
    return winners;
  }
  return [];
}
