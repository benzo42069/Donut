import type { ShotDefinition } from './shotTypes';
import { buildTerrainScene } from './scenes/m1Terrain';
import { buildTestCubeScene } from './scenes/testCube';
import { m2Shot } from './scenes/m2Meadow';
import { m4Shot } from './scenes/m4Play';
import { m5Shot } from './scenes/m5Munch';
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
  'm4-walk-strip': { build: m4Shot('walk') },
  'm4-jump-apex': { build: m4Shot('jump') },
  'm4-touch-ui': { build: m4Shot('touch') },
  'm5-bite-1': { build: m5Shot('bite1') },
  'm5-bite-3': { build: m5Shot('bite3') },
  'm5-crumbs-strip': { build: m5Shot('crumbs') },
  'm5-burp-strip': { build: m5Shot('burp') },
  'm5-belly-5-roll': { build: m5Shot('roll') },
};
