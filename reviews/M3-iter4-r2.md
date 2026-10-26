# Review M3 iter 4 (reviewer r2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M3 --iter 4-r2`, which wrote 14 files to `shots/M3/4-r2/`. The harness used the GPU path (ANGLE Metal, Apple M4) and reported no errors. I viewed every PNG at 1:1, plus 2× crops of the classic, rainbow, powdered and blueberry/swirl donuts, Glazey stages 0–1 and 4–5, the pier, trees, rock, crystal and mushroom patch, and the classic bite. I sampled pixels at the points quoted below. For the regression check I re-rendered M2 at HEAD into `shots/M2/m3i4reg-r2/`. Before all of that I read `art/reference/NOTES.md` and viewed the four reference images.

**Summary:** the structural change this iteration was a new studio lighting model. Lighting was not what was holding this gate back, so the change did not help.
- **What improved:** cool shadow sides, a classic glaze that no longer duplicates the maple, a slightly higher face on Glazey, and rounded pier planks.
- **What got worse:** the frames are paler and flatter than in iteration 3. The hero lost much of its warm, appetising glow. A dead grey-blue wedge has appeared in the top-right corner of the Glazey, strip and props frames.
- **What did not change:** the content problems flagged in two consecutive reviews. These are the rainbow drips and bands, the blueberry form, the jelly, the bite pockets, the crumbs, the chunky props, the canopy sprinkles, Glazey's lumpy body, and the static motion strip.

The gate mean is about 6.9, down from 7.0. This is the third iteration in a row with less than 0.3 of progress. My regression check also found a shared-content highlight artifact in M2 (blocker 1), which the previous review missed.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | – | 7.0 |
| gallery-glazey-belly (+ strip) | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 8 | 7 | 5 | – | 6.7 |
| gallery-props | 7 | 6 | 6 | 6 | 7 | 6 | 6 | 8 | 8 | 7 | – | – | 6.7 |
| gallery-donut-bites | 7 | 7 | 7 | 6 | 6 | 7 | 7 | 7 | 7 | 7 | – | – | 6.8 |
| gallery-low-tier | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | 8 | 7.1 |

- **Gate mean:** about 6.9, against a pass bar of 9.0 (8.5 for low tier).
- **Minimum score:** 5 (motion and FX).
- Every shot has several categories below 8.

## Blockers
- **[Regression, M2 `m2-ground`, shared bakery/frosting material] A specular "firefly" on the chimney frosting cap.**
  - **Where:** top-centre of the frame, at the left corner of the pink chimney cap (about x 1000–1010, y 98–112).
  - **What:** a hard white hot-pixel with a red/pink ringing halo. In `shots/M2/final/m2-ground_1920x1080.png`, the same spot is a soft, pale highlight with no hot core.
  - **Cause:** it is already present in `shots/M2/m3i3reg-r2/`, so an M3 gloss or specular change introduced it (iterations 1–3 touched `Materials.ts`).
  - **Rules broken:** it is a visible quality drop in shared content (AGENTIC_LOOP §4.5), and it is a specular firefly (art bible §10.1 and §10.7).

## Fix list (priority order; max 10; each concrete and testable)
1. **Kill the chimney specular firefly (blocker).**
   - **Where:** the gloss/clearcoat lobe in `src/engine/render/Materials.ts`, or the bloom threshold in `Renderer.ts`.
   - **Target:** clamp the specular so a single sharp voxel edge cannot exceed the bloom threshold.
   - **Test:** M2 `m2-ground` matches `shots/M2/final` at the chimney cap: no pixel with luma above 250 that has a coloured ring around it.
2. **Rebuild the rainbow mega donut's drips and band edges.** This is the hero's centrepiece. The problem has been unchanged for three reviews.
   - **Where:** the rainbow look in `src/art/models/donut.ts`.
   - **Problem (bands):** in gallery-donuts, centre (x 790–1135, y 380–590), the borders between bands are serrated staircases. The red/orange border at x 800–1130, y 500–540 is the worst.
   - **Problem (drips):** the drips are flat, hard-edged slabs of pure green, blue, yellow and violet (x 815–1130, y 520–590). They do not match the red band above them. This is exactly reference 04's "stray green and rainbow artifacts" Ignore item.
   - **Problem (hole):** the inner hole shows a jagged dough sawtooth (x 900–1010, y 455–470).
   - **Target:** band borders follow a smooth curve or blend over 1–2 voxels. The drips are rounded and tapered like the pink donut's, in the colour of the band directly above them, with the same gloss. The hole rim is smooth at 1:1.
3. **Give the Glazey strip real motion.** This has been asked for in four consecutive reviews.
   - **Where:** the `gallery-glazey-belly` strip in `src/debug/scenes/gallery.ts`.
   - **Problem:** the strip is still a front/side/back turnaround. Rubric 11 scores motion, and art bible §7 requires the belly wobble.
   - **Target:** one frame shows a belly-stage change caught mid-wobble (an overshoot visible in the silhouette). One frame shows a land or munch pose with clear squash (width at least 110 % of rest) or stretch.
4. **Re-author Glazey's surface and belly to match sheet 03.**
   - **Where:** `src/art/models/glazey.ts`.
   - **Problem (body):** the body is still lumpy and stucco-like. Strip f2 (back) shows cellulite dimples on all six stages (e.g. x 1560–1810, y 420–630). The 2× front crops show the same knobbly texture.
   - **Problem (belly):** the belly is now a convex lens (good), but it still sits in the bottom third. At stage 4 its top edge is around y 565 on a body spanning y 400–650, so it does not rise to mid-body. It also shows concentric terrace rings at 1:1.
   - **Problem (profile):** in strip f1, the eyes on stages 0–2 still bulge past the head silhouette like goggles (x 285–315, y 490–545), and the mouth is a nub.
   - **Target:** a smooth plush surface with no lumps above 1 body-voxel of amplitude. The belly's top edge rises to about 45 % of body height, with no terracing visible at 1:1. The eyes and mouth sit flush with the silhouette in profile.
5. **Remove the grey-blue dead corner from the new studio.**
   - **Where:** `src/debug/scenes/studio.ts`, the extent of the sweep and the edge of the spot pool against the cool `studioFill` environment dome.
   - **Problem:** in gallery-glazey-belly, gallery-props and all three strip frames, the top-right corner (about x 1650–1920, y 0–380) falls to a neutral grey-lavender: 184,182,192 at (1880,120) and 186,187,199 in props. It reads as a dirty, unlit default-three.js backdrop.
   - **Problem:** the whole studio is also paler and flatter than in iteration 3. The backdrop sits at luma around 230 with saturation around 0.10, so it has lost its golden warmth.
   - **Target:**
     - The cloth stays warm cream to peach all the way to every frame edge, with no pixel below saturation 0.08 and no hue outside 10–40°.
     - The darkening toward the frame edges is a warm vignette, not grey.
     - Keep the cool, lilac shadow sides on the subjects; those are an improvement.
6. **Make the bite interiors appetising, and ground the crumbs.** This has not changed since the last review.
   - **Where:** the crumb palette in `donut.ts`, the AO tint (`studioOcclusion`) in `studio.ts` and N8AO, and `scatterCrumbs` in `gallery.ts`.
   - **Problem (pockets):** in gallery-donut-bites, the bite pockets are still khaki-olive. Samples: 162,139,103 (sat 0.36) at (1500,620) and 170,143,106 at (1560,640). At 2× they read as mouldy.
   - **Problem (glaze lip):** the glaze lip over the bite has a grey-lavender underside seam (x 1400–1760, y 560–600).
   - **Problem (crumbs):** the floor crumb piles at x 1020–1100, y 800–835 and x 1650–1740, y 800–840 have no contact shadow. There are no crumbs on the stand top.
   - **Target:**
     - Occlusion in the pockets darkens toward toasted `#B86B32`, with saturation of at least 0.55.
     - The glaze lip's shadow is warm.
     - Each crumb has a soft contact shadow, and 4–8 crumbs sit on the stand top under the bite, as in reference 04.
7. **Bring the chunky props up to hero smoothness.** Only the pier was touched.
   - **Where:** `src/art/models/props.ts` and `sprinkleTree.ts`.
   - **Still staircases in gallery-props:**
     - the chocolate rock, whose sugar cap is a flat white patch with holes (x 1355–1540, y 725–850);
     - the pretzel trunk of the cotton-candy tree (x 320–380, y 490–735);
     - the mushroom patch base, stacked green discs (x 985–1120, y 810–875);
     - the hanging donuts, boxy and floating with no stems (x 1420–1635, y 485–575).
   - **Pier:** the new rounded planks are a real improvement and toy-like. The stair hand-rails are now 1-voxel sticks that read as wire (x 185–290, y 680–760).
   - **Target:** every silhouette reads as rounded at this framing. Sugar is dusted into the rock's crevices. The hanging donuts match the gallery donuts' quality and hang from visible stems. The rails are at least 2 voxels thick, with rounded tops.
8. **Embed the canopy sprinkles.** This has not changed since the last review.
   - **Where:** sprinkle placement in `sprinkleTree.ts` / `props.ts`.
   - **Problem:** the green tree (x 1125–1350, y 410–600) and the pink tree (x 1590–1835, y 585–790) still carry flat rectangles in horizontal bands, some of them 1×6 or longer, and several break the silhouette on the green tree's left and right edges.
   - **Target:** 1×1×3 capsules, rotated in 90° steps, evenly scattered, half-sunk into the canopy and AO'd. None break the silhouette.
9. **Give the classic glaze its glassy translucency.** It is partly fixed.
   - **Where:** the classic look in `donut.ts`, and the `MAT.translucent` handling in `Materials.ts`.
   - **What is fixed:** the colour now separates from the maple. The classic samples 245,194,155 (sat 0.37) against the maple's 237,155,80 (sat 0.66).
   - **What is still wrong:** at 2× (gallery-donuts, x 310–630, y 620–840) it reads as opaque pink-beige plastic. The golden dough does not tint through where the glaze is thin, and there is no fresnel rim on the silhouette.
   - **Backdrop separation:** the separation has dropped to about 10 % luma (205–211 against a backdrop of 231).
   - **Target:** a visibly lighter rim at grazing angles, and warmer, more golden glaze over the dough crown. Keep at least 12 % luma separation from the backdrop.
10. **Fix the remaining flavour identities: blueberry, jelly and the powdered specks.** None of these has changed since the last review.
    - **Where:** the blueberry look, the jelly placement and the sugar shading in `donut.ts`.
    - **Blueberry:** it is still a smooth lilac glaze with a gear-tooth edge and darker blotches (x 800–900, y 640–760). It has none of reference 04's old-fashioned crags.
    - **Jelly:** it is still a glossy blob stuck on the outside of the dough (x 1262–1345, y 355–392).
    - **Powdered specks:** removing `sugarGrains` reduced the specks, but cool blue-grey 1–2 px specks remain along both sugar rims (e.g. the right rim of the jelly donut, x 1395–1415, y 330–380).
    - **Target:** lumpy blueberry crags with lit cracks, in the `#7C8CE0` colour. The jelly oozes out of a dark, AO'd split in the dough band. No sugar pixel is more than 25 luma below its 5 px median.

## What is working (keep it)
- **Cool shadow sides:** the new warm key with a cool fill gives lilac cast shadows and cool shadow sides on the stands and donuts. That is what art bible §6 asks for. Keep it, but restore the warm backdrop around it.
- **Classic glaze hue:** the classic glaze is now clearly its own colour, no longer a second maple.
- **Pier:** the planks are rounded and worn, and read as a toy, not Lego.
- **Pink sprinkle and chocolate donuts:** both still match reference 04. The glossy frosting, beaded drips and continuous chocolate specular all hold up.
- **Glazey's face:** big glossy eyes with a strong glint and a secondary twinkle, and the stage-5 bliss arcs are charming. The belly is now convex on top. The six stages read as six silhouettes.
- **Bakery, lighthouse body, cotton-candy tree, candy-cane fence and crystal:** these remain the strongest props.
- **Low tier:** matches high tier, with no broken effects.

## Store-page test: no
The hero is paler and emptier than in iteration 3:
- The camera is wider, so the donuts are smaller, and the top 25 % of the frame is blank cream.
- The rainbow centrepiece still has staircase bands and debug-coloured slab drips.
- Three of the nine flavours (blueberry, jelly and classic) still miss their reference-04 identity.

Next to reference 04, it looks like a clean prototype asset sheet, not premium key art.

## Previous review (M3-iter3-r2) fix-list status
1. Classic glaze: **partly fixed.** The hue and saturation are now distinct from the maple. It is still opaque, with no tint-through or fresnel rim, and its luma separation from the backdrop is down to about 10 %.
2. Glazey's skin and belly: **partly fixed.** The face is higher and the belly is a convex lens. The body is still lumpy, the belly is still low and terraced, and the eyes are still proud in profile.
3. Bite interiors and crumbs: **not fixed.**
4. Chunky props: **partly fixed.** The pier planks are done. The rock, pretzel, mushroom patch and hanging donuts are not.
5. Canopy sprinkles: **not fixed.**
6. Rainbow bands and drips: **not fixed.**
7. Powdered specks and jelly: **partly fixed.** There are fewer specks, but some remain. The jelly is not fixed.
8. Blueberry crags: **not fixed.**
9. Studio light, folds and framing:
   - **Fixed:** the folds are gone, and the shadow cores are cool.
   - **Not fixed:** the highlights are still near-white.
   - **New problem:** a grey corner has appeared, and the frames are paler.
   - **Not fixed:** the framing. The stand feet sit about 175 px above the bottom edge, and the top is now emptier.
10. Motion strip: **not fixed.**

**Plateau note (§5):** reviewer r2's gate means were 7.0, 7.0 and now 6.9. The lighting-model change was a structural change, but it was aimed at the wrong bottleneck. The remaining deficit is in the **assets**: the rainbow, blueberry, jelly, bite interior, Glazey's surface, the props and the motion strip. The next structural change should be a re-authoring pass on those models, not another lighting or grade pass. Five iterations of the 8-iteration escalation budget have been used if this report is counted as iteration 4. The builder should weigh escalating to the user now rather than continuing to tune.

## Regression check
- **M2** (shared `donut.ts`, `palette.ts`, `Materials.ts`, `pier.ts`, `props.ts`): I re-rendered at HEAD into `shots/M2/m3i4reg-r2/` and compared `m2-hero`, `m2-ground` and `m2-closeup-donut` with `shots/M2/final/`.
  - The island composition, grass, lagoon, clouds and lighthouse are unchanged.
  - The pier planks are lighter and grooved, which is neutral to slightly better.
  - The closeup donut's dough band is slightly softer, which is acceptable.
  - **Regression (blocker 1):** the chimney-cap specular firefly in `m2-ground`. It is not present in M2 final, and it is present since at least the iteration 3 regression render.
- **M0 and M1:** this iteration changed no terrain or test-cube content, and the renderer core is unchanged. **No regression attributable to M3.**

```json
{"gate":"M3","iter":"4-r2","verdict":"FAIL","mean":6.9,"min":5,"blockers":1,"store_page":false}
```
