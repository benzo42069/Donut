import { describe, expect, it } from 'vitest';
import { hash3 } from '../src/art/palette';
import { carveSdf, carveSphere, restore } from '../src/engine/voxel/Carve';
import { MesherPool } from '../src/engine/voxel/MesherPool';
import { VoxelGrid } from '../src/engine/voxel/VoxelGrid';
import { coveredFaces, meshGrid, naiveFaces } from './voxelHelpers';

function terrain(): VoxelGrid {
  const g = new VoxelGrid();
  g.generate(0, 0, 0, 64, 40, 64, (x, y, z) => {
    const h = 20 + Math.sin(x * 0.2) * 4 + Math.cos(z * 0.15) * 4;
    return y < h ? 1 + Math.floor(hash3(x, y, z) * 3) : 0;
  });
  g.takeDirty();
  return g;
}

const snapshot = (g: VoxelGrid): Map<number, string> =>
  new Map([...g.chunks].map(([k, c]) => [k, Buffer.from(c).toString('base64')]));

describe('carving', () => {
  it('removes exactly the voxels whose centers are inside the sphere', () => {
    const g = terrain();
    const before = g.count();
    const removed = carveSphere(g, 32, 20, 32, 6);
    expect(removed.length).toBeGreaterThan(100);
    expect(g.count()).toBe(before - removed.length);
    for (const v of removed) {
      expect(Math.hypot(v.x + 0.5 - 32, v.y + 0.5 - 20, v.z + 0.5 - 32)).toBeLessThanOrEqual(6);
      expect(v.index).toBeGreaterThan(0);
    }
    expect(carveSphere(g, 32, 20, 32, 6)).toEqual([]); // nothing left there
  });

  it('round-trips: carve then restore gives the identical grid', () => {
    const g = terrain();
    const before = snapshot(g);
    const a = carveSphere(g, 31.5, 22, 31.5, 9.3); // straddles 4 chunks
    const b = carveSdf(
      g,
      (x, y, z) => Math.max(Math.abs(x - 10) - 3, Math.abs(y - 18) - 5, Math.abs(z - 50) - 2),
      [6, 12, 47],
      [14, 24, 53],
    );
    expect(snapshot(g)).not.toEqual(before);
    restore(g, b);
    restore(g, a);
    expect(snapshot(g)).toEqual(before);
  });

  it('dirties the touched chunks and neighbours that share a border', () => {
    const g = terrain();
    carveSphere(g, 32, 20, 32, 3); // around the corner of 4 chunks
    const dirty = g
      .takeDirty()
      .map((c) => `${c.cx},${c.cy},${c.cz}`)
      .sort();
    expect(dirty).toEqual(['0,0,0', '0,0,1', '1,0,0', '1,0,1']);
  });

  it('remeshes after a carve without holes or overlaps', async () => {
    const g = terrain();
    carveSphere(g, 33, 24, 30, 7);
    const pool = new MesherPool(); // no Worker in Node: meshes inline
    const dirty = g.takeDirty();
    const results = await Promise.all(
      dirty.map((c) => pool.mesh(g.padded(c.cx, c.cy, c.cz), [c.cx * 32, c.cy * 32, c.cz * 32])),
    );
    expect(results.every((r) => r.data.quads > 0)).toBe(true);
    const covered = coveredFaces(meshGrid(g));
    const naive = naiveFaces(g);
    expect(covered.size).toBe(naive.size);
  });
});
