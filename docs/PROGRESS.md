# Progress

## Handoff → M2 (Beauty slice / look-dev ★)

**What was built (M1):** the voxel engine core. A sparse chunked grid, greedy
meshing with per-vertex AO in Web Workers, per-voxel color jitter computed in the
shader, material flags, remeshing on edit, SDF/sphere carving, a minimal SDF
modeling toolkit with a donut and grass-tuft model, instanced props, and the
`m1-terrain` stress scene with an in-browser carve/remesh benchmark.

**Key files and APIs**
- `src/engine/voxel/VoxelGrid.ts`: `VoxelGrid` (32³ Uint8 chunks, 0 = empty). `get/set`, `fill` and `generate(x0,y0,z0,x1,y1,z1, fn)` (half-open box, written chunk by chunk; use it for world gen, it is far faster than `set`). Writes mark chunks dirty, **including neighbours** when a voxel is on a border (faces and AO change next door). `takeDirty()`, `markDirty()`, `padded(cx,cy,cz)` → PAD³ (34³) array with a 1-voxel neighbour border (the mesher's input), `paddedIndex`, `chunkKey`.
- `src/engine/voxel/mesh.ts`: `meshChunk(padded, origin)` → `MeshData` (positions in voxel units incl. chunk origin, Int8 normals, `voxel` Uint8×2 = palette index + packed byte [AO 0–3 | max-u corner bit 2 | max-v corner bit 3], Uint16/32 indices). Merges only faces with equal palette index **and** equal 4-corner AO. Quad flip on the AO diagonal. `meshGrid(grid)` meshes a small grid on the main thread (props). `mergeMeshData`.
- `src/engine/voxel/Mesher.worker.ts` + `MesherPool.ts`: worker pool (min(4, cores−1)), transferable buffers, JIT warm-up on start, inline fallback where `Worker` is missing (Vitest).
- `src/engine/voxel/VoxelObject.ts`: `VoxelObject extends Group` (one Mesh per chunk, scaled by voxel size). `await obj.update()` remeshes dirty chunks and returns `RemeshStats` (worker ms, wall ms, quads, coords). Stale results are dropped by a per-chunk version.
- `src/engine/voxel/Carve.ts`: `carveSdf(grid, sdf, min, max)`, `carveSphere(grid, cx,cy,cz, r)` → `RemovedVoxel[]` ({x,y,z,index}: feed these to M5's crumb particles), `restore(grid, removed)`.
- `src/engine/voxel/PropInstances.ts`: `createPropInstances(model, voxelSize, pivot, material, placements)` → one `InstancedMesh` per model. The pivot must be whole voxels (the shader derives voxel cells from positions).
- `src/engine/voxel/geometry.ts`: `buildGeometry(MeshData)` → `BufferGeometry` (attributes `position`, `normal`, `voxel`).
- `src/engine/render/Materials.ts`: `createVoxelMaterial(params?, tuning?)`: a `MeshStandardMaterial` patched via `onBeforeCompile`. Palette colors arrive as uniforms (`uPalette`, sRGB + jitter amplitude; `uVoxelMat`, roughness / emissive / rim), never textures. **The per-voxel jitter is an exact GLSL port of `hash3` + `jitteredLinear`**, evaluated per fragment from `floor(position − normal/2)`, so greedy quads stay big. Baked AO multiplies albedo (`aoStrength`). `DEFAULT_TUNING` holds every look knob (gloss/matte roughness, emissive pop, translucent fresnel rim, AO strength, crack epsilon). **M2 look-dev should start here.**
- `src/art/sdf.ts`: `sphere`, `box` (rounded), `torus`, `translate`, `union`, `subtract`, `intersect`, `smoothUnion`, `valueNoise3`, `fbm3`, `voxelize(grid, sdf, min, max, paint)`.
- `src/art/models/donut.ts` (`buildDonut('strawberry'|'chocolate'|'glazed', seed)`, 22×12×22 at 1/32 m: drips, pale dough band, 1×1×3 sprinkles) and `grassTuft.ts` (`buildGrassTuft(seed, flower)`). First drafts; M3 owns the real library.
- `src/debug/scenes/m1Terrain.ts`: `m1-terrain` / `m1-low-tier`. A 256×64×256 floating plateau at 1/8 m (meadow, frosting rim with drips over dough-strata cliffs, two carved bites) plus 200 props at 1/32 m (60 donuts in 3 flavors, 140 tufts). Its `bench()` carves 3 bites and times the remesh.
- `ShotScene.bench?()` → exposed as `window.__SHOT__.bench()`; `npm run perf` records it in `perf.json` under `bench`.
- `src/debug/scenes/testCube.ts` now uses the real mesher (the M0 InstancedMesh stopgap is gone).

**Decisions**
- **Jitter in the shader, not baked.** Baking per-voxel color would stop the greedy mesher merging anything. The GLSL hash matches the TS `hash3` bit for bit (uint math wraps like `Math.imul`), so CPU-side tools can predict a voxel's color.
- **T-junction cracks are closed in the vertex shader.** Greedy meshes have T-junctions. A magenta-vs-green background diff test showed about 300 sub-pixel cracks per 1080p frame (single MSAA samples showing the sky through convex edges). Each vertex carries its quad-corner bits, and the material pushes every quad outward in its plane by `crackEps × view depth` (≈ 0.1 px). After the fix the diff test found zero background pixels inside the terrain, apart from the deliberate carved opening. If you write another voxel shader, keep this.
- All voxels are opaque to the mesher (faces between two solid voxels are culled). Translucent milk/jelly will need its own pass (M2 lagoon, M6). Plan: mesh water as a separate grid/material, or add a "transparent" flag check to the face test.
- Props are instanced shared models. Bitten donuts (M5) should become their own small `VoxelObject` when first bitten (copy the model grid), so carving one doesn't change them all.

**Gotchas**
- **Headless WebGL: SwiftShader** again (no `/dev/dri`). GPU flags report SwiftShader, so the harness falls back to `--use-angle=swiftshader --enable-unsafe-swiftshader`. M1 shots take about 35 s, perf about 1.5 min.
- **The container has only 4 cores**, shared by 3 mesher workers, the main thread and SwiftShader's raster threads. Worker timings are wall-clock inside the worker, so preemption shows up as occasional 10–35 ms outliers (especially on the cold initial build). The serial remesh median (1.4–2.7 ms) and the Node benchmark (1.3 ms) are the meaningful numbers.
- `VoxelGrid.padded()` and `MesherPool.mesh()` take `Uint8Array<ArrayBuffer>` (TS 6 typed-array generics). Buffers are transferred to workers, so don't reuse a buffer after `mesh()`. Use `pool.buffer()`.
- The camera in `m1-terrain` looks down at the island, so the sky dome shows only its horizon colour (the beige background). M2 should frame some sky.
- Bundle is 880 kB (+2 kB worker). Unchanged concern for M9/M10.

**Open follow-ups**
- **Real-GPU fps is unverified** (see the perf table). The user should run `npm run perf -- --gate M1` on a machine with a GPU to confirm 60 fps high / 30 fps low. Draw calls (246 high / 224 low) and triangles (568k incl. the shadow pass) are modest, so no problem is expected.
- Terrain LOD (`Lod.ts`, 1/4 m and 1/2 m rings) is not built. It's needed by M6 (full ring sector), not M2's 30×30 m patch.
- Wrap lighting for dough (art bible §5 "subsurface feel") and a proper gloss response (env map) belong to the M2 material pass in `Materials.ts`.
- The donut and tuft models are drafts. M2 will likely upgrade them in place; M3 owns the library and gallery.
- The terrain's hill terraces read as stair steps from far away. M2 should use gentler slopes, and frosting swells or drips on slopes (RF-05).

**First 3 steps for M2**
1. Build `?shot=m2-*` scenes (`m2-hero`, `m2-ground`, `m2-closeup-donut`, `m2-lagoon-edge`, `m2-low-tier`), add them to `scripts/gates.json`, and frame `m2-hero` like `art/reference/01_environment_hero.jpg` (3/4 high angle, golden key from the upper right).
2. Author the diorama patch in code with `sdf.ts` + `VoxelGrid.generate`: frosting hills dripping over a dough cliff (K-02, RF-05), a sprinkle-ball tree (RF-06), Granny's bakery with an icon sign (RF-08), 6 donuts, a milk lagoon strip (RF-02, RF-07, needs a water material), and finer-voxel clouds (RF-03), with micro-voxel grass (RF-04).
3. Look-dev pass in `Materials.ts`, `Renderer.ts` and the scene lights: wrap lighting on dough, glossy frosting spec (add a small pastel env map), emissive sprinkle pop, AO balance (baked vs N8AO), VSM bias check, and the color grade. Then run the double-reviewer gate (AGENTIC_LOOP §7, two Agent calls in one message).

---

## M2 gate log (in progress)

| iter | reviewer 1 | reviewer 2 | verdict |
|---|---|---|---|
| 1 | 5.2 | 5.3 | FAIL |
| 2 | 5.8 | 6.1 | FAIL |
| 3 | 6.0 | 6.2 | FAIL |
| 4 | 6.1 | 6.2 | FAIL |
| 5 | 6.2 | 6.3 | FAIL |
| 6 | 6.5 | 6.5 | FAIL (0 blockers) |

**Plateau (AGENTIC_LOOP §5), before iter 4.** The gate mean rose by only about 0.15 from iter 2 to iter 3
after a 0.7 jump, and both reviewers name the same residual: terraced icing on donuts
and slopes, contour-banded sugar hill and clouds, and seams where the near-field terrain
patches meet the fine skin. More parameter tweaks will not fix these, so iter 4 makes a
structural change to the mesher: **surface relaxation for smooth materials.** Faces of
gloss / lit / smooth palette entries are emitted unmerged. Each lattice corner whose
eight surrounding voxels are all empty or smooth is moved along its occupancy-gradient
normal by (0.5 − solid fraction) voxels. This is a surface-nets-style relaxation that
turns 1-voxel stair steps into sloped facets while keeping per-voxel colour and voxel
silhouettes. Corners touching matte voxels stay on the lattice, so seams with dough,
wood and grass stay closed. The same iteration re-authors the near-field patch boundary:
macro heights snap to the fine skin's quantized top across a feather band, so there is
no step where the patches meet.

**Plateau again, before iter 5.** Relaxation alone did not move the mean (6.0/6.2 → 6.1/6.2).
Both reviewers trace the remaining technical blockers (pinholes, facet crosshatch and
spec scribbles, path contour lines) to how the geometry is sampled and shaded, not to art
values. Iter 5 makes three structural changes:
(1) **Drop MSAA on high.** A diagnostic render (`scripts/diag.mjs`, `?noao`, `?nomsaa`)
proved the black pinholes come from MSAA resolving sub-samples into sub-pixel seams
(N8AO off: still there; MSAA off: 0). SMAA does the anti-aliasing.
(2) **Wide-window normals.** The mesher padding grows to 2 voxels, and smooth normals use
a tent-weighted 4×4×4 occupancy gradient instead of the 2×2×2 corner, so relaxed icing
shades as a continuous surface without facet lattices or glints.
(3) **Material re-authoring.** The path has a smooth dirt sub-layer, so relaxation is not
pinned at its steps. Drips are tapered drops with beads. Roofs use matte shingles, and the
bakery is solid. The key is less saturated, so strawberry frosting stays pink instead of coral.

**Plateau a third time, before iter 6.** Iter 5 fixed what it set out to fix: the pinholes are gone
and so are the milk clipping and the path contour lines. The mean still rose only 0.1 (6.2/6.3). Both
reviewers now point at the same residuals, and each one needed a diagnosis, not a parameter change:
(1) **Candy hue hold.** The frosting is coral or mauve because warm key, lavender fill, warm
bounce and the orange wrap tint all multiply into a hue-shifted albedo. A new `MAT.candy` flag
keeps the diffuse light's brightness but swaps in the albedo's own hue (75 %), so strawberry stays
strawberry in every shot. The single broad glaze lobe becomes a tight sun streak plus a soft
clearcoat with a Fresnel lift.
(2) **The pit is geometry, not AO.** A height probe found a 0.2 m hollow near the sugar apex: mound
noise was added to the falloff distance. It now scales the distance, so the dome rises
monotonically. The syrup channel follows the meadow's roll, which made a tilted, faceted sheet,
so it now sits at a flat liquid level.
(3) **Relaxation as an authoring tool.** Grass blades and the lighthouse stripes get smooth
palette twins (`blade*`, `tower*`). The relaxation pinches 1-voxel blade columns into pointed blades
and smooths the tapering tower's stair steps, which printed AO veins.
(4) **Milk and framing.** The milk has a lower albedo, a stronger mirror term and a 9-tap soft
shadow. Frames wider than 16:9 keep the 16:9 horizontal coverage, so props no longer get cut. The
lagoon-edge camera is yawed to keep the bakery out of frame. Floaters use close-up density, the
ground DoF is gentle, and the bakery roof sags.

## Status

| Milestone | Status | Gate | Notes |
|---|---|---|---|
| M0 Scaffold and screenshot harness | **DONE** | none | `npm run shots -- --gate M0` produces lit test-cube PNGs (`shots/M0/final/`) |
| M1 Voxel engine core | **DONE** | perf budget | remesh 1.4–2.7 ms/chunk (median, in-browser); real-GPU fps unverified (no GPU here) |
| M2 Beauty slice ★ | next | double reviewer | user check-in after |
| M3–M10 | — | | |

## M0 — Scaffold and screenshot harness (DONE)

- Exit criterion met: `npm run shots -- --gate M0` produced `m0-test-cube` and `m0-low-tier` at 1920×1080 and 844×390, plus the 3-frame `m0-test-cube_strip.png`. All are in `shots/M0/final/` with `harness.json` and `perf.json`.
- No graphics gate and no reviewer at M0 (PLAN §3). No RF items are tagged M0.
- **WebGL path:** SwiftShader (GPU flags fall back automatically; see Handoff).
- Perf probe (SwiftShader, so relative only): high 32 draw calls / 281k tris; low 10 draw calls / 281k tris.
- `npm run lint && npm test && npm run build`: clean (12 tests).
- Kid-sense check (GAME_DESIGN §2, §11): M0 adds only a test scene of a frosted cube on a meadow. Nothing scary, text-heavy or punishing.

## M1 — Voxel engine core (DONE)

No graphics gate (PLAN §3). The exit criteria are the perf budget, below. No RF
items are tagged M1. Final shots and `perf.json` are in `shots/M1/final/`.

**Unit tests (35 total, all green):** grid get/set/fill and negative coordinates;
neighbour-aware dirty marking; padded borders; face counts (1 voxel → 6 quads;
a solid box → 6 quads); no merging across palette or AO changes; **exact face
coverage, with no holes or overlaps, on a blob spanning 8 chunks and on a random
sparse field across chunk borders**; integer vertex positions; CCW winding; AO
corner rule and floor-by-wall AO; corner flags; sphere carve removes exactly the
voxels inside it; **carve → restore round-trips byte-identical**; carve dirties
exactly the right chunks; remesh after a carve stays seamless; mesh time
< 8 ms/chunk.

**Perf budget** (`npm run perf -- --gate M1 --iter final --frames 10`, SwiftShader on a 4-core container):

| Metric | high (`m1-terrain`) | low (`m1-low-tier`) | Budget |
|---|---|---|---|
| Terrain | 256×64×256 @ 1/8 m, 1.18 M voxels, 104 chunks, 41.7k quads | same | — |
| Props | 200 @ 1/32 m (5 instanced draws) | same | 200 |
| Generate terrain (main thread) | 183 ms | 174–259 ms | — |
| Initial mesh, 104 chunks (3 workers, wall) | 433 ms; mean 5.5 ms/chunk | 325–348 ms; mean 4.4–4.8 | — |
| **Remesh after carve** (3 bites, 1706 voxels, 14 chunks), worker mean / max | 2.4 / 5.9 ms | 1.1–2.4 / 1.5–7.4 ms | **< 8 ms/chunk** |
| **Remesh, one chunk at a time** (wall, incl. round trip + upload), median / max | 2.2 / 4.1 ms | 1.6–1.7 / 3.3–13.1 ms | **< 8 ms/chunk** |
| Mesh one carved surface chunk (Node, warm, median) | 1.3 ms | — | < 8 ms |
| Draw calls / triangles (incl. shadow pass) | 246 / 568k | 224 / 568k | — |
| Frame time | 4.1 s (SwiftShader, meaningless) | 2.9 s (SwiftShader) | 60 / 30 fps |

- **Remesh budget: met.** Typical per-chunk remesh is 1–3 ms, 3–5× under budget. Occasional single-chunk maxima above 8 ms (one 13.1 ms in the final run, up to 17.5 ms in dev runs) are CPU preemption on this 4-core box while SwiftShader renders. They are not mesher cost (the same chunk meshes in about 1.3 ms in Node).
- **fps budget: unverified.** There is no GPU in this container, and SwiftShader frame times say nothing about real hardware. The machine-independent load is small: 224–246 draws and 568k triangles. Flagged for the user in the handoff.
- Before M1, the M0 test cube's InstancedMesh drew about 281k triangles for one cube and a small meadow. The greedy mesher now draws the whole 32 m plateau, 200 props and the shadow pass in 568k.
- Seams: the magenta/green background diff test (see Handoff → Decisions) finds 0 crack pixels inside the terrain after the crack-closing fix (it found about 300 before).
- `npm run lint && npm test && npm run build`: clean.
- **Kid-sense check** (GAME_DESIGN §2, §11): M1 adds engine code and a stress scene of a frosted meadow plateau with donuts and grass. The carve "bites" are gentle scoops. Nothing scary, text-based or punishing.
