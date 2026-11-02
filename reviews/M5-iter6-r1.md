# Review M5 iter 6 (reviewer r1)
## Verdict: FAIL

Commit reviewed: b83dc8e. I captured the shots myself with `npm run shots -- --gate M5 --iter 6`. The harness used the GPU path (ANGLE Metal, Apple M4), exited 0 and wrote 18 files to `shots/M5/6/`. I viewed:
- every 1920x1080 frame, the bite-3 and roll 844x390 frames, both strip composites and every strip frame (f0 to f2);
- 2x crops of the bite-1 and bite-3 face, hands and carve, the bite-3 crumb patch and foreground grass, the crumbs f0 and f1 faces, all three burp frames around the face and hoop, and the roll ball.

Before that I read the art bible, the rubric and pass bar (§3–§5), `NOTES.md` and all four references (01 to 04). For the regression check I viewed `shots/M2/final/m2-ground`, `shots/M3/final/gallery-donut-bites` and `shots/M4/final/m4-jump-apex`.

This iteration was parameter tweaks: a shoulder slide of 0.26 instead of 0.16, crumb `up` and `bias`, `MUNCH.show` 0.8, `STAGE_TURN` 25°, and a burp yaw of -36°. The gate was already under the plateau rule, so a structural change was due. Each tweak moved its own item a little, and two items regressed or came back. The gate mean is unchanged.

What improved:
- **The bite now sits between the ring's centre and his lips** in bite-3. It reads as "biting" (iter 5 fix 10).
- **No crumbs on the belly in the hero.** They lie in a readable three-tone patch in the grass (iter 5 fix 3).
- **The near hand's tip now reaches the donut's right rim** in bite-1 and crumbs f1. It touches it, but doesn't grip it.
- **The burp hoop leaves his lips.** In f2 the hoop shows a stepped voxel edge on its upper right.

What is still wrong:
- **Crumbs burst over his eye in crumbs f0.** This is the fifth iteration in a row, even with `up` capped at +0.05. The emit origin is wrong, not the velocity.
- **The hoop now covers his face** in burp f1 and f2.
- **The burp f0 far eye still wraps the silhouette edge.**
- **The roll is untouched.**
- **The 1080p hero still has the cropped pink canopy** in the top-left corner.

**Gate mean 6.73** (iters 1 to 5: 6.44, 6.65, 6.63, 6.66, 6.73). No blockers, and no category is below 6. The gate fails on the mean and the store-page test.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | – | 6.80 |
| m5-bite-3 (hero) | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | – | 6.80 |
| m5-crumbs-strip | 6 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 6 | 6 | 6 | 6.45 |
| m5-burp-strip | 7 | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 6.82 |
| m5-belly-5-roll | 7 | 7 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 7 | – | 6.80 |

**Gate mean: 6.73. Minimum: 6. Blockers: 0.** The gate fails on:
- the mean (the bar is 7.5);
- the store-page test.

## Blockers
None. No art bible §10 instant-fail item appears in any frame. There are no z-fighting, acne, holes, debug overlays or scary content.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Crumbs burst over the eye in crumbs f0, for the fifth iteration in a row.
   - About 15–20 crumbs sit in a cluster from the top lip up across the near squint arc and brow, at x 910–970, y 660–725 in `m5-crumbs-strip_strip_f0`.
   - In iter 6, `up` was capped at [-0.5, 0.05] and `bias` raised to 0.85. The cluster did not move, so the velocity is not the cause. The crumbs are **spawned** at face height.

   **Where:** In `chomp()` in `src/game/Game.ts`, the `points` array is built from the `removed` voxel positions transformed by the donut's world matrix. On the first bite, the matrix is most likely the pre-grip or pre-turn transform, or the removed voxels are mapped through `e.object` local space when they should go through the grid origin. Log the world position of `points[0].at` against the lips' world position on bite 1 and on bite 2.
   **Target:** In f0, every crumb's spawn point is within one donut voxel of the carve surface. No crumb pixel is above the top edge of the mouth. Add a unit test that asserts the spawn y ≤ the lips' y for bite 1.
2. **What:** The hold still reads as an arm laid in front of a donut, not two hands gripping it. This is the biggest payoff in the hero.
   - **bite-3:** the near arm is a long, thick coral sausage (x 960–1130, y 690–770). Its tip only kisses the rim beside the carve at x ~965.
   - A pale cream lobe of belly bulges out between the carve and the arm (x 935–1060, y 700–840). At 844x390 it reads as a second pale object, like a pancake under his arm.
   - The far hand is a coral lump behind the far rim (x 850–920, y 620–655), not fingers over it.
   - In bite-1 and crumbs f1, the tip now overlaps the right rim by a few pixels. That is progress.

   **Where:** `GlazeyRig.grip()` in `src/game/player/GlazeyRig.ts`. The shoulder slide still stretches the arm into a sausage. Re-author it so that the held-donut transform in `Game.ts` puts the rim *at* the stubby hands, rather than sliding and aiming long arms at the rim. Also rotate the belly patch with the body so it stays on the front facing the donut instead of bulging out on the side.
   **Target:**
   - In bite-3, both hand tips overlap the dough band, with the near hand under or in front of the rim and the far hand over the far rim.
   - The arm length on screen is ≤ 1/3 of the body width, matching the stubby arms on sheet 03.
   - No cream belly shows between the hand and the carve.
3. **What:** The burp hoop now covers his face.
   - In f1, the hoop's right side crosses his mouth and cheek (x 1150–1245, y 650–760).
   - In f2, the stepped right segment of the hoop runs straight down the middle of his face, from brow to chin (x 1170–1240, y 600–800). The money frame of the burp hides the expression.
   - In ref 03 ("giant burp"), the ring sits *beside* the open mouth and the whole face is visible.

   **Where:** In `BurpWave.ts`, the hoop spawns at the lips and travels along the facing direction. Its radius makes the near side sweep back across the face. Offset the spawn centre forward by about the hoop's radius plus 0.05 m, or start it smaller and grow it as it travels.
   **Target:** In f1 and f2, the hoop's inner edge is tangent to or just in front of the lips. The eyes, mouth and blush are never covered.
4. **What:** In burp f1 and f2, the arms stick out at cheek height and read as ears or a snout.
   - In f2, a coral nub juts out of the left of the face above the mouth (x 1110–1150, y 670–700), and another juts out of the right side at cheek height (x 1370–1410, y 715–760).
   - In f1, the same nubs are at x 1110–1160, y 680–720 and x 1330–1370, y 720–770.
   - The silhouette becomes "head with ears", not sheet 03's stubby arms at the sides.

   **Where:** The burp pose arm angles in `GlazeyAnimator.ts`/`GlazeyRig.pose`.
   **Target:** The arms hang down at belly height, angled back slightly for the recoil, and stay inside the lower half of the body silhouette.
5. **What:** The roll is unchanged from iters 4 and 5, and the iter 6 commit did not touch it.
   - The ball's bottom quarter is still sunk into grass, with no contact shadow (x 780–1100, y 830–900).
   - There is no squash, dust or tilt.
   - The cream belly is still a chin band under the mouth (x 840–1060, y 840–895).
   - It reads as a smiling head poking out of the lawn, not a perfectly round Glazey rolling.

   **Where:** The roll still in `src/debug/scenes/m5Munch.ts`, and the roll FX in `GlazeyAnimator.ts`.
   **Target:**
   - The lower silhouette and a soft contact shadow show on flattened grass.
   - There is about 5 % squash on the contact axis.
   - 3–6 voxel dust or grass puffs trail behind him.
   - The body is pitched 20–35°, so the belly is a tilted oval on the lower front, as in sheet 03 "perfectly round".
6. **What:** The burp f0 far eye still wraps the silhouette. It is a large dark crescent cut by the head's left edge (x 1090–1130, y 575–660), and it reads as a gouge. The yaw change from -50° to -36° did not hide it. The eyes also look far apart and asymmetric.
   **Where:** The spawn yaw in `m5Munch.ts`, or the eye placement on the head in `src/art/models/glazey.ts`. The eyes may sit too far round the head for any 3/4 view.
   **Target:** In f0, both eyes and both 2x2 glints sit fully inside the face silhouette, with at least 1 eye-width of coral between the far eye and the head's edge.
7. **What:** The hero composition still has a cropped canopy. In 1080p bite-3, the pink canopy fills x 0–280, y 0–390 with no trunk in frame, and it is the most saturated mass in the frame. The +5° stage turn only slid it a little. At 844x390 the trunk is visible, so the two aspects disagree.
   **Where:** The `munchStage()` camera yaw in `m5Munch.ts`.
   **Target:** In the 1920x1080 bite-3, the canopy is either fully out of frame or in frame with its trunk.
8. **What:** The closed-eye arcs are still frayed. Both arcs have hair-like ragged tops (bite-3 x 990–1080, y 585–610; bite-1 x 1030–1120, y 565–590). In bite-1 and bite-3, the far arc pokes past the head silhouette (x 915–950, y 570–600), so it reads as a bushy eyebrow off the edge of the face.
   **Where:** The eye-arc voxel set in `src/art/models/glazey.ts`. Drop the per-voxel jitter on the arc coverage.
   **Target:** Clean arcs that are 2 voxels thick with a constant width. The far arc is fully inside the silhouette.
9. **What:** Glazey has no contact shadow at the munch stage. In bite-1 and bite-3, his feet vanish into grass (bite-3 x 950–1190, y 820–900), and there is no darker ground under him or under the held donut. The donut throws no shadow on his belly. He reads as pasted onto the lawn (AO category).
   **Where:** The shadow camera bounds and bias for the character in `Renderer.ts`, and the grass blade height near the player in `MeadowDiorama.ts`. Flatten or shorten the blades within about 0.3 m of the feet.
   **Target:** A soft, darker contact patch is visible under both feet, and a faint occlusion from the donut is visible on his belly.
10. **What:** The near terrain is still coarse.
    - The bottom-left sand corner shows cells of about 20 px (bite-3 x 0–200, y 1010–1080).
    - The roll foreground's frosting sprinkles are 20–30 px long (x 300–1920, y 900–1080).
    - The grass blades in the bottom fifth are borderline at 8–12 px.

    **Where:** The camera pitch and height in `m5Munch.ts`.
    **Target:** No terrain voxel or sprinkle wider than about 12 px in any gate frame.

## Previous fix list (iter 5 r1): status
1. Two-handed hold: **partly fixed.** The near tip now touches the right rim in bite-1 and crumbs f1. It is still a sausage arm with no grip, and the far hand is still behind the rim. A belly lobe now shows in the gap (fix 2).
2. Crumbs over the eye in f0: **not fixed** (fix 1). This is the fifth iteration.
3. Crumbs stuck to the belly in the hero: **fixed.** The crumbs settle in a three-tone patch in the grass at x 760–1000, y 855–940.
4. Roll: **not fixed.** It is unchanged (fix 5).
5. Burp hoop at the mouth and ripple: **partly fixed.** The hoop now starts at his lips and shows a stepped voxel edge in f2. It now covers his face (fix 3). There is still no visible ripple: the tree trunk behind the hoop in f1 (x 1050–1100) is straight.
6. Burp f0 far eye: **not fixed** (fix 6).
7. Near-terrain density: **not fixed** (fix 10).
8. Cropped canopy in the hero: **not fixed** at 1080p (fix 7).
9. Ragged closed-eye arcs: **not fixed** (fix 8).
10. Bite orientation: **fixed.** The bite-3 crescent sits on the rim between the ring's centre and his lips, with the golden crumb interior showing, close to ref 04 bottom left.

## What is working (keep it)
- **The held donut.** It has a glossy peach classic glaze with a strong specular lobe, drips over the dough band, and crisp sprinkles. The bite-3 carve shows the golden crumb interior, and crumbs trickle from its lower lip. It is the best K-07 read so far.
- **The crumb patch in bite-3 and crumbs f1 and f2.** It has three dough tones at donut-voxel scale and sits on the blade tips.
- **The open-mouth expressions.** The bite-1 chomp and the bite-3 grin are big, readable and kid-friendly.
- **The burp ground ring** of pastel voxels and the confetti puff, plus the new stepped sheath on the hoop in f2.
- **The roll face.** It has big glossy eyes with 2x2 glints, blush and the fanned tuft.
- **The world.** The golden-hour key, the cool fill, the frosting rim with drips, the milk lagoon, the bakery and the lighthouse are consistent with the M2 and M4 finals.

## Store-page test: no
The hero (m5-bite-3) shows a happy coral character grinning over a glossy, bitten donut in a golden meadow. That premise is charming, and the bite placement is now right. But on a store page, a viewer would see:
- a thick sausage arm laid across a donut, with a pale belly lobe bulging out beside it, rather than two little hands holding a treat;
- frayed eyebrow-like arcs, one of them off the edge of his head;
- a figure with no contact shadow, standing in coarse grass;
- a cropped pink blob in the top-left corner.

A polished, well-reviewed kids' game would not lead with this frame.

## Regression check
- **M2 final (`m2-ground`, meadow, bakery, lagoon, lighting):** no regression. The bakery, frosting rim, trees, lagoon, clouds and grade match.
- **M3 final (`gallery-donut-bites`):** no regression. The held classic glaze and the golden carve interior match the gallery.
- **M4 final (`m4-jump-apex`):** no regression. The body colour, tuft, eyes, glints, blush and clean belly oval match M4.

**Plateau rule (§5):** the means are 6.44, 6.65, 6.63, 6.66, 6.73 and 6.73 (iters 1 to 6). The gain over the last two iterations is 0.07, so the rule is still triggered. Iter 6 was parameter tweaks, against the rule. The next iteration must be structural:
1. **A re-authored munch pose:** stubby hands that hold the rim, the donut placed into the hands, and the belly patch kept on the front.
2. **A fix at the root of the crumb spawn:** the spawn position, not the velocity.
3. **A burp hoop spawned in front of the face,** not around it.
4. **Real roll FX:** squash, tilt, dust and a contact shadow.

```json
{"gate":"M5","iter":6,"verdict":"FAIL","mean":6.73,"min":6,"blockers":0,"store_page":false}
```
