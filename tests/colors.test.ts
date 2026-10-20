import { INK, PALETTES, WHITE, contrastRatio, parseHex, textColorFor } from '../src/lib/colors';

describe('colors', () => {
  it('parses hex colours', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('2B2240')).toEqual([43, 34, 64]);
    expect(parseHex('red')).toBeNull();
  });

  it('computes contrast ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1);
  });

  it('picks readable text for every palette colour (WCAG AA, 4.5:1)', () => {
    for (const colors of Object.values(PALETTES)) {
      for (const c of colors) {
        expect(contrastRatio(c, textColorFor(c))).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('uses white text on dark custom colours', () => {
    expect(textColorFor('#1B1530')).toBe(WHITE);
    expect(textColorFor('#FFE066')).toBe(INK);
  });
});
