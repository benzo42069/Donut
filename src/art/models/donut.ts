import { PALETTE_INDEX, hash3, type VoxelColorName } from '../palette';
import { fbm3, torus, voxelize } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * A wild donut at hero-prop scale (1/32 m, about 20 voxels across; art bible §3):
 * a dough torus with a pale baked band, a frosting cap that drips over the
 * edge, and 1×1×3 sprinkles on top. M3 replaces this with the full flavor set.
 */
export type DonutFlavor = 'strawberry' | 'chocolate' | 'glazed';

const FROSTING: Record<DonutFlavor, [VoxelColorName, VoxelColorName]> = {
  strawberry: ['frostingPinkLight', 'frostingPink'],
  chocolate: ['chocolate', 'chocolateDark'],
  glazed: ['classicGlaze', 'classicGlaze'],
};

const SPRINKLES: VoxelColorName[] = [
  'sprinkleRed',
  'sprinkleOrange',
  'sprinkleYellow',
  'sprinkleGreen',
  'sprinkleBlue',
  'sprinkleViolet',
];

/** Model size in voxels (x, y, z); the donut's base sits at y = 0. */
export const DONUT_SIZE = [22, 12, 22] as const;

export function buildDonut(flavor: DonutFlavor, seed = 0): VoxelGrid {
  const grid = new VoxelGrid();
  const R = 6.4;
  const r = 3.7;
  const cx = DONUT_SIZE[0] / 2;
  const cy = r + 0.2;
  const cz = DONUT_SIZE[2] / 2;
  const dough = torus(R, r);
  const frost = torus(R, r + 0.85);
  const [top, under] = FROSTING[flavor];

  // Drip line: frosting reaches below the equator in wobbly tongues.
  const dripLine = (x: number, z: number): number => {
    const a = Math.atan2(z, x);
    const n = fbm3(Math.cos(a) * 2.2 + seed, Math.sin(a) * 2.2, seed * 0.37, 3, 41);
    const tongue = Math.pow(Math.max(0, n - 0.45) * 2.4, 1.6);
    return 0.6 - tongue * 3.4;
  };

  voxelize(
    grid,
    (x, y, z) => frost(x - cx, y - cy, z - cz),
    [0, 0, 0],
    DONUT_SIZE,
    (x, y, z) => {
      const px = x + 0.5 - cx;
      const py = y + 0.5 - cy;
      const pz = z + 0.5 - cz;
      const inDough = dough(px, py, pz) <= 0;
      if (py > dripLine(px, pz)) {
        return PALETTE_INDEX[py > r - 0.6 || !inDough ? top : under];
      }
      if (!inDough) return 0;
      // Pale baked band around the equator, toasted bottom.
      const ring = Math.hypot(px, pz);
      if (py < -r + 1.4) return PALETTE_INDEX.doughToasted;
      if (Math.abs(py + 0.4) < 0.9 && ring > R + 1) return PALETTE_INDEX.doughCrumb;
      return PALETTE_INDEX.doughGolden;
    },
  );

  if (flavor !== 'glazed') {
    // Sprinkles: 1×1×3 capsules lying on the top surface, 90° steps (art bible §5).
    for (let i = 0; i < 40; i++) {
      const a = hash3(i, seed, 1, 23) * Math.PI * 2;
      const rad = R + (hash3(i, seed, 2, 23) * 2 - 1) * (r - 0.8);
      const x = Math.floor(cx + Math.cos(a) * rad);
      const z = Math.floor(cz + Math.sin(a) * rad);
      let y = DONUT_SIZE[1] - 1;
      while (y > 0 && grid.get(x, y, z) === 0) y--;
      if (y === 0) continue;
      const color = PALETTE_INDEX[SPRINKLES[i % SPRINKLES.length] ?? 'sprinkleRed'];
      const alongX = hash3(i, seed, 3, 23) > 0.5;
      for (let k = 0; k < 3; k++) {
        const sx = x + (alongX ? k - 1 : 0);
        const sz = z + (alongX ? 0 : k - 1);
        if (grid.get(sx, y, sz) !== 0) grid.set(sx, y + 1, sz, color);
      }
    }
  }
  grid.takeDirty();
  return grid;
}
