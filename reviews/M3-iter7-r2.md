# Review M3 iter 7 (reviewer r2)
## Verdict: FAIL

I captured the shots myself at commit `2a4a5d8` with `npm run shots -- --gate M3 --iter 7-r2`, which wrote 14 files to `shots/M3/7-r2/`. The harness used the GPU path (ANGLE Metal, Apple M4) and reported no errors. I viewed every PNG at 1920×1080 and 844×390, plus the strip and its three frames. I also made 2–6× nearest-neighbour crops of:
- the rainbow, classic, chocolate/jelly, blueberry and swirl donuts;
- Glazey stages 0, 4 and 5;
- the crystal and rock, the hanging-donut tree, the pier and pretzel tree, the lighthouse lamp and the mushroom patch;
- the 2/3 classic bite and its floor crumbs.

Before that I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3–§4 and `art/reference/NOTES.md`, and viewed all four reference images. For the regression check I re-rendered M0, M1 and M2 at HEAD into `shots/M*/m3i7reg-r2/` and diffed them against each gate's `final/`.

**Scope note.** `docs/PROGRESS.md` records a user ruling that rubric 11 (motion) is out of scope for M3, and PLAN §M3 lists only turntable gallery shots. AGENTIC_LOOP §1 lets the user approve gate overrides, so I score category 11 as not applicable. My only evidence of that consent is the committed PROGRESS entry. The verdict does not depend on it: the gate fails on the other categories either way.

**Summary.** Iteration 7 is the first in four that re-authors assets, and some of it shows:
- Glazey's mouth is now an open smile with a tongue, and the belly is taller.
- The rainbow drips are now one coherent colour.
- The lighthouse lamp donut glows.
- The M2 chocolate-donut blown highlight from iter 6 is gone.

But most of the long-standing items are still open:
- Glazey's belly is still a lopsided, terraced crescent.
- The classic donut does not look translucent.
- The jelly has no split, and the blueberry has no crags.
- The bite pockets are still olive, and the crumbs still float.
- The crystal, the rock's sugar cap, the pier rails, the mushroom terraces and the hanging donuts are unchanged.
- The hero frame still has an empty top quarter.

Gate mean is about 6.9 with motion excluded. The pass bar is 9.0.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | n/a | – | 7.0 |
| gallery-glazey-belly (+ turntable strip) | 7 | 6 | 6 | 7 | 7 | 6 | 7 | 7 | 8 | 7 | n/a (user ruling) | – | 6.8 |
| gallery-props | 7 | 6 | 7 | 6 | 6 | 6 | 6 | 8 | 8 | 6 | – | – | 6.6 |
| gallery-donut-bites | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | – | – | 6.9 |
| gallery-low-tier | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | 8 | 7.1 |

- **Gate mean:** about 6.9 (shot means 7.0, 6.8, 6.6, 6.9, 7.1). The bar is 9.0, or 8.5 for low tier.
- **Minimum score:** 6, in composition, lighting, materials, AO, colour, voxel form and technical across several shots.
- No shot has every category at 8 or above.

## Blockers
None. I found no art bible §10 instant-fail item in any shot, and no regression in shared content (see the regression check).
- **Backdrop corner:** the top-right corner is dusty mauve (hue 14°, sat 0.18–0.21, luma 170–179 at (1880,40) and (1800,150) in gallery-glazey-belly). That is not hueless grey, so it is not §10.6, but it is still too dark (fix 6).

The gate fails on pass-bar rules 2, 3 and 4.

## Fix list (priority order; max 10; each concrete and testable)
1. **Re-shape Glazey's belly into the sheet's centred oval.** Highest payoff: Glazey is the most marketable asset in the gate.
   - **Where:** the belly decal or SDF in `src/art/models/glazey.ts`.
   - **What is wrong** in gallery-glazey-belly:
     - The belly is a lopsided leaf or crescent, tilted with the left end higher than the right. Stage 0 spans about x 175–250, y 580–615, and its centre sits about 10 px left of the body axis. Stage 5 spans about x 1650–1790, y 560–625, and its left end is clearly lower than its right.
     - At 3–4× it still shows concentric terrace rings.
     - Its top edge is a flat arc with no lift at the sides.
   - **Target:**
     - A symmetric, slightly upright oval centred on the body axis, as in sheet 03 "FRONT" and "FULL BELLY". Width is about 55–60 % of body width, and the top is just under the mouth.
     - It grows clearly per stage.
     - No visible terrace rings at 1:1.
     - The belly reads as a soft raised swell (AO at its rim), not a flat decal.
2. **Remove the stucco on Glazey's skin and arms.**
   - **Where:** the surface noise and normal window on the Glazey mesh (`glazey.ts` jitter, and the normal smoothing in `mesh.ts`).
   - **What is wrong:**
     - At 3× (stage 4, x 1290–1530, y 420–640) the coral surface is still a mottled checker of light and dark blocks.
     - The arms and feet are lumpy blobs with knuckle-like bumps, worst on stage 5's arms at x 1560–1600 and 1800–1840.
     - In the back view (strip f2) the right-hand arm tips go dark brown-red (for example around x 920 and 1505, y 560–585 of f2), which reads as dirty.
   - **Target:** plush, even coral, with jitter only as value noise of ±3–6 %. Arms are smooth tapered nubs, and there is no near-black on the arm tips.
3. **Make the rainbow mega donut the hero it is meant to be.**
   - **Where:** the rainbow look in `src/art/models/donut.ts` and its emissive or bloom flags.
   - **What is better:** the drips now match the red outer band.
   - **What is still wrong:**
     - The donut is now washed-out pastel and has no visible glow or bloom halo (x 780–1140, y 380–600). Next to reference 04's luminous centrepiece it reads as a sherbet swirl, and it carries less value contrast than the chocolate donut beside it. That breaks art bible §4: the subject gets the strongest contrast.
     - The band borders are still staircase-serrated at 3×.
     - The inner hole has a jagged pink sawtooth crown over a flat orange dough blob (x 900–1010, y 440–480).
   - **Target:** saturated bands at the palette's sanctioned "neon" limit, with a soft threshold-limited bloom halo on the cloth (ref 04). Band borders are smooth curves, and the inner rim is clean.
4. **Re-author the weak props.** These are unchanged for four iterations.
   - **Where:** `src/art/models/props.ts` and `sprinkleTree.ts`.
   - **Items still failing** in gallery-props:
     - **Crystal** (x 1210–1305, y 705–845): flat pastel lilac and mint, with no emissive core and no bloom. Art bible §5 says crystals are emissive with bloom.
     - **Rock sugar cap** (x 1355–1540, y 725–850): a flat white decal-like patch with brown holes, sitting on a blotchy checker rock.
     - **Hanging donuts** (x 1420–1635, y 485–575): stems are now visible (fixed), but the donuts are still boxy rings with a chunky, staircased dough band at a visibly coarser voxel scale than the gallery donuts.
     - **Pier stair rails** (x 185–290, y 680–760): still 1-voxel wires.
     - **Mushroom patch base** (x 985–1120, y 810–875): stacked green terraces.
   - **Target:** every silhouette reads as rounded at this framing. The crystal glows with a soft halo. Sugar is dusted into the rock's crevices. The hanging donuts match gallery quality. The rails are at least 2 voxels thick. The mushroom patch is a soft mound.
5. **Finish the bite interiors and crumbs.** Not fixed since iteration 5.
   - **Where:** the bite carve in `donut.ts` and the gallery crumbs in `src/debug/scenes/gallery.ts`.
   - **What is wrong:**
     - **Pockets:** they still shade olive-khaki (for example (1080,620) = 124,92,49 in gallery-donut-bites). The green-grey AO tint is obvious at 3× (x 1400–1760, y 590–700).
     - **Glaze lip:** the underside has a cool lavender-grey mirror sheen.
     - **Floor crumbs:** at 6× they have no contact shadow, and one speck is detached and floating at about (1016,826).
     - **Stand tops:** they have no crumbs.
   - **Target:**
     - Pockets darken toward `#B86B32` with warm AO, and the crumb interior stays golden.
     - The lip gets a warm shadow underneath.
     - Every crumb has a contact shadow.
     - 4–8 crumbs sit on each bitten stand top, as in reference 04.
6. **Recompose the gallery frames.**
   - **Where:** the gallery cameras in `src/debug/scenes/gallery.ts` and the backdrop in `studio.ts`.
   - **What is wrong:**
     - In gallery-donuts the top 20 % (y 0–230) is still empty cloth.
     - In gallery-glazey-belly, Glazey occupies only the band y 370–660, so about 70 % of the frame is empty cloth.
     - The top-right corner of glazey-belly and props is a dusty mauve about 22 % darker than the frame centre (luma 170 against 217).
     - In the 844×390 crops, the bottom-row stand legs are clipped by the frame edge.
   - **Target:** subjects fill 60–75 % of frame height with a balanced margin. Corner falloff is no more than 15 % luma, and the hue stays at 20–30°.
7. **Make the jelly ooze from a split.** Not fixed.
   - **Where:** the jelly placement in `donut.ts`.
   - **What is wrong:** at 2× (x 1270–1360, y 325–370) the jelly is still a glossy red cushion stuck to the outside of the dough band.
   - **Target:** a dark, AO'd split in the dough with jelly bulging out of it and one small drip, as in reference 04.
8. **Classic glaze translucency.** Not fixed.
   - **What is wrong:** the classic donut (x 275–605, y 680–900) is now an opaque peach fondant. It has a cool blue-white fresnel streak on its left flank and a hard cut line where the glaze meets the inner-hole dough. The dough does not tint through.
   - **Target:** a thin honeyed glaze that is lighter where it thins over the crown and drip edges. The dough colour shows through, and the rim is warm, not cool.
9. **Turn the blueberry into old-fashioned crags.** Not fixed.
   - **What is wrong:** the blueberry (x 785–1135, y 655–895) is still melted, glossy lilac plastic with flat blotches and broad specular smears.
   - **Target:** deep, AO'd fissures between raised crusty lumps, lower gloss on the crust, and the `#7C8CE0` hue kept.
10. **Profile eye contour.** Not fixed.
    - **What is wrong:** in strip f1 the far eye still pokes past the head silhouette on stages 0–3 (for example x 295–312, y 485–550 for stage 0). Glazey reads as having a bulging eye on the back of the cheek.
    - **Target:** both eyes sit inside the profile silhouette.

## What is working (keep it)
- **Glazey's face:** big glossy eyes with strong glints and blush. The new open smile with a pink tongue is a real improvement, and the stage-5 bliss arcs are good. The six stages read as six distinct silhouettes. The back view is coral, which correctly ignores the pink back in sheet 03.
- **Pink sprinkle and chocolate donuts:** still reference-04 quality, with beaded glossy drips and continuous speculars. The pink bite carve is a proper scalloped bite.
- **Rainbow drips:** now a single coherent colour per band, so the iter 6 "stray rainbow slab" artifact is gone.
- **Lighthouse lamp donut:** it now glows with a contained halo.
- **Strong props:** the bakery, the candy-cane fence, the pier planks and the clouds.
- **Low tier:** visually matches high tier, with no broken effects.
- **Specular limit:** the M2 chocolate-donut blown highlight is gone, and the M2 sprinkle glints on the wild donuts are back.

## Store-page test: no
Next to reference 04, the hero still reads as a clean prototype asset sheet:
- the top fifth of the frame is empty cloth;
- the centrepiece rainbow is now pastel and glowless, so the eye goes to the chocolate donut instead;
- three of the nine flavours (classic, jelly, blueberry) still miss their identity;
- the stands are flat, blotchy brown discs with no wood character.

It is good indie quality, about a 7. It would not hold its own on a premium store page next to the year's best.

## Previous review (M3-iter6-r2) fix-list status
1. Specular limit and the M2 chocolate blown hot spot (blocker): **fixed.** The highlight is contained and the sprinkle glints are present.
2. Rainbow drips and bands: **partly fixed.** The drips now match their band. The bands are still staircased, the inner rim is still a sawtooth, and the donut lost its glow.
3. Motion strip: **n/a.** The user ruled motion out of scope for M3. The turntable strip renders correctly.
4. Glazey's skin, belly, mouth and profile: **partly fixed.** The mouth is fixed. The belly is taller but lopsided and terraced. The skin stucco and the profile eye are not fixed.
5. Chunky props, crystal and lamp: **partly fixed.** The lamp glows and the hanging donuts have stems. The crystal, the rock sugar, the rails, the mushroom terraces and the boxy hanging donuts are not fixed.
6. Backdrop falloff: **not fixed.** It is still about 22 % darker in the top-right corner, in dusty mauve.
7. Jelly split: **not fixed.**
8. Bite interiors and crumbs: **not fixed.**
9. Classic glaze translucency: **not fixed.** The cool rim was reverted, but the glaze is still opaque.
10. Blueberry crags: **not fixed.**

**Plateau and escalation (§5, §6):** reviewer r2's gate means are 7.0, 7.0, 6.9, 6.8, 6.8 and now about 6.9 (motion excluded). This is iteration 7 of 8. The pass bar is more than 2 points above the current mean, and one more iteration of this scope will not close that gap. The builder should prepare the §6 escalation now. The structural options are:
- a dedicated asset re-authoring pass on Glazey's belly and skin, the rainbow, classic, jelly and blueberry donuts, and the five weak props;
- a recomposed gallery camera and backdrop.

## Regression check
- **M2:** re-rendered at HEAD into `shots/M2/m3i7reg-r2/` and compared with the user-approved GPU `shots/M2/final/`. The mean pixel difference is 1.0–1.4 for every shot, with 0.2–1.1 % of pixels over a difference of 30.
  - **`m2-lagoon-edge`:** the floating chocolate donut matches the final, with sprinkles and a contained highlight. The final's two small sun-glint sparkles on the pink and green canopy rims (about (790,440) and (920,455)) are gone at HEAD, and the canopies are a touch darker. I judge that neutral: those sparkles were near-clipping bloom spots, and nothing else changed. **No regression.**
  - **`m2-hero` and `m2-low-tier`:** visually identical; the wild donuts keep their sprinkles. **No regression.**
  - **`m2-ground` and `m2-closeup-donut`:** small differences only. **No regression.**
- **M1** (`m1-terrain`, `m1-low-tier`): mean difference about 20. It is the same global sky and grade change noted in earlier reviews (blue-lilac gradient sky instead of the grey backdrop, richer grass, stronger AO). It is an improvement, not a quality drop. **No regression.**
- **M0** (`m0-test-cube`, low tier): mean difference about 33, for the same global grade reasons. It has a warmer sky, a bevelled glossy frosting top and no new artifacts. **No regression.**

```json
{"gate":"M3","iter":"7-r2","verdict":"FAIL","mean":6.9,"min":6,"blockers":0,"store_page":false}
```
