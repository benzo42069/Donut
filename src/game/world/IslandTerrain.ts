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
  innerWall,
  outerWall,
  type Column,
} from './islandShape';

/**
 * Voxelizes the island at up to three resolutions (art bible §3):
 *
 * - **coarse** (1/8 m): the dough body, outer strata cliffs, underside and
 *   lagoon floor. Big, mostly hidden or seen from afar.
 * - **fine** (1/32 m): a skin over every surface the camera gets close to: the
 *   whole top (meadow, path, frosting rims, hills), the inner lagoon cliffs, and
 *   the frosting coat that drips over the outer cliff (K-02, RF-05). Micro-voxel
 *   grass blades grow out of it (RF-04).
 * - **macro** (1/128 m, optional): near-field patches around a ground-level
 *   camera, where the top few centimeters of meadow and path and their grass are
 *   rebuilt at close-up density, so nothing near the lens is Lego-sized.
 *
 * All grids share the world origin, so cells nest exactly (4 fine per coarse,
 * 4 macro per fine). Each finer grid fills only the solid space the coarser one
 * leaves, so they never leave a gap; overlaps are only ever hidden inside.
 */
export const COARSE = 1 / 8;
export const FINE = 1 / 32;
export const MACRO = 1 / 128;

/** Half extent of the voxelized square (meters). */
const EXTENT = 13;
const C_N = Math.round((2 * EXTENT) / COARSE);
const C_OFF = C_N / 2;
const F_OFF = C_OFF * 4;

/** The coarse body stops this far below the surface. */
const SKIN = 0.3;
/** ...and this far behind the inner cliff, above this height. */
const INNER_SKIN = 0.3;
const INNER_SKIN_FLOOR = -0.5;
/** Frosting coat thickness over the outer cliff (outside the dough wall). */
const COAT_OUT = 0.15;
const COAT_IN = 0.065;
const SYRUP_SHEET = 0.11;
const RIM_ROUND = 0.2;
/** Macro patches replace this much of the top. */
const MACRO_SKIN = 0.09;

/** A disc of near-field detail (macro resolution) around a close camera. */
export interface DetailPatch {
  x: number;
  z: number;
  radius: number;
}

export interface TerrainOptions {
  /** Fraction of meadow cells with a 1/32 m grass blade. */
  grassDensity: number;
  /** Near-field macro patches (ground-level shots only). */
  detail?: readonly DetailPatch[];
  /** Spots kept clear of macro grass (e.g. under a donut): x, z, radius. */
  clear?: readonly (readonly [number, number, number])[];
}

export interface IslandTerrain {
  coarse: VoxelGrid;
  fine: VoxelGrid;
  macro: VoxelGrid | null;
  stats: { coarseMs: number; fineMs: number; macroMs: number };
}

/** How far inside the union of detail patches a point is (meters; ≤ 0 outside). */
export function detailDepth(d: readonly DetailPatch[] | undefined, x: number, z: number): number {
  let best = -1e9;
  for (const p of d ?? []) best = Math.max(best, p.radius - Math.hypot(x - p.x, z - p.z));
  return best;
}

/** Width of the band where macro heights blend from the fine skin's steps to the true surface. */
const FEATHER = 0.6;

/** True inside any detail patch. */
export function inDetail(d: readonly DetailPatch[] | undefined, x: number, z: number): boolean {
  if (!d) return false;
  for (const p of d) if (Math.hypot(x - p.x, z - p.z) < p.radius) return true;
  return false;
}

const P = PALETTE_INDEX;

/**
 * Baked dough (K-02): golden body with wobbling toasted strata of varying
 * thickness, crumb flecks, and a fried gradient toward the crusty underside.
 */
function doughColor(x: number, y: number, z: number, theta: number, aboveBottom: number): number {
  const h = hash3(Math.floor(x * 64), Math.floor(y * 64), Math.floor(z * 64), 4);
  // Fried underside: a smooth crust → toasted → golden gradient broken by soft
  // low-frequency patches (never a per-voxel checkerboard).
  if (aboveBottom < 0.7) {
    const t = aboveBottom / 0.7 + (valueNoise3(x * 1.2, y * 1.2, z * 1.2, 35) - 0.5) * 0.35;
    if (t < 0.2) return P.doughCrust;
    if (t < 0.55) return P.doughToasted;
  }
  // Broad, soft toasted strata of varying thickness (K-02), dithered at their edges.
  const n = valueNoise3(x * 0.5, y * 0.45, z * 0.5, 31);
  const wave = Math.sin(theta * 4 + n * 3) * 0.18 + (n - 0.5) * 0.5;
  const b = (y + wave + 8) / 0.95;
  const band = Math.floor(b);
  const f = b - band;
  const thick = 0.14 + 0.16 * valueNoise3(theta * 2, band * 1.7, 0.5, 33);
  if (f < thick) return P.doughToasted;
  if (f < thick + 0.07 && h < 1 - (f - thick) / 0.07) return P.doughToasted;
  if (h > 0.96) return P.doughCrumb;
  return P.doughGolden;
}

function meadowColor(x: number, z: number, res: number): number {
  const patch =
    valueNoise3(x * 0.8, 0, z * 0.8, 17) + (valueNoise3(x * 3, 1, z * 3, 18) - 0.5) * 0.35;
  const h = hash3(Math.floor(x * res), 0, Math.floor(z * res), 19);
  if (patch > 0.62 || h > 0.93) return P.grassLight;
  if (patch < 0.27 || h < 0.05) return P.grassDeep;
  return P.grassMint;
}

function surfaceColor(c: Column, x: number, z: number, res: number, slope: number): number {
  switch (c.zone) {
    case Zone.Frosting:
      return P.frostingPinkLight;
    case Zone.Path:
      // Smooth-shaded packed crumb (relaxed geometry: no contour lines on slopes).
      return hash3(Math.floor(x * res), 1, Math.floor(z * res), 23) > 0.9
        ? P.pathPebble
        : P.pathDirt;
    case Zone.Syrup:
      return P.syrupLight;
    case Zone.Sugar:
    case Zone.Rock:
      // A clean powdered-sugar cap on a gingerbread mountain (ref 01): no dither.
      void slope;
      return c.zone === Zone.Sugar ? P.powderedSugar : P.gingerbread;
    default:
      return meadowColor(x, z, res);
  }
}

/** Amber syrup with vertical flow streaks. */
const syrupColor = (theta: number, r: number, y: number): number =>
  (Math.floor(theta * r * 40 + Math.sin(y * 9) * 0.6) & 3) === 0 ? P.syrupLight : P.syrup;

export function buildIslandTerrain(shape: IslandShape, opts: TerrainOptions): IslandTerrain {
  const coarse = new VoxelGrid();
  const fine = new VoxelGrid();
  const t0 = performance.now();

  // --- Coarse body: per-voxel walls so the dough side bows out and crumbles. ---
  coarse.generateColumns(-C_OFF, -C_OFF, C_OFF, C_OFF, (ix, iz, put) => {
    const x = (ix + 0.5) * COARSE;
    const z = (iz + 0.5) * COARSE;
    const r = Math.hypot(x, z);
    if (r > EXTENT) return;
    const c = shape.column(x, z);
    if (r > c.ro + 0.5) return;
    let yTop: number;
    if (r < c.ri) {
      yTop = LAGOON_FLOOR;
    } else {
      yTop = c.top - SKIN;
      if (r < c.ri + INNER_SKIN) yTop = Math.min(yTop, INNER_SKIN_FLOOR);
    }
    const y0 = Math.ceil(c.bottom / COARSE - 0.5);
    const y1 = Math.ceil(yTop / COARSE - 0.5); // centers strictly below yTop
    for (let iy = y0; iy < y1; iy++) {
      const y = (iy + 0.5) * COARSE;
      const wall = outerWall(c.ro, c.theta, y, c.top);
      if (r > c.ri && r > wall) continue;
      // The outer belly gets a 1/32 m shell (fine pass) so its silhouette is smooth.
      if (inBelly(c, r) && (y < c.bottom + BELLY_SHELL || r > wall - BELLY_SHELL - 0.15)) continue;
      if (r < c.ri && iy === y1 - 1) put(iy, P.milkFloor);
      else put(iy, doughColor(x, y, z, c.theta, y - c.bottom));
    }
  });
  const coarseMs = performance.now() - t0;
  const coarseFilled = (fx: number, fy: number, fz: number): boolean =>
    coarse.get(fx >> 2, fy >> 2, fz >> 2) !== 0;

  // --- Fine skin ---
  const t1 = performance.now();
  const falls = shape.layout.falls.map((f) => ({ ...f, theta: (f.deg * Math.PI) / 180 }));
  fine.generateColumns(-F_OFF, -F_OFF, F_OFF, F_OFF, (fx, fz, put) => {
    const x = (fx + 0.5) * FINE;
    const z = (fz + 0.5) * FINE;
    const r = Math.hypot(x, z);
    if (r < INNER_BASE - 0.7 || r > EXTENT) return;
    const c = shape.column(x, z);
    const { ri, ro, top, theta } = c;
    if (r < ri - 0.16 || r > ro + 0.4 + COAT_OUT + 0.06) return;

    // Is this column the syrup fall's sheet over the inner wall?
    let inFall = false;
    for (const f of falls) {
      const along = Math.abs(((theta - f.theta + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * ri;
      if (along < f.halfWidth * 0.8 + 0.04 * Math.sin(r * 40)) inFall = true;
    }
    const dOut = dripDepth(theta * ro, 1, 0.56, 1.35);
    const dIn = inFall ? top - MILK_LEVEL + 0.05 : dripDepth(theta * ri, 2, 0.22, 1.5);
    const coatInT = inFall ? SYRUP_SHEET : COAT_IN;

    const drop = rimDrop(c, r, inFall);
    const surf = top - drop;
    const macro = inDetail(opts.detail, x, z) && macroColumn(c, r);

    let slope = 0;
    if (c.zone === Zone.Sugar || c.zone === Zone.Rock) {
      const tx = shape.surface(x + FINE, z);
      const tz = shape.surface(x, z + FINE);
      slope = Math.hypot(tx - top, tz - top) / FINE;
    }

    const belly = inBelly(c, r - 0.2);
    let yLow = top - 1.0;
    if (belly) yLow = c.bottom;
    if (r < ri + 0.7) yLow = Math.min(yLow, -0.9);
    if (r > ro - 0.3) yLow = Math.min(yLow, top - dOut - 0.1);
    const fy0 = Math.floor(yLow / FINE);
    const fyTop = Math.ceil(surf / FINE - 0.5); // first voxel whose center is above surf

    for (let fy = fy0; fy < fyTop; fy++) {
      const y = (fy + 0.5) * FINE;
      if (y < c.bottom) continue;
      if (coarseFilled(fx, fy, fz)) continue;
      const below = top - y;
      if (macro && surf - y < MACRO_SKIN) continue;
      const wallO = outerWall(ro, theta, y, top);
      const wallI = innerWall(ri, theta, y);
      // Coat: frosting (or the syrup sheet) outside the dough wall, down to the drip line.
      const coatOut = below < dOut;
      const coatIn = below < dIn && y > MILK_LEVEL + 0.03;
      if (r > (coatOut ? wallO + COAT_OUT + dripBulb(below, dOut) : wallO)) continue;
      if (r < (coatIn ? wallI - coatInT - (inFall ? 0 : dripBulb(below, dIn)) : wallI)) continue;
      const isCoat = r > wallO || r < wallI || (coatOut && r > wallO - 0.2 && below > SKIN - 0.05);
      const fineZone = below < 1.0 || (r < ri + 0.7 && y > -0.9) || isCoat;
      if (!fineZone && !belly) continue;

      let color: number;
      const topVoxel = fy === fyTop - 1;
      if (isCoat && inFall && r < wallI + 0.02) {
        color = syrupColor(theta, ri, y);
      } else if (isCoat) {
        color = topVoxel || below < drop + 0.05 ? P.frostingPinkLight : P.frostingPink;
      } else if (c.zone === Zone.Frosting && below < 0.24) {
        color = topVoxel
          ? P.frostingPinkLight
          : below < 0.1
            ? P.frostingPink
            : P.frostingPinkShadow;
      } else if (c.zone === Zone.Syrup && below < 0.06) {
        color = topVoxel ? P.syrupLight : P.syrup;
      } else if (topVoxel) {
        color = surfaceColor(c, x, z, 32, slope);
      } else if (c.zone === Zone.Meadow && below < 0.07) {
        color = P.grassDeep;
      } else if (c.zone === Zone.Sugar && below < 0.1) {
        color = P.powderedSugar;
      } else if (c.zone === Zone.Sugar || c.zone === Zone.Rock) {
        // Gingerbread with broad, soft darker bands.
        const band = Math.sin(y * 5 + valueNoise3(x * 0.8, y * 0.5, z * 0.8, 39) * 4);
        color = band > 0.55 ? P.gingerbreadDark : P.gingerbread;
      } else {
        color = doughColor(x, y, z, theta, y - c.bottom);
      }
      put(fy, color);
    }

    // Micro-voxel grass blades on the meadow (RF-04).
    if (!macro && c.zone === Zone.Meadow && c.zoneDepth > 0.04 && drop === 0) {
      const g = hash3(fx, 7, fz, 37);
      const lush = valueNoise3(x * 1.3, 2, z * 1.3, 41);
      if (g < opts.grassDensity * (0.55 + lush)) {
        const hRand = hash3(fx, 8, fz, 37);
        // Thin blades, not bumps: 2–4 voxels tall, dark base to light tip.
        const h = hRand < 0.4 ? 2 : hRand < 0.82 ? 3 : 4;
        for (let k = 0; k < h; k++) {
          const tip = k === h - 1;
          put(fyTop + k, tip ? P.grassLight : k === 0 ? P.grassDeep : P.grassMint);
        }
      }
    }
  });
  const fineMs = performance.now() - t1;

  const t2 = performance.now();
  const macro = opts.detail?.length ? buildMacro(shape, opts.detail, opts.clear ?? []) : null;
  return {
    coarse,
    fine,
    macro,
    stats: { coarseMs, fineMs, macroMs: performance.now() - t2 },
  };
}

/** Thickness of the fine shell over the outer belly (meters). */
const BELLY_SHELL = 0.3;
/** The outer half of the ring's underside, seen from the hero camera. */
const inBelly = (c: Column, r: number): boolean => r > (c.ri + c.ro) / 2;

/** Rim corners: rounded where the frosting coat meets the top (meters below `top`). */
function rimDrop(c: Column, r: number, inFall: boolean): number {
  const coatInT = inFall ? SYRUP_SHEET : COAT_IN;
  const cornerOut = c.ro + COAT_OUT - RIM_ROUND;
  const cornerIn = c.ri - coatInT + RIM_ROUND;
  if (r > cornerOut) {
    const d = Math.min(RIM_ROUND, r - cornerOut);
    return RIM_ROUND - Math.sqrt(RIM_ROUND * RIM_ROUND - d * d);
  }
  if (r < cornerIn && !inFall) {
    const d = Math.min(RIM_ROUND, cornerIn - r);
    return RIM_ROUND - Math.sqrt(RIM_ROUND * RIM_ROUND - d * d);
  }
  return 0;
}

/** Columns a macro patch rebuilds: meadow, path and frosting tops inside the dough walls. */
const macroColumn = (c: Column, r: number): boolean =>
  (c.zone === Zone.Meadow || c.zone === Zone.Path || c.zone === Zone.Frosting) &&
  r > c.ri + 0.02 &&
  r < c.ro;

/** The 1/128 m near-field patches: the top `MACRO_SKIN` of meadow, path and frosting, plus grass and sprinkles. */
function buildMacro(
  shape: IslandShape,
  patches: readonly DetailPatch[],
  clear: readonly (readonly [number, number, number])[],
): VoxelGrid {
  const grid = new VoxelGrid();
  const leans: [number, number, number, number][] = [];
  for (const p of patches) {
    const x0 = Math.floor((p.x - p.radius - FINE) / FINE) * 4;
    const x1 = Math.ceil((p.x + p.radius + FINE) / FINE) * 4;
    const z0 = Math.floor((p.z - p.radius - FINE) / FINE) * 4;
    const z1 = Math.ceil((p.z + p.radius + FINE) / FINE) * 4;
    grid.generateColumns(x0, z0, x1, z1, (mx, mz, put) => {
      const x = (mx + 0.5) * MACRO;
      const z = (mz + 0.5) * MACRO;
      // Membership is decided at the parent fine column's center, exactly as the
      // fine pass decides which tops to leave out, so the two tile with no gaps.
      const px = ((mx >> 2) + 0.5) * FINE;
      const pz = ((mz >> 2) + 0.5) * FINE;
      if (Math.hypot(px - p.x, pz - p.z) >= p.radius) return;
      // Earlier patches own their area (no double fill where patches overlap).
      for (const q of patches) {
        if (q === p) break;
        if (Math.hypot(px - q.x, pz - q.z) < q.radius) return;
      }
      const pc = shape.column(px, pz);
      if (!macroColumn(pc, Math.hypot(px, pz))) return;
      const c = shape.column(x, z);
      const r = Math.hypot(x, z);
      const drop = rimDrop(c, r, false);
      const top = c.top - drop;
      // Near the patch edge, follow the fine skin's quantized top exactly, so there
      // is no step (and no seam line) where the two resolutions meet.
      const fineTop = Math.ceil(top / FINE - 0.5) * FINE;
      const t = Math.min(1, Math.max(0, detailDepth(patches, x, z) / FEATHER));
      const blended = fineTop + (top - fineTop) * t * t * (3 - 2 * t);
      const y0 = Math.floor((top - MACRO_SKIN - FINE) / MACRO);
      const yTop = Math.round(blended / MACRO);
      const frosting = c.zone === Zone.Frosting;
      const surface = frosting ? P.frostingPinkLight : surfaceColor(c, x, z, 128, 0);
      for (let y = y0; y < yTop; y++) {
        const below = top - (y + 0.5) * MACRO;
        let v: number;
        if (y === yTop - 1) v = surface;
        else if (frosting) v = below < 0.05 ? P.frostingPink : P.frostingPinkShadow;
        else v = c.zone === Zone.Meadow && below < 0.03 ? P.grassDeep : P.doughCrumb;
        put(y, v);
      }
      if (frosting) {
        // Sprinkles at close-up scale: 1×1×3 macro capsules lying flat.
        if (drop === 0 && c.zoneDepth > 0.06 && hash3(mx, 13, mz, 71) < 0.012) {
          const colors = [
            P.sprinkleRed,
            P.sprinkleYellow,
            P.sprinkleBlue,
            P.sprinkleGreen,
            P.sprinkleViolet,
            P.sprinkleOrange,
            P.candyCream,
          ];
          const col = colors[Math.floor(hash3(mx, 14, mz, 71) * colors.length)] ?? P.butter;
          const alongX = hash3(mx, 15, mz, 71) > 0.5;
          for (let k = -1; k <= 1; k++)
            leans.push([mx + (alongX ? k : 0), yTop, mz + (alongX ? 0 : k), col]);
        }
        return;
      }
      if (c.zone !== Zone.Meadow || c.zoneDepth < 0.03) return;
      if (clear.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr)) return;
      // Grass: thin blades 3–10 cm, leaning a step every few voxels.
      const lush = valueNoise3(x * 1.3, 2, z * 1.3, 41);
      const g = hash3(mx, 7, mz, 71);
      if (g < 0.07 + lush * 0.1) {
        const h = 4 + Math.floor(hash3(mx, 8, mz, 71) * 9);
        const a = Math.floor(hash3(mx, 9, mz, 71) * 4);
        const ldx = a === 0 ? 1 : a === 1 ? -1 : 0;
        const ldz = a === 2 ? 1 : a === 3 ? -1 : 0;
        const every = 3 + Math.floor(hash3(mx, 10, mz, 71) * 3);
        // Tapered: a 2-voxel-wide base (across the lean) for the lower third.
        const wide = Math.ceil(h / 3);
        for (let k = 0; k < h; k++) {
          const t = k / h;
          const color = t > 0.75 ? P.grassLight : t > 0.3 ? P.grassMint : P.grassDeep;
          const shift = Math.floor(k / every);
          if (shift === 0) put(yTop + k, color);
          else leans.push([mx + ldx * shift, yTop + k, mz + ldz * shift, color]);
          if (k < wide) leans.push([mx + ldz, yTop + k, mz + ldx, P.grassDeep]);
        }
      } else if (g > 0.9985) {
        // A sprinkle flower: stem, leaves and a 5-petal bloom (art bible §3 scale).
        const h = 8 + Math.floor(hash3(mx, 11, mz, 71) * 7);
        for (let k = 0; k < h; k++) put(yTop + k, P.grassDeep);
        const petals = [
          P.sprinkleRed,
          P.butter,
          P.lavender,
          P.candyCream,
          P.frostingPinkLight,
          P.sprinkleBlue,
        ];
        const petal = petals[Math.floor(hash3(mx, 12, mz, 71) * petals.length)] ?? P.butter;
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const)
          leans.push([mx + dx, yTop + h, mz + dz, petal]);
        leans.push([mx, yTop + h, mz, P.sprinkleOrange]);
        leans.push([mx + 1, yTop + 3, mz, P.grassMint], [mx - 1, yTop + 5, mz, P.grassMint]);
      }
    });
  }
  for (const [x, y, z, v] of leans) if (grid.get(x, y, z) === 0) grid.set(x, y, z, v);
  return grid;
}
