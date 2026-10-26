import { Color, PointLight, Vector3 } from 'three';
import { LIGHT_PALETTE, hash3 } from '../../art/palette';
import { VoxelGrid } from '../../engine/voxel/VoxelGrid';
import {
  DONUT_HERO_VOXEL,
  biteDonut,
  scatterCrumbs,
  buildDonut,
  donutSize,
  type DonutFlavor,
} from '../../art/models/donut';
import { STAND_HEIGHT, buildStand, standSize } from '../../art/models/stand';
import { GLAZEY_FACE_VOXEL, GLAZEY_VOXEL, buildGlazey } from '../../art/models/glazey';
import { BAKERY_SIZE, buildBakery } from '../../art/models/bakery';
import { FINE_DECOR_VOXEL, buildGrassTuft } from '../../art/models/grassTuft';
import { LIGHTHOUSE_LAMP, LIGHTHOUSE_SIZE, buildLighthouse } from '../../art/models/lighthouse';
import { PIER_WIDTH, buildPier } from '../../art/models/pier';
import {
  BED_SIZE,
  DONUT_TREE_SIZE,
  FLOSS_TREE_SIZE,
  MOON_SIZE,
  MOON_VOXEL,
  ROCK_SIZE,
  buildDonutTree,
  buildFence,
  buildFlossTree,
  buildFlowerBed,
  buildGingerRock,
  buildMoonDonut,
  buildRockCandy,
  fenceSize,
} from '../../art/models/props';
import { CLOUD_SIZE, buildCloud } from '../../art/models/smallProps';
import { TREE_SIZE, buildSprinkleTree } from '../../art/models/sprinkleTree';
import type { QualitySettings } from '../../engine/quality';
import { createVoxelMaterial } from '../../engine/render/Materials';
import { MesherPool } from '../../engine/voxel/MesherPool';
import { placeModel, type Placed } from '../../engine/voxel/placeModel';
import type { ShotScene } from '../shotTypes';
import { STUDIO_POST, STUDIO_TUNING, createStudio, studioCamera, type Studio } from './studio';

/** Gallery donuts use the close-up hero density (the Munch and close-ups use it). */
const DV = DONUT_HERO_VOXEL;
const STAND_VOXEL = 1 / 128;

/** Meshes placed models into the studio; resolves when every chunk is uploaded. */
async function populate(studio: Studio, items: Placed[]): Promise<ReturnType<typeof placeModel>[]> {
  const material = createVoxelMaterial({}, STUDIO_TUNING);
  const pool = new MesherPool();
  const placed = items.map((p) => placeModel(p, material, pool));
  for (const p of placed) studio.scene.add(p.group);
  await Promise.all(placed.map((p) => p.ready));
  pool.dispose();
  return placed;
}

/** A donut on its stand at floor position (x, z). */
function donutOnStand(
  flavor: DonutFlavor,
  x: number,
  z: number,
  rotY: number,
  seed: number,
  bites = 0,
): Placed[] {
  const ds = donutSize(DV, flavor);
  const grid = buildDonut(flavor, seed, DV);
  for (let b = 0; b < bites; b++) {
    biteDonut(grid, flavor, { angle: 1.1 + b * 0.95 }, DV, seed + b);
  }
  // Stands a touch narrower than the donut, so the donut owns the plinth.
  const radius = flavor === 'maple' ? ds[0] * DV * 0.3 : (ds[2] * DV) / 2 - 0.02;
  const ss = standSize(radius, STAND_VOXEL);
  return [
    {
      grid: buildStand(radius, STAND_VOXEL, seed),
      voxel: STAND_VOXEL,
      pivot: [ss[0] / 2, 0, ss[2] / 2],
      pos: new Vector3(x, 0, z),
      rotY: hash3(seed, 1, 1, 9) * Math.PI,
    },
    {
      grid,
      voxel: DV,
      pivot: [ds[0] / 2, 0, ds[2] / 2],
      pos: new Vector3(x, STAND_HEIGHT, z),
      rotY,
    },
  ];
}

/** gallery-donuts: all nine flavors on stands, like reference 04. */
export async function buildDonutGallery(
  aspect: number,
  quality: QualitySettings,
): Promise<ShotScene> {
  const studio = createStudio(quality, { shadowExtent: 3.2, back: -1.9 });
  const rows: DonutFlavor[][] = [
    ['strawberry', 'chocolate', 'jelly'],
    ['maple', 'rainbow', 'powdered'],
    ['glazed', 'blueberry', 'mystery'],
  ];
  const items: Placed[] = [];
  const gx = 1.16;
  const gz = 1.3;
  rows.forEach((row, r) =>
    row.forEach((flavor, c) => {
      const x = (c - 1) * gx;
      const z = (r - 1) * gz;
      // The jelly's burst faces the camera (local +x at angle 0.6 + seed·0.7).
      const rot = flavor === 'maple' ? 0.18 : flavor === 'jelly' ? 0.95 : hash3(r, c, 3, 5) * 6.28;
      items.push(...donutOnStand(flavor, x, z, rot, r * 3 + c + 1));
    }),
  );
  await populate(studio, items);
  // The rainbow mega donut glows a little onto its neighbors (RF-16: softly).
  const glow = new PointLight(new Color(LIGHT_PALETTE.lampLight), 0.6, 1.6, 2);
  glow.position.set(0, STAND_HEIGHT + 0.3, 0);
  studio.scene.add(glow);
  const camera = studioCamera(aspect, 27, new Vector3(0, 3.3, 5.4), new Vector3(0, 0.02, -0.3));
  return { scene: studio.scene, camera, environment: studio.environment, post: STUDIO_POST };
}

/** gallery-donut-bites: whole, one bite (1/3 eaten), two bites (2/3 eaten). */
export async function buildBiteGallery(
  aspect: number,
  quality: QualitySettings,
): Promise<ShotScene> {
  const studio = createStudio(quality, { shadowExtent: 2.6 });
  const rows: DonutFlavor[] = ['strawberry', 'glazed'];
  const items: Placed[] = [];
  rows.forEach((flavor, r) => {
    for (let b = 0; b < 3; b++) {
      items.push(...donutOnStand(flavor, (b - 1) * 1.08, (r - 0.5) * 1.05, 0, 20 + r * 3 + b, b));
    }
  });
  // Crumbs on the cloth around the bitten donuts (K-07). The stand plate is
  // narrower than the donut, so they fall past it and land by its foot.
  const crumbs = new VoxelGrid();
  rows.forEach((_, r) => {
    for (let b = 1; b < 3; b++) {
      const x = (b - 1) * 1.08;
      const z = (r - 0.5) * 1.05;
      const toward = Math.PI / 2 - 0.3;
      scatterCrumbs(
        crumbs,
        (x + 0.15) / DV,
        0,
        (z + 0.26) / DV,
        10 * b,
        0.12 / DV,
        toward,
        r * 9 + b,
      );
    }
  });
  items.push({ grid: crumbs, voxel: DV, pivot: [0, 0, 0], pos: new Vector3(), rotY: 0 });
  await populate(studio, items);
  const camera = studioCamera(aspect, 28, new Vector3(0, 2.2, 3.9), new Vector3(0, 0.15, 0.1));
  return { scene: studio.scene, camera, environment: studio.environment, post: STUDIO_POST };
}

/**
 * gallery-glazey-belly: belly stages 0–5 in a lineup (RF-12). The motion strip
 * turns the lineup on the turntable: front, side, back (RF-10, RF-11).
 */
export async function buildGlazeyGallery(
  aspect: number,
  quality: QualitySettings,
): Promise<ShotScene> {
  const studio = createStudio(quality, { shadowExtent: 4.6 });
  const items: Placed[] = [];
  const spacing = 1.4;
  for (let b = 0; b <= 5; b++) {
    const g = buildGlazey(b, b === 5 ? 'bliss' : 'happy');
    const pos = new Vector3((b - 2.5) * spacing, 0, 0);
    items.push(
      { grid: g.grid, voxel: GLAZEY_VOXEL, pivot: g.pivot, pos, rotY: 0 },
      { grid: g.face.grid, voxel: GLAZEY_FACE_VOXEL, pivot: g.face.pivot, pos, rotY: 0 },
    );
  }
  const placed = await populate(studio, items);
  const camera = studioCamera(aspect, 19, new Vector3(0, 2.6, 14.2), new Vector3(0, 0.48, 0));
  const turn = (t: number): void => {
    for (const p of placed) p.group.rotation.y = t;
  };
  return {
    scene: studio.scene,
    camera,
    environment: studio.environment,
    post: STUDIO_POST,
    // Turntable: stills face front; the strip shows front, side and back.
    update: (t) => turn(t),
    stripTimes: [0, Math.PI / 2, Math.PI],
  };
}

/** gallery-props: the island's set dressing, shelved like a toy collection. */
export async function buildPropsGallery(
  aspect: number,
  quality: QualitySettings,
): Promise<ShotScene> {
  const studio = createStudio(quality, { shadowExtent: 11, width: 70, depth: 16, back: -9 });
  const P32 = 1 / 32;
  const at = (x: number, z: number, y = 0): Vector3 => new Vector3(x, y, z);
  const base = (size: readonly number[]): [number, number, number] => [
    Math.round((size[0] ?? 0) / 2),
    0,
    Math.round((size[2] ?? 0) / 2),
  ];
  const lighthouse = buildLighthouse({ lamp: false });
  const items: Placed[] = [
    // Back row: the big pieces.
    {
      grid: buildFlossTree(3),
      voxel: P32,
      pivot: base(FLOSS_TREE_SIZE),
      pos: at(-6.54, -2.2),
      rotY: 0.4,
    },
    {
      grid: lighthouse,
      voxel: P32,
      pivot: base(LIGHTHOUSE_SIZE),
      pos: at(-4.04, -2.6),
      rotY: -0.5,
    },
    { grid: buildBakery(), voxel: P32, pivot: base(BAKERY_SIZE), pos: at(-0.6, -2.4), rotY: 0.3 },
    {
      grid: buildSprinkleTree(4, 'green', 1),
      voxel: P32,
      pivot: base(TREE_SIZE),
      pos: at(2.84, -2.2),
      rotY: 1,
    },
    {
      grid: buildDonutTree(2),
      voxel: P32,
      pivot: base(DONUT_TREE_SIZE),
      pos: at(5.93, -1.8),
      rotY: 0.2,
    },
    // Front row: the small pieces.
    {
      grid: buildPier(18),
      voxel: P32,
      pivot: [0, 0, PIER_WIDTH / 2],
      pos: at(-6.54, 1.6),
      rotY: -0.15,
    },
    {
      grid: buildFence(5, 1),
      voxel: P32,
      pivot: base(fenceSize(5)),
      pos: at(-1.63, 1.5),
      rotY: 0.08,
    },
    { grid: buildFlowerBed(5), voxel: P32, pivot: base(BED_SIZE), pos: at(0.77, 2.1), rotY: 0 },
    { grid: buildRockCandy(6), voxel: P32, pivot: base(ROCK_SIZE), pos: at(2.58, 1.8), rotY: 0.6 },
    { grid: buildGingerRock(7), voxel: P32, pivot: base(ROCK_SIZE), pos: at(4.3, 1.5), rotY: 0 },
    {
      grid: buildSprinkleTree(9, 'pink', 0.55),
      voxel: P32,
      pivot: base(TREE_SIZE),
      pos: at(6.36, 1.9),
      rotY: 2,
    },
    // Clouds drifting above (1/32 m here: finer still than in the world).
    {
      grid: buildCloud(2, 0.9),
      voxel: P32,
      pivot: base(CLOUD_SIZE),
      pos: at(-2.06, -4.4, 5.2),
      rotY: 0.2,
      shadow: false,
    },
    {
      grid: buildCloud(5, 0.75),
      voxel: P32,
      pivot: base(CLOUD_SIZE),
      pos: at(3.96, -4.8, 5.7),
      rotY: -0.3,
      shadow: false,
    },
  ];
  // Grass tufts gathered at the feet of the trees, rocks and flower bed (1/64 m).
  const clumps: [number, number][] = [
    [0.77, 2.1],
    [2.58, 1.8],
    [4.3, 1.5],
    [2.84, -2.2],
    [5.93, -1.8],
    [-6.54, -2.2],
  ];
  clumps.forEach(([cx, cz], k) => {
    for (let i = 0; i < 7; i++) {
      const a = hash3(i, k, 1, 3) * Math.PI * 2;
      const r = 0.55 + hash3(i, k, 2, 3) * 0.45;
      items.push({
        grid: buildGrassTuft(i + k * 7, i % 3 === 0),
        voxel: FINE_DECOR_VOXEL,
        pivot: [8, 0, 8],
        pos: at(cx + Math.cos(a) * r, cz + Math.sin(a) * r),
        rotY: hash3(i, k, 3, 3) * 6,
      });
    }
  });
  // The Moon Donut on the lighthouse (1/64 m hero asset).
  const lamp = new Vector3(...LIGHTHOUSE_LAMP)
    .sub(new Vector3(...base(LIGHTHOUSE_SIZE)))
    .multiplyScalar(P32);
  items.push({
    grid: buildMoonDonut(1),
    voxel: MOON_VOXEL,
    pivot: [MOON_SIZE[0] / 2, MOON_SIZE[1] / 2, MOON_SIZE[2] / 2],
    pos: lamp.clone(),
    rotY: 0,
  });
  const placed = await populate(studio, items);
  // The lamp and the moon donut ride the lighthouse's rotation.
  const lh = placed[1]?.group;
  const moon = placed[placed.length - 1]?.group;
  if (lh && moon) {
    moon.position.applyAxisAngle(new Vector3(0, 1, 0), lh.rotation.y).add(lh.position);
    moon.rotation.y = lh.rotation.y + 0.5;
    const glow = new PointLight(new Color(LIGHT_PALETTE.lampLight), 4, 5, 2);
    glow.position.copy(moon.position);
    studio.scene.add(glow);
  }
  const camera = studioCamera(aspect, 32, new Vector3(0, 4.8, 17.6), new Vector3(0, 2.3, -0.6));
  return {
    scene: studio.scene,
    camera,
    environment: studio.environment,
    post: { ...STUDIO_POST, aoRadius: 0.4, aoFalloff: 0.4 },
  };
}
