# Review M5 iter 5 (reviewer r1)
## Verdict: FAIL

Commit reviewed: 321d627. I captured the shots myself with `npm run shots -- --gate M5 --iter 5`. The harness used the GPU path (ANGLE Metal, Apple M4), exited 0 and wrote 18 files to `shots/M5/5/`. I viewed:
- every 1920x1080 frame and the 844x390 hero;
- both strip composites and every strip frame (f0 to f2);
- 2x crops of the munch face, arms, carve, belly and crumbs in bite-1, bite-3 and crumbs f0, f1 and f2;
- 2x crops of the burp f0 face, the burp f1 hoop and mouth, the roll ball, and the hero's grass foreground.

Before that I read the art bible, the rubric, the pass bar and the plateau rule (§3–§5), `NOTES.md` and all four references (01 to 04). For the regression check I viewed `shots/M4/final/m4-jump-apex`, `shots/M4/final/gallery-glazey-belly_strip` and `shots/M3/final/gallery-donut-bites`, plus the M2 final directory listing.

The fidelity targets are:
- **K-07** (ref 04, bottom left): a scalloped bite showing the crumb interior, with crumbs on the table.
- **K-05** (ref 03): the munching, giant-burp and perfectly-round poses.

Short version: this is the best M5 iteration so far, and it is still well short of the bar.

What improved:
- **The belly regression blocker is closed.** The dither is gone. The cream oval now has a clean, slightly stepped terrace edge.
- **The hero donut reads as a donut again.** It is no longer a torn half.
- **The ugly sand-path shadow is out of frame.**
- **The crumbs in f1 and f2 behave.** They arc down from the bite and land in a readable patch on the grass.
- **The far hand now shows** above the donut's far rim.

What is still wrong:
- **He still isn't holding the donut.** The near arm is a fat coral sausage lying across his chest, and its tip stops short of the rim, so the cream belly shows in the gap. The cause is in code: `grip()` caps the shoulder slide at 0.16 m.
- **Crumbs burst over his eye in crumbs f0.** This is the fourth iteration in a row.
- **The burp hoop is still about 55 px from his mouth.** It is still a smooth tube with no visible ripple.
- **The roll is unchanged as a motion read.** There is no squash, dust or tilt, the bottom is sunk in grass, and the belly reads as a chin band.

**Gate mean 6.73** (iters 1 to 4: 6.44, 6.65, 6.63, 6.66). No blockers, and no category is below 6. The gate fails on the mean and the store-page test.

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
None. None of the art bible §10 instant-fail items appears in any frame. The M4 belly regression is resolved (see the regression check).

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** The two-handed hold still doesn't read. This is the biggest payoff left in the hero.
   - **bite-3:** the near arm is a long coral sausage across his chest under the blush, at x 1000–1170, y 690–760. Its tip ends at about x 1010. The bitten rim of the donut is at about x 950, and the cream belly fills the gap between them.
   - **bite-1** (x 1030–1190, y 680–740), **crumbs f1** (x 1020–1160, y 690–750) and **crumbs f2** look the same: the arm points at the donut but never touches it.
   - The far hand is now visible above the far rim (crumbs f1 x 885–935, y 605–640; bite-1 x 905–940, y 610–625). That is progress, but it reads as a coral lump behind the donut, not as fingers over the rim.

   **Where:** `GlazeyRig.grip()` in `src/game/player/GlazeyRig.ts`. `slide` is clamped to `0.16` m, and `reach = armLength * 0.8`, so when the grip point is farther away the arm just points at it and stops short. Either let the grip move the donut to the hands (in the held-donut transform in `Game.ts`, put the ring's near rim at `shoulder + armDir * armLength`), or raise the slide cap and shorten the arm visually.
   **Target:**
   - In bite-3 and crumbs f0, f1 and f2, the near hand's tip overlaps the dough band of the donut's near or lower rim, with no belly visible between hand and donut.
   - The far hand's tip sits *over* the far rim, in front of the dough, not behind it.
   - A viewer says "he's holding it" at 844x390.
2. **What:** Crumbs burst over the eye in crumbs f0, for the fourth iteration running. About 20 crumbs climb from the lips across the near squint arc and brow, at x 905–975, y 645–720 in f0. f1 and f2 are now correct, so this is specific to the first bite's emit.
   **Where:** `chomp()` in `src/game/Game.ts` and the crumb spawn in `src/game/munch/Munch.ts`. In f0 the emit origin or the upward velocity component still puts crumbs above the lip line. It may be the first-bite path, before the grip and turn pose apply.
   **Target:**
   - In f0 no crumb pixel is above the mouth's top edge.
   - The initial velocity's vertical component is ≤ 0.3 of its forward component.
3. **What:** Crumbs stick to the belly in the hero. Six to eight large crumb cubes (about 8–12 px) hover in front of the cream belly at x 935–995, y 735–810 in bite-3, and they read as dirt stuck on his tummy. Bite-3 is the frame a store page would use.
   **Where:** Crumb collision and spawn in `src/game/Game.ts` / `Munch.ts`. The spawn point is inside or just in front of the belly volume.
   **Target:** In bite-3, no crumb overlaps the belly patch. Crumbs are either mid-fall below the donut or settled in the grass.
4. **What:** The roll still doesn't read as rolling. The open lawn is an improvement, and the face, the tuft and the 2x2 glints are lovely, but:
   - the bottom quarter of the ball is sunk into grass blades (x 760–1110, y 830–900) with no visible contact shadow;
   - there is still no squash, no dust or grass puffs, and no trail;
   - the belly is a cream chin band under the mouth (x 840–1060, y 840–895), not sheet 03's round tummy.

   **Where:** The roll still in `src/debug/scenes/m5Munch.ts`, and the roll FX in `GlazeyAnimator.ts`.
   **Target:**
   - The ball's lower silhouette and a soft contact shadow show on flattened grass.
   - There is about 5 % squash on the contact axis.
   - 3–6 voxel dust or grass puffs trail behind him, visible at 844x390.
   - The body is pitched 20–35°, so the belly reads as a tilted oval on the lower front, not a strip under the chin.
5. **What:** The burp hoop still doesn't leave his mouth, and the ripple isn't visible.
   - In f1 the hoop's right edge is at about x 1130, and his open mouth is at x ~1185, y 700. The gap is about 55 px. The `BurpWave` offset change from 0.08 to 0.02 barely moved it.
   - I see no background displacement around the ring in f1 or f2. The tree trunk behind the hoop, at x 1060–1130, is straight.
   - The hoop is still a smooth, non-voxel tube.

   **Where:** `BurpWave.ts` (`at` is computed from `this.mouth`; check that `mouth` is the lips' world position at the burp pose and not the head centre), and `Ripple.ts` (the band at frame time may already be offscreen; log `ripple.z` and `ripple.w` at f1).
   **Target:**
   - In f1 the hoop's near edge overlaps his lips.
   - 6–10 px of visible displacement in a band near the hoop in f1.
   - A faint voxel step or a sparkle-voxel sheath on the hoop.
6. **What:** The burp f0 far eye still wraps the silhouette. It is a large brown crescent on the head's edge at x 1090–1120, y 580–660, and it reads as a gouge. This is unchanged for three iterations.
   **Where:** The f0 yaw in `m5Munch.ts` (`camYaw - 50 * DEG`).
   **Target:** A 25–35° three-quarter view with both eyes and both glints fully on the face, or the far eye fully hidden.
7. **What:** The near terrain is too chunky at the new 3.2 m munch camera (art bible §3, about 12 px or less on terrain).
   - The foreground grass blades in the bottom 20 % of bite-1 and bite-3 are 12–18 px wide (x 0–1920, y 900–1080).
   - The bottom-left sand corner shows 20+ px cells (bite-1 x 0–220, y 980–1080).
   - In the roll shot, the foreground frosting sprinkles are 20–30 px long (x 300–1920, y 900–1080).

   **Where:** The munch and roll camera height and pitch in `m5Munch.ts` (pitch down less, so the lens doesn't sit in the grass), or the near-grass blade size in `MeadowDiorama.ts`.
   **Target:** No terrain voxel or sprinkle is wider than about 12 px in any gate frame.
8. **What:** The hero composition still has a cropped canopy. The top-left pink canopy (bite-3 x 0–220, y 0–360) is cut off, with no trunk in frame. It is the most saturated mass in the frame, and it competes with the tuft.
   **Where:** `munchStage()` camera yaw in `m5Munch.ts`.
   **Target:** In bite-3, either the canopy is fully out of frame, or both canopy and trunk are in it.
9. **What:** The closed-eye arcs now have ragged, noisy edges. The bronze specular is gone (good), but the arcs are frayed and look like scribbled eyebrows (bite-3 x 990–1080, y 585–610; crumbs f1 near arc). The far arc in bite-3 also still sits on the head's edge (x 915–945, y 570–590).
   **Where:** The eye-arc voxel set in `src/art/models/glazey.ts`. Per-voxel jitter is probably applied to the arc's coverage.
   **Target:** Clean, smooth 2-voxel-thick arcs with a consistent width. The far arc is fully on the face or hidden.
10. **What:** The bite-3 scallops face the lens, not his mouth. The golden bite is on the lower right of the ring (x 820–960, y 760–820), while his mouth is up and right (x 940–1010, y 640–700), so the bite reads as "already eaten" rather than "biting". This is minor now, because the ring stays legible.
    **Where:** `MUNCH.show` (1.3 rad) in `src/game/munch/Munch.ts`.
    **Target:** At the bite-3 still, the crescent sits on the rim between the donut's centre and his lips, as in ref 04 bottom left.

## Previous fix list (iter 4 r1): status
1. Belly dither (regression blocker): **fixed.** The cream oval has a clean edge with a soft one-step terrace, with no isolated coral or cream voxels (burp f0, bite-1, crumbs f1). It is as clean as M4's oval. The blocker is closed.
2. Two-handed hold: **partly fixed.** The near arm now aims at the donut and the far hand peeks over the far rim. Neither hand touches the donut (new fix 1).
3. Crumbs: **partly fixed.** The f1 arc and the f2 settled crescent are now good. The f0 burst over the eye is still there (fix 2), and a new problem is crumbs on the belly in the hero (fix 3).
4. Roll: **partly fixed.** It is on the open lawn with nothing in front of the ball. There is still no contact shadow, squash, dust or tilt, and the belly is still a chin band (fix 4).
5. Burp hoop and ripple: **not fixed.** The gap shrank by only about 15 px, and there is no visible ripple (fix 5).
6. Munch composition: **partly fixed.** The large foreground shadow is gone. The cropped canopy remains (fix 8).
7. Near-terrain density: **not fixed.** It is arguably worse in the munch frames, because the camera moved closer (fix 7).
8. Burp f0 far eye: **not fixed** (fix 6).
9. Metallic squint arcs: **fixed.** The arcs are matte now, but they are ragged (fix 9).
10. Torn-half donut silhouette: **fixed.** The ring is legible in bite-3, and the hole and glaze read clearly. The bite orientation could still be better (fix 10).

## What is working (keep it)
- **The held donut.** The peachy classic glaze has a strong specular lobe, drips and crisp sprinkles. At chest height and at the new size it is the most appetizing object in the gate. It matches `gallery-donut-bites`.
- **The open mouth at the bite.** Bite-1's wide chomp and bite-3's happy open grin are expressive and kid-friendly.
- **The clean belly oval** in every frame.
- **The crumb physics in f1 and f2.** There is a stream from the bite down past the belly, and a settled patch on the grass blade tips in three dough tones. This is close to K-07.
- **The roll face.** It has big glossy eyes with 2x2 glints, blush and a smile, with the tuft fully fanned. It is still the cutest frame in the gate.
- **The burp ground ring** of pastel voxels sweeping across the lawn, and the confetti puff in f1 and f2.
- **The world.** The golden-hour key, the cool fill, the frosting rim with drips, the milk lagoon, the bakery with its donut sign, the lighthouse and the clouds are all consistent with the M2 and M4 finals.

## Store-page test: no
The hero (m5-bite-3) is the closest yet: a happy coral character grinning over a glossy sprinkled donut in a golden meadow. But on a store page, a viewer would see:
- a donut floating beside him rather than held, with a coral sausage arm stopping short of it;
- crumbs stuck on his tummy;
- coarse foreground grass filling the bottom fifth;
- a cropped pink blob in the top-left corner.

A polished, well-reviewed kids' game would not lead with this frame yet.

## Regression check
- **M2 final (meadow, bakery, lagoon, lighting):** no regression. The lighting, AO, frosting rim, trees, lagoon and clouds match.
- **M3 final (`gallery-donut-bites`):** no regression. The held classic glaze matches the gallery material. The carve interior is the same golden crumb.
- **M4 final (`m4-jump-apex`, `gallery-glazey-belly`):** **resolved, with no regression.** The belly is again a clean cream oval. The body colour, tuft, eyes and blush match M4. The iter 4 blocker is closed.

**Plateau rule (§5):** the means are 6.44, 6.65, 6.63, 6.66 and 6.73 (iters 1 to 5). The gain over the last two iterations is 0.07, so the rule is still triggered. Most of the remaining gap is three systems that this structural change did not reach:
1. **The hold.** The grip clamp means the hands can never reach the donut. Move the donut to the hands, not the hands toward the donut.
2. **The roll FX.** There is still no squash, dust or contact shadow.
3. **The burp spawn and ripple.** These are still effectively invisible.

The next structural change should be a re-authored munch pose with hands and donut solved together, plus a camera pitched up enough to keep the coarse grass out of the bottom fifth.

```json
{"gate":"M5","iter":5,"verdict":"FAIL","mean":6.73,"min":6,"blockers":0,"store_page":false}
```
