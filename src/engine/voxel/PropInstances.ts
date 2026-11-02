import { InstancedMesh, Matrix4, Quaternion, Vector3, type Material } from 'three';
import { buildGeometry } from './geometry';
import { meshGrid } from './mesh';
import type { VoxelGrid } from './VoxelGrid';

export interface PropPlacement {
  /** World position of the model's pivot (bottom center). */
  x: number;
  y: number;
  z: number;
  /** Rotation about Y in radians. */
  rotY: number;
  scale?: number;
}

/**
 * Draws many copies of one voxel model in a single instanced draw. The model is
 * meshed once on the main thread (props are small); `pivot` is in whole voxel units
 * (the shader derives each voxel cell from the vertex position).
 */
export function createPropInstances(
  model: VoxelGrid,
  voxelSize: number,
  pivot: readonly [number, number, number],
  material: Material,
  placements: readonly PropPlacement[],
): InstancedMesh {
  const geo = buildGeometry(meshGrid(model));
  geo.translate(-pivot[0], -pivot[1], -pivot[2]);
  const mesh = new InstancedMesh(geo, material, placements.length);
  const m = new Matrix4();
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const s = new Vector3();
  const p = new Vector3();
  placements.forEach((pl, i) => {
    q.setFromAxisAngle(up, pl.rotY);
    s.setScalar(voxelSize * (pl.scale ?? 1));
    mesh.setMatrixAt(i, m.compose(p.set(pl.x, pl.y, pl.z), q, s));
  });
  mesh.computeBoundingSphere();
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
