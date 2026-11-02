import { describe, expect, it } from 'vitest';
import { DONUT_HERO_VOXEL, biteDonut, buildDonut } from '../src/art/models/donut';
import { MUNCH, Munch, munchTimeline, pickTarget, type Target } from '../src/game/munch/Munch';
import { BURP_KEEP, POWER_MODS, PowerState } from '../src/game/powers/Powers';

const donut = (x: number, z: number, flavor: Target['flavor'] = 'glazed'): Target => ({
  index: 0,
  x,
  z,
  eaten: false,
  flavor,
});

describe('munch', () => {
  it('auto-aims at the nearest uneaten donut in reach', () => {
    const near = { ...donut(0, 0.9), index: 1 };
    const far = { ...donut(0, 1.4), index: 2 };
    expect(pickTarget(0, 0, 0, [far, near])?.index).toBe(1);
    near.eaten = true;
    expect(pickTarget(0, 0, 0, [far, near])?.index).toBe(2);
    expect(pickTarget(0, 0, 0, [donut(0, MUNCH.range + 0.5)])).toBeNull();
  });

  it('takes three chomps, then gulps and ends', () => {
    const m = new Munch();
    const t = donut(0, 1);
    m.start(t);
    const chomps: number[] = [];
    let gulped = false;
    let done = false;
    for (let i = 0; i < 400 && !done; i++) {
      const ev = m.step(1 / 60);
      if (ev.chomp !== undefined) chomps.push(ev.chomp);
      gulped ||= ev.gulped !== undefined;
      done = ev.done === true;
    }
    expect(chomps).toEqual([0, 1, 2]);
    expect(gulped && t.eaten && done && !m.active).toBe(true);
    expect(munchTimeline().end).toBeLessThan(3.5);
  });

  it('carves a real bite: voxels removed, no voxels added', () => {
    const grid = buildDonut('glazed', 3, DONUT_HERO_VOXEL);
    const before = grid.count();
    const removed = biteDonut(grid, 'glazed', { angle: 1, radius: 0.19 }, DONUT_HERO_VOXEL, 1);
    expect(removed.length).toBeGreaterThan(500);
    expect(grid.count()).toBe(before - removed.length);
  });

  it('a grid snapshot undoes a bite exactly (deterministic replays)', () => {
    const grid = buildDonut('strawberry', 2, DONUT_HERO_VOXEL);
    const snap = grid.snapshot();
    const n = grid.count();
    biteDonut(grid, 'strawberry', { angle: 0 }, DONUT_HERO_VOXEL, 2);
    grid.restoreSnapshot(snap);
    expect(grid.count()).toBe(n);
    expect(grid.dirtyCount).toBeGreaterThan(0);
  });
});

describe('powers', () => {
  it('maps the four MVP flavors to Boing, Slide, Puff and Shine', () => {
    const p = new PowerState();
    expect(p.grant('strawberry', 0)).toBe('boing');
    expect(p.grant('chocolate', 0)).toBe('slide');
    expect(p.grant('powdered', 0)).toBe('puff');
    expect(p.grant('glazed', 0)).toBe('shine');
    expect(POWER_MODS.boing.jump).toBe(3);
  });

  it('lasts until a different donut, or 20 s after a burp', () => {
    const p = new PowerState();
    p.grant('strawberry', 0);
    p.update(100);
    expect(p.power).toBe('boing');
    p.burped(100);
    p.update(100 + BURP_KEEP - 0.1);
    expect(p.power).toBe('boing');
    p.update(100 + BURP_KEEP);
    expect(p.power).toBeNull();
  });
});
