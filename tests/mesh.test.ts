import { describe, expect, it } from 'vitest';
import { hash3 } from '../src/art/palette';
import { VoxelGrid } from '../src/engine/voxel/VoxelGrid';
import { meshChunk, vertexAO } from '../src/engine/voxel/mesh';
import { coveredFaces, meshGrid, naiveFaces } from './voxelHelpers';

function expectExactCoverage(g: VoxelGrid): void {
  const mesh = meshGrid(g);
  const naive = naiveFaces(g);
  const covered = coveredFaces(mesh); // throws on overlaps
  expect(covered.size).toBe(naive.size);
  for (const [k, pal] of naive) expect(covered.get(k), k).toBe(pal);
}

describe('greedy mesher', () => {
  it('meshes a single voxel as 6 quads', () => {
    const g = new VoxelGrid();
    g.set(3, 4, 5, 2);
    const m = meshGrid(g);
    expect(m.quads).toBe(6);
    expect(m.indices.length).toBe(36);
    expect(m.positions.length).toBe(6 * 4 * 3);
  });

  it('merges a solid box into 6 quads', () => {
    const g = new VoxelGrid();
    g.fill(0, 0, 0, 5, 3, 7, 1);
    expect(meshGrid(g).quads).toBe(6);
  });

  it('does not merge across different palette indices', () => {
    const g = new VoxelGrid();
    g.fill(0, 0, 0, 4, 1, 1, 1);
    g.set(2, 0, 0, 2);
    // Ends are 1 quad each; the 4 long sides split into 3 runs (1,1 | 2 | 1).
    expect(meshGrid(g).quads).toBe(2 + 4 * 3);
  });

  it('splits faces where AO differs', () => {
    const g = new VoxelGrid();
    g.fill(0, 0, 0, 8, 1, 8, 1); // floor
    g.set(4, 1, 4, 1); // a bump darkens the floor around it
    const m = meshGrid(g);
    const flat = new VoxelGrid();
    flat.fill(0, 0, 0, 8, 1, 8, 1);
    expect(m.quads).toBeGreaterThan(meshGrid(flat).quads + 5);
  });

  it('keeps chunks seamless: no holes or overlaps, also across chunk borders', () => {
    const g = new VoxelGrid();
    // A rough blob spanning 8 chunks around the origin.
    g.generate(-20, -20, -20, 20, 20, 20, (x, y, z) => {
      const r = Math.hypot(x, y, z) + hash3(x, y, z) * 4;
      if (r > 18) return 0;
      return 1 + Math.floor(hash3(x >> 2, y >> 2, z >> 2, 5) * 3);
    });
    expect(g.chunks.size).toBe(8);
    expectExactCoverage(g);
  });

  it('covers a random sparse field exactly (worst case for greedy merges)', () => {
    const g = new VoxelGrid();
    g.generate(0, 0, 0, 40, 34, 33, (x, y, z) => (hash3(x, y, z, 9) > 0.6 ? 1 + (x & 1) : 0));
    expectExactCoverage(g);
  });

  it('computes corner AO per the 4-corner rule', () => {
    expect(vertexAO(false, false, false)).toBe(3);
    expect(vertexAO(false, false, true)).toBe(2);
    expect(vertexAO(true, false, true)).toBe(1);
    expect(vertexAO(true, true, false)).toBe(0);
  });

  it('bakes AO into the floor beside a wall', () => {
    const g = new VoxelGrid();
    g.fill(0, 0, 0, 4, 1, 4, 1);
    g.fill(0, 1, 0, 1, 2, 4, 1); // wall along x = 0
    const m = meshGrid(g);
    // Find the top-face vertices of the floor at x = 1 (touching the wall).
    const aos: number[] = [];
    for (let q = 0; q < m.quads; q++) {
      if ((m.normals[q * 12 + 1] ?? 0) <= 0) continue;
      for (let c = 0; c < 4; c++) {
        const x = m.positions[q * 12 + c * 3];
        const y = m.positions[q * 12 + c * 3 + 1];
        if (x === 1 && y === 1) aos.push((m.voxel[q * 8 + c * 2 + 1] ?? 0) & 3);
      }
    }
    expect(aos.length).toBeGreaterThan(0);
    expect(Math.max(...aos)).toBeLessThan(3);
  });

  it('winds triangles counter-clockwise around the outward normal', () => {
    const g = new VoxelGrid();
    g.set(0, 0, 0, 1);
    const m = meshGrid(g);
    for (let t = 0; t < m.indices.length; t += 3) {
      const p = [0, 1, 2].map((k) => {
        const i = (m.indices[t + k] ?? 0) * 3;
        return [m.positions[i] ?? 0, m.positions[i + 1] ?? 0, m.positions[i + 2] ?? 0];
      });
      const [a, b, c] = p as [number[], number[], number[]];
      const e1 = a.map((v, k) => (b[k] ?? 0) - v);
      const e2 = a.map((v, k) => (c[k] ?? 0) - v);
      const cross = [
        (e1[1] ?? 0) * (e2[2] ?? 0) - (e1[2] ?? 0) * (e2[1] ?? 0),
        (e1[2] ?? 0) * (e2[0] ?? 0) - (e1[0] ?? 0) * (e2[2] ?? 0),
        (e1[0] ?? 0) * (e2[1] ?? 0) - (e1[1] ?? 0) * (e2[0] ?? 0),
      ];
      const vi = (m.indices[t] ?? 0) * 3;
      const n = [m.normals[vi] ?? 0, m.normals[vi + 1] ?? 0, m.normals[vi + 2] ?? 0];
      expect(cross.reduce((acc, c, k) => acc + c * (n[k] ?? 0), 0)).toBeGreaterThan(0);
    }
  });

  it('flags each vertex with its quad corner (for crack closing)', () => {
    const g = new VoxelGrid();
    g.fill(0, 0, 0, 3, 2, 1, 1);
    const m = meshGrid(g);
    for (let q = 0; q < m.quads; q++) {
      const flags = [0, 1, 2, 3].map((c) => ((m.voxel[q * 8 + c * 2 + 1] ?? 0) >> 2) & 3);
      expect(flags.sort()).toEqual([0, 1, 2, 3]); // one vertex per corner
    }
  });

  it('meshes an empty chunk to nothing', () => {
    expect(meshChunk(new Uint8Array(34 ** 3)).quads).toBe(0);
  });
});
