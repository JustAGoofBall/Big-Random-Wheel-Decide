import { useT } from '../i18n/useT';
import { useUi } from '../store/useUi';
import { Icon } from './Icon';
import { Modal } from './Modal';

export function ShortcutsDialog() {
  const t = useT();
  const close = () => useUi.getState().set({ dialog: null });
  const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
  const rows: [string[], string][] = [
    [[t('shortcuts.space'), 'Enter'], t('shortcuts.spin')],
    [['F'], t('shortcuts.fullscreen')],
    [['M'], t('shortcuts.mute')],
    [['N'], t('shortcuts.newItem')],
    [['Esc'], t('shortcuts.close')],
    [[mod, 'Z'], t('shortcuts.undo')],
    [['?'], t('shortcuts.help')],
  ];

  return (
    <Modal labelledBy="shortcuts-title" onClose={close}>
      <h2 id="shortcuts-title">{t('shortcuts.title')}</h2>
      <button type="button" className="icon-btn dialog__close" onClick={close} aria-label={t('drawer.close')}>
        <Icon name="close" />
      </button>
      <dl className="kbd-list">
        {rows.map(([keys, label]) => (
          <div key={label} style={{ display: 'contents' }}>
            <dt>
              {keys.map((k, i) => (
                <span key={k}>
                  {i > 0 && (keys[0] === mod ? ' + ' : ' / ')}
                  <kbd>{k}</kbd>
                </span>
              ))}
            </dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
