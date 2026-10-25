import { PALETTE_INDEX as P, hash3, type VoxelColorName } from '../palette';
import { fbm3, valueNoise3, voxelize, type Sdf } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';
import { flowerStamp, mushroomStamp, stamp } from './smallProps';

/**
 * The M3 prop library (PLAN M3): trees beyond the sprinkle-ball tree, rocks,
 * fences, flower beds and the Moon Donut. All 1/32 m unless noted; each model's
 * base center is at (size.x / 2, 0, size.z / 2).
 */

/** Smooth minimum (polynomial), for organic blobs. */
const smin = (a: number, b: number, k: number): number => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

// ---------------------------------------------------------------------------
// Donut tree (GAME_DESIGN §5): bump the trunk and donuts drop like apples.

export const DONUT_TREE_SIZE = [110, 140, 110] as const;

const HANGING: [VoxelColorName, VoxelColorName][] = [
  ['frostingPinkLight', 'frostingPink'],
  ['chocolate', 'chocolateDark'],
  ['classicGlaze', 'classicGlazeThin'],
  ['pastelMint', 'pastelSky'],
];

export function buildDonutTree(seed: number): VoxelGrid {
  const grid = new VoxelGrid();
  const [sx, sy, sz] = DONUT_TREE_SIZE;
  const cx = sx / 2;
  const cz = sz / 2;
  const crownY = 92;
  // A broad, flattened canopy of a few blobs: an umbrella the donuts hang under.
  const blobs: [number, number, number, number][] = [[0, 4, 0, 30]];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + hash3(seed, i, 1, 3) * 0.6;
    blobs.push([Math.cos(a) * 24, (hash3(seed, i, 2, 3) - 0.3) * 8, Math.sin(a) * 24, 17]);
  }
  const crown: Sdf = (x, y, z) => {
    let d = 1e9;
    for (const [bx, by, bz, br] of blobs)
      d = smin(d, Math.hypot(x - bx, (y - by) * 1.35, z - bz) - br, 8);
    return d + (fbm3(x / 6 + seed, y / 6, z / 6, 2, 5) - 0.5) * 3.5;
  };
  // Donuts hanging from short stems under the canopy rim.
  const hangers: { sdf: Sdf; y: number; stem: Sdf; colors: [VoxelColorName, VoxelColorName] }[] =
    [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.4 + hash3(seed, i, 4, 3) * 0.4;
    const r = 26 + hash3(seed, i, 5, 3) * 8;
    const hx = Math.cos(a) * r;
    const hz = Math.sin(a) * r;
    const hy = -18 - hash3(seed, i, 6, 3) * 7;
    const colors =
      HANGING[(i + seed) % HANGING.length] ??
      (['frostingPinkLight', 'frostingPink'] as [VoxelColorName, VoxelColorName]);
    hangers.push({
      // Hanging upright (rotated into the XY plane, facing outward).
      sdf: (x, y, z) => {
        const px = x - hx;
        const py = y - hy;
        const pz = z - hz;
        const u = px * Math.cos(a) + pz * Math.sin(a);
        const v = -px * Math.sin(a) + pz * Math.cos(a);
        return Math.hypot(Math.hypot(v, py) - 6, u) - 3.3;
      },
      y: hy,
      stem: (x, y, z) => (y < hy + 7 || y > hy + 22 ? 1e9 : Math.hypot(x - hx, z - hz) - 0.9),
      colors,
    });
  }
  // Trunk: a stout, twisting dough trunk that flares into roots.
  const trunk: Sdf = (x, y, z) => {
    if (y > crownY) return 1e9;
    const t = y / crownY;
    const wob = Math.sin(t * 3 + seed) * 2.5;
    const r = 6.2 - t * 2 + Math.max(0, 6 - y) * 1.1;
    return Math.hypot(x - wob, z - wob * 0.4) - r;
  };
  voxelize(
    grid,
    (x, y, z) => {
      const px = x - cx;
      const pz = z - cz;
      let d = Math.min(crown(px, y - crownY, pz), trunk(px, y, pz));
      for (const h of hangers)
        d = Math.min(d, h.sdf(px, y - crownY, pz), h.stem(px, y - crownY, pz));
      return d;
    },
    [0, 0, 0],
    [sx, sy, sz],
    (x, y, z) => {
      const px = x + 0.5 - cx;
      const py = y + 0.5 - crownY;
      const pz = z + 0.5 - cz;
      for (const h of hangers) {
        if (h.sdf(px, py, pz) <= 0) {
          // Frosting on the outer half of each hanging donut, dough inside.
          const top = h.sdf(px, py, pz) > -1.8 && Math.abs(py - h.y) < 4;
          return top ? P[h.colors[hash3(x, y, z, 7) > 0.8 ? 1 : 0]] : P.doughGolden;
        }
        if (h.stem(px, py, pz) <= 0) return P.woodDark;
      }
      if (crown(px, py, pz) <= 0) {
        const k = py / 40 + (hash3(x, y, z, seed + 3) - 0.5) * 0.5;
        return k < -0.35 ? P.leafDeep : k < 0.2 ? P.leafGreen : P.leafMint;
      }
      const band = (y + Math.sin((x + z) * 0.35) * 1.5) % 8;
      return band < 1.2 ? P.woodDark : hash3(x, y, z, 3) > 0.85 ? P.woodLight : P.wood;
    },
  );
  grid.takeDirty();
  return grid;
}

// ---------------------------------------------------------------------------
// Candy-floss tree: puffs of spun sugar on a twisted cruller trunk.

export const FLOSS_TREE_SIZE = [96, 150, 96] as const;

export function buildFlossTree(seed: number): VoxelGrid {
  const grid = new VoxelGrid();
  const [sx, sy, sz] = FLOSS_TREE_SIZE;
  const cx = sx / 2;
  const cz = sz / 2;
  const puffs: [number, number, number, number, VoxelColorName][] = [
    [0, 112, 0, 22, 'flossPink'],
    [-14, 96, 8, 16, 'flossBlue'],
    [15, 98, -6, 15, 'flossPink'],
    [4, 92, 15, 13, 'flossBlue'],
  ];
  const puff = (x: number, y: number, z: number): [number, VoxelColorName] => {
    let d = 1e9;
    let col: VoxelColorName = 'flossPink';
    for (const [bx, by, bz, br, c] of puffs) {
      const di = Math.hypot(x - bx, (y - by) * 1.1, z - bz) - br;
      if (di < d) col = c;
      d = smin(d, di, 5);
    }
    // Wispy, fibrous surface.
    return [d + (fbm3(x / 4 + seed, y / 4, z / 4, 3, 9) - 0.5) * 4.5, col];
  };
  // Cruller trunk: two strands twisted around each other.
  const strand = (x: number, y: number, z: number, phase: number): number => {
    if (y > 96) return 1e9;
    const a = y * 0.11 + phase;
    const r = 3.4 + Math.max(0, 5 - y) * 0.8;
    return Math.hypot(x - Math.cos(a) * 2.8, z - Math.sin(a) * 2.8) - r;
  };
  voxelize(
    grid,
    (x, y, z) => {
      const px = x - cx;
      const pz = z - cz;
      return Math.min(puff(px, y, pz)[0], strand(px, y, pz, 0), strand(px, y, pz, Math.PI));
    },
    [0, 0, 0],
    [sx, sy, sz],
    (x, y, z) => {
      const px = x + 0.5 - cx;
      const py = y + 0.5;
      const pz = z + 0.5 - cz;
      const [d, col] = puff(px, py, pz);
      if (d <= 0) return P[col];
      const a = strand(px, py, pz, 0) < strand(px, py, pz, Math.PI);
      return a ? P.doughGolden : P.doughToasted;
    },
  );
  grid.takeDirty();
  return grid;
}

// ---------------------------------------------------------------------------
// Rocks: a rock-candy crystal cluster and a sugar-dusted gingerbread boulder.

export const ROCK_SIZE = [56, 52, 56] as const;

export function buildRockCandy(seed: number): VoxelGrid {
  const grid = new VoxelGrid();
  const [sx, sy, sz] = ROCK_SIZE;
  const cx = sx / 2;
  const cz = sz / 2;
  // Hexagonal prisms leaning out of a common root.
  const crystals: { dir: [number, number, number]; len: number; r: number; c: VoxelColorName }[] =
    [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + hash3(seed, i, 1, 5);
    const lean = i === 0 ? 0 : 0.35 + hash3(seed, i, 2, 5) * 0.35;
    crystals.push({
      dir: [Math.cos(a) * Math.sin(lean), Math.cos(lean), Math.sin(a) * Math.sin(lean)],
      len: i === 0 ? 40 : 18 + hash3(seed, i, 3, 5) * 16,
      r: i === 0 ? 7.5 : 4.5 + hash3(seed, i, 4, 5) * 2.5,
      c: i % 2 ? 'crystalMint' : 'crystalLilac',
    });
  }
  const crystal = (x: number, y: number, z: number): [number, VoxelColorName] => {
    let best = 1e9;
    let col: VoxelColorName = 'crystalLilac';
    for (const k of crystals) {
      const [dx, dy, dz] = k.dir;
      const along = x * dx + y * dy + z * dz;
      const ax = x - dx * along;
      const ay = y - dy * along;
      const az = z - dz * along;
      const radial = Math.hypot(ax, ay, az);
      // A hexagonal-ish cross section and a pointed tip.
      const ang = Math.atan2(az, ax);
      const hex = k.r * (0.92 + 0.08 * Math.cos(ang * 6));
      const tip = Math.max(0, along - (k.len - k.r * 1.4));
      const d = Math.max(radial - hex + tip * 0.75, -along, along - k.len);
      if (d < best) {
        best = d;
        col = k.c;
      }
    }
    return [best, col];
  };
  voxelize(
    grid,
    (x, y, z) => crystal(x - cx, y, z - cz)[0],
    [0, 0, 0],
    [sx, sy, sz],
    (x, y, z) => P[crystal(x + 0.5 - cx, y + 0.5, z + 0.5 - cz)[1]],
  );
  grid.takeDirty();
  return grid;
}

export function buildGingerRock(seed: number): VoxelGrid {
  const grid = new VoxelGrid();
  const [sx, sy, sz] = ROCK_SIZE;
  const cx = sx / 2;
  const cz = sz / 2;
  const rock: Sdf = (x, y, z) => {
    const d = Math.hypot(x / 24, (y - 12) / 18, z / 20) - 1;
    const n = fbm3(x / 9 + seed, y / 9, z / 9, 3, 11) - 0.5;
    // Flat cleaved facets: quantized noise, crisp ledges like the M2 crag.
    return d * 18 + n * 9 + Math.max(0, -y);
  };
  voxelize(
    grid,
    (x, y, z) => rock(x - cx, y, z - cz),
    [0, 0, 0],
    [sx, sy, sz],
    (x, y, z) => {
      const top = rock(x + 0.5 - cx, y + 1.5, z + 0.5 - cz) > 0;
      if (top && y > 18 && valueNoise3(x * 0.2, y * 0.2, z * 0.2, seed) > 0.35)
        return P.powderedSugar;
      return hash3(x, y, z, seed) > 0.6 ? P.gingerCragDark : P.gingerCrag;
    },
  );
  grid.takeDirty();
  return grid;
}

// ---------------------------------------------------------------------------
// Fence: candy-cane posts joined by wafer rails.

export const FENCE_HEIGHT = 34;

/** A fence run of `posts` posts, 28 voxels apart, along +x (z depth 8). */
export function fenceSize(posts: number): [number, number, number] {
  return [(posts - 1) * 28 + 8, FENCE_HEIGHT + 6, 8];
}

export function buildFence(posts: number, seed = 0): VoxelGrid {
  const grid = new VoxelGrid();
  const [sx, sy, sz] = fenceSize(posts);
  const pc = 3.5;
  voxelize(
    grid,
    (x, y, z) => {
      const k = Math.round((x - 4) / 28);
      const px = x - (4 + k * 28);
      // Posts: round candy sticks with a little hook on top.
      let d = Math.hypot(px, z - 4) - 2.6;
      d = Math.max(d, y - FENCE_HEIGHT);
      const hook = Math.abs(Math.hypot(px - 3, y - FENCE_HEIGHT) - 3) - 1.3;
      d = Math.min(d, y > FENCE_HEIGHT ? Math.max(hook, -px, Math.hypot(0, z - 4) - 1.4) : 1e9);
      // Two wafer rails.
      for (const ry of [12, 25])
        d = Math.min(d, Math.max(Math.abs(y - ry) - 2.5, Math.abs(z - pc - 0.5) - 1.5));
      return Math.max(d, -x, x - sx);
    },
    [0, 0, 0],
    [sx, sy, sz],
    (x, y, z) => {
      const k = Math.round((x - 4) / 28);
      const px = x + 0.5 - (4 + k * 28);
      if (Math.hypot(px, z + 0.5 - 4) < 3.2 || y >= FENCE_HEIGHT) {
        // Spiral candy stripes.
        const a = Math.atan2(z + 0.5 - 4, px) / (Math.PI * 2);
        return ((y + a * 10) / 5) % 2 < 1 ? P.towerRed : P.towerCream;
      }
      // Wafer grid: golden with toasted score lines.
      if ((x + seed) % 5 === 0 || y % 4 === 0) return P.doughToasted;
      return P.doughGolden;
    },
  );
  grid.takeDirty();
  return grid;
}

// ---------------------------------------------------------------------------
// A small flower bed: grass, sprinkle flowers and a mushroom on a dough tile.

export const BED_SIZE = [40, 18, 40] as const;

export function buildFlowerBed(seed: number): VoxelGrid {
  const grid = new VoxelGrid();
  const [sx, , sz] = BED_SIZE;
  const c = sx / 2;
  // A low, rounded mound of meadow.
  grid.generate(0, 0, 0, sx, 6, sz, (x, y, z) => {
    const r = Math.hypot(x + 0.5 - c, z + 0.5 - c);
    const h = 4 * Math.sqrt(Math.max(0, 1 - (r / 19) ** 2));
    if (y >= h) return 0;
    if (y >= h - 1) return hash3(x, y, z, seed) > 0.6 ? P.grassDeep : P.grassMint;
    return P.doughToasted;
  });
  const top = (x: number, z: number): number => {
    let y = 6;
    while (y > 0 && grid.get(x, y, z) === 0) y--;
    return y + 1;
  };
  for (let i = 0; i < 26; i++) {
    const a = hash3(i, seed, 1, 9) * Math.PI * 2;
    const r = Math.sqrt(hash3(i, seed, 2, 9)) * 15;
    const x = Math.round(c + Math.cos(a) * r);
    const z = Math.round(c + Math.sin(a) * r);
    stamp(grid, flowerStamp(i * 17 + seed), x, top(x, z), z);
  }
  stamp(grid, mushroomStamp(seed, 1.1), c - 6, top(c - 6, c + 4), c + 4);
  stamp(grid, mushroomStamp(seed + 3, 0.8), c + 7, top(c + 7, c - 5), c - 5);
  grid.takeDirty();
  return grid;
}

// ---------------------------------------------------------------------------
// The Moon Donut (GAME_DESIGN §9): the glowing glazed donut on the lighthouse,
// a 1/64 m close-up hero asset (art bible §3), standing upright, facing ±z.

export const MOON_VOXEL = 1 / 64;
export const MOON_SIZE = [72, 72, 34] as const;

export function buildMoonDonut(seed = 0): VoxelGrid {
  const grid = new VoxelGrid();
  const [sx, sy, sz] = MOON_SIZE;
  const c = [sx / 2, sy / 2, sz / 2] as const;
  const R = 22;
  const r = 13;
  // Ring in the XY plane (the hole faces ±z).
  const body: Sdf = (x, y, z) => Math.hypot(Math.hypot(x, y) - R, z) - r;
  voxelize(
    grid,
    (x, y, z) => body(x - c[0], y - c[1], z - c[2]),
    [0, 0, 0],
    [sx, sy, sz],
    (x, y, z) => {
      const px = x + 0.5 - c[0];
      const py = y + 0.5 - c[1];
      const pz = z + 0.5 - c[2];
      // Glowing glaze on both faces; a golden dough band around the waist.
      const inner = body(px, py, pz) < -3.2;
      if (Math.abs(pz) < 4.5 && !inner) {
        return hash3(x, y, z, seed) > 0.85 ? P.doughToasted : P.doughGolden;
      }
      if (inner) return P.doughGolden;
      // Golden sprinkles set into the glaze (the Golden Sprinkles' home).
      const g = hash3(x >> 1, y >> 1, z, seed + 9);
      return g > 0.94 ? P.goldSprinkle : P.moonGlaze;
    },
  );
  grid.takeDirty();
  return grid;
}
