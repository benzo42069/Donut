# Review M4 iter 4
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M4 --iter 4` at commit `0ec0331`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 16 files to `shots/M4/4/`.
- **Viewed:** every 1920x1080 frame, the 844x390 touch frame, both strip composites and every strip frame.
- **Zoomed crops (2-4x, nearest neighbour):**
  - Glazey in walk f0/f1/f2 side by side, and at the jump apex.
  - The near meadow in the lower left.
  - The pink canopy on the left, a cloud, the lagoon and near rim.
  - The joystick and the jump icon.
  - The studio side view (turntable f1) and the studio belly of stage 4.
- **Sampled:** 5x5 pixel means and a clip scan. No luma ≥ 250 in any frame, and no crushed blacks apart from the intentional eye and closed-eye ink in the studio.

Beforehand I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4 and `art/reference/NOTES.md`, and viewed all four references.
- **Primary for Glazey:** 03.
- **Primary for the gameplay frames:** 01 and 02, judged on their Follow lists only. I did not reward 02's chunky grass, blue water or text sign.

**Summary.** This is a real step forward on the ground plane:
- **Staircase:** the near-terrain blocker is gone. The relaxed skin no longer shows terrace risers.
- **Grass:** the tufts are now a warm yellow-green (hue 84-100).
- **Green trees:** they finally read as sprinkle-balls.
- **Jump icon:** it is coral.
- **Studio lineup:** it is size-ordered.

**But the frame is still the same frame:**
- **Composition:** Glazey is dead centre, the lighthouse is decapitated, and a dark mauve canopy walls off the left fifth.
- **Belly:** it is still a flat, bright cream sticker that pokes out of the 3/4 silhouette as a duck bill.
- **Jump:** Glazey still reads as standing on the frosting rim.
- **Ground:** a teal under-surface shows through the grass across the whole foreground.

Nothing here is an instant fail. Nothing here is store-page either.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m4-walk-strip (still + strip) | 7 | 6 | 7 | 7 | 7 | 6 | 7 | 8 | 7 | 7 | 7 | 6.9 |
| m4-jump-apex | 7 | 6 | 7 | 6 | 7 | 6 | 7 | 8 | 7 | 7 | – | 6.8 |
| m4-touch-ui (hero) | 7 | 6 | 7 | 7 | 7 | 6 | 7 | 8 | 7 | 7 | – | 6.9 |
| gallery-glazey-belly | 7 | 7 | 7 | 7 | 6 | 6 | 8 | 6 | 7 | 7 | – | 6.8 |
| gallery-glazey-belly_strip (turntable) | 7 | 7 | 7 | 7 | 6 | 6 | 8 | 6 | 7 | 7 | – | 6.8 |

- **Gate mean:** about 6.8. Iter 3 was 6.6, iter 2 6.6 and iter 1 5.9. The bar is 9.0.
- **Minimum:** 6.

**The plateau rule (§5) is now triggered.** The gain was +0.0 at iter 3 and +0.2 at iter 4, so both of the last two iterations gained less than 0.3. Before iter 5 the builder must make a structural change, not parameter tweaks, and write the paragraph in `docs/PROGRESS.md`. Two areas carry most of the lost points:
- **Gameplay composition and camera:** comp is 6 in every play shot and has been unaddressed for three iterations.
- **The belly asset and material:** it is the main thing holding mat and charm at 6-7.

## Blockers
None. There is no instant-fail item from art bible §10 in any shot:
- The iter 3 terrain staircase is resolved. Near grass voxels measure about 7-9 px, under the 12 px limit, and there are no terrace risers.
- No clipping, no acne, no holes and no debug overlays.

The gate fails on pass-bar items 2 (every category ≥ 8), 3 (mean ≥ 9.0) and 4 (store-page test).

## Fix list (priority order; max 10; each concrete and testable)
1. **Recompose the gameplay frame. This is structural, and the third time it has been listed.**
   - **Where:** `src/game/camera/` (follow offset, yaw and pitch) and the `src/debug/scenes/m4Play.ts` spawn point and heading.
   - **Problem in walk/touch:**
     - Glazey's centre is at x ≈ 950-960 of 1920, dead centre.
     - The lighthouse lantern is cut by the top edge, at about y 0-45.
     - The pink canopy, cropped on the left, fills about 18 % of the frame (x 0-330, y 0-640) as a dark mauve wall at luma about 86.
     - The confetti rim fills about 15 % of the lower-right corner.
     - The jump frame is the same, with the lantern cap clipped at y 0.
   - **Target:**
     - Glazey's centre on a vertical third (x ≈ 640 or 1280) with lead room in his heading.
     - The lighthouse fully in frame, lantern included, as a landmark on the opposite third.
     - No cropped prop over 12 % of the frame.
     - Foreground rim at most 12 %.
     - Reference 02's layering: subject in the mid-ground, landmark glowing on the horizon.
2. **Make the belly a tummy, not a sticker or bill. This is a re-authored asset.**
   - **Where:** `src/art/models/glazey.ts` l.162-173 (`bellyBulge`) and l.356-445 (`bellyRx = rx*0.6-0.62`, `dome(... 0.35, 0.9)`, the rim at `r > 0.88`). The palette entries are `glazeyBellySoft` and `glazeyBellyRim` in `palette.ts`.
   - **In play, walk still:**
     - At about (860-960, 700-760), the patch is luma 211-217 against a body of 137-162. It is the brightest thing on Glazey and the eye goes to it before the face.
     - The patch has a hard edge and almost no gradient.
     - In 3/4 view its left tip crosses the body outline at about (860, 735). It is clearest at the jump apex, at about (850, 590). It reads as a **duck bill or lower lip**.
   - **In the studio:**
     - The bigger stages' belly samples at hue 34-41, sat 0.30, luma 128-138, for example (1000,870) on stage 4. That is a **khaki/olive** fill, inside a lighter rim.
     - The darker centre makes it read as a **concave dish**, not a swell.
     - It is muddier than `shots/M3/final/gallery-glazey-belly`, whose bellies were clean cream.
   - **Target:**
     - A cream `#F5E2A8` family belly, never below sat 0.30 at hue ≤ 40, lit as a convex form: brightest at the upper centre, shading toward the bottom edge and sides by at least 25 luma.
     - A soft edge, with no darker ring outline.
     - In play, a lit-centre luma no more than about 25 above the lit coral body.
     - Fully inside the coral silhouette at every yaw in the turntable and in the play 3/4 view.
     - In profile, a gentle cream bulge past the body line.
3. **Make the jump read as airborne.**
   - **Where:** the `m4Play.ts` jump spawn and pose, `src/game/fx/ContactShadow.ts`, and the dust colour in `src/game/fx/VoxelParticles.ts`.
   - **Problem:**
     - Glazey's feet sit at y ≈ 640, exactly on the top edge of the lagoon frosting wall.
     - His shadow is a darker pink patch directly under the feet, at (870-920, 700), luma 110 against a rim of 166, so it touches the soles.
     - Together they say "standing on the wall".
     - The dust is still **cool white cubes**, about 6-10 px, scattered in the grass at (930-1010, 780-830), about 120 px from Glazey and next to the donut. It reads as litter, not take-off puffs.
   - **Target:**
     - The apex framed over open lawn or path, with at least 40 px of visible ground between the soles and a soft contact shadow.
     - A stretch pose with feet tucked or dangling.
     - Warm cream dust lit by the sun, clustered at the take-off point and fading.
4. **Kill the teal under-surface in the meadow.**
   - **Where:** the play-mode fine terrain skin colour (`grassMint #84C890` / `grassDeep` in `palette.ts`, as used by `MeadowDiorama.ts` for the relaxed `fine` VoxelObject), plus the play grade.
   - **Problem:**
     - Between tufts, the ground renders as a **mint-teal**: hue 190, sat 0.36 at (1300,700). In the lower-left crop it shows a diamond checker of flat teal facets, (0-700, 880-1080).
     - The tufts are now warm (hue 84-100), so warm blades now sit on a cold aqua carpet, and the foreground reads like a turf mat.
   - **Target:**
     - Ground under the grass in the same green family as the blades, hue 80-120, slightly darker than the tufts.
     - No visible facet checker at 2x.
     - Tuft coverage dense enough that bare ground is under about 30 % of the near lawn.
5. **Put Glazey at the top of the value hierarchy (§4). Not fixed since iter 2.**
   - **Problem:**
     - Glazey's lit body is luma 153-162. The near rim at (1700,1000) is 162, with sprinkles adding more contrast.
     - The belly at 217 is the single brightest feature on him.
     - In grayscale, the strongest contrast is the lighthouse stripes and the sprinkled rim, not his face.
   - **Where:** the play `heroRim`/`selfLight` tuning in `Materials.ts`/`Game.ts`, and the vignette or foreground darkening in the grade (`Renderer.ts` `ColorGradeEffect`).
   - **Target:**
     - Glazey's lit body brighter than every foreground surface within 300 px of him.
     - A warm rim on his sun side.
     - Foreground corners at least 15 % darker than frame centre.
6. **Give the pink canopy form, and remove its seam.**
   - **Where:** `src/art/models/sprinkleTree.ts`, the pink `k` thresholds (`py / 40 + (h - 0.5) * 0.25`, `leafA/B/C`).
   - **Problem:**
     - The top-to-bottom gradient is only 19 luma: 105 at (100,250) against 86 at (100,450).
     - A **hard horizontal band** at y ≈ 250-280 shows where the `leafA→leafB` threshold flips. Mottled darker grain starts abruptly there, and again near the bottom, at y ≈ 500.
     - It reads as a striped wall, not a lit ball.
   - **Target:**
     - A continuous gradient, with no visible threshold line at 2x.
     - At least 40 luma between the sun-side highlight and the occluded underside.
     - Overall lit-side luma at least 130, so the canopy stops being a dark mass in the left fifth.
7. **Fix the cloud underside. Worse, not better.**
   - **Where:** `src/art/models/smallProps.ts` `buildCloud`. The new `hash3(...) * 9` dither applies to **all** clouds, M2 included.
   - **Problem:** the hard step became a **speckled lilac band**, a noisy salt-and-pepper strip across the bottom third of every cloud, for example (920-1150, 100-130) in the walk still. It is still a visible layer seam, now with per-voxel noise that will crawl in motion (§10.7, aliasing shimmer).
   - **Target:** a smooth value gradient from the shaded underside to the lit top, either from a continuous palette ramp or from shading (wrap and AO), not a binary two-colour dither. No visible band in a 4x crop.
8. **Make the studio core cool. Not fixed since iter 2.**
   - **Where:** the `studioLilac` fill in `studio.ts`.
   - **Problem:** on stage 5 the shaded side at (1420,700) is hue 8, sat 0.52, against the lit side at (1700,700), hue 13, sat 0.57. The shadow is still red-coral, not rose-lilac.
   - **Target:** a shadow-side hue at or below 0 (rose-lilac), with sat at least 0.08 below the lit side.
9. **Read the milk as milk.**
   - **Where:** `src/engine/render/Water.ts`.
   - **Problem:** better than iter 3, with a cream base. It still carries a strong pink cast and long satin streaks across the near half, (60-860, 560-700), and reads as pink satin.
   - **Target:** cream-white body, broad soft specular, a darker depth tint at the drip wall and under the pier, and pink limited to reflections of the wall.
10. **Add amplitude to the walk.**
    - **Where:** the procedural animation in `src/game/player/`.
    - **Problem:** f0-f2 differ mainly by arm and one foot. Body squash, bob and lean are nearly identical, with the head top within about 5 px across frames.
    - **Target:**
      - A visible vertical bob of at least 8 px at 1080p.
      - Squash on contact and stretch on passing, with a body-width change of at least 5 %.
      - A tuft lag that clearly differs between frames.

## What is working (keep it)
- **The near-terrain staircase is gone.** The relaxed fine skin removed every terrace riser. The lawn rolls softly, and it is the biggest structural win of the gate so far.
- **Warm grass tufts:** hue 84-100 with yellow-green tips. The golden hour finally reaches the ground plane.
- **Green trees** now carry dense, evenly scattered sprinkles. They read as reference 01's sprinkle-balls, with nice soft crown shading.
- **The jump icon** is now coral with a saturated tuft, a hop pose and a soft shadow. It is a strong candy button. The joystick donut knob is cute too.
- **The face** has big warm-brown eyes with crisp white glints, an open smile and soft blush. It is very appealing.
- **The studio lineup** is now size-ordered in two rows, and growth reads from stage 0 to stage 5.
- **The tuft** is a clean 5-stripe rainbow from front and back.
- **Set dressing:** tree shadows raking across the path, the drip lagoon wall, the pier, the dropped donuts and the micro-flowers.
- **Clean output:** no clipping, no acne, no holes.

## Store-page test: no
- **Composition:** in the touch-ui hero frame the subject is dead centre, the landmark is cropped, and a dark mauve canopy blocks a fifth of the frame.
- **Glazey:** his loudest feature is a flat cream bill.
- **Ground:** the foreground turf shows a cold teal floor.

It is a pleasant, coherent indie frame at about 7/10. It is not a frame that could sit beside reference 02's warm backlit layering, or beside the best voxel art of the year.

## Previous review (M4-iter3): status of the fix list
| # | item | status |
|---|---|---|
| 1 | Terrain staircase (blocker) | **Fixed.** The risers are gone. A teal under-surface remains (new item 4). |
| 2 | Belly a tummy, not a sticker | **Not fixed.** It is still a flat, bright, hard-edged patch and a bill in 3/4. In the studio it turned khaki and dish-like (item 2). |
| 3 | Jump reads as airborne | **Partly fixed.** The shadow is cooler (`contactShadow #2C3F4C`). Glazey still stands on the rim, and the dust is still cool-white litter (item 3). |
| 4 | Warm play grade and grass | **Mostly fixed.** The tufts are warm and the sky is golden. The teal ground shows through, and Glazey has no warm rim (items 4 and 5). |
| 5 | Sprinkle-ball trees and pink form | **Green fixed. Pink not fixed.** The pink gradient is 19 luma, below the 40 target, and has a new threshold seam (item 6). |
| 6 | Recompose the frame | **Not fixed** (item 1). |
| 7 | Glazey value hierarchy | **Not fixed** (item 5). |
| 8 | Studio progression and cool core | **Progression fixed. Core not fixed** (item 8). |
| 9 | Milk reads as milk | **Partly fixed.** The base is creamier, with a pink cast and satin streaks (item 9). |
| 10 | Icon colour and clouds | **Icon fixed. Clouds worse:** a dithered noisy band (item 7). |

## Regression check
- **Shared code changed this iteration:** `mesh.ts`, `Mesher.worker.ts`, `MesherPool.ts`, `VoxelObject.ts`, `Materials.ts`, `Renderer.ts`, `sprinkleTree.ts`, `grassTuft.ts`, `smallProps.ts`, `palette.ts`, `MeadowDiorama.ts` and `ContactShadow.ts`.
- **Defaults reviewed in the diff:**
  - `relax`/`relaxAll` default to off, and the smooth table is unchanged when off.
  - The grass-tuft `warm` flag defaults to the old greens.
  - The pink-tree change and the denser sprinkle count are gated on `res > 1`.
  - The grade `saturation` and `contrast` are optional, with the old defaults.
  - The palette changes are additions only.
- **Result for M0-M2 terrain, trees and grass:** no regression in default-path code.
- **Exception, the clouds:** `buildCloud` now adds an unconditional `hash3 * 9` dither, so **M2 clouds** (`shots/M2/final/m2-hero`, `m2-ground`) are rebuilt with it. In the M4 frames the dither reads as a speckled band (item 7). I did not re-shoot M2, because it was not in this gate's shot list. The builder must verify that the M2 hero and ground clouds keep their soft undersides. If the M2 clouds show the speckle band, that is a regression blocker at iter 5.
- **`gallery-glazey-belly` against `shots/M3/final/gallery-glazey-belly`:**
  - **Better than M3:** stage readability is back with the two-row, size-ordered layout, and the skin is smoother.
  - **Worse than M3:** the belly colour has drifted from M3's clean cream to a khaki/olive dish (hue 34-41, sat 0.30, luma about 130), and the body is still a taller egg than sheet 03's gumdrop. Glazey is explicitly re-gated in M4, so I list this under fix item 2 rather than as a separate blocker. It must be corrected before pass.

```json
{"gate":"M4","iter":4,"verdict":"FAIL","mean":6.8,"min":6,"blockers":0,"store_page":false}
```
