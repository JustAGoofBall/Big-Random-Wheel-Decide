import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { detectLanguage } from '../i18n/detect';
import type { Language, Theme } from '../types';

type Settings = {
  language: Language;
  theme: Theme;
  sound: boolean;
  confetti: boolean;
  set: (patch: Partial<Omit<Settings, 'set'>>) => void;
};

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      language: detectLanguage(),
      theme: 'system',
      sound: true,
      confetti: true,
      set: (patch) => set(patch),
    }),
    { name: 'spindecide-settings', version: 1 },
  ),
);
