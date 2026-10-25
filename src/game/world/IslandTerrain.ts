import { PALETTE_INDEX, hash3 } from '../../art/palette';
import { valueNoise3 } from '../../art/sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';
import {
  IslandShape,
  INNER_BASE,
  LAGOON_FLOOR,
  MILK_LEVEL,
  Zone,
  dripBulb,
  dripDepth,
  type Column,
} from './islandShape';

/**
 * Voxelizes the island at two resolutions (art bible §3):
 *
 * - **coarse** (1/8 m): the dough body, outer strata cliffs, underside and
 *   lagoon floor. Big, mostly hidden or seen from afar.
 * - **fine** (1/32 m): a skin over every surface the camera gets close to: the
 *   whole top (meadow, path, frosting rims, hills), the inner lagoon cliffs, and
 *   the frosting coat that drips over the outer cliff (K-02, RF-05). Micro-voxel
 *   grass blades grow out of it (RF-04).
 *
 * Both grids share the world origin, so 4 fine cells tile one coarse cell
 * exactly. The coarse body stops `SKIN` below the top and short of the inner
 * cliff; the fine grid fills exactly the solid space the coarse grid leaves, so
 * the two never overlap and never leave a gap.
 */
export const COARSE = 1 / 8;
export const FINE = 1 / 32;
const RATIO = COARSE / FINE;

/** Half extent of the voxelized square (meters). */
const EXTENT = 13;
const C_N = Math.round((2 * EXTENT) / COARSE);
const C_OFF = C_N / 2;

/** The coarse body stops this far below the surface. */
const SKIN = 0.3;
/** ...and this far behind the inner cliff, above this height. */
const INNER_SKIN = 0.3;
const INNER_SKIN_FLOOR = -0.5;
/** Frosting coat thickness over the outer cliff (outside the continuous radius). */
const COAT_OUT = 0.15;
const COAT_IN = 0.065;
const RIM_ROUND = 0.2;

export interface TerrainOptions {
  /** Fraction of meadow cells with a grass blade. */
  grassDensity: number;
}

export interface IslandTerrain {
  coarse: VoxelGrid;
  fine: VoxelGrid;
  stats: { coarseMs: number; fineMs: number };
}

const P = PALETTE_INDEX;

/** Baked dough strata (K-02): wavy layers of golden, crumb and toasted; crust underneath. */
function doughColor(x: number, y: number, z: number, theta: number, aboveBottom: number): number {
  if (aboveBottom < 0.14) return P.doughCrust;
  if (aboveBottom < 0.45)
    return hash3(Math.floor(x * 16), Math.floor(y * 16), Math.floor(z * 16), 4) > 0.5
      ? P.doughToasted
      : P.doughCrust;
  const wave =
    Math.sin(theta * 7 + y * 0.8) * 0.09 +
    (valueNoise3(x * 0.9, y * 0.4, z * 0.9, 31) - 0.5) * 0.35;
  const b = (y + wave + 8) / 0.62;
  const f = b - Math.floor(b);
  if (f < 0.13) return P.doughToasted;
  if (f < 0.25) return P.doughCrumb;
  if (aboveBottom < 0.9) return P.doughToasted;
  return P.doughGolden;
}

function meadowColor(x: number, z: number): number {
  const patch =
    valueNoise3(x * 0.8, 0, z * 0.8, 17) + (valueNoise3(x * 3, 1, z * 3, 18) - 0.5) * 0.35;
  const h = hash3(Math.floor(x * 32), 0, Math.floor(z * 32), 19);
  if (patch > 0.62 || h > 0.93) return P.grassLight;
  if (patch < 0.27 || h < 0.05) return P.grassDeep;
  return P.grassMint;
}

function surfaceColor(c: Column, x: number, z: number): number {
  switch (c.zone) {
    case Zone.Frosting:
      return P.frostingPinkLight;
    case Zone.Path:
      return hash3(Math.floor(x * 32), 1, Math.floor(z * 32), 23) > 0.86
        ? P.pebble
        : c.zoneDepth < 0.05
          ? P.doughGolden
          : P.doughCrumb;
    case Zone.Sugar:
      return P.powderedSugar;
    case Zone.Rock:
      return hash3(Math.floor(x * 32), 2, Math.floor(z * 32), 29) > 0.8
        ? P.doughToasted
        : P.doughGolden;
    default:
      return meadowColor(x, z);
  }
}

export function buildIslandTerrain(shape: IslandShape, opts: TerrainOptions): IslandTerrain {
  const coarse = new VoxelGrid();
  const fine = new VoxelGrid();

  // Coarse filled ranges per coarse column (voxel y, half-open), two runs each:
  // run A is the main body, run B a lower part under the inner skin.
  const aMin = new Int16Array(C_N * C_N);
  const aMax = new Int16Array(C_N * C_N);
  const t0 = performance.now();

  coarse.generateColumns(-C_OFF, -C_OFF, C_OFF, C_OFF, (ix, iz, put) => {
    const x = (ix + 0.5) * COARSE;
    const z = (iz + 0.5) * COARSE;
    const r = Math.hypot(x, z);
    if (r > EXTENT) return;
    const c = shape.column(x, z);
    const ci = ix + C_OFF + (iz + C_OFF) * C_N;
    if (r > c.ro) return;
    let yTop: number;
    if (r < c.ri) {
      yTop = LAGOON_FLOOR;
    } else {
      yTop = c.top - SKIN;
      if (r < c.ri + INNER_SKIN) yTop = Math.min(yTop, INNER_SKIN_FLOOR);
    }
    const y0 = Math.ceil(c.bottom / COARSE - 0.5);
    const y1 = Math.ceil(yTop / COARSE - 0.5); // centers strictly below yTop
    aMin[ci] = y0;
    aMax[ci] = y1;
    for (let iy = y0; iy < y1; iy++) {
      const y = (iy + 0.5) * COARSE;
      if (r < c.ri && iy === y1 - 1) put(iy, P.milkFloor);
      else put(iy, doughColor(x, y, z, c.theta, y - c.bottom));
    }
  });
  const coarseMs = performance.now() - t0;

  const coarseFilled = (fx: number, fy: number, fz: number): boolean => {
    const cx = (fx >> 2) + C_OFF;
    const cz = (fz >> 2) + C_OFF;
    if (cx < 0 || cz < 0 || cx >= C_N || cz >= C_N) return false;
    const ci = cx + cz * C_N;
    const cy = fy >> 2;
    return cy >= (aMin[ci] ?? 0) && cy < (aMax[ci] ?? 0);
  };

  const t1 = performance.now();
  const F_OFF = C_OFF * RATIO;
  fine.generateColumns(-F_OFF, -F_OFF, F_OFF, F_OFF, (fx, fz, put) => {
    const x = (fx + 0.5) * FINE;
    const z = (fz + 0.5) * FINE;
    const r = Math.hypot(x, z);
    if (r < INNER_BASE - 0.7 || r > EXTENT) return;
    const c = shape.column(x, z);
    const { ri, ro, top, theta } = c;
    if (r < ri - 0.12 || r > ro + COAT_OUT + 0.04) return;

    const dOut = dripDepth(theta * ro, 1, 0.56, 1.9);
    const dIn = dripDepth(theta * ri, 2, 0.22, 1.7);
    // Rim corners: rounded where the frosting coat meets the top.
    const cornerOut = ro + COAT_OUT - RIM_ROUND;
    const cornerIn = ri - COAT_IN + RIM_ROUND;
    let drop = 0;
    if (r > cornerOut) {
      const d = Math.min(RIM_ROUND, r - cornerOut);
      drop = RIM_ROUND - Math.sqrt(RIM_ROUND * RIM_ROUND - d * d);
    } else if (r < cornerIn) {
      const d = Math.min(RIM_ROUND, cornerIn - r);
      drop = RIM_ROUND - Math.sqrt(RIM_ROUND * RIM_ROUND - d * d);
    }
    const surf = top - drop;

    let yLow = top - 1.0;
    if (r < ri + 0.7) yLow = Math.min(yLow, -0.9);
    if (r > ro - 0.3) yLow = Math.min(yLow, top - dOut - 0.1);
    const fy0 = Math.floor(yLow / FINE);
    const fyTop = Math.ceil(surf / FINE - 0.5); // first voxel whose center is above surf

    for (let fy = fy0; fy < fyTop; fy++) {
      const y = (fy + 0.5) * FINE;
      if (y < c.bottom) continue;
      if (coarseFilled(fx, fy, fz)) continue;
      const below = top - y;
      // Coat: frosting outside the dough radius, down to the drip line.
      const coatOut = below < dOut;
      const coatIn = below < dIn && y > MILK_LEVEL + 0.03;
      if (r > (coatOut ? ro + COAT_OUT + dripBulb(below, dOut) : ro)) continue;
      if (r < (coatIn ? ri - COAT_IN - dripBulb(below, dIn) : ri)) continue;
      const isCoat = r > ro || r < ri || (coatOut && r > ro - 0.2 && below > SKIN - 0.05);
      const fineZone = below < 1.0 || (r < ri + 0.7 && y > -0.9) || isCoat;
      if (!fineZone) continue;

      let color: number;
      const topVoxel = fy === fyTop - 1;
      if (isCoat) {
        color = topVoxel || below < drop + 0.05 ? P.frostingPinkLight : P.frostingPink;
      } else if (c.zone === Zone.Frosting && below < 0.24) {
        color = topVoxel
          ? P.frostingPinkLight
          : below < 0.1
            ? P.frostingPink
            : P.frostingPinkShadow;
      } else if (topVoxel) {
        color = surfaceColor(c, x, z);
      } else if (c.zone === Zone.Meadow && below < 0.07) {
        color = P.grassDeep;
      } else if (c.zone === Zone.Sugar && below < 0.12) {
        color = P.powderedSugar;
      } else {
        color = doughColor(x, y, z, theta, y - c.bottom);
      }
      put(fy, color);
    }

    // Micro-voxel grass blades on the meadow (RF-04).
    if (c.zone === Zone.Meadow && c.zoneDepth > 0.04 && drop === 0) {
      const g = hash3(fx, 7, fz, 37);
      const lush = valueNoise3(x * 1.3, 2, z * 1.3, 41);
      if (g < opts.grassDensity * (0.55 + lush)) {
        const hRand = hash3(fx, 8, fz, 37);
        const h = hRand < 0.55 ? 1 : hRand < 0.88 ? 2 : 3;
        for (let k = 0; k < h; k++) {
          const tip = k === h - 1;
          put(
            fyTop + k,
            tip && h > 1 ? P.grassLight : hash3(fx, k, fz, 43) > 0.5 ? P.grassMint : P.grassDeep,
          );
        }
      }
    }
  });
  const fineMs = performance.now() - t1;
  return { coarse, fine, stats: { coarseMs, fineMs } };
}
