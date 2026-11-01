import { PALETTE_INDEX, hash3, type VoxelColorName } from '../palette';
import { smoothUnion, type Sdf } from '../sdf';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * Glazey (art bible §7, reference 03, D-01, RF-09–RF-13): a squishy coral
 * creature at character-sheet density (1/32 m voxels, about 32 voxels tall at
 * belly 0). Coral from every angle, a cream belly, pink blush, big glossy eyes
 * with white glints, a happy open mouth, a 5-stripe rainbow sprinkle tuft, two
 * stubby arms and two feet, and nothing else (no tail, no labels).
 *
 * Glazey is built as separate parts for bone-less procedural animation (PLAN
 * M4): the body, two arms, two feet, plus the face decal and the tuft at
 * 1/128 m. Every part carries its joint (where it hangs on the rig) and an
 * analytic normal field, so the rounded skin shades as one plush surface while
 * the cubes still show in the silhouette and the per-voxel color jitter.
 *
 * Belly stages 0–5 are clearly distinct silhouettes: a pear-shaped bean at 0,
 * rounder and wider with a growing belly, and a perfectly round ball at 5.
 * Model space is in body voxels: +z is the front (face), +y up, the soles on y = 0.
 */
export const GLAZEY_VOXEL = 1 / 32;
/** Face decal and tuft voxels per body voxel (1/128 m). */
export const FACE_SCALE = 4;
export const GLAZEY_FACE_VOXEL = GLAZEY_VOXEL / FACE_SCALE;

export type GlazeyExpression = 'happy' | 'bliss' | 'surprised' | 'munch' | 'burp';
export type GlazeyPartName = 'body' | 'face' | 'tuft' | 'armL' | 'armR' | 'footL' | 'footR';

/** Smooth-shading normal at a point in a part's grid coordinates (voxel units). */
export type NormalField = (x: number, y: number, z: number) => [number, number, number];

export interface GlazeyPart {
  grid: VoxelGrid;
  voxel: number;
  /** The joint in the part's own grid coordinates. */
  pivot: [number, number, number];
  /** Where the joint sits in model space (body voxels). */
  joint: [number, number, number];
  normal: NormalField;
}

export interface GlazeyModel {
  parts: Record<GlazeyPartName, GlazeyPart>;
  /** Height in body voxels, tuft included. */
  height: number;
  /** Body half extents and center height (body voxels): the rig's proportions. */
  body: { rx: number; ry: number; rz: number; y0: number };
  /** The middle of the mouth on the face (body voxels): where a munched donut goes. */
  mouth: Vec3;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
type Vec3 = [number, number, number];

/** Ellipsoid (approximate distance, exact sign). */
const ellipsoid =
  (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): Sdf =>
  (x, y, z) => {
    const k = Math.hypot((x - cx) / rx, (y - cy) / ry, (z - cz) / rz);
    return (k - 1) * Math.min(rx, ry, rz);
  };

/** A cone from a (radius r0) to b (radius r1) with round ends. */
const roundCone =
  (a: Readonly<Vec3>, b: Readonly<Vec3>, r0: number, r1: number): Sdf =>
  (x, y, z) => {
    const px = x - a[0];
    const py = y - a[1];
    const pz = z - a[2];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const h = clamp((px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
    return Math.hypot(px - dx * h, py - dy * h, pz - dz * h) - lerp(r0, r1, h);
  };

/** Normalized central-difference gradient of an SDF. */
function gradient(f: Sdf, x: number, y: number, z: number, e = 0.6): Vec3 {
  const gx = f(x + e, y, z) - f(x - e, y, z);
  const gy = f(x, y + e, z) - f(x, y - e, z);
  const gz = f(x, y, z + e) - f(x, y, z - e);
  const l = Math.hypot(gx, gy, gz) || 1;
  return [gx / l, gy / l, gz / l];
}

/**
 * Bakes a part: `sdf` and `paint` work in part-local body voxels (the joint at
 * the origin), sampled at `scale` grid voxels per body voxel inside [lo, hi].
 */
function bakePart(
  sdf: Sdf,
  lo: Readonly<Vec3>,
  hi: Readonly<Vec3>,
  scale: number,
  joint: Vec3,
  paint: (x: number, y: number, z: number) => number,
  normalOf: (x: number, y: number, z: number) => Vec3 = (x, y, z) => gradient(sdf, x, y, z),
): GlazeyPart {
  const grid = new VoxelGrid();
  const pivot: Vec3 = [
    Math.ceil(-lo[0] * scale),
    Math.ceil(-lo[1] * scale),
    Math.ceil(-lo[2] * scale),
  ];
  const local = (g: number, axis: 0 | 1 | 2): number => (g - pivot[axis]) / scale;
  grid.generate(
    0,
    0,
    0,
    pivot[0] + Math.ceil(hi[0] * scale),
    pivot[1] + Math.ceil(hi[1] * scale),
    pivot[2] + Math.ceil(hi[2] * scale),
    (gx, gy, gz) => {
      const x = local(gx + 0.5, 0);
      const y = local(gy + 0.5, 1);
      const z = local(gz + 0.5, 2);
      return sdf(x, y, z) <= 0 ? paint(x, y, z) : 0;
    },
  );
  grid.takeDirty();
  return {
    grid,
    voxel: GLAZEY_VOXEL / scale,
    pivot,
    joint,
    normal: (gx, gy, gz) => normalOf(local(gx, 0), local(gy, 1), local(gz, 2)),
  };
}

const TUFT: VoxelColorName[] = [
  'sprinkleRed',
  'sprinkleOrange',
  'sprinkleYellow',
  'sprinkleGreen',
  'sprinkleBlue',
];

/** Glazey's height in body voxels at a belly stage (tuft included), without building him. */
export function glazeyHeight(belly: number): number {
  const t = clamp(belly, 0, 5) / 5;
  const ry = lerp(13.2, 17.5, t);
  const feetH = lerp(2.6, 1.6, t);
  return Math.ceil(feetH + 2 * ry + 6);
}

export function buildGlazey(belly = 0, expression: GlazeyExpression = 'happy'): GlazeyModel {
  const t = clamp(belly, 0, 5) / 5;
  // Body half extents: a bottom-heavy bean at belly 0, a ball at belly 5.
  const rx = lerp(11, 17.5, t);
  const ry = lerp(13.2, 17.5, t);
  const rz = lerp(10, 17.5, t);
  // The body's underside clears the ground by this much; the feet fill the gap.
  const feetH = lerp(2.6, 1.6, t);
  const y0 = feetH + ry;
  const pear = 0.05 * (1 - t);
  // The crown is a soft rounded box (sheet 03), not a gumdrop cone: above the
  // middle the vertical term is raised to a higher power, flattening the top.
  // It relaxes back to a plain sphere at belly 5 ("perfectly round").
  const crown = lerp(3.2, 2, t);
  const halfWidth = (y: number): number => rx * (1 - pear * clamp((y - y0) / ry, -1, 1));
  const bean: Sdf = (x, y, z) => {
    const ny = clamp((y - y0) / ry, -1, 1);
    const w = rx * (1 - pear * ny);
    const d = rz * (1 - pear * 0.6 * ny);
    const vy = Math.abs(y - y0) / ry;
    const ey = y > y0 ? Math.pow(vy, crown / 2) : vy;
    const k = Math.hypot(x / w, ey, z / d);
    return (k - 1) * Math.min(w, ry, d);
  };
  // The belly: a real swell in the body (sheet 03 "SIDE"), shaped and placed
  // exactly under the cream oval, so the patch shades and silhouettes like a
  // round tummy (geometry) instead of a sticker on the bean.
  const tummy = bellyLayout(t, rx, ry, y0);
  const bellyDepth = lerp(4.5, 6, t);
  const bellyFront =
    rz * Math.sqrt(Math.max(0, 1 - ((tummy.cy - y0) / ry) ** 2)) + lerp(0.4, 0.8, t);
  const bellyC: Vec3 = [0, tummy.cy, bellyFront - bellyDepth];
  const bellyR = Math.max(tummy.rx, tummy.ry);
  const skin = smoothUnion(
    bean,
    ellipsoid(bellyC[0], bellyC[1], bellyC[2], tummy.rx + 1, tummy.ry + 1, bellyDepth),
    3,
  );

  // --- Body: plain coral, with shallow sockets under the face decal. ---
  const face = faceLayout(expression, t, rx, ry, y0);
  const facing = (x: number, y: number, z: number, min: number): boolean => {
    if (z <= 0 || y < FOOT_CREASE) return false;
    const [gx, gy, gz] = gradient(skin, x, y, z, 0.5);
    // The gallery and gameplay cameras look down at Glazey, so a surface tilted
    // up still faces the viewer (the upper belly), and one tilted down does not.
    return gz + 0.3 * gy > min * Math.hypot(gx, gy, gz);
  };
  const decalHere = (x: number, y: number, z: number, shrink: number): FaceHit | null => {
    const f = face(x, y, shrink);
    if (!f || !facing(x, y, z, f.facing)) return null;
    // Toward the sides of the head the decal sinks flush, so in a 3/4 or side
    // view nothing stands proud of the silhouette (the far eye).
    const [, , gz] = gradient(skin, x, y, z, 0.5);
    const flush = clamp((gz - 0.45) / 0.35, 0, 1);
    return { ...f, lift: f.lift * flush };
  };
  const W = rx + 2;
  const D = Math.max(rz, bellyC[2] + bellyR) + 2;
  const body = bakePart(
    (x, y, z) => {
      const d = skin(x, y, z);
      // Open a shallow socket under every face feature (shrunk a little, so the
      // decal's clean outline overlaps the body's voxel edge instead of exposing it).
      if (d <= 0 && d > -SOCKET_DEPTH && decalHere(x, y, z, SOCKET_SHRINK)) return 1;
      return d;
    },
    [-W, 0, -rz - 2],
    [W, y0 + ry + 1, D],
    1,
    [0, 0, 0],
    () => PALETTE_INDEX.glazeyBody,
    (x, y, z) => gradient(skin, x, y, z),
  );

  // --- Face decal (1/128 m): eyes, mouth, blush and the raised belly patch,
  // filling each socket and standing just proud of the body. ---
  const decal = bakePart(
    (x, y, z) => {
      if (z <= 0) return 1;
      const f = decalHere(x, y, z, 0);
      if (!f) return 1;
      const d = skin(x, y, z);
      return d > f.lift || d <= -SOCKET_DEPTH - 0.8 ? 1 : -1;
    },
    [-W, FOOT_CREASE, 0],
    [W, y0 + ry * 0.6, D],
    FACE_SCALE,
    [0, 0, 0],
    (x, y) => PALETTE_INDEX[face(x, y, 0)?.color ?? 'glazeyBody'],
    (x, y, z) => {
      // The skin normal, tilted by the slope of the feature's dome (eyes, belly).
      const [gx, gy, gz] = gradient(skin, x, y, z);
      const f = face(x, y, 0);
      const nx = gx - (f?.slope[0] ?? 0);
      const ny = gy - (f?.slope[1] ?? 0);
      const l = Math.hypot(nx, ny, gz) || 1;
      return [nx / l, ny / l, gz / l];
    },
  );

  // --- Tuft (1/128 m): five rounded sprinkle capsules fanned on the crown. ---
  const crownY = y0 + ry;
  const strands = TUFT.map((_, i) => {
    const a = ((i - 2) / 2) * 0.62;
    const bx = Math.sin(a) * 2.2;
    const bz = Math.abs(i - 2) * 0.3;
    const len = 6.2 - Math.abs(i - 2) * 0.6;
    return roundCone([bx, 0, bz], [bx + Math.sin(a) * len, Math.cos(a) * len, bz - 1], 1.35, 1.35);
  });
  const tuftSdf: Sdf = (x, y, z) => Math.min(...strands.map((s) => s(x, y, z)));
  const tuft = bakePart(
    tuftSdf,
    [-9, -1.6, -3],
    [9, 8, 2],
    FACE_SCALE,
    [0, crownY - 1.5, -1],
    (x, y, z) => {
      let best = 0;
      let bd = Infinity;
      strands.forEach((s, i) => {
        const d = s(x, y, z);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return PALETTE_INDEX[TUFT[best] ?? 'sprinkleRed'];
    },
  );

  // --- Arms: short tapered nubs hung at the shoulders, angled down and out
  // (sheet 03), flattened front to back so they stay inside the side profile. ---
  const shoulderY = y0 - ry * lerp(0.08, 0.12, t);
  const armLen = lerp(5, 4.6, t);
  const arm = (s: number): GlazeyPart => {
    const a = (lerp(48, 42, t) * Math.PI) / 180;
    const tip: Vec3 = [s * Math.cos(a) * armLen, -Math.sin(a) * armLen, -0.4];
    const cone = roundCone([0, 0, 0], tip, 2.9, 2.35);
    const sdf: Sdf = (x, y, z) => cone(x, y, z / 0.82) * 0.82;
    return bakePart(
      sdf,
      [s > 0 ? -4 : -armLen - 4, -armLen - 4, -4],
      [s > 0 ? armLen + 4 : 4, 4, 4],
      1,
      [s * (halfWidth(shoulderY) - 1.1), shoulderY, rz * 0.02],
      () => PALETTE_INDEX.glazeyBody,
    );
  };

  // --- Feet: two rounded ovals with flat soles, peeking out under the front. ---
  const foot = (s: number): GlazeyPart => {
    const oval = ellipsoid(0, 2.2, 0.9, 3.8, 3.0, 4.9);
    const sdf: Sdf = (x, y, z) => Math.max(oval(x, y, z), -y);
    return bakePart(
      sdf,
      [-5, 0, -5],
      [5, 6, 7],
      1,
      [s * rx * lerp(0.45, 0.38, t), 0, rz * lerp(0.12, 0.18, t)],
      () => PALETTE_INDEX.glazeyBody,
    );
  };

  return {
    parts: {
      body,
      face: decal,
      tuft,
      armL: arm(-1),
      armR: arm(1),
      footL: foot(-1),
      footR: foot(1),
    },
    height: Math.ceil(crownY + 6),
    body: { rx, ry, rz, y0 },
    mouth: (() => {
      const { mouthY } = mouthLayout(t, rx, ry, y0);
      const front = rz * Math.sqrt(Math.max(0, 1 - ((mouthY - y0) / ry) ** 2));
      return [0, mouthY, front] as Vec3;
    })(),
  };
}

/** Mouth height and half height for the open smile (body voxels). */
function mouthLayout(t: number, rx: number, ry: number, y0: number) {
  const eyeY = y0 + ry * lerp(0.22, 0.14, t) + 1.8;
  return { eyeX: rx * lerp(0.4, 0.31, t), eyeY, mouthY: eyeY - lerp(4.3, 3.9, t) };
}

/**
 * The cream belly oval in the front projection (body voxels), shared by the
 * body swell and the decal: an upright oval (sheet 03 "FRONT", M3 final)
 * starting just under the smile, about 60 % of the body width.
 */
function bellyLayout(t: number, rx: number, ry: number, y0: number) {
  const { mouthY } = mouthLayout(t, rx, ry, y0);
  const top = mouthY - 2.6 - 0.25;
  const halfH = ry * lerp(0.36, 0.38, t);
  return { cy: top - halfH, rx: rx * lerp(0.5, 0.52, t), ry: halfH };
}

/** Socket depth under the decal and its inset from the outline (body voxels). */
const SOCKET_DEPTH = 2;
const SOCKET_SHRINK = 0.8;
/** Height of the body–foot crease (body voxels); nothing is painted below it. */
const FOOT_CREASE = 4.6;

interface FaceHit {
  color: VoxelColorName;
  /** How far the decal stands proud of the body surface here (body voxels). */
  lift: number;
  /** d(lift)/dx and d(lift)/dy: the dome slope that tilts the shading normal. */
  slope: [number, number];
  /** How squarely the surface must face the front for this feature to land. */
  facing: number;
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
  const { eyeX, eyeY } = mouthLayout(t, rx, ry, y0);
  const eyeRx = expression === 'surprised' ? 3.4 : 3.1;
  const eyeRy = expression === 'surprised' ? 3.9 : 3.55;
  const mouthY = eyeY - lerp(4.3, 3.9, t);
  const round = expression === 'surprised' || expression === 'burp';
  // The giant burp (sheet 03): a wide round "O", eyes squeezed shut.
  const mouthRx =
    expression === 'burp'
      ? 3.0
      : expression === 'surprised'
        ? 1.6
        : expression === 'munch'
          ? 3.6
          : 3.1;
  const mouthRy = expression === 'burp' ? 3.1 : expression === 'surprised' ? 2.0 : 2.6;
  const cheekX = eyeX + 2.3;
  const cheekY = mouthY + 0.2;
  const tummy = bellyLayout(t, rx, ry, y0);
  // Normalized radius inside an ellipse, inset by `s` body voxels.
  const ell = (dx: number, dy: number, ax: number, ay: number, s: number): number =>
    Math.hypot(dx / Math.max(0.1, ax - s), dy / Math.max(0.1, ay - s));
  /** A dome of height h over an ellipse: lift and slope at (dx, dy). */
  const dome = (
    dx: number,
    dy: number,
    ax: number,
    ay: number,
    base: number,
    h: number,
  ): Pick<FaceHit, 'lift' | 'slope'> => {
    const r2 = (dx / ax) ** 2 + (dy / ay) ** 2;
    return {
      lift: base + h * Math.max(0, 1 - r2),
      slope: [(-2 * h * dx) / (ax * ax), (-2 * h * dy) / (ay * ay)],
    };
  };
  const flat = (lift: number): Pick<FaceHit, 'lift' | 'slope'> => ({ lift, slope: [0, 0] });
  return (x, y, s) => {
    for (const side of [-1, 1]) {
      const ex = x - side * eyeX;
      const ey = y - eyeY;
      if (open) {
        const r = ell(ex, ey, eyeRx, eyeRy, s);
        if (r <= 1) {
          // A glossy dome, at most about half a body voxel proud so in profile it
          // stays inside the head: one big glint at the upper left (the sheet's
          // key light), a small twinkle low right, and a clean warm crescent
          // in the lower iris (no dither, so the gloss reads unbroken).
          const u = ex / eyeRx;
          const v = ey / eyeRy;
          const hit = { ...dome(ex, ey, eyeRx, eyeRy, 0.3, 0.3), facing: 0.45 };
          if (Math.hypot(u + 0.32, v - 0.36) < 0.27) return { ...hit, color: 'eyeShine' };
          if (Math.hypot(u - 0.36, v + 0.4) < 0.12) return { ...hit, color: 'eyeShine' };
          if (r < 0.5) return { ...hit, color: 'eyePupil' };
          if (v < -0.25 && r > 0.62) return { ...hit, color: 'eyeIrisLight' };
          return { ...hit, color: 'eyeIris' };
        }
      } else {
        // Closed happy eyes (sheet 03 "munching", "giant burp"): a thin,
        // warm-brown ^ arc, laid flush and only where the head faces the
        // viewer squarely, so in a 3/4 view it never stands past the outline.
        const arc = Math.abs(Math.hypot(ex, (ey + 2.1) * 1.05) - 2.7);
        if (arc < 0.42 - s * 0.4 && ey > -0.5)
          return { color: 'eyeIris', ...flat(0.15), facing: 0.62 };
      }
      // Blush: a soft oval with a lighter center.
      const c = ell(x - side * cheekX, y - cheekY, 2.5, 1.5, s);
      if (c <= 1)
        return { color: c < 0.55 ? 'cheekGlow' : 'glazeyCheek', ...flat(0.3), facing: 0.35 };
    }
    // Mouth: a wide open smile (flat-ish top, round bottom), tongue at the bottom.
    const mx = x;
    const my = y - mouthY;
    if (round) {
      if (ell(mx, my, mouthRx, mouthRy, s) <= 1)
        return {
          color: my < -mouthRy * 0.45 ? 'tongueSoft' : 'mouthInside',
          ...flat(0.35),
          facing: 0.35,
        };
    } else {
      // An upturned smile: the top edge rises toward the corners.
      const top = 0.2 + 0.11 * mx * mx - s;
      if (my < top && ell(mx, my, mouthRx, mouthRy, s) <= 1)
        return {
          color: my < -mouthRy * 0.4 ? 'tongueSoft' : 'mouthInside',
          ...flat(0.35),
          facing: 0.35,
        };
    }
    // The cream belly patch: a clean oval laid flush over the body's belly
    // swell, so its shading comes from that round geometry; slightly
    // narrower on top, with a faint dome for a soft highlight.
    const dy = y - tummy.cy;
    const egg = tummy.rx * (1 - 0.1 * clamp(dy / tummy.ry, -1, 1));
    const r = ell(x, dy, egg, tummy.ry, s);
    if (r <= 1) {
      // A soft, slightly broken seam into the coral instead of a cut edge.
      const seam = r > 0.84 + 0.08 * hash3(Math.floor(x * 3), Math.floor(y * 3), 0, 29);
      return {
        color: seam ? 'glazeyBellyEdge' : 'glazeyBellySoft',
        ...dome(x, dy, egg, tummy.ry, 0.3, 0.3),
        facing: -0.1,
      };
    }
    return null;
  };
}
