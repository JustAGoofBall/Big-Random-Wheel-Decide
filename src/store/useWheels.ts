import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { detectLanguage } from '../i18n/detect';
import { parseList, type ParsedItem } from '../lib/parseList';
import { shuffle, uid } from '../lib/random';
import { MAX_ITEMS, type SharedWheel } from '../lib/share';
import { getTemplates } from '../templates';
import type { HistoryEntry, Item, PaletteId, Wheel } from '../types';

const MAX_HISTORY = 500;

type Removed = { wheelId: string; entries: { item: Item; index: number }[] };

type State = {
  wheels: Record<string, Wheel>;
  order: string[];
  activeId: string;
  history: Record<string, HistoryEntry[]>;
  lastRemoved: Removed | null;
};

type Actions = {
  setActive: (id: string) => void;
  updateWheel: (patch: Partial<Pick<Wheel, 'name' | 'palette' | 'afterWin'>>, id?: string) => void;
  /** Returns how many items were actually added (the wheel is capped at MAX_ITEMS). */
  addItems: (items: ParsedItem[], replace?: boolean) => number;
  updateItem: (itemId: string, patch: Partial<Omit<Item, 'id'>>) => void;
  removeItems: (ids: string[]) => void;
  undoRemove: () => boolean;
  moveItem: (from: number, to: number) => void;
  setHidden: (ids: string[], hidden: boolean) => void;
  shuffleItems: () => void;
  sortItems: (locale: string) => void;
  showAll: () => void;
  createWheel: (name: string, items: ParsedItem[], palette?: PaletteId) => string;
  duplicateWheel: (id: string, name: string) => string;
  deleteWheel: (id: string) => void;
  importWheel: (wheel: SharedWheel, sharedFrom?: string) => { id: string; existed: boolean };
  addHistory: (wheelId: string, entries: Omit<HistoryEntry, 'id'>[]) => void;
  clearHistory: () => void;
};

export type WheelStore = State & Actions;

function toItem(p: ParsedItem | Omit<Item, 'id'>): Item {
  return { id: uid(), label: p.label, weight: p.weight, hidden: false, ...('emoji' in p && p.emoji ? { emoji: p.emoji } : {}), ...('color' in p && p.color ? { color: p.color } : {}) };
}

function newWheel(name: string, items: ParsedItem[], palette: PaletteId = 'snoep'): Wheel {
  const now = Date.now();
  return { id: uid(), name, items: items.slice(0, MAX_ITEMS).map(toItem), palette, afterWin: 'ask', createdAt: now, updatedAt: now };
}

function initialState(): State {
  const tpl = getTemplates(detectLanguage(), parseList)[0];
  const wheel = newWheel(tpl.name, tpl.items, tpl.palette);
  return { wheels: { [wheel.id]: wheel }, order: [wheel.id], activeId: wheel.id, history: {}, lastRemoved: null };
}

export const useWheels = create<WheelStore>()(
  persist(
    (set, get) => {
      /** Applies `fn` to the active wheel's items and bumps updatedAt. */
      const editItems = (fn: (items: Item[]) => Item[]) =>
        set((s) => {
          const w = s.wheels[s.activeId];
          if (!w) return s;
          return { wheels: { ...s.wheels, [w.id]: { ...w, items: fn(w.items), updatedAt: Date.now() } } };
        });

      return {
        ...initialState(),

        setActive: (id) => set((s) => (s.wheels[id] ? { activeId: id } : s)),

        updateWheel: (patch, id) =>
          set((s) => {
            const w = s.wheels[id ?? s.activeId];
            if (!w) return s;
            return { wheels: { ...s.wheels, [w.id]: { ...w, ...patch, updatedAt: Date.now() } } };
          }),

        addItems: (parsed, replace = false) => {
          const w = get().wheels[get().activeId];
          if (!w) return 0;
          const room = MAX_ITEMS - (replace ? 0 : w.items.length);
          const added = parsed.slice(0, Math.max(0, room)).map(toItem);
          editItems((items) => (replace ? added : [...items, ...added]));
          return added.length;
        },

        updateItem: (itemId, patch) => editItems((items) => items.map((it) => (it.id === itemId ? { ...it, ...patch } : it))),

        removeItems: (ids) => {
          const w = get().wheels[get().activeId];
          if (!w) return;
          const entries = w.items.map((item, index) => ({ item, index })).filter((e) => ids.includes(e.item.id));
          if (!entries.length) return;
          editItems((items) => items.filter((it) => !ids.includes(it.id)));
          set({ lastRemoved: { wheelId: w.id, entries } });
        },

        undoRemove: () => {
          const r = get().lastRemoved;
          if (!r || !get().wheels[r.wheelId]) return false;
          set((s) => {
            const w = s.wheels[r.wheelId];
            const items = w.items.slice();
            for (const e of r.entries) items.splice(Math.min(e.index, items.length), 0, e.item);
            return { wheels: { ...s.wheels, [w.id]: { ...w, items, updatedAt: Date.now() } }, lastRemoved: null, activeId: w.id };
          });
          return true;
        },

        moveItem: (from, to) =>
          editItems((items) => {
            if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
            const next = items.slice();
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
          }),

        setHidden: (ids, hidden) => editItems((items) => items.map((it) => (ids.includes(it.id) ? { ...it, hidden } : it))),

        shuffleItems: () => editItems((items) => shuffle(items)),

        sortItems: (locale) => editItems((items) => items.slice().sort((a, b) => a.label.localeCompare(b.label, locale, { numeric: true }))),

        showAll: () => editItems((items) => items.map((it) => (it.hidden ? { ...it, hidden: false } : it))),

        createWheel: (name, items, palette) => {
          const w = newWheel(name, items, palette);
          set((s) => ({ wheels: { ...s.wheels, [w.id]: w }, order: [w.id, ...s.order], activeId: w.id }));
          return w.id;
        },

        duplicateWheel: (id, name) => {
          const src = get().wheels[id];
          if (!src) return id;
          const now = Date.now();
          const copy: Wheel = { ...src, id: uid(), name, items: src.items.map((it) => ({ ...it, id: uid() })), createdAt: now, updatedAt: now, sharedFrom: undefined };
          set((s) => ({ wheels: { ...s.wheels, [copy.id]: copy }, order: [copy.id, ...s.order], activeId: copy.id }));
          return copy.id;
        },

        deleteWheel: (id) =>
          set((s) => {
            if (!s.wheels[id]) return s;
            const wheels = { ...s.wheels };
            delete wheels[id];
            const history = { ...s.history };
            delete history[id];
            const order = s.order.filter((x) => x !== id);
            if (order.length === 0) return initialState();
            return { wheels, history, order, activeId: s.activeId === id ? order[0] : s.activeId };
          }),

        importWheel: (shared, sharedFrom) => {
          if (sharedFrom) {
            const existing = Object.values(get().wheels).find((w) => w.sharedFrom === sharedFrom);
            if (existing) {
              set({ activeId: existing.id });
              return { id: existing.id, existed: true };
            }
          }
          const now = Date.now();
          const w: Wheel = {
            id: uid(),
            name: shared.name,
            palette: shared.palette,
            items: shared.items.slice(0, MAX_ITEMS).map(toItem),
            afterWin: 'ask',
            createdAt: now,
            updatedAt: now,
            ...(sharedFrom ? { sharedFrom } : {}),
          };
          set((s) => ({ wheels: { ...s.wheels, [w.id]: w }, order: [w.id, ...s.order], activeId: w.id }));
          return { id: w.id, existed: false };
        },

        addHistory: (wheelId, entries) =>
          set((s) => {
            if (!s.wheels[wheelId]) return s;
            const list = s.history[wheelId] ?? [];
            const added = entries.map((e) => ({ ...e, id: uid() })).reverse();
            return { history: { ...s.history, [wheelId]: [...added, ...list].slice(0, MAX_HISTORY) } };
          }),

        clearHistory: () => set((s) => ({ history: { ...s.history, [s.activeId]: [] } })),
      };
    },
    {
      name: 'spindecide-wheels',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ wheels, order, activeId, history }) => ({ wheels, order, activeId, history }),
    },
  ),
);

export function useActiveWheel(): Wheel {
  return useWheels((s) => s.wheels[s.activeId] ?? s.wheels[s.order[0]]);
}
