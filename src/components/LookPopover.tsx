import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/useT';
import { PALETTES } from '../lib/colors';
import { deleteImage, saveImage } from '../lib/images';
import { useWheels } from '../store/useWheels';
import type { Item, PaletteId } from '../types';

const EMOJIS = [
  '🍕', '🍣', '🍔', '🍝', '🌮', '🍛', '🥗', '🍟', '🥞', '🍜', '🥙', '🍦', '🍩', '🍪', '☕', '🍺',
  '🎬', '🎮', '🎲', '🎳', '🎤', '🎨', '📚', '⚽', '🏀', '🎾', '🚲', '🏊', '🌳', '🏖️', '✈️', '🚗',
  '😀', '😂', '😎', '🥳', '😴', '🤔', '🔥', '❤️', '⭐', '🎉', '🎁', '💰', '👍', '👎', '✅', '❌',
  '🐶', '🐱', '🦄', '🐸', '🐼', '🦊', '🌈', '☀️', '🌙', '⚡', '🍀', '🌸', '1️⃣', '2️⃣', '3️⃣', '4️⃣',
];

type Props = { item: Item; palette: PaletteId; onClose: () => void };

export function LookPopover({ item, palette, onClose }: Props) {
  const t = useT();
  const updateItem = useWheels((s) => s.updateItem);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle');

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    // The popover is fixed on screen, so close it when the page scrolls under it.
    const onScroll = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('scroll', onScroll, true);
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [onClose]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setStatus('busy');
    try {
      const id = await saveImage(file);
      const old = item.imageId;
      updateItem(item.id, { imageId: id });
      if (old) void deleteImage(old);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  const removeImage = () => {
    if (item.imageId) void deleteImage(item.imageId);
    updateItem(item.id, { imageId: undefined });
  };

  return (
    <div className="look" ref={ref} role="dialog" aria-label={t('look.title')}>
      <h3>{t('look.emoji')}</h3>
      <div className="emoji-grid">
        {EMOJIS.map((e) => (
          <button key={e} type="button" aria-pressed={item.emoji === e} onClick={() => updateItem(item.id, { emoji: e })}>
            {e}
          </button>
        ))}
      </div>
      <div className="tools">
        <button type="button" className="btn btn--soft" onClick={() => updateItem(item.id, { emoji: undefined })} disabled={!item.emoji}>
          {t('look.noEmoji')}
        </button>
        <button type="button" className="btn btn--soft" onClick={() => fileRef.current?.click()} disabled={status === 'busy'}>
          {status === 'busy' ? t('look.uploading') : t('look.upload')}
        </button>
        {item.imageId && (
          <button type="button" className="btn btn--soft" onClick={removeImage}>
            {t('look.removeImage')}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
      {status === 'error' && (
        <p role="alert" style={{ margin: 0, color: 'var(--danger)', fontWeight: 700, fontSize: 14 }}>
          {t('look.uploadFailed')}
        </p>
      )}
      <h3>{t('look.color')}</h3>
      <div className="swatches">
        <button
          type="button"
          className="swatch swatch--auto"
          aria-pressed={!item.color}
          aria-label={t('look.autoColor')}
          title={t('look.autoColor')}
          onClick={() => updateItem(item.id, { color: undefined })}
        />
        {PALETTES[palette].map((c) => (
          <button
            key={c}
            type="button"
            className="swatch"
            style={{ background: c }}
            aria-pressed={item.color === c}
            aria-label={c}
            onClick={() => updateItem(item.id, { color: c })}
          />
        ))}
        <label className="swatch swatch--custom" title={t('look.customColor')} style={{ background: item.color ?? '#ffffff' }}>
          <span className="sr-only">{t('look.customColor')}</span>
          <input type="color" value={item.color ?? '#ffffff'} onChange={(e) => updateItem(item.id, { color: e.target.value.toUpperCase() })} />
        </label>
      </div>
      <div className="dialog__actions">
        <button type="button" className="btn btn--soft" onClick={onClose}>
          {t('look.close')}
        </button>
      </div>
    </div>
  );
}
