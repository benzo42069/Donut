# Review M5 iter 6 (reviewer 2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M5 --iter 6-r2` at commit `b83dc8e`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 18 files to `shots/M5/6-r2/`.
- **Viewed:** every 1920x1080 still, the 844x390 hero, the crumbs strip composite and all six strip frames.
- **Zoomed crops (2x-3x, nearest-neighbour):** Glazey and the donut in bite-1 and bite-3; the face in crumbs f0; the held donut in crumbs f2.
- **Sampled:** luma and saturation of the glaze and the crumb interior, as region medians with a scratchpad script.
- **Read beforehand:** `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4, `art/reference/NOTES.md` and all four references. I also viewed the M3 (`gallery-donut-bites`) and M4 (`m4-walk-strip`) finals and `reviews/M5-iter5-r2.md`.
- **Pass bar:** mean ≥ 7.5 and every category ≥ 6. I applied it unchanged.

**Summary.** Iter 6 fixes one long-standing item: the near hand now reaches the donut rim in every munch frame. The burp f0 belly is also a centred oval again. Little else moved:
- **Crumbs over the eye:** the crumbs f0 spray still sits across his far brow and eye. This is the fourth iteration running, and the commit message claims it is fixed.
- **Bites:** neither bite-1 nor crumbs f2 shows a bite on the held donut.
- **Glaze:** it is still apricot.
- **Munch belly:** it is still a lopsided cream disc on the left side.
- **Burp hoop:** it is still a standing 2:1 portal.
- **Roll:** the shot is unchanged for the fourth iteration.

The gate mean is **6.85**, the same as iter 5. The §5 plateau rule stays triggered: iters 4-6 have gained +0.14 in total.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | – | 6.8 |
| m5-bite-3 (hero) | 7 | 8 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | 7.2 |
| m5-crumbs-strip | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 6 | 6 | 7 | 6.8 |
| m5-burp-strip | 7 | 6 | 7 | 7 | 7 | 6 | 7 | 7 | 8 | 7 | 7 | 6.9 |
| m5-belly-5-roll | 6 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | 7 | 7 | – | 6.5 |

- **Gate mean:** 6.85 (356 / 52). The bar is 7.5.
- **Minimum:** 6.
- **Gap to the bar:** the gate fails on the mean, by 0.65.
- **Trend:** 6.3 → 6.6 → 6.65 → 6.71 → 6.85 → 6.85. The gate has plateaued.

## Blockers
None. Here is the art bible §10 check across all shots:
- **Lighting and mesh artifacts:** no z-fighting, shadow acne, light leaks or mesh holes.
- **Overlays and kid-safety:** no debug overlays and nothing scary.
- **Clipping:** no blown whites on large areas. The sun glint on the frosting by the pier (about 1500-1600, 590-640) is a bloom highlight, not a clip.
- **Crumbs over the eye:** this is a quality defect. I scored it under charm and tech in the crumbs strip.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** stop the crumbs crossing his eye. This is open for the fourth iteration.
   - **Where:** `src/game/Game.ts` lines 669-692.
   - **Problem:**
     - In crumbs f0, about 15 crumbs cluster from the mouth corner up over the far eyebrow and eye, at about (905-985, 650-720).
     - The world-space filter (`at.y > lips.y - 0.02` → skip) and `up: [-0.5, 0.05]` do not prevent this. The spawn points sit just in front of the face toward the lens, so they *project* over the brow even when they are below the lips in world Y.
     - The camera's elevation and the `out` vector toward the lens make it worse.
   - **Target:**
     - In f0, no crumb pixel is above the mouth's top edge in screen space.
     - Filter or offset the spawn points in camera space: project them, and reject any above the lip line.
     - Alternatively, spawn from the donut's lower outer rim, ≥ 0.12 m from the face, with a down-only initial velocity.
2. **What:** make the bite visible on the held donut in bite-1 and in every crumbs frame after the first bite. bite-1 is the gate's "first bite" shot and currently shows an intact ring.
   - **Where:** the ring turn in `src/game/munch/Munch.ts` and the iter-6 "smaller show-off turn".
   - **Problem:**
     - **bite-1:** the held donut (775-1010, 615-775) shows an unbroken rim everywhere. The bite is hidden against his mouth or on the far side.
     - **crumbs f2:** same; the crop at (760-1060, 580-800) shows an intact rim.
     - **crumbs f1:** only a sliver shows.
     - **bite-3:** the only shot where the scallop reads clearly.
   - **Target:** in every munch frame after the first bite, at least one scalloped carve with golden crumb is clearly visible from the camera (≥ 40 px wide at 1080p), like the 04 bottom-left donut.
3. **What:** re-author the munch-pose belly. This is open since M4 iter 8.
   - **Where:** the belly patch in `src/art/models/glazey.ts`, and how it deforms in the grip pose (`GlazeyRig.grip`).
   - **Problem:**
     - In bite-3, the belly is a cream disc that pokes out past the body silhouette on the left (940-1060, 700-830). It reads as a second, unglazed pancake held next to the donut.
     - In bite-1 and crumbs f2, it is a crescent wedge under the arm with a hard stepped edge (960-1060, 740-820).
     - The burp f0 standing pose shows the right answer: a centred oval.
   - **Target:**
     - The belly stays inside the body silhouette in every pose.
     - It reads as a soft oval on the front of the body, as in M4 walk and 03 "munching".
4. **What:** give the roll a roll. This is unchanged since iter 3.
   - **Where:** the roll pose in `GlazeyAnimator.ts`, the `VoxelParticles` dust, and the M5 roll stage.
   - **Problem:**
     - The ball (740-1120, 510-900) is an upright face with the tuft on top.
     - There is no tilt or squash, the contact is buried in grass, and there are no dust puffs.
     - The cream belly is a flat-topped chin strap with a straight top edge (840-1040, 840-895).
   - **Target:**
     - The face tilted 20-40° off upright, and the belly rotating with the body.
     - 5-8 % squash at a visible contact patch.
     - 3-5 lit dust puffs trailing the ball, legible at 844x390.
5. **What:** shrink the roll foreground band.
   - **Where:** the roll stage camera and placement.
   - **Problem:**
     - The pink frosting band covers about 17-20 % of the frame, along a diagonal from (300, 1080) to (1920, 780).
     - Its sprinkles render at about 20x10 px, which breaks the art bible §3 ~6 px prop density limit.
     - The frosting is relief-free: the 02 "Ignore" flaw.
   - **Target:** a foreground band of ≤ 5 %, with no near voxel over the §3 limits.
6. **What:** bring the burp hoop back on-model. This is unchanged.
   - **Where:** `src/game/fx/BurpWave.ts` (`hoopGrow` at line 28, the radius at line 99) and the hoop's vertical stretch and orientation.
   - **Problems by frame:**
     - **f1:** the hoop is a 2:1 vertical ellipse about 500 px tall (860-1250, 450-945) standing on the path. It reads as a portal or the digit "0".
     - **f2:** the hoop crosses in front of his face, and its right edge shows stair-stepped slats (1190-1240, 480-700).
     - **Glazey:** he is about 330 px tall and pushed to the right edge of the action.
   - **Target:**
     - As in 03 "giant burp": a round ring of 0.6-0.9 of his body height, centred on his mouth in f1, that grows as it travels away from him.
     - He is at least 40 % of the frame height.
     - The edges are smooth.
7. **What:** pull the glaze back to vanilla.
   - **Where:** the card-light colour and strength in `Game.ts`, and the `glazeClassic` palette entry.
   - **Problem:** glaze-top saturation is 0.43-0.45 (bite-1 and bite-3), against 0.34 on M3. It is unchanged from iter 5 and reads as apricot fondant next to his coral skin.
   - **Target:** saturation ≤ 0.36 with luma ≥ 200, and a cream-white specular highlight like M3's.
8. **What:** soften the crumb interior.
   - **Where:** the crumb fill jitter in `src/engine/voxel/Carve.ts`.
   - **Problem:** the bite-3 bite face (925-1020, 760-800) has a saturation of 0.50-0.53 and an orange-on-cream speckle.
   - **Target:** saturation ≤ 0.48, value jitter ≤ ±6 %, and a soft golden sponge like the M3 gallery and 04.
9. **What:** make the burp's grass reaction and distortion visible. This is unchanged since iter 3.
   - **Where:** `BurpWave.ts`.
   - **Problem:** the ground rainbow ripple is lovely, but there is no blade lean at the front and no warp at the hoop edge.
   - **Target:** blades within about 1 m of the front visibly lean outward, and there is a subtle refraction band hugging the hoop.

## What is working (keep it)
- **The near hand on the rim:** both arms now cradle the donut in bite-1, bite-3 and all crumbs frames. This closes the hand item that has been open since iter 1.
- **The bite-3 grin:** the laughing open mouth, matte eye arcs and blush are on-model with 03 and charming.
- **The burp f0 face and belly:** the surprised "o", big glinting eyes and a centred oval belly.
- **Crumbs on the lawn:** the settled crumb piles in f1, f2 and bite-3 read well.
- **The burp ground ripple:** the rainbow ground ripple and confetti.
- **World and grade:** the bakery, lighthouse, sprinkle trees, frosting rim with drips, milk lagoon and golden grade are stable against M4.

## Store-page test: no
At 844x390 the hero (bite-3) reads as "happy Glazey chomping a donut", and it is the best frame in the gate. A polished store page would still reject it:
- The glaze is apricot, not vanilla.
- The belly pokes out of his side as a cream disc that competes with the donut's silhouette.
- The bite interior is speckled.

The roll and burp shots would not make a store page at all.

## Previous fix list (M5-iter5-r2) status
1. **Crumbs crossing the eye:** not fixed. f0 still sprays crumbs over the far brow and eye.
2. **Near hand on the donut:** fixed in all munch frames.
3. **Belly oval in munch and roll:** not fixed. It is a protruding disc or crescent in munch and a chin strap in roll. The standing burp f0 pose is fine.
4. **Roll reads as rolling:** not fixed. The shot is unchanged.
5. **Roll foreground band:** not fixed.
6. **Burp hoop on-model:** not fixed.
7. **Glaze back to vanilla:** not fixed. Saturation is 0.43-0.45.
8. **Crumb interior:** partly fixed. Saturation is 0.50-0.53, down from 0.62, but still above the target.
9. **Bite visible through the crumbs strip:** not fixed, and bite-1 has regressed to show no bite at all.
10. **Burp grass reaction and distortion:** not fixed.

## Regression check
Against `shots/M2/final`, `shots/M3/final` and `shots/M4/final`:
- **World (terrain, props, lagoon, sky, grade):** no visible drop.
- **Held glaze:**
  - It is at the same warm shift as iter 5 (sat 0.43-0.45 against 0.34 on M3).
  - It has not moved further toward orange, so per my iter-5 note it is still scored, not blocked.
- **Belly in standing pose:** in burp f0 it matches the M4 walk oval, so the base asset has not regressed. The munch-pose distortion is an M5 rig issue.

```json
{"gate":"M5","iter":"6-r2","verdict":"FAIL","mean":6.85,"min":6,"blockers":0,"store_page":false}
```
