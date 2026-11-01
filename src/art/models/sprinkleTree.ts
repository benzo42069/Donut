import { PALETTE_INDEX, hash3, type VoxelColorName } from '../palette';
import { fbm3, voxelize } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * Sprinkle-ball tree (RF-06, reference 01): a short, gently curving dough-bark
 * trunk under a lumpy ball of glossy frosting foliage studded with sprinkles.
 * 1/32 m voxels at `res` 1; `res` 2 builds the same tree at 1/64 m (the play
 * camera comes close enough that 1/32 m canopies read as Lego, art bible §3),
 * with sprinkles half the size and four times as many. The base center of the
 * trunk is at (size·res/2, 0, size·res/2).
 */
export const TREE_SIZE = [100, 132, 100] as const;

export type TreeLeaf = 'green' | 'mint' | 'pink';

const LEAVES: Record<TreeLeaf, [VoxelColorName, VoxelColorName, VoxelColorName]> = {
  green: ['leafGreen', 'leafDeep', 'leafMint'],
  mint: ['leafMint', 'leafGreen', 'grassLight'],
  pink: ['canopyPinkLight', 'canopyPink', 'canopyPinkShadow'],
};

// Relaxed sprinkle colors: the canopy is relaxed, and crisp inlays would be
// pinned on the lattice and poke out of its silhouette.
const SPRINKLES: VoxelColorName[] = [
  'canopySprinkleRed',
  'canopySprinkleOrange',
  'canopySprinkleYellow',
  'canopySprinkleBlue',
  'canopySprinkleViolet',
  'frostingPinkLight',
];

export function buildSprinkleTree(seed: number, leaf: TreeLeaf, height = 1, res = 1): VoxelGrid {
  const grid = new VoxelGrid();
  const cx = TREE_SIZE[0] / 2;
  const cz = TREE_SIZE[2] / 2;
  // Fine-grid coordinates → the 1/32 m design space the shapes are written in.
  const q = 1 / res;
  const crownY = 78 * height;
  const crownR = 29 + hash3(seed, 1, 1, 9) * 5;
  const lean = (hash3(seed, 2, 1, 9) - 0.5) * 6;

  // Crown: a few overlapping blobs, smooth-unioned, with a lumpy surface.
  const blobs: [number, number, number, number][] = [[0, 0, 0, crownR]];
  for (let i = 0; i < 4; i++) {
    const a = hash3(seed, i, 3, 9) * Math.PI * 2;
    const d = crownR * (0.45 + hash3(seed, i, 4, 9) * 0.2);
    blobs.push([
      Math.cos(a) * d,
      (hash3(seed, i, 5, 9) - 0.6) * crownR * 0.5,
      Math.sin(a) * d,
      crownR * (0.55 + hash3(seed, i, 6, 9) * 0.15),
    ]);
  }
  const crown = (x: number, y: number, z: number): number => {
    let res = 1e9;
    for (const [bx, by, bz, br] of blobs) {
      const d = Math.hypot(x - bx, y - by, z - bz) - br;
      // Polynomial smooth min.
      const h = Math.max(6 - Math.abs(res - d), 0) / 6;
      res = Math.min(res, d) - h * h * 6 * 0.25;
    }
    return res + (fbm3(x / 7 + seed, y / 7, z / 7, 2, 13) - 0.5) * 4;
  };

  // Trunk: tapered, gently curving, flaring into roots at the base.
  const trunkAt = (y: number): [number, number, number] => {
    const t = y / crownY;
    return [
      cx + lean * t * t,
      cz + lean * 0.5 * Math.sin(t * 2),
      5.4 - t * 1.8 + Math.max(0, 4 - y) * 1.1,
    ];
  };

  const [leafA, leafB, leafC] = LEAVES[leaf];
  voxelize(
    grid,
    (fx, fy, fz) => {
      const x = fx * q;
      const y = fy * q;
      const z = fz * q;
      const c = crown(x - cx - lean, y - crownY, z - cz);
      if (y > crownY + 4) return c * res;
      const [tx, tz, tr] = trunkAt(Math.max(0, y));
      const trunk = Math.hypot(x - tx, z - tz) - tr;
      return Math.min(c, trunk) * res;
    },
    [0, 0, 0],
    [TREE_SIZE[0] * res, TREE_SIZE[1] * res, TREE_SIZE[2] * res],
    (x, y, z) => {
      const px = (x + 0.5) * q - cx - lean;
      const py = (y + 0.5) * q - crownY;
      const pz = (z + 0.5) * q - cz;
      if (crown(px, py, pz) <= 0) {
        const h = hash3(x, y, z, seed + 31);
        if (leaf === 'pink') {
          // Frosted crown: fine per-voxel grain darkening toward the underside,
          // never big patches (two-tone blotches read as camouflage).
          // The fine (play) build shades more strongly top to bottom with less
          // grain, so the ball reads as a lit form, not a checker.
          const k = res > 1 ? py / 30 + (h - 0.5) * 0.3 : py / 60 + (h - 0.5) * 0.9;
          return PALETTE_INDEX[
            k < (res > 1 ? -0.85 : -0.55) ? leafC : k < (res > 1 ? -0.35 : 0.05) ? leafB : leafA
          ];
        }
        const n = fbm3((x * q) / 9 + seed * 3, (y * q) / 9, (z * q) / 9, 2, 17);
        if (h > 0.975) return PALETTE_INDEX[leafC];
        // Darker underside, lighter crown top.
        // Soft, dithered shading split (no hard two-tone band).
        const k = n + py / 110 + (hash3(x, y, z, seed + 37) - 0.5) * 0.18;
        return PALETTE_INDEX[k < 0.4 ? leafB : leafA];
      }
      const band = (y * q + Math.sin((x + z) * q * 0.4) * 1.5) % 7;
      return band < 1.2
        ? PALETTE_INDEX.woodDark
        : hash3(x, y, z, 3) > 0.8
          ? PALETTE_INDEX.woodLight
          : PALETTE_INDEX.wood;
    },
  );

  // Sprinkles stuck all over the crown: 1×1×3 capsules lying on the surface.
  let placed = 0;
  // Directions on a jittered Fibonacci sphere: evenly scattered, no bands.
  const want = (res > 1 ? 1100 : 480) * res * res;
  const tries = Math.round(want * 2.6);
  for (let i = 0; i < tries && placed < want; i++) {
    const u = 1 - (2 * (i + 0.2 + 0.6 * hash3(i, seed, 1, 47))) / tries;
    const phi = i * 2.399963 + (hash3(i, seed, 2, 47) - 0.5) * 0.8;
    if (u < -0.45) continue; // not under the crown
    const s = Math.sqrt(1 - u * u);
    const dir = [Math.cos(phi) * s, u, Math.sin(phi) * s] as const;
    // March inward from outside to the surface.
    let x = 0;
    let y = 0;
    let z = 0;
    let found = false;
    for (let d = crownR * 1.9 * res; d > 0; d -= 0.5) {
      x = Math.floor((cx + lean) * res + dir[0] * d);
      y = Math.floor(crownY * res + dir[1] * d);
      z = Math.floor(cz * res + dir[2] * d);
      if (grid.get(x, y, z) !== 0) {
        found = true;
        break;
      }
    }
    if (!found) continue;
    // Step back out to the empty cell above the surface along the dominant axis.
    const ax =
      Math.abs(dir[0]) > Math.abs(dir[1]) && Math.abs(dir[0]) > Math.abs(dir[2])
        ? 0
        : Math.abs(dir[1]) > Math.abs(dir[2])
          ? 1
          : 2;
    const step = [0, 0, 0];
    step[ax] = Math.sign(dir[ax] ?? 1);
    // Lay the capsule along one of the two axes tangent to the surface.
    const along = (ax + 1 + (hash3(i, seed, 3, 47) > 0.5 ? 1 : 0)) % 3;
    const color = PALETTE_INDEX[SPRINKLES[(i * 5 + seed) % SPRINKLES.length] ?? 'sprinkleRed'];
    // Inlaid flush: recolor three exposed crown voxels in a row (never stand off it).
    const cells: [number, number, number][] = [-1, 0, 1].map((k) => [
      x + (along === 0 ? k : 0),
      y + (along === 1 ? k : 0),
      z + (along === 2 ? k : 0),
    ]);
    const sx = step[0] ?? 0;
    const sy = step[1] ?? 0;
    const sz = step[2] ?? 0;
    const leafIds = new Set([PALETTE_INDEX[leafA], PALETTE_INDEX[leafB], PALETTE_INDEX[leafC]]);
    if (
      cells.some(
        ([a, b, c]) => !leafIds.has(grid.get(a, b, c)) || grid.get(a + sx, b + sy, c + sz) !== 0,
      )
    )
      continue;
    for (const [a, b, c] of cells) grid.set(a, b, c, color);
    placed++;
  }

  grid.takeDirty();
  return grid;
}
