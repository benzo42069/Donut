# Review M3 iter 8 (reviewer r2)
## Verdict: FAIL

I captured the shots myself at commit `c656127` with `npm run shots -- --gate M3 --iter 8-r2`. It wrote 14 files to `shots/M3/8-r2/` on the GPU path (ANGLE Metal, Apple M4), and `harness.json` reports `ok: true` with an empty log.

What I viewed:
- every PNG at 1920×1080 and 844×390, the strip, and its three frames;
- 2–6× nearest-neighbour crops of the rainbow, classic, jelly and blueberry donuts;
- Glazey stages 0/1 and 4/5, the stage 3 eyes at 6×, and the back view;
- the 2/3 classic bite with its crumbs;
- the crystal and rock, the hanging-donut tree and sprinkle ball, the pier and the lighthouse lamp.

Before that I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3–§4 and `art/reference/NOTES.md`, and viewed all four reference images.

**Scope note.** Per the user ruling in `docs/PROGRESS.md`, rubric 11 (motion) is not applicable. The strip is the PLAN §M3 front/side/back turntable. Every other category, the instant-fail list and the pass bar apply in full.

**Summary.** Iteration 8 changed only the studio lighting, the Glazey camera and the belly top. Those changes did these things:
- The backdrop is warmer and more even in the donut shots.
- The bite pockets are now warm brown instead of olive.
- The rainbow is somewhat more saturated.
- Glazey's belly is now centred on the body axis.

They could not touch the asset-level problems listed for four or more iterations, and those are still open:
- Glazey's belly is a flat, terraced, D-shaped decal.
- The skin is mottled.
- The classic glaze is opaque.
- The jelly has no split.
- The crystal and the rock sugar are weak.
- The pier rails are still wire-thin.
- The rainbow has no glow.
- The frames are still empty.

Gate mean is about 6.9, unchanged from iter 7. The bar is 9.0. Plateau: this reviewer's means across eight iterations are 6.5, 7.0, 7.0, 6.9, 6.8, 6.8, 6.9, 6.9. Parameter tuning has stopped moving the score.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | n/a | – | 7.0 |
| gallery-glazey-belly (+ turntable strip) | 7 | 6 | 6 | 7 | 7 | 6 | 7 | 7 | 8 | 7 | n/a (user ruling) | – | 6.8 |
| gallery-props | 7 | 6 | 7 | 6 | 6 | 6 | 6 | 8 | 8 | 6 | – | – | 6.6 |
| gallery-donut-bites | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | – | – | 7.0 |
| gallery-low-tier | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | 8 | 7.1 |

- **Gate mean:** about 6.9. The bar is 9.0, or 8.5 for low tier.
- **Minimum:** 6, in several categories.
- No shot has every category at 8 or above.

## Blockers
None. I found no art bible §10 instant-fail item in any shot:
- no z-fighting, acne, holes or debug overlays;
- no grey backdrop: every corner sampled is hue 15–26°;
- no clipping: the luma maximum is 252, with at most 60 px at 250 or above.

I also found no regression in shared content. The gate fails on pass-bar rules 2, 3 and 4.

## Fix list (priority order; max 10; each concrete and testable)
1. **Glazey's belly: make it a raised oval, not a flat D-shaped sticker.**
   - **Where:** the belly patch (`bellyTop`, `bellyBot` and the egg test, around lines 249–301) and the decal facing test (around line 148) in `src/art/models/glazey.ts`. The `bellyBulge` SDF is in the same file.
   - **What is better:** the patch is now centred and its top sits right under the mouth.
   - **What is wrong in gallery-glazey-belly:**
     - The lower edge is a straight, slightly tilted cut, so the shape reads as a "D" or a cut lemon slice, not the sheet's oval. Examples: stage 0 at x 118–212, y 565–615; stage 4 at x 1380–1505, y 555–625. The bottom is probably clipped by the facing test excluding down-facing voxels.
     - Concentric terrace rings are visible at 3×, for example the stage 4 belly centre.
     - The patch has a hard colour edge with no rim AO or swell, so it reads as a decal.
     - Stages 1–4 barely differ in belly size.
   - **Target:**
     - A full oval with a rounded bottom, about 55–60 % of body width, as in sheet 03 "FRONT" and "FULL BELLY".
     - A soft raised swell with a darker coral AO line around it.
     - No terrace rings at 1:1.
     - Visible growth at every stage.
     - In the side view (strip f1), the belly should bulge past the body line, as in sheet 03 "SIDE".
2. **Glazey's eyes: remove the hard iris band and the mismatched reflections.** This is new; it is the most visible face flaw at 1:1.
   - **Where:** the `eyeIrisLight` and `eyeIris` rule (around lines 265–274) in `glazey.ts`, and the eye material's environment reflection.
   - **What is wrong** (stage 3 at 6×, x 1060–1200, y 470–540):
     - Each eye has a flat brown lower third with a staircase boundary against the dark pupil, so it reads as a seam, not a gradient.
     - The left eye reflects a cool navy environment and the right eye a bronze-gold one. At full frame Glazey looks like he has two different eye colours, on every stage.
   - **Target:** both eyes match. Each is a deep brown-black glossy dome with a soft-edged lighter lower iris (a gradient over 2–3 voxels), plus the same white 2×2 glint and small twinkle.
3. **Skin and arm stucco.** Not fixed.
   - **Where:** the Glazey colour jitter and the normal smoothing (`glazey.ts`, `mesh.ts`).
   - **What is wrong:**
     - At 2–3× the coral is a light/dark block checker on every stage, plainly visible in the back view (strip f2, x 1300–1850, y 400–620).
     - The right arm tip in f2 (about x 1550–1565, y 555–580) is still a dark brown-red patch.
     - Stage 1's left arm has a dark notch at about (380,583).
   - **Target:** plush, even coral with ±3–6 % value noise only. No dark arm tips, and smooth tapered nubs.
4. **Make the rainbow mega donut glow and clean up its bands.**
   - **Where:** the rainbow look in `src/art/models/donut.ts`, its emissive flag, and `glow` in `gallery.ts` (line 119).
   - **What is better:** the bands are a bit more saturated than in iter 7.
   - **What is still wrong** (x 780–1140, y 380–600):
     - Blue, green and yellow are still pastel.
     - The donut has no bloom halo on the cloth, which reference 04 has.
     - Band borders are staircase-serrated at 3×.
     - The hole shows a jagged orange dough blob under a pink hot spot (x 910–1010, y 450–480).
     - The chocolate donut still out-contrasts the rainbow, against art bible §4 (the subject gets the strongest contrast).
   - **Target:**
     - Bands at the sanctioned neon limit, each with a soft rim highlight.
     - A threshold-limited coloured glow pooled on the cloth around the stand.
     - Smooth band curves and a clean inner rim with no exposed dough blob.
5. **Re-author the weak props.** Unchanged for five iterations.
   - **Where:** `src/art/models/props.ts`, `smallProps.ts`, `pier.ts` and `sprinkleTree.ts`.
   - **What is wrong** in gallery-props:
     - **Crystal** (x 1210–1305, y 705–845): flat lilac and mint planes with no emissive core or halo. Art bible §5 requires crystals to be emissive with bloom.
     - **Rock sugar cap** (x 1370–1520, y 720–770): a flat white decal with brown holes, on a blotchy checker rock.
     - **Hanging donuts** (x 1420–1635, y 490–575): boxy rings with a chunky staircased dough band, at a coarser voxel scale than the gallery donuts.
     - **Pier stair rails** (x 185–290, y 680–760): 1-voxel wires.
     - **Mushroom patch** (x 985–1120, y 805–870): stacked green terraces.
     - **Lighthouse lamp donut** (x 525–630, y 155–270): washed-out cream with no readable frosting. The lantern windows below it are flat peach blocks with a grey smear across the gallery rail.
   - **Target:**
     - The crystal glows with a soft halo.
     - Sugar is dusted into the rock's crevices.
     - The hanging donuts are at gallery quality.
     - The rails are at least 2 voxels thick.
     - The mushroom patch is a soft mound.
     - The lamp donut has saturated frosting and a warm glow.
6. **Recompose the gallery frames and finish the backdrop.**
   - **Where:** the cameras in `src/debug/scenes/gallery.ts` (lines 121, 160, 184, 331) and the falloff in `studio.ts`.
   - **What is better:** the corners in gallery-donuts and gallery-donut-bites are now within about 6 % of the top-centre luma, at hue 24–25°.
   - **What is still wrong:**
     - **gallery-props, top-right corner:** still dusty mauve, at (1880,40) = 194,170,162 (luma 176, hue 15°, sat 0.16). That is 20 % darker than the frame centre.
     - **gallery-donuts:** the top 21 % (y 0–230) is empty cloth.
     - **gallery-glazey-belly:** the six Glazeys occupy only y 350–660, about 29 % of frame height. The long lens fixed the skew but not the emptiness.
     - **844×390 crops:** the bottom-row stand legs touch or clip the bottom edge.
   - **Target:**
     - Subjects fill 60–75 % of frame height.
     - Every corner is within 15 % luma of centre, at hue 20–30°.
     - Nothing clipped at either resolution. For example, a two-row 3+3 Glazey layout, or a closer camera at the same focal length.
7. **Classic glaze translucency.** Not fixed.
   - **Where:** the classic look in `donut.ts` and its material flags.
   - **What is wrong** (gallery-donuts x 275–605, y 680–900; all three classics in gallery-donut-bites):
     - The glaze is an opaque peach fondant, nearly the same value and hue as the cloth, so the donut nearly disappears in grayscale.
     - The underside of the lip has a cool lavender-grey mirror sheen (gallery-donut-bites, x 1380–1500, y 590–610).
     - The glaze meets the dough at a hard cut line inside the hole.
   - **Target:** as in reference 04's classic glazed: a thin, glassy, slightly amber glaze through which the dough shows, with a warm fresnel rim, crisp small speculars, and a warm shadow under the lip.
8. **Jelly split.** Not fixed.
   - **Where:** the jelly placement in `donut.ts` (the burst at `gallery.ts` line 111).
   - **What is wrong:** at 3× (x 1270–1360, y 325–370) the jelly is a glossy red cushion stuck to the outside of the dough band, with no opening.
   - **Target:** a dark, AO'd split in the dough with jelly bulging out of it and one small drip, as in reference 04.
9. **Bite crumbs and stand tops.** Partly fixed.
   - **Where:** the gallery crumbs in `gallery.ts` and the stand in `stand.ts`.
   - **What is fixed:** the pocket shading is now warm. The darkest 5 % in the 2/3 classic bite is 126,89,51 (hue 30°), where it was olive before.
   - **What is still wrong:**
     - No crumbs sit on any bitten stand top.
     - The floor crumbs are tight clusters with no visible contact shadow.
     - The stand tops are flat brown discs with dash speckle and no wood grain or rim bevel. Reference 04's stands have planks.
   - **Target:**
     - 4–8 crumbs on each bitten stand top, each with a contact shadow.
     - Floor crumbs scattered loosely, as in reference 04.
     - Stands with a planked top and a darker bevelled rim.
10. **Blueberry surface.** Partly fixed.
    - **What is better:** the lobed, craggy silhouette now reads, at a pleasant `#7C8CE0` hue.
    - **What is still wrong:** the top is wet, mirror-glossy plastic with flat-shaded polygon blotches (3× crop, x 790–1130, y 660–890). It does not read as a cake donut's craggy, semi-matte glaze.
    - **Target:** lower gloss with spec only on the crag tips, finer value variation, and no faceted patches.

## What is working (keep it)
- **Glazey's face, overall:** big eyes with strong white glints, blush, an open smile with a pink tongue, and stage-5 bliss arcs. The six stages read as six distinct silhouettes. The back view stays coral, and the profile eye now mostly sits inside the head silhouette.
- **Warmer studio:** the warm hemisphere removed the grey and olive casts from the donut shots, and the bite pockets are golden-brown.
- **Pink sprinkle and chocolate donuts:** still reference-04 quality, with beaded glossy drips and continuous speculars. The pink bite is a convincing scalloped carve.
- **Rainbow drips:** one coherent colour per band.
- **Blueberry:** the new lobed silhouette.
- **Props:** the bakery, the candy-cane fence, the pier planks and posts, and the clouds.
- **Low tier:** a near-match of high tier with no broken effects.

## Store-page test: no
Next to reference 04 the hero still reads as a clean prototype asset sheet, not a premium store image:
- the top fifth is empty peach cloth;
- the centrepiece rainbow has no glow and is out-contrasted by the chocolate donut;
- three of nine flavours (classic, jelly, and partly the blueberry) miss their identity;
- the classic donut is peach on peach and nearly vanishes in grayscale;
- the stands are blotchy brown discs.

It is solid indie quality, about a 7. It would not hold its own on the front page next to the year's best.

## Previous review (M3-iter7-r2) fix-list status
1. Glazey's belly oval: **partly fixed.** It is centred and its top is under the mouth. It is still D-shaped (flat bottom cut), terraced, flat-decal, and grows little from stage 1 to 4.
2. Skin and arm stucco: **not fixed.** The checker mottle and the dark arm tip in the back view remain.
3. Rainbow hero: **partly fixed.** It is a bit more saturated. It still has no glow, and the borders are serrated with a jagged inner hole.
4. Weak props: **not fixed.**
5. Bite interiors and crumbs: **partly fixed.** The pockets are warm. The lavender lip sheen is still there, and the stand tops have no crumbs.
6. Recompose and backdrop: **partly fixed.** The donut-shot corners are fixed. The props corner is still mauve and 20 % dark, and both frames are still empty.
7. Jelly split: **not fixed.**
8. Classic translucency: **not fixed.**
9. Blueberry crags: **partly fixed.** The silhouette has crags; the surface is too glossy and faceted.
10. Profile eye contour: **mostly fixed.** Only a slight poke remains on stage 0 in strip f1 (about x 240–255, y 480–550).

**Escalation (§6):** this is iteration 8, the last before mandatory escalation. Iter 8 changed only parameters (studio light, camera FOV, the belly top gap). The mean did not move, and the gap to the 9.0 bar is still about 2 points. Only a dedicated asset re-authoring pass can close it:
- Glazey's belly, eyes and skin;
- the rainbow, classic and jelly donuts;
- the crystal, rock, hanging donuts, rails, mushroom patch and lamp;
- the stands;
- recomposed gallery cameras.

## Regression check
I re-rendered M0, M1 and M2 at HEAD into `shots/M*/m3i8reg-r2/`. The iter 8 commit touched no M2-shared file, and every HEAD render is bit-identical to the iter 7 regression renders (mean difference 0.00).
- **M2**, against the user-approved GPU `shots/M2/final/`:
  - The mean pixel difference is 0.85–1.48 per shot, with 0.16–1.13 % of pixels over 30.
  - I compared `m2-hero` side by side: the same island, bakery, chimney steam, lighthouse lamp and wild donuts (with sprinkles). There is no visible quality drop.
  - **No regression.**
- **M1** (`m1-terrain`, `m1-low-tier`): mean difference about 20. This is the same global sky and grade change judged an improvement in earlier reviews, and it is unchanged since iter 7. **No regression.**
- **M0** (`m0-test-cube`, low tier and strip): mean difference about 33, for the same global grade reasons, unchanged since iter 7. **No regression.**

```json
{"gate":"M3","iter":"8-r2","verdict":"FAIL","mean":6.9,"min":6,"blockers":0,"store_page":false}
```
