import { Group, Mesh, type Material } from 'three';
import { buildGeometry } from './geometry';
import { MesherPool } from './MesherPool';
import { CHUNK, VoxelGrid, type ChunkCoord } from './VoxelGrid';

export interface RemeshStats {
  chunks: number;
  /** Sum and max of per-chunk meshing time inside the workers (ms). */
  workerMsTotal: number;
  workerMsMax: number;
  /** Wall time from request to all geometries swapped in (ms). */
  wallMs: number;
  quads: number;
  /** The chunks that were remeshed. */
  coords: ChunkCoord[];
}

/**
 * A renderable voxel grid: one Mesh per chunk, remeshed in workers when the
 * grid marks chunks dirty (edits, carves). Positions are in voxel units, so the
 * group is scaled by the voxel size (art bible §3).
 */
export class VoxelObject extends Group {
  readonly grid: VoxelGrid;
  readonly voxelSize: number;
  private readonly material: Material;
  private readonly pool: MesherPool;
  private readonly meshes = new Map<number, Mesh>();
  private readonly versions = new Map<number, number>();
  castsShadow = true;

  constructor(grid: VoxelGrid, voxelSize: number, material: Material, pool: MesherPool) {
    super();
    this.grid = grid;
    this.voxelSize = voxelSize;
    this.material = material;
    this.pool = pool;
    this.scale.setScalar(voxelSize);
  }

  /** Remeshes every dirty chunk. Resolves once all new geometry is in place. */
  async update(): Promise<RemeshStats> {
    const t0 = performance.now();
    const dirty = this.grid.takeDirty();
    let workerMsTotal = 0;
    let workerMsMax = 0;
    let quads = 0;
    await Promise.all(
      dirty.map(async (c) => {
        const version = (this.versions.get(c.key) ?? 0) + 1;
        this.versions.set(c.key, version);
        const padded = this.grid.padded(c.cx, c.cy, c.cz, this.pool.buffer());
        const r = await this.pool.mesh(padded, [c.cx * CHUNK, c.cy * CHUNK, c.cz * CHUNK]);
        workerMsTotal += r.ms;
        workerMsMax = Math.max(workerMsMax, r.ms);
        quads += r.data.quads;
        if (this.versions.get(c.key) !== version) return; // a newer remesh is in flight
        this.swap(c.key, r.data.quads > 0 ? buildGeometry(r.data) : null);
      }),
    );
    return {
      chunks: dirty.length,
      workerMsTotal,
      workerMsMax,
      wallMs: performance.now() - t0,
      quads,
      coords: dirty,
    };
  }

  private swap(key: number, geo: ReturnType<typeof buildGeometry> | null): void {
    const old = this.meshes.get(key);
    if (old) {
      old.geometry.dispose();
      if (!geo) {
        this.remove(old);
        this.meshes.delete(key);
        return;
      }
      old.geometry = geo;
      return;
    }
    if (!geo) return;
    const mesh = new Mesh(geo, this.material);
    mesh.castShadow = this.castsShadow;
    mesh.receiveShadow = true;
    this.meshes.set(key, mesh);
    this.add(mesh);
  }

  get chunkMeshCount(): number {
    return this.meshes.size;
  }

  dispose(): void {
    for (const m of this.meshes.values()) m.geometry.dispose();
    this.meshes.clear();
  }
}
