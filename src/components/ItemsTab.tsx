import { useMemo, useState } from 'react';
import { useT } from '../i18n/useT';
import { parseLine } from '../lib/parseList';
import { MAX_ITEMS } from '../lib/share';
import { wheelSegments } from '../lib/spin';
import { useSettings } from '../store/useSettings';
import { useUi } from '../store/useUi';
import { useActiveWheel, useWheels } from '../store/useWheels';
import { Icon } from './Icon';
import { ItemRow } from './ItemRow';

const UNSHOWN = '#E6DDF3';

export function ItemsTab() {
  const t = useT();
  const wheel = useActiveWheel();
  const excluded = useUi((s) => s.excluded);
  const setUi = useUi((s) => s.set);
  const showToast = useUi((s) => s.showToast);
  const language = useSettings((s) => s.language);
  const { addItems, moveItem, shuffleItems, sortItems, showAll } = useWheels.getState();
  const [draft, setDraft] = useState('');
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const segments = useMemo(() => wheelSegments(wheel, excluded), [wheel, excluded]);
  const colorOf = new Map(segments.map((s) => [s.item.id, s.color]));
  const total = segments.reduce((sum, s) => sum + s.item.weight, 0);
  const full = wheel.items.length >= MAX_ITEMS;

  const add = () => {
    const parsed = parseLine(draft);
    if (!parsed) return;
    if (addItems([parsed]) === 0) {
      showToast(t('items.limit', { n: MAX_ITEMS }));
      return;
    }
    setDraft('');
  };

  const metaFor = (id: string, hidden: boolean, weight: number) => {
    if (hidden) return t('items.hiddenTag');
    if (excluded.includes(id)) return t('items.drawnTag');
    return t('items.chance', { p: total ? Math.round((weight / total) * 100) : 0 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="panel__head">
        <h2>
          {t('items.title')} <span className="muted">({wheel.items.length})</span>
        </h2>
        <span className="muted" style={{ fontSize: 13 }}>
          {t('items.weightHint')}
        </span>
      </div>

      {wheel.items.length === 0 ? (
        <div className="empty">
          <p>{t('items.empty')}</p>
        </div>
      ) : (
        <ul className="item-list">
          {wheel.items.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              index={index}
              count={wheel.items.length}
              color={item.color ?? colorOf.get(item.id) ?? UNSHOWN}
              meta={metaFor(item.id, item.hidden, item.weight)}
              palette={wheel.palette}
              dropTarget={dragFrom !== null && dragOver === index && dragOver !== dragFrom}
              onDragStart={setDragFrom}
              onDragOver={setDragOver}
              onDrop={(to) => {
                if (dragFrom !== null) moveItem(dragFrom, to);
                setDragFrom(null);
                setDragOver(null);
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setDragOver(null);
              }}
            />
          ))}
        </ul>
      )}

      <div className="add-row">
        <label htmlFor="new-item" className="sr-only">
          {t('items.new')}
        </label>
        <input
          id="new-item"
          className="field"
          value={draft}
          maxLength={80}
          placeholder={t('items.placeholder')}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          disabled={full}
        />
        <button type="button" className="btn btn--mint btn--square" onClick={add} disabled={full || !draft.trim()}>
          <Icon name="plus" size={18} />
          {t('items.add')}
        </button>
      </div>
      {full && (
        <p className="muted" style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
          {t('items.limit', { n: MAX_ITEMS })}
        </p>
      )}

      <div className="tools">
        <button type="button" className="btn btn--soft" onClick={() => setUi({ dialog: 'paste' })}>
          <Icon name="clipboard" size={16} />
          {t('items.paste')}
        </button>
        <button type="button" className="btn btn--soft" onClick={shuffleItems} disabled={wheel.items.length < 2}>
          <Icon name="shuffle" size={16} />
          {t('items.shuffle')}
        </button>
        <button type="button" className="btn btn--soft" onClick={() => sortItems(language)} disabled={wheel.items.length < 2}>
          <Icon name="sort" size={16} />
          {t('items.sort')}
        </button>
        <button type="button" className="btn btn--soft" onClick={showAll} disabled={!wheel.items.some((i) => i.hidden)}>
          <Icon name="eye" size={16} />
          {t('items.showAll')}
        </button>
      </div>
    </div>
  );
}
