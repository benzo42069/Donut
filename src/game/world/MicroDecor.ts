import { Group, type InstancedMesh, type Material } from 'three';
import { FINE_DECOR_VOXEL, TUFT_SIZE, buildGrassTuft } from '../../art/models/grassTuft';
import { PALETTE_INDEX, hash3, type VoxelColorName } from '../../art/palette';
import { valueNoise3 } from '../../art/sdf';
import { createPropInstances, type PropPlacement } from '../../engine/voxel/PropInstances';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';
import { FINE } from './IslandTerrain';
import { Zone, type IslandShape } from './islandShape';

/**
 * Island-wide micro-decor for play mode (art bible §3, RF-04): grass tufts,
 * flower tufts and frosting sprinkles as instanced 1/64 m voxel models over
 * the whole top, instead of 1/32 m voxels baked into the terrain skin. A
 * roaming gameplay camera then never meets Lego-sized blades or brick
 * sprinkles, and there is no near-field patch to leave a seam.
 */
export interface MicroDecorOptions {
  low: boolean;
  /** Spots kept bare (x, z, radius): under donuts, around trunks. */
  clear: readonly (readonly [number, number, number])[];
}

const SPRINKLES: VoxelColorName[] = [
  'sprinkleRed',
  'sprinkleOrange',
  'sprinkleYellow',
  'sprinkleGreen',
  'sprinkleBlue',
  'sprinkleViolet',
  'candyCream',
];
const TUFT_VARIANTS = 8;
const FLOWER_VARIANTS = 6;
/** Tufts are drawn a little under 1/64 m, so blades stay hair-thin up close. */
const TUFT_SCALE = 0.78;

/** The top face of the fine skin's surface voxel in a column (meters). */
const skinTop = (surface: number): number => Math.ceil(surface / FINE - 0.5) * FINE;

export function buildMicroDecor(
  shape: IslandShape,
  material: Material,
  opts: MicroDecorOptions,
): { group: Group; counts: Record<string, number> } {
  const bare = (x: number, z: number): boolean =>
    opts.clear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r);
  const tufts: PropPlacement[][] = Array.from({ length: TUFT_VARIANTS }, () => []);
  const flowers: PropPlacement[][] = Array.from({ length: FLOWER_VARIANTS }, () => []);
  const sprinkles: PropPlacement[][] = SPRINKLES.map(() => []);

  // Grass: a jittered lattice, thinned by a soft "lushness" field so the meadow
  // has clumps and clearings rather than an even carpet.
  const gStep = opts.low ? 0.13 : 0.095;
  for (let gx = -12; gx < 12; gx += gStep) {
    for (let gz = -12; gz < 12; gz += gStep) {
      const i = Math.round(gx / gStep);
      const k = Math.round(gz / gStep);
      const x = gx + (hash3(i, k, 1, 61) - 0.5) * gStep;
      const z = gz + (hash3(i, k, 2, 61) - 0.5) * gStep;
      const c = shape.column(x, z);
      if (c.zone !== Zone.Meadow || c.zoneDepth < 0.05 || c.u < 0.02 || c.u > 0.98) continue;
      const lush = valueNoise3(x * 1.3, 2, z * 1.3, 41);
      if (hash3(i, k, 3, 61) > 0.5 + 0.55 * lush) continue;
      if (bare(x, z)) continue;
      const v = Math.floor(hash3(i, k, 4, 61) * TUFT_VARIANTS);
      tufts[v]?.push({
        x,
        y: skinTop(shape.surface(x, z)),
        z,
        rotY: hash3(i, k, 5, 61) * Math.PI * 2,
        scale: TUFT_SCALE * (0.8 + 0.4 * hash3(i, k, 6, 61)),
      });
    }
  }

  // Flowers in drifts, as in the baked meadow.
  const fStep = 0.24;
  for (let gx = -15; gx < 15; gx += fStep) {
    for (let gz = -15; gz < 15; gz += fStep) {
      const i = Math.round(gx / fStep);
      const k = Math.round(gz / fStep);
      const x = gx + (hash3(i, k, 1, 51) - 0.5) * fStep;
      const z = gz + (hash3(i, k, 2, 51) - 0.5) * fStep;
      const drift = valueNoise3(x * 0.45, 0, z * 0.45, 52);
      if (hash3(i, k, 3, 51) > (drift - 0.35) * (opts.low ? 0.6 : 1.3)) continue;
      const c = shape.column(x, z);
      if (c.zone !== Zone.Meadow || c.zoneDepth < 0.12 || c.u < 0.05 || c.u > 0.95) continue;
      if (bare(x, z)) continue;
      flowers[Math.floor(hash3(i, k, 5, 51) * FLOWER_VARIANTS)]?.push({
        x,
        y: skinTop(shape.surface(x, z)),
        z,
        rotY: hash3(i, k, 4, 51) * Math.PI * 2,
        scale: TUFT_SCALE,
      });
    }
  }

  // Sprinkles lying flat on the frosting (art bible §5: 1×1×3, 90° steps).
  const sStep = opts.low ? 0.1 : 0.072;
  for (let gx = -12; gx < 12; gx += sStep) {
    for (let gz = -12; gz < 12; gz += sStep) {
      const i = Math.round(gx / sStep);
      const k = Math.round(gz / sStep);
      if (hash3(i, k, 4, 63) > 0.55) continue;
      const x = gx + (hash3(i, k, 5, 63) - 0.5) * sStep;
      const z = gz + (hash3(i, k, 6, 63) - 0.5) * sStep;
      const c = shape.column(x, z);
      if (c.zone !== Zone.Frosting || c.zoneDepth < 0.08) continue;
      if (c.r < c.ri + 0.18 || c.r > c.ro - 0.05) continue;
      if (bare(x, z)) continue;
      sprinkles[Math.floor(hash3(i, k, 8, 63) * SPRINKLES.length)]?.push({
        x,
        y: c.top - 0.003,
        z,
        rotY: Math.floor(hash3(i, k, 7, 63) * 4) * (Math.PI / 2),
      });
    }
  }

  const group = new Group();
  const add = (m: InstancedMesh): void => {
    // Decor is too small to cast useful sun shadows; AO grounds it.
    m.castShadow = false;
    group.add(m);
  };
  const tuftPivot = [TUFT_SIZE[0] / 2, 0, TUFT_SIZE[2] / 2] as const;
  tufts.forEach((list, v) => {
    if (list.length) {
      add(
        createPropInstances(
          buildGrassTuft(v, false, true),
          FINE_DECOR_VOXEL,
          tuftPivot,
          material,
          list,
        ),
      );
    }
  });
  flowers.forEach((list, v) => {
    if (list.length) {
      add(
        createPropInstances(
          buildGrassTuft(100 + v, true, true),
          FINE_DECOR_VOXEL,
          tuftPivot,
          material,
          list,
        ),
      );
    }
  });
  sprinkles.forEach((list, v) => {
    const color = SPRINKLES[v];
    if (!list.length || !color) return;
    const grid = new VoxelGrid();
    for (let s = 0; s < 3; s++) grid.set(s, 0, 0, PALETTE_INDEX[color]);
    grid.takeDirty();
    add(createPropInstances(grid, FINE_DECOR_VOXEL, [1.5, 0, 0.5], material, list));
  });
  const count = (l: PropPlacement[][]): number => l.reduce((n, a) => n + a.length, 0);
  return {
    group,
    counts: { tufts: count(tufts), flowerTufts: count(flowers), microSprinkles: count(sprinkles) },
  };
}
