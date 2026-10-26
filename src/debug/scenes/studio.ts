import {
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SpotLight,
  Vector3,
} from 'three';
import { LIGHT_PALETTE } from '../../art/palette';
import type { QualitySettings } from '../../engine/quality';
import type { PostSettings } from '../../engine/render/Renderer';
import { DEFAULT_TUNING, type VoxelMaterialTuning } from '../../engine/render/Materials';

/**
 * The asset gallery's photo studio (K-06, reference 04): a seamless cream cloth
 * sweep with soft folds, a warm key softbox from the upper right (K-01), a cool
 * fill, a back rim light, and softbox reflections for the glossy frostings.
 */
export interface Studio {
  scene: Scene;
  environment: Scene;
  key: SpotLight;
}

export interface StudioOptions {
  /** Half extent of the key light's shadow camera (meters). */
  shadowExtent?: number;
  /** Key light direction (toward the light). */
  keyDir?: Vector3;
  /** Floor depth in front of the curve, and the sweep's width (meters). */
  depth?: number;
  width?: number;
  /** Where the floor starts curving up into the wall (z, meters). */
  back?: number;
}

/** A floor that curves up into a backdrop, with gentle cloth folds on the wall. */
function sweepGeometry(width: number, depth: number, back: number): BufferGeometry {
  const nu = 120;
  const nv = 90;
  const radius = 3.2;
  const wall = 10;
  // Profile: floor from z = depth to z = back, a quarter arc, then the wall.
  const floorLen = depth - back;
  const arcLen = (Math.PI / 2) * radius;
  const total = floorLen + arcLen + wall;
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  let i = 0;
  for (let j = 0; j <= nv; j++) {
    // Denser sampling near the floor and the curve.
    const s = Math.pow(j / nv, 1.35) * total;
    let y: number;
    let z: number;
    if (s < floorLen) {
      y = 0;
      z = depth - s;
    } else if (s < floorLen + arcLen) {
      const a = (s - floorLen) / radius;
      y = radius - Math.cos(a) * radius;
      z = back - Math.sin(a) * radius;
    } else {
      y = radius + (s - floorLen - arcLen);
      z = back - radius;
    }
    for (let k = 0; k <= nu; k++) {
      const x = (k / nu - 0.5) * width;
      // Soft draped folds (reference 04's cloth): diagonal swags of uneven width
      // and depth, starting on the curve and fading out toward the floor.
      const up = Math.min(1, Math.max(0, (y - 0.15) / 2.5));
      const swell = 0.6 + 0.4 * Math.sin(x * 0.23 + 1.3);
      const fold =
        (0.13 * Math.sin(x * 0.55 + y * 0.42 + 0.7) * swell +
          0.07 * Math.sin(x * 1.37 - y * 0.61 + 1.9) +
          0.03 * Math.sin(x * 2.71 + y * 0.9)) *
        up;
      pos[i++] = x;
      pos[i++] = y;
      pos[i++] = z + fold;
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < nv; j++)
    for (let k = 0; k < nu; k++) {
      const a = j * (nu + 1) + k;
      const b = a + nu + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function createStudio(quality: QualitySettings, opts: StudioOptions = {}): Studio {
  const scene = new Scene();
  scene.background = new Color(LIGHT_PALETTE.studioCream);
  const depth = opts.depth ?? 8;
  const sweep = new Mesh(
    sweepGeometry(opts.width ?? 40, depth, opts.back ?? -3),
    // The cloth barely sees the cool studio dome and glows faintly in its own
    // warm color, so outside the key's pool it falls off to a deeper warm peach,
    // never to a hueless grey (art bible §10.6, §4).
    new MeshStandardMaterial({
      color: new Color(LIGHT_PALETTE.studioCloth),
      roughness: 0.92,
      envMapIntensity: 0.1,
      emissive: new Color(LIGHT_PALETTE.studioClothGlow),
      emissiveIntensity: 0.3,
    }),
  );
  sweep.receiveShadow = true;
  scene.add(sweep);

  // Key: a warm spot from the upper right whose pool covers the subjects and
  // falls off softly across the sweep, so the subjects hold the strongest
  // contrast in the frame (art bible §4) and the cloth darkens toward the edges.
  // No distance decay, so inside the pool it lights like the sun (soft VSM shadows).
  const keyDir = (opts.keyDir ?? new Vector3(0.75, 0.62, 0.42)).clone().normalize();
  const ext = opts.shadowExtent ?? 4;
  const dist = 30;
  const angle = Math.atan((ext * 2.0) / dist);
  const key = new SpotLight(new Color(LIGHT_PALETTE.studioKey), 5.0, 0, angle, 1, 0);
  key.position.copy(keyDir).multiplyScalar(dist);
  key.target.position.set(0, 0.3, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  key.shadow.camera.near = 10;
  key.shadow.camera.far = 50;
  // Blur and normal bias are set in texels, so a wide pool (the props shelf)
  // keeps the same softness without VSM streaks on thin parts.
  const texel = (2 * ext * 2.0) / quality.shadowMapSize;
  key.shadow.radius = Math.min(9, 0.045 / texel);
  key.shadow.blurSamples = 24;
  key.shadow.bias = -0.001;
  key.shadow.normalBias = Math.max(0.012, texel * 2.5);
  scene.add(key, key.target);

  // Cool fill from the front left: the shadow sides go blue-lilac (warm key,
  // cool fill). It is a soft spot over the subjects, so it cools their shadow
  // sides without turning the far cloth grey-blue; a warm hemisphere bounce is
  // all that lights the cloth outside the pool, so the edges fall off warm.
  const fill = new SpotLight(new Color(LIGHT_PALETTE.studioFill), 1.1, 0, angle * 1.3, 1, 0);
  fill.position.set(-0.8, 0.35, 0.6).normalize().multiplyScalar(dist);
  fill.target.position.copy(key.target.position);
  scene.add(fill, fill.target);
  scene.add(
    new HemisphereLight(
      new Color(LIGHT_PALETTE.studioShade),
      new Color(LIGHT_PALETTE.studioShade),
      0.35,
    ),
  );
  // Cool rim from the back left, so silhouettes separate from the cream sweep.
  // Also a soft spot on the subjects: as a directional light it washed the
  // whole floor and cyc curve grey-blue.
  const rim = new SpotLight(new Color(LIGHT_PALETTE.studioRim), 1.8, 0, angle * 1.3, 1, 0);
  rim.position.set(-0.7, 0.55, -0.8).normalize().multiplyScalar(dist);
  rim.target.position.copy(key.target.position);
  scene.add(rim, rim.target);
  scene.environmentIntensity = 0.4;

  // Environment: a cool studio dome (ambient for the shadow sides) with warm
  // softboxes, for gloss reflections.
  const environment = new Scene();
  environment.add(
    new Mesh(
      new SphereGeometry(40, 32, 16),
      new MeshBasicMaterial({ color: new Color(LIGHT_PALETTE.studioFill), side: BackSide }),
    ),
  );
  const softbox = (dir: Vector3, w: number, h: number, power: number): void => {
    const m = new Mesh(
      new BoxGeometry(w, h, 0.1),
      new MeshBasicMaterial({ color: new Color(LIGHT_PALETTE.studioKey).multiplyScalar(power) }),
    );
    m.position.copy(dir.clone().normalize().multiplyScalar(20));
    m.lookAt(0, 0, 0);
    environment.add(m);
  };
  softbox(keyDir, 14, 9, 4);
  softbox(new Vector3(-0.8, 0.6, 0.4), 10, 6, 1.6);
  softbox(new Vector3(0, 1, 0), 18, 18, 1.4);
  return { scene, environment, key };
}

/**
 * Studio material tuning: candy colors hold their hue only partly, and the warm
 * wrap of soft materials is short, so the cool fill tints shadow sides (the
 * island's full hold and long wrap keep them flat and warm).
 */
export const STUDIO_TUNING: VoxelMaterialTuning = {
  ...DEFAULT_TUNING,
  hueHold: 0.25,
  wrap: 0.2,
  // A brighter fresnel rim on translucent glazes (classic, jelly), art bible §5.
  rim: 0.8,
};

/** Studio post: crisp (no DoF), contact AO scaled to small props, light grade. */
export const STUDIO_POST: PostSettings = {
  aoRadius: 0.2,
  aoFalloff: 0.15,
  aoIntensity: 2.2,
  aoColor: LIGHT_PALETTE.studioOcclusion,
  bloomThreshold: 1.2,
  bloomIntensity: 0.4,
  grade: 0.1,
  vignette: 0.24,
};

/**
 * A camera framed for 16:9; wider frames (phones in landscape) keep the 16:9
 * horizontal coverage so nothing in the lineup is cut.
 */
export function studioCamera(
  aspect: number,
  fov: number,
  eye: Vector3,
  target: Vector3,
): PerspectiveCamera {
  let f = fov;
  if (aspect > 16 / 9) {
    // Keep a blend of width and height: the lineups are wide.
    const k = Math.pow(16 / 9 / aspect, 0.85);
    f = (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * k) * 180) / Math.PI;
  }
  const cam = new PerspectiveCamera(f, aspect, 0.05, 200);
  cam.position.copy(eye);
  cam.lookAt(target);
  return cam;
}
