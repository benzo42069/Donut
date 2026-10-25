import { PALETTE_INDEX, type VoxelColorName } from '../palette';
import { smoothUnion, subtract, union, voxelize, type Sdf } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * Glazey (art bible §7, reference 03, D-01, RF-09–RF-13): a squishy coral
 * creature at character-sheet density (1/32 m voxels, about 32 voxels tall at
 * belly 0). Coral from every angle, a cream belly, pink blush, big glossy eyes
 * with 2×2 glints, a small happy mouth, a 5-stripe rainbow sprinkle tuft, two
 * stubby arms and two feet, and nothing else (no tail, no labels).
 *
 * Belly stages 0–5 are clearly distinct silhouettes: a pear-shaped bean at 0,
 * rounder and wider with a growing belly, and a perfectly round ball at 5.
 * Model space: +z is the front (face), +y up; the feet stand on y = 0.
 */
export const GLAZEY_VOXEL = 1 / 32;

export type GlazeyExpression = 'happy' | 'bliss' | 'surprised' | 'munch';

export interface GlazeyModel {
  grid: VoxelGrid;
  /** Bottom center in voxels (between the feet). */
  pivot: [number, number, number];
  /** Height in voxels, tuft included. */
  height: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Ellipsoid (approximate distance, exact sign). */
const ellipsoid =
  (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): Sdf =>
  (x, y, z) => {
    const k = Math.hypot((x - cx) / rx, (y - cy) / ry, (z - cz) / rz);
    return (k - 1) * Math.min(rx, ry, rz);
  };

/** Capsule from a to b with radius r. */
const capsule =
  (a: readonly number[], b: readonly number[], r: number): Sdf =>
  (x, y, z) => {
    const [ax = 0, ay = 0, az = 0] = a;
    const [bx = 0, by = 0, bz = 0] = b;
    const px = x - ax;
    const py = y - ay;
    const pz = z - az;
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const h = Math.min(
      1,
      Math.max(0, (px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz)),
    );
    return Math.hypot(px - dx * h, py - dy * h, pz - dz * h) - r;
  };

const TUFT: VoxelColorName[] = [
  'sprinkleRed',
  'sprinkleOrange',
  'sprinkleYellow',
  'sprinkleGreen',
  'sprinkleBlue',
];

export function buildGlazey(belly = 0, expression: GlazeyExpression = 'happy'): GlazeyModel {
  const t = Math.min(5, Math.max(0, belly)) / 5;
  // Body half extents: a bottom-heavy bean at belly 0, a ball at belly 5.
  const rx = lerp(11.5, 17.5, t);
  const ry = lerp(13.2, 17.5, t);
  const rz = lerp(10, 17.5, t);
  const feetH = lerp(2.5, 1.2, t);
  const y0 = feetH + ry;
  const pear = 0.13 * (1 - t);
  const body: Sdf = (x, y, z) => {
    const ny = Math.max(-1, Math.min(1, (y - y0) / ry));
    const w = rx * (1 - pear * ny);
    const d = rz * (1 - pear * 0.6 * ny);
    const k = Math.hypot(x / w, (y - y0) / ry, z / d);
    return (k - 1) * Math.min(w, ry, d);
  };
  // The belly pushes forward and down as Glazey fills up.
  const bellyR = lerp(8.5, 13, t);
  const bellyC = [0, y0 - ry * lerp(0.32, 0.18, t), rz * lerp(0.36, 0.3, t)] as const;
  const bellyBulge = ellipsoid(
    bellyC[0],
    bellyC[1],
    bellyC[2],
    bellyR * 1.05,
    bellyR,
    bellyR * 0.9,
  );
  // Stubby arms, angled down and out; feet peeking out in front.
  const arm = (s: number): Sdf =>
    capsule(
      [s * rx * 0.8, y0 + ry * 0.02, rz * 0.05],
      [s * (rx + lerp(3.6, 2.6, t)), y0 - ry * lerp(0.32, 0.22, t), rz * 0.25],
      lerp(3.0, 2.8, t),
    );
  const foot = (s: number): Sdf =>
    ellipsoid(s * rx * lerp(0.42, 0.36, t), 2.3, rz * lerp(0.22, 0.3, t), 4.4, 2.8, 5.4);

  // Face layout on the front of the body.
  const eyeY = y0 + ry * lerp(0.2, 0.12, t);
  const eyeX = rx * lerp(0.37, 0.3, t);
  const front = (x: number, y: number): number => {
    // z of the body surface in front of (x, y) (for placing face features).
    const ny = Math.max(-1, Math.min(1, (y - y0) / ry));
    const w = rx * (1 - pear * ny);
    const d = rz * (1 - pear * 0.6 * ny);
    const k = 1 - (x / w) ** 2 - ((y - y0) / ry) ** 2;
    return k > 0 ? d * Math.sqrt(k) : 0;
  };
  const eyeW = expression === 'surprised' ? 3.4 : 3.0;
  const eyeH = expression === 'surprised' ? 4.0 : 3.7;
  const mouthY = eyeY - lerp(4.4, 4.0, t);
  const mouthZ = front(0, mouthY);
  const mouthW = expression === 'surprised' ? 1.6 : expression === 'munch' ? 3.0 : 2.2;
  const mouthH = expression === 'surprised' ? 2.0 : 1.4;
  // The mouth is a little scoop, open below its top edge (a smile).
  const mouth: Sdf = (x, y, z) => {
    const top = expression === 'surprised' ? mouthY + mouthH : mouthY + 0.4;
    const e = Math.hypot(x / mouthW, (y - mouthY) / mouthH, (z - mouthZ) / 1.6) - 1;
    return Math.max(e, y - top);
  };
  const tuft: Sdf[] = TUFT.map((_, i) => {
    const a = ((i - 2) / 2) * 0.62;
    const bx = Math.sin(a) * 2.2;
    const by = y0 + ry - 1.5;
    const bz = -1 + Math.abs(i - 2) * 0.3;
    const len = 6.2 - Math.abs(i - 2) * 0.6;
    return capsule([bx, by, bz], [bx + Math.sin(a) * len, by + Math.cos(a) * len, bz - 1], 1.35);
  });

  const torso = smoothUnion(body, bellyBulge, 4);
  const limbs = union(arm(-1), arm(1), foot(-1), foot(1));
  const solid = subtract(union(smoothUnion(torso, limbs, 1.6), ...tuft), mouth);

  const grid = new VoxelGrid();
  const W = Math.ceil(rx + 8);
  const D = Math.ceil(Math.max(rz, bellyC[2] + bellyR) + 3);
  const H = Math.ceil(y0 + ry + 9);
  // Grid coords are offset so the model sits in positive space.
  const ox = W;
  const oz = W;
  const glint = (x: number, y: number, s: number): number => {
    // A 2×2 glint at the upper left of each eye (one consistent key light),
    // plus a 1-voxel twinkle at the lower right.
    const gx = s * eyeX - eyeW * 0.2;
    const gy = eyeY + eyeH * 0.22;
    if (x >= gx - 1 && x < gx + 1 && y >= gy - 1 && y < gy + 1) return 1;
    if (Math.abs(x - (s * eyeX + eyeW * 0.3)) < 0.5 && Math.abs(y - (eyeY - eyeH * 0.36)) < 0.5)
      return 1;
    return 0;
  };
  voxelize(
    grid,
    (x, y, z) => solid(x - ox, y, z - oz),
    [0, 0, 0],
    [2 * W, H, W + D],
    (gx, gy, gz) => {
      const x = gx + 0.5 - ox;
      const y = gy + 0.5;
      const z = gz + 0.5 - oz;
      for (let i = 0; i < TUFT.length; i++) {
        if ((tuft[i]?.(x, y, z) ?? 1) <= 0 && y > y0 + ry - 0.5)
          return PALETTE_INDEX[TUFT[i] ?? 'butter'];
      }
      // Face: only on the front surface.
      if (z > 0) {
        for (const s of [-1, 1]) {
          const ex = (x - s * eyeX) / eyeW;
          const ey = (y - eyeY) / eyeH;
          const inEye = ex * ex + ey * ey <= 1;
          if (expression === 'bliss' || expression === 'munch') {
            // Closed happy eyes: a ^ arc.
            const arc = Math.abs(Math.hypot(x - s * eyeX, (y - eyeY + 1.6) * 1.1) - 2.6);
            if (arc < 0.75 && y > eyeY - 1.4 && Math.abs(x - s * eyeX) < 3)
              return PALETTE_INDEX.eyeDark;
          } else if (inEye && z > front(x, y) - 2.5) {
            if (glint(x, y, s)) return PALETTE_INDEX.eyeGlint;
            return PALETTE_INDEX.eyeDark;
          }
          // Blush on the cheeks, just outside and below the eyes.
          const bx = (x - s * (eyeX + eyeW * 0.85)) / 2.6;
          const by = (y - (eyeY - eyeH - 1.3)) / 1.5;
          if (bx * bx + by * by <= 1) return PALETTE_INDEX.glazeyCheek;
        }
        // Mouth lining: dark inside, a pink tongue at the bottom.
        if (mouth(x, y, z) < 1.2 && Math.abs(x) < mouthW + 0.5 && y < mouthY + mouthH + 0.5) {
          if (y > mouthY - mouthH + 0.2 && Math.abs(x) < mouthW + 0.3) {
            return y < mouthY - mouthH * 0.35
              ? PALETTE_INDEX.glazeyTongue
              : PALETTE_INDEX.glazeyMouth;
          }
        }
        // Cream belly patch.
        const bw = rx * lerp(0.6, 0.66, t);
        const bh = ry * lerp(0.48, 0.55, t);
        const by = y0 - ry * lerp(0.36, 0.3, t);
        if ((x / bw) ** 2 + ((y - by) / bh) ** 2 <= 1 && z > rz * 0.15) {
          return PALETTE_INDEX.glazeyBellySoft;
        }
      }
      return PALETTE_INDEX.glazeyBody;
    },
  );
  grid.takeDirty();
  return { grid, pivot: [ox, 0, oz], height: Math.ceil(y0 + ry + 6) };
}
