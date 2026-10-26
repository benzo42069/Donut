# Review M3 iter 7
## Verdict: FAIL

I captured these myself with `npm run shots -- --gate M3 --iter 7` at commit `2a4a5d8` (working tree clean). The harness used the GPU path (ANGLE Metal, Apple M4) and wrote 14 files to `shots/M3/7/`.
- I viewed every 1920x1080 and 844x390 frame, the strip composite, and strip frames f1 and f2 (side and back).
- I viewed 1.4-2.5x crops of: the rainbow; the classic; the maple; the blueberry and swirl; Glazey stages 0-2 and 3-5; the side and back turntable rows; the props left (cotton-candy tree, lighthouse), the props right (trees, crystal, rock), the pier and fence; the crystal and lamp; and the right-hand bitten pair.
- I sampled 5x5 pixel means in the backdrop corners and centre, the classic glaze, the rainbow, the bite pockets and glaze cut, the crystal, and Glazey's lit and shaded sides.
- I diffed every shot against iter 6 (`shots/M3/6/`). Hero and low-tier changed (mean 11-16/255, mostly from the reframed camera). Glazey, props, bites and strip changed by only 1-4/255.
- For the regression check I re-rendered M0, M1 and M2 at HEAD into `shots/M*/m3i7reg/` and compared them with each `final/` (M2 against the user-approved GPU `shots/M2/final/`).
- Before capturing, I read `art/reference/NOTES.md` and viewed all four references. The primary references for this gate are 04 (donut lineup, studio) and 03 (Glazey sheet).

**Scope note.** Following the user ruling recorded in `docs/PROGRESS.md` (commit `2a4a5d8`), rubric 11 (motion) is scored as not applicable. The strip is judged as a front/side/back turntable. Every other category, the instant-fail list and the pass bar apply unchanged. This ruling does not change the verdict: the gate fails by a wide margin even without category 11.

**Summary:** iter 7 is the first iteration since iter 3 to touch the assets, and it shows:
- **Glazey** now has an open, upturned smile with a tongue, a rounder crown and a taller belly.
- **The rainbow's** stray-coloured drips are gone.
- **The classic** shows more dough.
- **The lighthouse lamp** has a halo.
- **The hero** is framed tighter.

These are real gains, but they are small against a 2.4-point gap. Everything else is pixel-identical to iter 6: the props, the bite pockets, the backdrop corner, the maple and blueberry, the stands, Glazey's surface tiling, belly rings and side-view arm, and the rainbow's staircase bands and hole rim.
- **Gate mean:** about **6.58** (+0.03 on iter 6).
- **Blockers:** zero.
- **Result:** it fails every score criterion and the store-page test.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | n/a | – | 6.9 |
| gallery-glazey-belly | 7 | 6 | 6 | 6 | 7 | 6 | 6 | 6 | 8 | 6 | – | – | 6.4 |
| gallery-glazey-belly_strip (turntable) | 6 | 6 | 6 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | n/a (user ruling) | – | 6.2 |
| gallery-props | 7 | 6 | 6 | 6 | 7 | 6 | 6 | 7 | 7 | 6 | – | – | 6.4 |
| gallery-donut-bites | 7 | 7 | 6 | 6 | 6 | 6 | 7 | 7 | 7 | 7 | – | – | 6.6 |
| gallery-low-tier | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | – | 8 | 7.0 |

- **Gate mean:** about **6.58**. The bar is 9.0, or 8.5 for low-tier.
- **Minimum:** **6** (lighting in every shot; Glazey AO, materials, voxel form and tech; props composition, AO, materials, voxel form and tech; bites lighting, AO, colour and materials; the strip's reference fidelity).
- **Categories at 8 or above:** two of the 61 scored. These are Glazey's charm (up from 7, for the new smile) and low-tier acceptability.
- **Trend:** 6.55, 6.6, 6.65, 6.5, 6.55, 6.58. That is six iterations within 0.15 of each other.

## Blockers
None.
- **Backdrop corner:** the upper-right corner is still the dusty-rose patch from iter 6. In gallery-glazey-belly, (1900,20) = 187,165,159, hue 12, sat 0.15; in gallery-props, (1900,20) = 188,166,160. It is off-hue, but it is not the neutral grey of §10.6, so I scored it under composition and tech.
- **Bite pockets:** the khaki pockets come close to §10.5 "muddy browns", but they are a small area, and I scored them under colour and materials. This is the same treatment as previous rounds.

## Fix list (priority order; max 10; each concrete and testable)
Lighting is not the problem in this gate. The remaining gap is asset quality, and every item below except 7 and 10 is an asset edit.

1. **Finish re-authoring Glazey (partly fixed; still the biggest payoff).**
   - **Where:** `src/art/models/glazey.ts`, plus the decal and belly-ring logic.
   - **Still wrong:**
     - **Belly rings:** the belly still shows concentric contour rings, visible at 1:1 on every stage (stage 0 at x 175-250, y 575-610; stage 3 at x 1060-1160).
     - **Surface tiling:** the body surface still reads as a quilted checker of shading tiles at 1:1 on stages 3-5 (x 1000-1840, y 420-560).
     - **Belly height:** I measured the belly top at about 37-40 % of body height on stage 4 (body y 402-650, belly top y about 557). That is below the 45 % target.
     - **Stage 0-2 silhouette:** these are bell-shaped, with a flared skirt at arm height and fused feet. Sheet 03 has a rounded box with separate stubby feet.
     - **Side view (strip f1):** the arm is a downward nose-like cone that dominates the profile. The belly shows as a thin yellow sliver, and the eye decal sits proud of the silhouette, with a sliver of eye floating at the edge on stage 5.
   - **Target:**
     - No rings and no tile pattern at 1:1.
     - Belly top at or above 45 % of body height, and visibly convex in side view.
     - Two distinct stubby feet.
     - Side view: a short rounded arm stub that sits in the body outline (sheet 03 side), with the eye conformed to the surface.
2. **Rebuild the rainbow centrepiece (partly fixed).**
   - **Where:** the rainbow look in `src/art/models/donut.ts`.
   - **Fixed:** the drips are now the band colour above them.
   - **Still wrong:**
     - **Band borders:** still serrated staircases on red/orange and orange/yellow (x 800-1130, y 450-540).
     - **Hole rim:** the inner pink band has a sawtooth edge, and a jagged orange dough blob shows inside the hole (x 920-1010, y 455-480).
     - **Hot spot:** there is a hard white specular hot spot at the bottom of the hole (around 965,485).
     - **Glow:** none. The palette went pastel (960,470 = 252,179,146), so it no longer reads as the "mega" donut. It is the least special-looking donut in the middle of the lineup.
   - **Target:**
     - Smooth band borders, blended over 1-2 voxels.
     - A clean, rounded hole rim.
     - A soft halo or bloom that is visible against the cloth.
     - Saturation at least one step above its neighbours, so the centrepiece wins the value and chroma contrast (§4 value structure).
3. **Make the classic glaze translucent (partly fixed).**
   - **Where:** the classic look in `donut.ts`, and the translucency path in `Materials.ts`.
   - **Fixed:** more dough shows (about 25-35 % of the side height in the scallops), and the lilac cling-film rim is gone from the front.
   - **Still wrong:**
     - The glaze is an opaque peach fondant: (420,720) = 245,193,153, sat 0.38, uniform over the whole top, with no dough tint showing through where the glaze is thin.
     - The hole edge of the glaze is a jagged staircase over orange dough (x 390-500, y 745-790).
     - On the bitten classics, the grey band along the glaze cut remains: (1580,605) = 154,136,130, sat 0.16.
   - **Target (reference 04, bottom-left):**
     - A thin, glassy coat that shows golden dough through it at the crest and edges.
     - A smooth hole rim.
     - A warm cut edge.
4. **Bring the props up to hero quality (not fixed; pixel-identical to iter 6).**
   - **Where:** `props.ts`, `sprinkleTree.ts`, and the props layout in `gallery.ts`.
   - **Still wrong:**
     - **Fence:** waffle-slab rails (x 580-985, y 730-800).
     - **Pretzel trunk:** a staircase twist (x 320-375, y 500-735).
     - **Rock:** a white cap with brown holes (x 1355-1540, y 720-850).
     - **Hanging donuts:** boxy rings with no visible stems (x 1420-1630, y 490-570).
     - **Canopy sprinkles:** flat 1xN bars painted on the pink and green trees.
     - **Shadows:** a floating shadow disc on the cloth at far left (x 30-120, y 535-565) that belongs to no visible caster.
   - **Target:**
     - Round candy-stick rails.
     - A smooth twisted trunk.
     - Sugar dusted on the rock's top faces only.
     - Hanging donuts on stems.
     - Sunk 1x1x3 capsule sprinkles.
     - Every shadow attached to a caster.
5. **Make the emissives glow (partly fixed).**
   - **Where:** the crystal and lamp materials in `props.ts`, and bloom in `studio.ts`.
   - **Fixed:** the lamp now has a soft halo.
   - **Still wrong:**
     - **Lamp:** it is still a pale cream disc that is barely brighter than the cloth, so it reads as ghostly, not lit.
     - **Crystal:** it is a flat pastel gummy (1255,760) = 180,151,246, sat 0.39, with no bright core and no visible bloom.
     - **Rainbow:** no glow (see item 2).
   - **Target:**
     - A lamp core at least 25 luma above the surrounding cloth, with a warm, saturated centre.
     - Crystal cores at sat ≥ 0.45, with a visible inner gradient and halo.
6. **Make the bite pockets appetising (not fixed).**
   - **Where:** `studioOcclusion` and N8AO in `studio.ts`, the crumb palette in `donut.ts`, and `scatterCrumbs` in `gallery.ts`.
   - **Still wrong:**
     - **Pockets:** still khaki-olive, (1500,620) = 151,125,83 and (1360,380) = 154,125,82. At 1.6x they read as grey-green mould blotches inside the crumb (bites_r crop).
     - **Crumbs:** none on the stand tops, and the floor crumbs float with no contact shadow.
   - **Target:**
     - Pocket shading in the toasted `#B86B32` family, hue 25-30, sat ≥ 0.55.
     - 4-8 crumbs on each stand under the bite.
     - A soft contact shadow under every crumb.
7. **Fix the backdrop corner (not fixed; identical samples to iter 6).**
   - **Where:** `studioClothGlow`, the hemisphere and the vignette in `studio.ts`.
   - **Problem:** the upper-right of gallery-glazey-belly, the strip and gallery-props is still hue 12-15, sat 0.15, luma 170-186. The cloth centre is hue 23-25, sat 0.23.
   - **Target:**
     - Hue within ±4° of the centre.
     - Corner luma ≥ 180.
     - No visible mauve wedge.
8. **Finish the flavour identities and stands (not fixed).**
   - **Maple:** still matte orange plastic with no amber streak. It sits on a stand that is too small, with no contact line, so it reads as a hot-dog bun balanced on a stool.
   - **Blueberry:** still wet lavender jelly with hot white glints. It needs a satin sheen and lit cracks.
   - **Swirl:** the band borders are stair-stepped at 1.5x.
   - **Stands:** still have dashed rings of dark dots on the tops and square-post legs.
9. **Fix Glazey's form lighting.**
   - **Problem:** stage 5 still measures lit 159-166 against shaded 149-159, a 10-17 luma split. The figures read flat, with no terminator.
   - **Target:** a split of ≥ 35, via the key:fill ratio for the Glazey shot or a rim/key rig, without regressing M2.
10. **Hero composition (partly fixed).**
    - **Fixed:** FOV 27 removed some empty cloth.
    - **Still wrong:** y 0-235 (22 %) is still bare.
    - **Target:** the lineup fills the frame edge to edge, as in reference 04, with a soft cloth fold or gradient in the top band so it is not dead space.

**Plateau and escalation note (§5, §6):**
- This is the sixth consecutive iteration with less than 0.3 of improvement. Iteration 8 is the last before mandatory escalation.
- Iter 7 showed that asset edits do move the needle where parameter changes did not: Glazey's charm reached 8.
- Even so, closing 2.4 points in one iteration would need items 1-6 to land together. I do not expect that, and the builder should prepare the §6 escalation alongside iter 8.

## Previous review: status of the M3-iter6 fix list
| # | item | status |
|---|---|---|
| 1 | Re-author Glazey against sheet 03 | **Partly fixed.** The crown is rounded and the smile is open and upturned with a tongue, which is a real charm gain. The belly is taller, but its top is at about 37-40 %, short of the 45 % target. The belly rings, the 1:1 tile pattern and the nose-like side arm are unchanged. |
| 2 | Real motion in the strip | **N/A** (out of scope for M3 by user ruling). |
| 3 | Rainbow centrepiece | **Partly fixed.** Drips now match their band and are shorter. The staircase bands, sawtooth hole rim and missing glow remain. |
| 4 | Classic translucency | **Partly fixed.** More dough shows and the cool rim is reverted. The glaze is still opaque, with no tint-through, and the grey cut band remains. |
| 5 | Emissive glow | **Partly fixed.** The lamp has a halo, and crystal saturation rose from 0.17 to 0.39-0.47. The crystal has no core, and the lamp is still pale. |
| 6 | Props to hero quality | **Not fixed.** |
| 7 | Backdrop falloff | **Not fixed.** The samples are identical to iter 6. |
| 8 | Bite pockets and crumbs | **Not fixed.** Pocket at 151,125,83 against 156,130,90 in iter 6. |
| 9 | Maple, blueberry, stands | **Not fixed.** |
| 10 | Form split and hero composition | **Partly fixed.** The framing is tighter, but the form split is unchanged. |

## What is working (keep it)
- **Glazey's new face:** big glossy eyes with 2x2 glints, soft blush, an open smile with a tongue, and the stage-5 bliss arcs. At 844x390 the row reads as a cute, consistent family, and the tuft is clean from every angle. The coral is consistent front, side and back, which fixes the reference's back-view pink.
- **The chocolate and pink sprinkle donuts:** still the best materials in the gate.
- **The jelly split and the blueberry's lobed silhouette.**
- **The rainbow drips** now belong to their band.
- **The bakery, lighthouse body and pier:** charming and clean. The pier's rope-bound posts are the best prop detail in the gate.
- **The low tier** is effectively identical to high (0.7/255 mean diff), with no broken effects.
- **No M2 regression** after the rebaseline.

## Store-page test: no
- **Hero (gallery-donuts):** next to reference 04 it still reads as a clean CG asset sheet, not a premium diorama:
  - The centrepiece rainbow is pastel, stair-banded and does not glow.
  - The classic is opaque peach fondant.
  - The maple is a matte bun on an undersized stool.
  - The stands have dotted debug-like rings.
  - A fifth of the frame is bare cloth.
- **Glazey:** the faces now have real appeal, but the bell bodies, belly rings, tile shading and side-view nose-arm would not survive a side-by-side with sheet 03.

## Regression check
- **M0** (`m0-test-cube`, `m0-low-tier`): identical to the iter-6 re-render (0.00/255). The 36/255 delta to `final/` is the pre-existing global grade change that earlier reviews judged equal or better. **No new regression.**
- **M1** (`m1-terrain`, `m1-low-tier`): 0.02-0.03/255 against the iter-6 re-render. Same conclusion. **No new regression.**
- **M2**, against the user-approved GPU `shots/M2/final/`: mean diffs are 1.0-1.4/255 across all five shots. I compared each pair side by side.
  - **m2-hero, m2-lagoon-edge, m2-closeup-donut, m2-low-tier:** these match final. The island donuts keep their sprinkles, the chimney and lamp are unchanged, and the lagoon glare is equivalent.
  - **m2-ground:** the foreground sprinkle glints are present (103 pixels at luma > 240 against 70 in final, with a similar peak of 249 against 250), and the chimney is clean.
  - **No regression.**

```json
{"gate":"M3","iter":7,"verdict":"FAIL","mean":6.58,"min":6,"blockers":0,"store_page":false}
```
