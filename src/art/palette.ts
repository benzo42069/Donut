/**
 * THE palette (art bible §4). Every voxel color in the game comes from here, and
 * so do the light, sky and fog colors, so the whole frame stays harmonized.
 * Asset code refers to entries by name; eslint forbids hex literals elsewhere.
 *
 * Voxels store a Uint8 palette index (see `PALETTE_INDEX`). Index 0 is "empty".
 */

/** Material flags (art bible §5). Bit flags so they pack into one vertex attribute. */
export const MAT = {
  matte: 0,
  gloss: 1 << 0,
  emissive: 1 << 1,
  translucent: 1 << 2,
  rough: 1 << 3,
  /** Strong emissive (lamps, lit windows): the only things that bloom hard. */
  glow: 1 << 4,
  /** Soft wrap lighting, the "subsurface feel" of dough and clouds (art bible §5). */
  soft: 1 << 5,
} as const;

export interface PaletteEntry {
  readonly hex: string;
  /** Bitwise OR of `MAT` flags. */
  readonly mat: number;
  /** Per-voxel value jitter amplitude (fraction, art bible: 0.03–0.06). */
  readonly jitter: number;
}

const entry = (hex: string, mat: number = MAT.matte, jitter = 0.045): PaletteEntry => ({
  hex,
  mat,
  jitter,
});

/** Voxel colors. Order matters: it defines the Uint8 palette index (1-based). */
export const VOXEL_PALETTE = {
  // Dough: golden caramel → toasted → deep crust
  doughGolden: entry('#E8A85C', MAT.soft),
  doughToasted: entry('#B86B32', MAT.soft),
  doughCrust: entry('#7A3E1D', MAT.soft),
  doughCrumb: entry('#F2CF94', MAT.soft, 0.06),
  // Strawberry frosting
  frostingPinkLight: entry('#F7A6C1', MAT.gloss),
  frostingPink: entry('#F27BA5', MAT.gloss),
  frostingPinkShadow: entry('#C9507E', MAT.gloss),
  // Chocolate
  chocolate: entry('#6B3A2A', MAT.gloss, 0.035),
  chocolateDark: entry('#4A2418', MAT.gloss, 0.035),
  // Accents
  mint: entry('#9EE3C8'),
  butter: entry('#FFE29A'),
  blueberry: entry('#7C8CE0', MAT.gloss),
  milk: entry('#FFF6E6', MAT.gloss | MAT.translucent, 0.02),
  powderedSugar: entry('#FBF3EA', MAT.rough | MAT.soft, 0.03),
  classicGlaze: entry('#F6DDB4', MAT.gloss | MAT.translucent, 0.03),
  // Glazey (art bible §7, D-01)
  glazeyCoral: entry('#F28B6E'),
  glazeyBelly: entry('#F5E2A8'),
  glazeyBlush: entry('#F0728A'),
  eyeDark: entry('#3A2230', MAT.gloss, 0.02),
  eyeGlint: entry('#FFF9F0', MAT.emissive, 0),
  // Meadow
  grassMint: entry('#A8DC8C', MAT.matte, 0.06),
  grassDeep: entry('#78B868', MAT.matte, 0.06),
  wood: entry('#9A5E36'),
  // Sprinkles: the only near-neon colors, small amounts only
  sprinkleRed: entry('#F2484E', MAT.emissive, 0.03),
  sprinkleOrange: entry('#FF9A3C', MAT.emissive, 0.03),
  sprinkleYellow: entry('#FFD93D', MAT.emissive, 0.03),
  sprinkleGreen: entry('#5ED47A', MAT.emissive, 0.03),
  sprinkleBlue: entry('#4AA8F0', MAT.emissive, 0.03),
  sprinkleViolet: entry('#A66CF0', MAT.emissive, 0.03),
  // M2 Glaze Meadows diorama
  grassLight: entry('#C6E89C', MAT.matte, 0.06),
  leafMint: entry('#8FD6A0', MAT.gloss, 0.05),
  leafGreen: entry('#7CC775', MAT.gloss, 0.05),
  leafDeep: entry('#5AA866', MAT.gloss, 0.05),
  woodLight: entry('#C08552'),
  woodDark: entry('#6E3F24'),
  creamWall: entry('#FBE8CC', MAT.soft, 0.04),
  candyRed: entry('#E0555E', MAT.gloss, 0.03),
  candyCream: entry('#FFF0E0', MAT.gloss, 0.03),
  lampGlow: entry('#FFD27A', MAT.glow, 0.02),
  windowGlow: entry('#FFCF7E', MAT.glow, 0.03),
  lavender: entry('#C9A7E8', MAT.gloss),
  lavenderDeep: entry('#A887D6', MAT.gloss),
  syrup: entry('#D98A2B', MAT.gloss | MAT.translucent, 0.03),
  syrupLight: entry('#F0AE4A', MAT.gloss | MAT.translucent, 0.03),
  cloud: entry('#FFF7F0', MAT.soft, 0.02),
  cloudShade: entry('#EEDFEC', MAT.soft, 0.02),
  steam: entry('#FFF4EC', MAT.soft, 0.02),
  pebble: entry('#D9B48C', MAT.matte, 0.05),
  milkFloor: entry('#F3DDB8', MAT.soft, 0.04),
} as const satisfies Record<string, PaletteEntry>;

export type VoxelColorName = keyof typeof VOXEL_PALETTE;

export const PALETTE_NAMES = Object.keys(VOXEL_PALETTE) as VoxelColorName[];

/** Uint8 index for each palette entry. 0 is reserved for empty space. */
export const PALETTE_INDEX = Object.fromEntries(PALETTE_NAMES.map((n, i) => [n, i + 1])) as Record<
  VoxelColorName,
  number
>;

export function paletteEntryAt(index: number): PaletteEntry | undefined {
  const name = PALETTE_NAMES[index - 1];
  return name ? VOXEL_PALETTE[name] : undefined;
}

/** Light, sky and fog colors (art bible §6). Not voxel colors, but palette-governed. */
export const LIGHT_PALETTE = {
  sunGolden: '#FFD9A8',
  skyFill: '#BFE0FF',
  groundBounce: '#F2C08A',
  skyZenith: '#8EC5F5',
  skyHorizon: '#FCE3CF',
  skySunGlow: '#FFD3A1',
  fog: '#F6DCCB',
  clearColor: '#A8D8FF',
  skySea: '#B4D0F2',
  skySeaWarm: '#F8DCC6',
  lampLight: '#FFC46B',
  milkDeep: '#F5E4C8',
  milkFoam: '#FFFAF2',
} as const;

export type LightColorName = keyof typeof LIGHT_PALETTE;

// ---------------------------------------------------------------------------
// Color math (sRGB hex → linear float), used by meshing and materials.

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToSrgb(hex: string): RGB {
  const v = parseInt(hex.slice(1), 16);
  return { r: ((v >> 16) & 255) / 255, g: ((v >> 8) & 255) / 255, b: (v & 255) / 255 };
}

const toLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

export function hexToLinear(hex: string): RGB {
  const s = hexToSrgb(hex);
  return { r: toLinear(s.r), g: toLinear(s.g), b: toLinear(s.b) };
}

/** Deterministic integer hash → [0, 1). Same voxel always gets the same jitter. */
export function hash3(x: number, y: number, z: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144269504) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Per-voxel handmade jitter (art bible §4): ±value by the entry's amplitude and a
 * hue nudge of about ±2° (approximated by a small, opposite r/b shift).
 * Returns a linear-space color.
 */
export function jitteredLinear(index: number, x: number, y: number, z: number): RGB {
  const e = paletteEntryAt(index);
  if (!e) return { r: 0, g: 0, b: 0 };
  const base = hexToSrgb(e.hex);
  const v = 1 + (hash3(x, y, z, 1) * 2 - 1) * e.jitter;
  const hue = (hash3(x, y, z, 2) * 2 - 1) * 0.012;
  const clamp = (c: number): number => Math.min(1, Math.max(0, c));
  return {
    r: toLinear(clamp(base.r * v + hue)),
    g: toLinear(clamp(base.g * v)),
    b: toLinear(clamp(base.b * v - hue)),
  };
}
