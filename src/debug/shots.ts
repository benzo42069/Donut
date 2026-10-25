import type { ShotDefinition } from './shotTypes';
import { buildTestCubeScene } from './scenes/testCube';

/**
 * `?shot=<id>` registry. Gate shot lists live in `scripts/gates.json`; every ID
 * listed there must exist here (checked by tests/shots.test.ts).
 */
export const SHOTS: Record<string, ShotDefinition> = {
  'm0-test-cube': { build: buildTestCubeScene },
  'm0-low-tier': { build: buildTestCubeScene, tier: 'low' },
};
