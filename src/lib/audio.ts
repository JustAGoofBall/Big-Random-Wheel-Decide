// Sounds are synthesised with the Web Audio API, so there are no audio files to load.

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let lastTick = 0;

function getCtx(): AudioContext | null {
  if (!ctx) {
    const C: AudioCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Call from a user gesture: browsers only allow audio after one. */
export function unlockAudio(): void {
  try {
    getCtx();
  } catch {
    // Audio is optional.
  }
}

/** A short "clack" for the pointer passing a segment edge. `speed` is 0–1. */
export function playTick(speed: number): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  if (now - lastTick < 0.025) return;
  lastTick = now;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(900 + 900 * speed, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
  gain.gain.setValueAtTime(0.04 + 0.08 * speed, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

/** A cheerful rising "ta-da". */
export function playWin(): void {
  const c = getCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const t = c.currentTime + i * 0.11;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (i === notes.length - 1 ? 0.9 : 0.4));
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 1);
  });
}
