import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
} from 'three';
import {
  LIGHT_PALETTE,
  PALETTE_INDEX,
  hash3,
  jitteredLinear,
  type VoxelColorName,
} from '../../art/palette';
import { createSky } from '../../engine/render/Sky';
import type { ShotScene } from '../shotTypes';

/** Hero-prop voxel size (art bible §3). */
const PROP_VOXEL = 1 / 32;
/** Near-terrain voxel size (art bible §3). */
const TERRAIN_VOXEL = 1 / 8;

interface Voxel {
  x: number;
  y: number;
  z: number;
  color: VoxelColorName;
}

const SPRINKLES: VoxelColorName[] = [
  'sprinkleRed',
  'sprinkleOrange',
  'sprinkleYellow',
  'sprinkleGreen',
  'sprinkleBlue',
  'sprinkleViolet',
];

/** A 24³ dough cube with dripping pink frosting and sprinkles: the M0 "test cube". */
function frostedCubeVoxels(n: number): Voxel[] {
  const out: Voxel[] = [];
  const drip = (x: number, z: number): number => {
    // Drip length per edge column, deterministic.
    const h = hash3(x, 0, z, 7);
    return 3 + Math.floor(Math.pow(h, 3) * 9);
  };
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        const edge = x === 0 || y === 0 || z === 0 || x === n - 1 || y === n - 1 || z === n - 1;
        if (!edge) continue;
        const fromTop = n - 1 - y;
        const side = x === 0 || z === 0 || x === n - 1 || z === n - 1;
        const dripLen = side ? drip(x, z) : 0;
        let color: VoxelColorName;
        if (fromTop < 2 || fromTop < dripLen) {
          color = fromTop < 1 ? 'frostingPinkLight' : 'frostingPink';
        } else if (y < 2) {
          color = 'doughCrust';
        } else if (y < 5) {
          color = 'doughToasted';
        } else {
          color = 'doughGolden';
        }
        out.push({ x, y, z, color });
      }
    }
  }
  // Sprinkles: 1×1×3 capsules lying on top, rotated in 90° steps (art bible §5).
  for (let i = 0; i < 26; i++) {
    const sx = 2 + Math.floor(hash3(i, 1, 0, 11) * (n - 6));
    const sz = 2 + Math.floor(hash3(i, 2, 0, 11) * (n - 6));
    const alongX = hash3(i, 3, 0, 11) > 0.5;
    const color = SPRINKLES[i % SPRINKLES.length] ?? 'sprinkleRed';
    for (let k = 0; k < 3; k++) {
      out.push({ x: sx + (alongX ? k : 0), y: n, z: sz + (alongX ? 0 : k), color });
    }
  }
  return out;
}

function voxelMesh(voxels: Voxel[], size: number, roughness: number): InstancedMesh {
  const geo = new BoxGeometry(size, size, size);
  const mat = new MeshStandardMaterial({ roughness, metalness: 0 });
  const mesh = new InstancedMesh(geo, mat, voxels.length);
  const m = new Matrix4();
  const c = new Color();
  voxels.forEach((v, i) => {
    m.makeTranslation((v.x + 0.5) * size, (v.y + 0.5) * size, (v.z + 0.5) * size);
    mesh.setMatrixAt(i, m);
    const lin = jitteredLinear(PALETTE_INDEX[v.color], v.x, v.y, v.z);
    mesh.setColorAt(i, c.setRGB(lin.r, lin.g, lin.b));
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function meadowVoxels(radius: number): Voxel[] {
  const out: Voxel[] = [];
  for (let x = -radius; x < radius; x++) {
    for (let z = -radius; z < radius; z++) {
      const d = Math.hypot(x + 0.5, z + 0.5);
      if (d > radius) continue;
      const hill = Math.max(0, Math.sin(x * 0.21) * Math.cos(z * 0.17) + 0.4) * 5;
      const swell = Math.round(hill * Math.min(1, Math.max(0, (d - 8) / 10)));
      const color: VoxelColorName = hash3(x, 0, z, 3) > 0.7 ? 'grassDeep' : 'grassMint';
      for (let y = -3; y <= swell - 1; y++) {
        out.push({ x, y, z, color: y === swell - 1 ? color : 'doughToasted' });
      }
    }
  }
  return out;
}

export function buildTestCubeScene(aspect: number): ShotScene {
  const scene = new Scene();
  scene.fog = new Fog(new Color(LIGHT_PALETTE.fog), 18, 60);

  // Golden-hour key from the upper right (K-01), cool sky fill, warm bounce.
  const sunDir = new Vector3(-0.55, 0.42, 0.72).normalize();
  const sun = new DirectionalLight(new Color(LIGHT_PALETTE.sunGolden), 3.2);
  sun.position.copy(sunDir).multiplyScalar(12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -4;
  sun.shadow.camera.right = 4;
  sun.shadow.camera.top = 4;
  sun.shadow.camera.bottom = -4;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 30;
  sun.shadow.radius = 6;
  sun.shadow.blurSamples = 16;
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  scene.add(
    new HemisphereLight(
      new Color(LIGHT_PALETTE.skyFill),
      new Color(LIGHT_PALETTE.groundBounce),
      1.1,
    ),
  );
  scene.add(createSky(sunDir));

  const meadow = voxelMesh(meadowVoxels(24), TERRAIN_VOXEL, 0.9);
  scene.add(meadow);

  const n = 24;
  const cube = new Group();
  const cubeMesh = voxelMesh(frostedCubeVoxels(n), PROP_VOXEL, 0.45);
  cubeMesh.position.set((-n / 2) * PROP_VOXEL, 0, (-n / 2) * PROP_VOXEL);
  cube.add(cubeMesh);
  scene.add(cube);

  const camera = new PerspectiveCamera(32, aspect, 0.1, 500);
  camera.position.set(1.9, 1.5, 2.3);
  camera.lookAt(0, 0.32, 0);

  return {
    scene,
    camera,
    update(t: number) {
      cube.rotation.y = 0.35 + t * 0.6;
    },
    stripTimes: [0, 0.5, 1],
  };
}
