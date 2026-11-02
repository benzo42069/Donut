# Review M5 iter 7 (reviewer r1)
## Verdict: FAIL

Commit reviewed: a4d6808. I captured the shots myself with `npm run shots -- --gate M5 --iter 7`. The harness used the GPU path (ANGLE Metal, Apple M4), exited 0 and wrote 18 files to `shots/M5/7/`. I viewed:
- every 1920x1080 frame and every 844x390 frame, the crumbs strip composite, and every strip frame (f0 to f2) of both strips;
- 2x crops of the bite-3 face, hands and carve, the bite-3 feet and crumb patch, the bite-1 face and carve, the crumbs f0 face, the burp f0 face and the burp f2 face and hoop.

Before that I read the art bible, the rubric and pass bar (§3–§5), `NOTES.md` and all four references (01 to 04). For the regression check I viewed `shots/M2/final/m2-ground`, `shots/M3/final/gallery-donut-bites` and `shots/M4/final/m4-jump-apex`.

This iteration was again narrow:
- a screen-space crumb filter;
- a neutral card light (`cardLight`);
- `hoopGrow` 0.6;
- `MUNCH.show` 1.1;
- earlier still times.

`docs/PROGRESS.md` itself says it is "narrower than a full structural change". Two long-running findings are now closed, and they are real wins:
- **The crumbs are no longer over the eye** in crumbs f0. A small golden cluster now sits inside his open mouth, which is the "munching with crumbs" read from sheet 03.
- **The burp hoop no longer covers his face.** In f1 and f2 it stands beside his open mouth with its inner edge at his lips, as in sheet 03 "giant burp". The face, blush and closed-eye smile are fully visible.

Nothing else on the iter 6 list moved:
- the hold (sausage arm and belly lobe);
- the frayed eye arcs;
- the contact shadow;
- the cropped hero canopy;
- the roll;
- the near-terrain density.

Bite-1 also regressed: the earlier still time now catches the ring mid-turn, and the first bite is only a 20 px nick.

**Gate mean 6.83** (iters 1 to 6: 6.44, 6.65, 6.63, 6.66, 6.73, 6.73). No blockers, and no category is below 6. The gate fails on the mean and the store-page test.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | – | 6.80 |
| m5-bite-3 (hero) | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | – | 6.80 |
| m5-crumbs-strip | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | 6 | 6.73 |
| m5-burp-strip | 7 | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 8 | 7 | 7 | 7.00 |
| m5-belly-5-roll | 7 | 7 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 7 | – | 6.80 |

**Gate mean: 6.83. Minimum: 6. Blockers: 0.** The gate fails on:
- the mean (the bar is 7.5);
- the store-page test.

Changes since iter 6:
- **Crumbs strip, up:** ref, charm and tech each go from 6 to 7, because the eye burst is gone.
- **Burp, up:** charm goes from 7 to 8, because the hoop sits beside the open mouth and the whole face reads. Tech goes from 6 to 7, because the face is no longer covered.
- **Not raised, because the visible problems are the same:**
  - the materials on the hero (the glaze is now a truer vanilla, but its spec lobe is unchanged);
  - the AO on the munch shots;
  - the voxel density on the munch shots.

## Blockers
None. No art bible §10 instant-fail item appears in any frame. There are no z-fighting, acne, holes, debug overlays or scary content.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** The hold still reads as a long arm laid beside a floating donut, with a pale pancake between them. This is the biggest payoff in the hero, and it has been open since iter 3.
   - **The near arm (bite-3):** it is a coral sausage from x 960 to 1130, y 690–770. Its tip ends over the belly at about x 965, y 760, and does **not** touch the donut, whose right rim is at x ~945.
   - **The belly:** a cream lobe with a hard two-tone terrace bulges out on the side between the donut and the arm (x 935–1060, y 700–840). At 844x390 it reads as a second pale disc.
   - **The far hand:** it is a coral lump behind the far rim (x 850–920, y 620–660).
   - **Crumbs f0 to f2 and bite-1:** the same.

   **Where:** `GlazeyRig.grip()` in `src/game/player/GlazeyRig.ts` and the held-donut transform in `src/game/Game.ts`. Move the donut *to* the stubby hands; don't stretch the arms to the donut. Rotate the belly patch with the body facing, so that it stays on the front and is hidden behind the donut.
   **Target:**
   - In bite-3, both hand tips overlap the dough band, with the near hand in front of the rim and the far hand over the far rim.
   - The arm length on screen is ≤ 1/3 of the body width.
   - No cream belly shows between the donut and the arm.
2. **What:** The roll is unchanged for the fourth iteration, and it is the weakest read in the gate.
   - The ball's bottom quarter is sunk in grass, with no contact shadow (x 740–1120, y 830–900).
   - There is no squash, dust or tilt.
   - The face sits on the lower half and the belly is a cream chin band (x 840–1060, y 840–895). It reads as a head poking out of the lawn.

   **Where:** The roll still in `src/debug/scenes/m5Munch.ts`, and the roll pose and FX in `GlazeyAnimator.ts`.
   **Target:**
   - The full lower silhouette and a soft contact shadow show on flattened grass.
   - There is about 5 % squash on the contact axis.
   - 3–6 voxel dust or grass puffs trail behind him.
   - The body is pitched 20–35°, with the belly as a tilted oval on the lower front (sheet 03 "perfectly round").
3. **What:** Bite-1 has regressed. With the still at `chomp(0) + 0.3` inside the 1.1 rad show-off turn, the first bite is a tiny nick of about 20 px on the right rim (x 955–975, y 705–725, in the 2x crop at the arm's shoulder). The shot meant to show "first bite" shows an almost whole donut, and his mouth isn't on it.
   **Where:** `stillTime` for `bite1` in `m5Munch.ts`, and `MUNCH.show` in `src/game/munch/Munch.ts`.
   **Target:** In bite-1, a scalloped carve at least 60 px across with the golden crumb interior faces the lens, as in ref 04 bottom left.
4. **What:** Glazey has no contact with the ground at the munch stage.
   - In bite-1, bite-3 and the crumbs strip, his feet vanish into grass (bite-3 x 950–1190, y 820–900).
   - There is no darker contact patch under him or under the donut.
   - The donut casts no occlusion on his body.

   **Where:** The character shadow bounds and bias in `Renderer.ts`, and the grass blade height near the player in `MeadowDiorama.ts`. Flatten or shorten the blades within about 0.3 m of his feet.
   **Target:** A soft, darker patch is visible under both feet, and a faint shadow from the donut is visible on his front.
5. **What:** The closed-eye arcs are still frayed. Both arcs have hair-like ragged tops (bite-3 x 990–1080, y 585–610).
   - In bite-3 and bite-1, the far arc sits on the head's left silhouette (bite-3 x 915–950, y 570–600), so it reads as a bushy brow off the face.
   - The same arcs appear in crumbs f0 to f2 and in burp f1 and f2. They are the face of every munch frame.

   **Where:** The eye-arc voxel set in `src/art/models/glazey.ts`. Drop the per-voxel jitter on its coverage.
   **Target:** Clean arcs 2 voxels thick with a constant width. The far arc is fully inside the silhouette with at least 2 voxels of coral beyond it.
6. **What:** The hero still has a cropped canopy. In the 1920x1080 bite-3, the saturated pink canopy fills x 0–285, y 0–390 with no trunk in frame. The lighthouse lamp is also cut off at the top edge (x 1400–1550, y 0–20) in bite-3, bite-1 and the crumbs strip. That cuts the glowing-donut beacon, which is a Follow item in ref 01 and 02.
   **Where:** The `munchStage()` camera yaw and pitch in `m5Munch.ts`.
   **Target:** In the 1080p bite-3, the canopy is out of frame or in frame with its trunk, and the lighthouse's glowing donut is fully in frame.
7. **What:** The crumbs strip barely animates. f0, f1 and f2 are almost the same pose. The crumb burst is a sparse dribble of about 10–15 tiny bits under the carve (f1 and f2 x 860–930, y 830–900). There is no readable arc, bounce or squash from frame to frame. FX is 6.
   **Where:** `stripTimes` in `m5Munch.ts`, and the crumb count and initial speed in `chomp()` in `Game.ts`. Now that the spawn filter keeps them off his face, they can be a bit bolder.
   **Target:**
   - f0 to f2 show a clear progression: the chomp squash, then crumbs in an arc, then crumbs bouncing on the blades.
   - There are 20 or more crumbs visible in f1.
   - There is visible squash or stretch on the body between frames.
8. **What:** In the burp, the face and arms are still a little off.
   - **f0:** the far eye sits right on the head's left edge (x 1090–1130, y 570–650) with only a sliver of coral beyond it. The eyes look far apart and asymmetric, and the face reads oddly wide-set.
   - **f2:** the near arm sticks out horizontally at mouth height (x 1340–1385, y 710–760) instead of hanging at the belly.
   - **f2:** the hoop band shows horizontal slice seams across its right side at about y 645–700 (x 1060–1190), where the stepped sheath meets the distortion.

   **Where:**
   - The eye placement in `src/art/models/glazey.ts`, or the f0 yaw in `m5Munch.ts`.
   - The burp arm pose in `GlazeyAnimator.ts`.
   - The hoop mesh and the distortion in `BurpWave.ts`.

   **Target:**
   - In f0, both eyes are inside the silhouette with at least 1 eye-width of coral beyond the far one.
   - The arms stay in the lower half of the body.
   - The hoop band is continuous, with no slice seams.
9. **What:** The near terrain is still coarse.
   - The roll foreground's frosting sprinkles are 20–30 px long (x 300–1920, y 900–1080).
   - The bottom-left sand in bite-1 and the crumbs strip shows cells of about 20 px.
   - The grass blades in the bottom fifth are 10–14 px.

   This breaks the §3 terrain density rule (about 12 px).
   **Where:** The camera pitch and height in `m5Munch.ts`, or the sprinkle voxel size on the frosting rim.
   **Target:** No terrain voxel or sprinkle is wider than about 12 px in any gate frame.

## Previous fix list (iter 6 r1): status
1. Crumbs over the eye in crumbs f0: **fixed.** No crumb is above the mouth. A small golden cluster sits inside the open mouth (x 940–975, y 700–725), which matches sheet 03 "munching".
2. Two-handed hold and belly lobe: **not fixed** (fix 1).
3. Burp hoop covering the face: **fixed.** In f1 and f2, the hoop stands beside the face with its inner edge at his lips.
4. Burp arms reading as ears: **partly fixed.** In f1 the arms sit at the sides. In f2 the near arm still juts out at mouth height (fix 8).
5. Roll: **not fixed** (fix 2).
6. Burp f0 far eye: **partly fixed.** It is no longer cut by the silhouette, but it sits right on the edge (fix 8).
7. Cropped canopy in the hero: **not fixed** (fix 6).
8. Frayed closed-eye arcs: **not fixed** (fix 5).
9. Contact shadow at the munch stage: **not fixed** (fix 4).
10. Near-terrain density: **not fixed** (fix 9).

## What is working (keep it)
- **The burp f1 and f2.** A big pastel rainbow hoop beside a wide-open mouth, confetti through the hoop, and a voxel rainbow ground ring around him. This is the best "giant burp" read so far, and the closest frame in the gate to sheet 03.
- **The crumbs in the mouth in crumbs f0.** It is on-reference, cute and no longer covers the eyes.
- **The held donut's material.** The vanilla glaze now reads as classic glaze, not apricot. It has a specular lobe, drips over the dough band and crisp sprinkles. The bite-3 carve shows the golden crumb interior (close to ref 04).
- **The crumb patch in the grass.** It has three dough tones at donut-voxel scale and sits on the blade tips.
- **The world.** The golden-hour key, the cool fill, the frosting rim with drips, the milk lagoon, the bakery and the lighthouse are consistent with the M2 and M4 finals.

## Store-page test: no
The hero (m5-bite-3) shows a happy coral character grinning beside a glossy, bitten donut. On a store page, a viewer would still see:
- a sausage arm that doesn't hold the donut, with a pale disc of belly bulging beside it;
- frayed brow-like eye arcs, one on the edge of his head;
- a figure standing in grass with no contact shadow;
- a cropped pink blob in the top-left corner and a lighthouse with its top cut off.

The burp f1 frame is now closer to store-ready than the hero.

## Regression check
- **M2 final (`m2-ground`, meadow, bakery, lagoon, lighting):** no regression. The bakery, frosting rim, trees, clouds and grade match.
- **M3 final (`gallery-donut-bites`):** no regression. The held classic glaze now matches the gallery's vanilla tone more closely than iter 6 did, and the carve interior matches.
- **M4 final (`m4-jump-apex`):** no regression in body colour, tuft, eyes, glints or blush. The belly-patch terrace on the held pose is still the iter 5 look, not a new regression.
- **Within M5:** the bite-1 carve readability regressed against iter 6 (fix 3).

**Plateau rule (§5):** the means are 6.73, 6.73 and 6.83 (iters 5 to 7). That is +0.10 over the last two iterations, so the rule is still triggered. Iter 8 is the last before escalation (§6). Moving the mean the 0.67 it still needs takes the structural items, not tuning:
- **the hold:** a re-authored pose with the donut placed into the hands;
- **the roll:** squash, tilt, dust and a contact shadow;
- **contact shadows** under the character;
- **clean eye arcs.**

```json
{"gate":"M5","iter":7,"verdict":"FAIL","mean":6.83,"min":6,"blockers":0,"store_page":false}
```
