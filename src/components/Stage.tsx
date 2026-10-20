import { useT } from '../i18n/useT';
import { toggleFullscreen } from '../lib/fullscreen';
import { spinWheel } from '../lib/spin';
import { useSettings } from '../store/useSettings';
import { useUi } from '../store/useUi';
import { useActiveWheel } from '../store/useWheels';
import { Icon } from './Icon';
import { Wheel } from './Wheel';

const MAX_WINNERS = 10;

export function Stage() {
  const t = useT();
  const wheel = useActiveWheel();
  const spinning = useUi((s) => s.spinning);
  const winnerCount = useUi((s) => s.winnerCount);
  const setUi = useUi((s) => s.set);
  const fullscreen = useUi((s) => s.fullscreen);
  const sound = useSettings((s) => s.sound);
  const setSettings = useSettings((s) => s.set);
  const visible = wheel.items.filter((i) => !i.hidden).length;
  const maxWinners = Math.max(1, Math.min(MAX_WINNERS, visible));
  const count = Math.min(winnerCount, maxWinners);

  return (
    <section className="stage" aria-label="SpinDecide">
      <div className="stage__wheel">
        {/* Only one wheel at a time, so ticks don't play twice in full screen. */}
        {fullscreen ? <div className="wheel" /> : <Wheel />}
      </div>
      <div className="stage__controls">
        <button type="button" className="btn btn--primary btn--spin" onClick={() => void spinWheel(t)} disabled={spinning || visible === 0}>
          {spinning ? t('spin.spinning') : t('spin.button')}
        </button>
        <div className="pill-stepper">
          <span id="winner-count-label">{t('spin.winners')}</span>
          <button type="button" onClick={() => setUi({ winnerCount: count - 1 })} disabled={count <= 1 || spinning} aria-label={t('spin.fewerWinners')}>
            −
          </button>
          <output className="pill-stepper__value" aria-labelledby="winner-count-label" aria-live="polite">
            {count}
          </output>
          <button type="button" onClick={() => setUi({ winnerCount: count + 1 })} disabled={count >= maxWinners || spinning} aria-label={t('spin.moreWinners')}>
            +
          </button>
        </div>
        <button
          type="button"
          className="btn btn--icon btn--lg"
          onClick={() => setSettings({ sound: !sound })}
          aria-pressed={sound}
          aria-label={sound ? t('spin.soundOff') : t('spin.soundOn')}
        >
          <Icon name={sound ? 'volume' : 'mute'} size={22} />
        </button>
        <button type="button" className="btn btn--icon btn--lg" onClick={toggleFullscreen} aria-label={t('spin.fullscreen')}>
          <Icon name="expand" size={22} />
        </button>
      </div>
      <p className="stage__tip">
        {t('spin.tip')}
        <br />
        {t('spin.keys')}
      </p>
    </section>
  );
}
