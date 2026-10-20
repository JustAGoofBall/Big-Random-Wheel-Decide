import { create } from 'zustand';
import type { Item } from '../types';

export type Dialog = 'paste' | 'settings' | 'drawer' | 'shortcuts' | null;
export type Tab = 'items' | 'results' | 'teams';
export type Toast = { id: number; message: string; action?: { label: string; run: () => void } };
export type Winner = Item & { color: string; chance: number };
export type Team = { name: string; color: string; members: string[] };

type Ui = {
  dialog: Dialog;
  tab: Tab;
  toast: Toast | null;
  fullscreen: boolean;
  spinning: boolean;
  /** Items already drawn in the current multi-winner round; they sit out until the round ends. */
  excluded: string[];
  winners: Winner[] | null;
  winnerCount: number;
  teams: Team[] | null;
  teamMode: 'count' | 'size';
  teamValue: number;
  set: (patch: Partial<Omit<Ui, 'set' | 'showToast'>>) => void;
  showToast: (message: string, action?: Toast['action']) => void;
};

let toastId = 0;

export const useUi = create<Ui>()((set) => ({
  dialog: null,
  tab: 'items',
  toast: null,
  fullscreen: false,
  spinning: false,
  excluded: [],
  winners: null,
  winnerCount: 1,
  teams: null,
  teamMode: 'count',
  teamValue: 2,
  set: (patch) => set(patch),
  showToast: (message, action) => set({ toast: { id: ++toastId, message, action } }),
}));
