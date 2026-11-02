# Review M3 iter 8
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M3 --iter 8` at commit `c656127`, with a clean working tree. The harness used the GPU path (ANGLE Metal, Apple M4) and wrote 14 files to `shots/M3/8/`.

What I looked at:
- Every 1920x1080 frame, the 844x390 Glazey and low-tier frames, and the strip composite.
- Native-resolution crops of: the rainbow, the classic, the maple, Glazey stages 0-1 and 4-5, the side (f1) and back (f2) turntable rows, the right-hand bitten classic, the right-hand props (trees, crystal, rock) and the left-hand props (cotton-candy tree, lighthouse, pier, fence).
- 5x5 pixel means in the backdrop corners and centre, the rainbow, the classic glaze, the crystal, the bite pockets and the glaze cut, and Glazey's lit and shaded sides.
- A per-shot diff against iter 7 (`shots/M3/7/`).
- Beforehand, I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4 and `art/reference/NOTES.md`, and viewed all four references. 04 (studio lineup) and 03 (Glazey sheet) are the primary references for this gate.

**Scope note.** Per the user ruling recorded in `docs/PROGRESS.md`, I scored rubric 11 (motion) as not applicable and judged the strip as a front/side/back turntable. Everything else applies in full. The ruling does not change the verdict.

**What changed.** `git diff 2a4a5d8 c656127 -- src/` shows four parameter edits:
- `hueHold` 0.25 → 0.5.
- A warm hemisphere at 0.4.
- A key cone of `ext*2.3`.
- A long-lens Glazey camera (`gallery.ts`), plus one belly constant in `glazey.ts` (`bellyTop` gap 0.6 → 0.15).

The donut, props and bite shots moved by only **1.0-2.0/255** mean against iter 7, so they are visually identical. Only the Glazey shot and the strip changed (9.9 and 8.6/255, mostly from the new camera).

**Plateau rule.** This is the seventh consecutive iteration with less than 0.3 of improvement. AGENTIC_LOOP §5 required a structural change; iter 8 is again parameter tweaks. Every open item from iter 7 that needed an asset re-author (rainbow, classic, props, bite pockets, belly rings, side arm) is untouched.

**Result:** gate mean about **6.6**. There are no blockers, but the gate fails pass-bar rules 2, 3 and 4. This was iteration 8, so §6 escalation to the user is now mandatory.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | n/a | – | 6.9 |
| gallery-glazey-belly | 7 | 6 | 7 | 6 | 7 | 6 | 6 | 6 | 8 | 6 | – | – | 6.5 |
| gallery-glazey-belly_strip (turntable) | 6 | 6 | 6 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | n/a (user ruling) | – | 6.2 |
| gallery-props | 7 | 6 | 6 | 6 | 7 | 6 | 6 | 7 | 7 | 6 | – | – | 6.4 |
| gallery-donut-bites | 7 | 7 | 6 | 6 | 6 | 6 | 7 | 7 | 7 | 7 | – | – | 6.6 |
| gallery-low-tier | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | – | 8 | 7.0 |

- **Gate mean:** about **6.6**. The bar is 9.0, or 8.5 for low tier.
- **Minimum:** 6.
- **Categories at 8 or above:** two of 61 (Glazey's charm and low-tier acceptability).
- **Glazey lighting rose 6 → 7.** On stage 5 at belly height, the shaded left (1680,560) is luma 109 and the lit right (1860,560) is luma 155. That 46-luma split meets the iter-7 target of at least 35, and the figures now have a terminator.
- **Trend:** 6.55, 6.6, 6.65, 6.5, 6.55, 6.58, 6.6.

## Blockers
None. I found no art bible §10 instant-fail item in any shot, and no regression (see the regression check).
- **Props backdrop corner:** the upper-right corner of gallery-props is still a mauve wedge, (1900,20) = 193,169,160, hue 16, sat 0.17, luma 175. It is not hueless grey, so it is not §10.6, and I scored it under composition and tech, as in previous rounds.

## Fix list (priority order; max 10; each concrete and testable)
Lighting parameters cannot close a 2.4-point gap. Every item except 8 is an asset edit.

1. **Rebuild the rainbow centrepiece (not fixed; identical to iter 7).**
   - **Where:** the rainbow look in `src/art/models/donut.ts`, and the emissive and bloom settings in `studio.ts`.
   - **Problem:**
     - It is still pastel: (960,470) = 253,179,149, sat 0.41, unchanged despite the hue-hold change.
     - The band borders are hard, single-voxel colour steps, and the red band's outer edge is serrated (x 790-1140, y 470-540).
     - The bottom of the hole is a milky pink-white glare blob, (980,440) = 205,213,250 at sat 0.18, with a jagged dough lump.
     - There is no glow on the cloth.
   - **Target:**
     - Band borders blended over 1-2 voxels.
     - A clean, rounded hole rim with no blown glare.
     - Saturation above every neighbour's, and a visible soft rainbow halo on the cloth, as in reference 04.
2. **Re-author Glazey's belly and side profile (partly fixed).**
   - **Where:** `src/art/models/glazey.ts` (the belly decal and the arm SDF).
   - **Fixed:** the belly top now sits right under the mouth, and the long lens removed the lopsided skew of the end figures.
   - **Still wrong:**
     - The belly is still a wide, flat-topped lens with concentric terrace rings, visible at 1:1 on every stage (for example stage 4, x 1385-1530, y 550-625).
     - Stages 0-1 are still bell-shaped, with a flared skirt and fused, lumpy feet (x 55-285, y 560-655).
     - **Side view (strip f1):** the arm is still a downward, nose-like cone that dominates the profile. The belly is a thin yellow sliver. On stage 5 the eye is a black sliver standing proud of the silhouette at the right edge.
   - **Target:**
     - A smooth, convex, upright oval with no rings at 1:1, as on sheet 03 "FRONT".
     - Two distinct stubby feet.
     - A short arm stub that sits inside the side outline.
     - Face decals conformed to the surface.
3. **Make the classic glaze translucent (not fixed).**
   - **Where:** `donut.ts` (the classic look) and the translucency path in `Materials.ts`.
   - **Problem:**
     - The glaze is still opaque peach fondant, (420,720) = 246,194,154, sat 0.37, uniform across the top.
     - The hole rim is a jagged staircase over orange dough.
     - On the bitten classics, the cut edge still has a grey band, (1580,605) = 159,138,130, sat 0.18.
   - **Target:** a thin, glassy coat that shows golden dough through it at the crest and edges, a smooth rim, and a warm cut edge (reference 04, bottom left).
4. **Make the bite pockets appetising (not fixed).**
   - **Where:** `studioOcclusion` and N8AO in `studio.ts`, the crumb palette in `donut.ts`, and `scatterCrumbs` in `gallery.ts`.
   - **Problem:**
     - The pockets are still khaki-olive, (1500,620) = 157,128,83 at hue 36. At 1:1 they read as grey-green blotches in the crumb (bites crop, x 1400-1760, y 590-720).
     - There are no crumbs on the stands.
     - The floor crumbs (x 1650-1740, y 800-840) float, with no contact shadow.
   - **Target:**
     - Pocket shading in the toasted `#B86B32` family, hue 25-30, sat ≥ 0.55.
     - 4-8 crumbs on each stand.
     - A contact shadow under every crumb.
5. **Bring the props up to hero quality (not fixed; 2/255 mean diff to iter 7).**
   - **Where:** `props.ts`, `sprinkleTree.ts`, and the props layout in `gallery.ts`.
   - **Still wrong:**
     - **Fence:** waffle-slab rails (x 580-985, y 730-800).
     - **Pretzel trunk:** a staircase twist (x 320-375, y 500-735).
     - **Rock:** a white cap with brown holes (x 1355-1540, y 720-850).
     - **Hanging donuts:** boxy rings with no stems (x 1420-1630, y 490-570).
     - **Canopies:** flat 1xN sprinkle bars painted on.
     - **Shadows:** an orphan shadow disc at far left (x 30-120, y 535-565).
   - **Target:**
     - Round candy-stick rails.
     - A smooth twist on the trunk.
     - Sugar dusted on the rock's top faces only.
     - Hanging donuts on stems.
     - Sunk capsule sprinkles.
     - Every shadow attached to a caster.
6. **Make the emissives glow (not fixed).**
   - **Problem:**
     - The lighthouse lamp is still a pale cream disc, (575,205) = 249,191,170, about the same luma as the cloth.
     - The crystal is still a flat pastel gummy, (1255,760) = 181,151,247, sat 0.39, with no core.
   - **Target:** a lamp core at least 25 luma above the cloth with a warm saturated centre, and crystal cores at sat ≥ 0.45 with an inner gradient and halo.
7. **Finish the flavour identities and stands (not fixed).**
   - **Maple:** still a matte orange bun on an undersized stool, with no amber streak or contact line.
   - **Blueberry:** wet lavender jelly with hot white glints. It needs a satin sheen and crags.
   - **Swirl:** stepped band borders.
   - **Stands:** dashed rings of dark dots on the tops, and square-post legs.
8. **Keep cool shadows on the subjects (new).**
   - **Problem:** with the warm hemisphere, Glazey's shaded side is now hot coral, (1680,560) = 167,88,69 at hue 12 and sat 0.59. Art bible §6 asks for a cool fill and cool shadows. The form split improved, but the shadow side has lost its temperature contrast.
   - **Target:** shadow-side hue cooler than the lit side, with a visible lilac or blue cast in the core shadow, while the cloth corners stay warm. For example, restrict the warm hemisphere to the cloth, or raise `studioFill` on the subjects.
9. **Fix the backdrop corners (partly fixed).**
   - **Problem:**
     - In gallery-glazey-belly, (1900,20) is now 210,183,171, hue 18, luma 190. That is better than iter 7's hue 12, luma 170-187.
     - In gallery-props it is unchanged at hue 16, luma 175, a visible mauve wedge.
   - **Target:** hue within ±4° of the centre (25°) and luma ≥ 180 in every studio shot.
10. **Glazey and hero composition (partly fixed).**
    - **Glazey:** the long lens fixed the skew, but the row now fills a band from y 350 to 660. That leaves the top 32 % and bottom 39 % as bare cloth, and the stage-5 arm sits about 15 px from the right edge.
    - **Hero:** y 0-235 is still bare.
    - **Target:**
      - Subjects take at least 50 % of the frame height.
      - Margins on both sides are at least 4 %.
      - The hero lineup fills the frame as in reference 04, with a soft cloth fold or gradient instead of dead space.

## What is working (keep it)
- **Glazey's face** (eyes with 2x2 glints, blush, open smile, stage-5 bliss arcs) and the consistent coral in the front, side and back views. The tuft reads cleanly from every angle. Glazey is the most appealing asset in the gate.
- **Glazey's form split** (about 46 luma at stage 5) is new this iteration and should stay.
- **The long-lens Glazey camera** removed the lopsided end bellies.
- **The chocolate and pink sprinkle donuts** remain the best materials in the gate.
- **The jelly, the rainbow's band-matched drips, and the bakery, lighthouse body and pier** are still good.
- **The low tier** is effectively identical to high, with no broken effects.
- **No regressions** in M0, M1 or M2.

## Store-page test: no
The hero (gallery-donuts) is pixel-identical to iter 7. Next to reference 04 it still reads as a clean CG asset sheet:
- The pastel, stair-banded rainbow does not glow and loses the centre of the frame.
- The classic is opaque fondant.
- The maple is a bun on a stool.
- The stands have dotted rings.
- The top fifth of the frame is bare cloth.

The Glazey row is charming at a glance, but the ringed lens belly and the nose-like side arm would not survive a side-by-side with sheet 03.

## Previous review: status of the M3-iter7 fix list
| # | item | status |
|---|---|---|
| 1 | Re-author Glazey | **Partly fixed.** The belly top is now right under the mouth, and the long lens fixed the skew. The rings, tiling, bell skirt, fused feet and side-view arm are unchanged. |
| 2 | Rainbow centrepiece | **Not fixed.** The hero changed by 1.0/255; same pastel, bands, hole glare and lack of glow. |
| 3 | Classic translucency | **Not fixed.** |
| 4 | Props to hero quality | **Not fixed.** |
| 5 | Emissive glow | **Not fixed.** The lamp and crystal samples match iter 7. |
| 6 | Bite pockets and crumbs | **Not fixed.** The pocket moved from 151,125,83 to 157,128,83; still khaki. |
| 7 | Backdrop corner | **Partly fixed.** Better in the Glazey shot (hue 18, luma 190); unchanged in props (hue 16, luma 175). |
| 8 | Flavour identities and stands | **Not fixed.** |
| 9 | Glazey form lighting | **Fixed.** The split is about 46 luma (target ≥ 35), though at the cost of cool shadows (new item 8). |
| 10 | Hero composition | **Not fixed.** |

## Regression check
I re-rendered M0, M1 and M2 at HEAD into `shots/M*/m3i8reg/` and diffed them against both the iter-7 re-renders (`m3i7reg`) and each `final/`.
- **All three gates:** HEAD is **0.00/255, pixel-identical** to the iter-7 re-render. Iter 8 touched only studio, gallery and Glazey code.
- **M0 and M1:** the deltas to `final/` (36/255 and 26/255) are the pre-existing global grade change that earlier reviews judged equal or better. **No new regression.**
- **M2**, against the user-approved GPU `shots/M2/final/`: mean diffs are 1.0-1.4/255. I viewed m2-hero side by side with final. The chimney, lamp, lagoon and island donuts with sprinkles are equivalent. **No regression.**

```json
{"gate":"M3","iter":8,"verdict":"FAIL","mean":6.6,"min":6,"blockers":0,"store_page":false}
```
