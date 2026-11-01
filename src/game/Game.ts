import type RAPIER from '@dimforge/rapier3d-compat';
import {
  Color,
  Euler,
  Matrix4,
  PointLight,
  Quaternion,
  Vector3,
  type Camera,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { biteDonut, donutCenterY } from '../art/models/donut';
import { GLAZEY_VOXEL, glazeyHeight, type GlazeyExpression } from '../art/models/glazey';
import { LIGHT_PALETTE, PALETTE_INDEX, hash3, type VoxelColorName } from '../art/palette';
import type { Sfx } from '../engine/audio/Sfx';
import type { InputFrame, InputSource } from '../engine/input/Input';
import { heightfieldDesc, loadRapier, ringWallDesc, type Rapier } from '../engine/physics/Physics';
import type { QualitySettings } from '../engine/quality';
import {
  DEFAULT_TUNING,
  SHOCK,
  createVoxelMaterial,
  type VoxelMaterialTuning,
} from '../engine/render/Materials';
import type { PostSettings } from '../engine/render/Renderer';
import { RIPPLE } from '../engine/render/Ripple';
import { MesherPool } from '../engine/voxel/MesherPool';
import { FollowCamera } from './camera/FollowCamera';
import { BurpWave, RAINBOW } from './fx/BurpWave';
import { ContactShadow } from './fx/ContactShadow';
import { PowerSwirl } from './fx/PowerSwirl';
import { VoxelParticles } from './fx/VoxelParticles';
import { MUNCH, Munch, pickTarget, type Target } from './munch/Munch';
import { BURP_AT, GlazeyAnimator, type MotionInput } from './player/GlazeyAnimator';
import { GlazeyAvatar, type Look } from './player/GlazeyAvatar';
import { PlayerController, type MoveIntent } from './player/PlayerController';
import { POWER_COLORS, PowerState, type PowerName } from './powers/Powers';
import type { DetailPatch } from './world/IslandTerrain';
import { buildMeadowDiorama, type Diorama, type Obstacle } from './world/MeadowDiorama';
import { innerRadius, outerRadius } from './world/islandShape';

/** The fixed simulation step: physics and animation are deterministic per step. */
const HERO_TUNING: VoxelMaterialTuning = {
  ...DEFAULT_TUNING,
  selfLight: 0.15,
  heroRim: 1.2,
  // A soft sheen on the candy coral, so his form models in the sun.
  roughMatte: 0.55,
  wrap: 0.25,
};

/** FX voxels (burp ring, power sparkles) glow a little, so they pop and bloom. */
const FX_TUNING: VoxelMaterialTuning = {
  ...DEFAULT_TUNING,
  emissive: 0.9,
  selfLight: 0.45,
  heroRim: 0.6,
};

export const STEP = 1 / 60;

/** Burp timing (seconds from the press): the inhale, the blast, the belly drop, the end. */
const BURP_DROP = BURP_AT + 0.14;
const BURP_END = BURP_AT + 1.1;
/**
 * A held donut's center from his mouth (m, mouth space: +y up, +z forward):
 * below and in front, so its top rim just meets his lips.
 */
const HOLD = new Vector3(0, -0.13, 0.31);
/** Belly 3–4: hold jump this long on the ground to curl into a roll. */
const ROLL_HOLD = 0.25;

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
  /** Belly stage at the start (0–5) and a power to start with (shots). */
  belly?: number;
  power?: PowerName;
  /** Looks to mesh before the first frame (the shot harness preloads its faces). */
  preload?: Look[];
  sfx?: Sfx;
}

/** Input stated in world terms (the screenshot harness scripts Glazey this way). */
export interface WorldInput {
  /** World-space move direction, magnitude 0–1. */
  move: { x: number; z: number };
  jump: boolean;
  jumpPressed: boolean;
  munch?: boolean;
  burp?: boolean;
}

/** Live input arrives in screen terms and is turned camera-relative by the game. */
export type GameInput =
  { kind: 'live'; source: InputSource } | { kind: 'scripted'; at: (t: number) => WorldInput };

interface Intent extends MoveIntent {
  munch: boolean;
  burp: boolean;
}

const CRUMB_COLORS: VoxelColorName[] = [
  'crumbFresh',
  'crumbFreshPore',
  'bunGolden',
  'bunCrumb',
  'bunToasted',
  'frostingPinkLight',
  'frostingPink',
  'chocolate',
  'chocolateDark',
  'classicGlaze',
  'donutSugar',
  'sprinkleRed',
  'sprinkleYellow',
  'sprinkleBlue',
  'sprinkleGreen',
  'sprinkleViolet',
  'sprinkleOrange',
];

const SPARKLE_COLORS: VoxelColorName[] = [
  ...new Set([...Object.values(POWER_COLORS).flat(), ...RAINBOW, 'candyCream' as const]),
];

/**
 * Play mode (PLAN M4–M5): Glazey on the Glaze Meadows diorama with a Rapier
 * character controller, the auto camera, procedural animation and voxel dust,
 * and the Munch: auto-aim, three carved bites, crumbs, belly stages with an
 * inflate wobble, the rainbow burp, rolling at belly 3+, and the four powers.
 */
export class Game {
  readonly world: Diorama;
  readonly scene: Scene;
  readonly camera: FollowCamera;
  readonly avatar: GlazeyAvatar;
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
    vignette: 0.45,
    saturation: 1.14,
    contrast: 0.24,
    ripple: true,
  };
  readonly munch = new Munch();
  readonly powers = new PowerState();
  belly = 0;
  private animator: GlazeyAnimator;
  private readonly physics: RAPIER.World;
  private readonly dust: VoxelParticles;
  private readonly crumbs: VoxelParticles;
  private readonly sparkles: VoxelParticles;
  private readonly wave: BurpWave;
  private readonly swirl: PowerSwirl;
  private readonly glow: PointLight;
  private readonly shadow = new ContactShadow();
  private readonly groundBelow: (p: Vector3) => number;
  private spawn: Spawn;
  private readonly start: { belly: number; power?: PowerName };
  private readonly targets: Target[];
  private readonly edibleColliders: Map<number, RAPIER.Collider>;
  private readonly pending = new Set<Promise<unknown>>();
  private readonly sfx: Sfx | null;
  private input: GameInput;
  private time = 0;
  private acc = 0;
  private lastPhase = 0;
  private lastFrame: InputFrame | null = null;
  /** Seconds into the current burp (null when not burping), and its size (0.3–1). */
  private burpT: number | null = null;
  private burpSize = 0;
  private rolling = false;
  private jumpHeld = 0;
  private sinceFx = 0;
  private lastMotion: MotionInput | null = null;

  private constructor(
    world: Diorama,
    physics: RAPIER.World,
    player: PlayerController,
    avatar: GlazeyAvatar,
    camera: FollowCamera,
    fx: { dust: VoxelParticles; crumbs: VoxelParticles; sparkles: VoxelParticles },
    wave: BurpWave,
    swirl: PowerSwirl,
    edibleColliders: Map<number, RAPIER.Collider>,
    opts: GameOptions,
    input: GameInput,
    groundBelow: (p: Vector3) => number,
  ) {
    this.world = world;
    this.scene = world.scene;
    this.physics = physics;
    this.player = player;
    this.avatar = avatar;
    this.camera = camera;
    this.dust = fx.dust;
    this.crumbs = fx.crumbs;
    this.sparkles = fx.sparkles;
    this.wave = wave;
    this.swirl = swirl;
    this.edibleColliders = edibleColliders;
    this.spawn = opts.spawn;
    this.start = { belly: opts.belly ?? 0, power: opts.power };
    this.sfx = opts.sfx ?? null;
    this.input = input;
    this.groundBelow = groundBelow;
    this.targets = world.edibles.map((e, index) => ({
      index,
      x: e.pos.x,
      z: e.pos.z,
      eaten: false,
      flavor: e.flavor,
    }));
    // Shine: a warm glow that travels with him (game design §4).
    this.glow = new PointLight(new Color(LIGHT_PALETTE.lampLight), 0, 3.2, 2);
    this.glow.position.y = 0.7;
    this.avatar.add(this.glow);
    this.animator = new GlazeyAnimator();
    this.scene.add(avatar, fx.dust, fx.crumbs, fx.sparkles, wave, swirl, this.shadow);
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
    const { seeThrough, edibles } = buildColliders(R, physics, world);
    // One step settles the broad phase so queries see the static world.
    physics.step();
    const player = new PlayerController(R, physics);
    const pool = new MesherPool();
    // The hero gets his own soft fill and rim so he reads a clear step above the
    // grass he walks on, even backlit at golden hour (art bible §6 value read).
    const hero = createVoxelMaterial({}, HERO_TUNING);
    const belly = opts.belly ?? 0;
    const avatar = await GlazeyAvatar.create(hero, pool, [
      [belly, 'happy'],
      ...(opts.preload ?? []),
    ]);
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
        'butter',
        'candyCream',
        'doughGolden',
        'sprinkleRed',
        'sprinkleYellow',
        'sprinkleBlue',
        'sprinkleGreen',
      ],
      ground,
    );
    // Crumbs come to rest on top of the lawn's blades, where they stay visible.
    const crumbs = new VoxelParticles(
      createVoxelMaterial(),
      CRUMB_COLORS,
      (x, z) => ground(x, z) + 0.035,
      320,
    );
    const fxMaterial = createVoxelMaterial({}, FX_TUNING);
    const sparkles = new VoxelParticles(fxMaterial, SPARKLE_COLORS, ground, 200);
    const wave = new BurpWave(fxMaterial, ground);
    const swirl = new PowerSwirl(fxMaterial, SPARKLE_COLORS);
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
    return new Game(
      world,
      physics,
      player,
      avatar,
      camera,
      { dust, crumbs, sparkles },
      wave,
      swirl,
      edibles,
      opts,
      input,
      groundBelow,
    );
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
    this.camera.focus = 0;
    this.camera.reset(this.player.position, s.cameraYaw);
    this.time = 0;
    this.acc = 0;
    this.lastPhase = 0;
    this.lastFrame = null;
    this.dust.reset();
    this.crumbs.reset();
    this.sparkles.reset();
    this.wave.reset();
    this.swirl.reset();
    this.animator = new GlazeyAnimator();
    this.munch.reset();
    this.powers.reset();
    if (this.start.power) this.powers.power = this.start.power;
    this.belly = this.start.belly;
    this.burpT = null;
    this.rolling = false;
    this.jumpHeld = 0;
    this.sinceFx = 0;
    this.world.edibles.forEach((e, i) => {
      const t = this.targets[i];
      if (t) t.eaten = false;
      e.grid.restoreSnapshot(e.pristine);
      if (e.grid.dirtyCount) this.track(e.object.update());
      e.group.visible = true;
      e.group.scale.setScalar(1);
      this.edibleColliders.get(i)?.setEnabled(true);
    });
    SHOCK.value.set(0, 0, 0, 0);
    RIPPLE.value.w = 0;
    this.present();
  }

  /** Moves the spawn (stages laid out around the world's props) and resets. */
  respawn(spawn: Spawn): void {
    this.spawn = spawn;
    this.reset();
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

  /** Resolves once every remesh (bites) and Glazey build in flight has landed. */
  async settle(): Promise<void> {
    while (this.pending.size) await Promise.all(this.pending);
    await this.avatar.settle();
    this.present();
  }

  get now(): number {
    return this.time;
  }

  /** Vertical velocity and grounded state (the harness finds the jump apex with it). */
  get motion(): { vy: number; grounded: boolean; phase: number; roll: number } {
    return {
      vy: this.player.velocity.y,
      grounded: this.player.grounded,
      phase: this.animator.cyclePhase,
      roll: this.animator.rollAngle,
    };
  }

  /** The latest live input frame (the touch UI mirrors the stick). */
  get lastInput(): InputFrame | null {
    return this.lastFrame;
  }

  /** A donut is in auto-aim reach (the munch button pulses). */
  get munchReady(): boolean {
    const p = this.player.position;
    return !this.munch.active && pickTarget(p.x, p.z, this.player.yaw, this.targets) !== null;
  }

  get burping(): boolean {
    return this.burpT !== null;
  }

  private track(p: Promise<unknown>): void {
    this.pending.add(p);
    void p.finally(() => this.pending.delete(p));
  }

  private intent(): Intent {
    if (this.input.kind === 'scripted') {
      const w = this.input.at(this.time);
      return {
        x: w.move.x,
        z: w.move.z,
        jump: w.jump,
        jumpPressed: w.jumpPressed,
        munch: w.munch ?? false,
        burp: w.burp ?? false,
      };
    }
    const f = this.input.source.read();
    this.lastFrame = f;
    const d = this.camera.toWorld(f.moveX, f.moveY);
    return {
      x: d.x,
      z: d.z,
      jump: f.jump,
      jumpPressed: f.jumpPressed,
      munch: f.munchPressed,
      burp: f.burpPressed,
    };
  }

  /** Where Glazey stands to munch `t`: just out of the donut's spot, facing it. */
  private standoff(t: Target): { x: number; z: number; yaw: number } {
    const p = this.player.position;
    const dx = t.x - p.x;
    const dz = t.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    const keep = 0.52;
    return { x: t.x - (dx / d) * keep, z: t.z - (dz / d) * keep, yaw: Math.atan2(dx, dz) };
  }

  private tick(): void {
    const intent = this.intent();
    this.powers.update(this.time);
    const busy = this.munch.active || this.burpT !== null;
    if (intent.munch && !busy) {
      const p = this.player.position;
      const target = pickTarget(p.x, p.z, this.player.yaw, this.targets);
      if (target) {
        this.munch.start(target);
        this.edibleColliders.get(target.index)?.setEnabled(false);
        const b = this.belly;
        const next = Math.min(5, b + 1);
        for (const look of [
          [b, 'burp'],
          [b, 'munch'],
          [next, 'munch'],
          [next, 'bliss'],
          [next, 'happy'],
        ] as const)
          void this.avatar.load(look[0], look[1]);
      }
    } else if (intent.burp && !busy) {
      this.burpT = 0;
      this.burpSize = 0.35 + 0.65 * (this.belly / 5);
      for (const look of [
        [this.belly, 'surprised'],
        [this.belly, 'burp'],
        [0, 'burp'],
        [0, 'bliss'],
      ] as const)
        void this.avatar.load(look[0], look[1]);
    }

    // Movement: munching walks him to the donut and faces it; burping plants him.
    const move: MoveIntent = {
      x: intent.x,
      z: intent.z,
      jump: intent.jump,
      jumpPressed: intent.jumpPressed,
    };
    const target = this.munch.target;
    if (target) {
      const s = this.standoff(target);
      const p = this.player.position;
      const ex = s.x - p.x;
      const ez = s.z - p.z;
      const e = Math.hypot(ex, ez);
      const k = this.munch.t < MUNCH.reach && e > 0.04 ? Math.min(1, e / 0.25) : 0;
      Object.assign(move, {
        x: (ex / (e || 1)) * k,
        z: (ez / (e || 1)) * k,
        jump: false,
        jumpPressed: false,
        face: s.yaw,
      });
    } else if (this.burpT !== null) {
      Object.assign(move, { x: 0, z: 0, jump: false, jumpPressed: false });
    }

    // Rolling (game design §3): belly 5 always rolls; 3–4 rolls while jump is held.
    this.jumpHeld =
      move.jump && this.player.grounded ? this.jumpHeld + STEP : move.jump ? this.jumpHeld : 0;
    const speed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    const moving = Math.hypot(move.x, move.z) > 0.2 || speed > 0.6;
    this.rolling =
      !busy &&
      moving &&
      (this.belly >= 5 ||
        (this.belly >= 3 && this.jumpHeld > ROLL_HOLD && this.player.grounded) ||
        (this.rolling && this.belly >= 3 && move.jump));
    // Rolling at 3–4 holds jump: don't let the hold re-trigger hops.
    if (this.rolling && this.belly < 5) move.jumpPressed = false;
    this.player.rolling = this.rolling;
    this.player.mods = this.powers.mods;

    const m = this.player.step(STEP, move);
    const motion: MotionInput = { ...m };

    // --- The munch beats ---
    const ev = this.munch.step(STEP);
    if (target && this.munch.active) {
      motion.munch = {
        beat: this.munch.beat as 'reach',
        windup: this.munch.windup,
        since: this.munch.sinceChomp,
      };
    } else if (ev.done && target) {
      motion.munch = { beat: 'after', windup: 0, since: 1 };
    }
    if (ev.chomp !== undefined && target) this.chomp(target, ev.chomp);
    if (ev.gulped) this.gulp(ev.gulped);
    motion.chomped = ev.chomp !== undefined;
    motion.gulped = ev.gulped !== undefined;

    // --- The burp ---
    if (this.burpT !== null) {
      const t0 = this.burpT;
      this.burpT += STEP;
      motion.burp = this.burpT;
      if (t0 < BURP_AT && this.burpT >= BURP_AT) this.blast();
      if (t0 < BURP_DROP && this.burpT >= BURP_DROP && this.belly > 0) {
        motion.inflate = bodySize(this.belly) / bodySize(0);
        this.belly = 0;
      }
      if (this.burpT >= BURP_END) this.burpT = null;
    }
    if (ev.gulped) {
      const next = Math.min(5, this.belly + 1);
      if (next !== this.belly) motion.inflate = bodySize(this.belly) / bodySize(next);
      this.belly = next;
    }

    const power = this.powers.power;
    motion.rolling = this.rolling;
    motion.rollRadius = bodySize(this.belly) * 0.5;
    motion.skate = power === 'slide' && m.grounded && m.speed > 2.2 && !this.rolling;
    motion.float = power === 'puff' && !m.grounded && m.vy < 0 && move.jump;
    this.animator.step(STEP, motion);
    this.lastMotion = motion;
    this.effects(m, motion);

    this.camera.focus = this.munch.active ? 1 : 0;
    this.camera.focusFacing = this.player.yaw;
    const look = this.input.kind === 'live' ? (this.lastFrame?.look ?? 0) : 0;
    this.camera.update(STEP, this.player.position, this.player.grounded, look, this.player.yaw);
    this.dust.update(STEP);
    this.crumbs.update(STEP);
    this.sparkles.update(STEP);
    this.time += STEP;
    this.world.update(this.time);
  }

  /** A chomp lands: carve the bite (a real scalloped voxel carve) and throw crumbs. */
  private chomp(target: Target, k: number): void {
    const e = this.world.edibles[target.index];
    if (!e) return;
    // Pose the held donut for this instant, so crumbs fly from where the bite is.
    this.present();
    // In his hands the donut's local +x is up and +z points back at him, so
    // the rim nearest his mouth is at this angle; each bite takes fresh rim.
    const angle = Math.atan2(HOLD.z, -HOLD.y) + k * MUNCH.turn;
    const removed = biteDonut(e.grid, e.flavor, { angle, radius: 0.19 }, e.voxel, 31 + k * 7);
    for (const c of e.grid.chunkCoords()) e.grid.markDirty(c.cx, c.cy, c.cz);
    this.track(e.object.update());
    e.object.updateMatrixWorld(true);
    // Crumbs: a spread of the removed voxels, thrown out of the bite and down.
    const n = Math.min(removed.length, 64);
    const points: { at: Vector3; index: number }[] = [];
    for (let i = 0; i < n; i++) {
      const v = removed[Math.floor(hash3(i, k, 3, 211) * removed.length)];
      if (!v) continue;
      // Mostly crumb: frosting and sprinkle bits only now and then.
      const crumb = hash3(i, k, 5, 211) < 0.7;
      const index = crumb
        ? hash3(i, k, 6, 211) < 0.75
          ? PALETTE_INDEX.crumbFresh
          : PALETTE_INDEX.crumbFreshPore
        : v.index;
      points.push({
        at: e.object.localToWorld(new Vector3(v.x + 0.5, v.y + 0.5, v.z + 0.5)),
        index,
      });
    }
    const yaw = this.player.yaw;
    this.crumbs.emit({
      at: points[0]?.at ?? this.player.position.clone(),
      points,
      count: points.length,
      speed: [0.5, 1.5],
      up: [0.6, 1.9],
      dir: { x: Math.sin(yaw), z: Math.cos(yaw), bias: 0.45 },
      colors: ['crumbFresh'],
      size: [0.022, 0.04],
      life: [3.6, 4.4],
      drag: 1.2,
    });
    this.sfx?.play('chomp');
  }

  /** The last piece goes down: belly up, power granted, sparkles. */
  private gulp(target: Target): void {
    const e = this.world.edibles[target.index];
    if (e) e.group.visible = false;
    const power = this.powers.grant(target.flavor, this.time);
    this.swirl.fire(this.time, power ? POWER_COLORS[power] : ['candyCream', 'butter']);
    this.sfx?.play('gulp');
    this.sfx?.play('chime');
  }

  /** The burp itself: the rainbow hoop and ground ring, belly back to 0 (game design §3). */
  private blast(): void {
    const p = this.player.position;
    const yaw = this.player.yaw;
    const fwd = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const size = bodySize(this.belly);
    const mouth = p
      .clone()
      .add(new Vector3(0, size * 0.52, 0))
      .addScaledVector(fwd, size * 0.45);
    this.wave.fire(this.time, mouth, fwd, p, this.burpSize);
    this.powers.burped(this.time);
    // A puff of rainbow sprinkles and sugar out of his mouth.
    this.sparkles.emit({
      at: mouth,
      count: Math.round(10 + 14 * this.burpSize),
      speed: [1.0, 2.4],
      up: [0.6, 1.6],
      dir: { x: fwd.x, z: fwd.z, bias: 0.75 },
      colors: [...RAINBOW],
      size: [0.022, 0.034],
      life: [0.7, 1.1],
      gravity: 0.6,
    });
    this.sfx?.play('burp', this.burpSize);
  }

  /** Voxel dust at every footfall, take-off and landing; power trails (art bible §8). */
  private effects(m: MotionInput, motion: MotionInput): void {
    const p = this.player.position;
    const yaw = this.player.yaw;
    const fwd = { x: Math.sin(yaw), z: Math.cos(yaw) };
    const phase = this.animator.cyclePhase;
    if (m.grounded && m.speed > 0.6 && !this.rolling && !motion.skate) {
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
          colors: ['butter', 'doughGolden', 'candyCream'],
          size: [0.022, 0.034],
          life: [0.55, 0.85],
        });
      }
    }
    this.lastPhase = phase;
    this.sinceFx += STEP;
    // Rolling: a spray of dust off the back of the ball.
    if (this.rolling && m.grounded && m.speed > 1 && this.sinceFx > 0.07) {
      this.sinceFx = 0;
      this.dust.emit({
        at: p.clone().setY(p.y + 0.05),
        count: 5,
        speed: [0.3, 0.8],
        up: [0.8, 1.6],
        dir: { x: -fwd.x, z: -fwd.z, bias: 0.8 },
        colors: ['butter', 'doughGolden', 'candyCream', 'sprinkleYellow'],
        size: [0.022, 0.034],
        life: [0.5, 0.8],
      });
    }
    const power = this.powers.power;
    if (power === 'shine' && this.sinceFx > 0.1) {
      this.sinceFx = 0;
      this.sparkles.emit({
        at: p.clone().setY(p.y + 0.5),
        count: 2,
        speed: [0.2, 0.5],
        up: [0.3, 0.7],
        colors: POWER_COLORS.shine,
        size: [0.016, 0.026],
        life: [0.7, 1.0],
        gravity: -0.05,
        drag: 2,
      });
    }
    if (power === 'slide' && motion.skate && this.sinceFx > 0.06) {
      // The chocolate trail other critters slip on.
      this.sinceFx = 0;
      this.crumbs.emit({
        at: p
          .clone()
          .setY(p.y + 0.05)
          .addScaledVector(new Vector3(fwd.x, 0, fwd.z), -0.3),
        count: 2,
        speed: [0.05, 0.2],
        up: [0.1, 0.3],
        colors: ['chocolate', 'chocolateDark'],
        size: [0.02, 0.03],
        life: [2.5, 3],
      });
    }
    if (power === 'puff' && motion.float && this.sinceFx > 0.15) {
      this.sinceFx = 0;
      this.sparkles.emit({
        at: p.clone().setY(p.y + 0.3),
        count: 3,
        speed: [0.2, 0.5],
        up: [-0.2, 0.2],
        colors: POWER_COLORS.puff,
        size: [0.02, 0.032],
        life: [0.8, 1.2],
        gravity: -0.03,
        drag: 3,
      });
    }
    if (m.jumped) {
      this.dust.emit({
        at: p.clone().setY(p.y + 0.1),
        count: 18,
        speed: [0.4, 0.9],
        up: [0.6, 1.1],
        colors: ['butter', 'doughGolden', 'candyCream'],
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
        colors: ['butter', 'doughGolden', 'candyCream', 'butter'],
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
      if (power === 'boing') {
        this.sparkles.emit({
          at: p.clone().setY(p.y + 0.1),
          count: 14,
          speed: [1.4, 2.2],
          up: [0.3, 0.6],
          colors: POWER_COLORS.boing,
          size: [0.02, 0.03],
          life: [0.5, 0.8],
          gravity: 0.3,
        });
        this.sfx?.play('squeak');
      }
    }
  }

  /** The face for this instant (presentation only; the simulation never reads it). */
  private expression(): GlazeyExpression {
    if (this.burpT !== null) {
      if (this.burpT < BURP_AT) return 'surprised';
      return this.burpT < BURP_AT + 0.6 ? 'burp' : 'bliss';
    }
    switch (this.munch.beat) {
      case 'windup':
        return 'burp';
      case 'chew':
      case 'gulp':
        return 'munch';
      case 'after':
        return 'bliss';
      default:
        return 'happy';
    }
  }

  /** Copies the simulation onto the scene graph. */
  private present(): void {
    const av = this.avatar;
    av.show(this.belly, this.expression());
    av.position.copy(this.player.position);
    av.quaternion.setFromEuler(new Euler(0, this.player.yaw, 0));
    av.pose(this.animator.pose());
    const p = this.player.position;
    const g = this.groundBelow(p);
    this.shadow.place(p.x, g, p.z, p.y - g);
    this.glow.intensity = this.powers.power === 'shine' ? 2.4 : 0;
    this.presentDonuts();
    this.swirl.update(this.time, p, bodySize(this.belly));
    this.wave.update(this.time);
    const shock = this.wave.shock(this.time);
    SHOCK.value.set(shock?.x ?? 0, shock?.z ?? 0, shock?.radius ?? 0, shock ? shock.strength : 0);
    this.presentRipple();
  }

  /** The held donut rides in his arms; the rest sit on the grass. */
  private presentDonuts(): void {
    const target = this.munch.target;
    this.world.edibles.forEach((e, i) => {
      const held = target?.index === i;
      if (!held) {
        e.group.position.copy(e.pos);
        e.group.quaternion.setFromEuler(new Euler(0, e.rotY, 0));
        e.group.scale.setScalar(1);
        return;
      }
      const rig = this.avatar.rig;
      if (!rig) return;
      this.avatar.updateMatrixWorld(true);
      const anchor = new Vector3();
      const aq = new Quaternion();
      rig.hold.matrixWorld.decompose(anchor, aq, new Vector3());
      // In his hands: standing on edge, its ring plane through his facing, held
      // below and in front of his mouth so its top rim meets his lips (his face
      // stays clear); turned between bites so each bite takes fresh rim.
      const basis = new Quaternion().setFromRotationMatrix(
        new Matrix4().makeBasis(new Vector3(0, 1, 0), new Vector3(1, 0, 0), new Vector3(0, 0, -1)),
      );
      const spin = new Quaternion().setFromEuler(new Euler(0, -this.munch.turn, 0));
      const heldQ = aq.clone().multiply(basis).multiply(spin);
      const remain = this.munch.remain;
      const cy = donutCenterY(e.voxel, e.flavor) * e.voxel;
      const reach = HOLD.clone().normalize();
      const center = anchor
        .clone()
        .add(
          HOLD.clone()
            .addScaledVector(reach, this.munch.pull)
            .multiplyScalar(remain)
            .applyQuaternion(aq),
        );
      const heldPos = center.sub(new Vector3(0, cy * remain, 0).applyQuaternion(heldQ));
      // The scoop: an arc from the grass up into his arms.
      const k = this.munch.lift;
      const groundQ = new Quaternion().setFromEuler(new Euler(0, e.rotY, 0));
      e.group.position.lerpVectors(e.pos, heldPos, k);
      e.group.position.y += 0.25 * Math.sin(Math.PI * k);
      e.group.quaternion.slerpQuaternions(groundQ, heldQ, k);
      e.group.scale.setScalar(Math.max(1e-3, remain));
    });
  }

  /** The screen ripple follows the burp hoop (art bible §8). */
  private presentRipple(): void {
    const hoop = this.wave.hoop(this.time);
    if (!hoop) {
      RIPPLE.value.w = 0;
      return;
    }
    const cam = this.camera.camera;
    cam.updateMatrixWorld();
    const c = hoop.at.clone().project(cam);
    const edge = hoop.at
      .clone()
      .add(new Vector3(0, hoop.radius, 0))
      .project(cam);
    RIPPLE.value.set(
      c.x * 0.5 + 0.5,
      c.y * 0.5 + 0.5,
      Math.abs(edge.y - c.y) * 0.5,
      hoop.fade * this.burpSize,
    );
  }

  /** The most recent motion fed to the animator (tests and the touch UI). */
  get lastMove(): MotionInput | null {
    return this.lastMotion;
  }

  dispose(): void {
    this.player.dispose();
    this.physics.free();
    this.avatar.dispose();
  }
}

/** Glazey's height (m) at a belly stage: the inflate wobble's size ratio. */
export function bodySize(belly: number): number {
  return glazeyHeight(belly) * GLAZEY_VOXEL;
}

/** Ground, rims and props as static colliders; returns those the camera ignores. */
function buildColliders(
  R: Rapier,
  physics: RAPIER.World,
  world: Diorama,
): { seeThrough: Set<number>; edibles: Map<number, RAPIER.Collider> } {
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
  const edibles = new Map<number, RAPIER.Collider>();
  for (const o of world.obstacles) {
    const c = physics.createCollider(obstacleDesc(R, o));
    if (!o.blocksCamera) seeThrough.add(c.handle);
    if (o.edible !== undefined) edibles.set(o.edible, c);
  }
  return { seeThrough, edibles };
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
