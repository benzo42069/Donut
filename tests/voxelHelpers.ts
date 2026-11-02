import { VoxelGrid } from '../src/engine/voxel/VoxelGrid';
import { CHUNK } from '../src/engine/voxel/VoxelGrid';
import { meshGrid, type MeshData } from '../src/engine/voxel/mesh';

export { meshGrid };

const DIRS: [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

/** Every exposed unit face, as "x,y,z,nx,ny,nz" → palette index (the naive mesh). */
export function naiveFaces(grid: VoxelGrid): Map<string, number> {
  const out = new Map<string, number>();
  for (const c of grid.chunkCoords()) {
    for (let z = 0; z < CHUNK; z++)
      for (let y = 0; y < CHUNK; y++)
        for (let x = 0; x < CHUNK; x++) {
          const gx = c.cx * CHUNK + x;
          const gy = c.cy * CHUNK + y;
          const gz = c.cz * CHUNK + z;
          const v = grid.get(gx, gy, gz);
          if (!v) continue;
          for (const [dx, dy, dz] of DIRS) {
            if (grid.get(gx + dx, gy + dy, gz + dz) === 0)
              out.set(`${gx},${gy},${gz},${dx},${dy},${dz}`, v);
          }
        }
  }
  return out;
}

/**
 * Rasterizes the mesh's quads back into unit faces. Throws on any face covered
 * twice (overlap); the caller compares the result to `naiveFaces` (holes).
 */
export function coveredFaces(mesh: MeshData): Map<string, number> {
  const out = new Map<string, number>();
  for (let q = 0; q < mesh.quads; q++) {
    const n = [0, 1, 2].map((k) => Math.sign(mesh.normals[q * 12 + k] ?? 0));
    const d = n.findIndex((k) => k !== 0);
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let c = 0; c < 4; c++)
      for (let k = 0; k < 3; k++) {
        const p = mesh.positions[q * 12 + c * 3 + k] ?? 0;
        if (!Number.isInteger(p)) throw new Error(`non-integer vertex ${p}`);
        min[k] = Math.min(min[k] ?? 0, p);
        max[k] = Math.max(max[k] ?? 0, p);
      }
    const plane = min[d] ?? 0;
    const pal = mesh.voxel[q * 8] ?? 0;
    const u = (d + 1) % 3;
    const v = (d + 2) % 3;
    for (let a = min[u] ?? 0; a < (max[u] ?? 0); a++)
      for (let b = min[v] ?? 0; b < (max[v] ?? 0); b++) {
        const cell = [0, 0, 0];
        cell[d] = (n[d] ?? 0) > 0 ? plane - 1 : plane;
        cell[u] = a;
        cell[v] = b;
        const key = `${cell.join(',')},${n.join(',')}`;
        if (out.has(key)) throw new Error(`face covered twice: ${key}`);
        out.set(key, pal);
      }
  }
  return out;
}
