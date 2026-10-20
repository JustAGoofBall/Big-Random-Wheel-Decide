import { compressToEncodedURIComponent } from 'lz-string';
import { decodeWheel, encodeWheel, payloadFromHash, shareUrl, wheelFromFile, wheelToFile } from '../src/lib/share';
import type { Item } from '../src/types';

const items: Item[] = [
  { id: '1', label: 'Pizza', weight: 2, emoji: '🍕', hidden: false },
  { id: '2', label: 'Sushi', weight: 1, color: '#123ABC', hidden: false },
  { id: '3', label: 'Plain', weight: 1, hidden: true, imageId: 'img_x' },
];

describe('share links', () => {
  it('round-trips a wheel', () => {
    const out = decodeWheel(encodeWheel({ name: 'Wat eten we?', palette: 'oceaan', items }));
    expect(out).toEqual({
      name: 'Wat eten we?',
      palette: 'oceaan',
      items: [
        { label: 'Pizza', weight: 2, emoji: '🍕', hidden: false },
        { label: 'Sushi', weight: 1, color: '#123ABC', hidden: false },
        { label: 'Plain', weight: 1, hidden: false },
      ],
    });
  });

  it('builds and reads a #w= URL', () => {
    const url = shareUrl({ name: 'X', palette: 'snoep', items }, 'https://example.com/app/?a=1#old');
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/app/');
    expect(parsed.search).toBe('?a=1');
    const payload = payloadFromHash(parsed.hash)!;
    expect(decodeWheel(payload)?.name).toBe('X');
  });

  it('rejects garbage', () => {
    expect(decodeWheel('not-a-payload')).toBeNull();
    expect(decodeWheel('')).toBeNull();
    expect(decodeWheel(compressToEncodedURIComponent('{"i":[]}'))).toBeNull();
    expect(decodeWheel(compressToEncodedURIComponent('[1,2,3]'))).toBeNull();
  });

  it('sanitises untrusted payloads', () => {
    const evil = {
      n: 'y'.repeat(500),
      p: 'nope',
      i: [['A', 999, '🍕', 'red; background:url(x)'], [42, 1], ['  ', 1], ['B', 'abc', 'x'.repeat(50)], ...Array.from({ length: 200 }, (_, i) => [`i${i}`, 1])],
    };
    const out = decodeWheel(compressToEncodedURIComponent(JSON.stringify(evil)))!;
    expect(out.name).toHaveLength(60);
    expect(out.palette).toBe('snoep');
    expect(out.items).toHaveLength(98);
    expect(out.items[0]).toEqual({ label: 'A', weight: 10, emoji: '🍕', hidden: false });
    expect(out.items[1]).toEqual({ label: 'B', weight: 1, hidden: false });
  });
});

describe('json files', () => {
  it('round-trips through export/import', () => {
    const text = wheelToFile({ name: 'File', palette: 'pastel', items });
    expect(JSON.parse(text).app).toBe('SpinDecide');
    const out = wheelFromFile(text)!;
    expect(out.name).toBe('File');
    expect(out.palette).toBe('pastel');
    expect(out.items.map((i) => i.label)).toEqual(['Pizza', 'Sushi', 'Plain']);
    expect(out.items[1].color).toBe('#123ABC');
  });

  it('accepts a plain list of strings and rejects bad files', () => {
    expect(wheelFromFile('{"items":["a","b"]}')?.items.map((i) => i.label)).toEqual(['a', 'b']);
    expect(wheelFromFile('{')).toBeNull();
    expect(wheelFromFile('{"items":"nope"}')).toBeNull();
  });
});
