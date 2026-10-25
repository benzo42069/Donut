/**
 * Sparse chunked voxel grid (PLAN §2). Voxels are Uint8 palette indices
 * (`src/art/palette.ts`); 0 is empty. Chunks are CHUNK³ and allocated on first
 * write. Coordinates are integer voxel units and may be negative.
 *
 * Writes mark chunks dirty, including neighbors whose faces or baked AO can
 * change (a voxel on a chunk border affects the chunk next door).
 */

export const CHUNK_BITS = 5;
export const CHUNK = 1 << CHUNK_BITS;
const MASK = CHUNK - 1;
/**
 * Neighbor voxels copied on every side of a padded chunk: one for face culling
 * and AO, a second for the wide smooth-normal window of relaxed materials.
 */
export const BORDER = 2;
/** Padded chunk edge. */
export const PAD = CHUNK + 2 * BORDER;

const KEY_OFFSET = 512;
const KEY_RANGE = 1024;

/** Packs chunk coords (each in [-512, 511]) into one integer map key. */
export function chunkKey(cx: number, cy: number, cz: number): number {
  return ((cx + KEY_OFFSET) * KEY_RANGE + (cy + KEY_OFFSET)) * KEY_RANGE + (cz + KEY_OFFSET);
}

export interface ChunkCoord {
  readonly cx: number;
  readonly cy: number;
  readonly cz: number;
  readonly key: number;
}

export function unpackChunkKey(key: number): ChunkCoord {
  const cz = (key % KEY_RANGE) - KEY_OFFSET;
  const rest = Math.floor(key / KEY_RANGE);
  const cy = (rest % KEY_RANGE) - KEY_OFFSET;
  const cx = Math.floor(rest / KEY_RANGE) - KEY_OFFSET;
  return { cx, cy, cz, key };
}

/** Index of a local voxel (0..CHUNK-1 on each axis) in a chunk array. x is fastest. */
export const localIndex = (x: number, y: number, z: number): number =>
  x | (y << CHUNK_BITS) | (z << (2 * CHUNK_BITS));

/** Index into a padded PAD³ array; coordinates run from -BORDER to CHUNK + BORDER - 1. */
export const paddedIndex = (x: number, y: number, z: number): number =>
  x + BORDER + (y + BORDER) * PAD + (z + BORDER) * PAD * PAD;

export class VoxelGrid {
  readonly chunks = new Map<number, Uint8Array>();
  private readonly dirty = new Set<number>();

  get(x: number, y: number, z: number): number {
    const c = this.chunks.get(chunkKey(x >> CHUNK_BITS, y >> CHUNK_BITS, z >> CHUNK_BITS));
    return c ? (c[localIndex(x & MASK, y & MASK, z & MASK)] ?? 0) : 0;
  }

  set(x: number, y: number, z: number, value: number): void {
    const cx = x >> CHUNK_BITS;
    const cy = y >> CHUNK_BITS;
    const cz = z >> CHUNK_BITS;
    const key = chunkKey(cx, cy, cz);
    let c = this.chunks.get(key);
    if (!c) {
      if (value === 0) return;
      c = new Uint8Array(CHUNK * CHUNK * CHUNK);
      this.chunks.set(key, c);
    }
    const lx = x & MASK;
    const ly = y & MASK;
    const lz = z & MASK;
    const i = localIndex(lx, ly, lz);
    if (c[i] === value) return;
    c[i] = value;
    this.markVoxelDirty(cx, cy, cz, lx, ly, lz);
  }

  /** Sets every voxel in the half-open box [min, max) to `value`. */
  fill(
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    value: number,
  ): void {
    this.generate(x0, y0, z0, x1, y1, z1, () => value);
  }

  /**
   * Writes `fn(x, y, z)` into every voxel of the half-open box [min, max),
   * chunk by chunk (fast path for world generation). Returning 0 empties a voxel.
   */
  generate(
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    fn: (x: number, y: number, z: number) => number,
  ): void {
    if (x1 <= x0 || y1 <= y0 || z1 <= z0) return;
    for (let cz = z0 >> CHUNK_BITS; cz <= (z1 - 1) >> CHUNK_BITS; cz++) {
      for (let cy = y0 >> CHUNK_BITS; cy <= (y1 - 1) >> CHUNK_BITS; cy++) {
        for (let cx = x0 >> CHUNK_BITS; cx <= (x1 - 1) >> CHUNK_BITS; cx++) {
          const key = chunkKey(cx, cy, cz);
          let c = this.chunks.get(key);
          const created = !c;
          c ??= new Uint8Array(CHUNK * CHUNK * CHUNK);
          const bx = cx << CHUNK_BITS;
          const by = cy << CHUNK_BITS;
          const bz = cz << CHUNK_BITS;
          const lx0 = Math.max(x0, bx) - bx;
          const ly0 = Math.max(y0, by) - by;
          const lz0 = Math.max(z0, bz) - bz;
          const lx1 = Math.min(x1, bx + CHUNK) - bx;
          const ly1 = Math.min(y1, by + CHUNK) - by;
          const lz1 = Math.min(z1, bz + CHUNK) - bz;
          let changed = false;
          for (let z = lz0; z < lz1; z++) {
            for (let y = ly0; y < ly1; y++) {
              for (let x = lx0; x < lx1; x++) {
                const v = fn(bx + x, by + y, bz + z);
                const i = localIndex(x, y, z);
                if (c[i] !== v) {
                  c[i] = v;
                  changed = true;
                }
              }
            }
          }
          if (!changed) continue;
          if (created) this.chunks.set(key, c);
          // The box may touch any border of this chunk, so neighbors may change too.
          for (let dz = -1; dz <= 1; dz++)
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) this.markDirty(cx + dx, cy + dy, cz + dz);
        }
      }
    }
  }

  /**
   * Column-wise world generation for thin or uneven shapes (terrain skins),
   * where scanning a whole box with `generate` would waste most calls.
   * `fn(x, z, put)` is called once per column of the half-open XZ rectangle and
   * calls `put(y, value)` for each voxel it writes (0 is ignored). Touched chunks
   * and their neighbors are marked dirty once at the end.
   */
  generateColumns(
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    fn: (x: number, z: number, put: (y: number, value: number) => void) => void,
  ): void {
    const touched = new Set<number>();
    let cx = 0;
    let cz = 0;
    let lx = 0;
    let lz = 0;
    let lastCy = Number.NaN;
    let chunk: Uint8Array | undefined;
    const put = (y: number, value: number): void => {
      if (value === 0) return;
      const cy = y >> CHUNK_BITS;
      if (cy !== lastCy) {
        lastCy = cy;
        const key = chunkKey(cx, cy, cz);
        chunk = this.chunks.get(key);
        if (!chunk) {
          chunk = new Uint8Array(CHUNK * CHUNK * CHUNK);
          this.chunks.set(key, chunk);
        }
        touched.add(key);
      }
      (chunk as Uint8Array)[localIndex(lx, y & MASK, lz)] = value;
    };
    for (let z = z0; z < z1; z++) {
      for (let x = x0; x < x1; x++) {
        cx = x >> CHUNK_BITS;
        cz = z >> CHUNK_BITS;
        lx = x & MASK;
        lz = z & MASK;
        lastCy = Number.NaN;
        fn(x, z, put);
      }
    }
    for (const key of touched) {
      const c = unpackChunkKey(key);
      for (let dz = -1; dz <= 1; dz++)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) this.markDirty(c.cx + dx, c.cy + dy, c.cz + dz);
    }
  }

  /** Marks a chunk for remeshing (only if it exists). */
  markDirty(cx: number, cy: number, cz: number): void {
    const key = chunkKey(cx, cy, cz);
    if (this.chunks.has(key)) this.dirty.add(key);
  }

  private markVoxelDirty(
    cx: number,
    cy: number,
    cz: number,
    lx: number,
    ly: number,
    lz: number,
  ): void {
    const rx = lx === 0 ? -1 : lx === MASK ? 1 : 0;
    const ry = ly === 0 ? -1 : ly === MASK ? 1 : 0;
    const rz = lz === 0 ? -1 : lz === MASK ? 1 : 0;
    // Every neighbor chunk reachable by stepping toward the borders this voxel touches.
    for (let dz = Math.min(0, rz); dz <= Math.max(0, rz); dz++)
      for (let dy = Math.min(0, ry); dy <= Math.max(0, ry); dy++)
        for (let dx = Math.min(0, rx); dx <= Math.max(0, rx); dx++)
          this.markDirty(cx + dx, cy + dy, cz + dz);
  }

  /** Returns and clears the dirty chunk list. */
  takeDirty(): ChunkCoord[] {
    const out = [...this.dirty].map(unpackChunkKey);
    this.dirty.clear();
    return out;
  }

  get dirtyCount(): number {
    return this.dirty.size;
  }

  /** All allocated chunks. */
  chunkCoords(): ChunkCoord[] {
    return [...this.chunks.keys()].map(unpackChunkKey);
  }

  /** Calls `fn` for every solid voxel (chunk order). */
  forEachVoxel(fn: (x: number, y: number, z: number, value: number) => void): void {
    for (const [key, c] of this.chunks) {
      const { cx, cy, cz } = unpackChunkKey(key);
      for (let i = 0; i < c.length; i++) {
        const v = c[i] ?? 0;
        if (!v) continue;
        fn(
          (cx << CHUNK_BITS) + (i & MASK),
          (cy << CHUNK_BITS) + ((i >> CHUNK_BITS) & MASK),
          (cz << CHUNK_BITS) + (i >> (2 * CHUNK_BITS)),
          v,
        );
      }
    }
  }

  /** Number of solid voxels. */
  count(): number {
    let n = 0;
    for (const c of this.chunks.values()) for (let i = 0; i < c.length; i++) if (c[i]) n++;
    return n;
  }

  /**
   * Copies a chunk plus a BORDER-voxel border from its 26 neighbors into a PAD³
   * array (index with `paddedIndex`). This is the mesher's input.
   */
  padded(
    cx: number,
    cy: number,
    cz: number,
    out: Uint8Array<ArrayBuffer> = new Uint8Array(PAD * PAD * PAD),
  ): Uint8Array<ArrayBuffer> {
    out.fill(0);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const src = this.chunks.get(chunkKey(cx + dx, cy + dy, cz + dz));
          if (!src) continue;
          // Range of local source coords that land in the padded window, per axis.
          const range = (d: number): [number, number] =>
            d < 0 ? [CHUNK - BORDER, CHUNK] : d > 0 ? [0, BORDER] : [0, CHUNK];
          const [x0, x1] = range(dx);
          const [y0, y1] = range(dy);
          const [z0, z1] = range(dz);
          for (let z = z0; z < z1; z++) {
            for (let y = y0; y < y1; y++) {
              const o = paddedIndex(x0 + dx * CHUNK, y + dy * CHUNK, z + dz * CHUNK);
              const s = localIndex(x0, y, z);
              for (let x = 0; x < x1 - x0; x++) out[o + x] = src[s + x] ?? 0;
            }
          }
        }
      }
    }
    return out;
  }
}
