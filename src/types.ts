export type Item = {
  id: string;
  label: string;
  /** 1–10; a weight of 2 gets a segment twice as large (and twice the chance). */
  weight: number;
  color?: string;
  emoji?: string;
  /** Key of an uploaded image in IndexedDB. */
  imageId?: string;
  hidden: boolean;
};

export type AfterWin = 'ask' | 'keep' | 'hide' | 'remove';

export type PaletteId = 'snoep' | 'oceaan' | 'zonsondergang' | 'regenboog' | 'pastel';

export type Wheel = {
  id: string;
  name: string;
  items: Item[];
  palette: PaletteId;
  afterWin: AfterWin;
  createdAt: number;
  updatedAt: number;
  /** Share-link payload this wheel was opened from, to avoid importing it twice. */
  sharedFrom?: string;
};

export type HistoryEntry = {
  id: string;
  itemId: string;
  label: string;
  emoji?: string;
  color: string;
  at: number;
};

export type Language = 'nl' | 'en';
export type Theme = 'system' | 'light' | 'dark';
