import { useEffect, useRef } from 'react';
import { useT } from '../i18n/useT';
import { setFullscreen } from '../lib/fullscreen';
import { useSettings } from '../store/useSettings';
import { useActiveWheel } from '../store/useWheels';
import { Icon, Logo } from './Icon';
import { Wheel } from './Wheel';

/** Only the wheel, as large as possible: for the TV or a projector. */
export function FullscreenView() {
  const t = useT();
  const wheel = useActiveWheel();
  const sound = useSettings((s) => s.sound);
  const setSettings = useSettings((s) => s.set);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('.wheel__hub')?.focus();
  }, []);

  return (
    <div className="fs" ref={ref} role="region" aria-label={t('spin.fullscreen')}>
      <div className="brand" style={{ position: 'absolute', top: 24, left: 24, fontSize: 20 }} aria-hidden="true">
        <Logo size={30} />
        SpinDecide
      </div>
      <div className="fs__bar">
        <button
          type="button"
          className="btn btn--icon"
          onClick={() => setSettings({ sound: !sound })}
          aria-pressed={sound}
          aria-label={sound ? t('spin.soundOff') : t('spin.soundOn')}
        >
          <Icon name={sound ? 'volume' : 'mute'} />
        </button>
        <button type="button" className="btn" onClick={() => setFullscreen(false)}>
          <Icon name="shrink" size={18} />
          {t('fullscreen.exit')}
        </button>
      </div>
      <h1>{wheel.name}</h1>
      <div className="fs__wheel">
        <Wheel />
      </div>
      <p className="fs__hint">{t('fullscreen.hint')}</p>
    </div>
  );
}
