import { BufferAttribute, BufferGeometry } from 'three';
import type { MeshData } from './mesh';

/** Wraps mesher output in a BufferGeometry for the voxel material (`Materials.ts`). */
export function buildGeometry(data: MeshData): BufferGeometry {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(data.positions, 3));
  geo.setAttribute('normal', new BufferAttribute(data.normals, 3, true));
  geo.setAttribute('snormal', new BufferAttribute(data.snormals, 3, true));
  geo.setAttribute('voxel', new BufferAttribute(data.voxel, 2));
  geo.setIndex(new BufferAttribute(data.indices, 1));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}
