import type { ParsedItem } from './lib/parseList';
import type { Language, PaletteId } from './types';

export type Template = { id: string; name: string; palette: PaletteId; items: ParsedItem[] };

type Def = { id: string; palette: PaletteId; name: Record<Language, string>; items: Record<Language, string[]> | string[] };

const e = (emoji: string, label: string, weight = 1): string => `${emoji} ${label}${weight > 1 ? ` *${weight}` : ''}`;

const DEFS: Def[] = [
  {
    id: 'food',
    palette: 'snoep',
    name: { nl: 'Wat eten we?', en: 'What’s for dinner?' },
    items: {
      nl: [e('🍕', 'Pizza'), e('🍣', 'Sushi'), e('🍔', 'Burger'), e('🍝', 'Pasta'), e('🌮', "Taco's"), e('🍛', 'Curry'), e('🥗', 'Salade'), e('🥞', 'Pannenkoeken'), e('🍜', 'Noedels'), e('🥙', 'Shoarma')],
      en: [e('🍕', 'Pizza'), e('🍣', 'Sushi'), e('🍔', 'Burger'), e('🍝', 'Pasta'), e('🌮', 'Tacos'), e('🍛', 'Curry'), e('🥗', 'Salad'), e('🥞', 'Pancakes'), e('🍜', 'Noodles'), e('🥙', 'Kebab')],
    },
  },
  {
    id: 'yesno',
    palette: 'regenboog',
    name: { nl: 'Ja / Nee', en: 'Yes / No' },
    items: { nl: [e('👍', 'Ja'), e('👎', 'Nee')], en: [e('👍', 'Yes'), e('👎', 'No')] },
  },
  {
    id: 'numbers',
    palette: 'regenboog',
    name: { nl: 'Getal 1–10', en: 'Number 1–10' },
    items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  },
  {
    id: 'truthdare',
    palette: 'zonsondergang',
    name: { nl: 'Truth or Dare', en: 'Truth or Dare' },
    items: { nl: [e('🤔', 'Truth'), e('🔥', 'Dare')], en: [e('🤔', 'Truth'), e('🔥', 'Dare')] },
  },
  {
    id: 'whopays',
    palette: 'snoep',
    name: { nl: 'Wie betaalt?', en: 'Who pays?' },
    items: { nl: ['Speler 1', 'Speler 2', 'Speler 3', 'Speler 4'], en: ['Player 1', 'Player 2', 'Player 3', 'Player 4'] },
  },
  {
    id: 'movies',
    palette: 'oceaan',
    name: { nl: 'Filmgenre', en: 'Movie genre' },
    items: {
      nl: [e('😂', 'Komedie'), e('💥', 'Actie'), e('👻', 'Horror'), e('💘', 'Romantiek'), e('🚀', 'Sciencefiction'), e('🕵️', 'Thriller'), e('🧸', 'Animatie'), e('📽️', 'Documentaire')],
      en: [e('😂', 'Comedy'), e('💥', 'Action'), e('👻', 'Horror'), e('💘', 'Romance'), e('🚀', 'Sci-fi'), e('🕵️', 'Thriller'), e('🧸', 'Animation'), e('📽️', 'Documentary')],
    },
  },
  {
    id: 'dice',
    palette: 'pastel',
    name: { nl: 'Dobbelsteen', en: 'Dice' },
    items: ['⚀ 1', '⚁ 2', '⚂ 3', '⚃ 4', '⚄ 5', '⚅ 6'],
  },
  {
    id: 'activity',
    palette: 'zonsondergang',
    name: { nl: 'Activiteit vandaag', en: 'Activity today' },
    items: {
      nl: [e('🎳', 'Bowlen'), e('🎬', 'Bioscoop'), e('🚲', 'Fietstocht'), e('🎲', 'Spelletjesavond'), e('🏊', 'Zwemmen'), e('🍳', 'Samen koken'), e('🎤', 'Karaoke'), e('🌳', 'Wandelen')],
      en: [e('🎳', 'Bowling'), e('🎬', 'Cinema'), e('🚲', 'Bike ride'), e('🎲', 'Game night'), e('🏊', 'Swimming'), e('🍳', 'Cook together'), e('🎤', 'Karaoke'), e('🌳', 'Go for a walk')],
    },
  },
  { id: 'empty', palette: 'snoep', name: { nl: 'Leeg rad', en: 'Empty wheel' }, items: [] },
];

export function getTemplates(lang: Language, parse: (text: string) => ParsedItem[]): Template[] {
  return DEFS.map((d) => ({
    id: d.id,
    palette: d.palette,
    name: d.name[lang],
    items: parse((Array.isArray(d.items) ? d.items : d.items[lang]).join('\n')),
  }));
}
