import { meshChunk, type MeshData } from './mesh';
import { PAD } from './VoxelGrid';

export interface MeshResult {
  data: MeshData;
  /** Meshing time inside the worker (ms), excluding transfer and queueing. */
  ms: number;
}

interface Pending {
  resolve: (r: MeshResult) => void;
  reject: (e: unknown) => void;
}

/**
 * A small pool of mesher workers (PLAN §2). Falls back to meshing on the
 * calling thread where Workers are unavailable (Vitest under Node).
 */
export class MesherPool {
  private readonly workers: Worker[] = [];
  private readonly pending = new Map<number, Pending>();
  private readonly spare: Uint8Array<ArrayBuffer>[] = [];
  private nextId = 1;
  private turn = 0;

  constructor(size = MesherPool.defaultSize()) {
    if (typeof Worker === 'undefined') return;
    for (let i = 0; i < size; i++) {
      const w = new Worker(new URL('./Mesher.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (
        e: MessageEvent<{
          id: number;
          data: MeshData;
          ms: number;
          padded: Uint8Array<ArrayBuffer>;
        }>,
      ) => {
        const p = this.pending.get(e.data.id);
        this.pending.delete(e.data.id);
        this.spare.push(e.data.padded);
        p?.resolve({ data: e.data.data, ms: e.data.ms });
      };
      w.onerror = (e) => {
        for (const p of this.pending.values()) p.reject(e);
        this.pending.clear();
      };
      this.workers.push(w);
      // JIT warm-up: mesh a busy synthetic chunk once so the first real remesh
      // (e.g. the first bite) does not run in the interpreter. Id 0 is ignored.
      const warm = new Uint8Array(PAD * PAD * PAD);
      for (let k = 0; k < warm.length; k++) warm[k] = (k * 2654435761) % 7 < 3 ? 1 + (k % 5) : 0;
      w.postMessage({ id: 0, padded: warm, origin: [0, 0, 0] }, [warm.buffer]);
    }
  }

  static defaultSize(): number {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    return Math.max(1, Math.min(4, cores - 1));
  }

  /** A reusable PAD³ buffer for `VoxelGrid.padded` (returned to the pool after meshing). */
  buffer(): Uint8Array<ArrayBuffer> {
    return this.spare.pop() ?? new Uint8Array(PAD * PAD * PAD);
  }

  /** Meshes a padded chunk. The buffer is transferred: do not reuse it. */
  mesh(padded: Uint8Array<ArrayBuffer>, origin: [number, number, number]): Promise<MeshResult> {
    const w = this.workers[this.turn++ % Math.max(1, this.workers.length)];
    if (!w) {
      const t0 = performance.now();
      const data = meshChunk(padded, origin);
      this.spare.push(padded);
      return Promise.resolve({ data, ms: performance.now() - t0 });
    }
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      w.postMessage({ id, padded, origin }, [padded.buffer]);
    });
  }

  dispose(): void {
    for (const w of this.workers) w.terminate();
    this.workers.length = 0;
  }
}
