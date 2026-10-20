import { easeOutQuart } from './wheelMath';

type Listener = () => void;

/**
 * Holds the wheel's rotation (degrees, clockwise) outside React so the canvas
 * can redraw every animation frame without re-rendering components.
 */
class Spinner {
  rotation = 0;
  animating = false;
  private listeners = new Set<Listener>();
  private frame = 0;
  private finish: (() => void) | null = null;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  set(rotation: number): void {
    this.rotation = rotation;
    this.emit();
  }

  /** Animates to `to` with an ease-out curve that feels like friction. */
  animate(to: number, duration: number): Promise<void> {
    this.stop();
    const from = this.rotation;
    const start = performance.now();
    this.animating = true;
    return new Promise((resolve) => {
      this.finish = resolve;
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / Math.max(1, duration));
        this.rotation = from + (to - from) * easeOutQuart(p);
        this.emit();
        if (p < 1) {
          this.frame = requestAnimationFrame(step);
        } else {
          this.animating = false;
          this.finish = null;
          this.emit();
          resolve();
        }
      };
      this.frame = requestAnimationFrame(step);
    });
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.animating = false;
    const done = this.finish;
    this.finish = null;
    done?.();
  }
}

export const spinner = new Spinner();
