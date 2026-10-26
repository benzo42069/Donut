import { PALETTE_INDEX, hash3, type VoxelColorName } from '../palette';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * Grass for the camera's near field (RF-04). Out in the meadow, grass is 1/32 m
 * voxel blades baked into the terrain skin; within a few meters of a close-up
 * subject it is these instanced 1/64 m tufts and flowers instead, so blades
 * stay hair-thin next to a 1/64 m donut (art bible §3 density rule).
 */
export const FINE_DECOR_VOXEL = 1 / 64;

/** A tuft of thin blades that lean outward in steps (base center at (8, 0, 8)). */
export const TUFT_SIZE = [17, 12, 17] as const;

export function buildGrassTuft(seed = 0, flower = false): VoxelGrid {
  const grid = new VoxelGrid();
  const c = 8;
  const blades = 5 + Math.floor(hash3(seed, 0, 0, 5) * 3);
  for (let b = 0; b < blades; b++) {
    const a = (b / blades) * Math.PI * 2 + hash3(b, seed, 0, 5) * 1.2;
    const h = 4 + Math.floor(hash3(b, seed, 2, 5) * 6);
    const lean = 0.25 + hash3(b, seed, 1, 5) * 0.35;
    const x0 = c + Math.round(Math.cos(a) * 1.2);
    const z0 = c + Math.round(Math.sin(a) * 1.2);
    for (let y = 0; y < h; y++) {
      const t = y * lean;
      const x = Math.round(x0 + Math.cos(a) * t);
      const z = Math.round(z0 + Math.sin(a) * t);
      const k = y / h;
      const color =
        k > 0.7
          ? PALETTE_INDEX.grassLight
          : k > 0.3
            ? PALETTE_INDEX.grassMint
            : PALETTE_INDEX.grassDeep;
      grid.set(x, y, z, color);
    }
  }
  if (flower) addBloom(grid, seed, c, TUFT_SIZE[1] - 2);
  grid.takeDirty();
  return grid;
}

const PETALS: VoxelColorName[] = [
  'sprinkleRed',
  'sprinkleYellow',
  'sprinkleBlue',
  'sprinkleViolet',
  'frostingPinkLight',
  'candyCream',
  'lavender',
  'sprinkleOrange',
];

/** A stem with a five-petal bloom. */
function addBloom(grid: VoxelGrid, seed: number, c: number, top: number): void {
  const petal = PALETTE_INDEX[PETALS[Math.floor(hash3(seed, 9, 9, 5) * PETALS.length)] ?? 'butter'];
  for (let y = 0; y < top; y++) grid.set(c, y, c, PALETTE_INDEX.grassDeep);
  grid.set(c + 1, 3, c, PALETTE_INDEX.grassMint);
  grid.set(c - 1, 5, c, PALETTE_INDEX.grassMint);
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ] as const) {
    grid.set(c + dx, top, c + dz, petal);
    if (dx === 0 || dz === 0) grid.set(c + dx * 2, top, c + dz * 2, petal);
  }
  grid.set(c, top, c, PALETTE_INDEX.butter);
  grid.set(c, top + 1, c, PALETTE_INDEX.sprinkleOrange);
}
