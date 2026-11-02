# Review M5 iter 4 (reviewer 2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M5 --iter 4-r2` at commit `74772b2`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 18 files to `shots/M5/4-r2/`.
- **Viewed:** every 1920x1080 still, the 844x390 hero, both strip composites and all six strip frames.
- **Zoomed crops (2x-3x, nearest-neighbour):** Glazey and the donut in bite-1, bite-3 and the crumbs still (f0); crumbs f1 and f2 at the lawn; the burp f1 ring; the roll ball and the roll foreground band.
- **Sampled:** luma, hue and saturation with a scratchpad script (region medians and percentiles). I also checked that `m5-crumbs-strip_1920x1080.png` is pixel-identical to strip f0 (it is).
- **Read beforehand:** `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4, `art/reference/NOTES.md`, all four references, the M2/M3/M4 finals and `reviews/M5-iter3-r2.md`.
- **Pass bar:** mean ≥ 7.5 and every category ≥ 6. I applied it unchanged.

**Summary.** The warm card light fixed the item that has led the fix list for three iterations.
- **Glaze:** the held glaze now samples at a median luma of 204 on its lit top. That equals the M3 gallery glaze (204). It also has a real specular lobe along the inner rim in bite-1, so the regression threat from iter 3 is lifted.
- **Roll:** the tuft is back on the roll silhouette.
- **Crumb face:** it is now light (median 174).

Everything else that held the gate at 6.7 is still there, and one item has regressed:
- **Crumbs over the eye (regressed):** crumbs f0 again sprays roughly 20 crumbs across his eye and brow. The commit says the crumbs now come "only from the bite below the lips", but the frame shows otherwise.
- **Hands:** neither hand holds the donut. The near arm has moved from a "snout" under the mouth to a droopy coral jowl hanging off the cheek, and the donut floats in front of his face with no support.
- **Belly:** it reads as a dithered sticker. In roll it is a cream "beard" under the mouth.
- **Roll:** there is still no motion cue at all.
- **Near terrain:** the band is still over the density limit.

The gate mean is 6.7 again (+0.06). The plateau rule is triggered (see Scores).

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 6 | 7 | – | 6.7 |
| m5-bite-3 (hero) | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | – | 6.8 |
| m5-crumbs-strip | 6 | 7 | 7 | 6 | 7 | 7 | 6 | 7 | 6 | 6 | 6 | 6.5 |
| m5-burp-strip | 8 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 8 | 7 | 7 | 7.1 |
| m5-belly-5-roll | 6 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | 7 | 7 | – | 6.5 |

- **Gate mean:** 6.7 over all 52 category scores (349 / 52 = 6.71). The bar is 7.5.
- **Minimum:** 6. No category is below 6.
- **Gap to the bar:** the gate fails on the mean, by 0.8.
- **Trend:** 6.3 → 6.6 → 6.65 → 6.71.
  - The last two iterations together gained only +0.1, which is under the 0.3 threshold, so the **§5 plateau rule is triggered**.
  - Iter 4 was billed as structural. It fixed materials, which earned +1 in three shots. It did not touch the staging problems (hands, belly, crumbs, roll), which are now what holds the mean down.
  - Iter 5 must make a structural change aimed at those problems, not at the glaze.

## Blockers
None. Here is the art bible §10 check across all shots:
- **Lighting artifacts:** no z-fighting, shadow acne, light leaks or mesh holes.
- **Clipping:** no pixels in the roll frame clip at ≥ 252 on all channels. The bright smear at the lower left of roll (540-1000, 990-1080) peaks at about (235, 227, 215), so it is not blown, though it is ugly (fix 7).
- **Overlays and kid-safety:** no debug overlays, no sky banding and nothing scary.
- **Held glaze against M3:** not a regression. The glaze top is median 204 in bite-1 and bite-3; M3 `gallery-donut-bites` is also 204.
- **Crumbs over the eye:** this is a quality defect, not an instant-fail item. I score it under fx, charm and tech.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** make his hands visibly hold the donut. This item is in its fourth iteration and has never been fixed.
   - **Where:** the munch arm pose in `src/game/player/GlazeyAnimator.ts` and `GlazeyRig.ts`, the arm geometry in `src/art/models/glazey.ts`, and the held-donut offset in `src/game/munch/Munch.ts`.
   - **Problem:**
     - In bite-1 (1060-1150, 620-700), bite-3 (1040-1130, 640-710) and every crumbs frame, the near arm is a coral sausage hanging from just under the blush. It points down and to camera-right, away from the donut, and reads as a droopy jowl or a second cheek.
     - The far hand is not visible anywhere.
     - The donut (700-1030, 500-760) touches him only at the mouth, so it floats. That is what keeps AO/contact at 6 in all three munch shots.
   - **Target:**
     - As in 03 "munching": both stubby hands overlap the donut's rim. The near hand is in front of the lower-right of the donut, with at least 30 px of coral over the glaze at 1080p. The far hand peeks around the far rim.
     - Nothing coral projects outward from the cheek.
     - A soft AO or contact shade where the hands meet the dough.
     - If the rig cannot reach, bring the donut to the hands (lower it and pull it toward his chest), not the reverse.
2. **What:** stop the crumbs crossing his eye. This has regressed: iter 3 f0 had them, and iter 4 f0 has them again despite the commit message.
   - **Where:** `Game.ts` line 678 (`this.crumbs.emit`), which has `up: [-0.1, 0.55]` and `speed: [0.5, 1.4]` with `dir` biased toward the lens.
   - **Problem:**
     - In crumbs f0 (= the crumbs still), about 20 crumbs sit over the near eye and brow at (950-1060, 630-680).
     - The spawn points are filtered to below the lips. However, an upward kick toward the camera projects them up the screen over the face.
   - **Target:**
     - In f0, no crumb is above the mouth line in screen space.
     - Use `up` ≤ 0.15 and a downward/outward bias, so they spill from the bite down the belly as in 03 "munching". The bite-3 still already shows exactly this: crumbs on the belly at (1000-1060, 680-720), which is good.
3. **What:** re-author the belly patch as a shaded oval, not a dithered sticker or bib. This has been open since M4 iter 8 and is now structural.
   - **Where:** the belly patch in `src/art/models/glazey.ts` and its palette entries in `src/art/palette.ts`.
   - **Problems by shot:**
     - **Munch shots:** the patch has a hard straight left edge running down the silhouette. Its stair-step dither seam (bite-1 crop, 990-1080, 690-790) reads as orange stubble.
     - **Gradient:** top 194, bottom 174, so 20 luma. That is better than iter 3's 4 but still short of the target.
     - **Roll:** the belly is a thin crescent right under the mouth with a frayed, hairy dither edge (900-1090, 820-885). It reads as a beard.
   - **Target:**
     - The 03 "full" and "perfectly round" belly: a clean elliptical oval centred on the lower front of the body, with a smooth one-voxel blend into the coral.
     - At least 35 luma of top-to-bottom shading.
     - In roll it rotates with the ball, either as a clear oval or out of view. It is never a chin strap.
4. **What:** give the roll a roll.
   - **Where:** the roll FX and pose in `GlazeyAnimator.ts` and the `VoxelParticles` dust, plus the M5 roll stage camera.
   - **Problem:**
     - The ball (820-1180, 510-885) is an upright smiling face with the tuft on top. That is cute, but it reads as standing or hovering, not as rolling.
     - There is no dust, no grass parting and no squash.
     - The contact point is hidden behind the foreground frosting ridge at y ≈ 885, so the ball reads as hovering.
   - **Target:**
     - The contact patch is visible on the grass, with a 5-8 % squash and bent blades.
     - 3-5 lit dust or crumb puffs trail the ball, legible at 844x390.
     - The face tilted 20-40° off upright, or a short motion arc of grass flick, so a viewer reads "rolling".
5. **What:** reframe the roll and munch near band. The roll foreground has grown.
   - **Where:** the roll stage camera and munch camera (`FollowCamera.ts` and the M5 stage setup).
   - **Problem:**
     - In roll the pink frosting band covers about 17 % of the frame (880-1080). It has oversized sprinkles at about 8 px per voxel (over the ~6 px prop limit) and zig-zag facet creases (rollfg crop, 300-1100, 880-1000).
     - In bite and crumbs, the lower-left and lower-right grass tufts (0-160, 980-1080 and 1500-1920, 990-1080) are still about 13-16 px per voxel, over the 12 px terrain limit.
   - **Target:** a foreground band of ≤ 5 % and no near voxel over the art bible §3 limits in any M5 frame.
6. **What:** clean up the crumb interior and the bite silhouette in bite-3.
   - **Where:** `src/engine/voxel/Carve.ts` (crumb fill jitter) and the bite SDF in `Munch.ts`.
   - **Problem:**
     - The crumb is now light (median 174 at 760-900, 690-740), which is good. However, its saturation is 0.54, against 0.47 on M3, and it is a high-contrast orange-on-cream speckle that reads as granola.
     - The three bites have eaten the whole lower-front of the donut, so it reads as a melted lump with a draped glaze lip (680-960, 600-760), not as 04's clean scalloped bite out of one side.
   - **Target:**
     - Crumb jitter at ≤ ±6 % value and saturation ≤ 0.45, like 04's bottom-left donut.
     - Three distinct round scallops along one side of the rim, so the ring and hole stay readable at 844x390.
7. **What:** remove the glare smear on the roll foreground.
   - **Where:** frosting specular or roughness in `Materials.ts` at grazing angles, or bloom.
   - **Problem:** at the lower left of roll (540-1000, 990-1080) a broad cream-white smear washes out the frosting and sprinkles. It reads as a lens artifact, not as glaze.
   - **Target:** the frosting specular on near ground is limited to soft highlights of no more than about 200 luma, with the sprinkles still readable through it.
8. **What:** make the settled crumbs read in crumbs f2. This is partly fixed.
   - **Where:** the `crumbs.emit` size and colours in `Game.ts` and settle height in `VoxelParticles.ts`.
   - **Problem:** at 3x zoom about 10 tan crumbs sit on the blade tips (900-1060, 820-870). At 1x they are almost indistinguishable from the yellow-green blade tops.
   - **Target:** 8-15 crumbs visible at 1x, with a toasted-golden rim tone that contrasts with the grass (a luma or hue difference of at least 25 against the local blades).
9. **What:** make the burp's grass reaction and distortion visible. This is unchanged since iter 3.
   - **Where:** `src/game/fx/BurpWave.ts`.
   - **Problem:** the hoop and the dotted rainbow ground ripple are lovely. However, in f1 no blade inside the ring visibly leans outward, and there is no refraction band at the ring edge.
   - **Target:** blades within about 1 m of the ripple front visibly lean outward in f1, and there is a subtle warp hugging the hoop's outer edge.
10. **What:** tone down the warm card light's spill onto Glazey.
    - **Where:** the card light in `Game.ts` (around line 969, strength constant at line 73).
    - **Problem:**
      - Since the card light arrived, the glaze has shifted peach (saturation 0.41 against M3's 0.33). It reads as apricot fondant rather than vanilla.
      - The brow arcs in bite-1 (750-830, 560-590) pick up a metallic bronze highlight.
    - **Target:**
      - Restrict the card light to the donut, by light layer or a tighter cone.
      - Glaze saturation ≤ 0.35 with the luma kept around 200.
      - The eye arcs stay matte dark brown.

## What is working (keep it)
- **Glaze value and gloss:** the held glaze now matches the M3 gallery in value (204) and shows a continuous specular streak along the inner rim in bite-1. Fix 1 from iter 3 is essentially done; don't regress it.
- **Crumbs on the belly in bite-3:** a direct, charming nod to 03 "munching".
- **The roll face and tuft:** big glinting eyes, blush, open smile, and the rainbow tuft back on the silhouette. It is very cute.
- **Burp strip:** the surprised "o" face, the wide burp and the laugh are all on-model. The pastel hoop and rainbow ground ring are clean and joyful.
- **World and grade:** the bakery, lighthouse, sprinkle trees, frosting rim with drips, milk lagoon and golden-hour grade match the M4 final.

## Store-page test: no
At 844x390 the hero (m5-bite-3) reads as "a happy coral creature eating a big glazed donut in a candy world", and the glaze now looks appetizing. A polished store page still would not ship it:
- The donut floats at his mouth with no hands on it.
- A coral jowl hangs off his cheek.
- The bitten donut has become a lumpy, speckled mass rather than a clean bite.
- The belly is a dithered patch with a hard edge.

## Previous fix list (M5-iter3-r2) status
1. **Glossy vanilla glaze:** fixed. The median is 204, equal to M3, with a visible specular lobe. A minor peach tint remains (new fix 10).
2. **Near arm reads as a snout:** not fixed. The snout is gone, but the arm is now a jowl off the cheek. Neither hand touches the donut.
3. **Carve and crumb:** partly fixed.
   - The glaze tooth is gone, and the crumb is now light (174, above the 160 target).
   - The speckle is still noisy, and the bite shape lost the ring's readability.
4. **Crumbs over the forehead:** not fixed (regressed). f0 again shows crumbs over the eye and brow. f2 crumbs now sit on the blade tips but are barely legible at 1x.
5. **Belly as a shaded form:** partly fixed. The outline ring is replaced by a dither, and the gradient is 20 luma (target 35). It is still a sticker in the munch shots and a beard in roll.
6. **Roll reads as roll and as Glazey:** partly fixed.
   - The tuft is visible again, and the ball is about 35 % of the frame height.
   - There is still no dust, squash or grass reaction, and the contact is hidden.
   - The foreground band grew to about 17 %.
7. **Near-terrain density:** not fixed. The corner tufts are still about 13-16 px.
8. **Oversized foreground sprinkles and faceted frosting:** not fixed. Both are worse in roll because the band is larger, and there is a new glare smear.
9. **Burp ground reaction and distortion:** not fixed.
10. **Munch composition (canopy and tree shadow):** partly fixed. The top-left canopy is smaller (about 0-400, 0-430, still heavy). The long trunk shadow across the foreground path remains.

## Regression check
Against `shots/M2/final`, `shots/M3/final` and `shots/M4/final`:
- **World (trees, lighthouse, bakery, frosting rim, milk, grade):** no drop against the M4 walk final or the M2 ground final.
- **Held donut against the M3 bite gallery:** the glaze value now matches (204 against 204). The iter 3 threat of a regression blocker is withdrawn.
  - The crumb is lighter than in iter 3 and close to M3's value, but more saturated and noisier (0.54 against 0.47 saturation).
  - The bite shape is less clean than M3's scallops. I scored that under materials and detail, not as a regression blocker, because the carve depth is M5-specific.
- **Glazey's face:** it matches or beats the M4 final.
- **Belly:** in the munch and roll poses it reads worse than the M4 walk final's clean oval (fix 3). The M4 asset itself is unchanged, so this is pose and patch authoring, not a blocker. If the next iteration leaves the M4-style oval looking worse, I will treat it as a regression.

```json
{"gate":"M5","iter":"4-r2","verdict":"FAIL","mean":6.7,"min":6,"blockers":0,"store_page":false}
```
