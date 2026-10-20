import { MAX_ITEMS } from '../src/lib/share';
import { useWheels } from '../src/store/useWheels';

const active = () => {
  const s = useWheels.getState();
  return s.wheels[s.activeId];
};

beforeEach(() => {
  localStorage.clear();
  const s = useWheels.getState();
  s.createWheel('Test', [
    { label: 'A', weight: 1 },
    { label: 'B', weight: 2 },
    { label: 'C', weight: 1 },
  ]);
});

describe('wheel store', () => {
  it('starts with a template wheel', () => {
    expect(useWheels.getState().order.length).toBeGreaterThan(0);
  });

  it('adds, edits and removes items with undo', () => {
    const s = useWheels.getState();
    expect(s.addItems([{ label: 'D', weight: 1, emoji: '🎉' }])).toBe(1);
    expect(active().items.map((i) => i.label)).toEqual(['A', 'B', 'C', 'D']);

    const b = active().items[1];
    s.updateItem(b.id, { weight: 5 });
    expect(active().items[1].weight).toBe(5);

    s.removeItems([b.id]);
    expect(active().items.map((i) => i.label)).toEqual(['A', 'C', 'D']);
    expect(s.undoRemove()).toBe(true);
    expect(active().items.map((i) => i.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(s.undoRemove()).toBe(false);
  });

  it('caps a wheel at MAX_ITEMS', () => {
    const many = Array.from({ length: MAX_ITEMS + 10 }, (_, i) => ({ label: `x${i}`, weight: 1 }));
    expect(useWheels.getState().addItems(many)).toBe(MAX_ITEMS - 3);
    expect(active().items).toHaveLength(MAX_ITEMS);
    expect(useWheels.getState().addItems(many, true)).toBe(MAX_ITEMS);
  });

  it('moves, hides and shows items', () => {
    const s = useWheels.getState();
    s.moveItem(0, 2);
    expect(active().items.map((i) => i.label)).toEqual(['B', 'C', 'A']);
    s.setHidden([active().items[0].id], true);
    expect(active().items[0].hidden).toBe(true);
    s.showAll();
    expect(active().items.every((i) => !i.hidden)).toBe(true);
  });

  it('keeps history per wheel', () => {
    const s = useWheels.getState();
    const id = s.activeId;
    s.addHistory(id, [{ itemId: 'x', label: 'A', color: '#fff', at: 1 }]);
    s.addHistory(id, [{ itemId: 'y', label: 'B', color: '#fff', at: 2 }]);
    expect(useWheels.getState().history[id].map((h) => h.label)).toEqual(['B', 'A']);
    s.clearHistory();
    expect(useWheels.getState().history[id]).toEqual([]);
  });

  it('does not import the same share link twice', () => {
    const s = useWheels.getState();
    const shared = { name: 'Shared', palette: 'snoep' as const, items: [{ label: 'Q', weight: 1, hidden: false }] };
    const first = s.importWheel(shared, 'payload-1');
    const second = useWheels.getState().importWheel(shared, 'payload-1');
    expect(first.existed).toBe(false);
    expect(second).toEqual({ id: first.id, existed: true });
  });

  it('always keeps at least one wheel', () => {
    for (const id of [...useWheels.getState().order]) useWheels.getState().deleteWheel(id);
    const s = useWheels.getState();
    expect(s.order).toHaveLength(1);
    expect(s.wheels[s.activeId]).toBeDefined();
  });
});
