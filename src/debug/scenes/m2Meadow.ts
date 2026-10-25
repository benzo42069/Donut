import { PerspectiveCamera, Vector3 } from 'three';
import type { QualitySettings } from '../../engine/quality';
import type { PostSettings } from '../../engine/render/Renderer';
import {
  HERO_EYE,
  SUN_DIR,
  buildMeadowDiorama,
  type Diorama,
} from '../../game/world/MeadowDiorama';
import { GROUND_AIM, GROUND_EYE } from '../../game/world/meadowLayout';
import type { ShotScene } from '../shotTypes';

interface Framing {
  eye: Vector3;
  target: Vector3;
  fov: number;
  post: PostSettings;
}

/** Eye/target on the ground: `lift` meters above the terrain surface. */
const onGround = (w: Diorama, p: { x: number; z: number }, lift: number): Vector3 =>
  new Vector3(p.x, w.shape.surface(p.x, p.z) + lift, p.z);

/** M2 gate cameras (PLAN M2). */
const FRAMINGS = {
  /** 3/4 high angle over the whole island, like reference 01. */
  hero: (): Framing => ({
    eye: HERO_EYE.clone(),
    target: new Vector3(0.3, -0.7, 0),
    fov: 33,
    post: { aoRadius: 0.5, aoFalloff: 0.5, aoIntensity: 2.0 },
  }),
  /** Donut height on the meadow, looking down the path at the backlit bakery (K-04). */
  ground: (w: Diorama): Framing => {
    const eye = onGround(w, GROUND_EYE, 0.42);
    const target = onGround(w, GROUND_AIM, 0.55);
    return {
      eye,
      target,
      fov: 40,
      post: {
        aoRadius: 0.25,
        aoFalloff: 0.3,
        aoIntensity: 2.2,
        dof: {
          focusDistance: eye.distanceTo(w.spots.donut4 ?? target),
          focusRange: 1.8,
          bokehScale: 1.6,
        },
      },
    };
  },
  /** Close on a wild donut sitting in the grass. */
  closeupDonut: (w: Diorama): Framing => {
    const d = w.spots.donut4 ?? new Vector3();
    // 3/4 front light: the camera stands 50° off the sun's bearing, back to the sun.
    const toSun = new Vector3(SUN_DIR.x, 0, SUN_DIR.z)
      .normalize()
      .applyAxisAngle(new Vector3(0, 1, 0), -0.87);
    const eye = onGround(w, { x: d.x + toSun.x * 1.6, z: d.z + toSun.z * 1.6 }, 0.5);
    const target = d.clone().add(new Vector3(0, 0.1, 0));
    return {
      eye,
      target,
      fov: 32,
      post: {
        aoRadius: 0.08,
        aoFalloff: 0.12,
        aoIntensity: 2.4,
        dof: { focusDistance: eye.distanceTo(target), focusRange: 0.35, bokehScale: 4 },
      },
    };
  },
  /** Low over the milk, looking at the pier and lighthouse against the sun. */
  lagoonEdge: (): Framing => ({
    eye: new Vector3(-4.0, 0.6, 1.7),
    target: new Vector3(4.0, 2.4, -1.3),
    fov: 50,
    post: { aoRadius: 0.3, aoFalloff: 0.35, aoIntensity: 2.0 },
  }),
} satisfies Record<string, (w: Diorama) => Framing>;

export type M2Framing = keyof typeof FRAMINGS;

export function m2Shot(name: M2Framing) {
  return async (aspect: number, quality: QualitySettings): Promise<ShotScene> => {
    const world = await buildMeadowDiorama(quality);
    const f = FRAMINGS[name](world);
    const camera = new PerspectiveCamera(f.fov, aspect, 0.03, 900);
    camera.position.copy(f.eye);
    camera.lookAt(f.target);
    console.log('[m2]', JSON.stringify(world.stats));
    return {
      scene: world.scene,
      camera,
      post: f.post,
      environment: world.environment,
      update: (t) => world.update(t),
      prerender: (gl, cam) => world.prerender(gl, cam),
    };
  };
}
