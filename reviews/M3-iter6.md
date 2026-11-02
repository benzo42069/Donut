# Review M3 iter 6
## Verdict: FAIL

I captured these myself with `npm run shots -- --gate M3 --iter 6` at commit `01fe42a`. The harness used the GPU path (ANGLE Metal, Apple M4) and wrote 14 files to `shots/M3/6/`.
- I viewed every 1920x1080 and 844x390 frame, the strip composite and strip frame f1.
- I viewed 1.4-2.5x crops of: the rainbow; the classic; the blueberry and swirl; the top row; Glazey stages 0-1 and 4-5; the crystal and rock; the lighthouse lamp and cloud; the cotton-candy tree and its shadow; the pier and fence; the hanging-donut tree and the pink sprinkle tree; and the bitten classic.
- I sampled 5x5 pixel means in the backdrop corners and centre, the bite pockets, the classic glaze and rim, the crystal, the lamp, and Glazey's lit and shaded sides.
- For the regression check I re-rendered M0, M1 and M2 at HEAD into `shots/M*/m3i6reg/` and diffed them against each `final/` and against the iter-5 re-renders.
- Before capturing, I read `art/reference/NOTES.md` and viewed all four references. The primary references for this gate are 04 (donut lineup, studio) and 03 (Glazey sheet).

**Summary:** iter 6 changed only light and material code (`studio.ts`, `Materials.ts`, `mesh.ts` normals, two palette entries).
- **Both iter-5 blockers are resolved or downgraded:**
  - The M2 sprinkle glints are back and the chimney stays clean.
  - The grey corner is now a dusty-rose falloff, no longer a neutral grey.
- **No asset was touched.** Every asset problem from fix items 3-10 of iter 5 is pixel-identical:
  - the rainbow, classic, maple and blueberry;
  - Glazey's body, belly and mouth;
  - the props and emissives;
  - the bite pockets;
  - the motion strip.
- **Result:** the gate mean is about **6.55**. That is +0.05 on iter 5 and level with iter 2. With **zero blockers** this still fails on every score criterion and the store-page test.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | – | – | 6.9 |
| gallery-glazey-belly | 7 | 6 | 6 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | – | – | 6.3 |
| gallery-glazey-belly_strip | 7 | 6 | 6 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | 5 | – | 6.2 |
| gallery-props | 7 | 6 | 6 | 6 | 7 | 5 | 6 | 7 | 7 | 6 | – | – | 6.3 |
| gallery-donut-bites | 7 | 7 | 6 | 6 | 6 | 6 | 7 | 7 | 7 | 7 | – | – | 6.6 |
| gallery-low-tier | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | – | 8 | 7.0 |

- **Gate mean:** about **6.55**. The bar is 9.0, or 8.5 for low-tier.
- **Minimum:** **5** (strip motion; props materials).
- **Categories at 8 or above:** only low-tier acceptability (one score). Every other category in every shot is below 8.
- **Trend:** 6.55, 6.6, 6.65, 6.5, 6.55. That is five iterations within 0.15 of each other. The plateau rule (§5) applies again, and parameter changes cannot close a 2.45-point gap.

## Blockers
None this iteration. Both iter-5 blockers are resolved or downgraded; see the status table below.

The upper-right backdrop falloff (fix 1) is still a visible defect, but it is no longer the neutral grey that triggers §10.6:
- Samples: (1900,20) = 187,165,159 (hue 13, sat 0.15, luma 169); (1700,200) = 205,181,172 (hue 16, sat 0.16).
- I scored it under composition, lighting and tech instead of as a blocker.

## Fix list (priority order; max 10; each concrete and testable)
None of items 2-9 below can be fixed with lighting. They are assets. I list them in order of visual payoff.

1. **Re-author Glazey against sheet 03. This is the fifth review asking, and it is the single biggest payoff in the gate.**
   - **Where:** `src/art/models/glazey.ts`.
   - **Unchanged since iter 5:**
     - **Head:** stages 0-2 are pointed gumdrop cones that taper into the tuft (gl_left crop, x 120-330, y 420-650).
     - **Mouth:** a rectangular slot.
     - **Belly:** a low lens with concentric contour rings in the bottom quarter of the body. At stage 4 it spans y 565-625 on a body spanning y 380-650.
     - **Surface:** a quilted checker of shading tiles on stages 4-5 at 1:1 (x 1290-1840, y 400-560).
   - **Target:**
     - A rounded-box crown with a near-flat top at stages 0-3.
     - An upturned open smile with a visible tongue.
     - A broad oval belly whose top reaches at least 45 % of body height, with no rings at 1:1.
     - No tile pattern at 1:1.
     - In side view the arm reads as an arm, not the nose-like nub seen in strip f1.
2. **Give the strip real motion. This is the sixth review asking; rubric 11 stays at 5 until it is done.**
   - **Where:** the strip definition in `src/debug/scenes/gallery.ts`.
   - **Problem:** it is still a front/side/back turnaround.
   - **Target:**
     - One frame catches a belly-stage change mid-wobble, with overshoot visible in the silhouette.
     - One frame shows a land or munch squash (width at least 110 % of rest) or a stretch, with crumbs in flight.
3. **Rebuild the rainbow centrepiece. This is the fourth review asking.**
   - **Where:** the rainbow look in `src/art/models/donut.ts`.
   - **Unchanged since iter 5:**
     - **Band borders:** serrated staircases, worst on red/orange and orange/yellow at x 800-1120, y 470-545.
     - **Drips:** four flat slabs of yellow, green, blue and violet hanging under the red band (x 820-1125, y 540-590). This is reference 04's Ignore item, "stray green and rainbow artifacts".
     - **Hole rim:** a sawtooth dough rim (x 900-1010, y 455-475).
     - **Glow:** none.
   - **Target:**
     - Band borders smooth or blended over 1-2 voxels.
     - Each drip rounded, tapered and the colour of the band directly above it.
     - A smooth hole rim.
     - A soft halo, per fix 5.
4. **Make the classic glaze translucent. This is the fifth review asking.**
   - **What changed:** the new `rim: 0.8` added a cool, desaturated sheen on the classic's left and front edges: (380,730) = 248,222,209, sat 0.15; (412,820) = 243,219,215, sat 0.11. On the bitten classics there is a grey-lilac band along the glaze overhang at the cut: (1580,605) = 163,144,137, luma 148.
   - **Why it fails:** the glaze reads as cling film or wax, not glass. The coat is still an opaque peach (420,720 = 246,196,158) covering about 85 % of the side height, with no dough showing through.
   - **Where:** the classic look in `donut.ts` and the translucency path in `Materials.ts`.
   - **Target (reference 04, bottom-left):**
     - A warm golden tint-through where the glaze is thin.
     - A warm, not lilac, grazing rim.
     - Thin translucent drips.
     - At least 30 % of the side height showing dough.
     - At least 12 % luma separation from the backdrop.
5. **Make the emissives glow. This has been unchanged since iter 1.**
   - **Where:** `bloomThreshold` in `studio.ts`, the crystal emissives and the lamp material in `props.ts`.
   - **Problem:**
     - The crystal (x 1215-1300, y 705-850) measures 222,203,245, sat 0.17, luma 210: a washed pastel with no halo and no core.
     - The lighthouse lamp (x 525-630, y 155-250) is a beige bagel with a pink dot, 245,210,189, the same value as the backdrop around it.
   - **Target:**
     - A visible soft halo on the crystal, lamp and rainbow.
     - Crystal cores at sat ≥ 0.45.
     - A lamp at least 25 luma brighter than the surrounding backdrop.
6. **Bring the props up to hero quality.** These are unchanged since iter 4.
   - **Where:** `props.ts`, `sprinkleTree.ts`, and the props layout in `gallery.ts`.
   - **Problems:**
     - **Fence:** waffle-slab rails (x 580-985, y 730-800).
     - **Pretzel trunk:** a staircase twist (x 320-375, y 500-735).
     - **Rock:** a mould-like white cap with brown holes (x 1355-1540, y 720-850).
     - **Hanging donuts:** boxy rings with no stems (x 1420-1630, y 490-570).
     - **Pink sprinkle tree:** its canopy sprinkles are flat 1xN bars painted on the surface (x 1590-1830, y 590-800).
     - **Detached shadow:** the cotton-candy canopy still throws a shadow blob and a floating disc (x 20-330, y 470-570).
   - **Target:**
     - Rounded candy-stick rails.
     - A smooth twisted trunk.
     - Sugar dusted only on the rock's top faces, with no holes.
     - Gallery-quality hanging donuts on visible stems.
     - Half-sunk 1x1x3 capsule sprinkles.
     - Every shadow attached to its caster.
7. **Finish the backdrop falloff (partly fixed).**
   - **Where:** `studioClothGlow`, the emissive intensity, the hemisphere and the vignette in `studio.ts`.
   - **Problem:** the upper-right of gallery-glazey-belly, the strip and gallery-props is still a dusty-rose patch: hue 13-16, sat 0.15, luma 169-185. The rest of the cloth is peach (hue 23-26, sat 0.23).
   - **Target:**
     - Hue within ±4° of the cloth centre in all frames.
     - Corners at luma ≥ 180.
     - No visible colour shift where the pool ends.
8. **Make the bite pockets appetising and ground the crumbs.**
   - **Where:** `studioOcclusion` and N8AO in `studio.ts`, the crumb palette in `donut.ts`, and `scatterCrumbs` in `gallery.ts`.
   - **Problem:**
     - The pocket occlusion is still khaki-olive: (1500,620) = 156,130,90, hue 35, sat 0.42; (1360,380) = 157,128,87. At 2x the pockets read as grey-green mould blotches.
     - The floor crumbs have no contact shadow.
     - There are no crumbs on the stand tops.
   - **Target:**
     - Pocket occlusion in the toasted `#B86B32` family, hue 25-30 and sat ≥ 0.55.
     - A soft contact shadow under each crumb.
     - 4-8 crumbs on the stand under each bite.
9. **Finish the remaining flavour identities.** All of these are unchanged.
   - **Maple:** matte orange plastic with no amber specular streak.
   - **Blueberry:** mirror-wet lavender jelly with white hot glints. It needs a satin sheen and lit cracks.
   - **Stands:** dashed rings of dark dots on the tops, and square-post legs.
10. **Light: subject form split and hero composition.**
    - **Form split:** Glazey stage 5 measures lit 157-161 against shaded 139-151, a 10-20 luma split. The target is ≥ 35, via the key:fill ratio.
    - **Composition:** the top 25 % of gallery-donuts (y 0-265) is still empty cloth. Tighten the framing or raise the camera so the lineup fills the frame the way reference 04 does.

**Plateau and escalation note (§5, §6):**
- This is the fifth consecutive iteration with less than 0.3 of improvement, and six of the eight iterations are spent.
- Iter 6 shows plainly that light and material tuning has run out. It fixed two regressions it had itself introduced and moved the mean by 0.05.
- Iters 7-8 cannot reach 9.0 unless fixes 1-6 land as a single committed asset re-authoring pass.
- If the builder does not intend to re-author `glazey.ts`, the rainbow, the classic and the props next iteration, it should escalate to the user now rather than spend the last two iterations.

## Previous review: status of the M3-iter5 fix list
| # | item | status |
|---|---|---|
| 1 | Kill the grey backdrop (blocker 1) | **Partly fixed.** It is no longer neutral grey: sat rose from 0.04 to 0.15, and corner luma from 141 to 169. It is still off-hue (13-16 against 23-26) and visibly duller on Glazey, the strip and props. It misses the iter-5 targets of hue ≥ 15 and corner luma ≥ 175 at the extreme corner. It is no longer a blocker. |
| 2 | Restore the M2 sprinkle glints without bringing back the chimney firefly (blocker 2) | **Fixed.** The foreground donut in `m2-ground` shows 3-4 warm glints across the sprinkle row (slightly fewer than final, but present). The chimney cap is clean with no ring. |
| 3 | Re-author Glazey's belly, body and mouth | **Not fixed.** Pixel-identical. |
| 4 | Real motion in the strip | **Not fixed.** |
| 5 | Rainbow centrepiece | **Not fixed.** |
| 6 | Classic translucency | **Not fixed.** The new rim adds a cool cling-film sheen, which is the wrong direction. |
| 7 | Emissive glow | **Not fixed.** |
| 8 | Props to hero quality | **Not fixed.** |
| 9 | Bite pockets and crumbs | **Not fixed.** Pocket samples are identical to iter 5 (152,125,83 then; 156,130,90 now). |
| 10 | Light, maple, blueberry, stands | **Not fixed.** |

## What is working (keep it)
- **Chocolate and pink sprinkle donuts:** still the best materials in the gate, with continuous glossy specular, beaded drips and capsule sprinkles. The restored specular gives the pink sprinkles their pop again.
- **Jelly in a toasted split, and the blueberry's lobed silhouette.**
- **Warm peach cloth** across about 85 % of every frame, and contact cores under the stands.
- **Glazey's face:** big glossy eyes with 2x2 glints, soft blush, stage-5 bliss arcs, and a clean 5-stripe tuft from every angle.
- **Bakery, lighthouse body, pier:** charming and clean.
- **M2 regression fixed at the root:** the clamps were removed and the 6³/4³ normal window was scoped instead. Keep this approach.
- **Low tier:** effectively identical to high, with no broken effects.

## Store-page test: no
- **Hero (gallery-donuts):** it would not sit next to reference 04 or any premium title. It reads as a clean CG asset sheet:
  - The centrepiece rainbow has staircase bands and debug-coloured slab drips.
  - The classic is waxy peach plastic.
  - The maple is matte.
  - Nothing glows.
  - The top quarter is empty cloth.
- **Glazey:** the faces are cute, but gumdrop heads, slot mouths and low ringed bellies would not survive a side-by-side with sheet 03.

## Regression check
- **M0** (`m0-test-cube`, `m0-low-tier`): the diff against final is 36/255, but against the iter-5 re-render it is only 0.15/255. The iter-6 `mesh.ts` normal change therefore had no measurable effect. The large final-to-HEAD delta is the pre-existing global grade change that iter5-r2 judged equal or better. **No new regression.**
- **M1** (`m1-terrain`, `m1-low-tier`): the diff against final is 26/255 and against iter 5 is 0.12/255. Same conclusion. **No new regression.**
- **M2** (`shots/M2/m3i6reg/` against `shots/M2/final/`):
  - Mean diffs are 1.2-2.2/255 across all five shots.
  - **m2-ground:** the sprinkle glints have returned and the chimney is clean, so iter-5 blocker 2 is **resolved**.
  - **m2-hero, m2-lagoon-edge, m2-closeup-donut, m2-low-tier:** these match final. **No regression.**

```json
{"gate":"M3","iter":6,"verdict":"FAIL","mean":6.55,"min":5,"blockers":0,"store_page":false}
```
