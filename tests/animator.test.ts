import { describe, expect, it } from 'vitest';
import { GlazeyAnimator } from '../src/game/player/GlazeyAnimator';

const DT = 1 / 60;

describe('Glazey animator', () => {
  it('squashes on landing and wobbles back to rest', () => {
    const a = new GlazeyAnimator();
    for (let i = 0; i < 60; i++) a.step(DT, { speed: 0, vy: 0, grounded: true, turnRate: 0 });
    a.step(DT, { speed: 0, vy: 0, grounded: true, turnRate: 0, landed: 8 });
    let min = Infinity;
    let overshoot = -Infinity;
    for (let i = 0; i < 120; i++) {
      a.step(DT, { speed: 0, vy: 0, grounded: true, turnRate: 0 });
      min = Math.min(min, a.pose().squash);
      if (min < 0.9) overshoot = Math.max(overshoot, a.pose().squash);
    }
    expect(min).toBeLessThan(0.85);
    expect(overshoot).toBeGreaterThan(1.01); // jelly: it springs past rest
    expect(Math.abs(a.pose().squash - 1)).toBeLessThan(0.03);
  });

  it('alternates the feet while walking', () => {
    const a = new GlazeyAnimator();
    let leftUp = 0;
    let rightUp = 0;
    let both = 0;
    for (let i = 0; i < 240; i++) {
      a.step(DT, { speed: 2.6, vy: 0, grounded: true, turnRate: 0 });
      if (i < 60) continue;
      const [l, r] = a.pose().feet;
      if (l.lift > 0.03) leftUp++;
      if (r.lift > 0.03) rightUp++;
      if (l.lift > 0.03 && r.lift > 0.03) both++;
    }
    expect(leftUp).toBeGreaterThan(40);
    expect(rightUp).toBeGreaterThan(40);
    expect(both).toBe(0);
  });

  it('stretches and raises its arms in the air', () => {
    const a = new GlazeyAnimator();
    a.step(DT, { speed: 0, vy: 6, grounded: false, turnRate: 0, jumped: true });
    for (let i = 0; i < 8; i++)
      a.step(DT, { speed: 0, vy: 6 - i * 0.3, grounded: false, turnRate: 0 });
    expect(a.pose().squash).toBeGreaterThan(1.05);
    expect(a.pose().arms[0].raise).toBeGreaterThan(0.6);
  });

  it('throws the arms up by the apex of a jump', () => {
    const a = new GlazeyAnimator();
    for (let i = 0; i < 60; i++) a.step(DT, { speed: 2, vy: 0, grounded: true, turnRate: 0 });
    a.step(DT, { speed: 2, vy: 6, grounded: false, turnRate: 0, jumped: true });
    for (let i = 0; i < 18; i++)
      a.step(DT, { speed: 2, vy: 6 - i * 0.35, grounded: false, turnRate: 0 });
    for (const arm of a.pose().arms) expect(arm.raise).toBeGreaterThan(1.4);
  });
});
