import { describe, expect, it } from 'vitest';
import {
  CHUNK,
  PAD,
  VoxelGrid,
  chunkKey,
  paddedIndex,
  unpackChunkKey,
} from '../src/engine/voxel/VoxelGrid';

const keys = (g: VoxelGrid): string[] =>
  g
    .takeDirty()
    .map((c) => `${c.cx},${c.cy},${c.cz}`)
    .sort();

describe('VoxelGrid', () => {
  it('packs and unpacks chunk keys, including negatives', () => {
    for (const [x, y, z] of [
      [0, 0, 0],
      [-1, 2, -3],
      [511, -512, 7],
    ] as const) {
      const c = unpackChunkKey(chunkKey(x, y, z));
      expect([c.cx, c.cy, c.cz]).toEqual([x, y, z]);
    }
  });

  it('gets and sets across chunk borders and negative coordinates', () => {
    const g = new VoxelGrid();
    expect(g.get(5, 5, 5)).toBe(0);
    g.set(-1, 0, 31, 3);
    g.set(32, -33, 0, 7);
    expect(g.get(-1, 0, 31)).toBe(3);
    expect(g.get(32, -33, 0)).toBe(7);
    expect(g.get(0, 0, 31)).toBe(0);
    expect(g.chunks.size).toBe(2);
    expect(g.count()).toBe(2);
  });

  it('does not allocate chunks for empty writes', () => {
    const g = new VoxelGrid();
    g.set(1, 1, 1, 0);
    g.fill(0, 0, 0, 40, 40, 40, 0);
    expect(g.chunks.size).toBe(0);
  });

  it('marks neighbour chunks dirty for voxels on chunk borders', () => {
    const g = new VoxelGrid();
    g.fill(0, 0, 0, 2 * CHUNK, CHUNK, 2 * CHUNK, 1);
    g.takeDirty();
    g.set(10, 10, 10, 2); // interior: own chunk only
    expect(keys(g)).toEqual(['0,0,0']);
    g.set(31, 10, 31, 2); // +x/+z edge: 4 chunks (all that exist)
    expect(keys(g)).toEqual(['0,0,0', '0,0,1', '1,0,0', '1,0,1']);
    g.set(31, 10, 31, 2); // unchanged value: nothing dirty
    expect(keys(g)).toEqual([]);
  });

  it('fills half-open boxes', () => {
    const g = new VoxelGrid();
    g.fill(-3, 0, 0, 3, 2, 1, 5);
    expect(g.count()).toBe(12);
    expect(g.get(-3, 0, 0)).toBe(5);
    expect(g.get(3, 0, 0)).toBe(0);
  });

  it('builds padded chunks with neighbour borders', () => {
    const g = new VoxelGrid();
    g.set(0, 0, 0, 1);
    g.set(-1, 0, 0, 2); // chunk -1, appears at padded x = -1
    g.set(32, 31, 0, 3); // chunk +x, appears at padded x = 32
    g.set(-1, -1, -1, 4); // corner neighbour
    g.set(33, 0, 0, 9); // two voxels away: not in the padding
    const p = g.padded(0, 0, 0);
    expect(p.length).toBe(PAD ** 3);
    expect(p[paddedIndex(0, 0, 0)]).toBe(1);
    expect(p[paddedIndex(-1, 0, 0)]).toBe(2);
    expect(p[paddedIndex(32, 31, 0)]).toBe(3);
    expect(p[paddedIndex(-1, -1, -1)]).toBe(4);
    expect([...p].filter((v) => v !== 0).length).toBe(4);
  });
});
