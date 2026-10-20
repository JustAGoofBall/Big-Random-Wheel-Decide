import { useRef } from 'react';
import { useT } from '../i18n/useT';
import type { MessageKey } from '../i18n/nl';
import { useUi, type Tab } from '../store/useUi';
import { ItemsTab } from './ItemsTab';
import { ResultsTab } from './ResultsTab';
import { TeamsTab } from './TeamsTab';

const TABS: { id: Tab; label: MessageKey }[] = [
  { id: 'items', label: 'tabs.items' },
  { id: 'results', label: 'tabs.results' },
  { id: 'teams', label: 'tabs.teams' },
];

export function Panel() {
  const t = useT();
  const tab = useUi((s) => s.tab);
  const set = useUi((s) => s.set);
  const listRef = useRef<HTMLDivElement>(null);

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((x) => x.id === tab);
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length : -1;
    if (next < 0) return;
    e.preventDefault();
    set({ tab: TABS[next].id });
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <aside className="panel" aria-label={t('tabs.label')}>
      <div className="segmented tabs" role="tablist" aria-label={t('tabs.label')} ref={listRef} onKeyDown={onKeyDown}>
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            id={`tab-${x.id}`}
            aria-selected={tab === x.id}
            aria-controls={`tabpanel-${x.id}`}
            tabIndex={tab === x.id ? 0 : -1}
            onClick={() => set({ tab: x.id })}
            style={{ minHeight: 44, fontSize: 15 }}
          >
            {t(x.label)}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'items' && <ItemsTab />}
        {tab === 'results' && <ResultsTab />}
        {tab === 'teams' && <TeamsTab />}
      </div>
    </aside>
  );
}
