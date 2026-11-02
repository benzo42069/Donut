# Review M2 iter 3 (reviewer 2 of the ★ double gate)

Capture: `npm run shots -- --gate M2 --iter 3-r2` at commit `c57f050` → `shots/M2/3-r2/`.
The harness reported `ok: true`, took the SwiftShader fallback path and wrote 10 files. The
log was empty. My first capture was killed by my own tool timeout. I re-ran it to completion,
and the PNGs were byte-identical in size to the partial run, so rendering is deterministic.

What I looked at:
- Every 1920x1080 and 844x390 frame.
- Nearest-neighbour zoom crops of:
  - hero: lagoon, west lagoon and sugar hill, front rim, right rim, underside, bakery roof, lighthouse
  - ground: left, right, donut, bakery, awning, chimney, pink tree
  - closeup: donut, path, both background corners
  - lagoon-edge: left, right, trees, lamp
  - low tier: sugar hill, bakery, front rim
- A grayscale version of the hero.
- Numpy checks for channel clipping, isolated specks and sky banding.
- References 01–04, judged only against the "Follow" lists in `art/reference/NOTES.md`.

## Verdict: FAIL

Iteration 3 makes real but incremental progress. The gate mean goes from about 6.1 to about 6.2.

What is fixed:
- **Gamut clipping:** 0.00 % of pixels have a zero channel in every shot, down from 2–21 %.
- **Ground frosting:** the terrace staircase is gone from the ground shot.
- **Flowers:** foreground flowers are now ≤ 25 px.
- **Tree sprinkles:** they are inlaid instead of sticking out like pins.
- **Lagoon wall height:** the inner wall above the milk is now short.
- **Syrup waterfall:** it reads as an amber ribbon.

What is not fixed:
- The macro-patch **seams are still drawn across the path** in both near shots.
- **Frosting is still matte everywhere.** Materials score 5 in every shot.
- **The hero donut is still concentric terraces with block-tab drips.**
- **From the hero camera the lagoon is still an opaque cream floor** with hard floor shadows.

New problems:
- Isolated near-black pinholes on the lighthouse.
- A muddy, aliasing sugar hill.
- Pink frosting that drifts to mauve and maroon in the ground-level shots.

The lighting fundamentals are sound. The weakness is now **materials and surface form**: gloss,
drips and the donut. Small tweaks will not reach 9.0. Frosting needs a real glossy material
and the donut needs a re-authored, finer frosting shell.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 7 | 7 | 7 | 7 | 7 | 5 | 7 | 7 | 7 | 6 | – | – | 6.7 |
| m2-ground | 6 | 6 | 7 | 6 | 6 | 5 | 6 | 6 | 6 | 5 | – | – | 5.9 |
| m2-closeup-donut | 6 | 6 | 7 | 7 | 6 | 5 | 5 | 6 | 6 | 5 | – | – | 5.9 |
| m2-lagoon-edge | 6 | 6 | 7 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | – | – | 6.3 |
| m2-low-tier | 7 | 7 | 6 | 6 | 7 | 5 | 6 | 7 | 7 | 5 | – | 7 | 6.4 |

- **Gate mean:** about **6.2**. It needs ≥ 9.0, and ≥ 8.5 for the low tier.
- **Min:** **5**.
- **Categories at 8 or above:** none, in any shot.

## Blockers
- **[m2-closeup-donut, m2-ground] Macro-patch seams are still drawn on the path (§10.1).** This was fix #2 last iteration and it is **not fixed**.
  - **Closeup, right path edge (x ≈ 1330–1920, y ≈ 560–1000):** two parallel dotted lines of dark single voxels run beside a doubled orange curb. They read as a stitched seam, not a path edge.
  - **Closeup, out of the donut's shadow (x ≈ 1160–1260, y ≈ 790–900):** a thin dark curved crack curls toward the lower left.
  - **Ground, lower left (x ≈ 530–1080, y ≈ 860–1080):** the same curved dark line and two to three parallel ridge lines cross the path in front of the donut.
  - **Likely source:** the coarse/fine boundary in `src/game/world/IslandTerrain.ts`. That is `inDetail` (l.81), the `macro && surf - y < MACRO_SKIN` cull (l.237) and `buildMacro` (l.333). The new `nearField()` chain of discs in `m2Meadow.ts` creates several overlapping disc boundaries, and each one leaves its own contour line.
- **[m2-hero] Pinholes and light leaks on the lighthouse (§10.1).** About 25 isolated near-black single pixels sit on the white and red stripes of the lighthouse shaft (x ≈ 1160–1220, y ≈ 250–410). Samples: (12,6,0), (18,9,0) and (27,16,0), surrounded by stripe colors near (200,190,175). They read as black flecks or holes at 100 %.
  - **Likely cause:** cracks at T-junctions in the cylinder mesh, or NaN/zero-length normals from the new smooth-normal path (`mesh.ts` was touched this iteration). The low tier does not show them.
- **[m2-hero, m2-low-tier] The lagoon still reads as a dry cream floor, not milk (RF-02; NOTES 01 "Ignore": the flat cream slab; game design §6).** This is partly improved, because the wall above the milk is now only a short lip. But across x ≈ 720–1140, y ≈ 400–610 the milk is still an opaque peach and white plane:
  - The tree and pier shadows lie on it as crisp, hard-edged shapes, exactly like shadows on a floor.
  - It shows no sky-tinted fresnel, no reflection of the pink drips, lighthouse or trees, and no glint path.
  - In grayscale it is the **brightest region in the frame**, so the eye lands on an empty floor.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Remove the path seams.
   - **Where:** `IslandTerrain.ts` (`inDetail`, the MACRO_SKIN cull and `buildMacro`) and `nearField()` in `src/debug/scenes/m2Meadow.ts`.
   - **How:** use one union mask so there is one boundary, not several overlapping disc rims. Make the coarse column carve exactly where the macro skin starts, and move the boundary outside the frame or under grass.
   - **Target:** in m2-closeup-donut and m2-ground there are no dotted lines, no doubled curb and no curved crack on the path. The path edge is one clean curb.
2. **What:** Close the lighthouse pinholes.
   - **Where:** `src/engine/voxel/mesh.ts` (smooth-normal and AO changes this iteration) and the lighthouse model in `src/art/models/`.
   - **Target:** no isolated pixel on the shaft is more than 50 levels darker than its neighbours.
3. **What:** Make the hero lagoon read as milk.
   - **Where:** `src/engine/render/Water.ts`. Raise `uReflect` and the fresnel at steep angles, soften received shadows on the milk with a scattering term, and add a sun glint path. Also `Reflection.ts`.
   - **Target, from the hero camera:**
     - a soft reflection of the pink inner drips and the lighthouse
     - a cool sky tint toward the far shore
     - a broken glint streak
     - a clear cream foam ring at the wall base and the pier posts
     - shadow edges on the milk at least 3× softer than on the meadow
     - in grayscale, the milk is no longer the brightest mass in the frame
4. **What:** Make the frosting glossy.
   - **Why:** this is the biggest visual payoff. Materials are 5 in every shot, and art bible §5 requires visible specular on frosting.
   - **Where:** the `MAT.gloss` handling and roughness in `src/engine/render/Materials.ts`, and `palette.ts`.
   - **Target:**
     - The hero rim (x 420–900, y 560–800), the donut tops in ground and closeup, and the floating pink donut in lagoon-edge all show sun specular streaks and a fresnel rim.
     - You can tell frosting from dough by sheen alone.
     - In grayscale, the pink drips separate from the dough band. Today they merge.
5. **What:** Re-author the hero donut frosting.
   - **Where:** `src/art/models/donut.ts` (frosting shell and `dripLine`, l.80). Consider 1/64 m for the hero donut, per art bible §3 for close-up hero assets.
   - **Targets:**
     - **Frosting top (closeup, x 700–1300, y 400–660):** no concentric contour terraces.
     - **Drips:** rounded, varied in width and length, with bulb ends. Today they are flat-bottomed rectangular tabs, two of them about 90 px wide on the side facing the camera.
     - **Density in m2-ground:** the donut voxel is ≤ 6 px. It measures about 9–10 px now.
     - **Chocolate donut behind it (ground x 560–750, y 715–770; closeup x 450–720, y 120–230):** it reads as a donut with a glaze highlight, not a dark tub with tan blocks at its base.
6. **What:** Fix the frosting hue drift at ground level.
   - **Problem:** in m2-ground and m2-closeup-donut the frosting mounds read mauve or lilac, plus a maroon lip. Samples: ground (150,770) = `#925A70`, (1700,860) = `#89576F`, lip (1600,800) = `#7F1D3B`; closeup drip (1000,620) = `#99384E`. All of these sit outside the `#F7A6C1` / `#F27BA5` / `#C9507E` family. It reads as lavender dough, not strawberry frosting.
   - **Where:** the new per-shot `Fog` color (`LIGHT_PALETTE.fog`, `m2Meadow.ts`) and how strong the cool hemisphere fill is on frosting. Also the bokeh, which turns frosting into lilac disc soup on the closeup left edge (x 0–300, y 60–380).
   - **Target:** frosting samples land in the strawberry family (hue 330–350°, value ≥ 55 %), with the shadow side no darker than `#C9507E`.
7. **What:** Give the inner lagoon wall real drips and remove its grain.
   - **Where:** `IslandTerrain.ts` (wall strata and drip stamping).
   - **Problem:** in m2-lagoon-edge the drips are flat rectangular curtains painted on a vertical wall. Examples: x ≈ 360–480, y ≈ 690–820, and x ≈ 1700–1840, y ≈ 660–800. They have no thickness, no rounded ends and no AO underneath. The dough between them still shows vertical wavy wood-grain streaks (x ≈ 480–760, y ≈ 700–820).
   - **Target:** the drips bulge 1–2 voxels off the wall, taper, end in bulbs and cast a contact shadow. The dough reads as soft toasted bands.
8. **What:** Rebuild the sugar hill.
   - **Where:** the sugar hill and the dusting from "sugar dusting" this iteration, in `IslandTerrain.ts` / `smallProps.ts`.
   - **Problem:** in the hero (x ≈ 470–610, y ≈ 350–540) it is a gray-beige lump with moiré contour bands and a salt-and-pepper brown and gray speckled base. It reads as a muddy rock (§10.5 muddy browns), not reference 01's sugar-capped peak. In the low tier the speckle aliases into about 570 isolated specks per 100 px cell (§10.7).
   - **Target:** a clean, high-value sugar cap with a smooth falloff onto a toasted base. No 1-voxel salt-and-pepper dither, and no visible contour banding.
9. **What:** Fix the bakery details.
   - **Where:** `src/art/models/bakery.ts`.
   - **Roof (hero, x ≈ 880–1000, y ≈ 160–260):** the shingles read as tan planks with aliasing stripe lines, not 01's chocolate shingles. Use chocolate shingle tiles with a gloss highlight.
   - **Awning (ground, x ≈ 1190–1380, y ≈ 390–470; code l.217):** seen from below, its cream stripes match the plaster and the pink stripes read as thin lilac lines. It looks like a ghost. Give the underside a darker shade or valance and enough depth to cast a shadow.
   - **Chimney (ground, x ≈ 1000–1030, y ≈ 100–150):** the vertical emissive slivers look like a glitch.
10. **What:** Fix the hero framing and value hierarchy.
    - **Where:** the hero camera in `m2Meadow.ts` and `buildCloud` in `smallProps.ts`.
    - **Clouds:** they are still clipped by the frame edges at x 980–1210, y 1015–1080; x 150–290, y 1055–1080; x 1830–1920, y 920–1080; and x 0–60, y 1060–1080. Move them so no cloud is cut off.
    - **Grayscale hierarchy:** the frosting rim, meadow and path are all the same mid-gray, and the lagoon is the brightest mass. Pull the focal value contrast onto the bakery and lighthouse cluster: a warmer rim light, a slightly darker meadow and a darker milk.

## Previous review fix-list status (reviews/M2-iter2-r2.md)
1. **Smooth frosting near ground cameras: partly fixed.**
   - Fixed: the terraces are gone in m2-ground, the cells are now about 10 px, and the terrain sprinkles are about 13×5 px.
   - Not fixed: the frosting reads as a mauve brick sheet (see fix 6). In the closeup background (x 1180–1900, y 360–400), the far path is a raised, blocky orange ledge.
2. **Macro-patch seams: not fixed.** See blocker 1.
3. **Blue channel clipping: fixed.** 0.00 % zero-channel pixels in every shot. The lagoon wall dough now samples `#955F20` and `#6E3B0C`.
4. **Hero lagoon reads as milk: partly fixed.** The meadow is lowered and the pit is gone. The milk itself is still an opaque floor with hard shadows.
5. **Glossy frosting: not fixed.** There are a few faint glints on the closeup donut top only.
6. **Donut frosting as a smooth dome: not fixed.** It still has concentric terraces and rectangular drips. The chocolate donut contact is partly better: it now sits in the grass.
7. **Finer foreground grass and flowers: mostly fixed.** The flowers are ≤ 25 px. The grass is still flat-topped pegs, but dense enough to read as a meadow.
8. **Lagoon wall grain and hovering sprinkles: partly fixed.** The sprinkles are fixed. The wall grain and flat drips remain.
9. **Milk reflection artifacts: partly fixed.** The reflections are softer and match their sources better. The foreground milk is a blotchy peach sheet, and the foam line is faint.
10. **Hero framing and clouds: partly fixed.** The syrup waterfall is now readable and the underside silhouette is smooth. The clouds are still clipped at the frame edges.

## What is working (keep it)
- **Gamut:** the gamut guard before tone mapping. The dough finally has gradation, and the underside strata read as toasted layers.
- **Hero outer drum:** a smooth silhouette, crumb noise and overlapping drips. Lowering the meadow made the island read as a full ring and no longer as a pit.
- **Light and mood:** golden-hour light, a pastel sky with no banding (max flat run 21 px, step ≤ 3), disciplined bloom (lamp and windows only) and soft long tree shadows across the meadow.
- **Ground composition:** the backlit bakery anchors the shot. It has warm windows, flower boxes, the donut emblem and the cruller trim.
- **Lagoon edge:** the best mood in the gate. The reflections in the milk now track their sources, and the canopy sprinkles are inlaid.
- **Meadow:** the flowers are at the right scale. The meadow reads as dense and soft from mid-distance.
- **Low tier:** it holds up well, apart from the sugar-hill aliasing.

## Store-page test: no
At thumbnail size the hero is a pleasant, coherent diorama. Next to reference 01 it falls short:
- The frosting is matte plastic.
- The eye lands on an empty cream floor in the middle.
- The sugar hill reads as a gray rock.
- Any listing would also show the ground and closeup frames, and those have seam lines on the path and a terraced, matte hero donut.

That is not front-page premium quality.

## Regression check
There is nothing to regress against. No earlier graphics gate has passed `final/` shots: `shots/M0/final` and `shots/M1/final` are engine test scenes with no gate.

Compared with M2 iter 2, nothing important got worse, with three exceptions:
- the new lighthouse pinholes (blocker 2)
- the sugar-hill dither and aliasing (fix 8)
- the frosting hue drifting to mauve under the new per-shot fog (fix 6)

```json
{"gate":"M2","iter":"3-r2","verdict":"FAIL","mean":6.2,"min":5,"blockers":3,"store_page":false}
```
