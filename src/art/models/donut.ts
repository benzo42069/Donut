import { PALETTE_INDEX, hash3, type VoxelColorName } from '../palette';
import { voxelize } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * A wild donut (K-06, reference 04): a plump dough torus with an open hole, a
 * pale fried band around its waist and a toasted underside, a glossy frosting
 * cap whose edge droops into rounded drips over the side and into the hole, and
 * 1×1×3 sprinkles lying flat on top. M3 grows this into the full flavor set.
 *
 * The shape is authored in meters and voxelized at any size, so the same donut
 * can be a 1/64 m prop out in the meadow or a 1/128 m close-up hero asset
 * (art bible §3: close-up assets use finer voxels; it is ~0.72 m across).
 */
export type DonutFlavor = 'strawberry' | 'chocolate' | 'glazed' | 'powdered';

interface FlavorLook {
  top: VoxelColorName;
  side: VoxelColorName;
  sprinkles: boolean;
  /** Typical drip length (meters). */
  drip: number;
}

const LOOK: Record<DonutFlavor, FlavorLook> = {
  strawberry: { top: 'frostingPinkLight', side: 'frostingPink', sprinkles: true, drip: 0.07 },
  chocolate: { top: 'chocolate', side: 'chocolateDark', sprinkles: true, drip: 0.065 },
  glazed: { top: 'classicGlaze', side: 'classicGlaze', sprinkles: false, drip: 0.08 },
  powdered: { top: 'powderedSugar', side: 'powderedSugar', sprinkles: false, drip: 0 },
};

const SPRINKLES: VoxelColorName[] = [
  'sprinkleRed',
  'sprinkleOrange',
  'sprinkleYellow',
  'sprinkleGreen',
  'sprinkleBlue',
  'sprinkleViolet',
  'candyCream',
];

/** Default prop voxel size for donuts out in the world. */
export const DONUT_VOXEL = 1 / 64;
/** Close-up hero asset voxel size (the subject of ground-level shots). */
export const DONUT_HERO_VOXEL = 1 / 128;

// Shape in meters: ring radius, tube half-width and half-height, frosting thickness.
const RING = 0.235;
const TUBE_A = 0.12;
const TUBE_B = 0.105;
const FROST = 0.024;

/** Model size in voxels for a voxel size (x, y, z); the base sits at y = 0. */
export function donutSize(voxel: number): [number, number, number] {
  const w = Math.ceil((2 * (RING + TUBE_A + FROST) + 0.02) / voxel);
  const h = Math.ceil((2 * (TUBE_B + FROST) + 0.02) / voxel);
  return [w + (w & 1), h, w + (w & 1)];
}

/** Elliptical-tube torus: ring radius R, tube radii a (horizontal) and b (vertical). */
const tube = (R: number, a: number, b: number) => (x: number, y: number, z: number) => {
  const q = Math.hypot(x, z) - R;
  const k = Math.hypot(q / a, y / b);
  return (k - 1) * Math.min(a, b);
};

export function buildDonut(flavor: DonutFlavor, seed = 0, voxel = DONUT_VOXEL): VoxelGrid {
  const grid = new VoxelGrid();
  const look = LOOK[flavor];
  const size = donutSize(voxel);
  const v = voxel;
  const cx = size[0] / 2;
  const cz = size[2] / 2;
  const cy = (TUBE_B + FROST) / v + 0.5;
  const dough = tube(RING / v, TUBE_A / v, TUBE_B / v);
  const frost = tube(RING / v, (TUBE_A + FROST) / v, (TUBE_B + FROST) / v);

  // Drip line (height, in voxels relative to the tube center, below which there
  // is no frosting): a wavy edge just above the waist, with U-shaped tongues.
  const dripLine = (angle: number, outer: boolean): number => {
    const segs = outer ? 14 : 8;
    const t = ((angle / (Math.PI * 2) + 1) % 1) * segs;
    const k = Math.floor(t);
    const f = t - k;
    let d =
      (0.022 - 0.01 * Math.sin(angle * 3 + seed) + 0.005 * Math.sin(angle * 11 + seed * 2)) / v;
    const s = seed * 13 + (outer ? 0 : 101);
    const len = hash3(k, s, 1, 3) < 0.25 ? 0 : (0.5 + hash3(k, s, 2, 3)) * look.drip;
    const half = 0.3 + hash3(k, s, 3, 3) * 0.12;
    const dx = Math.abs(f - 0.5) / half;
    if (dx < 1 && len > 0) {
      const tip = 0.025;
      d -= (Math.max(0, len - tip) + tip * Math.sqrt(1 - dx * dx)) / v;
    }
    return d;
  };

  voxelize(
    grid,
    (x, y, z) => frost(x - cx, y - cy, z - cz),
    [0, 0, 0],
    size,
    (x, y, z) => {
      const px = x + 0.5 - cx;
      const py = y + 0.5 - cy;
      const pz = z + 0.5 - cz;
      const ring = Math.hypot(px, pz);
      const outer = ring > RING / v;
      const inDough = dough(px, py, pz) <= 0;
      if (flavor === 'powdered') {
        // Sugar dusts the top faces only.
        if (!inDough) return py > 0.2 * (TUBE_B / v) ? PALETTE_INDEX.powderedSugar : 0;
      } else if (py > dripLine(Math.atan2(pz, px), outer)) {
        const exposedTop = py > (TUBE_B - 0.03) / v || !inDough;
        return PALETTE_INDEX[exposedTop && py > 0 ? look.top : look.side];
      }
      if (!inDough) return 0;
      const h = hash3(x, y, z, seed + 5);
      if (py < -(TUBE_B - 0.035) / v) {
        return h > 0.3 ? PALETTE_INDEX.doughToasted : PALETTE_INDEX.doughCrust;
      }
      // Pale fried band around the waist (outer side only), then golden.
      if (outer && Math.abs(py + 0.01 / v) < 0.022 / v && ring > (RING + TUBE_A - 0.05) / v) {
        return h > 0.9 ? PALETTE_INDEX.doughGolden : PALETTE_INDEX.doughCrumb;
      }
      return h > 0.88 ? PALETTE_INDEX.doughToasted : PALETTE_INDEX.doughGolden;
    },
  );

  if (look.sprinkles) {
    // Sprinkles: 1×1×3 capsules lying flat on the cap in 90° steps (art bible §5),
    // never stacked, with a gap around each.
    const frosting = new Set([PALETTE_INDEX[look.top], PALETTE_INDEX[look.side]]);
    const want = Math.round(34 * Math.pow((1 / 32 / v) * 0.9, 2));
    let placed = 0;
    for (let i = 0; i < want * 8 && placed < want; i++) {
      const ang = hash3(i, seed, 1, 23) * Math.PI * 2;
      const rad = (RING + (hash3(i, seed, 2, 23) * 2 - 1) * (TUBE_A - 0.03)) / v;
      const x = Math.floor(cx + Math.cos(ang) * rad);
      const z = Math.floor(cz + Math.sin(ang) * rad);
      let y = size[1] - 1;
      while (y > 0 && grid.get(x, y, z) === 0) y--;
      if (y < cy) continue;
      const alongX = hash3(i, seed, 3, 23) > 0.5;
      const ok =
        [-1, 0, 1].every((k) => {
          const sx = x + (alongX ? k : 0);
          const sz = z + (alongX ? 0 : k);
          return frosting.has(grid.get(sx, y, sz)) && grid.get(sx, y + 1, sz) === 0;
        }) &&
        [-2, -1, 0, 1, 2].every((u) =>
          [-1, 0, 1].every(
            (w) => grid.get(x + (alongX ? u : w), y + 1, z + (alongX ? w : u)) === 0,
          ),
        );
      if (!ok) continue;
      const color = PALETTE_INDEX[SPRINKLES[(i * 5 + seed) % SPRINKLES.length] ?? 'sprinkleRed'];
      for (let k = -1; k <= 1; k++) {
        grid.set(x + (alongX ? k : 0), y + 1, z + (alongX ? 0 : k), color);
      }
      placed++;
    }
  }
  grid.takeDirty();
  return grid;
}
