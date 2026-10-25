import { describe, expect, it } from 'vitest';
import {
  LIGHT_PALETTE,
  PALETTE_INDEX,
  PALETTE_NAMES,
  VOXEL_PALETTE,
  hash3,
  hexToSrgb,
  jitteredLinear,
  paletteEntryAt,
} from '../src/art/palette';

const HEX = /^#[0-9A-F]{6}$/i;

describe('palette', () => {
  it('has valid hex colors everywhere', () => {
    for (const e of Object.values(VOXEL_PALETTE)) expect(e.hex).toMatch(HEX);
    for (const hex of Object.values(LIGHT_PALETTE)) expect(hex).toMatch(HEX);
  });

  it('fits a Uint8 index with 0 reserved for empty', () => {
    expect(PALETTE_NAMES.length).toBeLessThan(256);
    expect(Math.min(...Object.values(PALETTE_INDEX))).toBe(1);
    expect(paletteEntryAt(0)).toBeUndefined();
    expect(paletteEntryAt(PALETTE_INDEX.glazeyCoral)?.hex).toBe('#F28B6E');
  });

  it('keeps the art bible core families', () => {
    expect(VOXEL_PALETTE.doughGolden.hex).toBe('#E8A85C');
    expect(VOXEL_PALETTE.frostingPink.hex).toBe('#F27BA5');
    expect(VOXEL_PALETTE.blueberry.hex).toBe('#7C8CE0');
    expect(VOXEL_PALETTE.milk.hex).toBe('#FFF6E6');
  });

  it('avoids pure black and pure white (art bible §4)', () => {
    for (const e of Object.values(VOXEL_PALETTE)) {
      expect(e.hex.toUpperCase()).not.toBe('#000000');
      expect(e.hex.toUpperCase()).not.toBe('#FFFFFF');
    }
  });

  it('keeps jitter within the art bible ±3–6 % range', () => {
    for (const e of Object.values(VOXEL_PALETTE)) expect(e.jitter).toBeLessThanOrEqual(0.06);
  });

  it('jitter is deterministic and stays close to the base color', () => {
    const i = PALETTE_INDEX.doughGolden;
    const a = jitteredLinear(i, 3, 4, 5);
    expect(jitteredLinear(i, 3, 4, 5)).toEqual(a);
    const base = hexToSrgb(VOXEL_PALETTE.doughGolden.hex);
    const toSrgb = (c: number): number =>
      c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    expect(Math.abs(toSrgb(a.g) - base.g)).toBeLessThan(0.06);
  });

  it('hash3 is uniform-ish in [0, 1)', () => {
    let sum = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const h = hash3(i, i * 7, i * 13);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
      sum += h;
    }
    expect(sum / n).toBeGreaterThan(0.45);
    expect(sum / n).toBeLessThan(0.55);
  });
});
