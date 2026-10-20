import type { Language } from '../types';

export function detectLanguage(): Language {
  const langs = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  return langs.some((l) => l?.toLowerCase().startsWith('nl')) ? 'nl' : 'en';
}
