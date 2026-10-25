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
  /** Soft wrap lighting, the "subsurface feel" of dough (art bible §5). */
  soft: 1 << 5,
  /** Self-lit (clouds, steam): bright and soft from every side. */
  lit: 1 << 6,
  /** Smooth-shaded, relaxed geometry without gloss (sugar, gingerbread rock). */
  smooth: 1 << 7,
  /**
   * Candy color (frosting, candy grass): warm key and fill light change its
   * value, not its hue, so strawberry stays pink and mint grass stays mint at
   * golden hour instead of drifting to coral or grey-teal.
   */
  candy: 1 << 8,
  /** Keeps gloss voxels crisp: no relaxation, flat facets (craggy glazes). */
  crisp: 1 << 9,
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
  frostingPinkLight: entry('#F7A6C1', MAT.gloss | MAT.soft | MAT.candy, 0.015),
  frostingPink: entry('#F27BA5', MAT.gloss | MAT.soft | MAT.candy, 0.015),
  frostingPinkShadow: entry('#C9507E', MAT.gloss | MAT.soft | MAT.candy, 0.015),
  // Chocolate
  chocolate: entry('#6B3A2A', MAT.gloss, 0.015),
  chocolateDark: entry('#4A2418', MAT.gloss, 0.015),
  // Accents
  mint: entry('#9EE3C8'),
  butter: entry('#FFE29A'),
  blueberry: entry('#7C8CE0', MAT.gloss | MAT.candy | MAT.crisp, 0.03),
  milk: entry('#FFF6E6', MAT.gloss | MAT.translucent, 0.02),
  powderedSugar: entry('#FBF3EA', MAT.rough | MAT.soft | MAT.smooth, 0.03),
  classicGlaze: entry('#F8E2C0', MAT.gloss | MAT.translucent, 0.03),
  // Glazey (art bible §7, D-01)
  glazeyCoral: entry('#F28B6E'),
  glazeyBelly: entry('#F5E2A8'),
  glazeyBlush: entry('#F0728A'),
  eyeDark: entry('#3A2230', MAT.matte, 0.02),
  eyeGlint: entry('#FFF9F0', MAT.emissive, 0),
  // Meadow
  grassMint: entry('#84C890', MAT.matte | MAT.candy, 0.06),
  grassDeep: entry('#78B868', MAT.matte | MAT.candy, 0.06),
  wood: entry('#9A5E36'),
  // Sprinkles: the only near-neon colors, small amounts only
  sprinkleRed: entry('#F2484E', MAT.emissive, 0.03),
  sprinkleOrange: entry('#FF9A3C', MAT.emissive, 0.03),
  sprinkleYellow: entry('#FFD93D', MAT.emissive, 0.03),
  sprinkleGreen: entry('#5ED47A', MAT.emissive, 0.03),
  sprinkleBlue: entry('#4AA8F0', MAT.emissive, 0.03),
  sprinkleViolet: entry('#A66CF0', MAT.emissive, 0.03),
  // M2 Glaze Meadows diorama
  grassLight: entry('#98D6AA', MAT.matte | MAT.candy, 0.06),
  leafMint: entry('#8FD6A0', MAT.gloss, 0.05),
  leafGreen: entry('#7CC775', MAT.gloss, 0.05),
  leafDeep: entry('#5AA866', MAT.gloss, 0.05),
  woodLight: entry('#C08552'),
  woodDark: entry('#6E3F24'),
  creamWall: entry('#FBE8CC', MAT.soft, 0.04),
  candyRed: entry('#E0555E', MAT.matte, 0.03),
  candyCream: entry('#FFF0E0', MAT.matte, 0.03),
  lampGlow: entry('#FFD27A', MAT.glow, 0.02),
  windowGlow: entry('#FFCF7E', MAT.glow, 0.03),
  lavender: entry('#C9A7E8', MAT.gloss),
  lavenderDeep: entry('#A887D6', MAT.gloss),
  syrup: entry('#E0952F', MAT.gloss | MAT.translucent | MAT.lit, 0.03),
  syrupLight: entry('#F6BA5A', MAT.gloss | MAT.translucent | MAT.lit, 0.03),
  cloud: entry('#FFF8F4', MAT.lit, 0.02),
  cloudShade: entry('#E6DCF3', MAT.lit, 0.02),
  steam: entry('#FFF4EC', MAT.lit, 0.02),
  pebble: entry('#D9B48C', MAT.matte, 0.05),
  milkFloor: entry('#F3DDB8', MAT.soft, 0.04),
  // Matte chocolate tiles: roofs keep crisp voxel steps (no relaxation).
  shingle: entry('#6B3A2A', MAT.matte, 0.04),
  shingleDark: entry('#4A2418', MAT.matte, 0.04),
  gingerbread: entry('#94562F', MAT.soft | MAT.smooth, 0.04),
  pathDirt: entry('#F2CF94', MAT.soft | MAT.smooth, 0.05),
  pathPebble: entry('#D9B48C', MAT.soft | MAT.smooth, 0.05),
  gingerbreadDark: entry('#7E4220', MAT.soft | MAT.smooth, 0.04),
  // Near-field grass blades: the meadow greens, relaxed so 1-voxel columns
  // pinch into tapered blades with pointed tips instead of square pegs.
  bladeDeep: entry('#78B868', MAT.smooth | MAT.candy, 0.06),
  bladeMint: entry('#84C890', MAT.smooth | MAT.candy, 0.06),
  bladeLight: entry('#98D6AA', MAT.smooth | MAT.candy, 0.06),
  // Lighthouse shell stripes: relaxed, so the tapering cylinder's voxel steps
  // don't print baked-AO vein lines down the tower.
  towerRed: entry('#E0555E', MAT.smooth, 0.03),
  towerCream: entry('#FFF0E0', MAT.smooth, 0.03),
  // Still syrup pooled in its channel: crisp flat voxels (no relaxation, which
  // facets a level sheet), self-lit a touch like the falling syrup.
  // Craggy gingerbread skirt under the sugar cap: crisp ledges (not relaxed,
  // which melted it into a mud-like lump).
  gingerCrag: entry('#94562F', MAT.soft, 0.05),
  gingerCragDark: entry('#7E4220', MAT.soft, 0.05),
  syrupPool: entry('#F6BA5A', MAT.emissive | MAT.translucent, 0.03),
  // --- M3 asset library ---
  // Blueberry old-fashioned (RF-15): soft periwinkle, never navy.
  blueberryLight: entry('#9AA8EC', MAT.gloss | MAT.candy | MAT.crisp, 0.03),
  blueberryShadow: entry('#6878CC', MAT.gloss | MAT.candy | MAT.crisp, 0.03),
  // Jelly peeking out of the powdered donut.
  jellyRed: entry('#D93A52', MAT.gloss | MAT.translucent, 0.03),
  jellyDeep: entry('#A8263E', MAT.gloss | MAT.translucent, 0.03),
  // Maple bar glaze (amber).
  mapleGlaze: entry('#D98A2E', MAT.gloss | MAT.candy, 0.02),
  mapleLight: entry('#EDA94E', MAT.gloss | MAT.candy, 0.02),
  // Mystery donut pastel swirl.
  pastelMint: entry('#AEE8D2', MAT.gloss | MAT.candy, 0.02),
  pastelLavender: entry('#D2BDF2', MAT.gloss | MAT.candy, 0.02),
  pastelButter: entry('#FFE6A6', MAT.gloss | MAT.candy, 0.02),
  pastelSky: entry('#B4DAFA', MAT.gloss | MAT.candy, 0.02),
  // Rainbow mega donut (RF-16): the one sanctioned neon item, softly glowing.
  rainbowRed: entry('#F2606A', MAT.gloss | MAT.emissive | MAT.candy, 0.02),
  rainbowOrange: entry('#FF9F52', MAT.gloss | MAT.emissive | MAT.candy, 0.02),
  rainbowYellow: entry('#FFD95A', MAT.gloss | MAT.emissive | MAT.candy, 0.02),
  rainbowGreen: entry('#76D894', MAT.gloss | MAT.emissive | MAT.candy, 0.02),
  rainbowBlue: entry('#62B4F2', MAT.gloss | MAT.emissive | MAT.candy, 0.02),
  rainbowViolet: entry('#B486F0', MAT.gloss | MAT.emissive | MAT.candy, 0.02),
  // Bitten crumb interior (K-07): airy crumb with darker pores.
  crumbPore: entry('#DDAE6E', MAT.soft, 0.06),
  // Glazey (D-01): a relaxed coral twin for the rounded body, face details.
  glazeyBody: entry('#F28B6E', MAT.soft | MAT.smooth | MAT.candy, 0.03),
  glazeyBellySoft: entry('#F5E2A8', MAT.soft | MAT.smooth | MAT.candy, 0.03),
  glazeyMouth: entry('#7E2A3A', MAT.matte, 0.02),
  glazeyTongue: entry('#F2788C', MAT.soft, 0.02),
  glazeyCheek: entry('#F4798F', MAT.soft | MAT.smooth | MAT.candy, 0.02),
  // The Moon Donut on the lighthouse: a warm glowing glaze and golden sprinkles.
  moonGlaze: entry('#FFE2A0', MAT.gloss | MAT.glow, 0.02),
  goldSprinkle: entry('#FFC23C', MAT.emissive, 0.02),
  // Candy-floss tree puffs.
  flossPink: entry('#F9C4DA', MAT.soft | MAT.smooth | MAT.candy, 0.03),
  flossBlue: entry('#C2DCF8', MAT.soft | MAT.smooth | MAT.candy, 0.03),
  // Rock candy crystals.
  crystalLilac: entry('#CDB4F0', MAT.gloss | MAT.translucent, 0.03),
  crystalMint: entry('#B2EAD6', MAT.gloss | MAT.translucent, 0.03),
  // Classic glaze where it runs thin and the golden dough shows through.
  classicGlazeThin: entry('#F0C68C', MAT.gloss | MAT.translucent, 0.03),
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
  sunGolden: '#FFD3A2',
  skyFill: '#BFE0FF',
  groundBounce: '#F2C08A',
  skyZenith: '#82B6EC',
  skyHorizon: '#FCE3CF',
  skySunGlow: '#FFD3A1',
  fog: '#F6DCCB',
  clearColor: '#A8D8FF',
  envZenith: '#CADBEE',
  shadowFill: '#D4CDEC',
  skySea: '#A6C0EA',
  skySeaWarm: '#F8DCC6',
  lampLight: '#FFC46B',
  milkDeep: '#EAD6BC',
  milkFoam: '#FFFAF2',
  // Studio sweep for the asset gallery (K-06): warm cream cloth.
  studioCream: '#EEE5DA',
  studioShade: '#DCC6AC',
  studioKey: '#FFEAD4',
  studioFill: '#DCE4F6',
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
