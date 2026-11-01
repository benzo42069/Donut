import type RAPIER from '@dimforge/rapier3d-compat';
import { Euler, Quaternion, Vector3, type Camera, type Scene, type WebGLRenderer } from 'three';
import { buildGlazey } from '../art/models/glazey';
import type { InputFrame, InputSource } from '../engine/input/Input';
import { heightfieldDesc, loadRapier, ringWallDesc, type Rapier } from '../engine/physics/Physics';
import type { QualitySettings } from '../engine/quality';
import {
  DEFAULT_TUNING,
  createVoxelMaterial,
  type VoxelMaterialTuning,
} from '../engine/render/Materials';
import type { PostSettings } from '../engine/render/Renderer';
import { MesherPool } from '../engine/voxel/MesherPool';
import { FollowCamera } from './camera/FollowCamera';
import { ContactShadow } from './fx/ContactShadow';
import { VoxelParticles } from './fx/VoxelParticles';
import { GlazeyAnimator, type MotionInput } from './player/GlazeyAnimator';
import { GlazeyRig } from './player/GlazeyRig';
import { PlayerController, type MoveIntent } from './player/PlayerController';
import type { DetailPatch } from './world/IslandTerrain';
import { buildMeadowDiorama, type Diorama, type Obstacle } from './world/MeadowDiorama';
import { innerRadius, outerRadius } from './world/islandShape';

/** The fixed simulation step: physics and animation are deterministic per step. */
const HERO_TUNING: VoxelMaterialTuning = {
  ...DEFAULT_TUNING,
  selfLight: 0.5,
  heroRim: 0.8,
  wrap: 0.7,
};

export const STEP = 1 / 60;

/** Where a session starts: Glazey's spot and facing, and the camera's azimuth. */
export interface Spawn {
  x: number;
  z: number;
  yaw: number;
  cameraYaw: number;
}

export interface GameOptions {
  spawn: Spawn;
  /** Near-field macro terrain patches (the shot harness's known camera area). */
  detail?: DetailPatch[];
  fov?: number;
}

/** Input stated in world terms (the screenshot harness scripts Glazey this way). */
export interface WorldInput {
  /** World-space move direction, magnitude 0–1. */
  move: { x: number; z: number };
  jump: boolean;
  jumpPressed: boolean;
}

/** Live input arrives in screen terms and is turned camera-relative by the game. */
export type GameInput =
  { kind: 'live'; source: InputSource } | { kind: 'scripted'; at: (t: number) => WorldInput };

/**
 * Play mode (PLAN M4): Glazey on the Glaze Meadows diorama with a Rapier
 * character controller, the auto camera, procedural animation and voxel dust.
 */
export class Game {
  readonly world: Diorama;
  readonly scene: Scene;
  readonly camera: FollowCamera;
  readonly rig: GlazeyRig;
  readonly player: PlayerController;
  /**
   * Play grade (art bible §4, §6): a firmer warm/cool split and a little more
   * saturation and contrast than the vista, so golden hour reads through the
   * haze, and a vignette that settles the foreground under Glazey.
   */
  readonly post: PostSettings = {
    aoRadius: 0.3,
    aoFalloff: 0.35,
    aoIntensity: 2.2,
    grade: 0.2,
    vignette: 0.34,
    saturation: 1.14,
    contrast: 0.24,
  };
  private animator: GlazeyAnimator;
  private readonly physics: RAPIER.World;
  private readonly dust: VoxelParticles;
  private readonly shadow = new ContactShadow();
  private readonly groundBelow: (p: Vector3) => number;
  private readonly spawn: Spawn;
  private input: GameInput;
  private time = 0;
  private acc = 0;
  private lastPhase = 0;
  private lastFrame: InputFrame | null = null;

  private constructor(
    world: Diorama,
    physics: RAPIER.World,
    player: PlayerController,
    rig: GlazeyRig,
    camera: FollowCamera,
    dust: VoxelParticles,
    spawn: Spawn,
    input: GameInput,
    groundBelow: (p: Vector3) => number,
  ) {
    this.world = world;
    this.scene = world.scene;
    this.physics = physics;
    this.player = player;
    this.rig = rig;
    this.camera = camera;
    this.dust = dust;
    this.spawn = spawn;
    this.input = input;
    this.groundBelow = groundBelow;
    this.animator = new GlazeyAnimator();
    this.scene.add(rig, dust, this.shadow);
    this.reset();
  }

  static async create(
    quality: QualitySettings,
    aspect: number,
    input: GameInput,
    opts: GameOptions,
  ): Promise<Game> {
    const [world, R] = await Promise.all([
      buildMeadowDiorama(quality, { detail: opts.detail, microDecor: true }),
      loadRapier(),
    ]);
    const physics = new R.World({ x: 0, y: 0, z: 0 });
    const seeThrough = buildColliders(R, physics, world);
    // One step settles the broad phase so queries see the static world.
    physics.step();
    const player = new PlayerController(R, physics);
    const pool = new MesherPool();
    // The hero gets his own soft fill and rim so he reads a clear step above the
    // grass he walks on, even backlit at golden hour (art bible §6 value read).
    const hero = createVoxelMaterial({}, HERO_TUNING);
    const rig = await GlazeyRig.build(buildGlazey(0, 'happy'), hero, pool);
    pool.dispose();
    const ground = (x: number, z: number): number => world.shape.surface(x, z);
    const probe = (from: Vector3, dir: Vector3, max: number): number => {
      const hit = physics.castRay(
        new R.Ray(from, dir),
        max,
        true,
        undefined,
        undefined,
        player.collider,
        undefined,
        // The camera floats out over the milk and the sky, and past trunks and
        // donuts: only the ground and buildings pull it in.
        (c) => !seeThrough.has(c.handle),
      );
      return hit ? hit.timeOfImpact : max;
    };
    const camera = new FollowCamera(aspect, probe, ground, opts.fov);
    // Dust shares the hero's soft fill, so the puffs read warm and lit.
    const dust = new VoxelParticles(
      hero,
      [
        'powderedSugar',
        'candyCream',
        'donutSugar',
        'sprinkleRed',
        'sprinkleYellow',
        'sprinkleBlue',
        'sprinkleGreen',
      ],
      ground,
    );
    // The first thing under Glazey: ground, a donut, a rock.
    const groundBelow = (p: Vector3): number => {
      const hit = physics.castRay(
        new R.Ray({ x: p.x, y: p.y + 0.2, z: p.z }, { x: 0, y: -1, z: 0 }),
        20,
        true,
        undefined,
        undefined,
        player.collider,
      );
      return hit ? p.y + 0.2 - hit.timeOfImpact : ground(p.x, p.z);
    };
    return new Game(world, physics, player, rig, camera, dust, opts.spawn, input, groundBelow);
  }

  get environment(): Scene {
    return this.world.environment;
  }

  prerender(gl: WebGLRenderer, cam: Camera): void {
    this.world.prerender(gl, cam);
  }

  /** Back to the spawn: same state as a fresh session (deterministic replays). */
  reset(): void {
    const s = this.spawn;
    const y = this.world.shape.surface(s.x, s.z);
    this.player.teleport(new Vector3(s.x, y, s.z), s.yaw);
    this.camera.reset(this.player.position, s.cameraYaw);
    this.time = 0;
    this.acc = 0;
    this.lastPhase = 0;
    this.lastFrame = null;
    this.dust.reset();
    this.animator = new GlazeyAnimator();
    this.present();
  }

  setInput(input: GameInput): void {
    this.input = input;
  }

  /** Real-time update: fixed steps from an accumulator. */
  update(dt: number): void {
    this.acc += Math.min(dt, 0.25);
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.tick();
    }
    this.present();
  }

  /** Deterministic replay to time `t` (seconds since spawn), for the shot harness. */
  simulateTo(t: number): void {
    if (t < this.time - 1e-6) this.reset();
    while (this.time + STEP / 2 < t) this.tick();
    this.present();
  }

  get now(): number {
    return this.time;
  }

  /** Vertical velocity and grounded state (the harness finds the jump apex with it). */
  get motion(): { vy: number; grounded: boolean; phase: number } {
    return {
      vy: this.player.velocity.y,
      grounded: this.player.grounded,
      phase: this.animator.cyclePhase,
    };
  }

  /** The latest live input frame (the touch UI mirrors the stick). */
  get lastInput(): InputFrame | null {
    return this.lastFrame;
  }

  private intent(): MoveIntent {
    if (this.input.kind === 'scripted') {
      const w = this.input.at(this.time);
      return { x: w.move.x, z: w.move.z, jump: w.jump, jumpPressed: w.jumpPressed };
    }
    const f = this.input.source.read();
    this.lastFrame = f;
    const d = this.camera.toWorld(f.moveX, f.moveY);
    return { x: d.x, z: d.z, jump: f.jump, jumpPressed: f.jumpPressed };
  }

  private tick(): void {
    const intent = this.intent();
    const m = this.player.step(STEP, intent);
    this.animator.step(STEP, m);
    this.effects(m);
    const look = this.input.kind === 'live' ? (this.lastFrame?.look ?? 0) : 0;
    this.camera.update(STEP, this.player.position, this.player.grounded, look);
    this.dust.update(STEP);
    this.time += STEP;
    this.world.update(this.time);
  }

  /** Voxel dust at every footfall, take-off and landing (art bible §8). */
  private effects(m: MotionInput): void {
    const p = this.player.position;
    const yaw = this.player.yaw;
    const fwd = { x: Math.sin(yaw), z: Math.cos(yaw) };
    const phase = this.animator.cyclePhase;
    if (m.grounded && m.speed > 0.6) {
      const crossed = (edge: number): boolean =>
        (this.lastPhase < edge && phase >= edge) || (edge === 0 && phase < this.lastPhase);
      for (const [edge, side] of [
        [0, -1],
        [Math.PI, 1],
      ] as const) {
        if (!crossed(edge)) continue;
        // The foot that just planted: about 0.13 m out to the side, a little ahead.
        const at = new Vector3(
          p.x + fwd.z * side * 0.13 + fwd.x * 0.12,
          p.y + 0.1,
          p.z - fwd.x * side * 0.13 + fwd.z * 0.12,
        );
        this.dust.emit({
          at,
          count: 12,
          speed: [0.4, 0.9],
          up: [1.1, 1.8],
          dir: { x: -fwd.x, z: -fwd.z, bias: 0.6 },
          colors: ['candyCream', 'donutSugar', 'powderedSugar'],
          size: [0.022, 0.034],
          life: [0.55, 0.85],
        });
      }
    }
    this.lastPhase = phase;
    if (m.jumped) {
      this.dust.emit({
        at: p.clone().setY(p.y + 0.1),
        count: 18,
        speed: [0.7, 1.4],
        up: [0.8, 1.5],
        colors: ['candyCream', 'donutSugar', 'powderedSugar'],
        size: [0.022, 0.034],
        life: [0.6, 0.9],
      });
    }
    if (m.landed && m.landed > 2) {
      const k = Math.min(1, m.landed / 9);
      this.dust.emit({
        at: p.clone().setY(p.y + 0.1),
        count: Math.round(10 + 14 * k),
        speed: [0.9, 1.6 + 1.6 * k],
        up: [0.8, 1.8 + 1.4 * k],
        colors: ['candyCream', 'donutSugar', 'powderedSugar', 'candyCream'],
        size: [0.024, 0.036],
        life: [0.6, 1.0],
      });
      this.dust.emit({
        at: p.clone().setY(p.y + 0.1),
        count: Math.round(3 + 5 * k),
        speed: [1.0, 2.0],
        up: [1.6, 2.6],
        colors: ['sprinkleRed', 'sprinkleYellow', 'sprinkleBlue', 'sprinkleGreen'],
        size: [0.03, 0.042],
        life: [0.8, 1.2],
      });
    }
  }

  /** Copies the simulation onto the scene graph. */
  private present(): void {
    this.rig.position.copy(this.player.position);
    this.rig.quaternion.copy(new Quaternion().setFromEuler(new Euler(0, this.player.yaw, 0)));
    this.rig.pose(this.animator.pose());
    const p = this.player.position;
    const g = this.groundBelow(p);
    this.shadow.place(p.x, g, p.z, p.y - g);
  }

  dispose(): void {
    this.player.dispose();
    this.physics.free();
    this.rig.dispose();
  }
}

/** Ground, rims and props as static colliders; returns those the camera ignores. */
function buildColliders(R: Rapier, physics: RAPIER.World, world: Diorama): Set<number> {
  const shape = world.shape;
  physics.createCollider(
    heightfieldDesc(R, { half: 13, cells: 208, height: (x, z) => shape.surface(x, z) }),
  );
  // Invisible fences keep Glazey on the ring: out of the milk, off the cliff.
  const seeThrough = new Set(
    [
      physics.createCollider(ringWallDesc(R, (a) => innerRadius(a) + 0.32, -3, 6)),
      physics.createCollider(ringWallDesc(R, (a) => outerRadius(a) - 0.32, -3, 6)),
    ].map((c) => c.handle),
  );
  for (const o of world.obstacles) {
    const c = physics.createCollider(obstacleDesc(R, o));
    if (!o.blocksCamera) seeThrough.add(c.handle);
  }
  return seeThrough;
}

function obstacleDesc(R: Rapier, o: Obstacle): RAPIER.ColliderDesc {
  const h = o.height / 2;
  if (o.kind === 'cylinder') {
    return R.ColliderDesc.cylinder(h, o.radius).setTranslation(o.x, o.y + h, o.z);
  }
  const q = new Quaternion().setFromEuler(new Euler(0, o.rotY, 0));
  return R.ColliderDesc.cuboid(o.hx, h, o.hz)
    .setTranslation(o.x, o.y + h, o.z)
    .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
}
