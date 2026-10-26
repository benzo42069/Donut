import type { ShotDefinition } from './shotTypes';
import { buildTerrainScene } from './scenes/m1Terrain';
import { buildTestCubeScene } from './scenes/testCube';
import { m2Shot } from './scenes/m2Meadow';
import {
  buildBiteGallery,
  buildDonutGallery,
  buildGlazeyGallery,
  buildPropsGallery,
} from './scenes/gallery';

/**
 * `?shot=<id>` registry. Gate shot lists live in `scripts/gates.json`; every ID
 * listed there must exist here (checked by tests/shots.test.ts).
 */
export const SHOTS: Record<string, ShotDefinition> = {
  'm0-test-cube': { build: buildTestCubeScene },
  'm0-low-tier': { build: buildTestCubeScene, tier: 'low' },
  'm1-terrain': { build: buildTerrainScene },
  'm1-low-tier': { build: buildTerrainScene, tier: 'low' },
  'm2-hero': { build: m2Shot('hero') },
  'm2-ground': { build: m2Shot('ground') },
  'm2-closeup-donut': { build: m2Shot('closeupDonut') },
  'm2-lagoon-edge': { build: m2Shot('lagoonEdge') },
  'm2-low-tier': { build: m2Shot('hero'), tier: 'low' },
  'gallery-donuts': { build: buildDonutGallery },
  'gallery-donut-bites': { build: buildBiteGallery },
  'gallery-glazey-belly': { build: buildGlazeyGallery },
  'gallery-props': { build: buildPropsGallery },
  'gallery-low-tier': { build: buildDonutGallery, tier: 'low' },
};
