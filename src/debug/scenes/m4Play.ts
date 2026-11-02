import type { QualitySettings } from '../../engine/quality';
import { Game, STEP, type Spawn, type WorldInput } from '../../game/Game';
import { band } from '../../game/world/meadowLayout';
import { TouchControls } from '../../ui/TouchControls';
import { loadTouchIcons } from '../../ui/touchIcons';
import type { ShotScene } from '../shotTypes';

const DEG = Math.PI / 180;

/**
 * The M4 gate stage: Glazey strolls along the meadow ring toward the gameplay
 * camera, which trails ahead of him over the island, so his 3/4 face shows
 * with the curve of the ring, the lighthouse and the golden sky behind him.
 */
interface Stage {
  spawn: Spawn;
  /** Walk heading (yaw): along the ring, counter-clockwise seen from above. */
  walkYaw: number;
}

function stage(ringDeg: number, u: number, cameraOffsetDeg: number): Stage {
  const start = band(ringDeg, u);
  const walkYaw = Math.atan2(-Math.sin(ringDeg * DEG), Math.cos(ringDeg * DEG));
  return {
    spawn: { x: start.x, z: start.z, yaw: walkYaw, cameraYaw: walkYaw + cameraOffsetDeg * DEG },
    walkYaw,
  };
}

/** The walk: the lighthouse over the lagoon behind him. */
const WALK_STAGE = stage(112, 0.3, 19);
/** The jump: further out on open lawn, so he takes off with grass, not the lagoon rim, below him. */
const JUMP_STAGE = stage(112, 0.42, 19);
/** Stick magnitude: a brisk walk, not a run. */
const PACE = 0.78;
/** He angles a little toward the lens, so his face and belly show at a true 3/4 (degrees). */
const WALK_TOWARD = 14;
const JUMP_AT = 0.9;

const walking =
  (yaw: number, jumpAt: number | null) =>
  (t: number): WorldInput => {
    const jump = jumpAt !== null && t >= jumpAt && t < jumpAt + 0.35;
    return {
      move: { x: Math.sin(yaw) * PACE, z: Math.cos(yaw) * PACE },
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
    const st = kind === 'jump' ? JUMP_STAGE : WALK_STAGE;
    const game = await Game.create(
      quality,
      aspect,
      { kind: 'scripted', at: walking(st.walkYaw + WALK_TOWARD * DEG, jumpAt) },
      { spawn: st.spawn },
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
