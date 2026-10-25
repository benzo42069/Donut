import type { Camera, Scene } from 'three';
import type { PostSettings } from '../engine/render/Renderer';
import type { QualitySettings, QualityTier } from '../engine/quality';

/** A deterministic scene for the screenshot harness (PLAN §2 "Determinism"). */
export interface ShotScene {
  readonly scene: Scene;
  readonly camera: Camera;
  /** Poses the scene at time `t` seconds. The clock is frozen otherwise. */
  update?(t: number): void;
  /** Times (seconds) of the 3-frame motion strip. */
  readonly stripTimes?: readonly number[];
  /** Look-dev post settings for this shot. */
  readonly post?: PostSettings;
  /** Scene pre-filtered into `scene.environment` (glossy reflections, sky fill). */
  readonly environment?: Scene;
  /** Optional engine benchmark (e.g. carve + remesh timings), run by `npm run perf`. */
  bench?(): Promise<Record<string, number>>;
}

export interface ShotDefinition {
  readonly build: (aspect: number, quality: QualitySettings) => ShotScene | Promise<ShotScene>;
  /** Forces a tier, e.g. for `*-low-tier` shot IDs. Default: `high`. */
  readonly tier?: QualityTier;
  /** Time at which the still is taken. Default 0. */
  readonly time?: number;
}
