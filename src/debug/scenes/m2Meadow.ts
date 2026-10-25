import { Color, Fog, PerspectiveCamera, Vector3 } from 'three';
import { LIGHT_PALETTE } from '../../art/palette';
import type { QualitySettings } from '../../engine/quality';
import type { PostSettings } from '../../engine/render/Renderer';
import type { DetailPatch } from '../../game/world/IslandTerrain';
import { HERO_EYE, buildMeadowDiorama, type Diorama } from '../../game/world/MeadowDiorama';
import { GROUND_AIM, GROUND_EYE, HERO_DONUT } from '../../game/world/meadowLayout';
import type { ShotScene } from '../shotTypes';

interface Framing {
  eye: Vector3;
  target: Vector3;
  fov: number;
  post: PostSettings;
}

interface ShotPlan {
  /** Near-field macro patches this camera needs (built with the world). */
  detail?: DetailPatch[];
  /** Aerial perspective for this view: fog near and far (meters). */
  fog?: [number, number];
  frame(w: Diorama): Framing;
}

/**
 * Macro discs covering a camera's near field: from the lens out to `far` meters
 * along `dir`, wide enough for a horizontal half-angle of `half` radians. Beyond
 * `far` the 1/32 m skin is under the 12 px density limit (art bible §3).
 */
function nearField(
  eye: { x: number; z: number },
  dir: { x: number; z: number },
  far: number,
  half: number,
): DetailPatch[] {
  const l = Math.hypot(dir.x, dir.z);
  const out: DetailPatch[] = [];
  for (let d = 0.8; d < far + 1; d *= 1.7) {
    out.push({
      x: eye.x + (dir.x / l) * d,
      z: eye.z + (dir.z / l) * d,
      radius: d * Math.tan(half) + 0.8,
    });
  }
  return out;
}

/** Eye/target on the ground: `lift` meters above the terrain surface. */
const onGround = (w: Diorama, p: { x: number; z: number }, lift: number): Vector3 =>
  new Vector3(p.x, w.shape.surface(p.x, p.z) + lift, p.z);

/**
 * The close-up camera looks along the meadow toward the low sun (side backlight:
 * rim light and glaze sheen on the frosting), with clear meadow behind the donut.
 */
const CLOSEUP_DIR = new Vector3(-Math.cos(0.17), 0, Math.sin(0.17));
const CLOSEUP_DIST = 3.2;

/** M2 gate cameras (PLAN M2). */
const PLANS = {
  /** 3/4 high angle over the whole island, like reference 01. */
  hero: {
    frame: () => ({
      eye: HERO_EYE.clone(),
      target: new Vector3(0.3, -0.9, 0),
      fov: 33,
      post: { aoRadius: 0.5, aoFalloff: 0.5, aoIntensity: 2.0 },
    }),
  },
  /** Donut height on the meadow, looking down the path at the backlit bakery (K-04). */
  ground: {
    detail: nearField(
      GROUND_EYE,
      { x: GROUND_AIM.x - GROUND_EYE.x, z: GROUND_AIM.z - GROUND_EYE.z },
      4.6,
      0.62,
    ),
    fog: [7, 48],
    frame: (w: Diorama) => {
      const eye = onGround(w, GROUND_EYE, 0.35);
      const target = onGround(w, GROUND_AIM, 1.45);
      const donut = w.spots.donut4 ?? target;
      return {
        eye,
        target,
        fov: 38,
        post: {
          aoRadius: 0.2,
          aoFalloff: 0.25,
          aoIntensity: 2.2,
          dof: { focusDistance: eye.distanceTo(donut), focusRange: 1.6, bokehScale: 1.8 },
        },
      };
    },
  },
  /** Close on the hero donut sitting in the grass. */
  closeupDonut: {
    detail: nearField(
      {
        x: HERO_DONUT.x + CLOSEUP_DIR.x * CLOSEUP_DIST,
        z: HERO_DONUT.z + CLOSEUP_DIR.z * CLOSEUP_DIST,
      },
      { x: -CLOSEUP_DIR.x, z: -CLOSEUP_DIR.z },
      5.8,
      0.5,
    ),
    fog: [6, 40],
    frame: (w: Diorama) => {
      const d = w.spots.donut4 ?? new Vector3();
      const eye = onGround(
        w,
        { x: d.x + CLOSEUP_DIR.x * CLOSEUP_DIST, z: d.z + CLOSEUP_DIR.z * CLOSEUP_DIST },
        1.0,
      );
      const target = d.clone().add(new Vector3(0, 0.1, 0));
      return {
        eye,
        target,
        fov: 28,
        post: {
          aoRadius: 0.06,
          aoFalloff: 0.1,
          aoIntensity: 2.4,
          dof: { focusDistance: eye.distanceTo(target), focusRange: 1.2, bokehScale: 2.5 },
        },
      };
    },
  },
  /** Low over the milk, looking at the pier and lighthouse against the sun. */
  lagoonEdge: {
    frame: () => ({
      eye: new Vector3(-4.0, 0.55, 1.7),
      target: new Vector3(4.0, 2.0, -1.3),
      fov: 50,
      post: { aoRadius: 0.3, aoFalloff: 0.35, aoIntensity: 2.0 },
    }),
  },
} satisfies Record<string, ShotPlan>;

export type M2Framing = keyof typeof PLANS;

export function m2Shot(name: M2Framing) {
  return async (aspect: number, quality: QualitySettings): Promise<ShotScene> => {
    const plan: ShotPlan = PLANS[name];
    const world = await buildMeadowDiorama(quality, { detail: plan.detail });
    const f = plan.frame(world);
    if (plan.fog) world.scene.fog = new Fog(new Color(LIGHT_PALETTE.fog), plan.fog[0], plan.fog[1]);
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
