import { useMemo } from 'react';
import { useT } from '../i18n/useT';
import { textColorFor } from '../lib/colors';
import { download } from '../lib/download';
import { useSettings } from '../store/useSettings';
import { useActiveWheel, useWheels } from '../store/useWheels';
import type { HistoryEntry } from '../types';
import { Icon } from './Icon';

const EMPTY: HistoryEntry[] = [];
const SHOWN = 50;

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ResultsTab() {
  const t = useT();
  const language = useSettings((s) => s.language);
  const wheel = useActiveWheel();
  const history = useWheels((s) => s.history[s.activeId] ?? EMPTY);
  const clearHistory = useWheels((s) => s.clearHistory);

  const stats = useMemo(() => {
    const map = new Map<string, { label: string; emoji?: string; color: string; n: number }>();
    for (const h of history) {
      const key = `${h.emoji ?? ''}|${h.label}`;
      const s = map.get(key);
      if (s) s.n += 1;
      else map.set(key, { label: h.label, emoji: h.emoji, color: h.color, n: 1 });
    }
    return [...map.values()].sort((a, b) => b.n - a.n).slice(0, 10);
  }, [history]);

  const today = new Date().toDateString();
  const timeFmt = new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateFmt = new Intl.DateTimeFormat(language, { dateStyle: 'short', timeStyle: 'short' });
  const when = (at: number) => (new Date(at).toDateString() === today ? timeFmt.format(at) : dateFmt.format(at));

  const exportCsv = () => {
    const rows = [[t('results.csvItem'), t('results.csvTime')], ...history.map((h) => [(h.emoji ? `${h.emoji} ` : '') + h.label, new Date(h.at).toISOString()])];
    download(`${wheel.name || 'spindecide'}-${language === 'nl' ? 'resultaten' : 'results'}.csv`, rows.map((r) => r.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8');
  };

  const max = stats[0]?.n ?? 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="panel__head">
        <h2>{t('results.title')}</h2>
        <div className="tools">
          <button type="button" className="btn btn--soft" onClick={exportCsv} disabled={!history.length}>
            <Icon name="download" size={16} />
            {t('results.export')}
          </button>
          <button type="button" className="btn btn--soft" onClick={clearHistory} disabled={!history.length}>
            {t('results.clear')}
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="empty">
          <h3>{t('results.emptyTitle')}</h3>
          <p>{t('results.emptyBody')}</p>
        </div>
      ) : (
        <>
          <div className="stats">
            <span className="stats__title">{t('results.stats', { n: history.length })}</span>
            {stats.map((s) => (
              <div className="stat" key={`${s.emoji}|${s.label}`}>
                <span className="stat__label">
                  {s.emoji} {s.label}
                </span>
                <span className="stat__bar" aria-hidden="true">
                  <span style={{ width: `${(s.n / max) * 100}%`, background: s.color }} />
                </span>
                <span className="stat__n">{s.n}</span>
              </div>
            ))}
          </div>
          <ol className="history">
            {history.slice(0, SHOWN).map((h) => (
              <li key={h.id}>
                <span className="history__chip" style={{ background: h.color, color: textColorFor(h.color) }} aria-hidden="true">
                  {h.emoji ?? '•'}
                </span>
                <span className="history__label">{h.label}</span>
                <time className="history__time" dateTime={new Date(h.at).toISOString()}>
                  {when(h.at)}
                </time>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
