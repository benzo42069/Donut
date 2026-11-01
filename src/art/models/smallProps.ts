import { PALETTE_INDEX as P, hash3, type VoxelColorName } from '../palette';
import { fbm3, voxelize } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * Small diorama props. Flowers and mushrooms are 1/32 m stamps written straight
 * into the fine terrain grid (so they share its mesh and baked contact AO);
 * clouds are separate 1/16 m models (RF-03: finer than the reference's clouds).
 */

/** A voxel stamp: cells relative to the base center, plus their colors. */
export type Stamp = [number, number, number, number][];

const PETALS: VoxelColorName[] = [
  'sprinkleRed',
  'sprinkleYellow',
  'sprinkleBlue',
  'sprinkleViolet',
  'frostingPinkLight',
  'candyCream',
  'butter',
  'lavender',
  'sprinkleOrange',
];

/** Sprinkle flower: a 2–4 voxel stem and a plus-shaped bloom (RF-04 scale). */
export function flowerStamp(seed: number): Stamp {
  const h = 2 + Math.floor(hash3(seed, 1, 0, 3) * 3);
  const petal = P[PETALS[Math.floor(hash3(seed, 2, 0, 3) * PETALS.length)] ?? 'butter'];
  const center = hash3(seed, 3, 0, 3) > 0.5 ? P.butter : P.sprinkleOrange;
  const cells: Stamp = [];
  for (let y = 0; y < h; y++) cells.push([0, y, 0, P.grassDeep]);
  // Most blooms are a single bead (small at any distance); a few are crosses.
  if (hash3(seed, 6, 0, 3) < 0.25) {
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const)
      cells.push([dx, h, dz, petal]);
    cells.push([0, h, 0, petal === P.butter ? P.sprinkleOrange : center]);
  } else {
    cells.push([0, h, 0, petal]);
  }
  // A leaf on some stems.
  if (h > 2 && hash3(seed, 4, 0, 3) > 0.4)
    cells.push([hash3(seed, 5, 0, 3) > 0.5 ? 1 : -1, 1, 0, P.grassMint]);
  return cells;
}

/** Lavender-cap mushroom with a cream stem and pale spots. */
export function mushroomStamp(seed: number, scale = 1): Stamp {
  const cells: Stamp = [];
  const stemH = Math.round((4 + hash3(seed, 1, 0, 9) * 3) * scale);
  const capR = (3.2 + hash3(seed, 2, 0, 9) * 1.5) * scale;
  const stemR = 1.2 * scale;
  const R = Math.ceil(capR) + 1;
  for (let y = 0; y < stemH + capR + 1; y++)
    for (let x = -R; x <= R; x++)
      for (let z = -R; z <= R; z++) {
        const px = x;
        const pz = z;
        if (y < stemH) {
          if (Math.hypot(px, pz) <= stemR) cells.push([x, y, z, P.candyCream]);
          continue;
        }
        const dy = y - stemH;
        const r = Math.hypot(px, pz);
        // Dome cap.
        if (Math.hypot(r / capR, dy / (capR * 0.75)) <= 1) {
          const spot = hash3(x, y, z, seed + 3) > 0.84 && dy > 0;
          cells.push([x, y, z, spot ? P.candyCream : dy < 1 ? P.lavenderDeep : P.lavender]);
        }
      }
  return cells;
}

/** Writes a stamp into a grid at an integer position (only into empty cells). */
export function stamp(grid: VoxelGrid, s: Stamp, x: number, y: number, z: number): void {
  for (const [dx, dy, dz, v] of s)
    if (grid.get(x + dx, y + dy, z + dz) === 0) grid.set(x + dx, y + dy, z + dz, v);
}

/** Puffy cloud at 1/16 m: a cluster of soft blobs with a flattened, shaded base. */
export const CLOUD_SIZE = [120, 56, 80] as const;

export function buildCloud(seed: number, size = 1): VoxelGrid {
  const grid = new VoxelGrid();
  const blobs: [number, number, number, number][] = [];
  const n = 5 + Math.floor(hash3(seed, 0, 0, 5) * 3);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) - 0.5;
    const r = (12 + hash3(seed, i, 1, 5) * 8) * size * (1 - Math.abs(t) * 0.7);
    blobs.push([
      60 + t * 80 * size,
      14 + r * 0.6 + hash3(seed, i, 2, 5) * 4,
      40 + (hash3(seed, i, 3, 5) - 0.5) * 18 * size,
      r,
    ]);
  }
  const sdf = (x: number, y: number, z: number): number => {
    let d = 1e9;
    for (const [bx, by, bz, br] of blobs) {
      const di = Math.hypot(x - bx, (y - by) * 1.1, z - bz) - br;
      const h = Math.max(7 - Math.abs(d - di), 0) / 7;
      d = Math.min(d, di) - h * h * 7 * 0.25;
    }
    // Flat-ish base.
    d = Math.max(d, 10 - y);
    return d + (fbm3(x / 9 + seed, y / 9, z / 9, 2, 3) - 0.5) * 5;
  };
  voxelize(grid, sdf, [0, 0, 0], CLOUD_SIZE, (x, y, z) => {
    const shade = y + (fbm3(x / 6, y / 6, z / 6 + seed, 2, 7) - 0.5) * 8;
    return shade < 17 ? P.cloudShade : P.cloud;
  });
  grid.takeDirty();
  return grid;
}

/** A steam puff (1/32 m): a lumpy little ball. */
export function buildSteamPuff(seed: number, radius: number): VoxelGrid {
  const grid = new VoxelGrid();
  const s = Math.ceil(radius * 2 + 4);
  const c = s / 2;
  voxelize(
    grid,
    (x, y, z) =>
      Math.hypot(x - c, y - c, z - c) -
      radius +
      (fbm3(x / 3 + seed, y / 3, z / 3, 2, 9) - 0.5) * 2.5,
    [0, 0, 0],
    [s, s, s],
    () => P.steam,
  );
  grid.takeDirty();
  return grid;
}
