import {
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  PointLight,
  Scene,
  Vector3,
  type Camera,
  type Material,
  type WebGLRenderer,
} from 'three';
import { PlanarReflection } from '../../engine/render/Reflection';
import { LIGHT_PALETTE, PALETTE_INDEX, hash3 } from '../../art/palette';
import { valueNoise3 } from '../../art/sdf';
import { BAKERY_CHIMNEY, BAKERY_SIZE, buildBakery } from '../../art/models/bakery';
import {
  DONUT_HERO_VOXEL,
  DONUT_VOXEL,
  buildDonut,
  donutSize,
  type DonutFlavor,
} from '../../art/models/donut';
import { LIGHTHOUSE_LAMP, LIGHTHOUSE_SIZE, buildLighthouse } from '../../art/models/lighthouse';
import { PIER_WIDTH, buildPier, pierPostXs } from '../../art/models/pier';
import {
  CLOUD_SIZE,
  buildCloud,
  buildSteamPuff,
  flowerStamp,
  mushroomStamp,
  stamp,
} from '../../art/models/smallProps';
import { TREE_SIZE, buildSprinkleTree, type TreeLeaf } from '../../art/models/sprinkleTree';
import type { QualitySettings } from '../../engine/quality';
import { createVoxelMaterial } from '../../engine/render/Materials';
import { createSky } from '../../engine/render/Sky';
import { createMilk, type Milk } from '../../engine/render/Water';
import { MesherPool } from '../../engine/voxel/MesherPool';
import type { VoxelGrid } from '../../engine/voxel/VoxelGrid';
import { VoxelObject } from '../../engine/voxel/VoxelObject';
import {
  COARSE,
  FINE,
  MACRO,
  buildIslandTerrain,
  inDetail,
  type DetailPatch,
} from './IslandTerrain';
import {
  INNER_AMP,
  INNER_BASE,
  IslandShape,
  MILK_LEVEL,
  RING_WAVES,
  Zone,
  innerRadius,
} from './islandShape';
import { HERO_DONUT, MEADOW_LAYOUT, SPOTS, band, polar } from './meadowLayout';

/** Direction toward the golden-hour sun: upper right of the hero view (K-01). */
export const SUN_DIR = new Vector3(0.72, 0.34, -0.48).normalize();
/** Where the hero camera sits (props that "face the viewer" turn toward it). */
export const HERO_EYE = new Vector3(-8, 23, 32.5);

const PROP = 1 / 32;
const CLOUD = 1 / 16;

export interface Diorama {
  scene: Scene;
  environment: Scene;
  shape: IslandShape;
  sun: DirectionalLight;
  /** Named world positions for cameras. */
  spots: Record<string, Vector3>;
  update(t: number): void;
  prerender(gl: WebGLRenderer, camera: Camera): void;
  stats: Record<string, number>;
}

interface Placed {
  grid: VoxelGrid;
  voxel: number;
  pivot: readonly [number, number, number];
  pos: Vector3;
  rotY: number;
  tiltX?: number;
  shadow?: boolean;
}

/** Turns local +z toward a world direction. */
const faceToward = (from: { x: number; z: number }, to: { x: number; z: number }): number =>
  Math.atan2(to.x - from.x, to.z - from.z);

export interface DioramaOptions {
  /** Near-field macro patches around a ground-level camera (LOD follows the camera). */
  detail?: DetailPatch[];
}

export async function buildMeadowDiorama(
  quality: QualitySettings,
  opts: DioramaOptions = {},
): Promise<Diorama> {
  const scene = new Scene();
  scene.fog = new Fog(new Color(LIGHT_PALETTE.fog), 70, 260);
  const low = quality.tier === 'low';

  // --- Light (art bible §6): golden key, cool sky fill, warm bounce. ---
  const sun = new DirectionalLight(new Color(LIGHT_PALETTE.sunGolden), 5.6);
  sun.position.copy(SUN_DIR).multiplyScalar(60);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  const ext = 15;
  Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext });
  sun.shadow.camera.near = 20;
  sun.shadow.camera.far = 110;
  sun.shadow.radius = 5;
  sun.shadow.blurSamples = 16;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.01;
  scene.add(sun, sun.target);
  scene.add(
    new HemisphereLight(
      new Color(LIGHT_PALETTE.shadowFill),
      new Color(LIGHT_PALETTE.groundBounce),
      0.38,
    ),
  );
  // The environment map is fill and gloss, not the key: keep it soft.
  scene.environmentIntensity = 0.6;
  const sky = createSky(SUN_DIR);
  scene.add(sky);
  const environment = new Scene();
  // Reflections see a warm studio-like world: sky above, toasty bounce below,
  // so glossy chocolate and frosting don't turn blue.
  environment.add(
    createSky(SUN_DIR, 50, {
      zenith: LIGHT_PALETTE.envZenith,
      sea: LIGHT_PALETTE.groundBounce,
      seaWarm: LIGHT_PALETTE.skySunGlow,
    }),
  );

  // --- Terrain ---
  const shape = new IslandShape(MEADOW_LAYOUT);
  const detail = low ? undefined : opts.detail;
  const donutClear = 0.4;
  const terrain = buildIslandTerrain(shape, {
    grassDensity: low ? 0.08 : 0.16,
    detail,
    clear: [[HERO_DONUT.x, HERO_DONUT.z, donutClear]],
  });
  const fineGrid = terrain.fine;
  const groundVoxel = (x: number, z: number): number => Math.ceil(shape.surface(x, z) / FINE - 0.5);

  // Sprinkle flowers sown over the meadow in drifts (RF-04).
  let flowers = 0;
  const step = 0.24;
  for (let gx = -15; gx < 15; gx += step) {
    for (let gz = -15; gz < 15; gz += step) {
      const i = Math.round(gx / step);
      const k = Math.round(gz / step);
      const x = gx + (hash3(i, k, 1, 51) - 0.5) * step;
      const z = gz + (hash3(i, k, 2, 51) - 0.5) * step;
      const drift = valueNoise3(x * 0.45, 0, z * 0.45, 52);
      if (hash3(i, k, 3, 51) > (drift - 0.35) * (low ? 0.6 : 1.3)) continue;
      const c = shape.column(x, z);
      if (c.zone !== Zone.Meadow || c.zoneDepth < 0.12 || c.u < 0.05 || c.u > 0.95) continue;
      if (inDetail(detail, x, z)) continue;
      stamp(
        fineGrid,
        flowerStamp(i * 131 + k),
        Math.floor(x / FINE),
        groundVoxel(x, z),
        Math.floor(z / FINE),
      );
      flowers++;
    }
  }

  // Sprinkles scattered over the frosting (art bible §5: 1×1×3, 90° steps).
  const SPRINKLE_COLORS = [
    PALETTE_INDEX.sprinkleRed,
    PALETTE_INDEX.sprinkleOrange,
    PALETTE_INDEX.sprinkleYellow,
    PALETTE_INDEX.sprinkleGreen,
    PALETTE_INDEX.sprinkleBlue,
    PALETTE_INDEX.sprinkleViolet,
    PALETTE_INDEX.candyCream,
  ];
  let sprinkles = 0;
  const sStep = 0.13;
  for (let gx = -12; gx < 12; gx += sStep) {
    for (let gz = -12; gz < 12; gz += sStep) {
      const i = Math.round(gx / sStep);
      const k = Math.round(gz / sStep);
      if (hash3(i, k, 4, 53) > (low ? 0.25 : 0.5)) continue;
      const x = gx + (hash3(i, k, 5, 53) - 0.5) * sStep;
      const z = gz + (hash3(i, k, 6, 53) - 0.5) * sStep;
      const c = shape.column(x, z);
      if (c.zone !== Zone.Frosting || c.zoneDepth < 0.1) continue;
      if (c.r < c.ri + 0.18 || c.r > c.ro - 0.05) continue;
      if (inDetail(detail, x, z)) continue;
      const fx = Math.floor(x / FINE);
      const fz = Math.floor(z / FINE);
      const alongX = hash3(i, k, 7, 53) > 0.5;
      const cells = [-1, 0, 1].map((d) => [fx + (alongX ? d : 0), fz + (alongX ? 0 : d)] as const);
      // Lie flat: the frosting top must be level under all three cells.
      const ys = cells.map(([cx, cz]) => {
        let y = Math.ceil((c.top + 0.15) / FINE);
        while (y > 0 && fineGrid.get(cx, y, cz) === 0) y--;
        return y;
      });
      if (ys.some((y) => y !== ys[0] || y <= 0)) continue;
      const color =
        SPRINKLE_COLORS[(i * 7 + k * 3) % SPRINKLE_COLORS.length] ?? PALETTE_INDEX.butter;
      for (const [cx, cz] of cells) fineGrid.set(cx, (ys[0] ?? 0) + 1, cz, color);
      sprinkles++;
    }
  }

  // --- Props ---
  const placed: Placed[] = [];
  const at = (p: { x: number; z: number }, lift = 0): Vector3 =>
    new Vector3(p.x, shape.surface(p.x, p.z) + lift, p.z);
  /** Moves a spot off the path, outward. */
  const offPath = (p: { x: number; z: number }): { x: number; z: number } => {
    let q = p;
    for (let n = 0; n < 6 && shape.column(q.x, q.z).zone === Zone.Path; n++) {
      const r = Math.hypot(q.x, q.z);
      q = { x: (q.x * (r + 0.25)) / r, z: (q.z * (r + 0.25)) / r };
    }
    return q;
  };

  // Granny's bakery, door toward the lagoon.
  placed.push({
    grid: buildBakery(),
    voxel: PROP,
    pivot: [BAKERY_SIZE[0] / 2, 0, BAKERY_SIZE[2] / 2],
    pos: at(SPOTS.bakery, -0.03),
    rotY: faceToward(SPOTS.bakery, { x: -3.5, z: -1 }),
  });

  // Lighthouse, lamp turned toward the hero view.
  placed.push({
    grid: buildLighthouse(),
    voxel: PROP,
    pivot: [LIGHTHOUSE_SIZE[0] / 2, 0, LIGHTHOUSE_SIZE[2] / 2],
    pos: at(SPOTS.lighthouse, -0.03),
    rotY: faceToward(SPOTS.lighthouse, { x: HERO_EYE.x, z: HERO_EYE.z }),
  });

  // Pier: stairs from the inner rim down to a dock on posts.
  const pierTheta = Math.atan2(SPOTS.pier.z, SPOTS.pier.x);
  const rimR = innerRadius(pierTheta) + 0.2;
  const rim = { x: Math.cos(pierTheta) * rimR, z: Math.sin(pierTheta) * rimR };
  const pierTop = Math.round(shape.surface(rim.x, rim.z) / PROP);
  placed.push({
    grid: buildPier(pierTop),
    voxel: PROP,
    pivot: [0, 0, PIER_WIDTH / 2],
    pos: new Vector3(rim.x, MILK_LEVEL, rim.z),
    rotY: Math.PI - pierTheta,
  });

  // Sprinkle-ball trees (RF-06).
  const trees: [number, number, TreeLeaf, number][] = [
    [-28, 0.84, 'green', 1.0],
    [178, 0.82, 'mint', 0.9],
    [168, 0.3, 'green', 1.1],
    [160, 0.27, 'pink', 0.85],
    [-44, 0.72, 'green', 1.05],
    [8, 0.84, 'mint', 0.95],
    [-60, 0.22, 'pink', 0.8],
    [114, 0.78, 'green', 0.9],
    [32, 0.7, 'mint', 1.0],
    [64, 0.3, 'green', 0.85],
  ];
  trees.forEach(([deg, u, leaf, h], i) => {
    const p = offPath(band(deg, u));
    placed.push({
      grid: buildSprinkleTree(i + 3, leaf, h),
      voxel: PROP,
      pivot: [TREE_SIZE[0] / 2, 0, TREE_SIZE[2] / 2],
      pos: at(p, -0.06),
      rotY: hash3(i, 1, 1, 3) * Math.PI * 2,
    });
    // Mushrooms at the foot of some trees.
    if (i % 2 === 0) {
      for (let m = 0; m < 3; m++) {
        const a = hash3(i, m, 2, 3) * Math.PI * 2;
        const q = { x: p.x + Math.cos(a) * 0.75, z: p.z + Math.sin(a) * 0.75 };
        if (shape.column(q.x, q.z).zone !== Zone.Meadow || inDetail(detail, q.x, q.z)) continue;
        stamp(
          fineGrid,
          mushroomStamp(i * 7 + m, 0.8 + m * 0.25),
          Math.floor(q.x / FINE),
          groundVoxel(q.x, q.z),
          Math.floor(q.z / FINE),
        );
      }
    }
  });

  // Six wild donuts in the grass, and floaters bobbing in the milk.
  const ds = donutSize(DONUT_VOXEL);
  const donutPivot = [ds[0] / 2, 0, ds[2] / 2] as const;
  const hs = donutSize(DONUT_HERO_VOXEL);
  const grassDonuts: [number, number, DonutFlavor][] = [
    [104, 0.36, 'strawberry'],
    [122, 0.68, 'chocolate'],
    [136, 0.31, 'glazed'],
    [84, 0.7, 'powdered'],
    [-131, 0.3, 'strawberry'],
    [-100, 0.6, 'chocolate'],
  ];
  const spots: Record<string, Vector3> = {};
  grassDonuts.forEach(([deg, u, flavor], i) => {
    // Donut 4 is the hero: the close-up subject, at close-up density.
    const hero = i === 4;
    const p = hero ? HERO_DONUT : offPath(band(deg, u));
    spots[`donut${i}`] = at(p);
    placed.push({
      grid: buildDonut(flavor, i + 1, hero ? DONUT_HERO_VOXEL : DONUT_VOXEL),
      voxel: hero ? DONUT_HERO_VOXEL : DONUT_VOXEL,
      pivot: hero ? [hs[0] / 2, 0, hs[2] / 2] : donutPivot,
      pos: at(p, -0.03),
      rotY: hash3(i, 2, 2, 7) * Math.PI * 2,
    });
  });
  const floaters: [number, number, DonutFlavor][] = [
    [120, 1.6, 'strawberry'],
    [-150, 3.3, 'glazed'],
    [-50, 2.2, 'chocolate'],
    [70, 3.4, 'glazed'],
  ];
  /** Things standing in the milk get a foam ring (x, z, radius). */
  const milkContacts: [number, number, number][] = [];
  floaters.forEach(([deg, r, flavor], i) => {
    const p = polar(deg, r);
    milkContacts.push([p.x, p.z, 0.36]);
    placed.push({
      grid: buildDonut(flavor, i + 11),
      voxel: DONUT_VOXEL,
      pivot: donutPivot,
      pos: new Vector3(p.x, MILK_LEVEL - 0.075, p.z),
      rotY: hash3(i, 3, 2, 7) * Math.PI * 2,
      tiltX: 0.08,
    });
  });
  // Where the syrup fall meets the milk: a small foam splash and an amber swirl.
  const fall = MEADOW_LAYOUT.falls[0];
  const fallFoot = fall
    ? polar(fall.deg, innerRadius((fall.deg * Math.PI) / 180) - 0.1)
    : { x: 1e4, z: 1e4 };
  if (fall) milkContacts.push([fallFoot.x, fallFoot.z, 0.12]);

  // Clouds around and below the island (RF-03).
  const clouds: [number, number, number, number][] = [
    [-18.6, 1, -22.9, 1.0],
    [22, 1.5, -17, 0.85],
    [-13, -2.5, 4, 0.8],
    [14.5, -3, 7, 0.9],
    [-1.6, -4, -38, 0.9],
    [17.5, -3, -1, 0.75],
    // Distant clouds in the ground-level view's sky.
    [21, 10, -25, 1.1],
    [17, 9.5, -27, 1.0],
    // A soft cloud bed under the island, so it floats on something (RF-03).
    [-5, -7, 2, 1.4],
    [6, -7.5, -4, 1.4],
    [-9, -6.5, -9, 1.3],
    [10, -7, 4, 1.3],
  ];
  clouds.forEach(([x, y, z, s], i) => {
    placed.push({
      grid: buildCloud(i + 1, s),
      voxel: CLOUD,
      pivot: [CLOUD_SIZE[0] / 2, 0, CLOUD_SIZE[2] / 2],
      pos: new Vector3(x, y, z),
      rotY: hash3(i, 9, 9, 1) * Math.PI,
      shadow: false,
    });
  });

  // --- Meshing ---
  const material = createVoxelMaterial();

  const pool = new MesherPool();
  const t0 = performance.now();
  const coarse = new VoxelObject(terrain.coarse, COARSE, material, pool);
  const fine = new VoxelObject(fineGrid, FINE, material, pool);
  scene.add(coarse, fine);
  const objects: Promise<unknown>[] = [coarse.update(), fine.update()];
  if (terrain.macro) {
    const macro = new VoxelObject(terrain.macro, MACRO, material, pool);
    scene.add(macro);
    objects.push(macro.update());
  }
  const groups: Group[] = [];
  for (const p of placed) {
    const { group, ready } = placeModel(p, material, pool);
    groups.push(group);
    scene.add(group);
    objects.push(ready);
  }

  // Chimney steam: voxel puffs drifting up and away from the sun.
  const chimney = new Vector3(...BAKERY_CHIMNEY)
    .sub(new Vector3(BAKERY_SIZE[0] / 2, 0, BAKERY_SIZE[2] / 2))
    .multiplyScalar(PROP);
  const bakeryGroup = groups[0];
  const steam: { group: Group; k: number }[] = [];
  if (bakeryGroup) {
    for (let k = 0; k < 5; k++) {
      const puff = buildSteamPuff(k, 4 + k * 1.6);
      const s = 4 + k * 1.6 + 2;
      const { group, ready } = placeModel(
        { grid: puff, voxel: PROP, pivot: [s, s, s], pos: new Vector3(), rotY: k, shadow: false },
        material,
        pool,
      );
      bakeryGroup.add(group);
      objects.push(ready);
      steam.push({ group, k });
    }
  }
  const poseSteam = (t: number): void => {
    for (const { group, k } of steam) {
      const f = (k + t * 0.25) % 5;
      group.position.set(
        chimney.x - f * 0.12 + Math.sin(f * 1.7 + t) * 0.05,
        chimney.y + 0.15 + f * 0.32,
        chimney.z + f * 0.05,
      );
    }
  };
  poseSteam(0);

  // The lighthouse lamp lights its surroundings (warm, short range).
  const lighthouseGroup = groups[1];
  if (lighthouseGroup) {
    const lamp = new PointLight(new Color(LIGHT_PALETTE.lampLight), 6, 7, 2);
    lamp.position
      .set(...LIGHTHOUSE_LAMP)
      .sub(new Vector3(LIGHTHOUSE_SIZE[0] / 2, 0, LIGHTHOUSE_SIZE[2] / 2))
      .multiplyScalar(PROP);
    lighthouseGroup.add(lamp);
  }

  // --- Milk lagoon (RF-02, RF-07) ---
  const reflection = low ? null : new PlanarReflection(MILK_LEVEL, 0.5);
  const milk: Milk = createMilk({
    reflection: reflection
      ? { texture: reflection.target.texture, textureMatrix: reflection.textureMatrix, strength: 1 }
      : undefined,
    radius: INNER_BASE + 1.2,
    shoreBase: INNER_BASE,
    shoreAmp: INNER_AMP,
    waves: RING_WAVES,
    posts: [...pierPosts(rim, pierTheta, pierTop), ...milkContacts],
    syrup: [fallFoot.x, fallFoot.z, 0.9],
  });
  milk.mesh.position.y = MILK_LEVEL;
  scene.add(milk.mesh);

  await Promise.all(objects);
  pool.dispose();

  return {
    scene,
    environment,
    shape,
    sun,
    spots,
    update(t: number) {
      milk.setTime(t);
      poseSteam(t);
    },
    prerender(gl, camera) {
      if (!reflection) return;
      reflection.render(gl, scene, camera, milk.mesh, [milk.mesh, sky]);
      milk.setReflectionSize(reflection.target.width, reflection.target.height);
    },
    stats: {
      coarseGenMs: terrain.stats.coarseMs,
      fineGenMs: terrain.stats.fineMs,
      macroGenMs: terrain.stats.macroMs,
      meshMs: performance.now() - t0,
      flowers,
      sprinkles,
    },
  };
}

/** Pier post footprints in world space (foam rings in the milk). */
function pierPosts(
  rim: { x: number; z: number },
  theta: number,
  topY: number,
): [number, number, number][] {
  const out: [number, number, number][] = [];
  const dir = { x: -Math.cos(theta), z: -Math.sin(theta) };
  const side = { x: -dir.z, z: dir.x };
  for (const px of pierPostXs(topY)) {
    const along = (px + 2) * PROP;
    for (const s of [-(PIER_WIDTH / 2 - 2) * PROP, (PIER_WIDTH / 2 - 2) * PROP]) {
      out.push([rim.x + dir.x * along + side.x * s, rim.z + dir.z * along + side.z * s, 0.07]);
    }
  }
  return out;
}

function placeModel(
  p: Placed,
  material: Material,
  pool: MesherPool,
): { group: Group; ready: Promise<unknown> } {
  const group = new Group();
  group.position.copy(p.pos);
  group.rotation.set(p.tiltX ?? 0, p.rotY, 0, 'YXZ');
  // Model builders hand back clean grids; mesh every chunk.
  for (const c of p.grid.chunkCoords()) p.grid.markDirty(c.cx, c.cy, c.cz);
  const obj = new VoxelObject(p.grid, p.voxel, material, pool);
  obj.castsShadow = p.shadow ?? true;
  obj.position.set(-p.pivot[0] * p.voxel, -p.pivot[1] * p.voxel, -p.pivot[2] * p.voxel);
  group.add(obj);
  return { group, ready: obj.update() };
}
