# Review M5 iter 5 (reviewer 2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M5 --iter 5-r2` at commit `321d627`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 18 files to `shots/M5/5-r2/`.
- **Viewed:** every 1920x1080 still, the 844x390 hero, both strip composites and all six strip frames.
- **Zoomed crops (1x-2x, nearest-neighbour):** Glazey and the donut in bite-1, bite-3 and crumbs f0/f1/f2; burp f0/f1/f2; the roll ball and the roll foreground band.
- **Sampled:** luma and saturation with a scratchpad script (region medians).
- **Read beforehand:** `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4, `art/reference/NOTES.md`, all four references, the M3 and M4 finals and `reviews/M5-iter4-r2.md`.
- **Pass bar:** mean ≥ 7.5 and every category ≥ 6. I applied it unchanged.

**Summary.** The structural change helps the munch shots, and the hero now reads at 844x390 as "happy Glazey chomping a donut".
- **Donut:** it is smaller and rides at chest height against the belly.
- **Far hand:** it reaches the far rim.
- **Bite and face:** the bite shows golden crumb with crumbs dropping onto the belly, and the open grin in bite-3 is charming.

Most of what held iter 4 at 6.7 is still open, though:
- **Crumbs over the eye:** crumbs f0 again sprays crumbs across his brow and eye. This is the third iteration running.
- **Near hand:** it still stops short of the donut.
- **Belly:** it is now a lopsided crescent with a stepped hard edge in the munch shots, and still a cream "chin strap" in roll.
- **Roll:** it is effectively unchanged (no motion cue, contact hidden, a large foreground band).
- **Burp hoop:** it has grown into a 2:1 standing "portal" taller than Glazey.
- **Glaze:** it drifted further toward apricot.

The gate mean is 6.85 (+0.14). The plateau rule is still in effect.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | – | 6.9 |
| m5-bite-3 (hero) | 7 | 8 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | 7.2 |
| m5-crumbs-strip | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 6 | 6 | 7 | 6.7 |
| m5-burp-strip | 7 | 6 | 7 | 7 | 7 | 6 | 7 | 7 | 8 | 7 | 7 | 6.9 |
| m5-belly-5-roll | 6 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | 7 | 7 | – | 6.5 |

- **Gate mean:** 6.85 over all 52 category scores (356 / 52). The bar is 7.5.
- **Minimum:** 6. No category is below 6.
- **Gap to the bar:** the gate fails on the mean, by 0.65.
- **Trend:** 6.3 → 6.6 → 6.65 → 6.71 → 6.85.
  - Iters 4 and 5 together gained +0.2, which is under the 0.3 threshold, so the **§5 plateau rule is still triggered**.
  - This iteration's structural change paid off only in the munch staging. The roll and the burp need their own structural rework.

## Blockers
None. Here is the art bible §10 check across all shots:
- **Lighting and mesh artifacts:** no z-fighting, shadow acne, light leaks or mesh holes.
- **Overlays and kid-safety:** no debug overlays and nothing scary.
- **Clipping:** no blown whites on large areas. The small sun glint on the frosting by the pier (bite shots, about 1500-1600, 590-630) is a bloom highlight, not a clip.
- **Crumbs over the eye:** this is a quality defect, scored under charm and tech, not an instant-fail item.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** stop the crumbs crossing his eye. This is the third iteration it has been open; the commit message claims "crumbs below the lips".
   - **Where:** `src/game/Game.ts` line 682, `this.crumbs.emit({ … up: [-0.3, 0.3], dir: { x: out.x, z: out.z, bias: 0.6 } })`.
   - **Problem:**
     - In crumbs f0 (= the crumbs still), a diagonal spray of about 15 crumbs runs from the mouth corner up across the far brow and eye at about (905-985, 650-720).
     - The up range still allows a positive kick. The `out` direction points toward the camera, so the crumbs travel up the screen over the face.
   - **Target:**
     - In f0, no crumb is above the mouth line in screen space.
     - Clamp `up` to ≤ 0, or start the crumbs falling.
     - Spawn them from the bite's lower lip, as in f1 (the arc down to the grass there is good) and the bite-3 belly crumbs.
2. **What:** put the near hand on the donut. This is open for the fifth iteration and is partly fixed.
   - **Where:** `GlazeyRig.grip` in `src/game/player/GlazeyRig.ts` and the held-donut offset in `src/game/munch/Munch.ts`.
   - **Problem:**
     - The far hand now meets the far rim, which is good.
     - The near arm is a horizontal coral sausage below the blush. Its tip ends about 30-70 px short of the donut's near rim, with the belly showing between them: bite-1 (1035-1180, 650-740), bite-3 (1020-1175, 685-755) and crumbs f0 (1005-1150, 760-830).
     - It reads as an arm hugging his own belly, not one holding food.
   - **Target:**
     - At least 30 px of the near hand overlaps the donut's right rim in every munch frame, as in 03 "munching".
     - There is a contact shade where they meet.
     - Translate the donut 0.1-0.15 m toward the near hand, or extend the arm along the rim.
3. **What:** re-author the belly as a clean oval in the munch and roll poses. This is open since M4 iter 8, and the M4 final oval is the regression bar.
   - **Where:** the belly patch in `src/art/models/glazey.ts`.
   - **Problems by shot:**
     - **Munch shots:** the belly is a cream crescent along the left silhouette with a stepped, terraced inner edge (bite-3 crop, 1020-1050, 770-880). It reads as a side panel or bib.
     - **Roll:** it is a flat-topped cream strip under the mouth with a dead-straight top edge (870-1030, 845-895). It reads as a chin strap or beard.
   - **Target:**
     - The M4 walk final's centred oval with soft shading, kept as a readable oval as the body turns.
     - In roll it rotates with the ball, as a tilted oval, or is out of view.
4. **What:** give the roll a roll. This is unchanged since iter 3.
   - **Where:** the roll pose in `GlazeyAnimator.ts`, the `VoxelParticles` dust, and the M5 roll stage.
   - **Problem:**
     - The ball (740-1120, 510-900) is an upright smiling face with the tuft on top.
     - There is no tilt, squash, dust or grass parting.
     - The contact is hidden in tall grass, so it reads as a standing, slightly sunk head.
   - **Target:**
     - The face tilted 20-40° off upright.
     - 5-8 % squash at a visible contact patch.
     - 3-5 lit dust or crumb puffs trailing the ball, legible at 844x390.
5. **What:** shrink the roll foreground band and fix its scale.
   - **Where:** the roll stage camera in `FollowCamera.ts` and the M5 stage setup.
   - **Problem:**
     - The pink frosting band covers about 17-20 % of the frame, along a diagonal from (300, 1080) to (1920, 780).
     - Its sprinkles render at about 20x10 px, around 10 px per voxel, which breaks the ~6 px prop density limit.
     - The frosting itself is a flat, relief-free sheet: the 02 "Ignore" flaw.
   - **Target:** a foreground band of ≤ 5 %, with no near voxel over the art bible §3 limits.
6. **What:** bring the burp hoop back on-model.
   - **Where:** `src/game/fx/BurpWave.ts` (`hoopGrow` at line 28 and the radius at line 99) and whatever stretches the hoop vertically.
   - **Problem:**
     - In f1 and f2 the hoop is a 2:1 vertical ellipse about 480-620 px tall (870-1130, 445-925 in f1), while Glazey is about 360 px tall.
     - It stands on the grass away from him and reads as a portal or the digit "0", not a burp.
     - Glazey has become small and off-centre in the frame (comp 6).
   - **Target:**
     - As in 03 "giant burp": a round ring of about 0.6-0.9 of his body height, centred on his mouth in f1, that grows as it travels.
     - He is at least 40 % of the frame height.
     - The ground ripple stays (it is lovely).
7. **What:** pull the glaze back to vanilla.
   - **Where:** the card-light colour and strength in `Game.ts`, and the `glazeClassic` palette entry.
   - **Problem:** glaze-top saturation is 0.42 (bite-3) and 0.47 (bite-1), against 0.34 on the M3 bite gallery. Iter 4 measured 0.41, so it is drifting toward apricot fondant.
   - **Target:** saturation ≤ 0.36 with luma ≥ 200, and a cream-white highlight like M3's.
8. **What:** de-granola the crumb interior.
   - **Where:** the crumb fill jitter in `src/engine/voxel/Carve.ts`.
   - **Problem:** the bite interior (bite-3, 770-830, 780-810) has a median saturation of 0.62, against 0.48 on M3. It is an orange-on-cream speckle.
   - **Target:** saturation ≤ 0.50, value jitter ≤ ±6 %, and a soft golden sponge like 04's bottom-left donut.
9. **What:** keep the bite visible through the crumbs strip.
   - **Where:** the ring turn in `Munch.ts`.
   - **Problem:** in crumbs f2 the held donut shows an intact rim from the camera. The fresh bite in f1 has turned out of view, so the sequence reads as "the bite healed".
   - **Target:** at least one bite scallop is visible in every frame after the first bite.
10. **What:** make the burp's grass reaction and distortion visible. This is unchanged since iter 3.
    - **Where:** `src/game/fx/BurpWave.ts`.
    - **Problem:** no blades visibly lean outward at the ripple front in f1 or f2, and there is no refraction band at the hoop edge.
    - **Target:** blades within about 1 m of the front lean outward visibly, and there is a subtle warp hugging the hoop.

## What is working (keep it)
- **Munch staging:** the smaller donut against the chest, the far hand on the rim and the 3.2 m munch camera. The hero is now legible at mobile size.
- **The bite-3 grin:** the open laughing mouth, blush and matte closed-eye arcs (no more bronze sheen) are on-model with 03 and genuinely cute.
- **Crumbs:** the f1 crumb arc spills from the bite down to the grass, and settled crumbs are now readable on the lawn in f2. The bite-3 crumbs on the belly are a direct nod to 03 "munching".
- **Burp faces:** the surprised "o" to big laugh is delightful, and the rainbow ground ripple is clean and joyful.
- **Roll face:** big glinting eyes, blush and the rainbow tuft.
- **World and grade:** they match the M4 final.

## Store-page test: no
At 844x390 the hero (m5-bite-3) works as a read: a happy coral creature chomping a glazed donut, with crumbs falling, in a candy world. This is the best M5 hero so far. A polished store page would still not ship it:
- The near arm hugs his belly instead of the donut.
- The belly is a lopsided cream side panel with a stepped edge.
- The glaze looks apricot.
- The bite interior is speckled granola.

## Previous fix list (M5-iter4-r2) status
1. **Hands hold the donut:** partly fixed. The far hand is on the rim; the near hand still falls short.
2. **Crumbs crossing the eye:** not fixed. f0 still sprays crumbs over the brow and eye.
3. **Belly as a shaded oval:** not fixed. The dither is gone, but it is now a stepped crescent in munch and a chin strap in roll.
4. **Roll reads as rolling:** not fixed.
5. **Roll and munch near band:** partly fixed.
   - The munch corner tufts are smaller and acceptable.
   - The roll band is still about 17-20 %, with oversized sprinkles.
6. **Crumb interior and bite silhouette:** partly fixed.
   - The bites are now a tighter crescent on one side, and the ring and hole stay readable.
   - The crumb saturation got worse (0.62).
7. **Glare smear on the roll foreground:** fixed. It is no longer present; the band is now in tree shadow and sun.
8. **Settled crumbs read in f2:** fixed. Orange crumbs are visible in the lawn at 1x.
9. **Burp grass reaction and distortion:** not fixed. The ripple is bolder, but there is no blade lean or warp.
10. **Card-light spill:** partly fixed.
    - The eye arcs are now matte.
    - The glaze saturation rose (0.42-0.47).

## Regression check
Against `shots/M2/final`, `shots/M3/final` and `shots/M4/final`:
- **World (bakery, lighthouse, sprinkle trees, frosting rim with drips, milk lagoon, grade):** no drop.
- **Held glaze against the M3 bite gallery:**
  - Value: 202 against 212. That is close and acceptable.
  - Saturation: 0.42-0.47 against 0.34. This is a visible warm shift and is listed as fix 7. It is not yet a blocker, because the gloss and value hold, but if the next iteration moves it further toward orange I will treat it as a regression.
- **Belly:**
  - In the munch and roll poses it reads worse than the M4 walk final's clean centred oval.
  - The M4 asset in a neutral pose is not in this shot list, so I can't confirm the asset itself regressed. I scored it rather than blocking.
  - If the burp f0 standing pose (which also shows a lopsided side patch) reflects the base asset, the builder must check `gallery-glazey-belly` against M4 before the next review.

```json
{"gate":"M5","iter":"5-r2","verdict":"FAIL","mean":6.85,"min":6,"blockers":0,"store_page":false}
```
