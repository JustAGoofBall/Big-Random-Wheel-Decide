import { ordinal, useT } from '../i18n/useT';
import { textColorFor } from '../lib/colors';
import { closeWinners, spinWheel } from '../lib/spin';
import { useSettings } from '../store/useSettings';
import { useUi } from '../store/useUi';
import { useActiveWheel, useWheels } from '../store/useWheels';
import { ItemImage } from './ItemImage';
import { Modal } from './Modal';

export function WinnerModal() {
  const t = useT();
  const language = useSettings((s) => s.language);
  const winners = useUi((s) => s.winners);
  const showToast = useUi((s) => s.showToast);
  const wheel = useActiveWheel();
  if (!winners?.length) return null;

  const many = winners.length > 1;
  const top = winners[0];
  const ink = textColorFor(top.color);
  const rule = wheel.afterWin;

  const close = (action?: 'hide' | 'remove') => {
    const removed = closeWinners(action);
    if (removed.length) {
      showToast(removed.length === 1 ? t('items.removed', { label: removed[0].label }) : t('items.removedMany', { n: removed.length }), {
        label: t('items.undo'),
        run: () => useWheels.getState().undoRemove(),
      });
    }
  };

  const again = () => {
    close();
    void spinWheel(t);
  };

  return (
    <Modal labelledBy="winner-title" onClose={() => close()} className="dialog winner" initialFocus=".winner__again">
      <div className="winner__top" style={{ background: top.color, color: ink }}>
        <p id="winner-title" className="winner__kicker">
          {many ? t('winner.titleMany') : t('winner.title')}
        </p>
        {many ? (
          <ol className="winner__list">
            {winners.map((w, i) => (
              <li key={w.id} style={{ background: w.color, color: textColorFor(w.color) }}>
                <span className="winner__place">{ordinal(i + 1, language)}</span>
                {w.emoji && <span aria-hidden="true">{w.emoji}</span>}
                <span>{w.label}</span>
              </li>
            ))}
          </ol>
        ) : (
          <>
            {top.imageId ? (
              <ItemImage id={top.imageId} className="winner__img" />
            ) : (
              <div className="winner__emoji" aria-hidden="true">
                {top.emoji ?? '🎉'}
              </div>
            )}
            <p className="winner__name">{top.label}</p>
            <p className="winner__chance">{t('winner.chance', { p: top.chance })}</p>
          </>
        )}
      </div>
      <div className="winner__actions">
        <button type="button" className="btn btn--primary winner__again wide" onClick={again}>
          {t('winner.again')}
        </button>
        {rule === 'ask' && (
          <>
            <button type="button" className="btn btn--square" onClick={() => close('hide')}>
              {many ? t('winner.hideMany') : t('winner.hide')}
            </button>
            <button type="button" className="btn btn--square" onClick={() => close('remove')}>
              {many ? t('winner.removeMany') : t('winner.remove')}
            </button>
          </>
        )}
        {rule === 'hide' && <p className="winner__note">{t('winner.autoHide')}</p>}
        {rule === 'remove' && <p className="winner__note">{t('winner.autoRemove')}</p>}
        <button type="button" className="btn btn--ghost wide" onClick={() => close()} style={{ textDecoration: 'underline', color: 'var(--muted)' }}>
          {t('winner.close')}
        </button>
      </div>
    </Modal>
  );
}
