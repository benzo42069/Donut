import RAPIER from '@dimforge/rapier3d-compat';

export type Rapier = typeof RAPIER;

let loading: Promise<Rapier> | null = null;

/** Loads the Rapier WASM module once (PLAN §1: kinematic character controller). */
export function loadRapier(): Promise<Rapier> {
  loading ??= RAPIER.init().then(() => RAPIER);
  return loading;
}

/** A square heightfield sampled from `height(x, z)` (meters), centered on the origin. */
export interface HeightfieldSpec {
  /** Half the side length (meters). */
  half: number;
  /** Cells per side. */
  cells: number;
  height(x: number, z: number): number;
}

/**
 * Builds a Rapier heightfield. Rapier stores heights column-major with rows
 * along z and columns along x, spanning [-half, half] on both axes.
 */
export function heightfieldDesc(R: Rapier, spec: HeightfieldSpec): RAPIER.ColliderDesc {
  const n = spec.cells;
  const step = (2 * spec.half) / n;
  const heights = new Float32Array((n + 1) * (n + 1));
  for (let col = 0; col <= n; col++) {
    for (let row = 0; row <= n; row++) {
      heights[col * (n + 1) + row] = spec.height(-spec.half + col * step, -spec.half + row * step);
    }
  }
  return R.ColliderDesc.heightfield(n, n, heights, { x: 2 * spec.half, y: 1, z: 2 * spec.half });
}

/**
 * A closed vertical wall following `radius(theta)` around the y axis, from y0
 * to y1: an invisible fence (the lagoon rim, the sky rim).
 */
export function ringWallDesc(
  R: Rapier,
  radius: (theta: number) => number,
  y0: number,
  y1: number,
  segments = 160,
): RAPIER.ColliderDesc {
  const verts = new Float32Array(segments * 2 * 3);
  const idx = new Uint32Array(segments * 6);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const r = radius(a);
    verts.set([Math.cos(a) * r, y0, Math.sin(a) * r, Math.cos(a) * r, y1, Math.sin(a) * r], i * 6);
    const j = (i + 1) % segments;
    idx.set([i * 2, j * 2, i * 2 + 1, i * 2 + 1, j * 2, j * 2 + 1], i * 6);
  }
  return R.ColliderDesc.trimesh(verts, idx);
}
