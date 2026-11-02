import type { DonutFlavor } from '../../art/models/donut';

/**
 * Munch feel (PLAN M5, game design §3 and pillar 1). Times in seconds, lengths
 * in meters. One munch: Glazey scoops the donut up to his mouth, takes three
 * chomps (each a wind-up, a chomp and a chew), then gulps the last piece.
 */
export const MUNCH = {
  /** Auto-aim: how far (Glazey's soles to the donut's center) and how wide a cone. */
  range: 1.6,
  cone: 1.5,
  /** The scoop: donut hops from the grass into his arms. */
  reach: 0.34,
  /** One bite: open wide, chomp, chew. */
  windup: 0.2,
  bite: 0.68,
  bites: 3,
  /** After the last chomp: a short chew, then the gulp (the last piece pops in). */
  gulpDelay: 0.26,
  gulp: 0.2,
  /** Happy afterglow before Glazey is free to walk again. */
  after: 0.4,
  /** Turn of the donut between bites (radians), so each bite takes fresh rim. */
  turn: 0.6,
  /** How far he turns the ring to show off each fresh bite (radians). */
  show: 1.1,
} as const;

/** When each beat of a munch happens, from its start. */
export function munchTimeline() {
  const chomps = Array.from(
    { length: MUNCH.bites },
    (_, k) => MUNCH.reach + k * MUNCH.bite + MUNCH.windup,
  );
  const last = chomps[chomps.length - 1] ?? 0;
  const gulp = last + MUNCH.gulpDelay + MUNCH.gulp;
  return { chomps, gulpStart: last + MUNCH.gulpDelay, gulp, end: gulp + MUNCH.after };
}

export interface Target {
  index: number;
  x: number;
  z: number;
  eaten: boolean;
  flavor: DonutFlavor;
}

const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Auto-aim (game design §10: generous): the nearest uneaten donut within range,
 * scored by distance plus how far Glazey would have to turn to face it.
 */
export function pickTarget(
  x: number,
  z: number,
  yaw: number,
  donuts: readonly Target[],
): Target | null {
  let best: Target | null = null;
  let score = Infinity;
  for (const d of donuts) {
    if (d.eaten) continue;
    const dx = d.x - x;
    const dz = d.z - z;
    const dist = Math.hypot(dx, dz);
    if (dist > MUNCH.range) continue;
    const turn = Math.abs(wrap(Math.atan2(dx, dz) - yaw));
    if (turn > MUNCH.cone && dist > 0.75) continue;
    const s = dist + turn * 0.35;
    if (s < score) {
      score = s;
      best = d;
    }
  }
  return best;
}

/** What happened this step (the game turns these into carves, crumbs and juice). */
export interface MunchEvents {
  started?: Target;
  /** Bite index 0..2 just chomped. */
  chomp?: number;
  gulped?: Target;
  done?: boolean;
}

/**
 * The munch as a deterministic timeline. It only keeps time and order; the game
 * does the carving, particles and belly so the replay stays a pure function of
 * the fixed step.
 */
export class Munch {
  target: Target | null = null;
  /** Seconds since this munch started. */
  t = 0;
  private readonly tl = munchTimeline();

  get active(): boolean {
    return this.target !== null;
  }

  /** Bites already taken. */
  get bitesTaken(): number {
    return this.tl.chomps.filter((c) => this.t >= c).length;
  }

  /** The beat Glazey is in, for the animator and the face. */
  get beat(): 'reach' | 'windup' | 'chew' | 'gulp' | 'after' | 'idle' {
    if (!this.target) return 'idle';
    const t = this.t;
    if (t < MUNCH.reach) return 'reach';
    if (t >= this.tl.gulp) return 'after';
    if (t >= this.tl.gulpStart) return 'gulp';
    const k = Math.floor((t - MUNCH.reach) / MUNCH.bite);
    const inBite = t - MUNCH.reach - k * MUNCH.bite;
    return k < MUNCH.bites && inBite < MUNCH.windup ? 'windup' : 'chew';
  }

  /** 0–1 progress through the current wind-up (mouth opening, head back). */
  get windup(): number {
    if (this.beat !== 'windup') return 0;
    const k = Math.floor((this.t - MUNCH.reach) / MUNCH.bite);
    return (this.t - MUNCH.reach - k * MUNCH.bite) / MUNCH.windup;
  }

  /** Seconds since the latest chomp (Infinity before the first). */
  get sinceChomp(): number {
    const past = this.tl.chomps.filter((c) => this.t >= c);
    const c = past[past.length - 1];
    return c === undefined ? Infinity : this.t - c;
  }

  /** How far the donut has turned in his hands (radians). */
  get turn(): number {
    // Each turn eases in at the end of the chew, just before the next wind-up,
    // so the fresh bite stays on show through the chew.
    let a = 0;
    for (const c of this.tl.chomps.slice(0, -1)) {
      const k = Math.min(1, Math.max(0, (this.t - c - 0.36) / 0.22));
      a += MUNCH.turn * k * k * (3 - 2 * k);
    }
    return a;
  }

  /**
   * Show-off turn (radians, presentation only): through each chew he turns
   * the ring so the fresh bite faces out, and back before the next wind-up.
   */
  get show(): number {
    if (this.beat !== 'chew') return 0;
    const since = this.sinceChomp;
    const last = this.bitesTaken >= MUNCH.bites;
    const span = last ? MUNCH.gulpDelay : MUNCH.bite - MUNCH.windup;
    const k = Math.min(1, since / 0.12, Math.max(0, (span - since) / 0.1));
    return MUNCH.show * k * k * (3 - 2 * k);
  }

  /**
   * How far the donut is held off his mouth (m): it comes in on each wind-up,
   * touches at the chomp, and is pulled away through the chew so the fresh
   * bite mark shows.
   */
  get pull(): number {
    switch (this.beat) {
      case 'reach':
        return 0.12;
      case 'windup': {
        const k = this.windup;
        return 0.12 * (1 - k * k);
      }
      case 'chew':
        return 0.13 * (1 - Math.exp(-this.sinceChomp * 9));
      default:
        return 0;
    }
  }

  /** 0 on the grass, 1 in his hands. */
  get lift(): number {
    if (!this.target) return 0;
    const k = Math.min(1, this.t / MUNCH.reach);
    return k * k * (3 - 2 * k);
  }

  /** 1 while held, shrinking to 0 through the gulp. */
  get remain(): number {
    if (!this.target) return 1;
    const k = (this.t - this.tl.gulpStart) / MUNCH.gulp;
    return 1 - Math.min(1, Math.max(0, k));
  }

  start(target: Target): MunchEvents {
    this.target = target;
    this.t = 0;
    return { started: target };
  }

  step(dt: number): MunchEvents {
    const target = this.target;
    if (!target) return {};
    const t0 = this.t;
    this.t += dt;
    const ev: MunchEvents = {};
    this.tl.chomps.forEach((c, k) => {
      if (t0 < c && this.t >= c) ev.chomp = k;
    });
    if (t0 < this.tl.gulp && this.t >= this.tl.gulp) {
      target.eaten = true;
      ev.gulped = target;
    }
    if (this.t >= this.tl.end) {
      this.target = null;
      ev.done = true;
    }
    return ev;
  }

  reset(): void {
    this.target = null;
    this.t = 0;
  }
}
