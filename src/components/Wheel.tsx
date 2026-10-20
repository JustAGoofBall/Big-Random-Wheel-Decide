import { useMemo } from 'react';
import { useT } from '../i18n/useT';
import { playTick } from '../lib/audio';
import { spinWheel, wheelSegments } from '../lib/spin';
import { useSettings } from '../store/useSettings';
import { useUi } from '../store/useUi';
import { useActiveWheel } from '../store/useWheels';
import { WheelCanvas } from './WheelCanvas';

/** The active wheel, wired up to spinning, sound and translations. */
export function Wheel() {
  const t = useT();
  const wheel = useActiveWheel();
  const excluded = useUi((s) => s.excluded);
  const spinning = useUi((s) => s.spinning);
  const segments = useMemo(() => wheelSegments(wheel, excluded), [wheel, excluded]);
  const ariaLabel = t('wheel.aria', { n: segments.length, list: segments.map((s) => s.item.label).join(', ') });

  return (
    <WheelCanvas
      segments={segments}
      spinning={spinning}
      onSpin={() => void spinWheel(t)}
      onFling={(v) => void spinWheel(t, v)}
      onTick={(speed) => useSettings.getState().sound && playTick(speed)}
      ariaLabel={ariaLabel}
      hubLabel={t('spin.hub')}
      hubAria={t('spin.aria')}
      emptyLabel={t('wheel.empty')}
    />
  );
}
