# Review M4 iter 5
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M4 --iter 5` at commit `71f6672`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 16 files to `shots/M4/5/`, with `ok: true` and an empty log.
- **Viewed:** every 1920x1080 frame, the 844x390 touch frame, both strip composites, all three walk frames side by side, and the turntable strip.
- **Zoomed crops (2-4x, nearest neighbour):**
  - Glazey in walk f0 and at the jump apex.
  - The near meadow in the lower left.
  - The pink canopy.
  - A cloud.
  - The lighthouse top in the jump frame.
- **Sampled:** 5x5 pixel means.

Beforehand I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4 and `art/reference/NOTES.md`, and viewed all four references.
- **Primary for Glazey:** 03.
- **Primary for the gameplay frames:** 01 and 02, judged on their Follow lists only. I did not reward 02's chunky grass, blue water or text sign.

For the regression check I compared against `shots/M3/final/gallery-glazey-belly*` and `shots/M2/final/m2-ground`, and read the iter 4→5 diff of shared code.

**Summary.** The iteration delivered the structural camera change it promised, and the frame is better for it:
- **Glazey's position:** he sits on the right third, at x ≈ 1230.
- **Lighthouse:** the shaft and lantern are in frame over the lagoon.
- **Teal ground:** gone. The ground between tufts is hue 87-93.
- **Glazey's value:** he is now clearly brighter than the foreground lawn.
- **Walk motion:** it has real bob and lean.

**The belly re-author went the wrong way.** It is now a small, low, ragged-edged cream smear:
- **In play:** it reads as a goatee or a drool stain under the mouth.
- **In the studio:** it reads as a khaki fringe along the bottom of the body.
- **Against M3:** it is a clear step back from the clean oval belly in `shots/M3/final`, which makes it a regression blocker under §4.5.

**Also unresolved:** Glazey still stands on the lagoon rim in the jump frame, the studio core is still red, the clouds still have a speckled band, and the pink canopy got a dither band.

The gate mean is flat at about 6.7.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m4-walk-strip (still + strip) | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 8 | 6 | 7 | 7 | 6.9 |
| m4-jump-apex | 7 | 6 | 7 | 6 | 7 | 6 | 7 | 8 | 6 | 7 | – | 6.7 |
| m4-touch-ui (hero) | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 8 | 6 | 7 | – | 6.9 |
| gallery-glazey-belly | 6 | 7 | 7 | 7 | 6 | 6 | 8 | 5 | 6 | 7 | – | 6.5 |
| gallery-glazey-belly_strip (turntable) | 6 | 7 | 7 | 7 | 6 | 6 | 8 | 5 | 6 | 7 | – | 6.5 |

- **Gate mean:** about 6.7. The history is 5.9, 6.6, 6.6, 6.8, and now 6.7. The bar is 9.0.
- **Minimum:** 5.

**Plateau (§5):** the structural change raised composition from 6 to 7. The belly re-author cost about as much as that gained, so the gate is still on a plateau. The next structural change must target **Glazey himself**: the belly and the form lighting.

## Blockers
- **[gallery-glazey-belly, all play shots] Regression in shared content against `shots/M3/final/gallery-glazey-belly` (pass bar §4.5).**
  - **In M3 final:** each stage carries a clean, smooth cream oval belly that covers about 40 % of the front, as on sheet 03.
  - **The iter 5 studio belly:**
    - It is a low crescent strip that covers only about 15 % of the front, for example y 830-900 on stage 5.
    - Its edge is a ragged, hairy fringe. That comes from the binary `hash3 < fade` coral/cream dither in `glazey.ts` `faceLayout`, at about l.444.
    - It samples **hue 41, sat 0.32-0.36, luma 145-166**, for example at (1010,870) and (380,850). That is still khaki, not `#F5E2A8` cream.
  - **In play:** the patch sits at (1150-1230, 740-800) directly under the mouth, with a frayed edge. It reads as a **goatee or a drool stain**, not a tummy.
  - The asset is shared and visibly worse than the previously passed final, so this is a blocker.

There are no art bible §10 instant-fail items:
- No acne, no holes, no clipping and no debug overlays.
- Near grass voxels are about 8 px.
- No luma ≥ 250, and no crushed blacks apart from the intentional eye ink.

## Fix list (priority order; max 10; each concrete and testable)
1. **Re-author the belly to match sheet 03 (blocker).**
   - **Where:** `src/art/models/glazey.ts` `faceLayout`, from about l.355 (`bellyTop = mouthY - mouthRy - 2`, `bellyBot`, `bellyRx`) to l.436-453 (`dome(... 0.08, 0.75)`, the `hash3 < fade` dither), plus `glazeyBellySoft` in `palette.ts`.
   - **Remove the dither.** A random binary coral/cream dither at character scale reads as fur or stubble, not as a soft edge.
   - **Target:**
     - A smooth upright oval covering 35-45 % of the front silhouette, from about 1.5 face voxels below the smile to just above the feet.
     - A crisp but anti-aliased edge, like M3 final or sheet 03.
     - Studio lit-centre colour with hue ≤ 45, sat ≥ 0.30 and luma ≥ 200: true cream, not khaki.
     - In play, a lit centre no more than about 30 luma above the lit coral. It is +65 now: 218 against 153.
     - Convex shading from top to bottom of at least 20 luma.
     - In the 3/4 play view it sits centred on the body's front axis, not pushed up under the mouth.
2. **Make the jump read as airborne. Third time on the list.**
   - **Where:** the jump spawn and pose in `src/debug/scenes/m4Play.ts`, and `ContactShadow.ts`.
   - **Problem:**
     - Glazey's soles are at y ≈ 690, exactly on the lagoon frosting rim.
     - A lilac shadow patch (luma 120, at (1180-1220, 700-720)) touches his feet.
     - He reads as standing on the wall.
     - He is also jammed against the pier stairs and the lagoon wall, so the frame is crowded.
   - **Target:**
     - The apex shot over open lawn or path, with at least 40 px of visible ground between the soles and a smaller, softer, offset contact shadow.
     - A stretch pose with feet dangling.
     - Clear sky or lawn behind him, not the wall.
3. **Model Glazey's form with light.**
   - **Where:** the play hero material and lighting in `Materials.ts` and `Game.ts` (`heroRim`, `selfLight`).
   - **Problem:**
     - His lit body spans only luma 145-168 from the sun side to the shadow side. He reads as a flat-lit felt blob, with no terminator, no warm rim and no specular.
     - The face is pushed to the left edge of the 3/4 silhouette. The left eye touches the outline at about (1140, 650) in walk.
   - **Target:**
     - At least 50 luma between the sun-side highlight and the core shadow on the body.
     - A visible warm rim on the sun side.
     - A soft spec sheen on the "candy" coral.
     - The face centred at least 15 % of body width inside the outline in the play 3/4 view.
4. **Make the studio core cool. Not fixed since iter 2.**
   - **Where:** `studio.ts` fill, and the `glazeyBody` flags. The hue hold was removed, but the studio fill is still warm.
   - **Problem:** on stage 5 the shadow side at (1450,700) is hue 7, sat 0.54. The lit side at (1700,700) is hue 13, sat 0.54. The core is red, not lilac.
   - **Target:** a shadow-side hue at or below 0 (rose-lilac), with sat at least 0.08 below the lit side.
5. **Keep the lighthouse's glowing donut in frame.**
   - **Where:** the `FollowCamera.ts` look-ahead pitch, or the stage position.
   - **Problem:**
     - In walk and touch, the lantern cap touches y ≈ 0 and the glowing donut topper is out of frame.
     - In jump, the donut is cut in half by the top edge, at (930-1050, 0-15).
     - The glowing lighthouse donut is a Follow item for both 01 and 02.
   - **Target:** the whole lighthouse, glowing donut included, at least 40 px below the top edge in all three play shots.
6. **Smooth the pink canopy, without the dither band.**
   - **Where:** `src/art/models/sprinkleTree.ts`, the `res > 1` branch (`k = py/30 + (h-0.5)*0.7`).
   - **Problem:**
     - The gradient now reaches 49 luma: 117 at (500,250) to 68 at (500,530). That meets the old target.
     - The ×0.7 hash term creates a **salt-and-pepper dither band** across the lower half, from about y 280 down to 560 in walk. It is visible at 1x and will crawl in motion (§10.7).
     - The lit side peaks at luma 120, under the 130 target.
     - The tree also fills about 12 % of the frame. Together with the cropped green tree it walls off the left 40 % of the upper frame.
   - **Target:**
     - A continuous shaded gradient with no per-voxel two-tone noise in a 2x crop.
     - Lit-side luma ≥ 130.
     - Move or shrink it so that no single foreground tree exceeds about 10 % of the frame.
7. **Clouds: the band is softer but still there.**
   - **Where:** `smallProps.ts` `buildCloud`.
   - **Problem:** the three-step ramp with ±1.5 dither still shows a lilac speckled band in the bottom third, at (1130-1390, 70-100) in walk.
   - **Regression risk:** this change is unconditional and affects the M2 clouds too. The builder must re-shoot `m2-hero` and `m2-ground` and compare them with `shots/M2/final`, whose clouds have a smooth underside.
   - **Target:** no visible band or speckle in a 4x crop. Shade through lighting and AO, or through a smooth per-voxel ramp without hash noise.
8. **Make the take-off and walk dust warm and placed.**
   - **Where:** `src/game/fx/VoxelParticles.ts`.
   - **Problem:** the cool-white cubes behind the trailing foot, at (1180-1260, 760-800) in walk f0 and f2, still read as litter.
   - **Target:** warm cream or dough-tinted puffs, clustered at the foot contact and fading in size and alpha along an arc.
9. **Read the milk as milk.**
   - **Where:** `src/engine/render/Water.ts`.
   - **Problem:** it still has a pink satin cast with long streaks across the near half, for example (400-1000, 560-620) in walk.
   - **Target:** cream-white body, broad soft specular, a depth tint at the drip wall, and pink limited to wall reflections.
10. **Fix the studio composition.**
    - **Where:** `src/debug/scenes/gallery.ts` row spacing.
    - **Problem:** the stage 3 tuft, at about (380-500, 490-565), overlaps the feet of stage 0 above it.
    - **Target:** at least 20 px of clear background between every figure.

## What is working (keep it)
- **The look-ahead camera:**
  - Glazey sits on the right third with lead room.
  - The lagoon, pier and lighthouse layer behind him as in reference 02.
  - The confetti rim no longer dominates the lower-right corner.
- **Warm ground.** The teal carpet is gone. The ground between tufts is hue 87-93 and slightly darker than the blades, and the denser lattice gives a lush, even meadow.
- **The value hierarchy is much better.** Glazey's lit body (145-168) now stands above the foreground lawn (64-99).
- **The walk has real amplitude:**
  - The head top varies about 20 px across frames.
  - There is a visible forward lean and a swinging arm.
- **Unchanged strengths:**
  - The face: big warm eyes with crisp glints, an open smile and blush.
  - The clean 5-stripe tuft.
  - The coral back view.
  - The candy touch buttons, with the coral jump icon and the donut joystick.
  - The green sprinkle-ball trees.
  - Tree shadows raking the path.

## Store-page test: no
In the touch-ui hero frame the composition is finally reasonable. But at the focal point, Glazey's belly reads as a frayed goatee under his mouth, he is lit like flat felt, and the lighthouse's signature glowing donut is cropped away. A dithered pink canopy fills the left of the frame. It is a pleasant 7/10 indie frame. It does not stand next to reference 02 or the best voxel art of the year.

## Previous review (M4-iter4): status of the fix list
| # | item | status |
|---|---|---|
| 1 | Recompose the gameplay frame | **Mostly fixed.** Glazey is on a third with lead room, the lighthouse shaft and lantern are in frame, and the rim corner is under 12 %. The glowing donut topper is cropped, and the left trees are too heavy (items 5 and 6). |
| 2 | Belly a tummy, not a sticker | **Not fixed, regressed.** It is now a small, frayed, khaki strip and a regression blocker (item 1). |
| 3 | Jump reads as airborne | **Not fixed.** Glazey still stands on the rim, and the shadow touches his soles (item 2). |
| 4 | Kill the teal under-surface | **Fixed.** Hue 87-93, in the tuft family. |
| 5 | Glazey value hierarchy | **Mostly fixed.** He is now brighter than the foreground. There is still no warm rim, and the form is flat (item 3). |
| 6 | Pink canopy form and seam | **Partly fixed.** The gradient is now 49 luma, but there is a new dither band, and the lit side is at 120 (item 6). |
| 7 | Cloud underside | **Partly fixed.** It is softer, but still a speckled lilac band (item 7). |
| 8 | Studio cool core | **Not fixed.** Shadow hue 7 against lit hue 13 (item 4). |
| 9 | Milk reads as milk | **Not fixed.** It still has the pink satin cast (item 9). |
| 10 | Walk amplitude | **Fixed.** About 20 px of head bob, lean and arm swing. |

## Regression check
- **M3 (`shots/M3/final/gallery-glazey-belly`): REGRESSION, blocker.**
  - M3's bellies were large, smooth, clean cream ovals.
  - Iter 5's are small, low, khaki strips with a hairy, dithered edge (see Blockers).
  - The body is also a taller egg than M3's and sheet 03's gumdrop.
- **M2 clouds (`shots/M2/final/m2-hero`, `m2-ground`): unverified risk.**
  - `buildCloud` changed unconditionally. It now has a three-tone ramp, `cloudMid`, and a ±1.5 hash.
  - The M2 final clouds have a smooth underside.
  - I could not re-shoot M2 without writing outside `reviews/`. The builder must re-shoot and compare before iter 6. If a speckled band appears there, it is a blocker.
- **Other shared changes, reviewed in the diff:**
  - `warmMeadow` is opt-in, and set only when `microDecor` is on.
  - The sprinkle-tree change is gated on `res > 1`.
  - The `MicroDecor` grass step applies to play micro-decor only.
  - `palette.ts` removes `glazeyBellyRim`, which was used only by Glazey, and drops the `candy` flag from `glazeyBody`. That flag affects Glazey only.
  - Result: no regression to M0, M1 or M2 terrain, trees or grass in the default paths.

```json
{"gate":"M4","iter":5,"verdict":"FAIL","mean":6.7,"min":5,"blockers":1,"store_page":false}
```
