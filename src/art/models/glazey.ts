import { PALETTE_INDEX, type VoxelColorName } from '../palette';
import { smoothUnion, union, voxelize, type Sdf } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * Glazey (art bible §7, reference 03, D-01, RF-09–RF-13): a squishy coral
 * creature at character-sheet density (1/32 m voxels, about 32 voxels tall at
 * belly 0). Coral from every angle, a cream belly, pink blush, big glossy eyes
 * with white glints, a happy open mouth, a 5-stripe rainbow sprinkle tuft, two
 * stubby arms and two feet, and nothing else (no tail, no labels). The face and
 * belly patch are a separate 1/128 m decal grid (`face`), placed with the body.
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
  /** The face decal: same pose as the body, voxel size `GLAZEY_FACE_VOXEL`. */
  face: { grid: VoxelGrid; pivot: [number, number, number] };
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
  // Stubby arms, angled about 35° down and a little forward (sheet 03), not fins.
  const arm = (s: number): Sdf =>
    capsule(
      [s * rx * 0.8, y0 + ry * 0.02, rz * 0.08],
      [s * (rx + lerp(1.6, 1.1, t)), y0 - ry * lerp(0.46, 0.42, t), rz * 0.3],
      lerp(3.2, 3.0, t),
    );
  const foot = (s: number): Sdf =>
    ellipsoid(s * rx * lerp(0.42, 0.36, t), 2.3, rz * lerp(0.22, 0.3, t), 4.4, 2.8, 5.4);

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
  const skin = smoothUnion(torso, limbs, 1.6);
  const face = faceLayout(expression, t, rx, ry, y0);

  const grid = new VoxelGrid();
  const W = Math.ceil(rx + 8);
  const D = Math.ceil(Math.max(rz, bellyC[2] + bellyR) + 3);
  const H = Math.ceil(y0 + ry + 9);
  // Grid coords are offset so the model sits in positive space.
  const ox = W;
  const oz = W;
  voxelize(
    grid,
    (x, y, z) => skin(x - ox, y, z - oz),
    [0, 0, 0],
    [2 * W, H, W + D],
    () => PALETTE_INDEX.glazeyBody,
  );
  // The decal only lands where the body faces the front, above the feet, so the
  // belly patch never wraps around the sides or into the foot crease.
  const facing = (x: number, y: number, z: number): boolean => {
    if (z <= 0 || y < FOOT_CREASE) return false;
    const e = 0.5;
    const gx = skin(x + e, y, z) - skin(x - e, y, z);
    const gy = skin(x, y + e, z) - skin(x, y - e, z);
    const gz = skin(x, y, z + e) - skin(x, y, z - e);
    // Facing a little downward still counts: the camera looks down at Glazey,
    // and the belly patch must stay a full oval over the round lower body.
    return gz - 0.6 * gy > FACING * Math.hypot(gx, gy, gz) * 1.17;
  };
  // Open a shallow socket under every face feature (shrunk a little, so the
  // decal's clean outline overlaps the body's voxel edge instead of exposing it).
  grid.forEachVoxel((gx, gy, gz) => {
    const x = gx + 0.5 - ox;
    const y = gy + 0.5;
    const z = gz + 0.5 - oz;
    if (!face(x, y, SOCKET_SHRINK) || !facing(x, y, z)) return;
    if (skin(x, y, z) > -SOCKET_DEPTH) grid.set(gx, gy, gz, 0);
  });
  grid.takeDirty();

  // The face decal: 1/128 m voxels filling each socket and standing just proud
  // of the body (eyes swell into glossy domes), so every outline is a clean
  // curve at character distance while the body keeps sheet density (RF-09).
  const F = FACE_SCALE;
  const faceGrid = new VoxelGrid();
  const fy0 = Math.floor((y0 - ry) * F);
  const fy1 = Math.ceil((y0 + ry * 0.6) * F);
  faceGrid.generate(0, fy0, oz * F, 2 * W * F, fy1, (W + D) * F, (fx, fy, fz) => {
    const x = (fx + 0.5) / F - ox;
    const y = (fy + 0.5) / F;
    const z = (fz + 0.5) / F - oz;
    if (z <= 0) return 0;
    const f = face(x, y, 0);
    if (!f) return 0;
    const d = skin(x, y, z);
    if (d > f.lift || d <= -SOCKET_DEPTH - 0.8 || !facing(x, y, z)) return 0;
    return PALETTE_INDEX[f.color];
  });
  // The rainbow tuft, also at decal density: five rounded sprinkle capsules.
  const ty0 = Math.floor((y0 + ry - 4) * F);
  const ty1 = Math.ceil((y0 + ry + 8) * F);
  faceGrid.generate(
    (ox - 9) * F,
    ty0,
    (oz - 5) * F,
    (ox + 9) * F,
    ty1,
    (oz + 3) * F,
    (fx, fy, fz) => {
      const x = (fx + 0.5) / F - ox;
      const y = (fy + 0.5) / F;
      const z = (fz + 0.5) / F - oz;
      for (let i = 0; i < TUFT.length; i++) {
        if ((tuft[i]?.(x, y, z) ?? 1) <= 0) return PALETTE_INDEX[TUFT[i] ?? 'butter'];
      }
      return 0;
    },
  );
  faceGrid.takeDirty();
  return {
    grid,
    pivot: [ox, 0, oz],
    height: Math.ceil(y0 + ry + 6),
    face: { grid: faceGrid, pivot: [ox * F, 0, oz * F] },
  };
}

/** Face decal voxels per body voxel (1/128 m). */
export const FACE_SCALE = 4;
export const GLAZEY_FACE_VOXEL = GLAZEY_VOXEL / FACE_SCALE;
/** Socket depth under the decal and its inset from the outline (body voxels). */
const SOCKET_DEPTH = 2;
const SOCKET_SHRINK = 0.8;
/** The decal needs a surface facing the front at least this much (normal z). */
const FACING = 0.35;
/** Height of the body–foot crease (body voxels); nothing is painted below it. */
const FOOT_CREASE = 4.6;

interface FaceHit {
  color: VoxelColorName;
  /** How far the decal stands proud of the body surface here (body voxels). */
  lift: number;
}

/**
 * The face, as a lookup in the front projection (x, y in body voxels): eyes,
 * mouth, blush and the cream belly patch. `shrink` insets every outline (the
 * socket test). Layout follows reference 03: eyes high and wide apart, a wide
 * open smile between the cheeks, and the belly patch well below the mouth.
 */
function faceLayout(
  expression: GlazeyExpression,
  t: number,
  rx: number,
  ry: number,
  y0: number,
): (x: number, y: number, shrink: number) => FaceHit | null {
  const open = expression === 'happy' || expression === 'surprised';
  const eyeX = rx * lerp(0.42, 0.33, t);
  const eyeY = y0 + ry * lerp(0.22, 0.14, t) + 1.8;
  const eyeRx = expression === 'surprised' ? 3.5 : 3.2;
  const eyeRy = expression === 'surprised' ? 4.0 : 3.65;
  const mouthY = eyeY - lerp(4.3, 3.9, t);
  const mouthRx = expression === 'surprised' ? 1.6 : expression === 'munch' ? 3.6 : 3.1;
  const mouthRy = expression === 'surprised' ? 2.0 : 2.6;
  const cheekX = eyeX + 2.3;
  const cheekY = mouthY + 0.2;
  const bellyTop = mouthY - mouthRy - 0.6;
  const bellyBot = FOOT_CREASE + 1.2;
  const bellyCy = (bellyTop + bellyBot) / 2;
  const bellyRy = (bellyTop - bellyBot) / 2;
  const bellyRx = rx * lerp(0.48, 0.52, t);
  // Normalized radius inside an ellipse, inset by `s` body voxels.
  const ell = (dx: number, dy: number, ax: number, ay: number, s: number): number =>
    Math.hypot(dx / Math.max(0.1, ax - s), dy / Math.max(0.1, ay - s));
  return (x, y, s) => {
    for (const side of [-1, 1]) {
      const ex = x - side * eyeX;
      const ey = y - eyeY;
      if (open) {
        const r = ell(ex, ey, eyeRx, eyeRy, s);
        if (r <= 1) {
          // A glossy dome: one big glint at the upper left (the key light is
          // fixed in the sheet), a small twinkle low right, a warm lower iris.
          const u = ex / eyeRx;
          const v = ey / eyeRy;
          // At most one body voxel proud, so in profile it reads as part of the head.
          const lift = 0.35 + 0.6 * Math.sqrt(Math.max(0, 1 - r * r));
          if (Math.hypot(u + 0.32, v - 0.36) < 0.27) return { color: 'eyeShine', lift };
          if (Math.hypot(u - 0.36, v + 0.4) < 0.12) return { color: 'eyeShine', lift };
          if (r < 0.5) return { color: 'eyePupil', lift };
          if (v < -0.25 && r > 0.62) return { color: 'eyeIrisLight', lift };
          return { color: 'eyeIris', lift };
        }
      } else {
        // Closed happy eyes: a smooth ^ arc.
        const arc = Math.abs(Math.hypot(ex, (ey + 1.7) * 1.15) - 2.9);
        if (arc < 0.6 - s * 0.5 && ey > -1.1) return { color: 'eyePupil', lift: 0.45 };
      }
      // Blush: a soft oval with a lighter center.
      const c = ell(x - side * cheekX, y - cheekY, 2.5, 1.5, s);
      if (c <= 1) return { color: c < 0.55 ? 'cheekGlow' : 'glazeyCheek', lift: 0.4 };
    }
    // Mouth: a wide open smile (flat-ish top, round bottom), tongue at the bottom.
    const mx = x;
    const my = y - mouthY;
    if (expression === 'surprised') {
      if (ell(mx, my, mouthRx, mouthRy, s) <= 1)
        return { color: my < -mouthRy * 0.45 ? 'tongueSoft' : 'mouthInside', lift: 0.4 };
    } else {
      const top = 0.9 - 0.06 * mx * mx - s;
      if (my < top && ell(mx, my, mouthRx, mouthRy, s) <= 1)
        return { color: my < -mouthRy * 0.4 ? 'tongueSoft' : 'mouthInside', lift: 0.4 };
    }
    // The cream belly patch: an egg below the mouth, narrower on top, so its
    // top edge is a clear convex curve (sheet 03), not a flat bowl rim.
    const by = (y - bellyCy) / bellyRy;
    const egg = bellyRx * (1 - 0.3 * Math.max(-1, Math.min(1, by)));
    if (ell(x, y - bellyCy, egg, bellyRy, s) <= 1) return { color: 'glazeyBellySoft', lift: 0.3 };
    return null;
  };
}
