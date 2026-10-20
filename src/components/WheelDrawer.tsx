import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../i18n/useT';
import { PALETTES, conic } from '../lib/colors';
import { download } from '../lib/download';
import { parseList } from '../lib/parseList';
import { wheelFromFile, wheelToFile } from '../lib/share';
import { buildSegments } from '../lib/wheelMath';
import { useSettings } from '../store/useSettings';
import { useUi } from '../store/useUi';
import { useWheels } from '../store/useWheels';
import { getTemplates } from '../templates';
import type { Wheel } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';

function miniWheel(w: Pick<Wheel, 'items' | 'palette'>): string {
  const visible = w.items.filter((i) => !i.hidden);
  if (!visible.length) return '#F3EEFB';
  const segs = buildSegments(visible, PALETTES[w.palette], w.items);
  return `conic-gradient(${segs.map((s) => `${s.color} ${s.start}deg ${s.end}deg`).join(', ')})`;
}

function WheelCard({ wheel, active, onOpen }: { wheel: Wheel; active: boolean; onOpen: () => void }) {
  const t = useT();
  const { renameWheel, duplicateWheel, deleteWheel } = useMemo(() => {
    const s = useWheels.getState();
    return {
      renameWheel: (name: string) => s.updateWheel({ name }, wheel.id),
      duplicateWheel: () => s.duplicateWheel(wheel.id, t('drawer.copy', { name: wheel.name })),
      deleteWheel: () => s.deleteWheel(wheel.id),
    };
  }, [wheel.id, wheel.name, t]);
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(wheel.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.parentElement?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    menuRef.current?.querySelector('button')?.focus();
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [menu]);

  const finishRename = () => {
    renameWheel(name.trim() || wheel.name);
    setRenaming(false);
  };

  return (
    <div className={`wheel-card${active ? ' is-active' : ''}`}>
      {renaming ? (
        <>
          <span className="mini-wheel" style={{ background: miniWheel(wheel) }} aria-hidden="true" />
          <label className="sr-only" htmlFor={`rename-${wheel.id}`}>
            {t('drawer.renameLabel')}
          </label>
          <input
            id={`rename-${wheel.id}`}
            className="field"
            value={name}
            maxLength={60}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onBlur={finishRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishRename();
              if (e.key === 'Escape') {
                e.stopPropagation();
                setName(wheel.name);
                setRenaming(false);
              }
            }}
          />
        </>
      ) : (
        <button type="button" className="wheel-card__open" onClick={onOpen} aria-current={active ? 'true' : undefined}>
          <span className="mini-wheel" style={{ background: miniWheel(wheel) }} aria-hidden="true" />
          <span style={{ minWidth: 0 }}>
            <span className="wheel-card__name">{wheel.name}</span>
            <span className="wheel-card__meta">
              {t('drawer.count', { n: wheel.items.length })}
              {active ? ` · ${t('drawer.active')}` : ''}
            </span>
          </span>
        </button>
      )}
      <button type="button" className="icon-btn" aria-label={t('drawer.options', { name: wheel.name })} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
        <Icon name="more" />
      </button>
      {menu && (
        <div className="menu" ref={menuRef} role="menu" onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setMenu(false))}>
          <button type="button" role="menuitem" onClick={() => (setMenu(false), setName(wheel.name), setRenaming(true))}>
            {t('drawer.rename')}
          </button>
          <button type="button" role="menuitem" onClick={() => (setMenu(false), duplicateWheel())}>
            {t('drawer.duplicate')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenu(false);
              download(`${wheel.name || 'spindecide'}.json`, wheelToFile(wheel), 'application/json');
            }}
          >
            {t('drawer.export')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              setMenu(false);
              if (window.confirm(t('drawer.confirmDelete', { name: wheel.name }))) deleteWheel();
            }}
          >
            {t('drawer.delete')}
          </button>
        </div>
      )}
    </div>
  );
}

export function WheelDrawer() {
  const t = useT();
  const language = useSettings((s) => s.language);
  const wheels = useWheels((s) => s.wheels);
  const order = useWheels((s) => s.order);
  const activeId = useWheels((s) => s.activeId);
  const showToast = useUi((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const templates = useMemo(() => getTemplates(language, parseList), [language]);
  const close = () => useUi.getState().set({ dialog: null, teams: null });

  const open = (id: string) => {
    useWheels.getState().setActive(id);
    close();
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    const shared = wheelFromFile(await file.text());
    if (!shared) {
      showToast(t('drawer.importFailed'));
      return;
    }
    useWheels.getState().importWheel(shared);
    close();
    showToast(t('drawer.imported', { name: shared.name }));
  };

  return (
    <Modal labelledBy="drawer-title" onClose={close} className="drawer" overlayClassName="drawer-overlay">
      <div className="drawer__head">
        <h2 id="drawer-title">{t('drawer.title')}</h2>
        <button type="button" className="btn btn--icon" onClick={close} aria-label={t('drawer.close')}>
          <Icon name="close" />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {order
          .filter((id) => wheels[id])
          .map((id) => (
            <WheelCard key={id} wheel={wheels[id]} active={id === activeId} onOpen={() => open(id)} />
          ))}
        <div className="tools" style={{ marginTop: 4 }}>
          <button
            type="button"
            className="btn btn--mint btn--square"
            style={{ flex: 1 }}
            onClick={() => {
              useWheels.getState().createWheel(t('drawer.untitled'), []);
              useUi.getState().set({ dialog: null, tab: 'items', teams: null });
              setTimeout(() => document.getElementById('new-item')?.focus(), 50);
            }}
          >
            <Icon name="plus" size={18} />
            {t('drawer.new')}
          </button>
          <button type="button" className="btn btn--soft" style={{ flex: 1, minHeight: 48 }} onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} />
            {t('drawer.import')}
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void importFile(e.target.files?.[0])} />
        </div>
      </div>
      <hr className="drawer__divider" />
      <div className="panel__head">
        <h2 style={{ fontSize: 24 }}>{t('drawer.templates')}</h2>
        <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
          {t('drawer.oneClick')}
        </span>
      </div>
      <div className="template-grid">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className="template"
            onClick={() => {
              useWheels.getState().createWheel(tpl.name, tpl.items, tpl.palette);
              useUi.getState().set({ dialog: null, tab: 'items', teams: null });
            }}
          >
            <span
              className="mini-wheel"
              aria-hidden="true"
              style={{ background: tpl.items.length ? conic(tpl.items.map((_, i) => PALETTES[tpl.palette][i % 6])) : '#F3EEFB' }}
            />
            <span className="template__name">{tpl.name}</span>
            <span className="template__meta">{tpl.items.length ? t('drawer.count', { n: tpl.items.length }) : t('drawer.fillIn')}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
