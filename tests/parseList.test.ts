import { parseLine, parseList, splitEmoji } from '../src/lib/parseList';

describe('splitEmoji', () => {
  it.each([
    ['🍕 Pizza', '🍕', 'Pizza'],
    ['🍕Pizza', '🍕', 'Pizza'],
    ['👍🏽 Yes', '👍🏽', 'Yes'],
    ['👨‍👩‍👧 Family', '👨‍👩‍👧', 'Family'],
    ['🇳🇱 Nederland', '🇳🇱', 'Nederland'],
    ['❤️ Love', '❤️', 'Love'],
  ])('splits %s', (input, emoji, label) => {
    expect(splitEmoji(input)).toEqual({ emoji, label });
  });

  it('leaves plain text alone', () => {
    expect(splitEmoji('Pizza 🍕')).toEqual({ label: 'Pizza 🍕' });
    expect(splitEmoji('42')).toEqual({ label: '42' });
  });
});

describe('parseLine', () => {
  it('reads weights', () => {
    expect(parseLine('Pizza *3')).toEqual({ label: 'Pizza', weight: 3 });
    expect(parseLine('Pizza×2')).toEqual({ label: 'Pizza', weight: 2 });
    expect(parseLine('Pizza, 4')).toEqual({ label: 'Pizza', weight: 4 });
    expect(parseLine('Pizza *99')).toEqual({ label: 'Pizza', weight: 10 });
    expect(parseLine('Pizza *0')).toEqual({ label: 'Pizza', weight: 1 });
  });

  it('combines emoji and weight', () => {
    expect(parseLine('  🍕 Pizza *2 ')).toEqual({ label: 'Pizza', weight: 2, emoji: '🍕' });
  });

  it('keeps a lone emoji as the label', () => {
    expect(parseLine('🎉')).toEqual({ label: '🎉', weight: 1 });
  });

  it('skips empty lines and strips CSV quotes', () => {
    expect(parseLine('   ')).toBeNull();
    expect(parseLine('*3')).toBeNull();
    expect(parseLine('"Hello, world"')).toEqual({ label: 'Hello, world', weight: 1 });
  });

  it('caps label length', () => {
    expect(parseLine('x'.repeat(100))!.label).toHaveLength(60);
  });
});

describe('parseList', () => {
  it('parses one item per line', () => {
    expect(parseList('A\r\n\nB *2\n  \n🍣 C')).toEqual([
      { label: 'A', weight: 1 },
      { label: 'B', weight: 2 },
      { label: 'C', weight: 1, emoji: '🍣' },
    ]);
  });
});
