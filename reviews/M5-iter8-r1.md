# Review M5 iter 8 (reviewer r1)
## Verdict: FAIL

Commit reviewed: c0e1194. I captured the shots myself with `npm run shots -- --gate M5 --iter 8`. The harness used the GPU path (ANGLE Metal, Apple M4), exited 0 and wrote 18 files to `shots/M5/8/`. I viewed:
- every 1920x1080 frame, the bite-3 844x390 frame, both strip composites, and strip frames f0 to f2 of both strips;
- 2x crops of the bite-3 hold, face and carve, the bite-1 hold and carve, the crumbs f1 hold and crumb fall, the burp f0 face, and the roll ball.

Before that I read the art bible, the rubric and pass bar (§3–§4), `NOTES.md` and all four references (01 to 04). For the regression check I viewed `shots/M2/final/m2-ground`, `shots/M3/final/gallery-donut-bites` and `shots/M4/final/m4-jump-apex`.

The commit claims three changes:
- deeper bites and a fuller show-off turn;
- the belly decal kept to the front of the body;
- roll dust thrown out to the sides.

Only the first is visible in the frames:
- **The bites are real wins.** Bite-1 now shows a scalloped carve about 100 px across with the golden crumb interior facing the lens (x 900–990, y 690–800). That closes iter 7 fix 3. The bite-3 carve is deeper still, with crumbs spilling off it.
- **The crumbs strip now animates.** f0 is a crouched chomp squash with crumbs in the mouth. In f1 and f2 he extends again and crumbs fall from the carve onto the blades. That is a readable squash beat.
- **The belly decal is not fixed.** A cream lobe still bulges out between the donut and the near arm in bite-1, bite-3 and crumbs f1/f2.
- **No roll dust is visible.** I found no dust or grass puffs anywhere around the ball in the roll frame, including in the 2x crop of its sides.

Every other structural item from iter 7 is unchanged:
- the hold;
- the roll pose and contact;
- the contact shadows;
- the frayed eye arcs;
- the cropped canopy and lighthouse;
- the burp f0 eye and the f2 arm;
- the near-terrain density.

**Gate mean 6.84** (iters 1 to 7: 6.44, 6.65, 6.63, 6.66, 6.73, 6.73, 6.83). There are no blockers and no category is below 6. The gate fails on the mean (the bar is 7.5) and on the store-page test. This is iteration 8, so §6 escalation to the user now applies.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | – | 6.80 |
| m5-bite-3 (hero) | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | – | 6.80 |
| m5-crumbs-strip | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 6.82 |
| m5-burp-strip | 7 | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 8 | 7 | 7 | 7.00 |
| m5-belly-5-roll | 7 | 7 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 7 | – | 6.80 |

**Gate mean: 6.84. Minimum: 6. Blockers: 0.**

Changes since iter 7:
- **Crumbs strip, FX up from 6 to 7.** It now shows chomp squash, then extension and falling crumbs.
- **Bite-1 now matches the bite-3 read.** The carve is fixed, but its hold, contact and eye arcs are the same as bite-3, so it stays at 7 per category. The iter 7 table already scored it 7 despite the nick, so the mean does not move.
- **No other category moved.** The visible problems behind them are the same.

## Blockers
None. No art bible §10 instant-fail item appears in any frame. There is no z-fighting, acne, holes, debug overlay or scary content.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** The hold still reads as a long arm laid beside a floating donut, with a pale lobe of belly between them. This has been open since iter 3 and is the biggest payoff in the hero.
   - **The near arm (bite-3):** it is a coral sausage from about x 960 to 1130, y 690–770. Its tip rests on the cream belly at about x 975, y 760, about 20 px right of the donut's carve. It does not touch the dough.
   - **The belly:** a cream lobe with a hard two-tone terrace shows between the carve and the arm (x 935–1060, y 700–840).
   - **The donut:** it hangs below and in front of the mouth. His lips are not on the bite.
   - **Bite-1 (x 960–1110, y 690–770) and crumbs f1/f2:** the same.

   The commit's "belly decal kept to the front" has no visible effect.
   **Where:** `GlazeyRig.grip()` in `src/game/player/GlazeyRig.ts`, the held-donut transform in `src/game/Game.ts`, and the belly patch in `src/art/models/glazey.ts`.
   **Target:**
   - In bite-3, both hand tips overlap the dough band.
   - The arm length on screen is ≤ 1/3 of the body width.
   - No cream shows between the donut and the arm.
   - The carve sits at the lips, as in sheet 03 "munching".
2. **What:** The roll is unchanged for the fifth iteration.
   - The bottom quarter of the ball is sunk in grass, with no contact shadow (x 740–1120, y 830–900).
   - There is no squash or tilt.
   - The commit's dust is not visible.
   - The face is on the lower half and the belly is a cream chin band (x 840–1060, y 840–895). It reads as a head poking out of a lawn.

   **Where:** The roll still in `src/debug/scenes/m5Munch.ts`, and the roll pose and FX in `GlazeyAnimator.ts`. Check the dust spawn time against the still time; the dust may be spawned and already gone, or hidden in the blades.
   **Target:**
   - The full lower silhouette shows on flattened grass, with a soft contact shadow.
   - There is about 5 % squash on the contact axis.
   - 3–6 voxel dust or grass puffs are visible beside or behind the ball.
   - The body is pitched 20–35°.
3. **What:** There is still no ground contact at the munch stage.
   - His feet vanish into grass in bite-1, bite-3 and the crumbs strip (bite-3 x 950–1190, y 820–900).
   - There is no darker patch under him or the donut.
   - The donut casts no occlusion on his belly.

   **Where:** The character shadow bounds and bias in `Renderer.ts`. Also shorten or flatten the grass blades within about 0.3 m of the player in `MeadowDiorama.ts`.
   **Target:** A soft, darker patch is visible under both feet, and a shadow from the donut is visible on his front.
4. **What:** The closed-eye arcs are still frayed. Both have ragged, hair-like tops (bite-3 x 990–1080, y 585–610). The far arc sits on the head's left silhouette (bite-3 x 915–950, y 570–600), so it reads as a bushy brow. It is the face in every munch and burp frame.
   **Where:** The eye-arc voxels in `src/art/models/glazey.ts`. Remove the per-voxel coverage jitter.
   **Target:** Clean arcs 2 voxels thick with a constant width, and the far arc fully inside the silhouette.
5. **What:** The hero frame is still cropped.
   - The saturated pink canopy fills x 0–285, y 0–390 with no trunk in frame.
   - The top of the lighthouse is cut off at the frame edge (bite-3 x 1400–1550, y 0–20; bite-1 x 1465–1620, y 0–20), so the glowing donut beacon (a Follow item in refs 01 and 02) is missing.

   **Where:** The `munchStage()` camera yaw and pitch in `m5Munch.ts`.
   **Target:** The canopy is either out of frame or in frame with its trunk, and the lighthouse donut is fully in frame.
6. **What:** The burp face and arm.
   - **f0:** the far eye sits right on the head's left edge (x 1180–1240, y 570–650), with almost no coral beyond it, so the face reads wide-set.
   - **f2:** the near arm juts out horizontally at mouth height (x 1330–1385, y 690–750).
   - **f2:** faint horizontal slice seams cross the right side of the hoop band (around y 645–700).

   **Where:** The eye placement in `glazey.ts` or the f0 yaw in `m5Munch.ts`, the burp arm pose in `GlazeyAnimator.ts`, and the hoop mesh and distortion in `BurpWave.ts`.
   **Target:**
   - At least 1 eye-width of coral beyond the far eye.
   - The arms stay in the lower half of the body.
   - The hoop band is continuous.
7. **What:** The near terrain is coarse.
   - In the roll foreground, the frosting sprinkles are 20–30 px long (y 900–1080).
   - In the bottom-left sand of bite-1 and the crumbs strip, the cells are about 20 px.
   - In the bottom fifth, the grass blades are 10–14 px.

   This breaks the §3 terrain density rule (about 12 px).
   **Where:** The camera height in `m5Munch.ts`, or the sprinkle voxel size on the frosting rim.
   **Target:** No terrain voxel or sprinkle is wider than about 12 px in any gate frame.
8. **What:** The crumbs fall as a narrow vertical stream straight down from the carve (bite-3 x 820–900, y 800–900). There is no outward arc or bounce, and in the 2x crop it reads like a dribble or a column. f1 and f2 are still almost the same.
   **Where:** The initial crumb velocity spread and the f1/f2 `stripTimes` in `chomp()` in `Game.ts`.
   **Target:** In f1, the crumbs fan out in a visible arc 2–3x wider than the carve. In f2, crumbs are mid-bounce on the blade tips.

## Previous fix list (iter 7 r1): status
1. Hold and belly lobe: **not fixed** (fix 1).
2. Roll: **not fixed.** The claimed dust is not visible (fix 2).
3. Bite-1 nick: **fixed.** The carve is about 100 px across and shows the golden interior.
4. Contact at the munch stage: **not fixed** (fix 3).
5. Frayed eye arcs: **not fixed** (fix 4).
6. Cropped canopy and lighthouse: **not fixed** (fix 5).
7. Crumbs strip animation: **partly fixed.** The f0 squash now reads, but f1 and f2 are still near-identical and the crumbs fall straight down (fix 8).
8. Burp f0 eye, f2 arm and hoop seams: **not fixed** (fix 6).
9. Near-terrain density: **not fixed** (fix 7).

## What is working (keep it)
- **The carves.** Bite-1 and bite-3 now show scalloped carves with a golden crumb interior under vanilla glaze and crisp sprinkles. This is close to ref 04 bottom left and consistent with the M3 gallery bites.
- **The burp f1/f2.** A big pastel rainbow hoop beside a wide-open mouth, confetti through it, and a voxel rainbow ground ring. This is still the strongest frame in the gate.
- **The crumbs f0 chomp squash** with crumbs in his mouth.
- **The world.** The golden-hour key, the cool fill, the frosting rim with drips, the milk lagoon, the bakery, the lighthouse and the sprinkle trees are consistent with the M2 and M4 finals.

## Store-page test: no
The hero (m5-bite-3) shows a happy coral character beside a glossy, well-bitten donut. On a store page, a viewer would still see:
- a sausage arm resting on a pale belly lobe instead of holding the donut, which floats below his mouth;
- frayed, brow-like eye arcs;
- a figure standing in grass with no contact shadow;
- a cropped pink blob at top left and a lighthouse with its top cut off.

It is good indie quality in places. It is not store-page quality.

## Regression check
- **M2 final (`m2-ground`):** no regression in the bakery, frosting rim, trees, clouds or grade.
- **M3 final (`gallery-donut-bites`):** no regression. The held classic glaze and the carve interior match the gallery's bitten donuts.
- **M4 final (`m4-jump-apex`):** no regression in body colour, tuft, eyes, glints or blush.
- **Within M5:** no regression against iter 7.

**Escalation (§6):** this is the 8th failed iteration. The means for iters 6 to 8 are 6.73, 6.83 and 6.84, so the plateau rule is still triggered. The gap to the bar is 0.66. Closing it needs the structural items, not tuning:
- a re-authored hold, with the donut placed into the hands at the lips;
- a re-staged roll;
- character contact shadows;
- clean eye arcs.

The builder must now stop and take the options to the user.

```json
{"gate":"M5","iter":8,"verdict":"FAIL","mean":6.84,"min":6,"blockers":0,"store_page":false}
```
