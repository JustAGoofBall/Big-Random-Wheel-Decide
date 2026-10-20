import { useEffect } from 'react';
import { FullscreenView } from './components/FullscreenView';
import { Header } from './components/Header';
import { Panel } from './components/Panel';
import { PasteDialog } from './components/PasteDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { ShortcutsDialog } from './components/ShortcutsDialog';
import { Stage } from './components/Stage';
import { Toast } from './components/Toast';
import { WheelDrawer } from './components/WheelDrawer';
import { WinnerModal } from './components/WinnerModal';
import { useResolvedTheme } from './hooks/useTheme';
import { translate, useT } from './i18n/useT';
import { setFullscreen, toggleFullscreen } from './lib/fullscreen';
import { decodeWheel, payloadFromHash } from './lib/share';
import { spinWheel } from './lib/spin';
import { useSettings } from './store/useSettings';
import { useUi } from './store/useUi';
import { useWheels } from './store/useWheels';

/** Opens a wheel from a "#w=…" share link and saves it to My wheels. */
function importFromHash(): void {
  const payload = payloadFromHash(location.hash);
  if (!payload) return;
  const lang = useSettings.getState().language;
  const shared = decodeWheel(payload);
  history.replaceState(null, '', location.pathname + location.search);
  if (!shared) {
    useUi.getState().showToast(translate(lang, 'share.invalid'));
    return;
  }
  useWheels.getState().importWheel(shared, payload);
  useUi.getState().set({ tab: 'items', winners: null, excluded: [], teams: null });
  useUi.getState().showToast(translate(lang, 'share.opened', { name: shared.name }));
}

function isTyping(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && !!el.closest('input, textarea, select, [contenteditable="true"]');
}

export default function App() {
  const t = useT();
  const theme = useResolvedTheme();
  const language = useSettings((s) => s.language);
  const dialog = useUi((s) => s.dialog);
  const fullscreen = useUi((s) => s.fullscreen);
  const winners = useUi((s) => s.winners);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1B1530' : '#FFF7EC');
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate(language, 'app.title');
  }, [language]);

  useEffect(() => {
    importFromHash();
    window.addEventListener('hashchange', importFromHash);
    return () => window.removeEventListener('hashchange', importFromHash);
  }, []);

  // Leaving native full screen (e.g. with Esc) also closes our full-screen view.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement && useUi.getState().fullscreen) useUi.setState({ fullscreen: false });
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const ui = useUi.getState();
      const typing = isTyping(e.target);

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (!typing && useWheels.getState().undoRemove()) {
          e.preventDefault();
          ui.set({ toast: null });
        }
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey || ui.dialog || ui.winners) return;
      const onControl = e.target instanceof HTMLElement && !!e.target.closest('button, a, [role="tab"]');

      switch (e.key) {
        case ' ':
        case 'Enter':
          if (onControl) return; // let the focused button do its thing
          e.preventDefault();
          void spinWheel(t);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M': {
          const sound = !useSettings.getState().sound;
          useSettings.getState().set({ sound });
          ui.showToast(sound ? t('spin.soundOn') : t('spin.soundOff'));
          break;
        }
        case 'n':
        case 'N':
          e.preventDefault();
          if (ui.fullscreen) setFullscreen(false);
          ui.set({ tab: 'items' });
          setTimeout(() => document.getElementById('new-item')?.focus(), 30);
          break;
        case '?':
          e.preventDefault();
          ui.set({ dialog: 'shortcuts' });
          break;
        case 'Escape':
          if (ui.fullscreen) setFullscreen(false);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [t]);

  const announcement = winners?.length ? winners.map((w) => t('winner.announce', { label: w.label })).join(', ') : '';

  return (
    <div className="app">
      <Header />
      <main className="main container">
        <Stage />
        <Panel />
      </main>
      {fullscreen && <FullscreenView />}
      {dialog === 'paste' && <PasteDialog />}
      {dialog === 'settings' && <SettingsDialog />}
      {dialog === 'drawer' && <WheelDrawer />}
      {dialog === 'shortcuts' && <ShortcutsDialog />}
      <WinnerModal />
      <Toast />
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}
