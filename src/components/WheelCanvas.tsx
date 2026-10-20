import { useEffect, useRef, useState } from 'react';
import { WHITE, textColorFor } from '../lib/colors';
import { loadImage } from '../lib/images';
import { spinner } from '../lib/spinner';
import { angleUnderPointer, segmentIndexAt, type Segment } from '../lib/wheelMath';

type Props = {
  segments: Segment[];
  spinning: boolean;
  onSpin: () => void;
  /** Called when the user flicks the wheel; velocity in degrees per ms (negative = anticlockwise). */
  onFling: (velocity: number) => void;
  onTick: (speed: number) => void;
  ariaLabel: string;
  hubLabel: string;
  hubAria: string;
  emptyLabel: string;
};

// Everything is drawn in a 560×560 design space and scaled to the element size.
const VIEW = 560;
const C = VIEW / 2;
const R = 250;
const HUB = 62;
const RING = '#2B2240';
const LAMPS = 24;
const FLING_MIN = 0.25;

const rad = (deg: number) => (deg * Math.PI) / 180;

function fitText(g: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (g.measureText(text).width <= maxWidth) return text;
  const chars = Array.from(text);
  while (chars.length > 1 && g.measureText(chars.join('') + '…').width > maxWidth) chars.pop();
  return chars.join('').trimEnd() + '…';
}

function drawStatic(canvas: HTMLCanvasElement, segments: Segment[], images: Map<string, HTMLImageElement>, px: number) {
  canvas.width = px;
  canvas.height = px;
  const g = canvas.getContext('2d');
  if (!g) return;
  g.setTransform(px / VIEW, 0, 0, px / VIEW, 0, 0);
  g.clearRect(0, 0, VIEW, VIEW);

  g.fillStyle = RING;
  g.beginPath();
  g.arc(C, C, C - 1, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = WHITE;
  g.beginPath();
  g.arc(C, C, 262, 0, Math.PI * 2);
  g.fill();

  if (segments.length === 0) {
    g.fillStyle = '#F3EEFB';
    g.beginPath();
    g.arc(C, C, R, 0, Math.PI * 2);
    g.fill();
  }

  const n = segments.length;
  for (const seg of segments) {
    const span = seg.end - seg.start;
    g.beginPath();
    if (span >= 359.99) {
      g.arc(C, C, R, 0, Math.PI * 2);
    } else {
      g.moveTo(C, C);
      g.arc(C, C, R, rad(seg.start - 90), rad(seg.end - 90));
      g.closePath();
    }
    g.fillStyle = seg.color;
    g.fill();
    if (n > 1) {
      g.strokeStyle = WHITE;
      g.lineWidth = 3;
      g.lineJoin = 'round';
      g.stroke();
    }

    // Label, written along the radius from the rim inwards.
    const mid = (seg.start + seg.end) / 2;
    const chord = 2 * 175 * Math.sin(rad(Math.min(span, 180) / 2));
    const fs = Math.max(9, Math.min(n <= 6 ? 28 : 24, chord * 0.5));
    g.save();
    g.translate(C, C);
    g.rotate(rad(mid - 90));
    let x = R - 20;
    const img = seg.item.imageId ? images.get(seg.item.imageId) : undefined;
    if (img) {
      const s = Math.max(16, Math.min(64, 2 * (R - 52) * Math.sin(rad(Math.min(span, 120) / 2)) * 0.8));
      g.save();
      g.beginPath();
      g.arc(x - s / 2, 0, s / 2, 0, Math.PI * 2);
      g.clip();
      g.drawImage(img, x - s, -s / 2, s, s);
      g.restore();
      x -= s + 8;
    }
    g.fillStyle = textColorFor(seg.color);
    g.font = `700 ${fs.toFixed(1)}px Fredoka, Nunito, sans-serif`;
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    const text = (seg.item.emoji && !img ? `${seg.item.emoji} ` : '') + seg.item.label;
    g.fillText(fitText(g, text, x - HUB - 14), x, 1);
    g.restore();
  }

  g.fillStyle = RING;
  g.beginPath();
  g.arc(C, C, HUB, 0, Math.PI * 2);
  g.fill();
}

export function WheelCanvas({ segments, spinning, onSpin, onFling, onTick, ariaLabel, hubLabel, hubAria, emptyLabel }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<SVGSVGElement>(null);
  const staticRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState(0);
  const [images, setImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [fontsTick, setFontsTick] = useState(0);
  const [dragging, setDragging] = useState(false);

  const live = useRef({ segments, spinning, onTick, lastIdx: -1, lastRot: 0, lastT: 0 });
  live.current.segments = segments;
  live.current.spinning = spinning;
  live.current.onTick = onTick;
  const drag = useRef<{ angle: number; samples: { t: number; rot: number }[] } | null>(null);
  const frame = useRef(0);

  // Track element size.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Redraw once web fonts are in.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setFontsTick((n) => n + 1));
    return () => {
      alive = false;
    };
  }, []);

  // Load uploaded images used by the segments.
  const imageKey = segments.map((s) => s.item.imageId ?? '').join('|');
  useEffect(() => {
    let alive = true;
    const ids = segments.map((s) => s.item.imageId).filter((x): x is string => !!x);
    if (!ids.length) return;
    Promise.all(ids.map(async (id) => [id, await loadImage(id)] as const)).then((pairs) => {
      if (!alive) return;
      const map = new Map<string, HTMLImageElement>();
      pairs.forEach(([id, img]) => img && map.set(id, img));
      setImages(map);
    });
    return () => {
      alive = false;
    };
  }, [imageKey]);

  const draw = () => {
    const canvas = canvasRef.current;
    const layer = staticRef.current;
    if (!canvas || !layer || !size) return;
    const g = canvas.getContext('2d');
    if (!g) return;
    const dpr = window.devicePixelRatio || 1;
    const px = Math.round(size * dpr);
    if (canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    const rot = spinner.rotation;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, px, px);
    g.translate(px / 2, px / 2);
    g.rotate(rad(rot));
    g.drawImage(layer, -px / 2, -px / 2, px, px);

    // Rim lamps; they chase while the wheel is moving.
    const scale = px / VIEW;
    const moving = spinner.animating || drag.current !== null;
    const phase = Math.floor(performance.now() / 160) % 2;
    for (let i = 0; i < LAMPS; i++) {
      const a = (i / LAMPS) * Math.PI * 2;
      g.beginPath();
      g.arc(Math.sin(a) * 270 * scale, -Math.cos(a) * 270 * scale, 6 * scale, 0, Math.PI * 2);
      g.globalAlpha = moving && i % 2 === phase ? 0.35 : 1;
      g.fillStyle = i % 2 ? '#FFE08A' : '#FFFFFF';
      g.fill();
      g.globalAlpha = 1;
      g.lineWidth = 1.5 * scale;
      g.strokeStyle = RING;
      g.stroke();
    }

    // Tick when the pointer crosses into another segment.
    const l = live.current;
    const segs = l.segments;
    if (segs.length > 1) {
      const idx = segmentIndexAt(segs, angleUnderPointer(rot));
      if (idx !== l.lastIdx) {
        if (l.lastIdx !== -1 && moving) {
          const now = performance.now();
          const speed = Math.min(1, Math.abs(rot - l.lastRot) / Math.max(1, now - l.lastT) / 1.5);
          l.onTick(speed);
          pointerRef.current?.animate?.(
            [
              { transform: 'translateX(-50%) rotate(0deg)' },
              { transform: `translateX(-50%) rotate(${rot >= l.lastRot ? -20 : 20}deg)`, offset: 0.3 },
              { transform: 'translateX(-50%) rotate(0deg)' },
            ],
            { duration: 140, easing: 'ease-out' },
          );
        }
        l.lastIdx = idx;
      }
    }
    l.lastRot = rot;
    l.lastT = performance.now();
  };

  const schedule = () => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      draw();
    });
  };

  // Rebuild the static layer when the wheel's content or size changes.
  useEffect(() => {
    if (!size) return;
    const layer = staticRef.current ?? document.createElement('canvas');
    staticRef.current = layer;
    drawStatic(layer, segments, images, Math.round(size * (window.devicePixelRatio || 1)));
    live.current.lastIdx = -1;
    draw();
  }, [segments, images, size, fontsTick]);

  useEffect(() => {
    const unsub = spinner.subscribe(schedule);
    return () => {
      unsub();
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [size]);

  const angleOf = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    return (Math.atan2(dx, -dy) * 180) / Math.PI;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (spinning || segments.length === 0 || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { angle: angleOf(e), samples: [{ t: performance.now(), rot: spinner.rotation }] };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const a = angleOf(e);
    let diff = a - d.angle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    d.angle = a;
    spinner.set(spinner.rotation + diff);
    const now = performance.now();
    d.samples.push({ t: now, rot: spinner.rotation });
    while (d.samples.length > 2 && now - d.samples[0].t > 100) d.samples.shift();
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const dt = performance.now() - first.t;
    const v = dt > 0 ? (last.rot - first.rot) / dt : 0;
    if (Math.abs(v) >= FLING_MIN && performance.now() - last.t < 80) onFling(v);
    else schedule();
  };

  return (
    <div className="wheel" ref={boxRef}>
      <canvas
        ref={canvasRef}
        className={`wheel__canvas${dragging ? ' is-dragging' : ''}`}
        role="img"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <svg ref={pointerRef} className="wheel__pointer" viewBox="0 0 60 70" aria-hidden="true">
        <path d="M30 66 L6 14 A26 26 0 0 1 54 14 Z" fill="#E5484D" stroke="#2B2240" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="30" cy="20" r="7" fill="#FFFFFF" stroke="#2B2240" strokeWidth="3" />
      </svg>
      <button type="button" className="wheel__hub" onClick={onSpin} disabled={spinning || segments.length === 0} aria-label={hubAria}>
        {hubLabel}
      </button>
      {segments.length === 0 && <div className="wheel__empty">{emptyLabel}</div>}
    </div>
  );
}
