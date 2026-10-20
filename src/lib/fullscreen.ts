import { useUi } from '../store/useUi';

/** Shows the full-screen wheel view, using the Fullscreen API when the browser allows it. */
export function setFullscreen(on: boolean): void {
  useUi.setState({ fullscreen: on });
  const el = document.documentElement;
  try {
    if (on && !document.fullscreenElement && el.requestFullscreen) {
      void el.requestFullscreen().catch(() => undefined);
    } else if (!on && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  } catch {
    // The overlay still works without the API (e.g. iOS Safari).
  }
}

export function toggleFullscreen(): void {
  setFullscreen(!useUi.getState().fullscreen);
}
