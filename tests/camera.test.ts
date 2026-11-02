import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { FollowCamera } from '../src/game/camera/FollowCamera';

const DT = 1 / 60;
const free = (_from: Vector3, _dir: Vector3, max: number): number => max;

/** Walks the target in a straight line and returns the camera yaw change. */
function walk(dirX: number, dirZ: number, startYaw: number): number {
  const cam = new FollowCamera(16 / 9, free, () => 0);
  const p = new Vector3(0, 0, 0);
  cam.reset(p, startYaw);
  for (let i = 0; i < 120; i++) {
    p.x += dirX * 2.4 * DT;
    p.z += dirZ * 2.4 * DT;
    cam.update(DT, p, true, 0);
  }
  return cam.yaw - startYaw;
}

describe('follow camera', () => {
  it('backs up without turning when Glazey walks at the lens', () => {
    // The camera sits at +z (yaw 0); walking toward +z is walking at it.
    expect(Math.abs(walk(0, 1, 0))).toBeLessThan(0.01);
  });

  it('orbits gently, never spirals, when Glazey walks sideways', () => {
    const turn = Math.abs(walk(1, 0, 0));
    expect(turn).toBeGreaterThan(0.2);
    expect(turn).toBeLessThan(0.9);
  });

  it('pulls in before an obstacle', () => {
    const cam = new FollowCamera(
      16 / 9,
      (_f, _d, max) => Math.min(max, 3),
      () => 0,
    );
    cam.reset(new Vector3(), 0);
    expect(cam.camera.position.length()).toBeLessThan(3.5);
  });
});
