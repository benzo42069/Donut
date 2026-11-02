import type { QualitySettings } from '../../engine/quality';
import { Game, STEP, type GameOptions, type WorldInput } from '../../game/Game';
import { munchTimeline } from '../../game/munch/Munch';
import { BURP_AT } from '../../game/player/GlazeyAnimator';
import { CAM } from '../../game/camera/FollowCamera';
import { SPOTS, band } from '../../game/world/meadowLayout';
import type { Look } from '../../game/player/GlazeyAvatar';
import type { ShotScene } from '../shotTypes';

const DEG = Math.PI / 180;

/**
 * The M5 gate stages (PLAN M5): Glazey munches a strawberry sprinkle donut in
 * the meadow with the lighthouse over the lagoon behind him, burps a rainbow
 * ring across the lawn, and rolls along the path as a perfectly round ball.
 */
export type M5Shot = 'bite1' | 'bite3' | 'crumbs' | 'burp' | 'roll';

/** The classic glazed donut by the lagoon rim (`MeadowDiorama` grass donut 2; K-07). */
const DONUT = 2;
/** When the munch button is pressed (Glazey is standing near the donut). */
const MUNCH_AT = 0.1;
/** Stage turn off the lighthouse line (radians). */
const STAGE_TURN = 25 * DEG;

const idle =
  (extra: (t: number) => Partial<WorldInput> = () => ({})) =>
  (t: number): WorldInput => ({
    move: { x: 0, z: 0 },
    jump: false,
    jumpPressed: false,
    ...extra(t),
  });

/** The stage around a munch: camera on his 3/4 side, looking toward `bg` past him. */
function munchStage(game: Game, side: 1 | -1): GameOptions['spawn'] {
  const d = game.world.edibles[DONUT]?.pos;
  if (!d) throw new Error('m5: no edible donut');
  const bg = SPOTS.lighthouse;
  // The camera sits opposite the background, so the lighthouse stands behind him.
  // Turned a few degrees so the pier's rails clear his head and tuft.
  const camYaw = Math.atan2(d.x - bg.x, d.z - bg.z) + STAGE_TURN;
  const face = camYaw - side * CAM.focusSide;
  return {
    x: d.x - Math.sin(face) * 0.8,
    z: d.z - Math.cos(face) * 0.8,
    yaw: face,
    cameraYaw: camYaw,
  };
}

export function m5Shot(kind: M5Shot) {
  return async (aspect: number, quality: QualitySettings): Promise<ShotScene> => {
    const munching = kind === 'bite1' || kind === 'bite3' || kind === 'crumbs';
    const preload: Look[] = munching
      ? [
          [0, 'burp'],
          [0, 'munch'],
          [1, 'munch'],
          [1, 'bliss'],
        ]
      : kind === 'burp'
        ? [
            [4, 'surprised'],
            [4, 'burp'],
            [0, 'burp'],
          ]
        : [];
    const belly = kind === 'burp' ? 4 : kind === 'roll' ? 5 : 0;
    // A first pass finds the donut; the stage is laid out around it.
    const opts: GameOptions = {
      spawn: { x: 0, z: 0, yaw: 0, cameraYaw: 0 },
      belly,
      preload,
      power: kind === 'burp' ? 'boing' : undefined,
    };
    let input: (t: number) => WorldInput = idle();
    let stillTime = 0;
    let stripTimes: number[] | undefined;
    const tl = munchTimeline();
    const chomp = (k: number): number => MUNCH_AT + (tl.chomps[k] ?? 0);
    const game = await Game.create(
      quality,
      aspect,
      { kind: 'scripted', at: (t) => input(t) },
      opts,
    );
    const spawn = game.world.edibles.length ? munchStage(game, 1) : opts.spawn;
    if (munching) {
      input = idle((t) => ({ munch: t >= MUNCH_AT && t < MUNCH_AT + STEP }));
      if (kind === 'bite1') stillTime = chomp(0) + 0.3;
      if (kind === 'bite3') stillTime = chomp(2) + 0.22;
      if (kind === 'crumbs') {
        stripTimes = [chomp(0) + 0.08, chomp(0) + 0.24, chomp(0) + 0.42];
        stillTime = stripTimes[0] ?? 0;
      }
    } else if (kind === 'burp') {
      // Facing the camera at a 3/4 on open lawn, so the ring runs out over the grass.
      const at = band(112, 0.45);
      const walkYaw = Math.atan2(-Math.sin(112 * DEG), Math.cos(112 * DEG));
      // He faces 50° off the lens: the hoop flies out past his face, still open to the camera.
      const camYaw = walkYaw + 19 * DEG;
      Object.assign(spawn, { x: at.x, z: at.z, yaw: camYaw - 36 * DEG, cameraYaw: camYaw });
      const BURP = 0.3;
      input = idle((t) => ({ burp: t >= BURP && t < BURP + STEP }));
      stripTimes = [BURP + BURP_AT * 0.85, BURP + BURP_AT + 0.3, BURP + BURP_AT + 0.6];
      stillTime = stripTimes[1] ?? 0;
    } else {
      // Rolling along the path toward the lens, like the M4 walk.
      const at = band(116, 0.2);
      const walkYaw = Math.atan2(-Math.sin(116 * DEG), Math.cos(116 * DEG));
      Object.assign(spawn, { x: at.x, z: at.z, yaw: walkYaw, cameraYaw: walkYaw + 30 * DEG });
      const dir = walkYaw + 14 * DEG;
      input = () => ({
        move: { x: Math.sin(dir) * 0.85, z: Math.cos(dir) * 0.85 },
        jump: false,
        jumpPressed: false,
      });
      // The still: well into the roll, as his face comes round to the front.
      game.respawn(spawn);
      game.simulateTo(1.0);
      while (game.now < 3) {
        game.simulateTo(game.now + STEP);
        const a = game.motion.roll % (Math.PI * 2);
        // Just past the front: his face dips toward the lens and the tuft
        // tips up over the top of the ball (it reads as mid-roll).
        if (a > 0.4 && a < 1 && game.now > 1.4) break;
      }
      stillTime = game.now;
    }
    game.respawn(spawn);
    return {
      scene: game.scene,
      camera: game.camera.camera,
      environment: game.environment,
      post: game.post,
      prerender: (gl, cam) => game.prerender(gl, cam),
      update: async (t) => {
        game.simulateTo(t);
        await game.settle();
      },
      stillTime,
      stripTimes,
    };
  };
}
