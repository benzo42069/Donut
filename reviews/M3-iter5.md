# Review M3 iter 5
## Verdict: FAIL

I captured these myself with `npm run shots -- --gate M3 --iter 5` at commit `046b194`. The harness used the GPU path (ANGLE Metal, Apple M4) and wrote 14 files to `shots/M3/5/`.
- I viewed every 1920x1080 and 844x390 frame, the strip composite and all three strip frames.
- I viewed 2-2.5x crops of the rainbow, classic, blueberry, jelly/powdered and top-left donuts; Glazey stages 0-1 and 4-5; the trees and hanging donuts; the crystal and rock; the cotton-candy tree and its shadows; the lighthouse lamp; and the bitten classic.
- I sampled 5x5 pixel means in the backdrop corners and centre, the contact shadows, the glazes, Glazey's lit and shaded sides, and the bite pockets.
- For the regression check I re-rendered M2 at HEAD into `shots/M2/m3i5reg/` and diffed it against `shots/M2/final/`.
- Before capturing, I read `art/reference/NOTES.md` and viewed all four references. The primary references for this gate are 04 (donut lineup, studio) and 03 (Glazey sheet).

**Summary:** some fixes landed, but the gate went backwards.

What landed:
- The M2 chimney firefly is gone.
- The cloth is now warm peach (sat 0.23-0.26 instead of 0.10).
- The contact shadows have a core.
- The jelly sits in a split.
- The blueberry now has lobes.
- Glazey's back crater is gone and the arms droop.

What went wrong:
- The grey dead zone in the upper-right corner grew and got darker. On gallery-glazey-belly, the strip and gallery-props it now covers roughly a fifth of the frame and is neutral grey (sat 0.04, luma 141-165).
- The rainbow, classic, maple, emissives, props, bite pockets, belly placement and the motion strip are unchanged for the third to fifth review running.
- The over-clamped specular also removed the sprinkle sparkle on the shared M2 donut.

The gate mean is about 6.5, down from 6.65.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 6 | – | – | 6.8 |
| gallery-glazey-belly | 7 | 6 | 6 | 6 | 7 | 6 | 6 | 6 | 7 | 5 | – | – | 6.2 |
| gallery-glazey-belly_strip | 7 | 6 | 6 | 6 | 7 | 6 | 6 | 6 | 7 | 5 | 5 | – | 6.1 |
| gallery-props | 7 | 6 | 6 | 6 | 7 | 5 | 6 | 7 | 7 | 5 | – | – | 6.2 |
| gallery-donut-bites | 7 | 7 | 6 | 6 | 6 | 6 | 7 | 7 | 7 | 7 | – | – | 6.6 |
| gallery-low-tier | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 6 | – | 8 | 6.9 |

- **Gate mean:** about **6.5**. The bar is 9.0, or 8.5 for low-tier.
- **Minimum:** **5** (technical cleanliness on Glazey, the strip and props; props materials; strip motion).
- **Trend:** 6.55, then 6.6, then 6.65, then 6.5. That is four iterations without 0.3 of progress. The plateau rule (§5) applies again.

## Blockers
1. **[gallery-glazey-belly, all three strip frames, gallery-props; milder in gallery-donuts, gallery-donut-bites, gallery-low-tier] A grey dead backdrop in the upper-right of the frame.**
   - **Where:** on Glazey and the strip the region is about x 1250-1920, y 0-420. Samples: (1900,20) = 144,139,145, sat 0.04, luma 141; (1700,200) = 162,155,159, sat 0.05. On props it reaches x 1500-1920 down to y 520: (1900,300) = 156,152,159, sat 0.04. On the donut frames the top-right corner is 171,157,153 (sat 0.10).
   - **What:** a flat, unlit, grey-lavender wall behind a warm-peach set.
   - **Rules broken:**
     - Art bible §10.6, "default three.js look: gray background". It is now a large region, not the corner smudge iter 4 recorded as a defect.
     - Art bible §4 value structure: it is the darkest large mass in the Glazey frame and pulls the eye away from the subject.
   - **Likely cause:**
     - Outside the narrowed key, the sweep's back curve is lit only by `HemisphereLight(studioShade, studioShade, 0.35)`. `studioShade` is `#D8CCC0`, a grey taupe, set in `studio.ts:152-158`.
     - `vignette: 0.24` then darkens it further.
     - The cool rim and fill spots no longer reach it.
2. **[Regression, M2 `m2-ground`, shared donut and sprinkle material] The sprinkle "emissive pop" glints are gone on the foreground strawberry donut.**
   - **Where:** lower-left, x 640-780, y 795-815.
   - **What:** in `shots/M2/final/m2-ground` the sprinkle row carries 5-6 warm, sparkling glints. At HEAD they are absent. The dough band is also flatter and more uniformly orange, with less crust stipple.
   - **Rules broken:** art bible §5 (sprinkles: "slight emissive pop") and AGENTIC_LOOP §4.5 (any visible quality drop in shared content).
   - **Likely cause:** the double specular clamp added this iteration. Both `min(lobe*fres, 0.7)` in `WRAP_LIGHTS` and `min(directSpecular, 1.1)` in `HUE_HOLD` are in `Materials.ts`, plus the "no sparkle pepper" change in `donut.ts`.
   - **Target:** the chimney stays free of fireflies, and the sprinkle glints of M2 final return.

## Fix list (priority order; max 10; each concrete and testable)
1. **Kill the grey backdrop (blocker 1).**
   - **Where:** `src/debug/scenes/studio.ts`. Look at the hemisphere colours (use a warm cream or peach sky and ground, not `studioShade`), the sweep extent and back curve, the `vignette`, and `scene.background`.
   - **Target:**
     - Every backdrop pixel in all six frames has hue 15-40° and sat ≥ 0.15.
     - Edge darkening is warm. Corners sit at luma 175-200, not 141.
     - There is no visible boundary where the pool ends.
2. **Restore the sprinkle glints without bringing back the chimney firefly (blocker 2).**
   - **Where:** `Materials.ts`. Keep a single clamp scoped to the clearcoat or grazing lobe (or a `fres`-dependent cap), not a blanket clamp on all `directSpecular`. Also revisit the sparkle removal in `donut.ts`.
   - **Target:**
     - `m2-ground` matches `shots/M2/final` at the foreground donut: glints present.
     - The chimney cap stays below luma 235 with no coloured ring.
3. **Re-author Glazey's belly, body shape and mouth against sheet 03. This is the fourth review asking.**
   - **Where:** `src/art/models/glazey.ts`.
   - **Belly:** it is still a low lens with concentric contour rings, occupying about the bottom 25 % of the body (stage 4 belly x 1360-1470, y 565-625 on a body spanning y 380-650). Sheet 03's belly is a broad oval whose top reaches mid-body.
   - **Body shape:** stages 0-2 are pointed "gumdrop" cones (head tapers to the tuft). Sheet 03 is a rounded box with a near-flat crown.
   - **Mouth:** it is a rectangular slot. Sheet 03 has a curved, open smile.
   - **Surface:** the body still shows a quilted checker of shading tiles at 1:1, clearest on stages 4-5.
   - **Target:**
     - The belly top reaches at least 45 % of body height and is convex, with no rings at 1:1.
     - A rounded-box crown at stages 0-3.
     - A smiling open mouth with an upturned outline.
     - No visible tile pattern on the body at 1:1.
4. **Give the strip real motion.** This has now been asked for five times.
   - **Where:** the strip definition in `src/debug/scenes/gallery.ts`.
   - **Problem:** it is still a front/side/back turnaround, so rubric 11 cannot score above 5.
   - **Target:** one frame catches a belly-stage change mid-wobble, with overshoot visible in the silhouette. One frame shows a land or munch squash (width ≥ 110 % of rest) or a stretch, with crumbs in flight.
5. **Rebuild the rainbow centrepiece. This is the third review asking.**
   - **Where:** the rainbow look in `src/art/models/donut.ts`.
   - **Hero problems:**
     - The band boundaries are serrated staircases. The worst is the red/orange border at x 800-1120, y 500-545.
     - The drips are still flat slabs of yellow, green, blue and violet hanging under the red band (x 820-1125, y 540-590). This is exactly reference 04's Ignore item, "stray green and rainbow artifacts".
     - The hole rim is a jagged dough sawtooth (x 900-1010, y 455-475).
   - **Target:**
     - Band borders are smooth or blended over 1-2 voxels at 1:1.
     - Each drip is rounded, tapered and the colour of the band above it.
     - The hole rim is smooth.
     - A soft glow, per fix 7.
6. **Make the classic glaze translucent. It has been opaque for four reviews.**
   - **Where:** the classic look in `donut.ts` and translucency in `Materials.ts`.
   - **Problem:** it is still a uniform peach plastic. At (420,720) it measures 246,194,155, luma 202, against nearby backdrop at about 210-216, so the separation is under 5 %. There is no golden tint-through and no fresnel rim, and the glaze covers almost the whole dough band.
   - **Target (reference 04, bottom-left):**
     - A pale glass coat with golden dough showing through where it is thin.
     - A bright grazing rim.
     - Thin translucent drips.
     - At least 30 % of the side height showing dough.
     - At least 12 % luma separation from the backdrop.
7. **Make the emissives glow. This has been unchanged since iter 1.**
   - **Where:** `bloomThreshold: 1.2` in `studio.ts:205`, the crystal emissive strengths and the lamp material in `props.ts`.
   - **Problem:**
     - The crystal (gallery-props x 1215-1300, y 705-850) is still a pale, washed lilac-mint blob: 227,205,245, luma 212, with no halo.
     - The lighthouse lamp donut (x 525-630, y 155-250) is an unlit beige disc.
     - The rainbow has no glow.
   - **Target:** a visible soft halo on the crystal, lamp and rainbow; saturated crystal cores; and a crystal base darker than the floor.
8. **Bring the props up to hero quality. Only the pier has improved in three reviews.**
   - **Where:** `src/art/models/props.ts`, `sprinkleTree.ts`, and the props layout in `gallery.ts`.
   - **Problems:**
     - The fence rails are flat waffle slabs (x 580-985, y 730-800).
     - The pretzel trunk is a staircase twist (x 320-375, y 500-735).
     - The rock has a flat white cap with brown holes that reads as mould (x 1355-1540, y 720-850).
     - The hanging donuts are boxy rings with no stems (x 1420-1630, y 490-570).
     - The canopy sprinkles are still flat 1xN bars, though fewer of them now break the silhouette.
     - The cotton-candy canopy still throws a detached shadow blob and a floating disc at x 20-330, y 470-570.
   - **Target:**
     - Rounded candy-stick rails.
     - A smooth twisted trunk.
     - Sugar dusted only on the rock's top faces, with no holes.
     - Gallery-quality hanging donuts on visible stems.
     - Half-sunk 1x1x3 capsule sprinkles.
     - Every cast shadow attached to its caster on the flat floor.
9. **Make the bite pockets appetising and ground the crumbs.**
   - **Where:** `studioOcclusion` (#7A4424) and the N8AO settings in `studio.ts`, the crumb palette in `donut.ts`, and `scatterCrumbs` in `gallery.ts`.
   - **Problem:** the occluded areas of the pockets are khaki-olive again: (1500,620) = 152,125,83, sat 0.45; (1360,380) = 154,125,82. At 2x they read as mouldy grey-green blotches. The floor crumbs (x 1020-1100, y 800-835 and x 1650-1740, y 800-840) have no contact shadow, and there are no crumbs on the stand top.
   - **Target:**
     - Pocket occlusion trends toward toasted `#B86B32`, with sat ≥ 0.55 and hue 25-32°.
     - Each crumb has a soft contact shadow.
     - 4-8 crumbs sit on the stand under each bite.
10. **Finish the light and the remaining flavour identities.**
    - **Light:**
      - Glazey stage 5 measures lit 151 against shaded 136. Fix 1 from iter 4 asked for a ≥ 35 luma lit/shade split; get it via the key:fill ratio in `studio.ts`.
      - The top 25 % of gallery-donuts (y 0-265) is still empty cloth.
      - Contact cores under the stand feet are now 156-183 against 216 (15-28 % darker), close to the 30 % target. Push the tightest core to at least 30 %.
    - **Maple:** still matte orange plastic with no amber specular streak.
    - **Blueberry:** the lobes are good, but it is a mirror-wet lavender jelly with white hot glints. Old-fashioned crag needs a satin sheen and lit cracks.
    - **Stands:** the stand tops still carry dashed rings of dark dots, and the legs are square posts.

**Plateau note (§5):** this is the fourth iteration in a row with less than 0.3 of improvement, and five of the eight iterations are spent. The remaining gap is almost entirely **assets**: the rainbow, classic, Glazey's belly and body, the props, the emissives and the motion strip. Light tuning is not the gap; each light tweak has introduced a new backdrop artifact. I strongly recommend that the builder either does a single, committed asset re-authoring pass on fixes 3-8 next, or escalates to the user now (§6) rather than spending iterations 6-8 on parameter changes.

## Previous review: status of the M3-iter4 fix list
| # | item | status |
|---|---|---|
| 1 | Visible light pool and falloff | **Partly fixed.** The cloth is warm peach and falls off mildly (221 at centre to 201-206 at the edges). The form split on subjects is still about 15 luma. The grey corner got **worse** (blocker 1). |
| 2 | Glazey belly and arms | **Partly fixed.** The arms droop, and the back crater and lumps are gone (strip f2 is smooth). The belly is still a low, ringed lens. A new problem: a pointed gumdrop head on stages 0-2. |
| 3 | Classic glaze translucency | **Not fixed.** |
| 4 | Emissive glow | **Not fixed.** |
| 5 | Props to hero quality | **Not fixed.** |
| 6 | Hero composition and rainbow overlap | **Partly fixed.** The rainbow no longer covers the chocolate's dough band. The top 25 % is still empty. |
| 7 | Flavour identities | **Partly fixed.** The jelly now sits in a toasted split (good). The blueberry has lobes but is mirror-glossy. The rainbow and maple are not fixed. |
| 8 | Detached shadows and canopy sprinkles | **Partly fixed.** Fewer sprinkles break the silhouette, but they are still flat bars. The detached shadow blob and disc are unchanged. |
| 9 | Contact shadows | **Mostly fixed.** There is a core of 15-28 % under the feet, against a 30 % target. The crumbs are still ungrounded. |
| 10 | Dough band and stands | **Not fixed.** The dashed stand rings and square legs remain. The bite pockets are khaki again. |

M3-iter4-r2 blocker (the chimney firefly): **fixed.** The maximum luma in the chimney cap region is 216, and there is no coloured ring. The fix caused blocker 2.

## What is working (keep it)
- **Chocolate and pink sprinkle donuts:** still the best materials in the gate, with continuous glossy specular, beaded drips and capsule sprinkles.
- **Jelly in a split:** the red jelly now reads as oozing from the dough band, not glued on.
- **Blueberry silhouette:** the irregular lobes are the right direction; only the sheen is wrong.
- **Warm cloth tone** in the lit area: keep it and extend it to the frame edges.
- **Contact cores:** the stands now sit on the floor.
- **Glazey's face and tuft:** big glossy eyes with 2x2 glints, soft blush, stage-5 bliss arcs, and a clean rainbow tuft from every angle. The back is now smooth.
- **Bakery, lighthouse body, pier:** charming and clean.
- **Low tier:** effectively identical to high, with no broken effects.

## Store-page test: no
- **Hero (gallery-donuts):** it still reads as a clean CG asset sheet, not reference 04's mouth-watering studio photo.
  - The centrepiece rainbow has staircase bands and debug-coloured slab drips.
  - The classic is peach plastic.
  - The maple is matte.
  - The top quarter is empty cloth, and a grey smudge sits in the top-right corner.
- **Glazey:** cute faces, but with gumdrop heads, slot mouths and low ringed bellies it would not survive a side-by-side with sheet 03, and a third of its frame is a grey wall.

## Regression check
- **M0 and M1:** this commit touches only `mesh.ts` (normals on relaxed corners), studio, gallery and asset files, plus `Materials.ts`. The M1 terrain uses the mesher, but the change is limited to relaxed-corner normals, and I saw no change in the M2 terrain re-render that shares it. There is no regression attributable to M3.
- **M2 (`shots/M2/m3i5reg/` vs `shots/M2/final/`):**
  - **m2-hero:** mean diff 2.2/255. The island, lagoon, trees, lighthouse and clouds match. No regression.
  - **m2-lagoon-edge and m2-low-tier:** mean diff about 1.9. No regression.
  - **m2-closeup-donut:** mean diff 6.2, mostly from grass sway. The donut's glaze highlight and dough band are equivalent. Neutral.
  - **m2-ground:** the iter4-r2 chimney firefly is **fixed**. However, the foreground donut has lost its sprinkle glints and its dough band is flatter (**blocker 2**).

```json
{"gate":"M3","iter":5,"verdict":"FAIL","mean":6.5,"min":5,"blockers":2,"store_page":false}
```
