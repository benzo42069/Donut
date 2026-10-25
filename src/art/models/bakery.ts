import { PALETTE_INDEX as P, hash3 } from '../palette';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * Granny Dough's bakery (K-03, RF-08) at 1/32 m: a gingerbread-style cottage
 * with cream walls in chocolate timber framing, a steep chocolate-shingle roof
 * trimmed with twisted cruller rope, warm glowing windows with flower boxes, a
 * striped awning over an arched door, a brick chimney with a frosting cap, and
 * a big donut emblem on the gable instead of a text sign.
 *
 * Local frame: the door faces +z; the base center is (BAKERY_SIZE.x/2, 0, BAKERY_SIZE.z/2).
 * The chimney top (for steam) is at `BAKERY_CHIMNEY`.
 */
export const BAKERY_SIZE = [100, 140, 116] as const;
export const BAKERY_CHIMNEY = [73, 136, 40] as const;

// Walls: x ∈ [X0, X1), z ∈ [Z0, Z1), y ∈ [FLOOR, TOP).
const X0 = 8;
const X1 = 92;
const Z0 = 10;
const Z1 = 102;
const FLOOR = 5;
const TOP = 64;
const MID_X = 50;
const HALF = (X1 - X0) / 2;
const ROOF_T = 5;
const OVERHANG = 8;
/** Underside of the roof at x. */
const roofUnder = (x: number): number => TOP + (HALF - Math.abs(x + 0.5 - MID_X));
const RIDGE = TOP + HALF;

const inBox = (
  x: number,
  y: number,
  z: number,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
): boolean => x >= x0 && x < x1 && y >= y0 && y < y1 && z >= z0 && z < z1;

/** Window opening on a wall: u is the coordinate along the wall. */
interface Opening {
  u0: number;
  u1: number;
  y0: number;
  y1: number;
}
const FRONT_WINDOWS: Opening[] = [
  { u0: 16, u1: 31, y0: 22, y1: 42 },
  { u0: 69, u1: 84, y0: 22, y1: 42 },
];
const SIDE_WINDOWS: Opening[] = [{ u0: 46, u1: 64, y0: 22, y1: 42 }];
const DOOR = { u0: 42, u1: 58, y0: FLOOR, y1: 48 };

function doorShape(u: number, y: number): boolean {
  if (u < DOOR.u0 || u >= DOOR.u1 || y < DOOR.y0) return false;
  const r = (DOOR.u1 - DOOR.u0) / 2;
  const cy = DOOR.y1 - r;
  if (y < cy) return true;
  return Math.hypot(u + 0.5 - (DOOR.u0 + r), y + 0.5 - cy) < r;
}

/** Color of a wall voxel (cream plaster in chocolate timber), or 0 for an opening. */
function wallVoxel(
  u: number,
  y: number,
  uMax: number,
  openings: Opening[],
  front: boolean,
  depth: number,
): number {
  // Timber: corner posts, sill, mid rail, top plate, and diagonal braces.
  if (u < 4 || u >= uMax - 4) return P.chocolateDark;
  if (y < FLOOR + 4 || y >= TOP - 4) return P.chocolateDark;
  if (y >= 33 && y < 36 && !(front && u >= DOOR.u0 - 2 && u < DOOR.u1 + 2)) return P.chocolate;
  for (const o of openings) {
    // Frame around the window, then a recessed glowing pane with muntins.
    if (u >= o.u0 - 2 && u < o.u1 + 2 && y >= o.y0 - 2 && y < o.y1 + 2) {
      const inside = u >= o.u0 && u < o.u1 && y >= o.y0 && y < o.y1;
      if (!inside) return P.woodDark;
      if (depth === 0) return 0; // recess
      const mu = Math.floor((o.u0 + o.u1) / 2);
      const my = Math.floor((o.y0 + o.y1) / 2);
      if (u === mu || y === my) return P.woodLight;
      return P.windowGlow;
    }
  }
  if (front) {
    const r = (DOOR.u1 - DOOR.u0) / 2 + 2;
    const frame = doorShape(u, y)
      ? false
      : Math.hypot(u + 0.5 - (DOOR.u0 + r - 2), y + 0.5 - (DOOR.y1 - r + 2)) < r ||
        (u >= DOOR.u0 - 2 && u < DOOR.u1 + 2 && y < DOOR.y1 - r + 2);
    if (doorShape(u, y)) {
      if (depth < 2) return 0; // recess
      if (u === DOOR.u1 - 4 && y === 26) return P.butter; // knob
      return (u - DOOR.u0) % 4 === 0 ? P.woodDark : P.wood;
    }
    if (frame) return P.chocolate;
  }
  // Vertical studs between the panels (clean timber, no jagged diagonals).
  if (!front && (u % 21 === 0 || u % 21 === 1) && u > 6 && u < uMax - 6) return P.chocolate;
  return hash3(u, y, depth, 61) > 0.92 ? P.doughCrumb : P.creamWall;
}

export function buildBakery(): VoxelGrid {
  const grid = new VoxelGrid();
  const W = X1 - X0;
  const D = Z1 - Z0;
  grid.generate(0, 0, 0, BAKERY_SIZE[0], BAKERY_SIZE[1], BAKERY_SIZE[2], (x, y, z) => {
    // Foundation: a rounded dough-stone plinth.
    if (y < FLOOR) {
      if (inBox(x, y, z, X0 - 2, 0, Z0 - 2, X1 + 2, FLOOR, Z1 + 2)) {
        const top = y === FLOOR - 1;
        return top ? P.doughToasted : hash3(x >> 2, y, z >> 2, 7) > 0.5 ? P.pebble : P.doughToasted;
      }
      // Front step.
      if (inBox(x, y, z, DOOR.u0 + X0 - 3, 0, Z1 + 2, DOOR.u1 + X0 + 3, 3, Z1 + 8)) return P.pebble;
      return 0;
    }

    // Roof slabs with shingles, overhanging the walls.
    const ru = roofUnder(x);
    if (x >= X0 - OVERHANG && x < X1 + OVERHANG && z >= Z0 - OVERHANG && z < Z1 + OVERHANG) {
      const down = RIDGE - ru; // distance down the slope from the ridge
      const row = Math.floor(down / 5);
      const lip = down % 5 >= 4 ? 1 : 0; // each shingle row overlaps the next
      if (y >= ru && y < ru + ROOF_T + lip) {
        const tile = Math.floor((z + (row % 2) * 3) / 6);
        const h = hash3(row, tile, x < MID_X ? 1 : 2, 13);
        if (y === ru) return P.woodDark; // soffit
        return h > 0.6 ? P.chocolateDark : P.chocolate;
      }
    }

    // Cruller rope along the rakes (front/back) and the ridge (K-03).
    for (const zc of [Z0 - OVERHANG + 3, Z1 + OVERHANG - 4]) {
      const dy = (y + 0.5 - (ru + ROOF_T + 1.5)) / Math.SQRT2;
      const dz = z + 0.5 - zc;
      if (x >= X0 - OVERHANG - 1 && x <= X1 + OVERHANG && Math.hypot(dy, dz) < 3.6) {
        const ph = Math.atan2(dz, dy) + (x + y) * 0.42;
        return Math.sin(ph * 2) > 0 ? P.doughGolden : P.doughToasted;
      }
    }
    {
      const dx = x + 0.5 - MID_X;
      const dy = y + 0.5 - (RIDGE + ROOF_T + 1);
      if (z >= Z0 - OVERHANG && z < Z1 + OVERHANG && Math.hypot(dx, dy) < 4.2) {
        const ph = Math.atan2(dy, dx) + z * 0.42;
        return Math.sin(ph * 2) > 0 ? P.doughGolden : P.doughToasted;
      }
    }

    // Chimney with a frosting cap that drips.
    {
      const [chx, chTop, chz] = BAKERY_CHIMNEY;
      const inStack = Math.abs(x + 0.5 - chx) < 7 && Math.abs(z + 0.5 - chz) < 7;
      const inCap = Math.abs(x + 0.5 - chx) < 9 && Math.abs(z + 0.5 - chz) < 9;
      if (inCap && y >= chTop - 6 && y < chTop) {
        const hole = Math.abs(x + 0.5 - chx) < 4 && Math.abs(z + 0.5 - chz) < 4 && y >= chTop - 2;
        if (hole) return 0;
        return y === chTop - 1 ? P.frostingPinkLight : P.frostingPink;
      }
      if (inCap && y >= chTop - 10 && y < chTop - 6) {
        const edge = !(Math.abs(x + 0.5 - chx) < 8 && Math.abs(z + 0.5 - chz) < 8);
        if (edge && hash3(x, 0, z, 77) > 0.45) return P.frostingPink;
      }
      if (inStack && y >= ru && y < chTop - 6) {
        const course = Math.floor(y / 4);
        const mortar = y % 4 === 0 || (x + z + course * 3) % 7 === 0;
        return mortar ? P.doughCrumb : hash3(x, course, z, 3) > 0.5 ? P.doughToasted : P.doughCrust;
      }
    }

    // Front and back gables (triangles under the roof).
    const gable = y >= TOP && y < ru && x >= X0 && x < X1;
    if (gable && ((z >= Z1 - 3 && z < Z1) || (z >= Z0 && z < Z0 + 3))) {
      return hash3(x, y, z, 61) > 0.93 ? P.doughCrumb : P.creamWall;
    }

    // Walls: a 3-voxel shell; depth 0 is the outer face.
    if (y >= FLOOR && y < TOP && x >= X0 && x < X1 && z >= Z0 && z < Z1) {
      const dFront = Z1 - 1 - z;
      const dBack = z - Z0;
      const dLeft = x - X0;
      const dRight = X1 - 1 - x;
      const d = Math.min(dFront, dBack, dLeft, dRight);
      if (d >= 3) return 0;
      if (d === dFront) return wallVoxel(x - X0, y, W, FRONT_WINDOWS, true, d);
      if (d === dBack) return wallVoxel(x - X0, y, W, FRONT_WINDOWS, false, d);
      return wallVoxel(z - Z0, y, D, SIDE_WINDOWS, false, d);
    }
    return 0;
  });

  // Flower boxes under the front windows.
  for (const o of FRONT_WINDOWS) {
    for (let x = o.u0 - 2; x < o.u1 + 2; x++) {
      for (let z = Z1; z < Z1 + 4; z++) {
        for (let y = o.y0 - 6; y < o.y0 - 2; y++) grid.set(x + X0, y, z, P.woodLight);
        const bloom = hash3(x, 5, z, 91);
        if (bloom > 0.35) {
          const c =
            [P.frostingPinkLight, P.butter, P.lavender, P.sprinkleRed, P.candyCream][
              Math.floor(bloom * 50) % 5
            ] ?? P.butter;
          grid.set(x + X0, o.y0 - 2, z, bloom > 0.7 ? c : P.leafGreen);
          if (bloom > 0.8) grid.set(x + X0, o.y0 - 1, z, c);
        }
      }
    }
  }

  // Striped awning over the door, sloping out and down, with a scalloped edge.
  for (let x = X0 + DOOR.u0 - 6; x < X0 + DOOR.u1 + 6; x++) {
    const stripe = Math.floor((x - X0) / 4) % 2 === 0 ? P.frostingPinkLight : P.candyCream;
    for (let k = 0; k < 15; k++) {
      const z = Z1 + k;
      const y = DOOR.y1 + 8 - Math.floor(k * 0.55);
      grid.set(x, y, z, stripe);
      grid.set(x, y + 1, z, stripe);
    }
    // Scalloped valance hanging from the front edge.
    const sc = (x - X0) % 4;
    const hang = sc === 1 || sc === 2 ? 4 : 2;
    for (let d = 1; d <= hang; d++)
      grid.set(x, DOOR.y1 + 8 - Math.floor(14 * 0.55) - d + 1, Z1 + 14, stripe);
  }

  // Donut emblem on the front gable (RF-08: an icon, never text).
  const ex = MID_X;
  const ey = TOP + 20;
  for (let x = ex - 14; x <= ex + 14; x++) {
    for (let y = ey - 14; y <= ey + 14; y++) {
      for (let z = Z1; z < Z1 + 6; z++) {
        const q = Math.hypot(x + 0.5 - ex, y + 0.5 - ey) - 8.5;
        const t = Math.hypot(q, (z + 0.5 - (Z1 + 1)) * 1.2);
        if (t > 4.2) continue;
        const front = z + 0.5 - (Z1 + 1) > 1.2;
        const sprinkle = front && hash3(x, y, 3, 19) > 0.88;
        const c = sprinkle
          ? ([P.sprinkleYellow, P.sprinkleBlue, P.candyCream, P.sprinkleGreen][
              Math.floor(hash3(x, y, 4, 19) * 4)
            ] ?? P.butter)
          : front || y > ey - 2
            ? P.frostingPink
            : P.doughGolden;
        grid.set(x, y, z, c);
      }
    }
  }

  grid.takeDirty();
  return grid;
}
