import { PerspectiveCamera, Vector3 } from 'three';
import type { QualitySettings } from '../../engine/quality';
import type { PostSettings } from '../../engine/render/Renderer';
import { buildMeadowDiorama } from '../../game/world/MeadowDiorama';
import type { ShotScene } from '../shotTypes';

interface Framing {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  post: PostSettings;
}

/** M2 gate cameras (PLAN M2). */
const FRAMINGS: Record<string, Framing> = {
  hero: {
    position: [-8, 23, 32.5],
    target: [0.3, -0.7, 0],
    fov: 33,
    post: { aoRadius: 0.5, aoFalloff: 0.5, aoIntensity: 2.0 },
  },
};

export function m2Shot(name: keyof typeof FRAMINGS) {
  return async (aspect: number, quality: QualitySettings): Promise<ShotScene> => {
    const f = FRAMINGS[name];
    if (!f) throw new Error(`no framing ${name}`);
    const world = await buildMeadowDiorama(quality);
    const camera = new PerspectiveCamera(f.fov, aspect, 0.05, 900);
    camera.position.set(...f.position);
    camera.lookAt(new Vector3(...f.target));
    console.log('[m2]', JSON.stringify(world.stats));
    return {
      scene: world.scene,
      camera,
      post: f.post,
      environment: world.environment,
      update: (t) => world.update(t),
    };
  };
}
