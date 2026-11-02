import { hash3 } from './palette';
import type { VoxelGrid } from '../engine/voxel/VoxelGrid';

/**
 * Procedural voxel modeling toolkit (PLAN §1 "asset authoring"): signed
 * distance functions, boolean ops and noise, plus `voxelize` to bake an SDF into
 * a grid. Units are voxels; negative distance is inside. M3 grows this into the
 * full asset library.
 */
export type Sdf = (x: number, y: number, z: number) => number;

export const sphere =
  (r: number): Sdf =>
  (x, y, z) =>
    Math.hypot(x, y, z) - r;

/** Rounded box with half extents (hx, hy, hz) and corner radius `round`. */
export const box =
  (hx: number, hy: number, hz: number, round = 0): Sdf =>
  (x, y, z) => {
    const qx = Math.abs(x) - hx + round;
    const qy = Math.abs(y) - hy + round;
    const qz = Math.abs(z) - hz + round;
    const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0));
    return outside + Math.min(Math.max(qx, qy, qz), 0) - round;
  };

/** Torus lying in the XZ plane: ring radius `R`, tube radius `r`. */
export const torus =
  (R: number, r: number): Sdf =>
  (x, y, z) =>
    Math.hypot(Math.hypot(x, z) - R, y) - r;

export const translate =
  (s: Sdf, tx: number, ty: number, tz: number): Sdf =>
  (x, y, z) =>
    s(x - tx, y - ty, z - tz);

export const union =
  (...s: Sdf[]): Sdf =>
  (x, y, z) =>
    Math.min(...s.map((f) => f(x, y, z)));

export const subtract =
  (a: Sdf, b: Sdf): Sdf =>
  (x, y, z) =>
    Math.max(a(x, y, z), -b(x, y, z));

export const intersect =
  (a: Sdf, b: Sdf): Sdf =>
  (x, y, z) =>
    Math.max(a(x, y, z), b(x, y, z));

/** Polynomial smooth union (rounded fillets between shapes). */
export const smoothUnion =
  (a: Sdf, b: Sdf, k: number): Sdf =>
  (x, y, z) => {
    const da = a(x, y, z);
    const db = b(x, y, z);
    const h = Math.min(Math.max(0.5 + (0.5 * (db - da)) / k, 0), 1);
    return db * (1 - h) + da * h - k * h * (1 - h);
  };

const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Smooth value noise in [0, 1). Deterministic per seed. */
export function valueNoise3(x: number, y: number, z: number, seed = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const tx = smooth(x - x0);
  const ty = smooth(y - y0);
  const tz = smooth(z - z0);
  const h = (dx: number, dy: number, dz: number): number => hash3(x0 + dx, y0 + dy, z0 + dz, seed);
  return lerp(
    lerp(lerp(h(0, 0, 0), h(1, 0, 0), tx), lerp(h(0, 1, 0), h(1, 1, 0), tx), ty),
    lerp(lerp(h(0, 0, 1), h(1, 0, 1), tx), lerp(h(0, 1, 1), h(1, 1, 1), tx), ty),
    tz,
  );
}

/** Fractal value noise in about [0, 1). */
export function fbm3(x: number, y: number, z: number, octaves = 4, seed = 0): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise3(x * f, y * f, z * f, seed + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}

/**
 * Bakes an SDF into the grid: every voxel whose center is inside gets
 * `paint(x, y, z, d)` (a palette index; 0 leaves the voxel untouched).
 * `min`/`max` bound the half-open voxel box to scan.
 */
export function voxelize(
  grid: VoxelGrid,
  sdf: Sdf,
  min: readonly [number, number, number],
  max: readonly [number, number, number],
  paint: (x: number, y: number, z: number, d: number) => number,
): void {
  grid.generate(min[0], min[1], min[2], max[0], max[1], max[2], (x, y, z) => {
    const d = sdf(x + 0.5, y + 0.5, z + 0.5);
    return (d <= 0 ? paint(x, y, z, d) : 0) || grid.get(x, y, z);
  });
}
