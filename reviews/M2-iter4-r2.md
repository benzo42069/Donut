# Review M2 iter 4 (reviewer 2 of the ★ double gate)

Capture: `npm run shots -- --gate M2 --iter 4-r2` at commit `dcadc29` → `shots/M2/4-r2/`.
- My first run was killed by my own tool timeout after 9 of 10 files.
- I re-ran it to completion: exit 0, 10 files in 440 s, SwiftShader fallback.
- The 9 overlapping files were byte-identical between the two runs, so rendering is deterministic.

What I looked at:
- All 10 frames (1920x1080 and 844x390).
- Nearest-neighbour zoom crops of:
  - hero: bakery, sugar hill (and the disc on it), lagoon, lighthouse, front rim, right rim, mid-island
  - ground: path, donut, right frosting field, roof
  - closeup: donut, lower-left corner, top band
  - lagoon-edge: bakery corner, inner wall, pier and floating donut, lamp
  - low tier: bakery, mid-island
- A grayscale version of the hero.
- Numpy checks for isolated dark pinholes, channel clipping and sky banding, plus 5x5-averaged colour samples.
- References 01–04, judged only against the "Follow" lists in `art/reference/NOTES.md`.

## Verdict: FAIL

The iteration-4 "structural change" (surface relaxation, seam-free patches, a milk pass) shows up mostly in the closeup donut, which now has a smoother frosting top. Gate quality is **flat at about 6.2**.
- **Plateau:** this is the second consecutive iteration with less than 0.3 gain (6.1 → 6.2 → 6.2), so the plateau rule (§5) applies again.
- **Still open from last time:** the lighthouse pinholes, the milk that reads as a floor, matte frosting and seam lines on the path.
- **New in this iteration:**
  - a grey disc stain on the sugar hill
  - frosting that has drifted to coral or salmon (it now matches Glazey's body colour)
  - a light-leak seam and an unlit grey eave plane on the bakery
  - a faceted low-poly plane in the closeup

No category in any shot reaches 8.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 7 | 7 | 7 | 7 | 6 | 5 | 7 | 7 | 7 | 5 | – | – | 6.5 |
| m2-ground | 6 | 7 | 7 | 6 | 6 | 6 | 6 | 6 | 6 | 5 | – | – | 6.1 |
| m2-closeup-donut | 6 | 6 | 7 | 6 | 6 | 5 | 6 | 5 | 6 | 5 | – | – | 5.8 |
| m2-lagoon-edge | 7 | 7 | 7 | 6 | 7 | 6 | 6 | 6 | 7 | 5 | – | – | 6.4 |
| m2-low-tier | 6 | 7 | 6 | 6 | 6 | 5 | 6 | 7 | 7 | 5 | – | 6 | 6.1 |

- **Gate mean:** about **6.2**. The bar is ≥ 9.0, and ≥ 8.5 for the low tier.
- **Min:** **5**.
- **Categories at 8 or above:** none.

## Blockers
- **[m2-hero, m2-low-tier] The lighthouse pinholes are still there (§10.1).** This was fix 2 last iteration and it is **not fixed**.
  - **Hero:** 16 isolated near-black pixels (luma < 40, at least 60 below the 8-neighbour mean). They are mostly on the shaft at x ≈ 1170–1180, y ≈ 320–375, with more on the front rim dough at x ≈ 600–700, y ≈ 700–800.
  - **Low tier:** 63 of them, clustered on the **bakery roof** at x ≈ 800–1000, y ≈ 100–400. They follow the roof plank lines, so they read as dark flecks along every plank seam.
  - **Likely source:** T-junction cracks or zero-length smooth normals in `src/engine/voxel/mesh.ts`, which was changed again this iteration (+39/−?). The `crackEps` value in `Materials.ts` is a band-aid, not a fix.
- **[m2-lagoon-edge] The bakery has a light-leak seam and an unlit plane (§10.1, §10.6).**
  - **Light leak:** a dotted bright line runs down the inside of the dark corner timber at x ≈ 183–188, y ≈ 430–650, and a thin bright outline traces the door arch at x ≈ 40–60, y ≈ 465–650. This is sky showing through a crack between the timber and plaster meshes.
  - **Unlit plane:** the eave underside at x ≈ 205–250, y ≈ 417–513 is a flat, untextured grey-blue quad with no voxel relief and no AO. It reads as default three.js.
  - **Where:** the soffit and timber construction in `src/art/models/bakery.ts` (`woodDark` soffit at l.134) and the eave overhang geometry.
- **[m2-hero] A grey disc stain on the sugar hill (§10.1 / §10.7).** A grey disc about 25 px across sits on the sugar cap at x ≈ 533–558, y ≈ 373–398. It samples (161,147,142) against a cap of about (247,196,162), and moiré contour rings surround it.
  - It reads as a hole or a dirty stain on the most reference-critical prop (01's snow-capped peak).
  - It is **absent in the low tier**, so it comes from a high-tier pass: SSAO/N8AO on the newly relaxed `MAT.smooth` normals, or a pit at the apex produced by the surface relaxation in `IslandTerrain.ts` (Zone.Sugar, l.145–149, l.222–273).
- **[m2-hero, m2-low-tier] The lagoon still reads as a dry sand floor, not milk (RF-02; NOTES 01 "Ignore": the flat cream slab).** This is **not fixed**, and the low tier is worse.
  - **Hero (x ≈ 720–1140, y ≈ 400–610):** the surface is a peach-beige plane with sharp tree and pier shadows. The 55 % shadow softening in `Water.ts` dims the shadows but does not soften their edges. The ripple rings around the floating donuts are a nice touch.
  - **Grayscale:** it is **still the brightest mass on the island**, brighter than the bakery and lighthouse.
  - **Low tier:** it is a flat sandy cream disc with no reflection at all. It reads as a sand pit.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Remove every pinhole and crack.
   - **Where:** `mesh.ts` (smooth-normal and T-junction handling), the lighthouse cylinder, and the bakery roof planks and corner timbers in `bakery.ts`.
   - **Target:** in all five shots, 0 pixels with luma < 40 and at least 60 below their 8-neighbour mean. No sky-coloured lines inside dark timbers.
2. **What:** Fix the sugar hill disc and its contour moiré.
   - **Where:** relaxation of `Zone.Sugar` and `MAT.smooth` in `IslandTerrain.ts`, and the SSAO radius/normals in `Renderer.ts`.
   - **Target:** at hero x 460–640, y 330–560 the cap is a continuous high-value sugar dome with no spot more than 30 luma darker than its surroundings and no ring banding. It matches the low tier, which is already clean.
3. **What:** Make the lagoon unmistakably milk from above, at both tiers.
   - **Where:** `Water.ts` and `Reflection.ts`, plus the low-tier fallback path.
   - **Target, hero:**
     - a visible reflection of the pink inner drips and the lighthouse
     - a sky-tinted fresnel toward the far shore
     - a broken sun-glint streak
     - shadow *edges* on the milk visibly blurrier than on the meadow
     - in grayscale, the milk is darker than the bakery plaster and the lighthouse white
   - **Target, low tier:** at minimum a cheap env-map reflection and a fresnel term, so it never reads as a sand pit.
4. **What:** Bring the frosting back to strawberry pink.
   - **Problem:** the palette entry is `#F27BA5` (hue 339°), but the frame samples are:
     - closeup top (950,470) = `#F69690`, hue 4°
     - hero rim (700,780) = `#EF8D8F`, hue 359°
     - lagoon floating donut (1300,920) = `#D37C87`
     - ground field (150,770) = `#9E6B7E`, a desaturated mauve at value 62 %, with the lip at (1600,800) = `#85203C` maroon
   - Strawberry now reads as coral, the same family as Glazey's `#F28B6E`. The subject and the frosting will merge once Glazey is in the world.
   - **Where:** `ColorGrade.ts` l.27/53 (the highlight tint is `sunGolden × 1.12` multiplied in, which pushes pink to orange), the sun colour, and the per-shot fog in `m2Meadow.ts` for the mauve.
   - **Target:** every frosting sample in every shot has hue 330–350°, value ≥ 55 %, and the shadow side no darker than `#C9507E`.
5. **What:** Make the frosting actually glossy.
   - **Where:** the `uGlaze` lobe in `Materials.ts` and the `MAT.gloss | MAT.soft` combination in `palette.ts`. The new wrap term flattens the gloss.
   - **Current state:** the ground donut top now shows a few glints (progress). The hero rim, the closeup donut and the lagoon wall drips are still matte plastic.
   - **Target:**
     - every frosting surface facing the sun shows a specular streak, and a fresnel rim at grazing angles
     - you can tell frosting from dough by sheen alone
     - in grayscale, the hero rim drips (x 420–900, y 760–950) separate from the dough band behind them. Today they merge.
6. **What:** Fix the drip shapes on the terrain rims and the props.
   - **Where:** the wall and rim drip stamping in `IslandTerrain.ts`, and `dripLine` in `donut.ts`.
   - **Problem:**
     - The hero front rim (x 560–1000, y 830–950) and the lagoon inner wall (lagoon-edge, x 360–480, y 690–820, and x 1700–1840, y 660–800) still use flat, equal-width rectangular curtains with square ends, painted flush on the wall.
     - The dough between them shows the vertical wood-grain streaks (lagoon-edge x 480–760, y 700–820).
     - The ground donut drips (x 560–620, y 870–930) are still flat-bottomed tabs.
   - **Target:**
     - drips that vary in width and length, with bulb ends, bulge 1–2 voxels off the surface and cast a contact shadow
     - dough that reads as soft toasted strata, with no grain
7. **What:** Kill the remaining path seams and contour lines.
   - **Where:** `inDetail` / `macroColumn` and the path relaxation in `IslandTerrain.ts`.
   - **Problem:** this is partly fixed. The dotted lines and the doubled curb are gone, but:
     - **Ground:** a lighter curved band with dark edges still crosses the path at x ≈ 830–1015, y ≈ 870–910.
     - **Closeup:** 4–5 parallel curved dark contour lines run across the path at x ≈ 150–1000, y ≈ 700–1080. These are height-quantisation terraces showing through the smooth shading.
   - **Target:** the path in both shots is a continuous surface with no line darker than the pebble noise.
8. **What:** Remove the non-voxel faceted plane in the closeup and the grid lines on the ground frosting.
   - **Closeup lower left (x 0–250, y 760–1000):** a flat yellow plane of visible low-poly triangles. It is probably the syrup sheet or `SYRUP_SHEET`. Teal base shows through under the grass edge at x 0–330, y 740–770.
   - **Ground right frosting field (x 1530–1920, y 800–940):** a regular grid of light lines runs across the voxel faces. It reads as a wireframe or quad seams.
   - **Target:** both read as continuous voxel surfaces with AO. There are no triangle facets, no teal gaps and no face-grid lines.
9. **What:** Re-author the bakery roof and chimney.
   - **Where:** `bakery.ts`.
   - **Problem:**
     - The hero and low-tier roof is still tan planks with stripe aliasing. In the ground shot it is dark slate-grey boards. Neither matches 01's **chocolate shingles**.
     - The chimney shadow on the left slope (hero x 925–965, y 185–215) is a hard dark triangle that reads as a hole.
     - The emissive sliver on the chimney (ground x ≈ 1015–1025, y ≈ 85–105) still looks like a glitch.
   - **Target:**
     - rounded, glossy chocolate shingle tiles with a sun specular, consistent across shots
     - a soft chimney shadow
     - no stray emissive voxels
10. **What:** Fix the near-camera framing and the value hierarchy.
    - **Where:** the cameras in `m2Meadow.ts`.
    - **Framing problems:**
      - In `m2-ground_844x390` the lighthouse is cut by the right frame edge.
      - In `m2-lagoon-edge_844x390` a tree is cut at the right edge.
      - In `m2-closeup-donut` the top 15 % is a saturated burnt-orange slab, (400,80) = `#BD5918` at saturation 0.87. It is out-of-focus hill base and pulls the eye away from the donut. This breaks §4: muddy or over-saturated large area, and the subject must have the strongest contrast.
    - **Hero grayscale:** the rim, meadow and path are all the same mid-grey. Make the bakery and lighthouse cluster the strongest value contrast.
    - **Target:**
      - no hero prop cut by any frame edge
      - the closeup donut has the strongest value contrast in its frame
      - the hero passes a grayscale squint test with the bakery and lighthouse as the focal point

## Previous review fix-list status (reviews/M2-iter3-r2.md)
1. **Path seams: partly fixed.** The dotted lines and the doubled curb are gone. The curved band in ground and the contour lines in closeup remain (fix 7).
2. **Lighthouse pinholes: not fixed.** 16 remain in the hero, and 63 new ones appear on the low-tier bakery roof (blocker 1).
3. **Hero lagoon reads as milk: not fixed.** Ripple rings were added and the shadows are dimmer. It still reads as a floor and is still the brightest mass. The low tier is a sand pit (blocker 4).
4. **Glossy frosting: partly fixed, marginally.** There are glints on the ground donut top only. Everything else is matte.
5. **Hero donut frosting: partly fixed.**
   - Fixed: the closeup top is now smooth, with no concentric terraces.
   - Not fixed:
     - the side drips are still tabs
     - the ground donut voxel is still about 8 px, over the 6 px rule for props
     - the chocolate donut in ground is blurred out, so I could not verify it
6. **Frosting hue drift: not fixed, and changed direction.**
   - The mauve remains in ground.
   - The closeup, hero and lagoon-edge drifted to coral (fix 4).
7. **Inner wall drips and grain: not fixed** (fix 6).
8. **Sugar hill: partly fixed.**
   - Fixed: the salt-and-pepper dither is gone and the low tier is clean.
   - New: the grey disc stain appears in the hero, and the contour rings remain (blocker 3).
9. **Bakery details: partly fixed.**
   - Fixed: the awning in ground now reads as stripes with a valance.
   - Not fixed: the roof and chimney.
   - New: the light leak and the grey eave plane (blocker 2).
10. **Hero framing and clouds: fixed for the hero.** All clouds are fully inside the frame and the whole island is framed. The grayscale hierarchy is still flat, and the mobile near shots crop props (fix 10).

## What is working (keep it)
- **Hero framing:** the whole ring is visible and floating, the clouds are uncut and evenly distributed, and the island-as-donut silhouette reads instantly.
- **Sky and light:**
  - the golden-hour gradient from warm upper right to cool lower left
  - no banding (max flat run 20 px, max step 1)
  - no channel clipping (0.00 % zero channel in every shot)
  - disciplined bloom on the lamp and windows only
- **Closeup donut top:** the terraces are gone, the frosting top is a smooth dome, and the sprinkles are inlaid at the right scale.
- **Lagoon-edge mood:** the soft pink reflections of the drips and trees in the milk and the backlit lighthouse are the best image in the gate.
- **Meadow density:** the flower and grass scale reads as a soft meadow from mid-distance. The long tree shadows across the closeup meadow are lovely.
- **Ground shot:** the bakery's warm windows, flower boxes and donut emblem still anchor the frame well.

## Store-page test: no
At thumbnail size the hero is a cute, coherent floating donut island. Next to reference 01 it is clearly a step below:
- the frosting is matte and drifting to coral
- the drips are flat curtains
- the lagoon looks like sand
- the sugar peak has a grey stain
- the lighthouse is flecked with black pixels

A premium storefront would also show the near shots, and they have seam lines on the path, a faceted plane, and a bakery with light leaking through its corner.

## Regression check
There is nothing to regress against. No graphics gate has passed `final/` shots: `shots/M0/final` and `shots/M1/final` are engine test scenes with no gate.

Compared with M2 iter 3, these got worse:
- the sugar hill disc artifact (new)
- the frosting hue moving to coral in three shots
- new pinholes on the low-tier bakery roof
- the bakery light leak and grey eave in lagoon-edge

Plateau rule (§5): the mean moved 6.1 → 6.2 → 6.2. The iteration-4 structural change did not move the needle. Iteration 5 needs a different structural lever, for example:
- a real glossy frosting BRDF with a separate clearcoat
- a re-authored drip system shared by the terrain and the props
- a planar-reflection milk that also works on low

```json
{"gate":"M2","iter":"4-r2","verdict":"FAIL","mean":6.2,"min":5,"blockers":4,"store_page":false}
```
