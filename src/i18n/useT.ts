import { useCallback } from 'react';
import { useSettings } from '../store/useSettings';
import type { Language } from '../types';
import { en } from './en';
import { nl, type MessageKey } from './nl';

const DICTS: Record<Language, Record<MessageKey, string>> = { nl, en };

export type Vars = Record<string, string | number>;
export type TFunction = (key: MessageKey, vars?: Vars) => string;

export function translate(lang: Language, key: MessageKey, vars?: Vars): string {
  const text = DICTS[lang][key] ?? nl[key];
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export function ordinal(n: number, lang: Language): string {
  if (lang === 'nl') return `${n}e`;
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
}

export function useT(): TFunction {
  const lang = useSettings((s) => s.language);
  return useCallback<TFunction>((key, vars) => translate(lang, key, vars), [lang]);
}
