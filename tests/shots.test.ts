import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SHOTS } from '../src/debug/shots';

interface GateConfig {
  shots: string[];
  strips?: string[];
}

const gates = JSON.parse(
  readFileSync(new URL('../scripts/gates.json', import.meta.url), 'utf8'),
) as Record<string, GateConfig>;

describe('shot registry', () => {
  it('defines every shot ID that a gate lists', () => {
    for (const [gate, cfg] of Object.entries(gates)) {
      for (const id of [...cfg.shots, ...(cfg.strips ?? [])]) {
        expect(SHOTS[id], `${gate}: ${id}`).toBeDefined();
      }
    }
  });

  it('forces the low tier on *-low-tier shots', () => {
    for (const [id, def] of Object.entries(SHOTS)) {
      if (id.endsWith('-low-tier')) expect(def.tier).toBe('low');
    }
  });
});
