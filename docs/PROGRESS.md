# Progress

## M3 in progress: resume here (gate iter 3 under review)

M3 is NOT done. Iteration 3 is committed and was sent to two reviewers. If this
thread stops, a new thread resumes at the iter 3 reports (`reviews/M3-iter3*.md`).
Do not restart the milestone.

- **Scores so far:**

  | iter | r1 | r2 | gate mean | blockers |
  |---|---|---|---|---|
  | 1 | 6.1 | 6.5 | 6.30 | 0 / 2 |
  | 2 | 6.55 | 7.0 | 6.78 | 0 / 0 |

  The gain from iter 1 to 2 is +0.48, so the §5 plateau rule is not triggered.
  If iter 3 also gains less than 0.3, iter 4 must be a structural change.
- **Iter 3 changes** (from both iter 2 fix lists):
  - Glazey:
    - The decal lands only where the body faces the front (normal z > 0.35)
      and above the foot crease, so there is no belly strap on the sides and no
      cream in the rear crease.
    - The eye domes stand at most 1 body voxel proud.
    - The belly patch is a smaller egg with a rounded top, inside the
      front-facing area.
    - The arms angle about 35° down instead of sticking out like fins.
    - The lineup spacing is now 1.4.
  - Bites:
    - `crumbFresh*` is a richer gold. Pockets measure R−G of 26–31, against
      r1's ≥ 25 target.
    - A warm studio AO tint (`PostSettings.aoColor`, `studioOcclusion`).
    - No crust specks.
    - Crumbs sit only on the cloth by each stand foot. The plate is now
      narrower than the donut, so there is no ledge for them.
  - Classic glaze: an even amber sheet (`#F1CB92`), thin and golden on the
    slopes. The line is raised so the dough band shows. No blotches, and it now
    separates from the backdrop.
  - Donut dough: relaxed `bun*` entries (grain jitter 0.06) with a clean pale
    band. The bark streaks are gone.
  - Stands are relaxed, smooth turned wood with sparse grain.
  - Studio:
    - A warmer key (`#FFE3C2`) and cooler fill on a whiter sweep.
    - Diagonal, irregular folds.
    - Grade 0.12 and vignette 0.32.
    - The donut camera is lower and tighter, with no dead lower third.
  - Blueberry: bigger petals and lumps, with lighter (not dark) fissures.
  - Props:
    - The crystals use `MAT.glow` and bloom.
    - The pink canopy is matte (`canopyPink*`).
    - The gingerbread rock is relaxed (`rockGinger*`).
    - The props wall is pushed back to -9.
  - Tried and reverted: a bloom threshold of 0.95. The cream backdrop bloomed
    into a milky haze.
- **Not done yet:** the pier, fence and pretzel-trunk chunkiness, embedded
  canopy sprinkles, jelly seated in a split, and squash/stretch motion. Motion is
  a turntable strip by gate definition. The belly wobble is M5.

- **Iter 2 changes:**
  - Blocker, lantern streaks: these were not shadow acne. They stayed with key
    shadows, AO and the lamp light all off. They were the voxel staircase of the
    matte lantern cylinders, where front and side faces alternate in shade. The
    drum, cap, rail and deck now use relaxed entries (`towerCream`, `towerRed`,
    `railMint`, `deckWood`, `lanternGlow`). Key shadow blur and normal bias now
    scale with the shadow texel size (`studio.ts`).
  - Blocker, Glazey fireflies: these were pinholes where the background showed
    through. The material's T-junction crack growth moved each face's copy of a
    shared relaxed corner along a different axis. Relaxed quads are never merged,
    so they now skip the growth (`Materials.ts`, `relaxed`). The firefly count
    went from 12–32 per frame to 0. This applies to every relaxed surface in the
    game.
  - Glazey's face is now a separate **1/128 m decal grid** (`GlazeyModel.face`,
    `GLAZEY_FACE_VOXEL`). It holds glossy dark-brown eye domes with white glints,
    an open smile with a tongue, two-tone blush, and a clean belly-patch ellipse
    below the mouth. The body opens a shallow socket under each feature. The tuft
    is five fine rounded capsules. The body stays at 1/32 m (RF-09).
  - Studio: a lighter, cooler cream sweep, deeper folds, a stronger key, a cool
    rim (`studioRim`), and an `opts.back` setting. The props wall is pushed back,
    so it no longer catches shadows. Stands are smaller, made of quieter
    `standWood`, with no speckle.
  - Donuts:
    - Powdered and jelly use hue-held, relaxed `donutSugar`, dusted on the top
      only, with sparkle grains.
    - The jelly bulge is bigger.
    - The classic glaze pools pale on the crown and goes thin and golden on the
      slopes.
    - The blueberry is relaxed (no `crisp`), with color-only fissures (no holes).
    - The rainbow bands are even, by angle around the tube.
    - No drips inside the hole.
    - The maple bar has longer drips and shows more of its dough band.
  - Gloss corners shade with a 6³ normal window, which removes the chocolate
    specular terraces. This needed `BORDER` = 3.
  - The bite crumb is relaxed and hue-held (`crumbFresh*`), with a shallower
    carve. Floor crumbs sit at the foot of each stand.
  - Props: the leaves are matte and relaxed (also visible in M2, where they read
    less like wet plastic). The rock candy has a soft emissive. The sugar caps on
    the gingerbread rock are whole drifts.
- **M2 regression check (builder):** I captured `m2-hero` and `m2-closeup-donut`
  to `shots/M2/m3i2-check/` and compared them with `final/`: the same island and
  lighting, with matte canopies and a smoother donut highlight. No quality drop.
- **Perf (first real-GPU numbers, Apple M4 via ANGLE Metal, headless):**
  - Low tier: 32–45 fps on every M2 shot, above the 30 fps floor.
  - High tier: 18–28 fps, below the 60 fps target. There is no earlier GPU
    baseline, so this is an open item, not a known regression.
- **Rendering path:** on this Mac the harness takes the **GPU** path (ANGLE Metal,
  Apple M4). A full M3 capture takes about 20 s, compared with about 5.5 min on
  SwiftShader in the cloud container.

## Handoff → M3 (Procedural asset library ★)

**M2 status: accepted by the user at iteration 8, gate NOT passed.** The ★ double
gate ran 7 reviewed iterations (best mean 6.5 / 6.5 against the 9.0 bar, 0
blockers since iter 6). At iteration 8, the escalation point under AGENTIC_LOOP §6,
the user chose to accept the slice as it stands and come back to it later. Iter 8
was captured with the gate harness (`shots/M2/final/`), but not reviewed. The bar
and rubric are unchanged; the open reviewer findings are listed under follow-ups.

**What was built (M2):** the Glaze Meadows beauty slice. A ring-shaped floating
donut island with frosting rims dripping over dough cliffs, a meadow with micro
grass and sprinkle flowers, a path, a sugar mountain, a syrup fall, a milk lagoon
with a pier, the lighthouse, Granny's bakery, sprinkle-ball trees, wild and
floating donuts, clouds, steam, and the five gate cameras.

**Key files and APIs**
- `src/game/world/islandShape.ts`: `IslandShape(layout)`, an analytic ring island. `column(x,z)` gives the zone (Meadow / Frosting / Path / Sugar / Rock / Syrup), the depth, the top and the inner and outer radii. `surface(x,z)`, `ringWave`, `outerWall` / `innerWall`, `dripDepth` / `dripBulb`. Mound noise *scales* the falloff (an offset carved pits).
- `src/game/world/IslandTerrain.ts`: three resolutions. COARSE 1/8 m body, FINE 1/32 m skin, MACRO 1/128 m near-field `DetailPatch` discs (membership by parent fine column, heights feathered to the fine skin's quantized top). It also holds the zone colors and the grass blades.
- `src/game/world/meadowLayout.ts` (spots, mounds, falls, the ground camera) and `MeadowDiorama.ts` (`buildMeadowDiorama(quality, {detail})`: lights, props, milk, clouds, `prerender` for reflections).
- `src/debug/scenes/m2Meadow.ts`: the gate cameras. Each `ShotPlan` has `detail` (`nearField()` macro patches), `fog`, `frame()` and a **`wide` policy** for frames wider than 16:9 (keep height / width / mean, plus yaw and pitch). The lagoon-edge camera was solved numerically so no prop is cut by an edge.
- `src/engine/voxel/mesh.ts`: smooth palette entries (`MAT.gloss | lit | smooth`) emit unmerged faces whose corners are **relaxed** (surface-nets style, `RELAX = 1.5`, pinned next to matte voxels). Normals come from a tent-weighted 4×4×4 occupancy window. `BORDER = 2` padding (`PAD = 36`). The AO lookup table keeps meshing at about 1.4 ms per chunk.
- `src/engine/render/Materials.ts`: wrap lighting (`MAT.soft`); a two-lobe glaze (tight sun streak plus clearcoat, Fresnel-lifted); **`MAT.candy` hue hold** (diffuse light keeps its value but takes the albedo's hue, so frosting and grass don't drift to coral or teal); smooth normals; glow and lit emissive. `DEFAULT_TUNING` holds every knob.
- `src/engine/render/Renderer.ts` + `ColorGrade.ts`: per-shot `PostSettings` (N8AO, DOF, tilt-shift, grade), `GamutEffect` → bloom → Neutral tone map → grade → SMAA. **MSAA is off on every tier** (it caused black pinholes).
- `src/engine/render/Water.ts` + `Reflection.ts`: the milk (ripples and rings, foam, meniscus, depth tint, syrup swirl, sky Fresnel, blurred planar reflection, a 9-tap soft shadow).
- Models in `src/art/models/`: `donut.ts` (meters-based, `DONUT_VOXEL` 1/64, `DONUT_HERO_VOXEL` 1/128, tapered and beaded drips), `sprinkleTree.ts`, `bakery.ts` (sagging roof), `lighthouse.ts`, `pier.ts`, `smallProps.ts`, `grassTuft.ts`.
- Palette additions: blades, the tower stripes, the syrup pool, the gingerbread crag, and the `MAT.candy` / `MAT.smooth` flags.

**Decisions**
- Relaxation is an authoring tool: give an entry a `MAT.smooth` twin to pinch 1-voxel columns into blades, or to smooth tapering cylinders (the lighthouse). Keep crisp entries (shingles, crags, the syrup pool) unrelaxed.
- Frosting colors stay exactly the art-bible hexes. The hue hold does the color fidelity, not palette edits.

**Gotchas**
- **Headless WebGL is SwiftShader** (GPU flags fall back). A full M2 capture takes about 7.5 min. `scripts/diag.mjs <id> <out.png> [noao] [nomsaa]` renders one shot (`DIAG_SIZE=844x390` for mobile). `scripts/harness.mjs` builds per PID, so two reviewers can capture at once.
- An isolated grey spot on a smooth dome is more likely a geometric hollow than AO. Probe heights (`shape.surface`) first.
- `tests/meshPerf.test.ts` (8 ms budget) is CPU-bound. It had started failing after the 2-voxel padding; the AO lookup and incremental indexing fixed it (1.4 ms).

**Open follow-ups (reviewer findings not fixed at acceptance)**
- Hero milk is still the brightest mass from above (luma about 165–180 against a target of ≤ 150). The low-tier milk is flat.
- In the ground shot, sprinkles stay crisp over DOF-blurred surfaces, a sunlit gap reads as a line across the path, there is a trench in the right frosting field, and the frosting reads mauve in shade.
- The lagoon-wall drips are flush and the dough looks like wood grain. The bakery is still basically a box (the awning and shingles are only lightly improved).
- The sugar cap is a smooth dome (now with drifts and sprinkles); the syrup fall is small.
- No category reached 8 in any reviewed iteration. The best per-shot scores are in `reviews/M2-iter6*.md` and `reviews/M2-iter7*.md`.
- Real-GPU fps is still unverified (see M1).

**First 3 steps for M3**
1. Read PLAN M3 and RF-09–RF-16. Build the asset gallery scene (`?shot=m3-*`) with a studio turntable look (K-06), reusing `Renderer` post settings and the voxel material.
2. Promote `donut.ts` to the full flavor library (blueberry `#7C8CE0` family, chocolate drips without artifacts, the rainbow mega donut as the one neon item) and model Glazey at character-sheet density (about 32 voxels tall, coral from every angle, belly stages 0–5).
3. Consider re-authoring the M2 follow-ups that M3 touches anyway: the drip and dough modelling, the bakery form and the milk value. Then run the M3 gate per AGENTIC_LOOP.

---

## Handoff → M2 (Beauty slice / look-dev ★) (archived)

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

## M2 — Beauty slice ★ (DONE: accepted by user at iteration 8)

### Gate score table (gate mean per reviewer)

| iter | reviewer 1 | reviewer 2 | verdict |
|---|---|---|---|
| 1 | 5.2 | 5.3 | FAIL |
| 2 | 5.8 | 6.1 | FAIL |
| 3 | 6.0 | 6.2 | FAIL |
| 4 | 6.1 | 6.2 | FAIL |
| 5 | 6.2 | 6.3 | FAIL |
| 6 | 6.5 | 6.5 | FAIL (0 blockers) |
| 7 | 6.5 | 6.5 | FAIL (0 blockers) |
| 8 | not reviewed | not reviewed | **accepted by the user** (escalation point, §6) |

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

**Iter 7 → 8.** Iter 7 was structural on the donut drips (tapered tongues with beads), the
clearcoat, the candy hue hold for grass, the craggy gingerbread skirt and a per-plan phone-frame
policy. The reviewers held it at 6.5 / 6.5. Iter 8, the last before escalation, re-authored:
- the sugar cap (sprinkle dots and larger drifts)
- the meadow value (mostly light mint)
- the pink canopy (fine grain instead of blotches)
- the milk reflection (weak from above, so there is no grey gable wedge)
- the shingle courses and the awning

It also placed the near floater by bearing so the 844×390 frames stay clean. The user then
accepted M2 without a further review, so iteration 8 is unscored.

**Final shots:** `shots/M2/final/`, captured with the gate harness at iteration 8 and not hand-picked.
**RF proof shots:**
- RF-01: `m2-hero`, the full ring.
- RF-02, RF-07: `m2-hero` and `m2-lagoon-edge`, the milk lagoon with ripples, foam, reflections and depth tint.
- RF-03: `m2-hero`, the fine-voxel clouds.
- RF-04: `m2-closeup-donut` and `m2-ground`, micro grass blades and sprinkle flowers.
- RF-05: `m2-hero`, frosting with relief, drips and swells.
- RF-06: every shot, the sprinkle-ball trees.
- RF-08: `m2-ground` and `m2-lagoon-edge`, the bakery donut emblem, with no text.
**WebGL path:** SwiftShader (GPU flags fall back).
**Checks:** `npm run lint && npm test && npm run build` clean (39 tests).
**Kid-sense check** (GAME_DESIGN §2, §11): a cheerful candy island at golden hour, with no text, no
threat and nothing scary.

## Status

| Milestone | Status | Gate | Notes |
|---|---|---|---|
| M0 Scaffold and screenshot harness | **DONE** | none | `npm run shots -- --gate M0` produces lit test-cube PNGs (`shots/M0/final/`) |
| M1 Voxel engine core | **DONE** | perf budget | remesh 1.4–2.7 ms/chunk (median, in-browser); real-GPU fps unverified (no GPU here) |
| M2 Beauty slice ★ | **DONE (accepted by user, gate not passed)** | double reviewer | best reviewed mean 6.5 / 6.5 (bar 9.0); accepted at iter 8; final shots in `shots/M2/final/` |
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
