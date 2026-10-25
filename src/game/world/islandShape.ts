import { fbm3, valueNoise3 } from '../../art/sdf';
import { hash3 } from '../../art/palette';

/**
 * The M2 Glaze Meadows diorama: a small, complete donut-ring island (RF-01)
 * about 30 m across, floating in a pastel sky. This module is the continuous
 * shape (meters, island centered at the origin, y = 0 is the milk surface);
 * `IslandTerrain.ts` voxelizes it at two resolutions.
 *
 * Everything here is deterministic and cheap to evaluate per column.
 */

export const MILK_LEVEL = 0;
/** Base meadow height above the milk. */
export const TOP_BASE = 0.85;
/** Lagoon floor under the milk. */
export const LAGOON_FLOOR = -1.1;

/** Smooth periodic noise around the ring: a fixed sum of sines (ported to GLSL in Water.ts). */
export const RING_WAVES: readonly (readonly [number, number, number])[] = [
  // [harmonic, amplitude, phase]
  [2, 0.45, 0.7],
  [3, 0.3, 2.1],
  [5, 0.18, 4.0],
  [7, 0.1, 1.3],
  [11, 0.05, 5.2],
];

export function ringWave(theta: number, phaseShift = 0): number {
  let s = 0;
  for (const [k, a, p] of RING_WAVES) s += a * Math.sin(k * theta + p + phaseShift * k);
  return s;
}

/** Inner (lagoon) radius of the ring at angle θ. */
export const INNER_BASE = 5.0;
export const INNER_AMP = 0.4;
export const OUTER_BASE = 11.5;
export const innerRadius = (theta: number): number => INNER_BASE + INNER_AMP * ringWave(theta, 0);
/** Outer (sky) radius of the ring at angle θ. */
export const outerRadius = (theta: number): number => OUTER_BASE + 0.45 * ringWave(theta, 1.7);

const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A flat pad for a building: blends the ground to `height` inside `radius`. */
export interface Pad {
  x: number;
  z: number;
  radius: number;
  height: number;
}

/** A raised bump: frosting hills and the powdered-sugar mountain. */
export interface Mound {
  x: number;
  z: number;
  radius: number;
  height: number;
  kind: 'meadow' | 'frosting' | 'sugar';
}

export interface IslandLayout {
  pads: Pad[];
  mounds: Mound[];
  falls: SyrupFall[];
}

/** Signed smallest difference between two angles (radians). */
export const angleDiff = (a: number, b: number): number => {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

/** Outer wall radius at height y: the dough side bows out like a fat donut, with crumb. */
export function outerWall(ro: number, theta: number, y: number, top: number): number {
  const t = (y + 1.2) / (top + 1.2);
  const bulge = t > 0 && t < 1 ? 0.34 * Math.sin(Math.PI * Math.pow(t, 0.8)) : 0;
  const crumb = (valueNoise3(theta * ro * 2.6, y * 2.6, 0, 61) - 0.5) * 0.2;
  return ro + bulge + crumb;
}

/** Inner (lagoon) wall radius at height y, with a little crumb. */
export function innerWall(ri: number, theta: number, y: number): number {
  return ri + (valueNoise3(theta * ri * 5, y * 5, 0, 63) - 0.5) * 0.07;
}

/** Ground material zones on top of the ring. */
export const enum Zone {
  Meadow = 0,
  Frosting = 1,
  Path = 2,
  Sugar = 3,
  Rock = 4,
  Syrup = 5,
}

/** A syrup fall: an amber stream from a channel on the rim down into the milk (K-03). */
export interface SyrupFall {
  deg: number;
  /** Half width of the stream at the rim (meters). */
  halfWidth: number;
  /** How far the channel runs back from the rim (fraction of the band). */
  channel: number;
}

export interface Column {
  theta: number;
  r: number;
  ri: number;
  ro: number;
  /** 0 at the inner edge, 1 at the outer edge. */
  u: number;
  /** Ground height without frosting (meters). */
  ground: number;
  /** Final surface height including frosting layers. */
  top: number;
  zone: Zone;
  /** How far inside its zone the column is (meters, ~distance to the zone edge). */
  zoneDepth: number;
  /** Underside height. */
  bottom: number;
}

/** Path centerline across the band (u), winding around the ring. */
export const pathU = (theta: number): number =>
  0.5 + 0.11 * Math.sin(2 * theta + 1.1) + 0.05 * Math.sin(5 * theta + 2.3);
const PATH_HALF_WIDTH = 0.42;

/** Frosting rim boundaries across the band (u), wobbling like poured icing. */
const outerRimU = (theta: number): number =>
  0.8 + 0.05 * Math.sin(4 * theta + 0.4) + 0.035 * Math.sin(9 * theta + 1.9);
const innerRimU = (theta: number): number =>
  0.15 + 0.04 * Math.sin(3 * theta + 2.2) + 0.03 * Math.sin(8 * theta + 0.3);

/** Height of the poured frosting layer above the ground, with a rounded edge. */
const FROSTING_THICK = 0.2;
const frostingProfile = (depth: number): number =>
  depth <= 0 ? 0 : FROSTING_THICK * Math.sqrt(Math.min(1, depth / 0.16));

export class IslandShape {
  readonly layout: IslandLayout;

  constructor(layout: IslandLayout) {
    this.layout = layout;
  }

  /** Everything about one ground column at (x, z). */
  column(x: number, z: number): Column {
    const theta = Math.atan2(z, x);
    const r = Math.hypot(x, z);
    const ri = innerRadius(theta);
    const ro = outerRadius(theta);
    const width = ro - ri;
    const u = (r - ri) / width;

    // Rolling meadow, gentle (no stair-step terraces from afar).
    let ground = TOP_BASE + (fbm3(x / 5.5, 0, z / 5.5, 3, 7) - 0.5) * 0.7;
    // Settle toward the rims so the frosting reads as a level pour.
    ground = ground * (1 - 0.15 * Math.abs(u - 0.5));

    let zone = Zone.Meadow;
    let zoneDepth = 1;
    let sugar = 0;
    let mounded = false;
    for (const m of this.layout.mounds) {
      const d = Math.hypot(x - m.x, z - m.z);
      if (d > m.radius * 1.6) continue;
      const n = fbm3(x / 1.3 + m.x, 3, z / 1.3, 3, 11) - 0.5;
      // Sugar noise scales the falloff instead of offsetting it, so the dome
      // rises monotonically to its apex (an offset carved a pit near the top).
      const t = m.kind === 'sugar' ? (d / m.radius) * (1 + n * 0.9) : d / m.radius + n * 0.35;
      if (m.kind === 'sugar') {
        // Rounded mountain: soft cone with a bulging middle.
        let h = m.height * Math.pow(Math.max(0, 1 - t * t), 1.5);
        const f = h / m.height;
        // Powdered drifts: soft raised lumps only (never hollows) on the cap,
        // and a craggy gingerbread skirt where the sugar thins out.
        h += m.height * 0.14 * Math.max(0, fbm3(x * 1.6, 5, z * 1.6, 2, 23) - 0.45) * f;
        h += (valueNoise3(x * 3.5, 7, z * 3.5, 29) - 0.35) * 0.22 * Math.min(1, f * 3) * (1 - f);
        ground += Math.max(0, h);
        sugar = Math.max(sugar, h / m.height);
      } else {
        ground += m.height * Math.pow(Math.max(0, 1 - t * t), 2);
        if (t < 1) mounded = true;
        if (m.kind === 'frosting' && t < 0.85) {
          zone = Zone.Frosting;
          zoneDepth = Math.min(zoneDepth, (0.85 - t) * m.radius);
        }
      }
    }

    for (const p of this.layout.pads) {
      const d = Math.hypot(x - p.x, z - p.z);
      const w = 1 - smoothstep(p.radius, p.radius + 1.4, d);
      ground = ground * (1 - w) + p.height * w;
    }

    // Zones: frosting rims, path, sugar peak.
    const outerDepth = (u - outerRimU(theta)) * width;
    const innerDepth = (innerRimU(theta) - u) * width;
    const pathDepth = PATH_HALF_WIDTH - Math.abs(u - pathU(theta)) * width;
    let frostDepth = zone === Zone.Frosting ? zoneDepth : 0;
    if (outerDepth > 0 || innerDepth > 0) {
      zone = Zone.Frosting;
      frostDepth = Math.max(frostDepth, outerDepth, innerDepth);
      zoneDepth = frostDepth;
    } else if (zone !== Zone.Frosting && pathDepth > 0) {
      zone = Zone.Path;
      zoneDepth = pathDepth;
    }
    for (const f of this.layout.falls) {
      const along = Math.abs(angleDiff(theta, (f.deg * Math.PI) / 180)) * r;
      const w = f.halfWidth * (0.75 + 0.25 * Math.sin(u * 23));
      if (u < f.channel && along < w) {
        zone = Zone.Syrup;
        zoneDepth = w - along;
        // Liquid finds its level: a flat syrup surface sunk into its channel
        // (following the rolling meadow made a faceted, tilted sheet).
        ground = Math.min(ground, TOP_BASE - 0.12) - 0.03 * Math.min(1, zoneDepth / 0.06);
      }
    }
    if (sugar > 0.05) {
      zone =
        sugar > 0.42 + (valueNoise3(x * 1.7, 0, z * 1.7, 5) - 0.5) * 0.2 ? Zone.Sugar : Zone.Rock;
      zoneDepth = 1;
      frostDepth = 0;
    }

    // Rim corners are rounded by the terrain builder, where the frosting coat is.
    // Poured icing levels itself: away from its edge the frosting top relaxes
    // toward a smoothed height, so it reads as a glossy pour, not terraces.
    let top = ground;
    if (zone === Zone.Frosting) {
      const level = smoothstep(0.1, 0.6, frostDepth) * 0.75;
      const smooth = TOP_BASE + (fbm3(x / 11, 0, z / 11, 2, 7) - 0.5) * 0.35;
      top = ground + (smooth - ground) * level * (mounded ? 0 : 1) + frostingProfile(frostDepth);
    }

    // Underside: a rounded donut belly (superellipse cross-section).
    const rc = (ri + ro) / 2;
    const a = width / 2;
    let bottom: number;
    if (r >= rc) {
      const t = Math.min(1, (r - rc) / a);
      bottom = -1.2 - 2.7 * Math.pow(1 - Math.pow(t, 3), 1 / 3);
    } else {
      bottom = -3.9 + Math.max(0, (rc - r) / rc) * 1.2;
    }

    return { theta, r, ri, ro, u, ground, top, zone, zoneDepth, bottom };
  }

  /** Surface height (meters) at (x, z), for placing props. */
  surface(x: number, z: number): number {
    return this.column(x, z).top;
  }
}

/** Arc-length segments of drips around a rim. */
const DRIP_SEG = 0.62;

/**
 * How far the frosting coat reaches down a cliff below the top (meters) at
 * arc length `s`: a wavy minimum band plus U-shaped drip tongues with round
 * tips, blended into the band with soft shoulders (K-02).
 */
export function dripDepth(s: number, seed: number, minBand: number, maxTongue: number): number {
  const seg = Math.floor(s / DRIP_SEG);
  const band = minBand + 0.07 * Math.sin(s * 1.9 + seed) + 0.05 * Math.sin(s * 4.3 + seed * 2);
  let depth = band;
  for (let k = seg - 1; k <= seg + 1; k++) {
    if (hash3(k, seed, 0, 71) < 0.18) continue;
    const half = 0.13 + hash3(k, seed, 2, 71) * 0.2;
    const center = (k + 0.5 + (hash3(k, seed, 1, 71) - 0.5) * 0.4) * DRIP_SEG;
    const len = 0.1 + Math.pow(hash3(k, seed, 3, 71), 1.3) * maxTongue;
    const dx = Math.abs(s - center);
    // Shoulder fillet: the band swells toward each tongue.
    const shoulder = half + 0.12;
    if (dx >= shoulder) continue;
    let d: number;
    // Tapered drop shape: full near the band, narrowing to a rounded tip.
    if (dx < half) d = band + (len + half) * Math.pow(1 - (dx / half) ** 2, 0.6);
    else {
      const t = (shoulder - dx) / 0.12;
      d = band + t * t * 0.1;
    }
    depth = Math.max(depth, d);
  }
  return depth;
}

/** Bulb at the end of a drip: extra coat thickness near the tip. */
export function dripBulb(belowTop: number, depth: number): number {
  // A rounded bead just above the tip, where the icing gathers.
  const t = (depth - belowTop - 0.06) / 0.06;
  return Math.abs(t) < 1 ? 0.045 * Math.sqrt(1 - t * t) : 0;
}
