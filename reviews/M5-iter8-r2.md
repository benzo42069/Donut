# Review M5 iter 8 (reviewer 2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M5 --iter 8-r2` at commit `c0e1194`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 18 files to `shots/M5/8-r2/` and exited with code 0.
- **Viewed:** every 1920x1080 still, the 844x390 hero, both strip composites and all six strip frames.
- **Zoomed crops:** 2x crops of the bite-1, bite-3 and crumbs f0 donut and belly; a 4x crop of the bite-3 carve; a 3x crop of the bite-3 belly; and a 2x crop of the roll ball.
- **Pixel diff:** I diffed every frame against `shots/M5/7-r2/` at a threshold of 24/255.
- **Sampled:** median saturation and luma of the bite face and the glaze top.
- **Read beforehand:** `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4, `art/reference/NOTES.md` and all four references (01-04). I also viewed the M2 (`m2-ground`), M3 (`gallery-donut-bites`) and M4 (`m4-walk-strip`) finals.
- **Pass bar:** mean ≥ 7.5 and every category ≥ 6. I applied it unchanged.

**Summary.** Iter 8 made three parameter changes: bite radius 0.19 → 0.23, show-off turn 1.1 → 1.8 and belly `facing` -0.7 → -0.35. It also retuned the roll dust.
- **What landed:** the bite now reads in bite-1 and in crumbs f1/f2. That is a real improvement.
- **Belly:** it did not move. In every munch shot the diff is confined to x < 988, and the belly disc sits at about 940-1060.
- **Roll:** the dust retune changed **16 pixels**. The shot is the same composition for the sixth iteration.
- **Burp:** the strip is **pixel-identical** to iter 7.
- **New flaw:** at radius 0.23, the bite-3 carve tears through the underside of the ring and leaves hanging fingers of crumb.

The gate mean is **6.98**, up 0.02. The §5 plateau is still triggered: iters 6-8 have gained +0.13 in total. This iteration was again parameter tweaks, not the structural change §5 requires.

This was iteration 8. Under §2/§6, a FAIL here means **the builder must escalate to the user** before iteration 9.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 7 | 7 | 7 | 7 | 8 | 7 | 7 | 7 | 7 | 7 | – | 7.1 |
| m5-bite-3 (hero) | 7 | 8 | 7 | 7 | 8 | 7 | 6 | 7 | 8 | 7 | – | 7.2 |
| m5-crumbs-strip | 7 | 7 | 7 | 7 | 8 | 7 | 7 | 7 | 8 | 7 | 7 | 7.18 |
| m5-burp-strip | 7 | 6 | 7 | 7 | 7 | 6 | 7 | 7 | 8 | 7 | 7 | 6.91 |
| m5-belly-5-roll | 6 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | 7 | 7 | – | 6.5 |

- **Gate mean:** 6.98 (363 / 52). The bar is 7.5.
- **Minimum:** 6.
- **Gap to the bar:** the gate fails on the mean, by 0.52.
- **Trend:** 6.3 → 6.6 → 6.65 → 6.71 → 6.85 → 6.85 → 6.96 → 6.98.

**Score changes from iter 7:**
- **bite-1 detail:** 6 → 7, because the bite reads.
- **crumbs charm:** 7 → 8, because the strip now tells the bite story.
- **bite-3 voxel/form:** 7 → 6, because of the torn carve (see blocker-adjacent finding 3).
- **Unchanged:** burp and roll, which are identical renders.

## Blockers
None. Here is the art bible §10 check across all shots:
- **Lighting and mesh artifacts:** no z-fighting, shadow acne or light leaks.
- **Overlays and kid-safety:** no debug overlays and nothing scary.
- **Clipping:** no blown whites on large areas.
- **bite-3 gaps:** the lawn shows through between the crumb fingers below the bite. These are carve geometry, not mesh holes, so I scored them under voxel/form rather than as §10.1. If they grow any further they will read as holes.
- **Burp f2 hoop seam:** still present, scored under tech and materials, as in iter 7.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** re-author the munch-pose belly. This is open since M4 iter 8, the sixth review running, and it is the most visible flaw in the hero.
   - **Where:** the belly patch in `src/art/models/glazey.ts` (`faceLayout`, the `glazeyBellySoft`/`glazeyBellyEdge` dome) and its deformation under `GlazeyRig.grip` (`src/game/player/GlazeyRig.ts`).
   - **Why the iter-8 tweak failed:** the `facing` change had no visible effect in any munch shot (the diff is confined to x < 988).
   - **Problem:**
     - In bite-3, the cream is a disc at about 940-1060, 700-850. It forms the body's outer silhouette on the donut side, and its outer rim is a two-tone stepped terrace (3x crop).
     - It still reads as a second, unglazed pancake held beside the donut.
     - bite-1 and crumbs f1/f2 show the same thing.
   - **Target:**
     - The belly stays inside the coral silhouette in every munch frame, with a coral margin of at least 8 px at 1080p on the donut side.
     - A soft oval on the front of the body, as in burp f0 and 03 "munching".
     - No two-tone terrace ring.
   - **Structural option:** mask the belly to the body's front hemisphere in the rig's grip frame, rather than nudging `facing`.
2. **What:** make the roll actually roll. It is unchanged for six iterations, and the iter-8 dust retune produced 16 changed pixels.
   - **Where:** `src/debug/scenes/m5Munch.ts`, about lines 119-128. The still is timed on `game.motion.roll`, but the rig is driven by `GlazeyAnimator.spin` (line 150) through `GlazeyRig` (`lean.rotation`, line 153, applies only `p.roll`, a small side lean).
   - **Suspicion:** the value the harness waits on is not the one that turns the visible ball.
   - **Problem:**
     - The ball (740-1120, 510-900) is an upright face with the tuft straight on top.
     - There is no squash and no dust; check the dust gate (`this.rolling && m.grounded && m.speed > 0.5`, `Game.ts` about line 776) at `stillTime`.
     - The belly is a flat-topped cream chin strap.
   - **Target:**
     - The face and tuft rotated 20-40° off upright, with the belly rotating with the body.
     - 5-8 % squash at a visible contact patch.
     - 3-5 lit dust puffs past the ball, legible at 844x390.
3. **What:** clean up the torn bite-3 carve. This is new in iter 8.
   - **Where:** `biteSdf` and `biteDonut` in `src/art/models/donut.ts`.
     - Noise displacement is a fixed `n*1.3 + m*0.6` voxels whatever the radius.
     - The jaw is stretched 1.6x vertically.
     - The sliver pass only removes one-voxel fins.
     - There is no connected-component cleanup.
   - **Problem:**
     - At radius 0.23 (`Game.ts` line 645), the third bite cuts through the ring's underside.
     - It leaves 4-6 multi-voxel crumb fingers hanging below the bite (about 850-950, 770-830 in bite-3), with the lawn visible between them.
     - It reads as shredded, not as the scalloped carve in 04 (bottom-left) or the M3 gallery bites.
   - **Target:**
     - A 2-3 cusp scalloped lip.
     - No hanging strand longer than 2 voxels.
     - No background visible through the bite.
     - The ring's lower outline is intact or cleanly cut.
   - **Suggested approach:** flood-fill from the ring's main body and drop islands, then erode fins thicker than one voxel near the carve. Alternatively, keep 0.23 for bite 1 and clamp later bites so they do not reach the underside.
4. **What:** soften the crumb interior. This is unchanged.
   - **Where:** the `golden` branch of `biteDonut`, where `h > 0.55` sets `bunGolden`, so about 37 % of crumb voxels are orange.
   - **Problem:** the median saturation is 0.511 (bite-1) and 0.506 (bite-3). The face is an orange-on-cream speckle (clearly visible in the 4x crop) that reads cracked rather than spongy.
   - **Target:** saturation ≤ 0.46, `bunGolden` ≤ 15 % of crumb voxels (or a mid tone between `crumbFresh` and `bunGolden`), and a soft golden sponge like the M3 gallery bites.
5. **What:** fix the burp hoop seam and the portal read in f2. This is unchanged; the strip is pixel-identical to iter 7.
   - **Where:** the band and instance placement in `src/game/fx/BurpWave.ts` (`update()`), and `hoopGrow`.
   - **Problem:**
     - **f2 seam:** the hoop's right edge (about 1150-1190, 650-700) has a horizontal break where the band cubes step out of line.
     - **f2 shape:** the hoop is a 2:1 standing ellipse about 480 px tall, beside him rather than leaving him, so it reads as a portal or the digit "0".
   - **Target:**
     - A continuous ring at every angle.
     - In f2, the hoop has travelled visibly forward from his mouth, by at least one body width.
6. **What:** frame Glazey larger in the burp strip.
   - **Where:** the burp stage camera in `m5Munch.ts`.
   - **Problem:** he is about 330-400 px tall and pushed right of centre.
   - **Target:** he is at least 40 % of the frame height, and the hoop and ground ripple stay in frame.
7. **What:** shrink the roll foreground frosting band.
   - **Where:** the roll stage camera and placement.
   - **Problem:**
     - The pink band runs from (300, 1080) to (1920, 780) and covers about 18 % of the frame.
     - Its sprinkles render at about 20x10 px, which breaks the art bible §3 limit of ~6 px per prop voxel.
     - The frosting is relief-free, the 02 "Ignore" flaw.
   - **Target:** ≤ 5 % of the frame, with no near voxel over the §3 limits.
8. **What:** make the burp's grass reaction and distortion visible.
   - **Where:** `BurpWave.ts`.
   - **Problem:** the rainbow ground ripple is lovely, but there is no blade lean in front of the wave front and no warp at the hoop edge (art bible §8).
   - **Target:** blades within about 1 m of the wave front visibly lean outward, and a subtle refraction band hugs the hoop.

## What is working (keep it)
- **The first bite now reads:**
  - bite-1 shows a carve about 80 px wide at 1080p, with golden crumb at about 905-988, 690-780.
  - crumbs f1/f2 show carves of about 65-75 px.
  - At 844x390 the hero bite is about 35 px and reads as "bitten".
- **The show-off turn:** at 1.8 it presents the bite to the lens without hiding his face.
- **Crumbs:**
  - f0 has the crumb clump inside the open mouth, on-model with 03 "munching".
  - Crumbs arc down from the bite and settle on the lawn in f1, f2 and bite-3.
- **Vanilla glaze:** glaze-top saturation is 0.33 at luma 215, with cream specular and pale drips.
- **Hands:** they cradle the ring in every munch frame.
- **Faces and the burp ripple:**
  - The bite-3 laughing grin, closed-eye arcs and blush.
  - The burp f0 surprised "o" with eye glints.
  - The pastel rainbow ground ripple.
- **World and grade:** the bakery, lighthouse, sprinkle trees, frosting rim drips, milk lagoon and golden grade are stable against M2-M4.

## Store-page test: no
At 844x390, bite-3 now reads as "happy Glazey chomping a vanilla donut he's clearly bitten". The bite is the best it has been, but a polished store page would still reject it:
- The cream belly pokes out of his side as a stepped disc, right at the focal point beside the donut.
- The bite's underside hangs in ragged crumb strands.
- The bite face is an orange speckle.

The roll shot, unchanged for six iterations, would not make a store page.

## Previous fix list (M5-iter7-r2) status
1. **Munch-pose belly:** not fixed. The `facing` change produced no visible difference in the munch shots.
2. **Bite visible in bite-1 and crumbs frames:** fixed.
   - bite-1 is about 80 px and f1/f2 about 65-75 px (target 40). f0 is the chomp frame.
   - The deeper radius introduced the torn underside in bite-3 (new fix 3).
3. **Roll reads as rolling:** not fixed. The render is identical apart from 16 pixels.
4. **Roll foreground band:** not fixed.
5. **Burp hoop seam and portal:** not fixed (pixel-identical).
6. **Burp framing:** not fixed (pixel-identical).
7. **Crumb interior:** not fixed (saturation 0.506-0.511).
8. **Burp grass reaction and distortion:** not fixed.

## Regression check
Against `shots/M2/final`, `shots/M3/final` and `shots/M4/final`:
- **World (terrain, bakery, trees, lighthouse, lagoon, sky, grade):** no visible drop.
- **Standing-pose belly:** it matches the M4 walk oval (burp f0/f1).
- **Carve code:** `biteDonut`/`biteSdf` were not changed this iteration; only the in-game radius in `Game.ts` changed. The M3 gallery bites are therefore not affected.
- **Watch item:** the in-hand carve is now visibly rougher than the M3 gallery bites. If fix 3 is done by changing the shared SDF, re-check `gallery-donut-bites` against M3 final.

```json
{"gate":"M5","iter":"8-r2","verdict":"FAIL","mean":6.98,"min":6,"blockers":0,"store_page":false}
```
