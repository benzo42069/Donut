# Review M5 iter 4 (reviewer r1)
## Verdict: FAIL

Commit reviewed: 74772b2. I captured the shots myself with `npm run shots -- --gate M5 --iter 4`. The harness ran on the GPU path (ANGLE Metal, Apple M4), exited 0 and wrote 18 files to `shots/M5/4/`. I viewed:
- every 1920x1080 frame and every 844x390 frame;
- both strip composites and every strip frame (f0 to f2);
- 2x crops of the munch face, hand, carve, held glaze, belly seam and crumbs in bite-1, bite-3 and crumbs f0/f1/f2;
- 2x crops of the burp f0 face, the burp f1 hoop and mouth, the roll ball and the roll foreground highlight (I measured it: max (235,227,215), no clipped pixels, so it is not blown).

Before that I read the art bible, the rubric and pass bar (§3–§4), `NOTES.md` and all four references (01 to 04). For the regression check I viewed `shots/M3/final/gallery-donut-bites`, `shots/M4/final/m4-jump-apex` and the M2/M4 final directories. The fidelity targets are:
- **K-07** (ref 04, bottom left): a scalloped bite showing the crumb interior, with crumbs on the table.
- **K-05** (ref 03): the munching, giant-burp and perfectly-round poses.

Short version: the structural change fixed the two things it aimed at most directly.
- **The held glaze is glossy again.** It is peachy, with a real specular lobe. The M3 regression blocker is closed.
- **The mouth is visible in every munch frame.** The tuft also clears the lighthouse.

Everything else is flat or worse:
- The "re-authored hands" still don't hold anything. The near hand is a coral bulb under the blush that reads as a jowl or snout. The donut floats in front of him with no visible support.
- Crumbs burst over his eyes again in crumbs f0.
- The new dithered belly rim reads as a frayed, torn sticker edge. Because it changes the shared Glazey model, it is a visible drop from M4's clean oval, which makes it a new regression blocker.
- The burp and the roll motion cues are untouched.

**Gate mean 6.66 (iter 2: 6.65, iter 3: 6.63).** The structural iteration did not move the mean. The plateau rule (§5) still applies.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 7 | 6 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | – | 6.70 |
| m5-bite-3 (hero) | 7 | 6 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 6 | – | 6.60 |
| m5-crumbs-strip | 6 | 6 | 7 | 6 | 7 | 7 | 6 | 7 | 6 | 6 | 6 | 6.36 |
| m5-burp-strip | 7 | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 6.82 |
| m5-belly-5-roll | 7 | 7 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 7 | – | 6.80 |

**Gate mean: 6.66. Minimum: 6.** No category is below 6. The gate fails on:
- the mean (the bar is 7.5);
- the regression blocker below;
- the store-page test.

## Blockers
- **[every Glazey frame; most visible in burp f0, bite-3, crumbs f1/f2 and roll] The belly seam regresses shared content against M4 (§4 rule 5).**
  - This commit changed `faceLayout` in `src/art/models/glazey.ts` so the outer 20 % of the tummy oval dithers coral and cream per `hash3(floor(x*3), floor(y*3))` cell. It also deleted `glazeyBellyEdge`.
  - The dither cells are coarse: about 4–6 px at 1080p in close frames. The result is a frayed, speckled, torn-paper border:
    - burp f0 crop: the right edge of the cream patch at about x 1150–1170, y 690–810 in the f0 frame;
    - bite-3: x 975–1060, y 690–780;
    - roll: the chin band, x 900–1090, y 820–880.
  - It reads as dirty or moth-eaten, not as sheet 03's soft terraces.
  - `m4-jump-apex` (M4 final) shows a clean, smooth cream oval. This change applies to every belly stage, including belly 0, so it degrades the asset M4 passed with.

The M3 glaze regression blocker from iter 3 is **closed** (see the previous-fix status).

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Replace the belly dither with a clean, graded rim (the blocker).
   **Where:** `faceLayout` in `src/art/models/glazey.ts` (the `fade * fade > hash3(...)` line). Restore an intermediate palette entry in `src/art/palette.ts`.
   **Target:**
   - The cream oval ends in 1–2 voxel rings of an in-between tone (between `#F5E2A8` and `#F28B6E`), followed by a clean coral boundary. If you want variation, vary the ring at the shape level (a slightly wobbly ellipse radius), not per voxel.
   - No isolated coral voxels inside the cream and no isolated cream voxels outside it.
   - At 844x390 the belly reads as one smooth soft oval, at least as clean as in `m4-jump-apex`.
   - Keep the "wraps under the tummy" change (`facing: -0.7`). The flat bottom cut is gone, and that part is good.
2. **What:** Glazey still doesn't hold the donut. The near hand is a free-floating coral bulb on his cheek or chest that reads as a snout, jowl or beak, and the donut hangs in mid-air with nothing touching it.
   - bite-3: x 1040–1130, y 640–720. The bulb points toward the lens under the blush, and the donut's right rim (x ~940–990) touches only his lips.
   - bite-1: x 1060–1140, y 640–700. It reads as a beak or trunk pointing right.
   - crumbs f1: x 1000–1110, y 620–700. crumbs f2: x 1020–1110, y 640–700.

   Sheet 03 "munching" shows **both** stubby hands wrapped around the food *below* the mouth. The commit says "hands grip below the lips at the sides", but the code only reduced `reach` (`GlazeyRig.ts`: 0.42 → 0.15/0.3), so the hand just stopped short of the face.
   **Where:** `GlazeyRig.ts` arm placement during munch, and the held-donut transform in `Game.ts`.
   **Target:**
   - The hand target is a point on the donut's near rim (outer ring, below lip height). The hand mesh visibly overlaps or touches the dough band.
   - The far hand is visible at the donut's far side, or the donut's hidden side is clearly gripped.
   - No coral form sits between the blush and the belly without touching the donut.
   - Test: in bite-3 and crumbs f1 a viewer can say "he is holding it with his hands".
3. **What:** Crumbs burst over the eyes again in crumbs f0. About 15 crumbs sit across the squint arcs and brow (f0 x 955–1020, y 625–670). It is the same failure as iters 2 and 3. f1 is better: a stream drops from the bite down past the belly (x 920–1010, y 720–830). In f2 the crumbs are faint specks in the grass (x 880–1050, y 800–880), and none of them is mid-hop or sitting readably on the blade tips.
   **Where:** the emit origin and velocity in `chomp()` (`Game.ts`). The f0 frame may be posed before the new origin applies, or the emitter may still spawn at head height on the first bite. Also check the settle height.
   **Target:**
   - f0: no crumb above the mouth line.
   - f1: an arc forward and down from the scallop.
   - f2: 3–5 crumbs visibly mid-bounce, and a loose crescent sitting *on top of* the grass in front of him, readable at 844x390, as in ref 04.
4. **What:** The roll still doesn't read as rolling.
   - The ball now has the face low and the tuft on top (good: all 5 stripes show).
   - But there is still no squash, no dust or grass puffs and no motion trail.
   - The ball's bottom is hidden behind the foreground frosting rim (x 880–1090, y ~880), so there is no visible contact or contact shadow. He reads as a head peeking over a ledge.
   - The belly is now a cream chin band under the mouth (x 900–1090, y 820–880). It reads as a beard, not sheet 03's "perfectly round" tummy.

   **Where:** the roll still in `m5Munch.ts` (camera height and position, so the ground contact is visible), roll FX in `GlazeyAnimator.ts`.
   **Target:**
   - The ground contact is visible, with a contact shadow.
   - There is about 5 % squash along the contact axis.
   - 3–6 voxel dust or grass puffs trail behind him at 844x390.
   - The body is rotated 20–35° in the travel direction, so the belly oval reads as a tilted oval, not a chin strip.
5. **What:** The burp is unchanged from iter 3. Sheet 03's giant burp is still not met.
   - In f1 the hoop's right edge (x ~1095) is still about 70 px from his open mouth (x ~1175, y ~700).
   - There is no visible screen-space ripple anywhere.
   - The hoop is still a perfectly smooth tube with no voxel stepping, next to voxel ring cubes.

   **Where:** `BurpWave.ts` (spawn offset), `Ripple.ts` (band and amplitude).
   **Target:**
   - The hoop's near edge overlaps his mouth in f1.
   - The background shows 6–10 px of displacement inside a band around the ring.
   - The hoop has a faint voxel step or a sparkle-voxel sheath.
6. **What:** The munch-frame composition still has two distractions (the tuft–lighthouse tangency is fixed).
   - **A big, soft, two-lobed shadow** from an offscreen object lies across the foreground sand path in every munch frame (bite-3 x 350–1350, y 940–1080; bite-1 the same; crumbs strip all frames).
   - **The top-left pink canopy** is still a cropped, trunkless mauve mass (bite-3 x 0–360, y 0–420; only a sliver of trunk at x 0–15). It is the largest, most saturated mass in the frame. Bite-1 and crumbs show the trunk and are acceptable.

   **Where:** `munchStage()` camera in `m5Munch.ts`; offscreen prop placement in `MeadowDiorama.ts`.
   **Target:** The bottom quarter shows no large unexplained shadow. In the hero, either the canopy and trunk are both in frame or the canopy is out.
7. **What:** Near-terrain density still breaks art bible §3 (≤ about 12 px on terrain) at the munch camera.
   - The sand path's per-voxel color cells are about 18–25 px at the bottom edge (bite-3 x 350–1500, y 980–1080).
   - The foreground grass clumps in the lower-right corner are 12–15 px cubes (bite-3 x 1600–1920, y 1000–1080).
   - In the roll shot the nearest sprinkles on the foreground frosting rim are 20–30 px long capsules (x 0–1920, y 950–1080), Lego scale.

   **Where:** the camera height and distance in `m5Munch.ts`, or the near-terrain LOD and jitter cell size in `MeadowDiorama.ts`.
   **Target:** No terrain or sprinkle voxel larger than about 12 px in any gate frame.
8. **What:** The burp f0 far eye still wraps the silhouette as a dark crescent with no glint (x ~1090–1120, y 580–650 in f0). It reads as a bruise or hole. The bite-3 far squint arc also sits on the head's edge (x 955–985, y 565–590).
   **Where:** the burp f0 yaw in `m5Munch.ts` (`camYaw - 50 * DEG`), and `CAM.focusSide` / `STAGE_TURN`.
   **Target:** Both eyes are fully on the face (a 25–35° three-quarter view), or the far eye is fully hidden.
9. **What:** The squint arcs in bite-1 and crumbs f1/f2 have a metallic, bronze-looking specular streak (bite-1 x 1070–1120, y 575–590). They read as metal brackets, not soft closed eyes.
   **Where:** the material flag on the eye-arc palette entry (probably shares the glossy eye material) in `palette.ts` / `glazey.ts`.
   **Target:** Closed-eye arcs are matte dark brown, with no specular streak.
10. **What:** The bite-3 carve is now on the lower front of the donut, so the hero donut's silhouette reads as a crushed taco or a torn half. The torn bottom edge (x 690–930, y 700–750) shows a ragged crumb interior where the ring's lower half should be.
    **Where:** the bite placement and held-donut orientation for stage 3 in `Game.ts` / `m5Munch.ts`.
    **Target:** As in ref 04 bottom left, the three scallops form one clear crescent on the rim facing his mouth, the remaining ring is still legible as a donut, and the golden interior is visible but not dominant.

## Previous fix list (iter 3 r1): status
1. Held glaze gloss (blocker): **fixed.** Bite-1 shows a broad warm specular band and soft sheen across the upper arc (x 760–1000, y 510–620). Crumbs f1/f2 show the same. Bite-3 has a softer peach sheen with drips. All of them read as the same material as `gallery-donut-bites`. The blocker is closed.
2. Hand as a snout over the mouth: **partly fixed.** The mouth is now clearly visible and open at the bite in every frame. But the hand is still an unattached coral bulb that now sits under the blush, and it holds nothing (new fix 2).
3. Crumb arc: **partly fixed.** f1 now streams down from the bite. f0 is still a burst over the eyes, and f2 crumbs are still hidden in the grass (fix 3).
4. Carve sliver or fang at the lips: **fixed.** No protruding spur is visible at the lips in bite-1 or bite-3. The carve's lower silhouette in bite-3 is now the issue (fix 10).
5. Roll: **partly fixed.** The tuft is fully visible (5 stripes). There is still no tilt, squash or dust, the contact is hidden behind the rim, and the belly is a chin band (fix 4).
6. Burp hoop, ripple and voxel form: **not fixed** (fix 5).
7. Munch composition: **partly fixed.** The tuft–lighthouse tangency is resolved, with about 150 px of clearance in bite-3. The foreground shadow and the hero canopy crop remain (fix 6).
8. Near-terrain density: **not fixed** (fix 7).
9. Belly seam outline: **fixed, then replaced by a worse problem.** The tan outline ring is gone, but the dithered fray is a regression blocker (fix 1).
10. Profile camera and far eye: **partly fixed.** The munch camera now shows more of the face (both blushes are not visible, but the mouth and near eye read). Burp f0 is unchanged (fix 8).

## What is working (keep it)
- **The held glaze.** It is warm, peachy and glossy, with a real specular lobe and drips over the dough band. It now matches the M3 gallery donut. Keep the card light approach, but make sure it does not brighten anything else.
- **The visible open mouth at the bite.** The dark red mouth interior at the scallop sells "munch" for the first time in this gate.
- **The bite interior and scallop on bite-1.** It is golden, crumbed and voxel-carved, close to K-07.
- **The tuft is clear of the lighthouse** in the munch frames and fully visible on the roll.
- **The roll face.** It has big glossy eyes with 2x2 glints, blush and an open smile. It is still the cutest frame in the gate.
- **The world.** The golden-hour key, the cool fill, the frosting rim with drips, the milk lagoon, the bakery, the lighthouse and the pastel ring cubes are all consistent with the M2 and M4 finals.

## Store-page test: no
In the hero (m5-bite-3), the donut finally looks delicious and his mouth is on it. But:
- he isn't holding it, so the donut hovers;
- a coral bulb sits under his cheek like a second nose;
- his belly has a frayed, speckled edge with crumb flecks on it;
- the bitten donut reads as a torn half;
- a large unexplained shadow and a cut-off canopy frame the shot.

A polished, well-reviewed kids' game would not lead with this frame. It is getting closer, but it isn't there.

## Regression check
- **M2 final (meadow, bakery, lagoon, lighting):** no regression. The lighting, AO, frosting rim, trees and lagoon match.
- **M3 final (`gallery-donut-bites`):** **resolved.** The held classic glaze now reads as the same glossy, peachy material. The carve interior matches.
- **M4 final (`m4-jump-apex`, `gallery-glazey-belly`):** **regression (blocker).** The new per-voxel coral/cream dither on the belly rim changes the shared Glazey model at every belly stage. It visibly degrades the clean M4 belly oval. The body colour, tuft and eyes match M4.

**Plateau rule (§5):** the means are 6.44, 6.65, 6.63 and 6.66 (iters 1 to 4). This iteration's structural change raised the mean by 0.03, and the gain over the last two iterations is 0.01, so the rule is still triggered. The next structural change should be **the munch pose itself**. Author a proper two-handed hold, hands IK'd onto the donut rim below the mouth, with the donut clearly supported. Pair it with a re-planned munch camera that shows his feet and his contact with the ground and keeps the sand path's shadow out of frame. The other open items (burp hoop, ripple, roll FX) need code that has not been touched in two iterations.

```json
{"gate":"M5","iter":4,"verdict":"FAIL","mean":6.66,"min":6,"blockers":1,"store_page":false}
```
