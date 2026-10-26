# Review M3 iter 6 (reviewer r2)
## Verdict: FAIL

I captured the shots myself at commit `01fe42a` with `npm run shots -- --gate M3 --iter 6-r2`, which wrote 14 files to `shots/M3/6-r2/`. The harness used the GPU path (ANGLE Metal, Apple M4) and reported no errors. I viewed every PNG, including the strip and its three frames. I also made 2–4× nearest-neighbour crops of:
- the rainbow, classic, jelly and blueberry donuts;
- Glazey stages 0, 4 and 5, plus strip f1 (profile);
- the right-hand props, the rock and crystal, the pier, the pretzel tree and the lighthouse;
- the bite donut and its floor crumbs.

Before that I read `art/reference/NOTES.md` and viewed all four reference images. For the regression check I re-rendered M0, M1 and M2 at HEAD into `shots/M*/m3i6reg-r2/`. I diffed those against each gate's `final/` and against last iteration's `m3i5reg-r2`.

**Summary:** iteration 6 only changed the lighting, shaders and mesher (`studio.ts`, `Materials.ts`, `mesh.ts`, `palette.ts`). No asset was re-authored.
- **Grey wedge:** the blocker from last review is mostly fixed. The corner is now a warm dusty rose rather than hueless grey.
- **New regression:** removing every specular clamp in `Materials.ts` created a blown, blooming hot spot on the chocolate donut in M2 `m2-lagoon-edge`. That is a regression in shared content, so it is a blocker under pass-bar rule 5.
- **Everything else:** the rainbow, motion strip, Glazey's skin and belly, the props, the jelly, the blueberry and the bite details look the same as in iterations 3, 4 and 5.

The gate mean is about 6.8, the same as iteration 5. Reviewer r2's gate means are now 7.0, 7.0, 6.9, 6.8 and 6.8.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | – | 7.0 |
| gallery-glazey-belly (+ strip) | 7 | 6 | 6 | 7 | 7 | 6 | 7 | 7 | 8 | 7 | 5 | – | 6.6 |
| gallery-props | 7 | 6 | 6 | 6 | 6 | 6 | 6 | 8 | 8 | 6 | – | – | 6.5 |
| gallery-donut-bites | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | – | – | 6.9 |
| gallery-low-tier | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | 8 | 7.1 |

- **Gate mean:** about 6.8. The pass bar is 9.0 (8.5 for low tier).
- **Minimum score:** 5, for motion and FX on the strip.
- Every shot has several categories below 8.

## Blockers
- **[M2 m2-lagoon-edge, shared content] Blown, blooming specular hot spot on the floating chocolate donut.**
  - **Where:** centre-left on the milk, at about x 880–960, y 780–815. The pixels clip: (905,800) is 253,190,173 and (915,805) is 253,231,209.
  - **What it looks like:** a soft white-orange glare that bleeds past the donut's top silhouette into the bakery cliff behind it. In M2 final and in iteration 5's HEAD render, the same spot is a contained highlight with a maximum luma of 244.
  - **Rules broken:** art bible §10.7 (blown whites) and §6 ("bloom: subtle, threshold-limited"). Under pass-bar rule 5, any visible quality drop in shared content is a blocker.
  - **Cause:** commit `01fe42a` removed both specular limits in `src/engine/render/Materials.ts`:
    - `min( lobe * fres, 0.7 )` in `WRAP_LIGHTS`;
    - the `min( reflectedLight.directSpecular, vec3( 1.1 ) )` peak clamp in `HUE_HOLD`.

    This is the same failure class as last iteration's chimney blocker, just moved to a different asset.

## Fix list (priority order; max 10; each concrete and testable)
1. **Restore a specular limit without killing the sprinkle glints (blocker).**
   - **Where:** `Materials.ts`, in `WRAP_LIGHTS` and `HUE_HOLD`.
   - **Do not** choose between "clamped everywhere" and "unclamped everywhere". Use a soft shoulder instead, e.g. `s / (1.0 + s * k)`, or a clamp scaled by surface curvature or `vVoxelMat` material ID. That lets 1-voxel sprinkle glints stay bright while broad glossy chocolate or frosting peaks stop clipping.
   - **Target:** in every M2 shot and every M3 shot, no glaze highlight has any channel at 250 or above over an area of 3×3 px or more. No bloom halo crosses an object silhouette. The M2 ground sprinkle glints stay visible.
   - **Verify:** re-render M2 and diff it against `final/`.
2. **Rebuild the rainbow mega donut, the hero's centrepiece. This is the fifth review with no change.**
   - **Where:** the rainbow look in `src/art/models/donut.ts`.
   - **Drips:** at x 815–1130, y 520–590 they are still flat, square-ended slabs of violet, yellow, green and blue. They hang under a red band they don't match, which is reference 04's Ignore item "stray rainbow artifacts".
   - **Band borders:** the red/orange and yellow/green borders are serrated staircases at 3×.
   - **Inner hole:** the rim still has a pink-on-dough sawtooth (x 900–1010, y 455–470).
   - **Target:** each drip is a tapered, rounded bead in the colour of the band directly above it, with the same gloss as the pink donut's drips. Band borders follow smooth curves with no staircase at 1:1, and the inner rim is clean.
3. **Give the strip real motion. This is the sixth consecutive request.**
   - **Where:** the strip poses for `gallery-glazey-belly` in `src/debug/scenes/gallery.ts`.
   - **Problem:** f0, f1 and f2 are still a static front/side/back turnaround, so category 11 is capped at 5.
   - **Target:** one frame catches a belly-stage change mid-wobble, with overshoot. One frame shows a land or munch squash at 110 % or more of rest width, with crumbs. One frame shows a jump stretch.
4. **Re-author Glazey's skin, belly, mouth and profile.**
   - **Where:** `src/art/models/glazey.ts`.
   - **Skin:** at 3× it is still a checkered, knobbly stucco (stage 4, x 1290–1530, y 420–640), not the smooth plush of sheet 03.
   - **Belly:** it is a low crescent in the bottom third of the body with concentric terrace rings.
   - **Mouth:** it is a flat dark slot with a pink lip, not the sheet's open smile.
   - **Profile:** in strip f1 (stages 0–1, at about x 255–310, y 170–215 of f1) the far eye still pokes past the head contour.
   - **Target:** surface lumps no larger than 1 body-voxel and no terracing at 1:1. The belly top reaches about 45 % of body height. The mouth is a curved, open smile with a tongue. Both eyes sit inside the profile silhouette.
5. **Bring the chunky props up to hero quality. Nothing has changed here for three iterations.**
   - **Where:** `src/art/models/props.ts` and `sprinkleTree.ts`.
   - **Items still failing in gallery-props:**
     - the rock's sugar cap is a flat white decal-like patch with holes (x 1355–1540, y 725–850);
     - the pretzel trunk is a two-tone staircase (x 320–380, y 490–735);
     - the mushroom patch base is stacked green terraces (x 985–1120, y 810–875);
     - the hanging donuts are boxy rings with no stems (x 1420–1635, y 485–575);
     - the pier stair rails are 1-voxel wires (x 185–290, y 680–760);
     - the crystal (x 1210–1305, y 705–845) is a washed-out, flat pastel with no emissive or bloom (§5);
     - the lighthouse lamp donut (x 525–630, y 155–245) is pale and has no glow.
   - **Target:** every silhouette reads as rounded at this framing. Sugar is dusted into the rock's crevices. The hanging donuts match the gallery quality and hang on visible stems. The rails are at least 2 voxels thick. The crystal and the lamp donut glow, each with a soft halo.
6. **Finish the backdrop falloff.** This is mostly fixed.
   - **What is fixed:** the top-right corner of gallery-glazey-belly and gallery-props now measures hue 11–18° and saturation 0.14–0.16, so it is no longer hueless grey.
   - **What is still wrong:** it is a dusty mauve about 20 % below the frame-centre luma (about 175 against about 218). It is still the largest dark mass in both frames, and it sits behind stage 5 Glazey and the green tree.
   - **Where:** `src/debug/scenes/studio.ts`.
   - **Target:** a corner falloff of no more than 15 % luma, with the hue kept in the peach band (20–30°).
7. **Make the jelly ooze from a split. This is not fixed.**
   - **Where:** the jelly placement in `donut.ts`.
   - **Problem:** at 4× (x 1240–1350, y 345–385) the jelly is still a glossy red cushion on the outside of the dough band, with no crack.
   - **Target:** a dark, AO'd crescent split with jelly bulging out of it and one small drip, as in reference 04.
8. **Finish the bite interiors and crumbs.** This is partly fixed.
   - **Pockets:** the deep pockets still read khaki-olive. Samples: 158,132,93 (sat 0.41) and 183,148,102 (sat 0.44).
   - **Glaze lip:** the underside now has a cool, grey mirror-like sheen (x 1400–1760, y 560–600). The new studio fresnel made it more visible.
   - **Crumbs:** at 5× the floor crumbs float with no contact shadow, and the stand tops still have no crumbs.
   - **Target:** pockets saturated at 0.55 or more, darkening toward `#B86B32`. A warm shadow under the lip. A soft contact shadow under each crumb. 4–8 crumbs on each stand top.
9. **Classic glaze translucency.** This is partly fixed.
   - **What changed:** iteration 6 brightened the fresnel. The rim now shows cool blue-white grazing streaks (x 330–660, y 650–880), but the body still reads as opaque peach plastic and the dough does not tint through.
   - **Target:** a warm, golden-tinted rim rather than a cool one, and a visibly lighter, honeyed tint where the glaze thins over the crown and at the drip edges.
10. **Turn the blueberry into old-fashioned crags. This is not fixed since iteration 5.**
    - **Problem:** at 3× the surface is melted, glossy lilac plastic with flat blotches.
    - **Target:** deep, AO'd fissures between raised crusty lumps, with lower gloss on the crust and the `#7C8CE0` hue kept.

## What is working (keep it)
- **Backdrop warmth:** the backdrop hue is fixed in every frame. The donut frames sit on a warm peach cloth (sat about 0.22–0.26) from corner to corner.
- **M2 chimney cap:** it no longer has a hot spot (it matches M2 final at 3×). The M2 lighthouse cap lost its striped sawtooth artifact and now reads as a clean, smooth dome, which is an improvement over M2 final.
- **Pink sprinkle and chocolate donuts:** still reference-04 quality, with glossy beaded drips and a continuous specular.
- **Swirl donut:** reads well.
- **Glazey's face:** big glossy eyes with strong glints, blush, and stage-5 bliss arcs. The six belly stages read as six distinct silhouettes.
- **Strong props:** the bakery, the lighthouse body, the candy-cane fence, the pier planks and the clouds.
- **Low tier:** it matches high tier, with no broken effects.

## Store-page test: no
Next to reference 04 the hero still reads as a clean prototype asset sheet:
- the top quarter of the frame is empty cloth;
- the centrepiece rainbow donut has debug-coloured slab drips and staircase bands;
- three of the nine flavours (classic, jelly and blueberry) miss their identity.

Glazey, the most marketable asset in this gate, still has stucco skin and a low, terraced belly. Nothing here would stand next to the best indie games of the year.

## Previous review (M3-iter5-r2) fix-list status
1. Grey backdrop wedge (blocker): **mostly fixed.** It is warm now (sat 0.14–0.16), but still about 20 % darker than frame centre.
2. Rainbow drips and bands: **not fixed.**
3. Motion strip: **not fixed.**
4. Glazey's skin, belly, profile and mouth: **not fixed.**
5. Chunky props and crystal: **not fixed.**
6. Canopy sprinkles: **not fixed** since iteration 5. They are still flat 1×N rectangles in banded clusters on the green and pink trees.
7. Jelly split: **not fixed.**
8. Bite interiors and crumbs: **not fixed** since iteration 5. The lip underside is slightly worse because of the cool fresnel.
9. Classic glaze translucency: **partly fixed.** The rim is brighter but cool, and the glaze has no translucency.
10. Blueberry crags: **not fixed.**

**Plateau and escalation (§5, §6):** reviewer r2's gate means were 7.0, 7.0, 6.9, 6.8 and now 6.8, so the gate has made no progress in five iterations. This is iteration 6 of 8.
- For three iterations in a row, the builder has spent the iteration on lighting and shader parameters. Each time it fixed one artifact and introduced another: iteration 5 brought the grey wedge, and iteration 6 brings the specular bloom.
- The items holding the score below 8 are asset re-authoring jobs. Lighting cannot fix them. They are the rainbow donut, the motion strip, Glazey's skin and belly, the props, the jelly, the blueberry and the bite details.

I repeat last review's recommendation: escalate to the user now instead of spending the last two iterations on parameter tuning.

## Regression check
- **M2** was re-rendered at HEAD into `shots/M2/m3i6reg-r2/` and compared with `shots/M2/final/` and with iteration 5's `m3i5reg-r2`.
  - **`m2-lagoon-edge`: REGRESSION (blocker).** The chocolate donut has a new blown, blooming specular. The maximum luma there went from 244 to 251 against iteration 5 and clips in red. This comes from removing the specular clamps.
  - **Chocolate donut sprinkles:** the same donut has also lost the sprinkles it had in M2 final. That came from an earlier M3 donut change, and it matches reference 04's plain glossy chocolate. I note it, but I do not count it as a quality drop.
  - **`m2-ground`:** mean difference 1.2. The chimney cap is clean, the sprinkle glints on the near donut are present, and quality is unchanged.
  - **`m2-closeup-donut`:** mean difference 2.2. The dough band is smoother and the specular softer. This is neutral to slightly better.
  - **`m2-hero`:** mean difference 1.9. The lighthouse cap is cleaner than in final, and there is no regression.
  - **`m2-low-tier`:** mean difference 1.7. No regression.
- **M1** (`m1-terrain` and `m1-low-tier`): the mean difference is about 26. It comes from the same global sky and grade change noted in earlier reviews (a blue-lilac gradient sky, more saturated grass and stronger AO). It is not a quality drop. The terrain, drips and donuts are intact. **No regression.**
- **M0** (`m0-test-cube` and low tier): the mean difference is about 36, for the same global grade reasons. The cube has a bevelled glossy frosting top and no new artifacts. **No regression.**

```json
{"gate":"M3","iter":"6-r2","verdict":"FAIL","mean":6.8,"min":5,"blockers":1,"store_page":false}
```
