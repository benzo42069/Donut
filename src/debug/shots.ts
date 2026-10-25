import type { ShotDefinition } from './shotTypes';
import { buildTerrainScene } from './scenes/m1Terrain';
import { buildTestCubeScene } from './scenes/testCube';
import { m2Shot } from './scenes/m2Meadow';

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
  'm2-low-tier': { build: m2Shot('hero'), tier: 'low' },
};
