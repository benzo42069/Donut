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
  sugarPeak: band(-168, 0.55),
  pier: polar(4, INNER_BASE),
};

/** The ground-level camera (K-04): on the path, looking toward the backlit bakery. */
export const GROUND_EYE = band(-140, 0.5);
export const GROUND_AIM = band(-62, 0.42);

/** The hero wild donut: in front of the ground camera, the close-up subject. */
export const HERO_DONUT = (() => {
  const dx = GROUND_AIM.x - GROUND_EYE.x;
  const dz = GROUND_AIM.z - GROUND_EYE.z;
  const l = Math.hypot(dx, dz);
  return { x: GROUND_EYE.x + (dx / l) * 1.7, z: GROUND_EYE.z + (dz / l) * 1.7 };
})();

export const MEADOW_LAYOUT: IslandLayout = {
  pads: [
    { ...SPOTS.bakery, radius: 2.1, height: TOP_BASE + 0.02 },
    { ...SPOTS.lighthouse, radius: 0.9, height: TOP_BASE + 0.02 },
  ],
  mounds: [
    { ...SPOTS.sugarPeak, radius: 2.6, height: 3.1, kind: 'sugar' },
    { ...band(150, 0.56), radius: 2.0, height: 0.55, kind: 'meadow' },
    { ...band(48, 0.5), radius: 1.7, height: 0.4, kind: 'meadow' },
    { ...band(-100, 0.7), radius: 1.6, height: 0.35, kind: 'meadow' },
  ],
};
