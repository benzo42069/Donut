import type RAPIER from '@dimforge/rapier3d-compat';
import { Euler, Quaternion, Vector3, type Camera, type Scene, type WebGLRenderer } from 'three';
import { buildGlazey } from '../art/models/glazey';
import type { InputFrame, InputSource } from '../engine/input/Input';
import { heightfieldDesc, loadRapier, ringWallDesc, type Rapier } from '../engine/physics/Physics';
import type { QualitySettings } from '../engine/quality';
import { createVoxelMaterial } from '../engine/render/Materials';
import type { PostSettings } from '../engine/render/Renderer';
import { MesherPool } from '../engine/voxel/MesherPool';
import { FollowCamera } from './camera/FollowCamera';
import { VoxelParticles } from './fx/VoxelParticles';
import { GlazeyAnimator, type MotionInput } from './player/GlazeyAnimator';
import { GlazeyRig } from './player/GlazeyRig';
import { PlayerController, type MoveIntent } from './player/PlayerController';
import type { DetailPatch } from './world/IslandTerrain';
import { buildMeadowDiorama, type Diorama, type Obstacle } from './world/MeadowDiorama';
import { innerRadius, outerRadius } from './world/islandShape';

/** The fixed simulation step: physics and animation are deterministic per step. */
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
  readonly post: PostSettings = { aoRadius: 0.3, aoFalloff: 0.35, aoIntensity: 2.2 };
  private animator: GlazeyAnimator;
  private readonly physics: RAPIER.World;
  private readonly dust: VoxelParticles;
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
    this.animator = new GlazeyAnimator();
    this.scene.add(rig, dust);
    this.reset();
  }

  static async create(
    quality: QualitySettings,
    aspect: number,
    input: GameInput,
    opts: GameOptions,
  ): Promise<Game> {
    const [world, R] = await Promise.all([
      buildMeadowDiorama(quality, { detail: opts.detail }),
      loadRapier(),
    ]);
    const physics = new R.World({ x: 0, y: 0, z: 0 });
    const seeThrough = buildColliders(R, physics, world);
    // One step settles the broad phase so queries see the static world.
    physics.step();
    const player = new PlayerController(R, physics);
    const material = createVoxelMaterial();
    const pool = new MesherPool();
    const rig = await GlazeyRig.build(buildGlazey(0, 'happy'), material, pool);
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
    const dust = new VoxelParticles(
      material,
      [
        'powderedSugar',
        'candyCream',
        'sprinkleRed',
        'sprinkleYellow',
        'sprinkleBlue',
        'sprinkleGreen',
      ],
      ground,
    );
    return new Game(world, physics, player, rig, camera, dust, opts.spawn, input);
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
          p.y,
          p.z - fwd.x * side * 0.13 + fwd.z * 0.12,
        );
        this.dust.emit({
          at,
          count: 5,
          speed: [0.3, 0.8],
          up: [0.8, 1.5],
          dir: { x: -fwd.x, z: -fwd.z, bias: 0.6 },
          colors: ['powderedSugar', 'candyCream'],
          size: [0.032, 0.05],
          life: [0.55, 0.85],
        });
      }
    }
    this.lastPhase = phase;
    if (m.jumped) {
      this.dust.emit({
        at: p.clone(),
        count: 8,
        speed: [0.6, 1.3],
        up: [0.4, 1.0],
        colors: ['powderedSugar', 'candyCream'],
        size: [0.032, 0.05],
        life: [0.5, 0.8],
      });
    }
    if (m.landed && m.landed > 2) {
      const k = Math.min(1, m.landed / 9);
      this.dust.emit({
        at: p.clone(),
        count: Math.round(10 + 14 * k),
        speed: [0.9, 1.6 + 1.6 * k],
        up: [0.8, 1.8 + 1.4 * k],
        colors: ['powderedSugar', 'powderedSugar', 'candyCream', 'candyCream'],
        size: [0.034, 0.056],
        life: [0.6, 1.0],
      });
      this.dust.emit({
        at: p.clone(),
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
