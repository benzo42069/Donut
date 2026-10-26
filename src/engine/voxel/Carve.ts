import type { VoxelGrid } from './VoxelGrid';

/** A voxel removed by a carve: its position and palette index (for crumb particles). */
export interface RemovedVoxel {
  x: number;
  y: number;
  z: number;
  index: number;
}

/** Signed distance in voxel units; negative inside. */
export type VoxelSdf = (x: number, y: number, z: number) => number;

/**
 * Removes every solid voxel whose center lies inside `sdf` (≤ 0) within the
 * box [min, max] (inclusive, voxel coords). Touched chunks and their affected
 * neighbours are marked dirty by the grid. Returns the removed voxels.
 */
export function carveSdf(
  grid: VoxelGrid,
  sdf: VoxelSdf,
  min: readonly [number, number, number],
  max: readonly [number, number, number],
): RemovedVoxel[] {
  const removed: RemovedVoxel[] = [];
  for (let z = Math.floor(min[2]); z <= Math.ceil(max[2]); z++)
    for (let y = Math.floor(min[1]); y <= Math.ceil(max[1]); y++)
      for (let x = Math.floor(min[0]); x <= Math.ceil(max[0]); x++) {
        const index = grid.get(x, y, z);
        if (index === 0 || sdf(x + 0.5, y + 0.5, z + 0.5) > 0) continue;
        grid.set(x, y, z, 0);
        removed.push({ x, y, z, index });
      }
  return removed;
}

/** Sphere carve (a simple bite). Center and radius in voxel units. */
export function carveSphere(
  grid: VoxelGrid,
  cx: number,
  cy: number,
  cz: number,
  radius: number,
): RemovedVoxel[] {
  return carveSdf(
    grid,
    (x, y, z) => Math.hypot(x - cx, y - cy, z - cz) - radius,
    [cx - radius, cy - radius, cz - radius],
    [cx + radius, cy + radius, cz + radius],
  );
}

/** Puts carved voxels back (undo; also the carve round-trip in tests). */
export function restore(grid: VoxelGrid, removed: readonly RemovedVoxel[]): void {
  for (const v of removed) grid.set(v.x, v.y, v.z, v.index);
}
