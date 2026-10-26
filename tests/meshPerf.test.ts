import { describe, expect, it } from 'vitest';
import { hash3 } from '../src/art/palette';
import { carveSphere } from '../src/engine/voxel/Carve';
import { meshChunk } from '../src/engine/voxel/mesh';
import { VoxelGrid } from '../src/engine/voxel/VoxelGrid';

/**
 * PLAN M1 exit: a remesh after a carve finishes in < 8 ms per chunk. This is the
 * CPU half of that budget (the same code runs in the workers); the in-browser
 * worker timing is logged by `npm run perf -- --gate M1`.
 */
describe('mesh performance', () => {
  it('remeshes a carved, noisy surface chunk in < 8 ms (median)', () => {
    const g = new VoxelGrid();
    g.generate(0, 0, 0, 96, 64, 96, (x, y, z) => {
      const h = 30 + Math.sin(x * 0.11) * 8 + Math.cos(z * 0.09) * 8 + hash3(x, 0, z) * 2;
      if (y >= h) return 0;
      return y > h - 2 ? 2 : 1 + Math.floor(hash3(x >> 1, y >> 2, z >> 1, 3) * 4);
    });
    for (let i = 0; i < 6; i++) carveSphere(g, 40 + i * 3, 30, 48 - i * 2, 5 + i);
    const padded = g.padded(1, 0, 1);
    for (let i = 0; i < 5; i++) meshChunk(padded, [32, 0, 32]); // JIT warm-up
    const times: number[] = [];
    let quads = 0;
    for (let i = 0; i < 15; i++) {
      const t0 = performance.now();
      quads = meshChunk(padded, [32, 0, 32]).quads;
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const median = times[7] ?? Infinity;
    console.log(`[mesh perf] median ${median.toFixed(2)} ms/chunk, ${quads} quads`);
    expect(quads).toBeGreaterThan(200);
    expect(median).toBeLessThan(8);
  });
});
