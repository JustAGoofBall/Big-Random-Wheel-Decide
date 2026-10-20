import { parseList } from '../src/lib/parseList';
import { getTemplates } from '../src/templates';

describe('templates', () => {
  it('parse in both languages with unique ids', () => {
    for (const lang of ['nl', 'en'] as const) {
      const all = getTemplates(lang, parseList);
      expect(new Set(all.map((t) => t.id)).size).toBe(all.length);
      for (const t of all) expect(t.items.every((i) => i.label.length > 0)).toBe(true);
    }
  });

  it('has the full Marvel Rivals roster (Season 10.5) with roles', () => {
    const mr = getTemplates('nl', parseList).find((t) => t.id === 'marvel-rivals')!;
    const labels = mr.items.map((i) => i.label);
    expect(labels).toHaveLength(54);
    expect(new Set(labels).size).toBe(54);
    expect(labels).toContain('Gorr the God Butcher');
    const byRole = (emoji: string) => mr.items.filter((i) => i.emoji === emoji).length;
    expect(byRole('🛡️')).toBe(14);
    expect(byRole('⚔️')).toBe(27);
    expect(byRole('💚')).toBe(12);
    expect(byRole('⭐')).toBe(1);
  });
});
