import { describe, expect, it } from 'vitest';
import { buildIslandTerrain, COARSE, FINE } from '../src/game/world/IslandTerrain';
import { IslandShape, innerRadius, outerRadius } from '../src/game/world/islandShape';
import { MEADOW_LAYOUT } from '../src/game/world/meadowLayout';

describe('island terrain (two resolutions)', () => {
  const shape = new IslandShape(MEADOW_LAYOUT);
  const t = buildIslandTerrain(shape, { grassDensity: 0.2 });

  it('builds both grids in reasonable time', () => {
    expect(t.coarse.count()).toBeGreaterThan(100_000);
    expect(t.fine.count()).toBeGreaterThan(1_000_000);
    console.log(
      'terrain',
      t.stats,
      'coarse',
      t.coarse.count(),
      'fine',
      t.fine.count(),
      'fine chunks',
      t.fine.chunks.size,
    );
  });

  it('never fills the same space twice', () => {
    let overlaps = 0;
    for (const { cx, cy, cz } of t.fine.chunkCoords()) {
      for (let i = 0; i < 4000; i++) {
        const x = cx * 32 + ((i * 7) & 31);
        const y = cy * 32 + ((i * 13) & 31);
        const z = cz * 32 + ((i * 29) & 31);
        if (t.fine.get(x, y, z) && t.coarse.get(x >> 2, y >> 2, z >> 2)) overlaps++;
      }
    }
    expect(overlaps).toBe(0);
  });

  it('has a closed top surface: every ring column has a fine surface voxel', () => {
    let holes = 0;
    for (let a = 0; a < 360; a += 3) {
      const th = (a * Math.PI) / 180;
      for (let k = 0.05; k < 0.95; k += 0.1) {
        const r = innerRadius(th) + (outerRadius(th) - innerRadius(th)) * k;
        const x = Math.cos(th) * r;
        const z = Math.sin(th) * r;
        const top = shape.surface(x, z);
        const fx = Math.floor(x / FINE);
        const fz = Math.floor(z / FINE);
        // Walk down from above the surface: the first solid must be fine, near the top.
        let hit = -1;
        for (let fy = Math.ceil((top + 0.2) / FINE); fy > (top - 0.6) / FINE; fy--) {
          if (t.fine.get(fx, fy, fz)) {
            hit = fy;
            break;
          }
          if (t.coarse.get(Math.floor(x / COARSE), fy >> 2, Math.floor(z / COARSE))) break;
        }
        if (hit < 0) holes++;
      }
    }
    expect(holes).toBe(0);
  });
});
