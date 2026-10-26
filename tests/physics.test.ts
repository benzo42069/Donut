import { describe, expect, it } from 'vitest';
import { heightfieldDesc, loadRapier, ringWallDesc } from '../src/engine/physics/Physics';

describe('physics colliders', () => {
  it('lays the heightfield out so it matches the height function', async () => {
    const R = await loadRapier();
    const world = new R.World({ x: 0, y: -9.81, z: 0 });
    const height = (x: number, z: number): number => 1 + 0.3 * x - 0.1 * z;
    world.createCollider(heightfieldDesc(R, { half: 8, cells: 64, height }));
    world.step();
    for (const [x, z] of [
      [2, -5],
      [-6, 3],
      [0.3, 0.7],
    ] as const) {
      const hit = world.castRay(new R.Ray({ x, y: 50, z }, { x: 0, y: -1, z: 0 }), 100, true);
      expect(hit).not.toBeNull();
      expect(50 - (hit?.timeOfImpact ?? 0)).toBeCloseTo(height(x, z), 2);
    }
    world.free();
  });

  it('fences the ring from both sides', async () => {
    const R = await loadRapier();
    const world = new R.World({ x: 0, y: -9.81, z: 0 });
    world.createCollider(ringWallDesc(R, () => 5, -1, 3));
    world.step();
    const out = world.castRay(new R.Ray({ x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }), 20, true);
    const back = world.castRay(new R.Ray({ x: 9, y: 1, z: 0 }, { x: -1, y: 0, z: 0 }), 20, true);
    expect(out?.timeOfImpact).toBeCloseTo(5, 1);
    expect(back?.timeOfImpact).toBeCloseTo(4, 1);
    world.free();
  });
});
