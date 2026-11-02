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
  /** Munching (PLAN M5): the beat, the wind-up progress, and seconds since the last chomp. */
  munch?: { beat: 'reach' | 'windup' | 'chew' | 'gulp' | 'after'; windup: number; since: number };
  /** Set on the step a chomp lands, and on the gulp. */
  chomped?: boolean;
  gulped?: boolean;
  /** Burping: seconds since the burp began (inhale, then the blast at `BURP_AT`). */
  burp?: number;
  /** The belly stage changed: old body size over the new one (the inflate wobble). */
  inflate?: number;
  /** Rolling as a ball, and the ball's radius (m). */
  rolling?: boolean;
  rollRadius?: number;
  /** Power poses: belly-skating (Slide) and floating (Puff). */
  skate?: boolean;
  float?: boolean;
}

/** When the burp blast comes after the inhale (seconds). */
export const BURP_AT = 0.38;

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
  private size: Spring = { x: 1, v: 0 };
  private munchW = 0;
  private burpW = 0;
  private tuck = 0;
  private spin = 0;
  private skate = 0;
  private float = 0;
  private readonly out = restPose();

  /** How far the ball has rolled (radians); the shot harness times the face coming round. */
  get rollAngle(): number {
    return this.spin;
  }

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
    // The chomp: a hard squash that wobbles out like jelly (art bible §7).
    if (m.chomped) {
      this.squash.v -= 4.4;
      this.tuft.v += 5;
    }
    if (m.gulped) this.squash.v += 2.2;
    // A new belly stage pops in from the old size and wobbles to rest.
    if (m.inflate) {
      this.size.x = m.inflate;
      this.size.v = 0;
      this.squash.v -= 1.5;
    }
    const burping = m.burp !== undefined;
    if (burping && m.burp !== undefined && m.burp >= BURP_AT && m.burp - dt < BURP_AT) {
      this.squash.v -= 3.2;
      this.tuft.v -= 7;
    }
    springStep(this.size, 1, 170, 6.5, dt);
    this.munchW = approach(this.munchW, m.munch ? 1 : 0, 14, dt);
    this.burpW = approach(this.burpW, burping ? 1 : 0, 16, dt);
    this.tuck = approach(this.tuck, m.rolling ? 1 : 0, 10, dt);
    this.skate = approach(this.skate, m.skate ? 1 : 0, 7, dt);
    this.float = approach(this.float, m.float ? 1 : 0, 6, dt);
    if (m.rolling) this.spin += (m.speed * dt) / Math.max(0.2, m.rollRadius ?? 0.5);
    const s = Math.sin(this.phase);
    const breathe = 0.016 * Math.sin((this.t * Math.PI * 2) / 2.3) * (1 - this.walk);
    // Squash a little at each foot contact, stretch on the pass; in the air,
    // stretch with speed and relax toward the apex.
    // Inhaling for a burp puffs him up tall; chewing bounces him.
    const inhale = burping && m.burp !== undefined ? clamp(m.burp / BURP_AT, 0, 1) : 0;
    const blasting = burping && m.burp !== undefined && m.burp >= BURP_AT;
    const chew =
      m.munch?.beat === 'chew'
        ? 0.05 * Math.sin(m.munch.since * 26) * Math.exp(-m.munch.since * 2)
        : 0;
    const groundTarget = 1 + breathe + (blasting ? 0 : 0.17 * inhale) + chew;
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
    p.bob = ANIM.bob * w * Math.abs(s) + 0.012 * this.air + 0.2 * this.skate;
    p.lean = this.lean * (1 - 0.5 * this.air);
    // Munch: lean back to open wide, snap forward on the chomp.
    if (m.munch) {
      const back = m.munch.beat === 'windup' ? -0.16 * Math.sin((m.munch.windup * Math.PI) / 2) : 0;
      const snap = m.munch.beat === 'chew' ? 0.14 * Math.exp(-m.munch.since * 9) : 0;
      p.lean = p.lean * (1 - this.munchW) + (back + snap + 0.04) * this.munchW;
    }
    if (burping && m.burp !== undefined) {
      const lean = blasting ? 0.12 * Math.exp(-(m.burp - BURP_AT) * 4) : -0.2 * inhale;
      p.lean = p.lean * (1 - this.burpW) + lean * this.burpW;
    }
    // Belly skate (Slide): flat on his tummy, sliding along.
    p.lean += 1.15 * this.skate;
    p.scale = this.size.x;
    p.tuck = this.tuck;
    p.spin = this.spin * this.tuck;
    // A rolling ball sags onto the ground a little and boings as it turns.
    p.squash *= 1 - this.tuck * (0.06 - 0.025 * Math.sin(this.spin * 2));
    if (this.tuck > 0.01) p.lean *= 1 - this.tuck;
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
      a.reach = 0;
    });
    // Munch: both arms up at the donut, hugging it to his mouth (sheet 03 "MUNCHING").
    if (this.munchW > 0.01) {
      const k = this.munchW;
      const hug = m.munch?.beat === 'chew' ? 0.12 * Math.sin((m.munch.since ?? 0) * 26) : 0;
      p.arms.forEach((a) => {
        a.swing = a.swing * (1 - k) + (-1.6 + hug) * k;
        a.raise = a.raise * (1 - k) + 0.25 * k;
        a.reach = k;
      });
    }
    // Burp: arms flung back on the blast, out wide on the inhale.
    if (this.burpW > 0.01) {
      const k = this.burpW;
      p.arms.forEach((a) => {
        a.swing = a.swing * (1 - k) + (blasting ? 0.9 : -0.2) * k;
        a.raise = a.raise * (1 - k) + (blasting ? 1.1 : 0.7 * inhale) * k;
      });
    }
    // Skating: arms forward like a superhero, feet kicked up behind.
    if (this.skate > 0.01) {
      p.arms.forEach((a) => {
        a.swing = a.swing * (1 - this.skate) - 1.6 * this.skate;
        a.raise = a.raise * (1 - this.skate) + 0.3 * this.skate;
      });
      p.feet.forEach((f) => {
        f.pitch -= 0.9 * this.skate;
        f.lift += 0.08 * this.skate;
      });
    }
    // Floating (Puff): arms out like a dandelion, a slow sway.
    if (this.float > 0.01) {
      p.arms.forEach((a, i) => {
        a.raise = a.raise * (1 - this.float) + (1.35 + 0.2 * Math.sin(this.t * 4 + i)) * this.float;
      });
    }
    p.tuft[0] = this.tuft.x;
    p.tuft[1] = this.tuftSide.x;
  }

  pose(): GlazeyPose {
    return this.out;
  }
}
