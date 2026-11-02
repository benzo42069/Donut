import type { DonutFlavor } from '../../art/models/donut';
import type { VoxelColorName } from '../../art/palette';

/** The four MVP powers (game design §4, §12). */
export type PowerName = 'boing' | 'slide' | 'puff' | 'shine';

export const FLAVOR_POWER: Partial<Record<DonutFlavor, PowerName>> = {
  strawberry: 'boing',
  chocolate: 'slide',
  powdered: 'puff',
  glazed: 'shine',
};

/** Each power's sparkle colors (pickup swirl and trail), from its donut. */
export const POWER_COLORS: Record<PowerName, VoxelColorName[]> = {
  boing: ['frostingPinkLight', 'frostingPink', 'sprinkleYellow', 'sprinkleBlue'],
  slide: ['chocolate', 'goldSprinkle', 'butter', 'chocolateDark'],
  puff: ['donutSugar', 'candyCream', 'pastelSky', 'donutSugarShade'],
  shine: ['goldSprinkle', 'butter', 'eyeShine', 'moonGlaze'],
};

/** How a power bends Glazey's movement (multipliers on `MOVE`). */
export interface MoveMods {
  /** Jump height multiplier (Boing: 3× the height). */
  jump: number;
  speed: number;
  /** Ground acceleration multiplier (Slide is slippery: low grip). */
  grip: number;
  /** Fall gravity multiplier, and the slowest the fall may be held to (m/s, Infinity = none). */
  fall: number;
  maxFall: number;
}

export const NO_MODS: MoveMods = { jump: 1, speed: 1, grip: 1, fall: 1, maxFall: Infinity };

export const POWER_MODS: Record<PowerName, MoveMods> = {
  boing: { ...NO_MODS, jump: 3 },
  slide: { ...NO_MODS, speed: 1.7, grip: 0.3 },
  // Puff: float down like a dandelion while jump is held.
  puff: { ...NO_MODS, jump: 1.3, fall: 0.25, maxFall: 1.1 },
  shine: NO_MODS,
};

/** After a burp the last power stays this long (game design §3). */
export const BURP_KEEP = 20;

/**
 * Glazey's current power: it lasts until he eats a different donut, or for
 * 20 s after a burp. Only one at a time keeps it simple (game design §3).
 */
export class PowerState {
  power: PowerName | null = null;
  /** When the power was granted (the pickup swirl's clock). */
  since = -Infinity;
  private expires = Infinity;

  grant(flavor: DonutFlavor, now: number): PowerName | null {
    const p = FLAVOR_POWER[flavor] ?? null;
    if (!p) return null;
    this.power = p;
    this.since = now;
    this.expires = Infinity;
    return p;
  }

  burped(now: number): void {
    if (this.power) this.expires = Math.min(this.expires, now + BURP_KEEP);
  }

  update(now: number): void {
    if (now >= this.expires) {
      this.power = null;
      this.expires = Infinity;
    }
  }

  get mods(): MoveMods {
    return this.power ? POWER_MODS[this.power] : NO_MODS;
  }

  reset(): void {
    this.power = null;
    this.since = -Infinity;
    this.expires = Infinity;
  }
}
