import { MAT, PALETTE_NAMES, VOXEL_PALETTE } from '../../art/palette';
import { BORDER, CHUNK, PAD, paddedIndex, type VoxelGrid } from './VoxelGrid';

/**
 * Smooth palette entries (gloss icing and glaze, clouds and syrup, sugar and
 * gingerbread): their faces are emitted unmerged, every vertex carries the
 * occupancy-gradient normal of its lattice corner, and corners are relaxed toward
 * the isosurface (surface-nets style), so 1-voxel stair steps become sloped facets.
 * Silhouettes and per-voxel color stay voxel (art bible §2, §5).
 */
const SMOOTH = new Uint8Array(256);
/** Glossy entries shade with a wider normal window (one clean specular, no terraces). */
const GLOSS = new Uint8Array(256);
PALETTE_NAMES.forEach((n, i) => {
  const m = VOXEL_PALETTE[n].mat;
  if (m & (MAT.gloss | MAT.lit | MAT.smooth) && !(m & MAT.crisp)) SMOOTH[i + 1] = 1;
  if (m & MAT.gloss && !(m & MAT.crisp)) GLOSS[i + 1] = 1;
});
/** Corner relaxation strength: voxels moved per unit of (solid fraction − ½). */
const RELAX = 1.5;

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
  /** Smooth (occupancy-gradient) normals, Int8 ×3; equal to `normals` on matte faces. */
  snormals: Int8Array;
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

/** `vertexAO` for every (side1, side2, corner) bit pattern (bit 0, 1, 2). */
const AO_LUT = Uint8Array.from({ length: 8 }, (_, b) =>
  vertexAO((b & 1) !== 0, (b & 2) !== 0, (b & 4) !== 0),
);

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
  let snormals = new Int8Array(cap * 12);
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
    const sn = new Int8Array(cap * 12);
    sn.set(snormals);
    snormals = sn;
    const v = new Uint8Array(cap * 8);
    v.set(voxel);
    voxel = v;
    const f = new Uint8Array(cap);
    f.set(flips);
    flips = f;
  };

  const lattice = [0, 0, 0];
  const [ox, oy, oz] = origin;
  const org = [ox, oy, oz];
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
        const base = (s + BORDER) * sd + BORDER * su + BORDER * sv;
        for (let j = 0; j < size; j++) {
          let idx = base + j * sv;
          let m = j * size;
          for (let i = 0; i < size; i++, idx += su, m++) {
            const pal = padded[idx] ?? 0;
            if (pal === 0 || padded[idx + step]) {
              mask[m] = 0;
              continue;
            }
            // AO is sampled in the empty layer in front of the face.
            const L = idx + step;
            const s0 = padded[L - su] ? 1 : 0;
            const s1 = padded[L + su] ? 1 : 0;
            const t0 = padded[L - sv] ? 2 : 0;
            const t1 = padded[L + sv] ? 2 : 0;
            const ao0 = AO_LUT[s0 | t0 | (padded[L - su - sv] ? 4 : 0)] as number;
            const ao1 = AO_LUT[s1 | t0 | (padded[L + su - sv] ? 4 : 0)] as number;
            const ao2 = AO_LUT[s1 | t1 | (padded[L + su + sv] ? 4 : 0)] as number;
            const ao3 = AO_LUT[s0 | t1 | (padded[L - su + sv] ? 4 : 0)] as number;
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
            const smooth = SMOOTH[key & 255] === 1;
            let w = 1;
            while (!smooth && i + w < size && mask[j * size + i + w] === key) w++;
            let h = 1;
            grow: while (!smooth && j + h < size) {
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
              positions[o + d] = plane + (org[d] as number);
              positions[o + u] = (hiU ? i + w : i) + (org[u] as number);
              positions[o + v] = (hiV ? j + h : j) + (org[v] as number);
              normals[o + d] = sign * 127;
              snormals[o + d] = sign * 127;
              snormals[o + u] = 0;
              snormals[o + v] = 0;
              if (smooth) {
                lattice[d] = plane;
                lattice[u] = hiU ? i + w : i;
                lattice[v] = hiV ? j + h : j;
                const shift = cornerNormal(padded, lattice, snormals, o);
                if (shift !== 0) {
                  positions[o] = (positions[o] ?? 0) + ((snormals[o] ?? 0) / 127) * shift;
                  positions[o + 1] =
                    (positions[o + 1] ?? 0) + ((snormals[o + 1] ?? 0) / 127) * shift;
                  positions[o + 2] =
                    (positions[o + 2] ?? 0) + ((snormals[o + 2] ?? 0) / 127) * shift;
                }
              }
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
    snormals: snormals.slice(0, quads * 12),
    voxel: voxel.slice(0, quads * 8),
    indices,
    quads,
  };
}

/**
 * Normal of the occupancy field at a lattice corner (local voxel coords), from
 * the 8 voxels around it (as marching cubes does), written as Int8 ×3. Returns
 * how far to relax the corner along that normal (voxels): (solid fraction − ½) ×
 * RELAX, or 0 if any of the 8 voxels is a non-smooth solid (seams with matte
 * neighbours must stay on the lattice, or cracks would open).
 */
function cornerNormal(padded: Uint8Array, l: readonly number[], out: Int8Array, o: number): number {
  let gx = 0;
  let gy = 0;
  let gz = 0;
  let solid = 0;
  let pinned = false;
  let gloss = false;
  const x0 = l[0] ?? 0;
  const y0 = l[1] ?? 0;
  const z0 = l[2] ?? 0;
  // Relaxation and pinning use the 8 voxels touching the corner.
  for (let c = 0; c < 8; c++) {
    const pal =
      padded[paddedIndex(x0 - 1 + (c & 1), y0 - 1 + ((c >> 1) & 1), z0 - 1 + ((c >> 2) & 1))] ?? 0;
    if (pal === 0) continue;
    solid++;
    if (SMOOTH[pal] !== 1) pinned = true;
    if (GLOSS[pal] === 1) gloss = true;
  }
  // The normal uses a wider tent-weighted window, so shading flows smoothly
  // across voxel steps instead of faceting at every edge: 4×4×4, or 6×6×6
  // (BORDER = 3) at glossy corners, whose tight highlight shows any terrace.
  const r = gloss ? 3 : 2;
  for (let oz = -r; oz < r; oz++)
    for (let oy = -r; oy < r; oy++)
      for (let ox = -r; ox < r; ox++) {
        if ((padded[paddedIndex(x0 + ox, y0 + oy, z0 + oz)] ?? 0) === 0) continue;
        const cx = ox + 0.5;
        const cy = oy + 0.5;
        const cz = oz + 0.5;
        const w = (r - Math.abs(cx)) * (r - Math.abs(cy)) * (r - Math.abs(cz));
        gx += cx * w;
        gy += cy * w;
        gz += cz * w;
      }
  // Solid → empty points outward: the normal is minus the occupancy gradient.
  // A degenerate corner (no gradient) keeps the face normal already written.
  const len = Math.hypot(gx, gy, gz);
  if (len === 0) return 0;
  out[o] = Math.round((-gx / len) * 127);
  out[o + 1] = Math.round((-gy / len) * 127);
  out[o + 2] = Math.round((-gz / len) * 127);
  return pinned ? 0 : (solid / 8 - 0.5) * RELAX;
}

/** Concatenates several meshes into one (e.g. all chunks of a small prop). */
export function mergeMeshData(parts: readonly MeshData[]): MeshData {
  const quads = parts.reduce((n, p) => n + p.quads, 0);
  const positions = new Float32Array(quads * 12);
  const normals = new Int8Array(quads * 12);
  const snormals = new Int8Array(quads * 12);
  const voxel = new Uint8Array(quads * 8);
  const indices = quads * 4 > 65535 ? new Uint32Array(quads * 6) : new Uint16Array(quads * 6);
  let q = 0;
  for (const p of parts) {
    positions.set(p.positions, q * 12);
    normals.set(p.normals, q * 12);
    snormals.set(p.snormals, q * 12);
    voxel.set(p.voxel, q * 8);
    for (let k = 0; k < p.indices.length; k++) indices[q * 6 + k] = (p.indices[k] ?? 0) + q * 4;
    q += p.quads;
  }
  return { positions, normals, snormals, voxel, indices, quads };
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
