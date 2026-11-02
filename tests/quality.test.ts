import { describe, expect, it } from 'vitest';
import { QUALITY, detectTier, isQualityTier } from '../src/engine/quality';

describe('quality tiers', () => {
  it('validates tier names', () => {
    expect(isQualityTier('high')).toBe(true);
    expect(isQualityTier('ultra')).toBe(false);
  });

  it('scales cost monotonically from low to high', () => {
    expect(QUALITY.low.shadowMapSize).toBeLessThan(QUALITY.high.shadowMapSize);
    expect(QUALITY.low.ssao).toBe(false);
    expect(QUALITY.high.ssao).toBe(true);
  });

  it('picks a tier from device hints', () => {
    expect(detectTier({ hardwareConcurrency: 2, deviceMemory: 2 })).toBe('low');
    expect(
      detectTier({ hardwareConcurrency: 8, deviceMemory: 8, maxTouchPoints: 5, screenWidth: 900 }),
    ).toBe('medium');
    expect(detectTier({ hardwareConcurrency: 12, deviceMemory: 16 })).toBe('high');
  });
});
