import { PALETTE_INDEX, hash3, type VoxelColorName } from '../palette';
import { fbm3, valueNoise3, voxelize, type Sdf } from '../sdf';
import { carveSdf, type RemovedVoxel } from '../../engine/voxel/Carve';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';

/**
 * The donut library (GAME_DESIGN §4, K-06, reference 04): all nine flavors,
 * authored in meters and voxelized at any size, so the same donut can be a
 * 1/64 m prop out in the meadow or a 1/128 m close-up hero asset (art bible §3).
 *
 * Every donut is a plump dough body (ring, bar or craggy old-fashioned ring)
 * with a pale fried band around its waist and a toasted underside, under a
 * topping: a glossy frosting cap whose edge droops into tapered, beaded drips,
 * a powdered-sugar dusting, or bands of glaze. `biteDonut` carves the scalloped
 * bite marks of the Munch (K-07) and paints the crumb interior.
 */
export type DonutFlavor =
  | 'strawberry'
  | 'chocolate'
  | 'jelly'
  | 'maple'
  | 'powdered'
  | 'glazed'
  | 'blueberry'
  | 'mystery'
  | 'rainbow';

export const DONUT_FLAVORS: readonly DonutFlavor[] = [
  'strawberry',
  'chocolate',
  'jelly',
  'maple',
  'powdered',
  'glazed',
  'blueberry',
  'mystery',
  'rainbow',
];

type Form = 'ring' | 'bar' | 'craggy';
type Topping = 'frosting' | 'sugar' | 'swirl' | 'rainbow';

interface FlavorLook {
  form: Form;
  topping: Topping;
  top: VoxelColorName;
  side: VoxelColorName;
  sprinkles: boolean;
  /** Typical drip length (meters); 0 for no drips. */
  drip: number;
  /** Frosting thickness (meters). */
  frost: number;
  /** Height of the drip line above the waist (meters). */
  line: number;
  /** Overall scale (the rainbow mega donut is big). */
  scale: number;
  /** Drip count around the outside. */
  segs: number;
}

const look = (l: Partial<FlavorLook> & Pick<FlavorLook, 'top' | 'side'>): FlavorLook => ({
  form: 'ring',
  topping: 'frosting',
  sprinkles: false,
  drip: 0.07,
  frost: 0.024,
  line: 0.022,
  scale: 1,
  segs: 14,
  ...l,
});

const LOOK: Record<DonutFlavor, FlavorLook> = {
  strawberry: look({ top: 'frostingPinkLight', side: 'frostingPink', sprinkles: true }),
  // RF-14: palette-true chocolate drips, nothing but the two chocolates.
  chocolate: look({ top: 'chocolate', side: 'chocolateDark', drip: 0.065 }),
  jelly: look({ top: 'donutSugar', side: 'donutSugar', topping: 'sugar', drip: 0 }),
  maple: look({
    form: 'bar',
    top: 'mapleLight',
    side: 'mapleGlaze',
    drip: 0.095,
    line: 0.045,
    segs: 10,
  }),
  powdered: look({ top: 'donutSugar', side: 'donutSugar', topping: 'sugar', drip: 0 }),
  // Classic glaze: thin, pale and translucent, running far down the sides.
  glazed: look({
    top: 'classicGlaze',
    side: 'classicGlaze',
    drip: 0.05,
    frost: 0.016,
    line: 0.04,
  }),
  // RF-15: soft periwinkle glaze over a craggy, cracked old-fashioned ring.
  blueberry: look({
    form: 'craggy',
    top: 'blueberryLight',
    side: 'blueberry',
    drip: 0.04,
    line: 0.03,
  }),
  mystery: look({ top: 'pastelMint', side: 'pastelLavender', topping: 'swirl', drip: 0.06 }),
  // RF-16: the one sanctioned neon item; it glows softly and stays rare.
  rainbow: look({
    top: 'rainbowYellow',
    side: 'rainbowBlue',
    topping: 'rainbow',
    drip: 0.075,
    scale: 1.3,
    segs: 18,
  }),
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
const SWIRL: VoxelColorName[] = [
  'pastelMint',
  'frostingPinkLight',
  'pastelSky',
  'pastelButter',
  'pastelLavender',
];
const RAINBOW: VoxelColorName[] = [
  'rainbowViolet',
  'rainbowBlue',
  'rainbowGreen',
  'rainbowYellow',
  'rainbowOrange',
  'rainbowRed',
];

/** Width of the split around the jelly (voxels). */
const JELLY_SPLIT = 1.8;

/** Default prop voxel size for donuts out in the world. */
export const DONUT_VOXEL = 1 / 64;
/** Close-up hero asset voxel size (the subject of ground-level shots). */
export const DONUT_HERO_VOXEL = 1 / 128;

// Ring shape in meters: ring radius, tube half-width and half-height.
const RING = 0.235;
const TUBE_A = 0.12;
const TUBE_B = 0.105;
// Maple bar: half length of the straight part, half width and half height.
const BAR_L = 0.27;
const BAR_A = 0.125;
const BAR_B = 0.1;

interface Dims {
  /** Ring radius (0 for the bar). */
  R: number;
  /** Bar half length (0 for rings). */
  L: number;
  a: number;
  b: number;
  frost: number;
}

function dims(flavor: DonutFlavor): Dims {
  const l = LOOK[flavor];
  const s = l.scale;
  return l.form === 'bar'
    ? { R: 0, L: BAR_L * s, a: BAR_A * s, b: BAR_B * s, frost: l.frost * s }
    : { R: RING * s, L: 0, a: TUBE_A * s, b: TUBE_B * s, frost: l.frost * s };
}

/** Model size in voxels for a voxel size (x, y, z); the base sits at y = 0. */
export function donutSize(
  voxel: number,
  flavor: DonutFlavor = 'strawberry',
): [number, number, number] {
  const d = dims(flavor);
  const crag = LOOK[flavor].form === 'craggy' ? 1.16 : 1;
  const w = Math.ceil((2 * (d.R + d.L + d.a * crag + d.frost) + 0.03) / voxel);
  const dz = Math.ceil((2 * (d.R + d.a * crag + d.frost) + 0.03) / voxel);
  const h = Math.ceil((2 * (d.b * crag + d.frost) + 0.03) / voxel);
  return [w + (w & 1), h, dz + (dz & 1)];
}

/** Where a donut's tube center sits above its base (voxels), for bite placement. */
export function donutCenterY(voxel: number, flavor: DonutFlavor = 'strawberry'): number {
  const d = dims(flavor);
  const crag = LOOK[flavor].form === 'craggy' ? 1.16 : 1;
  return (d.b * crag + d.frost) / voxel + 0.5;
}

/**
 * The donut body in voxel units around its tube center. `grow` thickens it (the
 * frosting shell). Returns the signed distance and the radial coordinate `q`
 * (negative toward the hole).
 */
function bodySdf(flavor: DonutFlavor, seed: number, v: number) {
  const d = dims(flavor);
  const form = LOOK[flavor].form;
  const R = d.R / v;
  const L = d.L / v;
  const a0 = d.a / v;
  const b0 = d.b / v;
  return (x: number, y: number, z: number, grow: number): number => {
    let q: number;
    let a = a0 + grow;
    let b = b0 + grow;
    if (form === 'bar') {
      q = Math.hypot(Math.max(Math.abs(x) - L, 0), z);
    } else {
      q = Math.hypot(x, z) - R;
    }
    if (form === 'craggy') {
      // Old-fashioned: rounded lobes around the outside, lumpy everywhere.
      const th = Math.atan2(z, x);
      const petal = 0.5 + 0.5 * Math.cos(th * 12 + seed);
      const out = Math.max(0, q / a0);
      a += a0 * 0.15 * petal * out;
      b += b0 * 0.16 * petal * Math.max(0, 1 - Math.abs(q / a0 - 0.6));
      const n = fbm3(x * 0.09 * v * 64, y * 0.09 * v * 64, z * 0.09 * v * 64, 3, seed + 7);
      const m = fbm3(x * v * 22, y * v * 22, z * v * 22, 2, seed + 11);
      a += ((n - 0.5) * 0.07 + (m - 0.5) * 0.008) / v;
      b += ((n - 0.5) * 0.055 + (m - 0.5) * 0.006) / v;
      // Crags: rounded knobs about 7 cm across (4–6 per quadrant), strongest
      // on the crown, so the top reads as a cracked cake ring, not plain icing.
      const c = fbm3(x * v * 14, y * v * 14, z * v * 14, 2, seed + 19);
      const crown = Math.max(0, Math.min(1, y / b0 + 0.3));
      b += ((c - 0.5) * 0.07 * crown) / v;
      a += ((c - 0.5) * 0.04) / v;
    }
    const k = Math.hypot(q / a, y / b);
    return (k - 1) * Math.min(a, b);
  };
}

/** Perimeter angle used to lay out drips (rings: around the hole; bar: squashed). */
function perimeterAngle(flavor: DonutFlavor, x: number, z: number): number {
  if (LOOK[flavor].form !== 'bar') return Math.atan2(z, x);
  const d = dims(flavor);
  return Math.atan2(z, (x * d.a) / (d.L + d.a));
}

export interface DonutOptions {
  /**
   * Override the flavor's sprinkles. The island's wild chocolate donuts keep the
   * sprinkled look of the M2 diorama; the library flavor is plain (ref 04).
   */
  sprinkles?: boolean;
}

export function buildDonut(
  flavor: DonutFlavor,
  seed = 0,
  voxel = DONUT_VOXEL,
  opts: DonutOptions = {},
): VoxelGrid {
  const grid = new VoxelGrid();
  const lk = { ...LOOK[flavor], sprinkles: opts.sprinkles ?? LOOK[flavor].sprinkles };
  const d = dims(flavor);
  const size = donutSize(voxel, flavor);
  const v = voxel;
  const s = lk.scale;
  const cx = size[0] / 2;
  const cz = size[2] / 2;
  const cy = donutCenterY(voxel, flavor);
  const body = bodySdf(flavor, seed, v);
  const F = d.frost / v;
  const isRing = lk.form !== 'bar';
  const outerSide = (px: number, pz: number): boolean => !isRing || Math.hypot(px, pz) > d.R / v;

  // Drip line (height, in voxels relative to the tube center, below which there
  // is no frosting): a wavy edge just above the waist, with tapered tongues.
  // `bead` is the extra frosting thickness (voxels) at height py: each tongue
  // swells into a rounded bead just above its tip, so drips stand proud of the
  // dough instead of reading as flat painted tabs.
  const drip = (angle: number, outer: boolean): { line: number; bead: (py: number) => number } => {
    const segs = outer ? lk.segs : Math.round(lk.segs * 0.6);
    // Drips run down the outside only; inside the hole they just clutter it.
    const t = ((angle / (Math.PI * 2) + 1) % 1) * segs;
    const k = Math.floor(t);
    const f = t - k;
    let line =
      ((lk.line - 0.01 * Math.sin(angle * 3 + seed) + 0.005 * Math.sin(angle * 11 + seed * 2)) *
        s) /
      v;
    const sd = seed * 13 + (outer ? 0 : 101);
    const len =
      lk.drip === 0 || !outer || hash3(k, sd, 1, 3) < 0.25
        ? 0
        : (0.5 + hash3(k, sd, 2, 3)) * lk.drip * s;
    const half = 0.2 + hash3(k, sd, 3, 3) * 0.2;
    const dx = Math.abs(f - 0.5) / half;
    if (dx >= 1 || len === 0) return { line, bead: () => 0 };
    // Tapered drop: full at the frosting edge, pinching toward a rounded tip.
    const tip = line - len / v;
    line -= (len * Math.pow(1 - dx * dx, 1.4)) / v;
    const r = (0.014 * s) / v;
    const across = Math.max(0, 1 - dx / 0.55);
    return {
      line,
      bead: (py: number) => {
        const u = (py - (tip + r)) / r;
        return u > -1 && u < 1.6
          ? ((0.009 * s) / v) * Math.sqrt(1 - Math.min(1, u * u)) * across
          : 0;
      },
    };
  };

  // Jelly: a glossy squeeze of jam oozing out of a split in the side, with a
  // little run down toward the stand.
  const jt = 0.6 + seed * 0.7;
  const jr = (d.R + d.a * 0.84) / v;
  const jc = { x: Math.cos(jt) * jr, y: 0.022 / v, z: Math.sin(jt) * jr };
  const jelly: Sdf = (x, y, z) => {
    const ex = x - jc.x;
    const ey = y - jc.y;
    const ez = z - jc.z;
    const dr = ex * Math.cos(jt) + ez * Math.sin(jt);
    const dt = -ex * Math.sin(jt) + ez * Math.cos(jt);
    const n = valueNoise3(x * 0.3, y * 0.3, z * 0.3, seed + 3) - 0.5;
    const rt = 0.125 / v;
    const ry = 0.064 / v;
    const rr = 0.07 / v;
    const blob = (Math.hypot(dt / rt, ey / ry, dr / rr) - 1 + n * 0.25) * ry;
    // The run: a short tapered tongue below the blob, hugging the side.
    const run = Math.hypot(dt + 0.02 / v, Math.max(0, -ey - 0.06 / v) * 0.6, dr + 0.006 / v);
    const tongue = ey < 0 && ey > -0.09 / v ? run - (0.02 / v) * (1 + ey / (0.12 / v)) : Infinity;
    return Math.min(blob, tongue);
  };

  const sugar = lk.topping === 'sugar';
  voxelize(
    grid,
    (x, y, z) => {
      const px = x - cx;
      const py = y - cy;
      const pz = z - cz;
      let dd = body(px, py, pz, F);
      if (!sugar && py <= 0) {
        dd -= drip(perimeterAngle(flavor, px, pz), outerSide(px, pz)).bead(py);
      }
      if (flavor === 'jelly') {
        // The jelly bulges out of a split: a narrow groove torn open around it
        // near the surface (dark with AO), then the jelly itself.
        const j = jelly(px, py, pz);
        if (j > 0 && j < JELLY_SPLIT && dd > -3) dd = Math.max(dd, j - JELLY_SPLIT);
        dd = Math.min(dd, j);
      }
      return dd;
    },
    [0, 0, 0],
    size,
    (x, y, z) => {
      const px = x + 0.5 - cx;
      const py = y + 0.5 - cy;
      const pz = z + 0.5 - cz;
      const outer = outerSide(px, pz);
      const inDough = body(px, py, pz, 0) <= 0;
      const h = hash3(x, y, z, seed + 5);
      if (flavor === 'jelly') {
        const j = jelly(px, py, pz);
        if (j <= 0) return j < -1.5 ? PALETTE_INDEX.jellyRed : PALETTE_INDEX.jellyDeep;
        // The dough tears open around the jelly: a toasted rim lining the split.
        if (j < JELLY_SPLIT + 1.6 && inDough) return PALETTE_INDEX.bunToasted;
      }
      if (sugar) {
        // Sugar dusts the top faces only, thinning out down the sides.
        if (!inDough) {
          const n = valueNoise3(px * 0.25, 0, pz * 0.25, seed + 9);
          const edge = (0.32 + (n - 0.5) * 0.3) * (d.b / v) + (h - 0.5) * 2;
          if (py <= edge) return 0;
          return py < edge + 2 || h < 0.18
            ? PALETTE_INDEX.donutSugarShade
            : PALETTE_INDEX.donutSugar;
        }
      } else {
        const dr = drip(perimeterAngle(flavor, px, pz), outer);
        if (py > dr.line) {
          const exposedTop = py > (d.b / v) * 0.72 || !inDough;
          if (!exposedTop && inDough) return doughColor(px, py, pz, outer, inDough, h);
          return PALETTE_INDEX[toppingColor(flavor, lk, px, py, pz, d, v, py > 0, seed)];
        }
      }
      if (!inDough) return 0;
      return doughColor(px, py, pz, outer, inDough, h);
    },
  );

  function doughColor(
    px: number,
    py: number,
    pz: number,
    outer: boolean,
    inDough: boolean,
    h: number,
  ): number {
    if (!inDough) return 0;
    if (py < -(d.b - 0.035 * s) / v) return PALETTE_INDEX.bunToasted;
    // A clean pale fried band around the waist (outer side only), then golden.
    const bandT = Math.abs(py + (0.01 * s) / v) / ((0.026 * s) / v);
    const q = isRing
      ? Math.hypot(px, pz) - d.R / v
      : Math.hypot(Math.max(Math.abs(px) - d.L / v, 0), pz);
    // Soft-edged: a short dither at the band's edges, solid in its middle.
    if (outer && bandT < 1 && q > (d.a - 0.05 * s) / v && h > Math.max(0, bandT - 0.5) * 2)
      return PALETTE_INDEX.bunCrumb;
    if (lk.form === 'craggy') return h > 0.7 ? PALETTE_INDEX.bunToasted : PALETTE_INDEX.bunGolden;
    return PALETTE_INDEX.bunGolden;
  }

  if (lk.form === 'craggy') crackGlaze(grid, cx, cz, seed, v);
  if (lk.sprinkles) scatterSprinkles(grid, lk, size, cx, cy, cz, seed, v);
  grid.takeDirty();
  return grid;
}

function toppingColor(
  flavor: DonutFlavor,
  lk: FlavorLook,
  px: number,
  py: number,
  pz: number,
  d: Dims,
  v: number,
  top: boolean,
  seed: number,
): VoxelColorName {
  if (lk.topping === 'swirl') {
    // Pastel spiral bands winding around the ring.
    const th = Math.atan2(pz, px);
    const q = (Math.hypot(px, pz) - d.R / v) / (d.a / v);
    // Whole bands per revolution, so the spiral has no seam where atan2 wraps.
    const t = (th / (Math.PI * 2)) * SWIRL.length + q * 1.6 + seed * 0.37 + py * 0.02;
    return SWIRL[((Math.floor(t) % SWIRL.length) + SWIRL.length) % SWIRL.length] ?? lk.top;
  }
  if (lk.topping === 'rainbow') {
    // Drips take the color of the band they run from (the outer bands), so no
    // stray-colored slabs hang under the red edge (ref 04 Ignore list).
    // Concentric bands across the tube, inner violet to outer red.
    // Even bands by angle around the tube's cross-section: violet lines the
    // hole, red the outer edge, and each band gets the same arc of icing.
    const phi = Math.atan2(py, Math.hypot(px, pz) - d.R / v);
    const i = Math.floor(((Math.PI - phi) / Math.PI) * RAINBOW.length);
    return RAINBOW[Math.min(RAINBOW.length - 1, Math.max(0, i))] ?? lk.top;
  }
  if (flavor === 'blueberry') {
    // Deeper glaze pooled low in the crags, lighter on the crowns.
    const crown = py / ((d.b + d.frost) / v);
    if (crown < 0.35) return 'blueberryShadow';
    if (crown > 0.8) return 'blueberryLight';
    return 'blueberry';
  }
  if (flavor === 'glazed') {
    // Translucent glaze: where it runs thin down the sides and drips, the golden
    // dough glows through it.
    const t = -py / (d.b / v);
    const n = valueNoise3(px * 0.12, py * 0.12, pz * 0.12, seed + 4);
    // An even amber sheet on the crown, thinning golden down the slopes and drips.
    return t + n * 0.15 > 0.12 ? 'classicGlazeThin' : 'classicGlaze';
  }
  return top ? lk.top : lk.side;
}

/**
 * Old-fashioned cracks: short, irregular fissures where the glaze thins over
 * the valleys between the crags (reference 04). Color only: the glaze lightens
 * along a wobbly seam that tapers at both ends, so no straight slot or hole
 * ever opens to the dough.
 */
function crackGlaze(grid: VoxelGrid, cx: number, cz: number, seed: number, v: number): void {
  const glaze = new Set([
    PALETTE_INDEX.blueberry,
    PALETTE_INDEX.blueberryLight,
    PALETTE_INDEX.blueberryShadow,
  ]);
  const crackAt = (x: number, y: number, z: number): number => {
    const px = x + 0.5 - cx;
    const pz = z + 0.5 - cz;
    const th = Math.atan2(pz, px);
    const q = (Math.hypot(px, pz) - RING / v) / (TUBE_A / v);
    if (q < 0.3 || q > 0.95) return 1;
    const wob = (valueNoise3(px * 0.18, y * 0.18, pz * 0.18, seed + 21) - 0.5) * 0.9;
    const ph = th * 9 + seed + wob;
    const k = Math.round((ph - Math.PI) / (Math.PI * 2));
    if (hash3(k, seed, 5, 33) < 0.5) return 1;
    const taper = Math.sin(((q - 0.3) / 0.65) * Math.PI);
    return (1 + Math.cos(ph)) / Math.max(0.05, taper * taper);
  };
  const seam: [number, number, number][] = [];
  grid.forEachVoxel((x, y, z, c) => {
    if (glaze.has(c) && grid.get(x, y + 1, z) === 0 && crackAt(x, y, z) < 0.02)
      seam.push([x, y, z]);
  });
  for (const [x, y, z] of seam) grid.set(x, y, z, PALETTE_INDEX.blueberryLight);
}

/**
 * Sprinkles: 1×1×3 capsules lying flat on the cap in 90° steps (art bible §5),
 * never stacked, with a gap around each.
 */
function scatterSprinkles(
  grid: VoxelGrid,
  lk: FlavorLook,
  size: readonly number[],
  cx: number,
  cy: number,
  cz: number,
  seed: number,
  v: number,
): void {
  const frosting = new Set([PALETTE_INDEX[lk.top], PALETTE_INDEX[lk.side]]);
  const want = Math.round(34 * Math.pow((1 / 32 / v) * 0.9, 2) * lk.scale * lk.scale);
  let placed = 0;
  for (let i = 0; i < want * 8 && placed < want; i++) {
    const ang = hash3(i, seed, 1, 23) * Math.PI * 2;
    const rad =
      (RING * lk.scale + (hash3(i, seed, 2, 23) * 2 - 1) * (TUBE_A * lk.scale - 0.03)) / v;
    const x = Math.floor(cx + Math.cos(ang) * rad);
    const z = Math.floor(cz + Math.sin(ang) * rad);
    let y = (size[1] ?? 0) - 1;
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
        [-1, 0, 1].every((w) => grid.get(x + (alongX ? u : w), y + 1, z + (alongX ? w : u)) === 0),
      );
    if (!ok) continue;
    const color = PALETTE_INDEX[SPRINKLES[(i * 5 + seed) % SPRINKLES.length] ?? 'sprinkleRed'];
    for (let k = -1; k <= 1; k++) {
      grid.set(x + (alongX ? k : 0), y + 1, z + (alongX ? 0 : k), color);
    }
    placed++;
  }
}

// ---------------------------------------------------------------------------
// The Munch (K-07): scalloped bite marks with a crumb interior.

export interface Bite {
  /** Direction the bite comes from (radians around the donut, in the XZ plane). */
  angle: number;
  /** Bite radius in meters (a bite takes about a third of a donut). */
  radius?: number;
}

/**
 * A bite as a signed distance in voxel units around the donut's base center:
 * a squashed jaw-sized ball that reaches in from outside the rim, unioned with a
 * row of small tooth balls along its edge, so the cut is scalloped (K-07).
 */
export function biteSdf(
  flavor: DonutFlavor,
  bite: Bite,
  voxel: number,
  center: readonly [number, number, number],
  seed = 0,
): Sdf {
  const d = dims(flavor);
  const v = voxel;
  const reach = d.R + d.L + d.a + d.frost;
  const R = (bite.radius ?? 0.2 * LOOK[flavor].scale) / v;
  const dirX = Math.cos(bite.angle);
  const dirZ = Math.sin(bite.angle);
  // The jaw center sits just outside the rim.
  const jx = center[0] + dirX * (reach / v + R * 0.05);
  const jz = center[2] + dirZ * (reach / v + R * 0.05);
  const jy = center[1];
  const tooth = R * 0.2;
  const teeth: [number, number][] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    // Teeth along the inner arc of the jaw (facing the donut).
    const a = bite.angle + Math.PI + ((i / (n - 1)) * 2 - 1) * 1.05;
    const j = (hash3(i, seed, 1, 41) - 0.5) * 0.12;
    teeth.push([jx + Math.cos(a + j) * R * 0.9, jz + Math.sin(a + j) * R * 0.9]);
  }
  return (x, y, z) => {
    const dy = (y - jy) / 1.6;
    const jaw = Math.hypot(x - jx, dy, z - jz) - R * 0.88;
    let t = Infinity;
    for (const [tx, tz] of teeth) t = Math.min(t, Math.hypot(x - tx, dy * 0.9, z - tz) - tooth);
    // Torn crumb: a lumpy, pitted break rather than a clean cut.
    const n = valueNoise3(x * 0.45, y * 0.45, z * 0.45, seed + 17) - 0.5;
    const m = valueNoise3(x * 1.1, y * 1.1, z * 1.1, seed + 19) - 0.5;
    return Math.min(jaw, t) - n * 1.3 - m * 0.6;
  };
}

/**
 * Carves a bite out of a donut grid built by `buildDonut` (same flavor and
 * voxel size), then paints the freshly exposed dough as airy crumb with pores.
 * Returns the removed voxels (crumb particles for the Munch, M5).
 */
export function biteDonut(
  grid: VoxelGrid,
  flavor: DonutFlavor,
  bite: Bite,
  voxel: number,
  seed = 0,
): RemovedVoxel[] {
  const size = donutSize(voxel, flavor);
  const center: [number, number, number] = [size[0] / 2, donutCenterY(voxel, flavor), size[2] / 2];
  const sdf = biteSdf(flavor, bite, voxel, center, seed);
  const max: [number, number, number] = [size[0], size[1], size[2]];
  const removed = carveSdf(grid, sdf, [0, 0, 0], max);
  const dough = new Set([
    PALETTE_INDEX.bunGolden,
    PALETTE_INDEX.bunToasted,
    PALETTE_INDEX.bunCrumb,
  ]);
  grid.forEachVoxel((x, y, z, c) => {
    if (!dough.has(c)) return;
    const dd = sdf(x + 0.5, y + 0.5, z + 0.5);
    if (dd > 2.2 || dd < 0) return;
    // Light, open crumb: pale gold with small single-voxel pores, never big
    // dark patches (AO alone deepens the pits).
    const h = hash3(x, y, z, seed + 13);
    grid.set(x, y, z, h > 0.84 ? PALETTE_INDEX.crumbFreshPore : PALETTE_INDEX.crumbFresh);
  });
  grid.takeDirty();
  return removed;
}

/**
 * Crumbs that fell from a bite (K-07): small lumpy clusters of crumb and crust
 * resting on a surface at height `y` (voxels), scattered around (cx, cz) and
 * biased toward `angle` (the side the bite came from).
 */
export function scatterCrumbs(
  grid: VoxelGrid,
  cx: number,
  y: number,
  cz: number,
  count: number,
  spread: number,
  angle: number,
  seed = 0,
): void {
  const colors = [
    PALETTE_INDEX.doughCrumb,
    PALETTE_INDEX.doughGolden,
    PALETTE_INDEX.crumbPore,
    PALETTE_INDEX.doughToasted,
  ];
  for (let i = 0; i < count; i++) {
    const a = angle + (hash3(i, seed, 1, 71) - 0.5) * 2.2;
    const r = spread * Math.sqrt(hash3(i, seed, 2, 71));
    const x = Math.round(cx + Math.cos(a) * r);
    const z = Math.round(cz + Math.sin(a) * r);
    // 1–3 voxel lumps: a base and a random cap.
    const big = hash3(i, seed, 3, 71);
    const w = big > 0.75 ? 3 : big > 0.35 ? 2 : 1;
    for (let dx = 0; dx < w; dx++)
      for (let dz = 0; dz < w; dz++)
        for (let dy = 0; dy < w; dy++) {
          if (hash3(x + dx, y + dy, z + dz, seed + 72) < (dy === 0 ? 0.15 : 0.45)) continue;
          const c = colors[Math.floor(hash3(x + dx, y + dy, z + dz, 73) * colors.length)] ?? 0;
          grid.set(x + dx, y + dy, z + dz, c);
        }
  }
}
