import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../i18n/useT';
import { textColorFor } from '../lib/colors';
import { MAX_LABEL, MAX_WEIGHT } from '../lib/parseList';
import { useUi } from '../store/useUi';
import { useWheels } from '../store/useWheels';
import type { Item, PaletteId } from '../types';
import { Icon } from './Icon';
import { ItemImage } from './ItemImage';
import { LookPopover } from './LookPopover';

const POPOVER_W = 300;
const POPOVER_H = 430;

/** Places the look popover below the chip, or above it when there is no room. */
function popoverPosition(r: DOMRect): React.CSSProperties {
  const left = Math.max(16, Math.min(r.left, window.innerWidth - POPOVER_W - 16));
  const below = r.bottom + 6 + POPOVER_H <= window.innerHeight;
  return below
    ? { position: 'fixed', zIndex: 35, left, top: r.bottom + 6 }
    : { position: 'fixed', zIndex: 35, left, bottom: Math.max(16, window.innerHeight - r.top + 6) };
}

type Props = {
  item: Item;
  index: number;
  count: number;
  color: string;
  meta: string;
  palette: PaletteId;
  dropTarget: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
};

export function ItemRow({ item, index, count, color, meta, palette, dropTarget, onDragStart, onDragOver, onDrop, onDragEnd }: Props) {
  const t = useT();
  const updateItem = useWheels((s) => s.updateItem);
  const removeItems = useWheels((s) => s.removeItems);
  const undoRemove = useWheels((s) => s.undoRemove);
  const moveItem = useWheels((s) => s.moveItem);
  const showToast = useUi((s) => s.showToast);
  const [look, setLook] = useState<React.CSSProperties | null>(null);
  const rowRef = useRef<HTMLLIElement>(null);
  const labelAtFocus = useRef(item.label);

  const remove = () => {
    removeItems([item.id]);
    showToast(t('items.removed', { label: item.label }), { label: t('items.undo'), run: () => undoRemove() });
  };

  const onHandleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      moveItem(index, index - 1);
    } else if (e.key === 'ArrowDown' && index < count - 1) {
      e.preventDefault();
      moveItem(index, index + 1);
    }
  };

  return (
    <li
      ref={rowRef}
      className={`item-row${item.hidden ? ' is-hidden' : ''}${dropTarget ? ' is-drop-target' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
    >
      <button
        type="button"
        className="item-row__handle"
        draggable
        aria-label={t('items.drag', { label: item.label })}
        onKeyDown={onHandleKey}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', item.label);
          if (rowRef.current) e.dataTransfer.setDragImage(rowRef.current, 20, 20);
          onDragStart(index);
        }}
        onDragEnd={onDragEnd}
      >
        <Icon name="grip" size={18} />
      </button>
      <button
        type="button"
        className="item-chip"
        style={{ background: color, color: textColorFor(color) }}
        onClick={(e) => setLook(look ? null : popoverPosition(e.currentTarget.getBoundingClientRect()))}
        aria-label={t('items.look', { label: item.label })}
        aria-expanded={look !== null}
      >
        {item.imageId ? <ItemImage id={item.imageId} /> : item.emoji ?? <span aria-hidden="true">•</span>}
      </button>
      <div className="item-row__main">
        <input
          className="item-row__input"
          value={item.label}
          maxLength={MAX_LABEL}
          aria-label={t('items.name')}
          onFocus={() => (labelAtFocus.current = item.label)}
          onChange={(e) => updateItem(item.id, { label: e.target.value })}
          onBlur={(e) => {
            const v = e.target.value.trim();
            updateItem(item.id, { label: v || labelAtFocus.current });
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <span className="item-row__meta">{meta}</span>
      </div>
      <div className="stepper">
        <button type="button" onClick={() => updateItem(item.id, { weight: item.weight - 1 })} disabled={item.weight <= 1} aria-label={t('items.lessWeight')}>
          −
        </button>
        <span className="stepper__value">×{item.weight}</span>
        <button
          type="button"
          onClick={() => updateItem(item.id, { weight: item.weight + 1 })}
          disabled={item.weight >= MAX_WEIGHT}
          aria-label={t('items.moreWeight')}
        >
          +
        </button>
      </div>
      <button
        type="button"
        className="icon-btn"
        onClick={() => updateItem(item.id, { hidden: !item.hidden })}
        aria-pressed={item.hidden}
        aria-label={item.hidden ? t('items.show', { label: item.label }) : t('items.hide', { label: item.label })}
      >
        <Icon name={item.hidden ? 'eyeOff' : 'eye'} />
      </button>
      <button type="button" className="icon-btn icon-btn--danger" onClick={remove} aria-label={t('items.remove', { label: item.label })}>
        <Icon name="trash" />
      </button>
      {look &&
        createPortal(
          <div style={look}>
            <LookPopover item={item} palette={palette} onClose={() => setLook(null)} />
          </div>,
          document.body,
        )}
    </li>
  );
}
