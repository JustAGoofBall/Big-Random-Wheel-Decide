import { useT } from '../i18n/useT';
import { PALETTES } from '../lib/colors';
import { makeTeams } from '../lib/random';
import { useUi } from '../store/useUi';
import { useActiveWheel } from '../store/useWheels';
import { Icon } from './Icon';

export function TeamsTab() {
  const t = useT();
  const wheel = useActiveWheel();
  const { teams, teamMode, teamValue, set, showToast } = useUi();
  const names = wheel.items.filter((i) => !i.hidden).map((i) => (i.emoji ? `${i.emoji} ${i.label}` : i.label));
  const max = Math.max(2, names.length);
  const value = Math.min(Math.max(teamMode === 'count' ? 2 : 1, teamValue), max);
  const teamCount = teamMode === 'count' ? value : Math.ceil(names.length / value);
  const enough = names.length >= 2;

  const make = () => {
    const palette = PALETTES[wheel.palette];
    const groups = makeTeams(names, Math.max(1, teamCount));
    set({
      teams: groups.map((members, i) => ({ name: t('teams.team', { n: i + 1 }), color: palette[i % palette.length], members })),
    });
  };

  const copy = async () => {
    if (!teams) return;
    const text = teams.map((tm) => `${tm.name}: ${tm.members.join(', ')}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('teams.copied'));
    } catch {
      showToast(t('share.failed'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ fontSize: 22 }}>{t('teams.title')}</h2>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>
        {t('teams.intro', { n: names.length })}
      </p>
      {!enough ? (
        <div className="empty">
          <p>{t('teams.needItems')}</p>
        </div>
      ) : (
        <>
          <div className="tools" style={{ alignItems: 'center' }}>
            <div className="segmented" role="radiogroup" aria-label={t('teams.title')}>
              <button type="button" role="radio" aria-checked={teamMode === 'count'} onClick={() => set({ teamMode: 'count', teamValue: 2 })}>
                {t('teams.byCount')}
              </button>
              <button type="button" role="radio" aria-checked={teamMode === 'size'} onClick={() => set({ teamMode: 'size', teamValue: 2 })}>
                {t('teams.bySize')}
              </button>
            </div>
            <div className="stepper">
              <button
                type="button"
                onClick={() => set({ teamValue: value - 1 })}
                disabled={value <= (teamMode === 'count' ? 2 : 1)}
                aria-label={t('teams.fewer')}
              >
                −
              </button>
              <output className="stepper__value" aria-live="polite">
                {value}
              </output>
              <button type="button" onClick={() => set({ teamValue: value + 1 })} disabled={value >= max} aria-label={t('teams.more')}>
                +
              </button>
            </div>
          </div>
          <div className="tools">
            <button type="button" className="btn btn--accent btn--square" onClick={make}>
              <Icon name="shuffle" size={18} />
              {teams ? t('teams.again') : t('teams.make')}
            </button>
            {teams && (
              <button type="button" className="btn btn--soft" onClick={() => void copy()}>
                <Icon name="clipboard" size={16} />
                {t('teams.copy')}
              </button>
            )}
          </div>
          {teams && (
            <div className="teams-grid">
              {teams.map((tm) => (
                <section className="team" key={tm.name}>
                  <h3 style={{ background: tm.color }}>{tm.name}</h3>
                  <ul>
                    {tm.members.map((m, i) => (
                      <li key={`${m}-${i}`}>{m}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
