import { describe, expect, it } from 'vitest';
import { PALETTE_INDEX } from '../src/art/palette';
import {
  DONUT_FLAVORS,
  DONUT_HERO_VOXEL,
  DONUT_VOXEL,
  biteDonut,
  buildDonut,
  donutSize,
} from '../src/art/models/donut';
import { buildGlazey } from '../src/art/models/glazey';
import type { VoxelGrid } from '../src/engine/voxel/VoxelGrid';

const colors = (g: VoxelGrid): Set<number> => {
  const s = new Set<number>();
  g.forEachVoxel((_x, _y, _z, c) => s.add(c));
  return s;
};

/** Width of the model along x at height y (voxels). */
const widthAt = (g: VoxelGrid, y: number): number => {
  let lo = Infinity;
  let hi = -Infinity;
  g.forEachVoxel((x, yy) => {
    if (yy !== y) return;
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
  });
  return hi - lo + 1;
};

describe('donut library', () => {
  it('builds all nine flavors inside their declared size', { timeout: 60000 }, () => {
    expect(DONUT_FLAVORS).toHaveLength(9);
    for (const f of DONUT_FLAVORS) {
      const g = buildDonut(f, 1, DONUT_VOXEL);
      const size = donutSize(DONUT_VOXEL, f);
      let n = 0;
      g.forEachVoxel((x, y, z) => {
        n++;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(z).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(size[0]);
        expect(z).toBeLessThan(size[2]);
        expect(y).toBeGreaterThanOrEqual(0);
      });
      expect(n).toBeGreaterThan(1000);
    }
  });

  it('keeps chocolate drips palette-true (RF-14)', () => {
    const c = colors(buildDonut('chocolate', 2, DONUT_VOXEL));
    const allowed = new Set([
      PALETTE_INDEX.chocolate,
      PALETTE_INDEX.chocolateDark,
      PALETTE_INDEX.doughGolden,
      PALETTE_INDEX.doughToasted,
      PALETTE_INDEX.doughCrust,
      PALETTE_INDEX.doughCrumb,
    ]);
    for (const k of c) expect(allowed.has(k)).toBe(true);
  });

  it('uses the soft blueberry family, never navy (RF-15)', () => {
    const c = colors(buildDonut('blueberry', 3, DONUT_VOXEL));
    expect(c.has(PALETTE_INDEX.blueberry) || c.has(PALETTE_INDEX.blueberryLight)).toBe(true);
  });

  it('puts the rainbow glaze only on the rainbow mega donut (RF-16)', () => {
    const rainbow = PALETTE_INDEX.rainbowRed;
    for (const f of DONUT_FLAVORS) {
      expect(colors(buildDonut(f, 1, DONUT_VOXEL)).has(rainbow)).toBe(f === 'rainbow');
    }
  });

  it('bites carve about a third each and expose crumb', () => {
    const g = buildDonut('glazed', 4, DONUT_HERO_VOXEL);
    const whole = g.count();
    const first = biteDonut(g, 'glazed', { angle: 1 }, DONUT_HERO_VOXEL, 1);
    const second = biteDonut(g, 'glazed', { angle: 2 }, DONUT_HERO_VOXEL, 2);
    expect(first.length / whole).toBeGreaterThan(0.12);
    expect(first.length / whole).toBeLessThan(0.45);
    expect(second.length).toBeGreaterThan(0);
    expect(g.count()).toBe(whole - first.length - second.length);
    expect(colors(g).has(PALETTE_INDEX.crumbPore)).toBe(true);
  });
});

describe('Glazey', () => {
  it('is about 32 voxels tall at belly 0 (RF-09)', () => {
    const { height } = buildGlazey(0);
    expect(height).toBeGreaterThanOrEqual(30);
    expect(height).toBeLessThanOrEqual(38);
  });

  it('grows clearly rounder at every belly stage (RF-12)', () => {
    const stages = [0, 1, 2, 3, 4, 5].map((b) => {
      const g = buildGlazey(b);
      let lo = Infinity;
      let hi = -Infinity;
      g.grid.forEachVoxel((_x, _y, z) => {
        lo = Math.min(lo, z);
        hi = Math.max(hi, z);
      });
      return { volume: g.grid.count(), depth: hi - lo, width: widthAt(g.grid, 6) };
    });
    stages.slice(1).forEach((s, i) => {
      const prev = stages[i] ?? s;
      expect(s.volume / prev.volume).toBeGreaterThan(1.15);
      expect(s.depth).toBeGreaterThan(prev.depth);
      expect(s.width).toBeGreaterThanOrEqual(prev.width);
    });
  });

  it('is coral on the back, with no face or text there (RF-10, RF-13)', () => {
    const { grid, pivot } = buildGlazey(2);
    const back = new Set<number>();
    grid.forEachVoxel((_x, y, z, c) => {
      if (z < pivot[2] - 3 && y < 30) back.add(c);
    });
    expect([...back]).toEqual([PALETTE_INDEX.glazeyBody]);
  });
});
