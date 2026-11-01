/// <reference lib="webworker" />
import { meshChunk } from './mesh';

/** Request: one padded chunk. Response: mesh arrays (transferred) plus the meshing time. */
export interface MeshRequest {
  id: number;
  padded: Uint8Array;
  origin: [number, number, number];
  /** Relax every non-crisp voxel (see `meshChunk`). */
  relax?: boolean;
}

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (e: MessageEvent<MeshRequest>): void => {
  const { id, padded, origin, relax } = e.data;
  const t0 = performance.now();
  const data = meshChunk(padded, origin, undefined, relax);
  const ms = performance.now() - t0;
  self.postMessage({ id, data, ms, padded }, [
    data.positions.buffer,
    data.normals.buffer,
    data.snormals.buffer,
    data.voxel.buffer,
    data.indices.buffer,
    padded.buffer,
  ]);
};
