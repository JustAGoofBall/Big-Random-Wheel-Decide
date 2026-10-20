import { useResolvedTheme } from '../hooks/useTheme';
import { useT } from '../i18n/useT';
import { shareWheel } from '../lib/shareAction';
import { useSettings } from '../store/useSettings';
import { useUi } from '../store/useUi';
import { useActiveWheel } from '../store/useWheels';
import type { Language } from '../types';
import { Icon, Logo } from './Icon';

const LANGS: Language[] = ['nl', 'en'];

export function Header() {
  const t = useT();
  const wheel = useActiveWheel();
  const language = useSettings((s) => s.language);
  const setSettings = useSettings((s) => s.set);
  const spinning = useUi((s) => s.spinning);
  const setUi = useUi((s) => s.set);
  const dark = useResolvedTheme() === 'dark';

  return (
    <header className="header container">
      <div className="brand">
        <Logo />
        SpinDecide
      </div>
      <button
        type="button"
        className="btn header__wheel"
        onClick={() => setUi({ dialog: 'drawer' })}
        disabled={spinning}
        aria-haspopup="dialog"
        title={t('header.myWheels')}
      >
        <span>{wheel.name}</span>
        <Icon name="chevronDown" size={18} />
      </button>
      <div className="header__spacer" />
      <div className="header__actions">
        <button type="button" className="btn btn--accent" onClick={() => void shareWheel(wheel, t)} aria-label={t('header.share')}>
          <Icon name="link" size={18} />
          <span className="header__label">{t('header.share')}</span>
        </button>
        <button
          type="button"
          className="btn btn--icon"
          onClick={() => setSettings({ theme: dark ? 'light' : 'dark' })}
          aria-label={dark ? t('header.toLight') : t('header.toDark')}
        >
          <Icon name={dark ? 'sun' : 'moon'} />
        </button>
        <div className="segmented segmented--pill" role="group" aria-label={t('header.language')}>
          {LANGS.map((l) => (
            <button key={l} type="button" lang={l} aria-pressed={language === l} onClick={() => setSettings({ language: l })}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--icon" onClick={() => setUi({ dialog: 'settings' })} aria-label={t('header.settings')}>
          <Icon name="gear" />
        </button>
      </div>
    </header>
  );
}
