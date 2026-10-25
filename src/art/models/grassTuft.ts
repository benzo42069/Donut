import { PALETTE_INDEX, hash3 } from '../palette';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * A micro-voxel grass tuft (1/32 m; RF-04's direction): thin 1-voxel blades
 * that lean outward, with a sprinkle-flower bud on some. M2/M3 refine it.
 */
export const TUFT_SIZE = [11, 9, 11] as const;

export function buildGrassTuft(seed = 0, flower = false): VoxelGrid {
  const grid = new VoxelGrid();
  const c = (TUFT_SIZE[0] - 1) / 2;
  const blades = 11;
  for (let b = 0; b < blades; b++) {
    const a = (b / blades) * Math.PI * 2 + hash3(b, seed, 0, 5);
    const lean = 0.35 + hash3(b, seed, 1, 5) * 0.45;
    const h = 4 + Math.floor(hash3(b, seed, 2, 5) * 4);
    const color = hash3(b, seed, 3, 5) > 0.55 ? PALETTE_INDEX.grassDeep : PALETTE_INDEX.grassMint;
    for (let y = 0; y < h; y++) {
      const t = y * lean;
      const x = Math.round(c + Math.cos(a) * t * 0.9);
      const z = Math.round(c + Math.sin(a) * t * 0.9);
      grid.set(x, y, z, color);
    }
  }
  if (flower) {
    const petals = [
      PALETTE_INDEX.sprinkleViolet,
      PALETTE_INDEX.sprinkleYellow,
      PALETTE_INDEX.sprinkleRed,
    ];
    const petal = petals[Math.floor(hash3(seed, 9, 9, 5) * petals.length)] ?? PALETTE_INDEX.butter;
    const top = TUFT_SIZE[1] - 2;
    for (let y = 0; y < top; y++) grid.set(c, y, c, PALETTE_INDEX.grassDeep);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const)
      grid.set(c + dx, top, c + dz, petal);
    grid.set(c, top, c, PALETTE_INDEX.butter);
  }
  grid.takeDirty();
  return grid;
}
