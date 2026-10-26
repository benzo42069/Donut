/** Quality tiers (PLAN M0). Shots always use `high`, plus one `low` shot per gate. */
export type QualityTier = 'low' | 'medium' | 'high';

export interface QualitySettings {
  readonly tier: QualityTier;
  /** Upper bound for devicePixelRatio. */
  readonly maxPixelRatio: number;
  readonly shadowMapSize: number;
  /** Screen-space AO (N8AO). Baked voxel AO is always on. */
  readonly ssao: boolean;
  readonly aoSamples: number;
  readonly bloom: boolean;
  readonly smaa: boolean;
  /** MSAA samples on the composer's render target. */
  readonly msaa: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  low: {
    tier: 'low',
    maxPixelRatio: 1,
    shadowMapSize: 1024,
    ssao: false,
    aoSamples: 0,
    bloom: false,
    smaa: true,
    msaa: 0,
  },
  medium: {
    tier: 'medium',
    maxPixelRatio: 1.5,
    shadowMapSize: 2048,
    ssao: true,
    aoSamples: 8,
    bloom: true,
    smaa: true,
    msaa: 0,
  },
  high: {
    tier: 'high',
    maxPixelRatio: 2,
    shadowMapSize: 4096,
    ssao: true,
    aoSamples: 16,
    bloom: true,
    smaa: true,
    // No MSAA: resolved sub-samples that land in sub-pixel voxel seams read as
    // dark pinholes (§10.1). SMAA handles silhouettes.
    msaa: 0,
  },
};

export function isQualityTier(v: unknown): v is QualityTier {
  return v === 'low' || v === 'medium' || v === 'high';
}

export interface DeviceHints {
  readonly hardwareConcurrency?: number;
  readonly deviceMemory?: number;
  readonly maxTouchPoints?: number;
  readonly screenWidth?: number;
}

/** Best-effort tier pick for real devices. `?quality=` always overrides it. */
export function detectTier(h: DeviceHints): QualityTier {
  const cores = h.hardwareConcurrency ?? 4;
  const mem = h.deviceMemory ?? 4;
  const mobile = (h.maxTouchPoints ?? 0) > 0 && (h.screenWidth ?? 1920) < 1200;
  if (cores <= 4 || mem <= 2) return 'low';
  if (mobile || cores <= 6 || mem <= 4) return 'medium';
  return 'high';
}
