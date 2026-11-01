import type RAPIER from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
import type { Rapier } from '../../engine/physics/Physics';
import { NO_MODS, type MoveMods } from '../powers/Powers';
import type { MotionInput } from './GlazeyAnimator';

/** Movement feel (PLAN M4). Glazey is about 1 m tall. */
export const MOVE = {
  maxSpeed: 3.0,
  groundAccel: 14,
  airAccel: 5,
  turnRate: 13,
  gravity: 22,
  /** Gravity multiplier when falling or when jump is let go early. */
  fallGravity: 1.65,
  jumpHeight: 1.05,
  coyote: 0.1,
  buffer: 0.12,
  radius: 0.3,
  halfHeight: 0.2,
  /** Rolling as a ball (belly 3+): faster, with momentum and a lazy turn. */
  rollSpeed: 1.5,
  rollGrip: 0.3,
  rollTurn: 4,
} as const;

/** What the player wants this step: a world-space direction (magnitude 0–1) and jump. */
export interface MoveIntent {
  x: number;
  z: number;
  jump: boolean;
  jumpPressed: boolean;
  /** Turn to this yaw (and ignore the stick): munching faces the donut. */
  face?: number;
}

const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Glazey's kinematic character controller on Rapier: acceleration-based
 * steering, turn-to-face, a forgiving jump (coyote time, input buffer, variable
 * height), slope limits, auto-step onto low props and ground snapping.
 */
export class PlayerController {
  readonly position = new Vector3();
  readonly velocity = new Vector3();
  yaw = 0;
  grounded = true;
  private readonly world: RAPIER.World;
  readonly collider: RAPIER.Collider;
  private readonly kcc: RAPIER.KinematicCharacterController;
  private sinceGround = 0;
  private sinceJumpPress = Infinity;
  private jumping = false;
  /** Power modifiers for this step (PLAN M5). */
  mods: MoveMods = NO_MODS;
  /** Rolling as a ball (belly 3+). */
  rolling = false;

  constructor(R: Rapier, world: RAPIER.World) {
    this.world = world;
    this.collider = world.createCollider(R.ColliderDesc.capsule(MOVE.halfHeight, MOVE.radius));
    this.kcc = world.createCharacterController(0.02);
    this.kcc.setUp({ x: 0, y: 1, z: 0 });
    this.kcc.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    this.kcc.setMinSlopeSlideAngle((55 * Math.PI) / 180);
    this.kcc.enableAutostep(0.22, 0.12, false);
    this.kcc.enableSnapToGround(0.18);
    this.kcc.setSlideEnabled(true);
  }

  /** Puts Glazey's soles at `p`, standing still and facing `yaw`. */
  teleport(p: Vector3, yaw: number): void {
    this.position.copy(p);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.grounded = true;
    this.sinceGround = 0;
    this.sinceJumpPress = Infinity;
    this.jumping = false;
    this.syncCollider();
  }

  private syncCollider(): void {
    this.collider.setTranslation({
      x: this.position.x,
      y: this.position.y + MOVE.halfHeight + MOVE.radius,
      z: this.position.z,
    });
  }

  /** Advances one fixed step; returns what the animator needs to know. */
  step(dt: number, intent: MoveIntent): MotionInput {
    const v = this.velocity;
    const mods = this.mods;
    const roll = this.rolling;
    const im = Math.min(1, Math.hypot(intent.x, intent.z));
    const top = MOVE.maxSpeed * mods.speed * (roll ? MOVE.rollSpeed : 1);
    const tx = intent.x * top;
    const tz = intent.z * top;
    const grip = mods.grip * (roll ? MOVE.rollGrip : 1);
    const accel = this.grounded ? MOVE.groundAccel * grip : MOVE.airAccel;
    const k = 1 - Math.exp(-accel * dt);
    v.x += (tx - v.x) * k;
    v.z += (tz - v.z) * k;

    const prevYaw = this.yaw;
    const turn = roll ? MOVE.rollTurn : MOVE.turnRate;
    if (intent.face !== undefined) {
      this.yaw += wrap(intent.face - this.yaw) * (1 - Math.exp(-16 * dt));
    } else if (roll && Math.hypot(v.x, v.z) > 0.3) {
      // A ball faces where it rolls.
      const want = Math.atan2(v.x, v.z);
      this.yaw += wrap(want - this.yaw) * (1 - Math.exp(-turn * 2 * dt));
    } else if (im > 0.1) {
      const want = Math.atan2(intent.x, intent.z);
      this.yaw += wrap(want - this.yaw) * (1 - Math.exp(-turn * dt));
    }

    // Jump: buffered presses and a little grace after walking off an edge.
    this.sinceJumpPress = intent.jumpPressed ? 0 : this.sinceJumpPress + dt;
    let jumped = false;
    if (this.sinceJumpPress <= MOVE.buffer && this.sinceGround <= MOVE.coyote && !this.jumping) {
      v.y = Math.sqrt(2 * MOVE.gravity * MOVE.jumpHeight * mods.jump);
      this.jumping = true;
      this.grounded = false;
      this.sinceGround = Infinity;
      this.sinceJumpPress = Infinity;
      jumped = true;
    }
    const heavy = v.y < 0 || (this.jumping && !intent.jump);
    const falling = v.y < 0;
    v.y -= MOVE.gravity * (heavy ? MOVE.fallGravity : 1) * (falling ? mods.fall : 1) * dt;
    // Puff: holding jump floats him down like a dandelion seed.
    v.y = Math.max(v.y, intent.jump && falling ? -mods.maxFall : -18);

    this.syncCollider();
    this.kcc.computeColliderMovement(
      this.collider,
      { x: v.x * dt, y: v.y * dt, z: v.z * dt },
      undefined,
      undefined,
      (c) => c.handle !== this.collider.handle,
    );
    const m = this.kcc.computedMovement();
    this.position.x += m.x;
    this.position.y += m.y;
    this.position.z += m.z;
    // Bumping into a wall eats the speed into it.
    if (dt > 0) {
      v.x = m.x / dt;
      v.z = m.z / dt;
    }
    const wasGrounded = this.grounded;
    this.grounded = this.kcc.computedGrounded() && v.y <= 0.01;
    let landed: number | undefined;
    if (this.grounded) {
      if (!wasGrounded) landed = Math.max(0, -v.y);
      v.y = 0;
      this.jumping = false;
      this.sinceGround = 0;
    } else {
      this.sinceGround += dt;
      // A head bump stops the rise.
      if (v.y > 0 && m.y < v.y * dt * 0.5) v.y = 0;
    }
    this.syncCollider();
    return {
      speed: Math.hypot(v.x, v.z),
      vy: v.y,
      grounded: this.grounded,
      turnRate: dt > 0 ? wrap(this.yaw - prevYaw) / dt : 0,
      jumped,
      landed,
    };
  }

  dispose(): void {
    this.world.removeCharacterController(this.kcc);
    this.world.removeCollider(this.collider, false);
  }
}
