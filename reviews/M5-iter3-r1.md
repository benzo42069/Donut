# Review M5 iter 3 (reviewer r1)
## Verdict: FAIL

Commit reviewed: 497f9da. The harness ran on the GPU path (ANGLE Metal, Apple M4) and wrote 18 files to `shots/M5/3/`. I viewed every 1920x1080 frame, both strip composites, every strip frame (f0 to f2) and the 844x390 versions. I also viewed 2x to 4x crops of:
- the munch face, the hand, the carve lip and the held glaze;
- the crumbs in all three strip frames;
- the burp hoop, the ground ring and the surprised face;
- the roll ball;
- the foreground grass and sand.

Before that I read the art bible, the rubric and pass bar (§3–§4), `NOTES.md` and all four references. For the regression check I viewed `shots/M2/final/m2-hero`, `shots/M3/final/gallery-donut-bites`, `shots/M4/final/m4-jump-apex` and `shots/M4/final/gallery-glazey-belly`. The fidelity targets are:
- **K-07** (ref 04, bottom-left): a scalloped bite with a crumb interior and crumbs on the table.
- **K-05** (ref 03): the munching, giant-burp and perfectly-round poses.

Short version: three iter-2 findings are cleanly fixed.
- The bald green disc under the donut is gone, and the lawn is whole.
- The pier rails no longer grow out of his head.
- The roll frame now has the lighthouse fully in shot and a lower horizon.

But one change made things worse. The new arm reach puts a smooth, round coral hand directly in front of his mouth, and at every munch framing it reads as a **pig snout or an elephant trunk**. It hides the mouth in the gate's hero frame. Other problems remain:
- The held glaze is still chalky in most frames, so the blocker is narrowed but not closed.
- The crumbs still burst over his brow (f0) and paste onto his belly (f1).
- The roll has lost its tilt and still has no motion cues.

The gate mean is flat: 6.65 in iter 2, **6.63** now. Iter 1 was 6.44, so the gain over two iterations is 0.19. **That triggers the §5 plateau rule: the next iteration needs a structural change, not more tweaks.**

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 6 | 6 | 7 | 7 | 7 | 6 | 6 | 7 | 6 | 7 | – | 6.50 |
| m5-bite-3 | 7 | 6 | 7 | 7 | 7 | 6 | 6 | 7 | 6 | 6 | – | 6.50 |
| m5-crumbs-strip | 6 | 6 | 7 | 7 | 7 | 6 | 6 | 7 | 6 | 6 | 6 | 6.36 |
| m5-burp-strip | 7 | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 6.91 |
| m5-belly-5-roll | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | – | 6.90 |

**Gate mean: 6.63. Minimum: 6.** No category is below 6. The gate fails on:
- the mean (the bar is 7.5);
- the regression blocker below;
- the store-page test.

## Blockers
- **[m5-bite-3 (hero), m5-crumbs-strip f0/f1/f2, m5-bite-1 (partly)] The held classic glaze is still a visible drop from M3, a shared-content regression (§4 rule 5).**
  - The meadow donut uses the same `classicGlaze` palette entries as the M3 gallery (`donut.ts` `LOOK.glazed`). In `shots/M3/final/gallery-donut-bites` that glaze is a warm, peachy, semi-translucent coat with broad soft specular bands and a fresnel rim (art bible §5, "Classic glaze").
  - In the hero frame m5-bite-3, the camera-facing glaze is a flat, near-white, grainy surface with no specular band at all (x 690–990, y 545–720). The only highlight is one small glint at the inner hole (x ~765–780, y ~600–615). Crumbs f0 is the same (x 720–990, y 625–790). So is f1 (x 700–990, y 545–700).
  - Bite-1 is better. Rolling the donut toward the sky gives a warm bloom streak along the inner rim and over the sprinkles (x 800–1000, y 520–600). But that reads as glitter on the sprinkles, not as glossy glaze. The broad glaze top is still matte.
  - This is narrowed from iter 2, but at gallery quality it is not fixed.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Restore the classic glaze gloss on the held donut (the blocker).
   **Where:** the held-donut material and pose in `Game.ts` (held-donut block), against the gallery material in `src/engine/render/Materials.ts` and the `classicGlaze` flags in `src/art/palette.ts`. Check three things:
   - whether the held or remeshed instance loses its env map or spec term after `biteDonut` remeshes;
   - whether the near-white value comes from bloom or exposure on a sky-facing glaze;
   - whether the per-voxel jitter is overpowering the spec.

   **Target:** In bite-3 and in every crumbs frame, the glaze shows:
   - a broad, warm specular band across its upper camera-facing arc;
   - a soft fresnel rim on the silhouette;
   - the M3 peachy translucent tint rather than chalk white.

   Put the held donut next to `gallery-donut-bites` and the two glazes should read as the same material.
2. **What (new, caused by this iteration):** The near hand reads as a **snout or trunk over the mouth**. It is a smooth, round coral blob pushed forward to the lips, and it hides the mouth.
   - bite-3: x 975–1065, y 630–695, the mouth fully hidden.
   - bite-1: x 990–1080, y 615–690.
   - crumbs f0: x 990–1050, y 690–760, where the blob runs down from the face like a trunk.
   - crumbs f1: x 1000–1060, y 620–680.

   At 844x390 it reads as a big pink nose. This breaks rubric 9 (sheet 03 "munching" shows *both* stubby hands holding the food *below* a visible chomping mouth) and art bible §7 (big, expressive mouths).
   **Where:** `GlazeyRig.ts` arm placement (this commit: `rest[2] + 0.42 * reach`, `rest[0] * (1 - 0.42 * reach)`), which drives the hand inward and forward to the face centre line.
   **Target:**
   - The hands sit on the donut's near rim *below* lip height and slightly to either side.
   - Each hand stays visibly joined to the body by an arm form.
   - The open mouth and the newest scallop are both clearly visible in bite-1, bite-3 and every crumbs frame.
   - No coral form crosses the face between the eye arc and the mouth.
3. **What:** The crumb motion is still not a delightful arc (§8).
   - In crumbs f0 the burst is still a cloud over his brow and squint arc (x 950–1035, y 585–665). It does not leave from the bite at the lips.
   - In f1 about 25 crumbs sit pasted on the cream belly as dirt flecks (x 985–1075, y 690–780).
   - In f2 they have disappeared into the grass, with only faint orange specks between the blades (x 840–1050, y 830–880). Nothing is caught mid-hop.

   The commit message says "crumbs fan forward and down away from his face". These frames do not show that.
   **Where:** the emit origin and velocity in `chomp()` (`Game.ts`), the particle–body collision (crumbs must not stick to Glazey), and the crumb settle height. Crumbs should rest on the blade tips or a raised contact plane, not at soil level hidden under the grass.
   **Target:**
   - f0: crumbs leave the newest scallop at mouth height and fan forward and down, away from the camera side of his face.
   - f1: none overlap his face or belly.
   - f2: 3 to 5 crumbs are visibly mid-bounce above the grass, and a loose crescent of crumbs sits readable *on top of* the lawn in front of the donut, as in ref 04.
4. **What:** The carve lip still leaves a sharp sliver. The vertical "horn" from iter 2 is gone. Now a pointed glaze spur sticks out from the lip toward his mouth in bite-3 (x 940–997, y 612–645). It reads as a white fang, not a rounded scallop cusp (§8, ref 04 bottom-left).
   **Where:** the new sliver-shave pass in `biteDonut` (`src/art/models/donut.ts`). It only removes voxels with fewer than 3 neighbours or that are open on both sides along one axis. A tapered 2–3-voxel wedge survives.
   **Target:** No glaze or dough protrusion longer than about 2 voxels sticks out beyond the scallop arcs. For example, run a morphological open (erode then dilate) on the glaze layer within 3 voxels of the bite SDF, so the cusp between scallops is a soft rounded point.
5. **What:** The roll still doesn't read as rolling, and its tilt is gone.
   - The ball sits upright with its face square to camera, so it reads as a round Glazey *standing* on the path.
   - There is no squash, and no dust or grass puffs can be seen, despite the commit's "more roll dust".
   - The 5-stripe tuft, his signature, is almost entirely hidden behind the top of the ball (x 980–1060, y 485–500).
   - The cream belly is a D shape with a flat, straight-cut lower edge and a ragged pale ring around it (x 1000–1180, y 610–750). It reads as a bib sticker, not sheet 03's "perfectly round" tummy.

   **Where:** the roll still selection in `m5Munch.ts` (it waits for `roll` to bring the face to the front, which also kills the tilt), the roll FX in `GlazeyAnimator.ts`, and the belly-5 layout in `glazey.ts` (`bellyLayout` and `faceLayout`).
   **Target:**
   - The body is visibly rotated 20–35° along the direction of travel.
   - There is about 5 % squash along the contact axis.
   - 3 to 6 voxel dust or grass puffs trail behind him and read at 844x390.
   - At least 3 tuft stripes are visible.
   - The belly is a full rounded oval with no straight edge.
6. **What:** The burp is closer but still not sheet 03's "giant burp".
   - In f1 the hoop's right edge (x ~1095) is about 70 px from his mouth (x ~1165, y ~700). That is better than 150 px, but they still do not touch.
   - The screen-space ripple is still invisible in every frame. No displacement shows on the grass, tree trunk or frosting rim behind or around the hoop (§8).
   - The hoop is still a perfectly smooth glowing tube with no voxel stepping (rubric 7), next to voxel ground-ring cubes.
   - In f1 the ring cubes clip through the back rim of the chocolate donut (x 1450–1750, y 1000–1020).

   **Where:** the spawn offset in `BurpWave.ts`, and the `Ripple.ts` displacement band and amplitude.
   **Target:**
   - In f1 the hoop's near edge overlaps his open mouth.
   - The ripple shows 6–10 px of visible displacement on the background inside a band around the ring.
   - The hoop has a faint voxel step or a sparkle-voxel sheath.
   - Ring cubes ride over props or skip them.
7. **What:** Munch-frame composition: three distractions pull the eye off Glazey (rubric 2).
   - **A big, soft, two-lobed dark shadow** from an offscreen object spreads across the foreground sand path in every munch frame (x 440–1360, y 930–1080). It reads as a looming ear-shaped silhouette, and it fills the empty bottom quarter of the frame.
   - **The top-left pink tree canopy** is cropped into a floating mauve blob with no visible trunk at 1920x1080 (bite-1 x 0–320, y 0–430; bite-3 x 0–290, y 0–410). It is the largest, most saturated mass in the frame, and it competes with the subject.
   - **The tuft touches the lighthouse.** In bite-3 the blue stripe ends at the lighthouse's left edge (x ~1135, y 390–450). In bite-1 the tuft overlaps the red and white stripes (x 1150–1175, y 400–470). Rainbow on candy-stripe muddies Glazey's signature silhouette.

   **Where:** the camera in `munchStage()` (`m5Munch.ts`) and the offscreen prop placement near the camera in `MeadowDiorama.ts`.
   **Target:**
   - The bottom quarter of the frame is lawn or path without large unexplained shadow shapes.
   - No canopy is cut by the frame edge without its trunk.
   - The tuft sits against sky or tree green, with at least 30 px of clearance from the lighthouse.
8. **What:** Near-terrain voxel density at the low munch camera breaks art bible §3 (≤ about 12 px on terrain).
   - The foreground grass clumps in the lower corners are 12–15 px cubes that read as Lego blades (bite-3 x 1500–1920, y 930–1080; bite-1 lower-left x 0–160, y 960–1080).
   - The sand path's per-voxel colour cells are about 20–25 px at the bottom edge (x 500–1400, y 950–1080).
   - One grass cube floats detached above the sand (bite-3 x ~1775–1790, y ~980–995).

   **Where:** the grass-tuft voxel size and LOD in `MeadowDiorama.ts`, and the terrain jitter cell size for the path.
   **Target:**
   - Grass cubes are ≤ 10 px at 1080p in every munch frame.
   - The sand jitter cells are ≤ 12 px.
   - No blade voxel is separated from its stem.

   Alternatively, lift or tilt the camera so the nearest terrain sits further away.
9. **What:** The new belly seam reads as an outline, not a blend.
   - In burp f0 a uniform tan band rings the cream patch (x 1085–1180, y 690–830). It looks like a sticker border.
   - In the roll shot the seam is ragged and pale (see fix 5).
   - M4's `gallery-glazey-belly` has no outline, and sheet 03 shows soft cream terraces fading into the coral.

   **Where:** the `glazeyBellyEdge` seam in `faceLayout` (`glazey.ts`, the `r > 0.84 + 0.08 * hash3` threshold) and `palette.ts` `glazeyBellyEdge #F4B88C`.
   **Target:** Make the seam a 1–2-voxel blend whose colour sits between `#F5E2A8` and `#F28B6E` and varies with `r`, with no constant-width ring. At 844x390 no outline is visible around the belly.
10. **What:** The munch camera is still close to profile, and the burp f0 far eye is clipped.
    - In bite-3 the far squint arc is cut by the silhouette (x 950–985, y 565–590).
    - Only one blush shows.
    - In burp f0 the far eye wraps the silhouette as a dark brown crescent with no white glint (x 1090–1120, y 580–650). It reads as a bruise or a hole.

    **Where:** `CAM.focusSide` and `STAGE_TURN` in `m5Munch.ts` (and the in-game munch camera), and the burp f0 yaw (`camYaw - 50 * DEG`).
    **Target:** Use a 25–35° front three-quarter view in which both squint arcs, both blushes and the open mouth are inside the silhouette. In burp f0 both eyes are fully on the face, or the far eye is fully hidden.

## Previous fix list (iter 2 r1): status
1. Held glaze gloss (blocker): **partly fixed.** Bite-1 now has a warm bloom streak along the inner rim. The hero bite-3 and the crumbs frames are still matte and chalk-white, so the blocker stands, narrowed.
2. Bald green disc under the donut: **fixed.** The grass is continuous under the donut in every munch frame, with no smooth disc at 1080p or 844x390.
3. Glazey not holding the donut: **partly fixed.** The hand now touches the donut's rim, and the donut clears the grass in every frame. But the hand now reads as a snout over the mouth (new fix 2).
4. Glaze fin in the carve: **partly fixed.** The vertical horn and loose lump are gone. A pointed spur at the lips remains (fix 4).
5. Pier rails out of his head: **fixed.** The rails now sit 60+ px to the right of his head. A new tuft–lighthouse tangency appears instead (fix 7).
6. Crumb arc: **not fixed.** Brow burst in f0, belly flecks in f1, hidden in the grass in f2 (fix 3).
7. Belly bib and hard edge: **partly fixed.** It sits inside the silhouette better in profile, and there is now a seam. But the seam reads as an outline (fix 9).
8. Burp hoop, ripple and voxel form: **partly fixed.** The hoop is now about 70 px from his mouth (was about 150). There is still no visible ripple, the tube is still smooth, and the ring still clips the chocolate donut (fix 6).
9. Roll frame: **partly fixed.** The lighthouse is fully in frame, the horizon is lower and the sky is no longer empty. But the tilt is gone, and there is still no squash, no visible dust and a hidden tuft (fix 5).
10. Profile munch camera: **not fixed.** It is only marginally rotated (fix 10).

## What is working (keep it)
- **The lawn under the held donut** is now continuous grass, with the donut clearly lifted above it. The contact is honest.
- **The carve and its golden crumb interior** on the visible rim (bite-3 x 690–1000, y 640–750; bite-1 x 900–1010, y 610–700). It reads as a real voxel bite at both resolutions (K-07).
- **The munch face's warm squint arcs and blush.** The expression is clearly happy chewing.
- **The roll face.** Big glossy brown eyes with 2x2 glints, a happy open mouth and blush on a near-perfect sphere. It is the cutest Glazey frame in the gate. The roll framing with the lighthouse, lagoon and path is the best composition in the gate.
- **The burp ground ring.** Pastel rainbow micro-cubes hug the lawn and read as a shockwave across the grass. The burp f1 open-mouth expression is good.
- **The world.** The golden-hour key, cool fill, frosting cliffs with drips, milk lagoon, bakery and lighthouse are consistent with the M2 and M4 finals.

## Store-page test: no
The hero frame (m5-bite-3) has a good setting and a real bitten donut. But the subject reads as a coral creature with a round pink snout pressed into a chalky white donut:
- the mouth, the whole point of "munch", can't be seen;
- a white glaze fang sticks out at the lips;
- crumbs fall over the belly;
- a large unexplained shadow and a cut-off mauve canopy frame him.

A polished, well-reviewed kids' game would not lead its store page with this frame.

## Regression check
- **M2 final (meadow, bakery, lagoon, lighting):** no regression. The lighting, AO, frosting rim with drips, trees and lagoon match.
- **M3 final (`gallery-donut-bites`):** **regression** in the classic glaze gloss on the held donut (the blocker). The carve interior and crumb scale match M3.
- **M4 final (`m4-jump-apex`, `gallery-glazey-belly`):** no blocking regression. The body colour, tuft and eye style match. The new `glazeyBellyEdge` seam is an M5 change to shared content. It reads slightly worse than M4's clean belly (fix 9), but not by enough to block. Recheck the M4 gallery belly shots once fix 9 lands.

**Plateau rule (§5):** the gate mean went from 6.44 (iter 1) to 6.65 (iter 2) to 6.63 (iter 3), a gain of 0.19 over two iterations, which is under 0.3. Before iter 4 the builder must make a structural change and write it up in `docs/PROGRESS.md`. The best candidates are:
- **a re-authored munch pose:** a two-handed hold below the mouth, a three-quarter camera and a new framing;
- **a reworked crumb system:** an emit origin at the scallop, no sticking to the body, and settling on top of the grass.

More parameter nudges to the reach and crumb vectors will not do it.

```json
{"gate":"M5","iter":3,"verdict":"FAIL","mean":6.63,"min":6,"blockers":1,"store_page":false}
```
