# Review M3 iter 5 (reviewer r2)
## Verdict: FAIL

I captured the shots myself at commit `046b194` with `npm run shots -- --gate M3 --iter 5-r2`, which wrote 14 files to `shots/M3/5-r2/`. The harness used the GPU path (ANGLE Metal, Apple M4) and reported no errors. I viewed every PNG, including the three strip frames, and made 2–3× crops of these areas:
- the rainbow, classic, blueberry, jelly and swirl donuts;
- Glazey stages 0–1 and 4–5, and strip f1 (profile);
- both bite donuts;
- the props in three regions, plus the green canopy at 3×.

Before that I read `art/reference/NOTES.md` and viewed all four reference images. For the regression check I re-rendered M0, M1 and M2 at HEAD into `shots/M*/m3i5reg-r2/` and diffed them against each gate's `final/`.

**Summary:** iteration 5 fixed the M2 chimney-firefly blocker and made real progress on four items: the warmth of the hero backdrop, the blueberry silhouette, how deep the canopy sprinkles sit, and the warmth of the bite pockets. But the studio change that warmed the donut frames **made the dead grey corner much worse** in the Glazey frame, the props frame and every strip frame. It is now a large neutral-grey wedge that reads as an unlit default backdrop, so it is a new blocker. The rainbow centrepiece, the motion strip, Glazey's skin and the chunky props are unchanged for the fourth review in a row. The gate mean is about 6.8, against 6.9 in iteration 4 and 7.0 in iteration 3, so the gate is still on a plateau.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | – | 7.0 |
| gallery-glazey-belly (+ strip) | 7 | 6 | 6 | 7 | 6 | 6 | 7 | 7 | 8 | 5 | 5 | – | 6.4 |
| gallery-props | 7 | 6 | 6 | 6 | 6 | 6 | 6 | 8 | 8 | 5 | – | – | 6.4 |
| gallery-donut-bites | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | – | – | 6.9 |
| gallery-low-tier | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | 8 | 7.1 |

- **Gate mean:** about 6.8. The pass bar is 9.0 (8.5 for low tier).
- **Minimum score:** 5 (technical cleanliness on Glazey and props, and motion).
- Every shot has several categories below 8.

## Blockers
- **[gallery-glazey-belly, all three strip frames, gallery-props] A dead grey backdrop wedge.** This is art bible §10.6 (default three.js grey background) and §4 (no large neutral fills).
  - **Where:** the top-right of each frame, about x 1450–1920, y 0–450 in the 1920×1080 shots. It also covers the top-right third of each strip frame.
  - **Measurements:**

    | sample point | iter 4 RGB (sat) | iter 5 RGB (sat) |
    |---|---|---|
    | Glazey (1880,120) | 184,182,192 (0.05) | 150,145,149 (0.03) |
    | props (1850,300) | 197,195,204 | 157,152,158 (0.04) |

  - **Why it matters:** the corner is about 35 luma darker and still has no hue, while the rest of the cloth is warm peach (247,215,191, sat 0.23). It is the darkest large area in both frames and pulls the eye away from Glazey. That breaks the §4 value rule that the subject gets the strongest contrast.
  - **Likely cause:** in `src/debug/scenes/studio.ts` this iteration:
    - narrowed the key spot cone (`ext * 2.4` → `ext * 2.0`);
    - removed the sweep's warm `emissive` floor (`studioShade` at 0.22);
    - cut `envMapIntensity` to 0.1.

    Outside the cone, the cyc curve is lit only by a 0.35 hemisphere, so in the wide Glazey and props cameras it falls to grey. The hero donut frame is framed tighter, so it gets away with it, though its top-right corner still drops to 179,163,157.

## Fix list (priority order; max 10; each concrete and testable)
1. **Remove the grey wedge (blocker).**
   - **Where:** `studio.ts`. Either restore a warm emissive or bounce floor on the sweep, or widen the key cone (or add a second very soft warm "bounce" spot) to cover the full camera frustum of the props and Glazey shots. Alternatively, make the vignette a warm grade term in post rather than a lighting falloff.
   - **Target:** in all of gallery-donuts, gallery-glazey-belly, gallery-props, gallery-donut-bites and the strip frames, no backdrop pixel has saturation below 0.10 or hue outside 10–40°.
   - **Target:** the corner darkening is no more than about 15 % luma below frame centre, and it is warm.
   - **Keep:** the cool lilac shadow sides on the subjects.
2. **Rebuild the rainbow mega donut. This is the fourth review with no change.**
   - **Where:** the rainbow look in `src/art/models/donut.ts`.
   - **Drips:** the drips at x 815–1130, y 520–590 are still flat, hard-edged slabs of violet, yellow, green and blue hanging under a red band. They are exactly the "stray rainbow artifacts" that reference 04's Ignore list forbids.
   - **Band borders:** the borders between bands are still serrated staircases (red/orange at x 800–1130, y 500–540; yellow/green near the top).
   - **Hole rim:** the inner hole still has a dough sawtooth at x 900–1010, y 455–470.
   - **Target:** each drip is a tapered, rounded bead in the colour of the band directly above it, with the same gloss as the pink donut's drips. Band borders blend over 1–2 voxels or follow a smooth curve, with no staircase visible at 1:1.
3. **Give the strip real motion. This has been asked for in five consecutive reviews.**
   - **Where:** the strip poses for `gallery-glazey-belly` in `src/debug/scenes/gallery.ts`.
   - **Problem:** f0, f1 and f2 are still a static front/side/back turnaround, so rubric category 11 cannot rise above 5.
   - **Target:** one frame catches a belly-stage change mid-wobble, with visible overshoot. One frame shows a land or munch squash with width of at least 110 % of rest, plus crumbs. One frame shows a stretch (jump).
4. **Re-author Glazey's skin and belly.**
   - **Where:** `src/art/models/glazey.ts`.
   - **Skin:** at 2× the body is still a knobbly, checkered stucco (e.g. stage 4 at x 1290–1530, y 420–640). It is not the smooth plush of sheet 03.
   - **Belly:** it still sits in the bottom third. At stage 4 its top edge is around y 557 on a body spanning about y 400–650, which is 37 % of body height. It also still shows concentric terrace rings at 1:1.
   - **Profile:** in strip f1, the eyes on stages 0–2 still bulge past the head outline like goggles (about x 255–310, y 170–215 of f1 at 1920 width).
   - **Mouth:** it is a flat dark rectangle, not the sheet's open smile.
   - **Target:** surface lumps no larger than 1 body-voxel. The belly top reaches about 45 % of body height, with no terracing at 1:1. The eyes sit flush with the outline in profile. The mouth is a curved, open smile with a pink tongue.
5. **Bring the chunky props up to hero quality. Nothing changed here this iteration.**
   - **Where:** `src/art/models/props.ts` and `sprinkleTree.ts`.
   - **Items still failing in gallery-props:**
     - the rock's sugar cap is a flat white patch with holes (x 1355–1540, y 725–850);
     - the twisted pretzel trunk is a staircase (x 320–380, y 490–735);
     - the mushroom patch base is stacked green terraces (x 985–1120, y 810–875);
     - the hanging donuts are boxy and float with no stems (x 1420–1635, y 485–575);
     - the pier stair rails are 1-voxel wires (x 185–290, y 680–760).
   - **Crystal:** the crystal (x 1210–1305, y 705–845) is a washed-out pastel with no emissive glow or bloom, which falls short of art bible §5 "emissive with bloom".
   - **Target:** every silhouette reads as rounded at this framing. Sugar is dusted into the rock's crevices. The hanging donuts match the gallery donut quality and hang on visible stems. The rails are at least 2 voxels thick, with rounded tops. The crystal glows, with a soft bloom halo.
6. **Spread the canopy sprinkles as capsules.** This is partly fixed.
   - **Where:** `sprinkleTree.ts`.
   - **What improved:** the sprinkles are now sunk into the canopy and mostly stay inside the silhouette.
   - **What is still wrong:** they are still flat 1×N rectangles clustered in horizontal bands. On the green tree (3× crop of x 1125–1350, y 410–600) there are dense rows at the top and middle with bare areas between, and there are clusters on the right edge. The pink tree (x 1590–1835, y 585–790) reads as noisy dither with smeared streaks.
   - **Target:** even, random scatter, with no row structure visible at 1:1. Each sprinkle is a 1×1×3 capsule rotated in 90° steps, with AO at its base.
7. **Make the jelly ooze from a split.** This is not fixed visually.
   - **Where:** the jelly placement in `donut.ts`.
   - **Problem:** in gallery-donuts (x 1240–1350, y 345–385) the jelly is still a glossy red cushion stuck on the outside of the dough band. No dark, AO'd split is visible at 3×.
   - **Target:** a dark crescent crack in the band, with the jelly bulging out of it and a small drip running down, as in reference 04.
8. **Finish the bite interiors and crumbs.** This is partly fixed.
   - **Pockets:** they are warmer than last time. Samples: 154,128,86 (sat 0.44) at (1500,620) and 174,139,92 (sat 0.47) at (1560,640). At 2× (x 1340–1790, y 520–840) the deep pockets still read khaki-olive, and the glaze lip still has a cool grey-lavender underside seam (x 1400–1760, y 560–600).
   - **Crumbs:** the floor crumb piles at x 1020–1100, y 800–835 and x 1650–1740, y 800–840 still have no contact shadow. There are still no crumbs on the stand tops.
   - **Target:** pockets saturated at 0.55 or more, darkening toward toasted `#B86B32`. The lip's underside shadow is warm. Each crumb has a soft contact shadow. 4–8 crumbs sit on each stand top beneath the bite.
9. **Give the classic glaze translucency and a fresnel rim.** This is partly fixed.
   - **Where:** the classic look in `donut.ts`, and `MAT.translucent` in `Materials.ts`.
   - **Problem:** at 2× (x 330–660, y 650–880) it still reads as opaque peach-beige plastic. The golden dough does not tint through where the glaze is thin, and there is no lighter rim on the silhouette.
   - **Target:** a visible fresnel brightening at grazing edges, and a warmer, golden tint where the glaze thins over the crown.
10. **Turn the blueberry into old-fashioned crags.** This is partly fixed.
    - **What improved:** the silhouette is now lobed rather than gear-toothed, which is a real gain.
    - **What is still wrong:** at 2× (x 790–1120, y 630–870) the surface is melted, glossy lilac plastic with flat lighter and darker blotches. It does not have reference 04's crisp fissures.
    - **Target:** deep, AO'd cracks between raised crusty lumps. Keep the `#7C8CE0` hue, but use a lower gloss on the crust than on a smooth glaze.

## What is working (keep it)
- **Chimney firefly fixed:** M2 `m2-ground` at HEAD now has a maximum luma of 218 at the chimney cap, against 226 in M2 final. There is no hot core or ringing.
- **Hero backdrop:** the gallery-donuts and donut-bites cloth is now a warmer peach (sat about 0.23, up from 0.10). The donuts look more appetising than in iteration 4.
- **Pink sprinkle and chocolate donuts:** still reference-04 quality, with glossy beaded drips and a continuous chocolate specular.
- **Swirl donut:** reads well, with pastel bands, drips and gloss.
- **Glazey's face:** big glossy eyes with a strong glint, blush, and the stage-5 bliss arcs. The six belly stages read as six distinct silhouettes, which meets the NOTES "must differ clearly" item.
- **Strong props:** the bakery, the lighthouse body, the candy-cane fence, the pier planks and the clouds are still the strongest props.
- **Low tier:** it matches high tier, with no broken effects.

## Store-page test: no
Next to reference 04 the hero still reads as a clean prototype asset sheet:
- the top quarter of the frame is empty cloth;
- the centrepiece rainbow donut has debug-coloured slab drips and staircase bands;
- three of the nine flavours (classic, jelly and blueberry) still miss their identity.

The Glazey frame, which is the most marketable image of this gate, has a grey dirty corner.

## Previous review (M3-iter4-r2) fix-list status
1. Chimney specular firefly: **fixed.**
2. Rainbow drips and bands: **not fixed.**
3. Motion strip: **not fixed.**
4. Glazey's skin, belly and profile: **not fixed.** The belly moved up only marginally, and the skin, terracing and goggle eyes are unchanged.
5. Grey studio corner: **worse.** It went from a luma of about 184 to about 148, and it is now a blocker. The warmth of the donut frames is fixed.
6. Bite interiors and crumbs: **partly fixed.** The pockets are warmer. The lip seam, crumb contact shadows and stand-top crumbs are not fixed.
7. Chunky props: **not fixed.**
8. Canopy sprinkles: **partly fixed.** They are sunk into the canopy, but still flat and banded.
9. Classic glaze translucency: **not fixed.**
10. Flavour identities:
    - **Blueberry:** partly fixed (lobed silhouette).
    - **Jelly:** not fixed visually.
    - **Powdered specks:** largely fixed. There are no obvious cool specks at 3×, but the sugar rim is slightly noisy.

**Plateau and escalation note (§5, §6):** reviewer r2's gate means were 7.0, 7.0, 6.9 and now 6.8, so the gate has made no progress in four iterations. This is iteration 5 of 8. The items holding the score down are asset re-authoring jobs: the rainbow, the motion strip, Glazey's skin and belly, the props, and the jelly. Lighting tweaks have twice traded one problem for another. I recommend the builder escalate to the user now, with options such as a dedicated asset re-authoring pass, rather than spend the remaining three iterations on parameter tuning.

## Regression check
- **M2:** diffed at HEAD (`shots/M2/m3i5reg-r2/`) against `shots/M2/final/`. Mean differences per image range from 1.9 to 6.2.
  - The chimney firefly is gone.
  - `m2-closeup-donut` has a smoother dough band and a softer pink specular. This comes from the `mesh.ts` change and is neutral to slightly better.
  - `m2-ground`: the bakery, grass, clouds, pink tree and donuts are unchanged in quality.
  - **No regression.**
- **M1** (`m1-terrain` and `m1-low-tier`): the mean difference is about 20 because the sky and grade differ. The HEAD render has a blue-lilac sky gradient instead of the old flat grey-beige, plus more saturated grass and stronger AO. That is a global look change since M1, not a drop in quality. The terrain, drips and donuts are intact. **No regression.**
- **M0** (`m0-test-cube` and low tier): the mean difference is about 33 for the same global grade reasons, and the cube now has a bevelled glossy frosting top. The quality is equal or better, with no new artifacts. **No regression.**

```json
{"gate":"M3","iter":"5-r2","verdict":"FAIL","mean":6.8,"min":5,"blockers":1,"store_page":false}
```
