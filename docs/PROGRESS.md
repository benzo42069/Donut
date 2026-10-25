# Progress

## Handoff → M1 (Voxel engine core)

**What was built (M0):** a Vite + strict TypeScript + three.js app, with lint
(eslint + prettier), Vitest, and a Playwright screenshot harness that renders
deterministic `?shot=<id>` scenes through the full post stack.

**Key files and APIs**
- `src/art/palette.ts`: THE palette. `VOXEL_PALETTE` (hex, `MAT` flags, jitter amplitude), `PALETTE_INDEX` (Uint8, 0 = empty), `paletteEntryAt(i)`, `jitteredLinear(i, x, y, z)` (deterministic per-voxel value/hue jitter → linear RGB), `hash3`. `LIGHT_PALETTE` holds sun, sky, fog and bounce colors. eslint forbids hex literals in `src/` outside this file.
- `src/engine/quality.ts`: `QualityTier` (`low|medium|high`), the `QUALITY` settings table (pixel ratio, shadow map size, SSAO, bloom, SMAA, MSAA) and `detectTier()`. `?quality=` overrides the tier.
- `src/engine/render/Renderer.ts`: WebGL2 renderer with VSM soft shadows and a pmndrs `postprocessing` chain: RenderPass → N8AO (`N8AOPostPass`, not on `low`) → Bloom → AgX tone mapping → `ColorGradeEffect` (warm highlights, cool shadows, vignette) → SMAA. `setScene()`, `setSize()`, `render()`, `finish()` (GPU sync), `ao` (for tuning), `info()`.
- `src/engine/render/Sky.ts`: dithered pastel gradient dome with sun glow.
- `src/debug/shots.ts`: the `SHOTS` registry (`ShotDefinition`: `build(aspect)`, optional forced `tier`, still `time`). `src/debug/shotTypes.ts`: `ShotScene` (`scene`, `camera`, `update(t)`, `stripTimes`).
- `src/main.ts`: boot. In shot mode the clock is frozen; it sets `window.__SHOT_READY__` once the frame is really drawn, and exposes `window.__SHOT__` = `{ id, tier, gpu, setTime(t), stripTimes, perf(frames) }`. Errors go to `window.__SHOT_ERROR__`.
- `scripts/gates.json`: gate → `shots` and `strips` lists. **Add each gate's shot IDs here** (a test checks that every ID exists in `SHOTS`, and that `*-low-tier` IDs force `tier: 'low'`).
- `scripts/shots.mjs`: `npm run shots -- --gate <G> [--iter N] [--only a,b] [--renderer auto|gpu|swiftshader] [--dev]`. Builds, serves with `vite preview`, captures 1920×1080 and 844×390 for every shot, plus a 3-frame strip (frames and a stitched `<id>_strip.png`), into `shots/<G>/<N>/`. It writes `harness.json` (WebGL path, GPU, flags, timings, console errors) and exits non-zero if any shot fails.
- `scripts/perf.mjs`: `npm run perf -- --gate <G> [--frames 30]` → `shots/<G>/<N>/perf.json` (ms/frame, draw calls, triangles) on the shot's tier and on `low`.
- `scripts/harness.mjs`: shared browser launch, server and openShot code.
- `src/debug/scenes/testCube.ts`: the M0 lit test scene (a 1/32 m frosted dough cube with sprinkles on a 1/8 m meadow). It uses an `InstancedMesh` of boxes as a **stopgap** until M1's mesher.

**Decisions**
- Pinned exact versions: three 0.186.1, postprocessing 6.39.5 (requires three < 0.187), n8ao 2.0.1 (no types; see `src/types/n8ao.d.ts`), rapier3d-compat 0.21.0, howler 2.2.4, vite 8.3.5, vitest 5.0.5, **TypeScript 6.0.3** (TS 7 is out, but typescript-eslint 8.72 supports only < 6.1), eslint 10.13, and **playwright 1.63.0**, which must match the pre-installed `/opt/pw-browsers/chromium-1243`. Do not bump it.
- Shadows use `VSMShadowMap` for now (art bible: PCSS or VSM). Revisit in M2 if VSM light-bleeding shows.
- `THREE.Clock` is deprecated in r183+. Use `Timer` (done in `main.ts`).
- Renderer tone mapping is `NoToneMapping`; the post chain does AgX. Custom `ShaderMaterial`s should still `#include <tonemapping_fragment>` and `<colorspace_fragment>` (they are no-ops into the HalfFloat target).

**Gotchas**
- **Headless WebGL path: SwiftShader.** The container has no GPU (`/dev/dri` is missing). With the GPU flags (`--enable-gpu --ignore-gpu-blocklist --use-angle=default`), Chromium still reports `ANGLE (Vulkan, SwiftShader)`, so the harness falls back to `--use-angle=swiftshader --enable-unsafe-swiftshader`. It works: WebGL2, N8AO, MSAA and VSM all render correctly.
- SwiftShader is slow: about 8 s per high-tier 1080p frame, about 4 s on low. A full M0 run takes about 2 min. rAF fires *before* SwiftShader finishes the frame, so readiness must sync the GPU (`Renderer.finish()`, a 1-px `readPixels`). Without it, screenshots time out. The resulting "GPU stall due to ReadPixels" warning is filtered as noise.
- **Perf numbers under SwiftShader are meaningless as fps.** For the M1 perf budget (60 fps high / 30 fps low), measure what is machine-independent here: meshing ms per chunk in workers (CPU, which *is* valid), draw calls and triangles. Record that real-GPU fps is unverified in this container. Do not claim the fps budget is met without a GPU. If the budget can only be verified on a GPU, flag it in this file for the user rather than inventing numbers.
- The test cube's `InstancedMesh` draws every box face (about 280k triangles). That is the baseline the M1 greedy mesher should crush.

**Open follow-ups**
- Replace the InstancedMesh stopgap with the M1 chunk mesher (per-vertex AO plus jitter). Re-point `testCube.ts` at it.
- `Materials.ts` (gloss/emissive/translucent flags → shader) is not built yet. The flags exist in the palette.
- The bundle is 863 kB (three + postprocessing). Code-split later (M9/M10).

**First 3 steps for M1**
1. `src/engine/voxel/VoxelGrid.ts`: sparse map of 32³ chunks of Uint8 palette indices with get/set/fill and dirty tracking. Unit-test it.
2. `src/engine/voxel/mesh.ts` (pure function, unit-tested) + `Mesher.worker.ts`: greedy meshing that merges only faces with identical color *and* AO, with per-vertex AO (4-corner rule plus quad flip), per-voxel `jitteredLinear` colors (merging must respect jitter: either mesh per-voxel-colored quads, or merge and carry jitter via a tiny 3D hash in the shader), and material flags as a vertex attribute. Tests: face counts on known shapes, no seams across chunk borders.
3. `Carve.ts` (sphere/SDF carve → removed voxel list → dirty chunks → remesh), then a `?shot=m1-terrain` stress scene (256×64×256 at 1/8 m plus 200 props at 1/32 m) and a `perf` run, logging meshing ms per chunk here.

---

## Status

| Milestone | Status | Gate | Notes |
|---|---|---|---|
| M0 Scaffold and screenshot harness | **DONE** | none | `npm run shots -- --gate M0` produces lit test-cube PNGs (`shots/M0/final/`) |
| M1 Voxel engine core | next | perf budget | |
| M2 Beauty slice ★ | — | double reviewer | user check-in after |
| M3–M10 | — | | |

## M0 — Scaffold and screenshot harness (DONE)

- Exit criterion met: `npm run shots -- --gate M0` produced `m0-test-cube` and `m0-low-tier` at 1920×1080 and 844×390, plus the 3-frame `m0-test-cube_strip.png`. All are in `shots/M0/final/` with `harness.json` and `perf.json`.
- No graphics gate and no reviewer at M0 (PLAN §3). No RF items are tagged M0.
- **WebGL path:** SwiftShader (GPU flags fall back automatically; see Handoff).
- Perf probe (SwiftShader, so relative only): high 32 draw calls / 281k tris; low 10 draw calls / 281k tris.
- `npm run lint && npm test && npm run build`: clean (12 tests).
- Kid-sense check (GAME_DESIGN §2, §11): M0 adds only a test scene of a frosted cube on a meadow. Nothing scary, text-heavy or punishing.
