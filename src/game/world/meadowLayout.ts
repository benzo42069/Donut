import { INNER_BASE, OUTER_BASE, TOP_BASE, type IslandLayout } from './islandShape';

/**
 * Where things are on the M2 Glaze Meadows diorama. Angles are degrees around
 * the ring (0 = +x, 90 = +z toward the hero camera). The hero camera looks from
 * the front (+z); the golden sun is upper right.
 */
export const polar = (deg: number, r: number): { x: number; z: number } => {
  const a = (deg * Math.PI) / 180;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
};

/** A spot across the ring band: u = 0 at the lagoon rim, 1 at the sky rim. */
export const band = (deg: number, u: number): { x: number; z: number } =>
  polar(deg, INNER_BASE + u * (OUTER_BASE - INNER_BASE));

export const SPOTS = {
  bakery: band(-80, 0.5),
  lighthouse: band(-16, 0.22),
  sugarPeak: band(-124, 0.5),
  pier: polar(4, INNER_BASE),
};

export const MEADOW_LAYOUT: IslandLayout = {
  pads: [
    { ...SPOTS.bakery, radius: 2.1, height: TOP_BASE + 0.02 },
    { ...SPOTS.lighthouse, radius: 0.9, height: TOP_BASE + 0.02 },
  ],
  mounds: [
    { ...SPOTS.sugarPeak, radius: 2.8, height: 3.1, kind: 'sugar' },
    { ...band(150, 0.56), radius: 2.0, height: 0.55, kind: 'meadow' },
    { ...band(48, 0.5), radius: 1.7, height: 0.4, kind: 'meadow' },
    { ...band(-165, 0.48), radius: 1.6, height: 0.45, kind: 'meadow' },
  ],
};
