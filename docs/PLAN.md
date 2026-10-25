# Build Plan

The execution plan for a fresh Claude Code session, started with
`prompts/KICKOFF_PROMPT.md`. Every visual milestone ends with a **graphics gate**
(`docs/AGENTIC_LOOP.md`). Work on a milestone is not done until its gate passes.

## 1. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Platform | Web (desktop, tablet, Chromebook). PWA install later | zero install for families; screenshots are easy to automate |
| Language/build | TypeScript (strict) + Vite | fast iteration |
| Rendering | three.js (WebGL2), `postprocessing` (pmndrs), `n8ao` | mature; good AO and post stack |
| Physics/character | `@dimforge/rapier3d-compat` | kinematic character controller, crumb particles |
| Audio | WebAudio via `howler` | simple, mobile-safe unlock |
| Voxel meshing | custom: chunked greedy meshing with per-vertex AO, in Web Workers | the core of the look |
| Asset authoring | **procedural voxel modeling in code** (SDF → voxels) plus optional `.vox` import | Claude can author and iterate assets in code without external tools |
| Tests | Vitest (logic), Playwright (screenshots/e2e) | Playwright + Chromium are already in the cloud container |

Pin exact dependency versions in `package.json`.

## 2. Architecture sketch

```
src/
  main.ts                 boot, quality tier detection
  engine/
    voxel/
      VoxelGrid.ts        sparse chunked grid (32³ chunks), palette indices (Uint8)
      Mesher.worker.ts    greedy mesh + AO + per-voxel color jitter → BufferGeometry data
      Carve.ts            bite/sphere/SDF carving, emits removed voxels as particles
      Lod.ts              terrain LOD rings (1/8 → 1/4 → 1/2 m)
    render/
      Renderer.ts         three.js setup, tone mapping, color grade
      Post.ts             N8AO, bloom, SMAA/TAA, optional tilt-shift
      Materials.ts        voxel material: vertex color + material flags (gloss/emissive/translucent)
      Sky.ts  Water.ts  Fog.ts
    physics/  audio/  input/
  art/
    palette.ts            THE palette (art bible §4)
    sdf.ts                SDF primitives + boolean ops + noise
    models/               donut.ts, glazey.ts, trees.ts, bakery.ts, … (code-authored voxel models)
  game/
    player/  donuts/  powers/  npc/  quests/  minigames/  world/
  ui/
  debug/
    shots.ts              ?shot=<id> deterministic scenes for the screenshot harness
scripts/
  shots.mjs               Playwright capture → shots/<gate>/<iter>/*.png
reviews/                  graphics reviewer reports (committed)
art/reference/            reference images from the user
```

**Determinism for screenshots:** `?shot=<id>` loads a fixed scene, a fixed
seed, a fixed time of day and a frozen clock (or exact frame N). It sets
`window.__SHOT_READY__ = true` once meshing, shaders and AO have settled.

## 3. Milestones

Each one lists its deliverables, its **gate shots** (IDs for the screenshot
harness) and its exit criteria. If a milestone has a gate, the graphics gate
must pass.

### M0 — Scaffold and screenshot harness (no gate)
* Vite + TS + three app, lint (eslint + prettier), Vitest, `npm run dev|build|test|shots`.
* `scripts/shots.mjs`: launch Chromium (try the GPU first; fall back to
  `--use-angle=swiftshader --enable-unsafe-swiftshader`), visit each
  `?shot=` ID at **1920×1080** and **844×390** (phone landscape), wait for
  `__SHOT_READY__`, and save PNGs. Also capture an optional 3-frame motion strip.
* Quality tiers: `low | medium | high`. Shots always use `high`, plus one
  `low` shot per gate to keep low-end devices looking acceptable.
* **Exit:** `npm run shots -- --gate M0` produces a PNG of a lit test cube scene.

### M1 — Voxel engine core (no gate, but perf budget)
* Sparse chunked grid, greedy meshing in workers, per-vertex AO, per-voxel
  color jitter, material flags, chunk remeshing on edit, `Carve.ts`.
* Unit tests: meshing correctness (face counts, no T-junction seams), carve
  round-trips.
* **Exit:** a 256×64×256 test terrain at 1/8 m plus 200 props at 1/32 m runs at
  60 fps on `high` and 30+ fps on `low` (headless timing harness). A remesh
  after a carve finishes in < 8 ms per chunk.

### M2 — Beauty slice / look-dev ★ (GATE: strict, double reviewer)
**This milestone sets the visual bar for the whole game.** Build one diorama
patch of Glaze Meadows, about 30×30 m: frosting hills dripping over a dough
cliff, a sprinkle tree, Granny's bakery, 6 donuts in the grass, a strip of the
milk lagoon, sky and clouds. There is no gameplay yet. All the lighting and
post work happens here.
* Gate shots: `m2-hero` (3/4 high angle, matches reference composition),
  `m2-ground` (low camera at donut height), `m2-closeup-donut`,
  `m2-lagoon-edge`, `m2-low-tier`.
* **Exit:** graphics gate passes with **two independent reviewers**, and the
  user is shown the shots before moving on (a check-in point).

### M3 — Procedural asset library ★ (GATE)
* `sdf.ts` modeling toolkit and an **asset gallery page** (`?shot=gallery-*`)
  with turntable lighting.
* Models: all 9 donut flavors (plus bitten states 1/3, 2/3), Glazey (belly
  stages 0–5), 3 tree types, bakery, pier, lighthouse with Moon Donut, rocks,
  flowers, grass tufts, fences, clouds.
* Gate shots: `gallery-donuts`, `gallery-glazey-belly`, `gallery-props`,
  `gallery-donut-bites`.

### M4 — Glazey in motion (GATE)
* Character controller (Rapier), third-person auto camera with collision,
  touch, keyboard and gamepad input, squash and stretch, idle, walk, jump and
  land animations (procedural bone-less animation of voxel sub-parts).
* Gate shots: `m4-walk-strip` (motion strip), `m4-jump-apex`, `m4-touch-ui`.

### M5 — The Munch ★ (GATE + feel check)
* Munch interaction: auto-aim, 3 bites, a real voxel carve with a scalloped
  bite shape, crumb particles with physics, chomp SFX, belly inflation with
  wobble, power pickup VFX, burp shockwave, rolling at belly ≥ 3.
* 4 MVP powers: Boing, Slide, Puff, Shine.
* Gate shots: `m5-bite-1`, `m5-bite-3`, `m5-crumbs-strip`, `m5-burp-strip`,
  `m5-belly-5-roll`.
* Feel check: Claude writes a short "juice audit" against art bible §8 and
  game design §2 pillar 1.

### M6 — Glaze Meadows and the Milk Lagoon (MVP world) ★ (GATE)
* Full ring sector for Glaze Meadows with terrain LOD, the lagoon with water
  shader, the lighthouse and Moon Donut visible from everywhere, wild donut AI
  (rolling herds, flee), donut trees, Crumb Bandit seagulls.
* Gate shots: `m6-vista`, `m6-bakery`, `m6-pier-sunset`, `m6-donut-herd`,
  `m6-low-tier`.

### M7 — Friends, quests and story (GATE)
* Granny Dough, Mayor Crullerbeard and Sir Sprinkles. Picture-bubble quests,
  gibberish voice barks, Golden Sprinkle collection (each flies to the Moon
  Donut), and the opening Sprinkle Storm cutscene.
* Gate shots: `m7-npc-lineup`, `m7-quest-bubble`, `m7-storm-strip`.

### M8 — Mini-games: Dunk Derby and Donut Designer (GATE)
* Gate shots: `m8-dunk`, `m8-designer-ui`, `m8-designer-result-in-world`.

### M9 — UI, audio, juice pass (GATE)
* Title screen (tilt-shift island flyover), pause, parent menu, settings,
  voxel-rendered icons, music and SFX, reduced-motion mode.
* Gate shots: `m9-title`, `m9-hud-phone`, `m9-parent-menu`.

### M10 — MVP polish, perf and release (FINAL GATE: double reviewer + regression)
* Perf on low tier, loading screen, autosave, PWA manifest, the mini finale
  (the Big Dunk with 6 sprinkles).
* The final gate re-shoots **every previous gate shot** (the regression shelf)
  plus `m10-finale-strip`.

### v1 (after the MVP is signed off)
One milestone per region (Cruller Canyon → Jelly Jungle → Maple Mountains →
Choco Caves → Powdered Peaks), each with its new donut flavors, NPCs and a
mini-game. Each one goes through the same gate process.

## 4. Definition of done (every milestone)
1. `npm run lint && npm test && npm run build` are clean.
2. Gate passed (if the milestone has one). The review report is committed in `reviews/`.
3. The `shots/` PNGs for the passing iteration are committed under `shots/<gate>/final/`
   (older iterations are git-ignored).
4. `docs/PROGRESS.md` is updated with the score table and known follow-ups.
5. Commit and push to the working branch.
