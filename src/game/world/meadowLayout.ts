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
export const GROUND_EYE = band(-140, 0.6);
export const GROUND_AIM = band(-72, 0.7);
const groundFwd = (() => {
  const dx = GROUND_AIM.x - GROUND_EYE.x;
  const dz = GROUND_AIM.z - GROUND_EYE.z;
  const l = Math.hypot(dx, dz);
  return { x: dx / l, z: dz / l };
})();

/** A point `ahead` meters in front of the ground camera and `left` meters to its left. */
export const groundAhead = (ahead: number, left = 0): { x: number; z: number } => ({
  x: GROUND_EYE.x + groundFwd.x * ahead + groundFwd.z * left,
  z: GROUND_EYE.z + groundFwd.z * ahead - groundFwd.x * left,
});

/** The hero wild donut: on the left third in front of the ground camera; the close-up subject. */
export const HERO_DONUT = groundAhead(3.0, 0.6);

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
  falls: [{ deg: -112, halfWidth: 0.45, channel: 0.14 }],
};
