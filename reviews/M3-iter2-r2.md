# Review M3 iter 2 (reviewer r2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M3 --iter 2-r2`, which wrote `shots/M3/2-r2/`. The harness reported `ok: true`. **Note:** this run used the **GPU path** (ANGLE Metal, Apple M4). Iteration 1 used SwiftShader. I viewed all 14 files and 2–7× crops of every problem area. Before that I read `art/reference/NOTES.md` and viewed all four reference images.

Summary: this is a large step up from iteration 1. Both blockers are gone. Glazey's face is now charming and close to the sheet, the chocolate specular is clean, and the powdered donuts read as sugar. With no instant-fail items left, this is now good indie work: roughly a 7 out of 10, as an asset sheet. It still misses the bar in several ways:
- The bite interiors still shade to an olive, mouldy grey.
- Glazey's belly decal projects around the sides and into the rear crease.
- The classic glaze is a blotchy cream that sits at almost the same value as the backdrop (luma 225 vs 230).
- The wooden stands carry dark, dashed staircase striations into every donut shot.
- The props set still mixes smooth hero assets with Minecraft-chunky ones (the rock, pretzel trunk, pier stairs and hanging donuts).
- The studio light is clean but flat. It has none of the warm, appetising glow of reference 04.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 7 | 7 | 7 | 8 | 7 | 7 | 7 | 8 | 7 | – | – | 7.2 |
| gallery-glazey-belly (+ strip) | 8 | 7 | 7 | 7 | 8 | 7 | 7 | 7 | 8 | 6 | 6 | – | 7.1 |
| gallery-props | 7 | 6 | 7 | 7 | 7 | 6 | 6 | 8 | 8 | 7 | – | – | 6.9 |
| gallery-donut-bites | 7 | 7 | 7 | 6 | 5 | 7 | 7 | 7 | 6 | 7 | – | – | 6.6 |
| gallery-low-tier | 7 | 7 | 7 | 7 | 8 | 7 | 7 | 7 | 8 | 7 | – | 8 | 7.3 |

The gate mean is about 7.0 against a pass bar of 9.0. The minimum score is 5. Every shot has several categories below 8.

## Blockers
None this iteration. Both iteration-1 blockers (the lantern streaks and Glazey's fireflies) are fixed. I scanned the coral silhouettes for isolated pixels more than 40 luma above their 5 px median. The only hits are on the rainbow tuft capsules (real highlights), none on the body.

The worst remaining defects are the bite-interior colour (fix 1) and the belly-decal bleed (fix 2). Neither is §10 instant-fail strictly, but each is scored hard above.

## Fix list (priority order; max 10; each concrete and testable)
1. **Make the bite interiors appetising, and seat the crumbs.**
   - **Where:** the bite-crumb colours in `src/art/models/donut.ts` (around line 584–621, "Torn crumb"). The AO/SSAO tint also matters: neutral-grey occlusion multiplied over cream gives olive. `scatterCrumbs` in `src/debug/scenes/gallery.ts` places the crumbs.
   - **Problem:** in gallery-donut-bites, the deep pockets of every carve shade to olive grey-green. This is worst on the right column, both rows, and on the bottom-middle donut (about x 1040–1140, y 590–650). At 844×390 it reads as mould on bread, which breaks §4 (appetising, no muddy browns) and §10.5.
   - **Problem:** there is a hard row of near-black brown specks along the bottom of each carve.
   - **Problem:** the floor crumb piles sit about 100 px below the stand feet (x 1090–1150, y 825–860 and x 1725–1800, y 825–860) with no visible contact shadow.
   - **Problem:** several stand-edge crumbs hang over the rim in mid-air (x 1060–1100, y 700–760).
   - **Target:** pocket shading stays warm. Occlusion tints toward toasted caramel `#B86B32` and never toward grey or green. The interior hue stays within about 10° of the cream crumb at every depth. Toasted flecks are mid-brown, not near-black. Every crumb rests on a surface and has a visible contact shadow. The floor crumbs sit within about 30 px of a stand foot.
2. **Stop the belly decal projecting around Glazey's sides and under the body.**
   - **Where:** `src/art/models/glazey.ts`, in the `faceGrid.generate` callback. The decal paints every voxel with `z > 0` inside the front-projected ellipse, whatever the surface faces.
   - **Problem:** in strip f1 (side), a thin cream strip with a hard horizontal edge runs from the belly back along the lower body to the rear foot on all six Glazeys (e.g. x 1385–1450, y 615–625). It looks like a strap.
   - **Problem:** in strip f2 (back), an olive cream seam shows in the body–foot crease of the stage-5 Glazey at about x 1560–1585, y 605–620.
   - **Problem:** from the front, the patch reads as a bowl with a flat, nearly straight top edge rather than the sheet's oval. It also shows concentric contour rings (terracing) across the cream.
   - **Problem:** in side view, the eye domes and blush stand proud of the silhouette like goggles.
   - **Target:** apply the decal only where the surface normal faces the camera (about n.z > 0.35). Do not paint anything below the body–foot crease. The patch's top edge should be a visible convex curve, as on sheet 03. No cream should be visible from the back. In profile, the eye bulge should be at most 1 body voxel, so it reads as part of the head.
3. **Make the classic glaze translucent, and give the cream assets value separation.**
   - **Where:** the classic look in `donut.ts`, the glaze material in `src/engine/render/Materials.ts`, and the backdrop in `src/debug/scenes/studio.ts`.
   - **Problem:** the lower-left donut (gallery-donuts) and the bottom row (gallery-donut-bites) are covered in blotchy, camouflage-like light and dark cream patches. They read as latex paint, not a thin sugar glass.
   - **Problem:** there is no dough tint showing through and no fresnel rim.
   - **Problem:** measured luma is 225 on the glaze top vs 230 on the backdrop beside it, so in grayscale the donut disappears (§4 value structure). The powdered donuts are only 242 vs 232.
   - **Target:** a uniform, smooth glaze with a golden dough tint through the top (visibly warmer than the drips) and a bright fresnel rim on the silhouette. Each cream asset differs from the backdrop behind it by at least 15 % luma. Either deepen the sweep behind the subjects to a warm caramel-tinted gradient, or darken the floor around the stands.
4. **Clean up the stand tops.**
   - **Where:** `src/art/models/stand.ts` and the mesher normals for that material.
   - **Problem:** on every stand in gallery-donuts, gallery-donut-bites and gallery-low-tier, the top disc and rim are covered in dark, horizontal, dash-like staircase striations (e.g. under the swirl donut, x 1240–1530, y 760–800). This is the busiest texture in the frame, and it pulls the eye off the donuts.
   - **Target:** stand tops read as smooth, softly lit turned wood with fine grain. There are no dark dashes at 1:1. Stair contours are visible only at 3× zoom.
5. **Bring the chunky props up to the hero assets' smoothness.**
   - **Where:** `src/art/models/props.ts` (the chocolate rock, pretzel trunk and donut tree's hanging donuts) and the pier model.
   - **Problem:** in gallery-props, the chocolate rock (x 1355–1540, y 720–850) is a Minecraft staircase of large blocks, and its sugar cap is a flat white patch with holes.
   - **Problem:** the twisted pretzel trunk (x 320–375, y 500–735) is stepped bricks.
   - **Problem:** the pier stair stringers and handrails (x 180–290, y 680–830) are stair-stepped.
   - **Problem:** the donut-tree donuts (x 1420–1630, y 490–575) are low-res and boxy, float under the canopy with no visible hanging point, and one is a dark brown hole-ring.
   - **Target:** at this framing, every silhouette reads as rounded, like the lighthouse, bakery walls and cotton-candy canopy. The rock reads as a rounded chocolate boulder with sugar drifts dusted into it. The hanging donuts match the gallery donuts' form quality and hang from visible stems.
6. **Embed the canopy sprinkles.**
   - **Where:** the canopy sprinkle placement in `props.ts`.
   - **Problem:** on the green sprinkle tree (x 1125–1350, y 410–600) and the pink tree (x 1590–1830, y 590–780), the sprinkles are flat rectangles lying on the surface, grouped in horizontal bands. Several stick out beyond the silhouette (right edge of the green tree, about x 1320–1345, y 500–560; right edge of the pink tree).
   - **Target:** sprinkles are 1×1×3 capsules rotated in 90° steps (§5), evenly distributed over the canopy, sunk halfway into it, and AO'd into the surface. None project past the silhouette.
7. **Remove the grey specks from the powdered sugar, and seat the jelly.**
   - **Where:** `sugarGrains` in `donut.ts` (around line 480). Single-voxel pits between the grains get SSAO and read as grey.
   - **Problem:** there are about 40 cool-grey 1–2 px specks (60–90 luma below their neighbours) across both powdered tops (e.g. x 1249,215; x 1315,224; x 1354,350). They look like ash or pepper on the sugar.
   - **Problem:** the jelly is still a glossy blob stuck on the flank (x 1240–1325, y 290–335). It does not ooze from a split.
   - **Target:** no sugar pixel is more than 25 luma below its 5 px median, and any shading in the grains stays warm. The jelly sits in a dark, AO'd split in the dough band, as in reference 04's top-right donut.
8. **Give the studio warm, appetising light (needed for the store-page test).**
   - **Where:** `studio.ts` (key colour and intensity, rim, grade).
   - **Problem:** the key is soft and neutral. Highlights are white-ish rather than warm, and shadow cores carry no cool tint.
   - **Target:** reference 04's mood. A warm golden key with defined, warm specular on the chocolate, frosting and glaze. Shadow cores slightly cool. A gentle warm vignette or gradient so the eye goes to the centre of the 3×3 grid. The lower third of the hero, now about 230 px of empty floor, should be cropped or should catch light falloff.
9. **Restore the blueberry's craggy identity.**
   - **Where:** the blueberry look and the `crackGlaze` / `craggy` form in `donut.ts`.
   - **Problem:** the bottom-centre donut is now smooth and rounded (good), but it has become a plain glossy lilac glaze with a wavy edge. It no longer reads as the craggy old-fashioned donut in reference 04's "Follow" list. The two small dark marks on the front flank (about x 965–1050, y 690–720) read as dents, not cracks.
   - **Target:** a lumpy, crag-ridged top that stays inside the smooth-silhouette rule, with shallow glaze cracks that catch the light. Keep the current `#7C8CE0` colour.
10. **Make the Glazey strip show motion.**
    - **Where:** `gallery.ts` (the `gallery-glazey-belly` strip).
    - **Problem:** the strip is a front/side/back turnaround. Rubric 11 asks for squash, stretch and the belly wobble (§7), and none of that is visible.
    - **Problem:** the remaining residue on the lighthouse lantern drum (soft grey-brown vertical smudges behind the railing, about x 555–640, y 280–340) belongs in the same pass.
    - **Target:** if the gate defines this strip as a turnaround, keep it, but add frames or a second strip that show a belly-stage transition mid-wobble with visible squash and stretch. The lantern drum should read as clean cream with lit windows.

## What is working (keep it)
- **Glazey's face** is the big win. The eyes are round, glossy, dark-brown domes with a big upper-left glint and a small secondary twinkle. The blush is soft and the open smile reads well. The stage-5 "bliss" arcs are charming, and coral holds from every angle. Next to sheet 03, it is clearly the same character. Belly stages 0–5 read as six distinct silhouettes.
- **Chocolate:** a continuous, soft, elongated highlight with no terraces. This is close to reference 04.
- **Pink sprinkle donut:** glossy frosting, real drips over the dough band, sprinkles sitting in the surface. This is reference quality.
- **Powdered donuts:** crisp, rough, near-white sugar on top faces with the golden dough band visible beneath. They now clearly read as sugar.
- **Rainbow mega donut and pastel swirl:** clean, appetising, and palette-true. The mega donut stays inside the sanctioned neon budget.
- **Props:** the lantern streaks are gone, the cloud smudge on the wall is gone, and the canopies are now matte. The bakery (chocolate shingles, cruller ridge, donut emblem with no text, glowing windows) and the cotton-candy tree are strong.
- **Low tier:** essentially matches high tier, with no broken effects.

## Store-page test: no
The hero (gallery-donuts) is now a tidy, likeable asset sheet, but it would not sit next to reference 04 or the year's best indie key art:
- The lighting is flat and cool where it should be warm and edible.
- The classic glaze is blotchy and vanishes into the backdrop.
- The stands are noisy.
- A third of the lineup (classic, blueberry, jelly) misses its material identity.

## Previous review (M3-iter1-r2) fix-list status
1. Lantern streaks: **fixed** (a faint grey smudge remains on the drum; see fix 10).
2. Glazey silhouette fireflies: **fixed** (no isolated hot pixels on the body in any frame).
3. Glazey face re-author: **mostly fixed**. The eyes, glints and mouth are excellent. The belly patch is below the blush, but it bleeds around the body and has a flat top (fix 2).
4. Classic glaze translucency: **partly fixed**. It is lighter and glossier and the drips show the dough, but it is blotchy, has no tint-through or fresnel rim, and has no value separation (fix 3).
5. Powdered look: **mostly fixed**. It reads as sugar, but has grey specks, and the jelly is still a stuck-on blob (fix 7).
6. Chocolate specular terraces: **fixed**.
7. Blueberry form and cracks: **partly fixed**. It is no longer boxy, but it has lost its craggy identity (fix 9).
8. Bite interiors and floating crumbs: **partly fixed**. The interiors are lighter but the pockets are still olive, and the floor crumbs are still detached (fix 1).
9. Studio lighting and separation: **partly fixed**. The sweep is lighter and the powdered donuts separate, but the classic glaze does not, and the mood is still flat (fixes 3 and 8).
10. Props composition and sprinkles: **partly fixed**. The cloud wall shadow is gone and the canopies are matte, but the sprinkles are still flat rectangles that poke outside the silhouette, and the rock, trunk and pier are still chunky (fixes 5 and 6).

## Regression check
- **M2** (shared `donut.ts`, `Materials.ts`, `mesh.ts`, `lighthouse.ts`, palette): I re-rendered `m2-hero` and `m2-closeup-donut` at HEAD into `shots/M2/m3i2reg-r2/` and compared them side by side with `shots/M2/final/`.
  - Pixel differences: 54k (hero) and 41k (closeup) pixels differ by more than 20 levels. The comparison is GPU vs the original path, and most of the difference is SSAO and specular noise.
  - Visually, the closeup's frosting specular is smoother than in the final. The small island donuts now render with the new powdered and glazed looks. The lighthouse, bakery, grass and lagoon are unchanged.
  - **No regression.**
- **M0 and M1:** I re-rendered `m0-test-cube` and `m1-terrain`. Both differ heavily from their finals: a sky gradient instead of a grey backdrop, a saturated grade, and glossy frosting. These come from the pipeline-wide lighting and grade work that predates M3 (M2), not from M3's diff. Every change reads as an improvement, with no artifacts introduced. **No regression attributable to M3.**

```json
{"gate":"M3","iter":"2-r2","verdict":"FAIL","mean":7.0,"min":5,"blockers":0,"store_page":false}
```
