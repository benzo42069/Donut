import { PALETTE_INDEX, hash3, type VoxelColorName } from '../palette';
import { voxelize } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * A wild donut at hero-prop scale (1/32 m, about 22 voxels across; art bible §3,
 * K-06): a plump dough torus with a pale fried band around its waist and a
 * toasted underside, a glossy frosting cap whose edge droops into rounded drips
 * over the side and into the hole, and 1×1×3 sprinkles. M3 grows this into the
 * full flavor set.
 */
export type DonutFlavor = 'strawberry' | 'chocolate' | 'glazed' | 'powdered';

interface FlavorLook {
  top: VoxelColorName;
  side: VoxelColorName;
  sprinkles: boolean;
  /** Typical drip length (voxels). */
  drip: number;
}

const LOOK: Record<DonutFlavor, FlavorLook> = {
  strawberry: { top: 'frostingPinkLight', side: 'frostingPink', sprinkles: true, drip: 2.6 },
  chocolate: { top: 'chocolate', side: 'chocolateDark', sprinkles: true, drip: 2.4 },
  glazed: { top: 'classicGlaze', side: 'classicGlaze', sprinkles: false, drip: 3.0 },
  powdered: { top: 'powderedSugar', side: 'powderedSugar', sprinkles: false, drip: 0 },
};

const SPRINKLES: VoxelColorName[] = [
  'sprinkleRed',
  'sprinkleOrange',
  'sprinkleYellow',
  'sprinkleGreen',
  'sprinkleBlue',
  'sprinkleViolet',
];

/**
 * Donuts are the game's hero props and get the close-up density (art bible §3:
 * 1/64 m, about 46 voxels across) so bites, drips and sprinkles stay crisp up close.
 */
export const DONUT_VOXEL = 1 / 64;
/** Scale relative to the 1/32 m draft (all shape constants below are in 1/32 units). */
const S = 2;
/** Model size in voxels (x, y, z); the donut's base sits at y = 0. */
export const DONUT_SIZE = [48, 22, 48] as const;

/** Elliptical-tube torus: ring radius R, tube radii a (horizontal) and b (vertical). */
const tube = (R: number, a: number, b: number) => (x: number, y: number, z: number) => {
  const q = Math.hypot(x, z) - R;
  const k = Math.hypot(q / a, y / b);
  return (k - 1) * Math.min(a, b);
};

export function buildDonut(flavor: DonutFlavor, seed = 0): VoxelGrid {
  const grid = new VoxelGrid();
  const look = LOOK[flavor];
  const R = 6.3 * S;
  const a = 4.3 * S;
  const b = 3.9 * S;
  const cx = DONUT_SIZE[0] / 2;
  const cy = b + 0.3;
  const cz = DONUT_SIZE[2] / 2;
  const dough = tube(R, a, b);
  const frost = tube(R, a + 1.7, b + 1.7);

  // Drip line (height below which there is no frosting), in voxels relative to
  // the tube center: U-shaped tongues around both the outer edge and the hole.
  const dripLine = (angle: number, outer: boolean): number => {
    const segs = outer ? 13 : 8;
    const t = ((angle / (Math.PI * 2) + 1) % 1) * segs;
    const k = Math.floor(t);
    const f = t - k;
    let d = (0.9 - 0.35 * Math.sin(angle * 3 + seed) + 0.15 * Math.sin(angle * 11 + seed * 2)) * S;
    const s = seed * 13 + (outer ? 0 : 101);
    const len = hash3(k, s, 1, 3) < 0.25 ? 0 : (0.5 + hash3(k, s, 2, 3)) * look.drip;
    const half = 0.28 + hash3(k, s, 3, 3) * 0.14;
    const dx = Math.abs(f - 0.5) / half;
    if (dx < 1 && len > 0) d -= (Math.max(0, len - 1) + Math.sqrt(1 - dx * dx)) * S;
    return d;
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
      const ring = Math.hypot(px, pz);
      const outer = ring > R;
      const inDough = dough(px, py, pz) <= 0;
      if (look.drip > 0 || flavor === 'powdered') {
        const line = flavor === 'powdered' ? -1.2 : dripLine(Math.atan2(pz, px), outer);
        if (py > line) {
          if (flavor === 'powdered') return inDough && py > 1.2 ? PALETTE_INDEX.powderedSugar : 0;
          const exposedTop = py > b - 1.8 || !inDough;
          return PALETTE_INDEX[exposedTop && py > 0 ? look.top : look.side];
        }
      }
      if (!inDough) return 0;
      if (py < -b + 2.4) return PALETTE_INDEX.doughToasted;
      // Pale fried band around the waist (outer side only), then golden.
      if (outer && Math.abs(py + 0.6) < 1.6 && ring > R + a - 3) return PALETTE_INDEX.doughCrumb;
      return hash3(x, y, z, seed + 5) > 0.85
        ? PALETTE_INDEX.doughToasted
        : PALETTE_INDEX.doughGolden;
    },
  );

  if (look.sprinkles) {
    // Sprinkles: 1×1×3 capsules lying on the cap in 90° steps (art bible §5).
    let placed = 0;
    for (let i = 0; i < 900 && placed < 120; i++) {
      const ang = hash3(i, seed, 1, 23) * Math.PI * 2;
      const rad = R + (hash3(i, seed, 2, 23) * 2 - 1) * (a - 2.4);
      const x = Math.floor(cx + Math.cos(ang) * rad);
      const z = Math.floor(cz + Math.sin(ang) * rad);
      let y = DONUT_SIZE[1] - 1;
      while (y > 0 && grid.get(x, y, z) === 0) y--;
      if (y < cy) continue;
      const alongX = hash3(i, seed, 3, 23) > 0.5;
      // Lie flat on frosting (never on another sprinkle), with a gap around it.
      const frosting = new Set([PALETTE_INDEX[look.top], PALETTE_INDEX[look.side]]);
      const ok =
        [-1, 0, 1].every((k) => {
          const sx = x + (alongX ? k : 0);
          const sz = z + (alongX ? 0 : k);
          return frosting.has(grid.get(sx, y, sz)) && grid.get(sx, y + 1, sz) === 0;
        }) &&
        [-2, -1, 0, 1, 2].every((u) =>
          [-1, 0, 1].every(
            (v) => grid.get(x + (alongX ? u : v), y + 1, z + (alongX ? v : u)) === 0,
          ),
        );
      if (!ok) continue;
      const color = PALETTE_INDEX[SPRINKLES[(i + seed) % SPRINKLES.length] ?? 'sprinkleRed'];
      for (let k = -1; k <= 1; k++) {
        grid.set(x + (alongX ? k : 0), y + 1, z + (alongX ? 0 : k), color);
      }
      placed++;
    }
  }
  grid.takeDirty();
  return grid;
}
