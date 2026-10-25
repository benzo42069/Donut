import {
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  Vector3,
} from 'three';
import { LIGHT_PALETTE, PALETTE_INDEX, hash3 } from '../../art/palette';
import { fbm3, valueNoise3 } from '../../art/sdf';
import { DONUT_SIZE, buildDonut, type DonutFlavor } from '../../art/models/donut';
import { TUFT_SIZE, buildGrassTuft } from '../../art/models/grassTuft';
import { createVoxelMaterial } from '../../engine/render/Materials';
import { createSky } from '../../engine/render/Sky';
import { carveSphere } from '../../engine/voxel/Carve';
import { MesherPool } from '../../engine/voxel/MesherPool';
import { createPropInstances, type PropPlacement } from '../../engine/voxel/PropInstances';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';
import { VoxelObject, type RemeshStats } from '../../engine/voxel/VoxelObject';
import type { ShotScene } from '../shotTypes';

/** Near-terrain voxel size (art bible §3). */
const TERRAIN_VOXEL = 1 / 8;
/** Hero-prop voxel size (art bible §3). */
const PROP_VOXEL = 1 / 32;
/** PLAN M1 stress volume: 256×64×256 terrain voxels. */
const SIZE_X = 256;
const SIZE_Y = 64;
const SIZE_Z = 256;
const CENTER = SIZE_X / 2;

interface Columns {
  top: Int16Array;
  bottom: Int16Array;
  edge: Float32Array;
  frost: Uint8Array;
  drip: Int16Array;
}

/**
 * A floating diorama plateau: rolling meadow on top, a pink frosting rim that
 * drips over dough-strata cliffs (K-02), and a rounded underside.
 */
function columns(): Columns {
  const n = SIZE_X * SIZE_Z;
  const c: Columns = {
    top: new Int16Array(n),
    bottom: new Int16Array(n),
    edge: new Float32Array(n),
    frost: new Uint8Array(n),
    drip: new Int16Array(n),
  };
  for (let z = 0; z < SIZE_Z; z++) {
    for (let x = 0; x < SIZE_X; x++) {
      const i = x + z * SIZE_X;
      const dx = x + 0.5 - CENTER;
      const dz = z + 0.5 - CENTER;
      const a = Math.atan2(dz, dx);
      const rEdge = 112 + (fbm3(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0, 3, 3) - 0.5) * 22;
      const r = Math.hypot(dx, dz);
      c.edge[i] = r - rEdge;
      const hills = fbm3(x / 70, 0, z / 70, 3, 7);
      const t = Math.min(1, r / rEdge);
      c.top[i] = Math.round(36 + (hills - 0.45) * 22 * (1 - t * t * 0.7));
      c.bottom[i] = Math.round(3 + Math.pow(t, 5) * 12);
      // Frosting: a rim band near the cliff plus a few frosted hilltops.
      const rimBand = r > rEdge - 7 - valueNoise3(a * 6, 0, 0, 13) * 4;
      c.frost[i] = rimBand || hills > 0.66 ? 1 : 0;
      // Drip tongues down the cliff face, smooth along the rim.
      const tongue = Math.max(0, valueNoise3(a * 26, 0.5, 0, 19) - 0.42) / 0.58;
      c.drip[i] = Math.min(
        Math.round(2 + Math.pow(tongue, 1.4) * 14),
        (c.top[i] ?? 0) - (c.bottom[i] ?? 0) - 4,
      );
    }
  }
  return c;
}

function generateTerrain(grid: VoxelGrid): Columns {
  const col = columns();
  grid.generate(0, 0, 0, SIZE_X, SIZE_Y, SIZE_Z, (x, y, z) => {
    const i = x + z * SIZE_X;
    const edge = col.edge[i] ?? 99;
    const top = col.top[i] ?? 0;
    // Drip skin hugging the outside of the cliff.
    if (edge > 0) {
      if (edge < 1.6 && y < top && y >= top - (col.drip[i] ?? 0)) {
        return PALETTE_INDEX[y === top - 1 ? 'frostingPinkLight' : 'frostingPink'];
      }
      return 0;
    }
    if (y >= top || y < (col.bottom[i] ?? 0)) return 0;
    const depth = top - 1 - y;
    if (col.frost[i]) {
      if (depth === 0) return PALETTE_INDEX.frostingPinkLight;
      if (depth < 3) return PALETTE_INDEX.frostingPink;
      if (depth < 4) return PALETTE_INDEX.frostingPinkShadow;
    } else if (depth === 0) {
      return hash3(x >> 1, 0, z >> 1, 3) > 0.72 ? PALETTE_INDEX.grassDeep : PALETTE_INDEX.grassMint;
    } else if (depth === 1) {
      return PALETTE_INDEX.grassDeep;
    }
    // Dough strata: wavy bands of golden, crumb and toasted; crust at the bottom.
    if (y < (col.bottom[i] ?? 0) + 2) return PALETTE_INDEX.doughCrust;
    const band = (y + valueNoise3(x / 9, 0, z / 9, 29) * 5) % 9;
    if (band < 1.4) return PALETTE_INDEX.doughToasted;
    if (band < 2.6) return PALETTE_INDEX.doughCrumb;
    return PALETTE_INDEX.doughGolden;
  });
  return col;
}

/** 200 props at 1/32 m: 60 donuts and 140 grass tufts, placed on the meadow. */
function placements(
  col: Columns,
  grid: VoxelGrid,
): { donuts: PropPlacement[][]; tufts: PropPlacement[][] } {
  const donuts: PropPlacement[][] = [[], [], []];
  const tufts: PropPlacement[][] = [[], []];
  let placed = 0;
  for (let k = 0; placed < 200 && k < 20000; k++) {
    const x = Math.floor(20 + hash3(k, 1, 0, 61) * (SIZE_X - 40));
    const z = Math.floor(20 + hash3(k, 2, 0, 61) * (SIZE_Z - 40));
    const i = x + z * SIZE_X;
    if ((col.edge[i] ?? 0) > -6) continue;
    if (grid.get(x, (col.top[i] ?? 0) - 1, z) === 0) continue; // carved away
    const isDonut = placed < 60;
    if (isDonut === Boolean(col.frost[i]) && !isDonut) continue; // tufts only on grass
    const p: PropPlacement = {
      x: (x + 0.5) * TERRAIN_VOXEL,
      y: (col.top[i] ?? 0) * TERRAIN_VOXEL,
      z: (z + 0.5) * TERRAIN_VOXEL,
      rotY: hash3(k, 3, 0, 61) * Math.PI * 2,
    };
    if (isDonut) donuts[placed % 3]?.push(p);
    else tufts[placed % 7 === 0 ? 1 : 0]?.push(p);
    placed++;
  }
  return { donuts, tufts };
}

/** Bites taken out of the cliff and meadow by the M1 carve benchmark. */
const BENCH_BITES: [number, number, number, number][] = [
  [128, 40, 128, 7],
  [60, 34, 150, 5],
  [190, 36, 90, 6],
];

export async function buildTerrainScene(aspect: number): Promise<ShotScene> {
  const scene = new Scene();
  scene.fog = new Fog(new Color(LIGHT_PALETTE.fog), 55, 140);

  const sunDir = new Vector3(-0.55, 0.45, 0.7).normalize();
  const sun = new DirectionalLight(new Color(LIGHT_PALETTE.sunGolden), 3.2);
  const focus = new Vector3(16, 3, 16);
  sun.position.copy(focus).addScaledVector(sunDir, 40);
  sun.target.position.copy(focus);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const ext = 24;
  Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext });
  sun.shadow.camera.near = 5;
  sun.shadow.camera.far = 90;
  sun.shadow.radius = 4;
  sun.shadow.blurSamples = 12;
  sun.shadow.bias = -0.0003;
  scene.add(sun, sun.target);
  scene.add(
    new HemisphereLight(
      new Color(LIGHT_PALETTE.skyFill),
      new Color(LIGHT_PALETTE.groundBounce),
      1.1,
    ),
  );
  scene.add(createSky(sunDir));

  const material = createVoxelMaterial();
  const pool = new MesherPool();
  const t0 = performance.now();
  const grid = new VoxelGrid();
  const col = generateTerrain(grid);
  // A couple of permanent bites in the rim, to show carving in the still.
  carveSphere(grid, 30, 30, 128, 9);
  carveSphere(grid, 140, 44, 236, 8);
  const genMs = performance.now() - t0;
  const terrain = new VoxelObject(grid, TERRAIN_VOXEL, material, pool);
  const initial = await terrain.update();
  scene.add(terrain);

  const { donuts, tufts } = placements(col, grid);
  const flavors: DonutFlavor[] = ['strawberry', 'chocolate', 'glazed'];
  const donutPivot = [DONUT_SIZE[0] / 2, 0, DONUT_SIZE[2] / 2] as const;
  flavors.forEach((f, k) => {
    scene.add(
      createPropInstances(buildDonut(f, k), PROP_VOXEL, donutPivot, material, donuts[k] ?? []),
    );
  });
  const tuftPivot = [(TUFT_SIZE[0] - 1) / 2, 0, (TUFT_SIZE[2] - 1) / 2] as const;
  tufts.forEach((list, k) => {
    scene.add(
      createPropInstances(buildGrassTuft(k, k === 1), PROP_VOXEL, tuftPivot, material, list),
    );
  });

  const camera = new PerspectiveCamera(30, aspect, 0.5, 600);
  camera.position.set(16 + 27, 25, 16 + 32);
  camera.lookAt(16, 2.5, 15.5);

  const statsOf = (s: RemeshStats): Record<string, number> => ({
    chunks: s.chunks,
    workerMsMax: s.workerMsMax,
    workerMsMean: s.chunks ? s.workerMsTotal / s.chunks : 0,
    wallMs: s.wallMs,
    quads: s.quads,
  });

  return {
    scene,
    camera,
    async bench() {
      const c0 = performance.now();
      const removed = BENCH_BITES.reduce(
        (n, [x, y, z, r]) => n + carveSphere(grid, x, y, z, r).length,
        0,
      );
      const carveMs = performance.now() - c0;
      const remesh = await terrain.update();
      // Same chunks again, one at a time: per-chunk wall clock incl. worker
      // round trip and geometry swap, without workers competing for cores.
      const serial: number[] = [];
      for (const c of remesh.coords) {
        grid.markDirty(c.cx, c.cy, c.cz);
        serial.push((await terrain.update()).wallMs);
      }
      serial.sort((a, b) => a - b);
      return {
        generateMs: genMs,
        terrainVoxels: grid.count(),
        terrainChunks: terrain.chunkMeshCount,
        props: donuts.flat().length + tufts.flat().length,
        ...Object.fromEntries(
          Object.entries(statsOf(initial)).map(([k, v]) => [`initial.${k}`, v]),
        ),
        carveVoxelsRemoved: removed,
        carveMs,
        ...Object.fromEntries(Object.entries(statsOf(remesh)).map(([k, v]) => [`remesh.${k}`, v])),
        'remeshSerial.medianMs': serial[serial.length >> 1] ?? 0,
        'remeshSerial.maxMs': serial[serial.length - 1] ?? 0,
      };
    },
  };
}
