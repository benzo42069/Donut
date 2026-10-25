import { CHUNK, PAD, type VoxelGrid } from './VoxelGrid';

/**
 * Greedy chunk mesher with per-vertex voxel AO (PLAN M1, art bible §6).
 *
 * Input is a padded PAD³ chunk (see `VoxelGrid.padded`). A face is emitted
 * where a solid voxel meets an empty one; faces on the padding are never
 * emitted, so neighbouring chunks tile without gaps or overlaps.
 *
 * Coplanar faces merge only when they share the palette index *and* the AO of
 * all four corners, so merging never smears AO. Per-voxel color jitter is not
 * baked: the voxel material recomputes it per fragment from the voxel cell
 * (`Materials.ts`), which keeps merged quads large.
 *
 * Vertex layout (all in voxel units, chunk origin included):
 *   position  Float32 ×3
 *   normal    Int8 ×3 (normalized, ±127)
 *   voxel     Uint8 ×2: palette index, and packed corner info:
 *             bits 0–1 AO level 0 (darkest) … 3 (open),
 *             bit 2 / bit 3 set if the vertex is on the quad's max-u / max-v edge
 *             (the material pushes quads out by a fraction of a pixel along
 *             these to close T-junction cracks; see `Materials.ts`).
 */
export interface MeshData {
  positions: Float32Array;
  normals: Int8Array;
  voxel: Uint8Array;
  indices: Uint16Array | Uint32Array;
  quads: number;
}

const PAD2 = PAD * PAD;
const stride = (axis: number): number => (axis === 0 ? 1 : axis === 1 ? PAD : PAD2);

/**
 * AO level for one face corner from its two edge neighbours and the diagonal
 * (0fps "ambient occlusion for Minecraft-like worlds").
 */
export function vertexAO(side1: boolean, side2: boolean, corner: boolean): number {
  if (side1 && side2) return 0;
  return 3 - (Number(side1) + Number(side2) + Number(corner));
}

/** Meshes one padded chunk. `origin` is the chunk's minimum corner in voxel units. */
export function meshChunk(
  padded: Uint8Array,
  origin: readonly [number, number, number] = [0, 0, 0],
  size = CHUNK,
): MeshData {
  // Growable output (pre-size for a typical surface chunk).
  let cap = 4096;
  let positions = new Float32Array(cap * 12);
  let normals = new Int8Array(cap * 12);
  let voxel = new Uint8Array(cap * 8);
  let quads = 0;
  let flips = new Uint8Array(cap);

  const grow = (): void => {
    cap *= 2;
    const p = new Float32Array(cap * 12);
    p.set(positions);
    positions = p;
    const n = new Int8Array(cap * 12);
    n.set(normals);
    normals = n;
    const v = new Uint8Array(cap * 8);
    v.set(voxel);
    voxel = v;
    const f = new Uint8Array(cap);
    f.set(flips);
    flips = f;
  };

  // mask[u + v*size]: 0 = no face, else pal | ao0<<8 | ao1<<10 | ao2<<12 | ao3<<14.
  const mask = new Uint32Array(size * size);

  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3;
    const v = (d + 2) % 3;
    const sd = stride(d);
    const su = stride(u);
    const sv = stride(v);
    for (let sign = 1; sign >= -1; sign -= 2) {
      const step = sign * sd;
      for (let s = 0; s < size; s++) {
        // 1. Build the face mask for this slice.
        let any = false;
        for (let j = 0; j < size; j++) {
          for (let i = 0; i < size; i++) {
            const idx = (s + 1) * sd + (i + 1) * su + (j + 1) * sv;
            const pal = padded[idx] ?? 0;
            const m = j * size + i;
            if (pal === 0 || (padded[idx + step] ?? 0) !== 0) {
              mask[m] = 0;
              continue;
            }
            // AO is sampled in the empty layer in front of the face.
            const L = idx + step;
            const s0 = (padded[L - su] ?? 0) !== 0;
            const s1 = (padded[L + su] ?? 0) !== 0;
            const t0 = (padded[L - sv] ?? 0) !== 0;
            const t1 = (padded[L + sv] ?? 0) !== 0;
            const ao0 = vertexAO(s0, t0, (padded[L - su - sv] ?? 0) !== 0);
            const ao1 = vertexAO(s1, t0, (padded[L + su - sv] ?? 0) !== 0);
            const ao2 = vertexAO(s1, t1, (padded[L + su + sv] ?? 0) !== 0);
            const ao3 = vertexAO(s0, t1, (padded[L - su + sv] ?? 0) !== 0);
            mask[m] = pal | (ao0 << 8) | (ao1 << 10) | (ao2 << 12) | (ao3 << 14);
            any = true;
          }
        }
        if (!any) continue;

        // 2. Greedy merge into rectangles of identical keys.
        for (let j = 0; j < size; j++) {
          for (let i = 0; i < size;) {
            const key = mask[j * size + i] ?? 0;
            if (key === 0) {
              i++;
              continue;
            }
            let w = 1;
            while (i + w < size && mask[j * size + i + w] === key) w++;
            let h = 1;
            grow: while (j + h < size) {
              for (let k = 0; k < w; k++) if (mask[(j + h) * size + i + k] !== key) break grow;
              h++;
            }
            for (let jj = 0; jj < h; jj++)
              mask.fill(0, (j + jj) * size + i, (j + jj) * size + i + w);

            if (quads >= cap) grow();
            const plane = sign > 0 ? s + 1 : s;
            const pb = quads * 12;
            const vb = quads * 8;
            for (let c = 0; c < 4; c++) {
              // Corners 0..3 = (i,j) (i+w,j) (i+w,j+h) (i,j+h); negative faces
              // reverse the order to keep CCW winding.
              const cc = sign > 0 ? c : (4 - c) & 3;
              const hiU = cc === 1 || cc === 2;
              const hiV = cc >= 2;
              const o = pb + c * 3;
              positions[o + d] = plane + (origin[d] ?? 0);
              positions[o + u] = (hiU ? i + w : i) + (origin[u] ?? 0);
              positions[o + v] = (hiV ? j + h : j) + (origin[v] ?? 0);
              normals[o + d] = sign * 127;
              voxel[vb + c * 2] = key & 255;
              voxel[vb + c * 2 + 1] = ((key >> (8 + cc * 2)) & 3) | (hiU ? 4 : 0) | (hiV ? 8 : 0);
            }
            // Split along the diagonal that keeps AO gradients symmetric (quad flip).
            const sum02 = ((key >> 8) & 3) + ((key >> 12) & 3);
            const sum13 = ((key >> 10) & 3) + ((key >> 14) & 3);
            flips[quads] = sum02 > sum13 ? 1 : 0;
            quads++;
            i += w;
          }
        }
      }
    }
  }

  const vertCount = quads * 4;
  const indices = vertCount > 65535 ? new Uint32Array(quads * 6) : new Uint16Array(quads * 6);
  for (let q = 0; q < quads; q++) {
    const b = q * 4;
    const o = q * 6;
    // Negative faces mirror the corner order, but AO corners 0/2 still sit on
    // vertices 0/2, so both diagonals map to the same vertex pairs.
    // Unflipped: (0,1,2)(0,2,3). Flipped: (1,2,3)(1,3,0).
    const f = flips[q] ?? 0;
    indices[o] = b + f;
    indices[o + 1] = b + 1 + f;
    indices[o + 2] = b + 2 + f;
    indices[o + 3] = b + f;
    indices[o + 4] = b + 2 + f;
    indices[o + 5] = b + ((3 + f) & 3);
  }

  return {
    positions: positions.slice(0, quads * 12),
    normals: normals.slice(0, quads * 12),
    voxel: voxel.slice(0, quads * 8),
    indices,
    quads,
  };
}

/** Concatenates several meshes into one (e.g. all chunks of a small prop). */
export function mergeMeshData(parts: readonly MeshData[]): MeshData {
  const quads = parts.reduce((n, p) => n + p.quads, 0);
  const positions = new Float32Array(quads * 12);
  const normals = new Int8Array(quads * 12);
  const voxel = new Uint8Array(quads * 8);
  const indices = quads * 4 > 65535 ? new Uint32Array(quads * 6) : new Uint16Array(quads * 6);
  let q = 0;
  for (const p of parts) {
    positions.set(p.positions, q * 12);
    normals.set(p.normals, q * 12);
    voxel.set(p.voxel, q * 8);
    for (let k = 0; k < p.indices.length; k++) indices[q * 6 + k] = (p.indices[k] ?? 0) + q * 4;
    q += p.quads;
  }
  return { positions, normals, voxel, indices, quads };
}

/** Meshes every chunk of a (small) grid on the calling thread, e.g. a prop model. */
export function meshGrid(grid: VoxelGrid): MeshData {
  return mergeMeshData(
    grid
      .chunkCoords()
      .map((c) =>
        meshChunk(grid.padded(c.cx, c.cy, c.cz), [c.cx * CHUNK, c.cy * CHUNK, c.cz * CHUNK]),
      ),
  );
}
