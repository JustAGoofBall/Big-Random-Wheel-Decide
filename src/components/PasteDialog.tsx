import { useRef, useState } from 'react';
import { useT } from '../i18n/useT';
import { parseList } from '../lib/parseList';
import { MAX_ITEMS } from '../lib/share';
import { useUi } from '../store/useUi';
import { useWheels } from '../store/useWheels';
import { Icon } from './Icon';
import { Modal } from './Modal';

export function PasteDialog() {
  const t = useT();
  const set = useUi((s) => s.set);
  const showToast = useUi((s) => s.showToast);
  const addItems = useWheels((s) => s.addItems);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'add' | 'replace'>('add');
  const fileRef = useRef<HTMLInputElement>(null);
  const parsed = parseList(text);
  const close = () => set({ dialog: null });

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    const content = await file.text();
    setText((prev) => (prev.trim() ? `${prev.trimEnd()}\n${content}` : content));
  };

  const submit = () => {
    if (!parsed.length) return close();
    const added = addItems(parsed, mode === 'replace');
    close();
    showToast(added < parsed.length ? `${t('paste.done', { n: added })} · ${t('items.limit', { n: MAX_ITEMS })}` : t('paste.done', { n: added }));
  };

  return (
    <Modal labelledBy="paste-title" onClose={close} initialFocus="textarea">
      <h2 id="paste-title">{t('paste.title')}</h2>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>
        {t('paste.help')}
      </p>
      <label htmlFor="paste-box" style={{ fontWeight: 800, fontSize: 14 }}>
        {t('paste.label')}
      </label>
      <textarea
        id="paste-box"
        className="field"
        rows={8}
        value={text}
        placeholder={t('paste.placeholder')}
        onChange={(e) => setText(e.target.value)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const file = e.dataTransfer.files?.[0];
          if (file) {
            e.preventDefault();
            void loadFile(file);
          }
        }}
      />
      <div className="tools" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="segmented" role="radiogroup" aria-label={t('paste.mode')}>
          <button type="button" role="radio" aria-checked={mode === 'add'} onClick={() => setMode('add')}>
            {t('paste.add')}
          </button>
          <button type="button" role="radio" aria-checked={mode === 'replace'} onClick={() => setMode('replace')}>
            {t('paste.replace')}
          </button>
        </div>
        <button type="button" className="btn btn--soft" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={16} />
          {t('paste.file')}
        </button>
        <input ref={fileRef} type="file" accept=".txt,.csv,text/plain,text/csv" hidden onChange={(e) => void loadFile(e.target.files?.[0])} />
      </div>
      <div className="dialog__actions">
        <button type="button" className="btn btn--square" onClick={close}>
          {t('paste.cancel')}
        </button>
        <button type="button" className="btn btn--mint btn--square" onClick={submit} disabled={!parsed.length}>
          {parsed.length ? t(mode === 'add' ? 'paste.submitAdd' : 'paste.submitReplace', { n: parsed.length }) : t('paste.submit')}
        </button>
      </div>
    </Modal>
  );
}
