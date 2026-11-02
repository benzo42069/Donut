# Review M2 iter 5 (reviewer 2 of the ★ double gate)

Capture: `npm run shots -- --gate M2 --iter 5-r2` at commit `dac9c93` → `shots/M2/5-r2/`.
- Exit 0, 10 files in 541 s, SwiftShader fallback (`harness.json` ok, empty log).

What I looked at:
- All 10 frames (1920x1080 and 844x390), viewed in full.
- Nearest-neighbour zoom crops (in `/tmp/claude-0/review-m2-5-r2/`) of:
  - hero: sugar hill, bakery and lighthouse, lagoon, front rim, a tree silhouette
  - closeup: lower-left corner, the donut
  - ground: the right frosting field and pink tree, the donut
  - lagoon-edge: the bakery corner and base, the inner wall
  - low tier: the bakery roof
- Numpy checks: isolated dark pinholes (luma < 40 and at least 60 below the 8-neighbour mean), channel clipping, 5x5-averaged colour samples, and grayscale region means for the hero.
- References 01–04, judged only against the "Follow" lists in `art/reference/NOTES.md`.

## Verdict: FAIL

This is real progress, and the most visible step since iteration 1:
- The MSAA pinholes are gone at the high tier.
- The terrain rim drips are now tapered with bulb ends.
- The hero lagoon finally reflects sky and trees.
- The roof reads as chocolate.

But the gate is still far from the bar:
- **Blockers:** two remain, the sugar-hill disc and the faceted plane in the closeup. Both were reported last iteration and neither is fixed.
- **Categories:** not one reaches 8.
- **Closeup donut:** the gate's own hero prop is still the weakest image. It has coral, matte frosting, flat-cut drips, a low-poly yellow plane in the corner and a burnt-orange band across the top.
- **Gate mean:** about **6.3**, against a bar of 9.0.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 5 | – | – | 6.7 |
| m2-ground | 6 | 7 | 7 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | – | – | 6.4 |
| m2-closeup-donut | 6 | 6 | 7 | 6 | 6 | 5 | 6 | 5 | 6 | 4 | – | – | 5.7 |
| m2-lagoon-edge | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 6 | 7 | 6 | – | – | 6.6 |
| m2-low-tier | 6 | 7 | 6 | 6 | 6 | 5 | 7 | 7 | 7 | 6 | – | 6 | 6.3 |

- **Gate mean:** about **6.3**. The bar is ≥ 9.0, and ≥ 8.5 for the low tier.
- **Min:** **4**.
- **Categories at 8 or above:** none.
- **Plateau (§5):** the mean went 6.2 → 6.2 → 6.3. This is the third iteration in a row with less than 0.3 gain over two iterations.

## Blockers
- **[m2-hero] The grey disc on the sugar hill is still there (§10.1 / §10.7).** This was blocker 3 and fix 2 last time, and it is **not fixed**.
  - **What and where:** an oval grey hole about 25 px wide on the sugar cap at x ≈ 533–560, y ≈ 373–398.
  - **Measurement:** its 11x11 mean is (169,156,152), against (236,183,159) on the cap 40 px away.
  - **Also wrong:** a broad grey diagonal shadow band crosses the cap from x ≈ 480 to 600, so the "snow peak" reads as a dirty plaster lump rather than 01's powdered-sugar mountain.
  - **High tier only:** the same pixel in the low tier is (220,184,165). The cause is therefore a high-tier pass, most likely N8AO or SSAO reacting to a pit or normal singularity at the apex of the relaxed `Zone.Sugar` surface (`IslandTerrain.ts` l.145–149, 222–276).
  - **Where else to look:** the AO radius in `Renderer.ts`.
- **[m2-closeup-donut] A non-voxel faceted plane with holes is still there (§10.1 holes; §2 "flat-color micro-voxels").** This was fix 8, and it is **not fixed**.
  - **The plane:** at lower left (x 0–240, y 670–870) a flat yellow-orange sheet shows clearly visible low-poly triangles with no voxel relief and no AO. Its edge is a jagged polygon line against the path.
  - **The holes:** directly above it (x 0–330, y 650–700), teal or blue-green base shows through between the grass tufts, and the orange caps sit on it like stickers.
  - **Why it matters:** this is the frame the gate uses to sell close-up quality.
  - **Where:** the syrup pool or sheet mesh (`SYRUP_SHEET` / syrup zone in `IslandTerrain.ts`) and the grass underlay colour.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Kill the sugar-hill disc and give the hill real snow-peak form.
   - **Where:** the `Zone.Sugar` apex in `IslandTerrain.ts`, and the AO radius and intensity in `Renderer.ts`.
   - **Target:**
     - At hero x 460–640, y 330–560, no spot is more than 30 luma darker than its surroundings.
     - The cap reads as a powdered-sugar dome over a craggy gingerbread base, as in reference 01. Today the base is a flat brown sheet.
     - The high tier matches the low tier at the apex.
2. **What:** Replace the faceted syrup plane in the closeup with voxels and close the teal gaps.
   - **Target:** at x 0–330, y 640–870 there are no visible triangle facets, the surface has voxel relief and AO, and no teal or blue-green pixels appear under the grass.
3. **What:** Make one strawberry frosting that looks the same in every shot, and make it glossy.
   - **Measured now:**
     - closeup donut (950,470) = `#FAA19D` at hue 3° (coral, Glazey's family)
     - lagoon floating donut (1300,900) = `#DF8F88` at hue 5°
     - hero rim (700,800) = hue 355°
     - ground field (150,770) = `#9D6A82`, a dusty mauve at value 0.62
   - **Gloss:** the closeup donut is still matte. It has one faint white smudge at (960,480) and nothing else. You cannot tell frosting from dough by sheen.
   - **Where:** the `uGlaze` lobe and wrap term in `Materials.ts`, the `MAT.gloss` flags in `palette.ts`, the per-shot fog and grade in `m2Meadow.ts` and `ColorGrade.ts`.
   - **Target:**
     - every frosting sample is at hue 330–350° with value ≥ 0.55
     - every sun-facing frosting surface carries a crisp specular streak and a fresnel rim
     - in grayscale the closeup frosting separates from the dough band by highlight, not by hue
4. **What:** Re-author the closeup donut so it is the frame's hero.
   - **Problems, closeup at x 720–1200, y 400–670:**
     - The drips are flat-cut tabs with a hard horizontal colour step where the side face meets the top (x 730–760 and 820–870, y 560–650).
     - The dough band is noisy orange pixel speckle with no baked gradient.
     - The donut is lower in value contrast than the bright meadow behind it.
   - **Top band:** the burnt-orange out-of-focus band (x 250–1140, y 0–40) still pulls the eye.
   - **Target:**
     - drips bulge off the surface with rounded ends and a contact shadow
     - the dough has a golden-to-toasted gradient as in reference 04
     - the donut holds the strongest value contrast in the frame
     - no saturated band at the frame edge
5. **What:** Make the milk the second-darkest mass in the hero, not the brightest.
   - **Measured now:** the hero lagoon's grayscale mean is **187**. The bakery plaster is 126, the lighthouse 119 and the meadow 135.
   - **Shadows:** tree and pier shadows on the milk still have crisp edges (hero x 780–1100, y 430–590).
   - **Low tier:** the lagoon is still a flat cream disc with ripple rings only.
   - **Where:** albedo, fresnel and shadow handling in `Water.ts`, and the low-tier path.
   - **Target:**
     - the hero lagoon's grayscale mean is ≤ 150
     - the bakery and lighthouse cluster is the focal contrast
     - shadow penumbrae on the milk are at least 2× wider than on the meadow
     - the low tier shows at least a sky-tinted fresnel and a reflection of the inner drips
6. **What:** Fix depth-of-field compositing in the ground shot.
   - **Problem:** the pink tree (x 1390–1690, y 330–720) and the right frosting field (x 1500–1920, y 780–960) are blurred, but their sprinkles render pin-sharp on top. The sprinkles read as stickers floating in front of the blur.
   - **Other artifacts:** faint regular horizontal striping still runs across the right frosting field, and a thin dark curve still crosses the path at x ≈ 830–1015, y ≈ 870–910.
   - **Where:** the sprinkle instanced or transparent layer is probably drawn after, or excluded from, the depth that `DepthOfFieldEffect` reads (`Renderer.ts` l.129). Also check the field mesh.
   - **Target:** the sprinkles blur together with their surface, there are no grid stripes in the field, and there is no line across the path.
7. **What:** Lagoon-wall dough and drips.
   - **Problem:** the hero front rim drips are now good: tapered, varied and beaded. Keep them. But in lagoon-edge (x 0–1920, y 690–830):
     - the inner wall drips are still painted flush on the wall, with no thickness and no contact shadow
     - several are straight-sided rectangles (x ≈ 1120–1260)
     - the dough between them is vertical wood-grain streaking that reads as planks, not baked strata
   - **Target:** the drips stand 1–2 voxels proud with an AO line, and the dough shows soft horizontal toasted strata as in reference 01.
8. **What:** Bakery: organic form, and the voxel scale near the camera.
   - **Problem:** the bakery is still a grid-aligned box with straight eaves and a dead-straight ridge (§2: "wobbly roofs"). Reference 01's cruller-roof bakery has curvature.
   - **Lagoon-edge measurements:**
     - the plaster voxels are about 10 px at 1080p (x 0–250, y 380–650), over the ~6 px prop rule
     - the eave underside at x ≈ 205–250, y ≈ 410–510 is a heavy dark slab of planks
   - **Ground:** the plaster is a uniform speckled grid.
   - **Where:** `bakery.ts`.
   - **Target:**
     - a sagging ridge and eaves 1–3 voxels out of line
     - a rounded cruller trim
     - the voxel scale held at ≤ 6 px in the near shots
9. **What:** Fix the mobile framing.
   - **Problem:** in `m2-ground_844x390` the lighthouse is cut by the right edge (x 780–844). In `m2-lagoon-edge_844x390` a tree canopy is cut at the right edge (x 835–844, y 75–110). These are the same items as last iteration, **not fixed**.
   - **Where:** the per-aspect camera in `m2Meadow.ts`.
   - **Target:** no hero prop touches any frame edge at 844x390.
10. **What:** Low-tier bakery roof dither.
    - **Problem:** the pinhole detector still flags 27 pixels on the low-tier roof (x 900–1000, y 200–300). At zoom they read as dark moiré flecks between the shingle rows.
    - **Target:** 0 detector hits on low-tier props, and shingle rows that read cleanly at 1080p.

## Previous review fix-list status (reviews/M2-iter4-r2.md)
1. **Pinholes and cracks: mostly fixed.**
   - **Hero:** down from 16 to 9 detector hits, all on legitimate dark roof and timber edges. The lighthouse shaft is clean on visual inspection.
   - **Lagoon-edge:** the 54 hits are on dark door and timber edges against bright plaster. They are not flecks.
   - **Low tier:** 27 hits remain on the roof (fix 10).
   - **Light leak:** the lagoon-edge corner-timber leak is gone, and the soffit is now lit voxel planks rather than a grey quad.
2. **Sugar-hill disc: not fixed** (blocker 1).
3. **Lagoon reads as milk: partly fixed.**
   - **Hero, fixed:** it now shows sky-tinted fresnel, soft tree reflections and ripple rings, and reads as liquid.
   - **Not fixed:** it is still the brightest mass (187), and the shadows are crisp. The low tier is still a flat cream disc.
4. **Frosting hue: partly fixed.**
   - **Hero rim:** improved to 355°.
   - **Closeup and lagoon-edge donuts:** still coral at 0–5°.
   - **Ground:** still mauve.
5. **Glossy frosting: not fixed** in the closeup or on the rims. There are glints only on the ground donut's sprinkles.
6. **Drip shapes: partly fixed.**
   - **Hero rim:** now tapered with bulbs, good.
   - **Ground donut:** acceptable.
   - **Not fixed:** the closeup donut tabs and the flush lagoon-wall curtains with wood-grain dough.
7. **Path seams: partly fixed.**
   - **Closeup:** the contour terraces are gone; the dirt sub-layer helps.
   - **Ground:** the thin dark curve across the path remains.
8. **Faceted closeup plane and ground grid lines: not fixed** (blocker 2). The ground stripes are fainter.
9. **Bakery roof and chimney: partly fixed.**
   - **Fixed:** the shingles now read as chocolate in every shot, and the chimney shadow and the emissive sliver are gone.
   - **Not fixed:** the shingles are matte with no sun specular, and the form is still boxy.
10. **Framing and value hierarchy: not fixed.** The mobile crops remain, the closeup's orange band is smaller but still there, and the hero's grayscale hierarchy is inverted by the milk.

## What is working (keep it)
- **Hero rim drips:** varied width and length, bulb ends, and soft shading. This is the first time the island edge resembles reference 01.
- **Clean high tier:** dropping MSAA removed the black flecks. There is no clipping (0.000 % pure white and 0.000 % pure black in all shots) and no sky banding.
- **Hero lagoon:** sky reflection and ripple rings around the floating donuts. It now reads as liquid.
- **Lagoon-edge mood:** backlit lighthouse with a glowing donut lamp, pink reflections in the milk and sprinkle-ball trees. This is the best frame of the gate.
- **Chocolate roof:** the shingles finally match 01's palette, and the donut emblem on the gable is charming.
- **Sprinkle-ball trees:** the canopy silhouettes read as rounded at hero distance.
- **Golden-hour light:** long tree shadows across the meadow in the closeup.

## Store-page test: no
- **At thumbnail size:** the hero is a cute, coherent floating donut and clearly better than iteration 4.
- **Next to reference 01:** it still looks like a solid indie prototype, not a premium listing.
  - the milk is the brightest thing on the island
  - the sugar peak has a grey hole
  - the frosting is matte
  - the bakery is a box
- **The near shots:** a storefront carousel would also show them. One has a low-poly triangle sheet, and the gate's showcase donut is coral and matte.

## Regression check
No graphics gate has passed `final/` shots, so there is nothing to regress against. `shots/M0/final` and `shots/M1/final` are engine test scenes with no gate.

Compared with iteration 4:
- **Nothing shared got worse.** The sugar-hill disc is unchanged.
- **The closeup frosting is not new.** It stayed coral; that is not a new regression.

```json
{"gate":"M2","iter":"5-r2","verdict":"FAIL","mean":6.3,"min":4,"blockers":2,"store_page":false}
```
