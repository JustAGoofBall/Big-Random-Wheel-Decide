import { useId } from 'react';
import { useT } from '../i18n/useT';
import type { MessageKey } from '../i18n/nl';
import { PALETTES, PALETTE_IDS, conic } from '../lib/colors';
import { useSettings } from '../store/useSettings';
import { useUi } from '../store/useUi';
import { useActiveWheel, useWheels } from '../store/useWheels';
import type { AfterWin, Language, Theme } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';

const THEMES: [Theme, MessageKey][] = [
  ['system', 'settings.themeSystem'],
  ['light', 'settings.themeLight'],
  ['dark', 'settings.themeDark'],
];

const AFTER: [AfterWin, MessageKey][] = [
  ['ask', 'settings.afterAsk'],
  ['keep', 'settings.afterKeep'],
  ['hide', 'settings.afterHide'],
  ['remove', 'settings.afterRemove'],
];

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div className="setting">
      <span id={id}>{label}</span>
      <div className="segmented" role="radiogroup" aria-labelledby={id} style={{ flexWrap: 'wrap' }}>
        {options.map(([v, text]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsDialog() {
  const t = useT();
  const settings = useSettings();
  const wheel = useActiveWheel();
  const updateWheel = useWheels((s) => s.updateWheel);
  const close = () => useUi.getState().set({ dialog: null });
  const onOff: [string, string][] = [
    ['on', t('settings.on')],
    ['off', t('settings.off')],
  ];

  return (
    <Modal labelledBy="settings-title" onClose={close}>
      <h2 id="settings-title">{t('settings.title')}</h2>
      <button type="button" className="icon-btn dialog__close" onClick={close} aria-label={t('drawer.close')}>
        <Icon name="close" />
      </button>
      <Choice<Language>
        label={t('settings.language')}
        value={settings.language}
        options={[
          ['nl', 'Nederlands'],
          ['en', 'English'],
        ]}
        onChange={(language) => settings.set({ language })}
      />
      <Choice<Theme> label={t('settings.theme')} value={settings.theme} options={THEMES.map(([v, k]) => [v, t(k)])} onChange={(theme) => settings.set({ theme })} />
      <Choice label={t('settings.sound')} value={settings.sound ? 'on' : 'off'} options={onOff} onChange={(v) => settings.set({ sound: v === 'on' })} />
      <Choice label={t('settings.confetti')} value={settings.confetti ? 'on' : 'off'} options={onOff} onChange={(v) => settings.set({ confetti: v === 'on' })} />
      <div className="setting" role="group" aria-labelledby="palette-label">
        <span id="palette-label">{t('settings.palette')}</span>
        <div className="palette-row">
          {PALETTE_IDS.map((id) => (
            <button key={id} type="button" className="palette-btn" aria-pressed={wheel.palette === id} onClick={() => updateWheel({ palette: id })}>
              <span className="palette-btn__dot" style={{ background: conic(PALETTES[id]) }} aria-hidden="true" />
              {t(`palette.${id}` as MessageKey)}
            </button>
          ))}
        </div>
      </div>
      <Choice<AfterWin>
        label={t('settings.afterWin')}
        value={wheel.afterWin}
        options={AFTER.map(([v, k]) => [v, t(k)])}
        onChange={(afterWin) => updateWheel({ afterWin })}
      />
      <div className="dialog__actions">
        <button type="button" className="btn btn--accent btn--square" onClick={close}>
          {t('settings.done')}
        </button>
      </div>
    </Modal>
  );
}
