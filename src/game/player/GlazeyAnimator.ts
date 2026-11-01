import { restPose, type GlazeyPose } from './GlazeyRig';

/** What the controller tells the animator each step. */
export interface MotionInput {
  /** Horizontal speed (m/s). */
  speed: number;
  /** Vertical velocity (m/s). */
  vy: number;
  grounded: boolean;
  /** Yaw rate (rad/s): Glazey leans into turns. */
  turnRate: number;
  /** Set on the step Glazey leaves the ground with a jump. */
  jumped?: boolean;
  /** Fall speed at touchdown (m/s), on the step Glazey lands. */
  landed?: number;
}

/** Feel constants (art bible §7: squash and stretch on every jump and land). */
export const ANIM = {
  /** Ground covered by one full walk cycle (two steps), meters. */
  cycle: 1.0,
  /** Speed at which the walk is at full swing (m/s). */
  fullWalk: 2.6,
  stepLift: 0.09,
  stepReach: 0.12,
  bob: 0.075,
  /** Squash spring: a stiff, under-damped jelly wobble. */
  stiffness: 230,
  damping: 8.5,
  /** Spring kick per m/s of landing speed (negative squashes). */
  landKick: -0.5,
  jumpKick: 3.2,
} as const;

interface Spring {
  x: number;
  v: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const approach = (cur: number, target: number, rate: number, dt: number): number =>
  cur + (target - cur) * (1 - Math.exp(-rate * dt));

function springStep(s: Spring, target: number, k: number, c: number, dt: number): void {
  // Semi-implicit Euler in small substeps: stable at any frame rate.
  const n = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    s.v += (k * (target - s.x) - c * s.v) * h;
    s.x += s.v * h;
  }
}

/**
 * Procedural, bone-less animation for Glazey (PLAN M4): idle breathing, a
 * waddling walk, a stretchy jump with happy arms, and a jelly squash on landing
 * that wobbles back. Deterministic for a fixed step size, so the screenshot
 * harness can pose it at any time.
 */
export class GlazeyAnimator {
  private t = 0;
  private phase = 0;
  private walk = 0;
  private air = 0;
  private lean = 0;
  private roll = 0;
  private squash: Spring = { x: 1, v: 0 };
  private tuft: Spring = { x: 0, v: 0 };
  private tuftSide: Spring = { x: 0, v: 0 };
  private flap = 0;
  private readonly out = restPose();

  /** Walk-cycle phase in [0, 2π): 0 and π are foot contacts, π/2 and 3π/2 passes. */
  get cyclePhase(): number {
    return this.phase;
  }

  step(dt: number, m: MotionInput): void {
    this.t += dt;
    const ratio = clamp(m.speed / ANIM.fullWalk, 0, 1.2);
    this.walk = approach(this.walk, m.grounded ? Math.min(1, ratio * 1.4) : 0, 12, dt);
    this.air = approach(this.air, m.grounded ? 0 : 1, m.grounded ? 18 : 9, dt);
    if (m.grounded)
      this.phase = (this.phase + (m.speed * dt * Math.PI * 2) / ANIM.cycle) % (Math.PI * 2);
    this.lean = approach(this.lean, 0.13 * ratio, 8, dt);
    this.roll = approach(this.roll, clamp(-m.turnRate * 0.05 * ratio, -0.18, 0.18), 6, dt);
    this.flap += dt * (5 + 6 * this.air);

    if (m.jumped) {
      this.squash.v += ANIM.jumpKick;
      this.tuft.v -= 4;
    }
    if (m.landed) {
      this.squash.v += ANIM.landKick * clamp(m.landed, 0, 12);
      this.tuft.v += m.landed * 1.1;
    }
    const s = Math.sin(this.phase);
    const breathe = 0.016 * Math.sin((this.t * Math.PI * 2) / 2.3) * (1 - this.walk);
    // Squash a little at each foot contact, stretch on the pass; in the air,
    // stretch with speed and relax toward the apex.
    const groundTarget = 1 + breathe;
    const airTarget = 1 + clamp(Math.abs(m.vy) * 0.03, 0, 0.16);
    const target = groundTarget * (1 - this.air) + airTarget * this.air;
    springStep(this.squash, target, ANIM.stiffness, ANIM.damping, dt);
    // The tuft trails: it flops back after each footfall and whips on landings.
    const flop = 0.45 * this.walk * Math.sin(2 * this.phase - 0.9);
    springStep(this.tuft, -this.lean * 1.6 + flop + clamp(m.vy * -0.035, -0.3, 0.3), 120, 6, dt);
    springStep(this.tuftSide, this.roll * 1.8 + 0.05 * Math.sin(this.t * 1.7), 120, 6, dt);

    const p = this.out;
    const w = this.walk;
    // Each footfall squashes (-8 %), each pass stretches (+5 %): a direct
    // waveform at step rate, since the jelly spring is too slow to follow it.
    const stepWave = Math.abs(s);
    p.squash = clamp(this.squash.x + w * (0.2 * stepWave - 0.11), 0.62, 1.4);
    p.bob = ANIM.bob * w * Math.abs(s) + 0.012 * this.air;
    p.lean = this.lean * (1 - 0.5 * this.air);
    // Weight shifts over the planted foot; the hips twist with the stride.
    p.roll = this.roll + 0.1 * w * s;
    p.twist = 0.12 * w * Math.cos(this.phase);
    const reach = ANIM.stepReach * Math.min(1, w * 1.2);
    p.feet.forEach((f, i) => {
      const ph = this.phase + i * Math.PI;
      const swing = Math.max(0, Math.sin(ph));
      // In the air the feet dangle: a little apart in time, toes down.
      const dangle = this.air * (0.04 + 0.02 * Math.sin(this.flap * 0.7 + i * 2.1));
      f.lift = ANIM.stepLift * w * swing + dangle;
      f.fwd = reach * Math.cos(ph) * (1 - this.air) + 0.03 * this.air * (i === 0 ? 1 : -0.4);
      f.pitch = 0.4 * w * Math.sin(ph) * (1 - this.air) - 0.35 * this.air;
    });
    // Arms swing against the feet while walking, flap up happily in the air,
    // and sway gently at rest.
    const idleSway = 0.06 * Math.sin(this.t * 1.9) * (1 - w);
    p.arms.forEach((a, i) => {
      const side = i === 0 ? 1 : -1;
      // Held a little out from the body while walking, so the swing shows
      // past the silhouette from the 3/4 camera; thrown up and out to the sides at the apex.
      a.swing = -0.95 * w * Math.cos(this.phase) * side * (1 - this.air) - 0.15 * this.air;
      a.raise = 0.38 * w + idleSway + this.air * (1.75 + 0.2 * Math.sin(this.flap + i * 0.6));
    });
    p.tuft[0] = this.tuft.x;
    p.tuft[1] = this.tuftSide.x;
  }

  pose(): GlazeyPose {
    return this.out;
  }
}
