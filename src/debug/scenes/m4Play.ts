import type { QualitySettings } from '../../engine/quality';
import { Game, STEP, type Spawn, type WorldInput } from '../../game/Game';
import type { DetailPatch } from '../../game/world/IslandTerrain';
import { band } from '../../game/world/meadowLayout';
import { TouchControls } from '../../ui/TouchControls';
import { loadTouchIcons } from '../../ui/touchIcons';
import type { ShotScene } from '../shotTypes';

const DEG = Math.PI / 180;

/**
 * The M4 gate stage: Glazey crosses the meadow near the lagoon rim, seen from
 * the hero direction (reference 01) with the golden sun at the upper right.
 * The gameplay camera starts out front and to his right, so the 3/4 face
 * shows, with the milk lagoon and the far side of the ring behind him.
 */
/** Bearing of the hero camera from the island center (yaw). */
const HERO_YAW = Math.atan2(-8, 32.5);
const START = band(97, 0.32);
const WALK_YAW = HERO_YAW + 24 * DEG;
const SPAWN: Spawn = { x: START.x, z: START.z, yaw: WALK_YAW, cameraYaw: HERO_YAW };
/** Stick magnitude: a brisk walk, not a run. */
const PACE = 0.78;
const JUMP_AT = 0.9;

/** Macro terrain under the walk, where the gameplay lens comes closest. */
function walkDetail(): DetailPatch[] {
  const out: DetailPatch[] = [];
  const dx = Math.sin(WALK_YAW);
  const dz = Math.cos(WALK_YAW);
  for (let d = -1; d <= 4; d += 1.6)
    out.push({ x: START.x + dx * d, z: START.z + dz * d, radius: 2.6 });
  return out;
}

const walking =
  (jumpAt: number | null) =>
  (t: number): WorldInput => {
    const jump = jumpAt !== null && t >= jumpAt && t < jumpAt + 0.35;
    return {
      move: { x: Math.sin(WALK_YAW) * PACE, z: Math.cos(WALK_YAW) * PACE },
      jump,
      jumpPressed: jumpAt !== null && t >= jumpAt && t < jumpAt + STEP,
    };
  };

/** First time after `from` when `test` holds, stepping the deterministic sim. */
function findTime(game: Game, from: number, test: () => boolean, limit = 4): number {
  game.simulateTo(from);
  while (game.now < from + limit) {
    game.simulateTo(game.now + STEP);
    if (test()) return game.now;
  }
  return game.now;
}

/** Walk-cycle phase crossing `target` (radians) after `from`. */
function phaseTime(game: Game, from: number, target: number): number {
  let last = Number.NaN;
  return findTime(game, from, () => {
    const p = game.motion.phase;
    const hit =
      !Number.isNaN(last) && ((last < target && p >= target) || (target === 0 && p < last));
    last = p;
    return hit;
  });
}

export type M4Shot = 'walk' | 'jump' | 'touch';

export function m4Shot(kind: M4Shot) {
  return async (aspect: number, quality: QualitySettings): Promise<ShotScene> => {
    const jumpAt = kind === 'jump' ? JUMP_AT : null;
    const game = await Game.create(
      quality,
      aspect,
      { kind: 'scripted', at: walking(jumpAt) },
      { spawn: SPAWN, detail: walkDetail() },
    );
    let stillTime: number;
    let stripTimes: number[] | undefined;
    if (kind === 'jump') {
      stillTime = findTime(game, jumpAt ?? 0, () => !game.motion.grounded && game.motion.vy <= 0);
    } else {
      // One step of the waddle, well into the walk, each frame just after a
      // beat so the footfall's sugar dust is in the air: after the left foot
      // lands (squash), mid-stride (stretch), after the right foot lands.
      const t0 = phaseTime(game, 1.0, 0.3 * Math.PI);
      const t1 = phaseTime(game, t0, 0.62 * Math.PI);
      const t2 = phaseTime(game, t1, 1.3 * Math.PI);
      stripTimes = [t0, t1, t2];
      stillTime = kind === 'touch' ? t1 : t0;
    }
    let overlay: HTMLElement | undefined;
    if (kind === 'touch') {
      overlay = document.createElement('div');
      const touch = new TouchControls(overlay, await loadTouchIcons());
      touch.show(true);
      // The stick as a thumb would hold it for this walk: forward and a little right.
      touch.showStick(0.42, 0.66);
    }
    game.reset();
    return {
      scene: game.scene,
      camera: game.camera.camera,
      environment: game.environment,
      post: game.post,
      prerender: (gl, cam) => game.prerender(gl, cam),
      update: (t) => game.simulateTo(t),
      stillTime,
      stripTimes,
      overlay,
    };
  };
}
