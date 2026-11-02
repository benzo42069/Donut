# Review M5 iter 7 (reviewer 2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M5 --iter 7-r2` at commit `a4d6808`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 18 files to `shots/M5/7-r2/`.
- **Viewed:** every 1920x1080 still, the 844x390 hero, both strip composites and all six strip frames.
- **Zoomed crops (2x, nearest-neighbour):** Glazey and the donut in bite-1 and bite-3; crumbs f0, f1 and f2; and the burp f2 hoop edge with his face.
- **Sampled:** region-median saturation and luma of the glaze top and the bite face, with a scratchpad script.
- **Read beforehand:** `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4, `art/reference/NOTES.md` and all four references (01-04). I also viewed the M2 (`m2-ground`), M3 (`gallery-donut-bites`) and M4 (`m4-walk-strip`) finals.
- **Pass bar:** mean ≥ 7.5 and every category ≥ 6. I applied it unchanged.

**Summary.** Iter 7 closes two long-standing items:
- **Crumbs over the eye:** fixed. In crumbs f0 the only crumbs above the donut are a small clump inside the open mouth, which reads as chewing (on-model with 03 "munching"). Nothing sits on the brow or eye.
- **Glaze:** now vanilla. Glaze-top saturation is 0.33-0.37 at luma 209-216, down from 0.43-0.45.
- **Burp hoop:** partly improved. In f1 it is about his height and level with his mouth.

The structural problems from the last three reviews are untouched:
- **Munch belly:** still a cream pancake that pokes out of his left side.
- **Bite size:** the bite on the held donut is still a ~20 px nick in bite-1 and the crumbs strip.
- **Roll:** the shot is pixel-for-pixel the same composition for the fifth iteration.

The gate mean is **6.96**, up 0.11. The §5 plateau rule stays triggered: iters 5-7 have gained +0.11 in total.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 7 | 7 | 7 | 7 | 8 | 7 | 7 | 6 | 7 | 7 | – | 7.0 |
| m5-bite-3 (hero) | 7 | 8 | 7 | 7 | 8 | 7 | 7 | 7 | 8 | 7 | – | 7.3 |
| m5-crumbs-strip | 7 | 7 | 7 | 7 | 8 | 7 | 7 | 7 | 7 | 7 | 7 | 7.09 |
| m5-burp-strip | 7 | 6 | 7 | 7 | 7 | 6 | 7 | 7 | 8 | 7 | 7 | 6.91 |
| m5-belly-5-roll | 6 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | 7 | 7 | – | 6.5 |

- **Gate mean:** 6.96 (362 / 52). The bar is 7.5.
- **Minimum:** 6.
- **Gap to the bar:** the gate fails on the mean, by 0.54.
- **Trend:** 6.3 → 6.6 → 6.65 → 6.71 → 6.85 → 6.85 → 6.96.

## Blockers
None. Here is the art bible §10 check across all shots:
- **Lighting and mesh artifacts:** no z-fighting, shadow acne, light leaks or mesh holes.
- **Overlays and kid-safety:** no debug overlays and nothing scary.
- **Clipping:** no blown whites on large areas.
- **Burp f2 hoop seam:** the seam on the right-hand side of the hoop (see fix 5) is an FX stepping defect, not a mesh hole. I scored it under tech and materials.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** re-author the munch-pose belly. This is open since M4 iter 8 and is now the single most visible flaw in the hero.
   - **Where:** the belly patch in `src/art/models/glazey.ts` and its deformation under `GlazeyRig.grip` (`src/game/player/GlazeyRig.ts`).
   - **Problem:**
     - In bite-3, the cream belly is a disc between the donut and his near arm (about 930-1060, 700-830). Its left edge forms the body's outer silhouette with a hard stepped rim, so it reads as a second, unglazed pancake held beside the donut.
     - In bite-1 and crumbs f1/f2 it is a crescent wedge under the arm, with a stepped terrace edge (about 960-1060, 700-830).
     - Burp f0 and f1 show the correct answer: a centred oval on the front of the body.
   - **Target:**
     - The belly stays inside the coral silhouette in every munch frame, with a coral margin of at least 8 px at 1080p on the side facing the donut.
     - It reads as a soft oval on the front of the body, as in 03 "munching" and the M4 walk.
2. **What:** make the bite read in bite-1 and every crumbs frame.
   - **Where:** the show-off turn and bite placement in `src/game/munch/Munch.ts`.
   - **Problem:**
     - **bite-1:** the only carve is a nick of about 20-25 px at the rim next to his chin (about 950-975, 690-720). At 844x390 it is invisible, so the "first bite" shot shows an intact donut.
     - **crumbs f1 and f2:** the nick is the same size or smaller.
     - **bite-3:** the only shot where the scallop reads properly (about 860-960, 700-830).
   - **Target:**
     - In every munch frame after the first bite, a scalloped carve at least 40 px wide at 1080p (about 18 px at 844x390), showing golden crumb, like the 04 bottom-left donut and the M3 gallery bites.
     - Either carve the first bite deeper (a 2-3 tooth scallop), or turn the ring so the bite faces the lens rather than his chin.
3. **What:** give the roll a roll. This is unchanged since iter 3, and the composition is identical for the fifth iteration.
   - **Where:** the roll stage in `src/debug/shots.ts` (`m5Shot('roll')`), the `rolling`/`spin`/`tuck` path in `src/game/player/GlazeyAnimator.ts` (lines 147-150), and the `VoxelParticles` dust.
   - **Problem:**
     - The ball (740-1120, 510-900) is an upright face with the tuft straight on top, so `rollAngle` is effectively 0.
     - There is no squash, and the contact patch is buried in grass.
     - There are no dust puffs.
     - The belly is a flat-topped cream chin strap (840-1040, 840-895).
   - **Target:**
     - The face and tuft rotated 20-40° off upright, with the belly rotating with the body.
     - 5-8 % squash at a visible contact patch.
     - 3-5 lit dust puffs trailing the ball, legible at 844x390.
4. **What:** shrink the roll foreground frosting band.
   - **Where:** the roll stage camera and placement.
   - **Problem:**
     - The pink band runs from (300, 1080) to (1920, 780) and covers about 18 % of the frame.
     - Its sprinkles render at about 20x10 px, which breaks the art bible §3 limit of ~6 px per prop voxel.
     - The frosting is relief-free, the 02 "Ignore" flaw.
   - **Target:** a foreground band of ≤ 5 % of the frame, with no near voxel over the §3 limits.
5. **What:** fix the burp hoop seam, and stop the hoop reading as a portal in f2.
   - **Where:** the band and instance placement loop in `src/game/fx/BurpWave.ts` (`update()`, about line 105 onward), and `hoopGrow` at line 28.
   - **Problem:**
     - **f2 seam:** the hoop's right edge (about 1130-1190, 670-700) has a horizontal break where the band cubes step out of line, which reads as a torn seam.
     - **f2 shape:** the hoop is a 2:1 standing ellipse about 480 px tall, beside him rather than leaving him, so it again reads as a portal or the digit "0".
     - **f1:** better, at about his height and level with his mouth.
   - **Target:**
     - A continuous ring with no visible step at any angle; consider orienting the cubes along the tangent.
     - In f2, the hoop has travelled visibly forward from his mouth, by at least one body width.
6. **What:** frame Glazey larger in the burp strip.
   - **Where:** the burp stage camera.
   - **Problem:** he is about 330-400 px tall (31-37 % of the frame) and pushed right of centre.
   - **Target:** he is at least 40 % of the frame height, and the hoop and ground ripple stay in frame.
7. **What:** soften the crumb interior.
   - **Where:** the crumb fill jitter in `src/engine/voxel/Carve.ts`.
   - **Problem:** the bite-3 bite face (about 880-930, 770-820) has a median saturation of 0.50, with an orange-on-cream speckle that reads as cracked rather than spongy.
   - **Target:** saturation ≤ 0.46, value jitter ≤ ±6 %, and a soft golden sponge like the M3 gallery bites.
8. **What:** make the burp's grass reaction and distortion visible. This is unchanged since iter 3.
   - **Where:** `BurpWave.ts`.
   - **Problem:** the rainbow ground ripple is lovely, but there is no blade lean in front of it and no warp at the hoop edge.
   - **Target:** blades within about 1 m of the wave front visibly lean outward, and a subtle refraction band hugs the hoop.

## What is working (keep it)
- **Crumbs:** the f0 crumb clump in the open mouth reads as chewing and is on-model with 03. The crumbs settle on the lawn under the donut in f1, f2 and bite-3.
- **Vanilla glaze:** saturation 0.33-0.37 at luma 209-216, cream-white specular and pale drips. It now sits much closer to M3 than to apricot.
- **Hands:** both arms cradle the ring in every munch frame.
- **The bite-3 grin:** the laughing open mouth, closed-eye arcs and blush are charming.
- **Burp f0:** the surprised "o", glinting eyes and centred oval belly.
- **Burp ripple:** the pastel rainbow hoop and ground ripple.
- **World and grade:** the bakery, lighthouse, sprinkle trees, frosting rim drips, milk lagoon and golden grade are stable against M2-M4.

## Store-page test: no
At 844x390, bite-3 reads as "happy Glazey chomping a vanilla donut", and with the glaze fixed it is closer than ever. A polished store page would still reject it:
- The cream belly pokes out of his side as a stepped disc that competes with the donut silhouette right at the focal point.
- The bite face is speckled.

The roll shot, unchanged for five iterations, would not make a store page.

## Previous fix list (M5-iter6-r2) status
1. **Crumbs crossing the eye:** fixed.
2. **Bite visible in bite-1 and crumbs frames:** partly fixed. A nick of about 20-25 px is now present, but it is under the 40 px target and invisible at 844x390.
3. **Munch-pose belly:** not fixed.
4. **Roll reads as rolling:** not fixed (unchanged).
5. **Roll foreground band:** not fixed (unchanged).
6. **Burp hoop on-model:** partly fixed.
   - f1 is about his height and centred near his mouth.
   - f2 is still a 2:1 standing portal and has a seam.
   - He is still small in frame.
7. **Glaze back to vanilla:** fixed (saturation 0.33-0.37).
8. **Crumb interior:** not fixed (saturation about 0.50).
9. **Burp grass reaction and distortion:** not fixed.

## Regression check
Against `shots/M2/final`, `shots/M3/final` and `shots/M4/final`:
- **World (terrain, bakery, trees, lighthouse, lagoon, sky, grade):** no visible drop.
- **Held glaze:** it has moved back toward the M3 classic glaze, so it is no longer a concern.
- **Standing-pose belly:** in burp f0 and f1 it matches the M4 walk oval. The munch-pose distortion is an M5 rig issue, not a base-asset regression.

```json
{"gate":"M5","iter":"7-r2","verdict":"FAIL","mean":6.96,"min":6,"blockers":0,"store_page":false}
```
