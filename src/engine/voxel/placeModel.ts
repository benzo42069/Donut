import { Group, type Material, type Vector3 } from 'three';
import type { MesherPool } from './MesherPool';
import type { VoxelGrid } from './VoxelGrid';
import { VoxelObject } from './VoxelObject';

/** A voxel model placed in a scene: its grid, voxel size, pivot and pose. */
export interface Placed {
  grid: VoxelGrid;
  voxel: number;
  /** Pivot in whole voxels (the model origin moved to `pos`). */
  pivot: readonly [number, number, number];
  pos: Vector3;
  rotY: number;
  tiltX?: number;
  shadow?: boolean;
}

/** Wraps a model in a posed group and meshes every chunk on the worker pool. */
export function placeModel(
  p: Placed,
  material: Material,
  pool: MesherPool,
): { group: Group; ready: Promise<unknown> } {
  const group = new Group();
  group.position.copy(p.pos);
  group.rotation.set(p.tiltX ?? 0, p.rotY, 0, 'YXZ');
  // Model builders hand back clean grids; mesh every chunk.
  for (const c of p.grid.chunkCoords()) p.grid.markDirty(c.cx, c.cy, c.cz);
  const obj = new VoxelObject(p.grid, p.voxel, material, pool);
  obj.castsShadow = p.shadow ?? true;
  obj.position.set(-p.pivot[0] * p.voxel, -p.pivot[1] * p.voxel, -p.pivot[2] * p.voxel);
  group.add(obj);
  return { group, ready: obj.update() };
}
