# Review M4 iter 6
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M4 --iter 6` at commit `de1cb6e`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 16 files to `shots/M4/6/` with no errors.
- **Viewed:** every 1920x1080 frame, the 844x390 touch frame, both strip composites, and all three turntable frames.
- **Zoomed crops (2-4x, nearest neighbour):**
  - Glazey in walk and at the jump apex.
  - The jump soles and rim.
  - The lighthouse top in walk and jump.
  - A walk cloud.
  - The pink canopy.
  - Studio stage 4.
  - The stage 3/0 row overlap.
  - A studio arm tip.
  - The touch jump button.
- **Sampled:** 5x5 pixel means.
- **Regression re-shoot:** I re-shot `m2-hero` and `m2-ground` at this commit (`npm run shots -- --gate M2 --iter m4i6reg --only m2-hero,m2-ground`) and diffed them against `shots/M2/final`.

Beforehand I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4, `art/reference/NOTES.md` and `docs/REFERENCE_FIXES.md`, and viewed all four references.
- **Primary for Glazey:** 03.
- **Primary for the play frames:** 01 and 02, judged on their Follow lists only. I did not reward 02's chunky grass, blue water or text sign.

**Summary.** Iter 6 is a clean-up iteration, and most of the clean-up landed:
- The ragged khaki belly fringe is gone. The studio belly is true cream (hue 39, sat 0.38, luma 206).
- The clouds are back on the approved M2 code, and the M2 re-shoot matches the final.
- The canopy dither is weaker.
- The studio core is a little cooler.

**But nothing that holds the gate back has changed.** At the focal point of every play frame:
- **Belly:** it is a flat, unshaded, butter-yellow lozenge stuck on the lower-left of the body. In the 3/4 view it reads as a **lemon slice or cracker he is holding**, not a tummy.
- **Lighting:** he is still flat-lit felt. The body spans about 24 luma from sun side to shade side.
- **Face:** it still runs off the left edge of the silhouette.
- **Jump:** he still stands on the lagoon frosting rim.
- **Lighthouse:** its glowing donut is still cropped in two of the three play shots.

**Against the M3 final,** the studio belly is now a wide, flat, low pad with no dome shading (a span of 7 luma, against about 40 in M3). It sits under a band of plain coral rather than tucked under the smile. That is a visible loss of form against the approved asset.

The gate mean is about 6.9 (5.9, 6.6, 6.6, 6.8, 6.7, now 6.9). The bar is 9.0.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m4-walk-strip (still + strip) | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 8 | 6 | 7 | 7 | 6.9 |
| m4-jump-apex | 7 | 6 | 7 | 6 | 7 | 6 | 7 | 8 | 6 | 7 | – | 6.7 |
| m4-touch-ui (hero) | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 8 | 7 | 7 | – | 7.0 |
| gallery-glazey-belly | 7 | 7 | 7 | 7 | 7 | 6 | 8 | 6 | 7 | 7 | – | 6.9 |
| gallery-glazey-belly_strip (turntable) | 7 | 7 | 7 | 7 | 7 | 6 | 8 | 6 | 7 | 7 | – | 6.9 |

- **Gate mean:** about 6.9. The bar is 9.0.
- **Minimum:** 6. The bar is at least 8 in every category.
- **No category reaches 8 except** detail in the play shots and voxel density in the studio.

**Plateau (§5): still on.** The mean went 6.8 → 6.7 → 6.9, a gain of +0.1 over two iterations. Iter 5's structural change was the camera, and iter 6 was parameter work. The next iteration must make a **structural change to Glazey's play-mode presentation**:
- a re-authored belly as a real modelled swell in the body SDF, not a face-layer decal,
- a hero lighting model with a real terminator, and
- a face that wraps the 3/4 form.

More scalar tweaks to `selfLight` or `heroRim` will not move this.

## Blockers
- **[gallery-glazey-belly, all play shots] Belly form against `shots/M3/final/gallery-glazey-belly` (pass bar §4.5).** This one is narrower than iter 5's, but still visible side by side.
  - **What iter 6 fixed:** the colour and the edge. They now match or beat M3.
  - **What still regressed, the form:**
    - **M3 stage 5:** a domed oval with visible contour shading, from luma 161 at the lower left (1720,590) to 201 at the upper right (1810,590). It is tucked directly under the smile and reads as a convex tummy, as on sheet 03.
    - **Iter 6 stage 4:** a flat pad with no shading, luma 206 at (1010,850) and 199 at (1590,860), a span of about 7.
      - It is wider than tall, about 215 x 80 px at (905-1120, 820-900).
      - It sits about 45 px of plain coral below the mouth.
      - It covers only about 13 % of the front silhouette. M3 and sheet 03 are 30-40 %.
      - It reads as a sticker or bib.
  - **Cause:** `glazey.ts` `faceLayout`, about l.436-450:
    - `slope: [..., belly.slope[1] - 0.4]` tilts the whole patch toward the sky, which flattens the dome's shading.
    - `facing: 0.08` lets the patch wrap onto the side in 3/4. That causes the lemon-slice look in play.
  - **Rule:** this is shared content that is visibly worse than a passed final, so it is a blocker.

There are no art bible §10 instant-fail items:
- No acne, no holes, no z-fighting and no debug overlays.
- Near grass voxels are about 8 px.
- No blown or crushed values outside the intentional eye ink.

## Fix list (priority order; max 10; each concrete and testable)
1. **Model the belly as a tummy (blocker, structural).**
   - **Where:** `src/art/models/glazey.ts` `faceLayout`, about l.355-450 (`bellyTop`, `bellyRx`, `dome(..., 0.3, 0.6)`, `slope - 0.4`, `facing: 0.08`). The better fix is to make the belly a real +1-2 voxel swell in the body SDF, so it shades and silhouettes like geometry instead of a face-layer patch.
   - **Target, studio:**
     - An upright oval covering 30-40 % of the front, starting no more than about 1 face voxel under the smile.
     - Convex shading of at least 25 luma from the lower shadow side to the upper sun side, as M3 final had.
     - Keep the clean edge and the cream colour (hue 38-42, sat ≥ 0.30).
   - **Target, play 3/4 view:**
     - Centred on the body's front axis.
     - It must not reach the silhouette edge on the near side. Today it touches the outline at about (1150, 800) in walk.
     - A lit centre no more than about 30 luma above the lit coral. Today it is +55: 195 against 140.
     - It must read as a tummy, not a held object, at 1x.
2. **Make the jump read as airborne. Fourth time on the list.**
   - **Where:** `src/debug/scenes/m4Play.ts` (the jump stage now reuses `WALK_STAGE`, so he takes off toward the lagoon), the `JUMP_AT` timing, and `ContactShadow.ts`.
   - **Problem:**
     - The soles are at about y 785 in the jump frame, sitting on the pink lagoon rim with sprinkles touching them.
     - Following 70 % of the rise keeps him at the same screen height, so the frame has no height cue.
   - **Target:**
     - A separate jump stage over open lawn or path.
     - At least 40 px of visible ground between the soles and a smaller, softer, offset contact shadow.
     - A stretch pose with feet dangling.
     - Sky or lawn, not the rim wall, directly behind him.
3. **Model Glazey with light in play (structural).**
   - **Where:** `HERO_TUNING` in `src/game/Game.ts` (`selfLight`, `heroRim`, `roughMatte`, `wrap: 0.7`) and the hero path in `Materials.ts`.
   - **Problem:**
     - Lit coral is at luma 145 at (1200,690), shade side at 128 at (1290,760). That is a span of about 20, against a target of at least 50.
     - `wrap: 0.7` plus self-light erases the terminator.
     - No visible warm rim and no sheen survive at 1x.
   - **Target:**
     - At least 50 luma between the sun-side highlight and the core shadow.
     - A thin warm rim on the sun side.
     - A soft spec sheen on the upper body.
     - He should read as a lit candy figure, like the touch-button icon already does.
4. **Centre the face on the 3/4 form.**
   - **Where:** the face projection and placement in `glazey.ts` `faceLayout`, or the play camera yaw offset (`stage(112, 0.3, 28)` in `m4Play.ts`).
   - **Problem:** the left eye touches the silhouette at about (1140, 650) in walk and (1120, 600) in jump. The face looks pasted on the edge, and the blush and mouth wrap off the form.
   - **Target:** every face feature at least 15 % of the body width inside the outline in all play shots.
5. **Keep the lighthouse's glowing donut in frame.**
   - **Where:** `FollowCamera.ts` `CAM.aimHeight` and `pitch`, and the stage choice. Raising `aimHeight` to 1.3 did not do it.
   - **Problem:**
     - In walk and touch, only the bottom sliver of the donut is visible at y 0-10.
     - In jump, the donut is clipped by the top edge at (970-1045, 0-5).
   - **Target:** the whole lighthouse, glowing donut included, at least 40 px below the top edge in all three play shots. It is a Follow item for references 01 and 02.
6. **Clean up the pink canopy.**
   - **Where:** `src/art/models/sprinkleTree.ts` `res > 1` branch, plus the tree placement in the play stage.
   - **Problem:**
     - The dither band is weaker but still visible. There are two-tone pinholes across about y 450-560 in walk, and a second band at about y 330-380.
     - The lit side is at luma 117 at (500,300). The target is at least 130.
     - The tree still fills about 12 % of the frame. With the cropped green tree it walls off the left 40 % of the upper frame and competes with Glazey for attention.
   - **Target:**
     - A smooth shaded gradient with no salt-and-pepper texture in a 2x crop.
     - Lit side at least 130.
     - No single foreground tree over about 10 % of the frame.
7. **Read the milk as milk. Not addressed since iter 3.**
   - **Where:** `src/engine/render/Water.ts`.
   - **Problem:** it still has a pink-satin cast with long magenta and yellow streaks, for example (600-1000, 560-640) in walk and (700-950, 640-760) in jump. They read as oil-on-water.
   - **Target:** a cream-white body, broad soft specular, a depth tint at the drip wall, and pink limited to soft wall reflections.
8. **Studio cool core: nearly there.**
   - **Where:** `gallery.ts` (`fill: 1.0`, `bounce: 0.12`) and `studio.ts`.
   - **Problem:**
     - The shadow side is hue 2-3, sat 0.46-0.49, at (900,640), (1420,700) and (330,620).
     - The lit side is hue 12-13, sat 0.52-0.55.
     - The stub arm tips go muddy brown-red, for example luma 79 and sat 0.64 at (1225,760) on stage 4.
   - **Target:**
     - A shadow-side hue of 0 or below (rose-lilac), with sat at least 0.08 below the lit side.
     - No arm tip darker than about luma 100 or more saturated than the body.
9. **Clouds in the play view.**
   - **Where:** `smallProps.ts` `buildCloud`, which now matches M2 (good), plus the play-mode cloud scale and placement.
   - **Problem:** at the play camera the clouds are close and in focus. They read as flat slabs with a hard, ragged lilac skirt, for example (1130-1390, 70-100) in walk. The M2 hero frame reads them as rounded puffs.
   - **Target:**
     - Puffier, rounder play clouds, with more vertical lobes and fewer pancakes.
     - A shaded underside that turns through lighting and AO, with no ragged colour step in a 4x crop.
     - Do not change the M2 output.
10. **Studio row spacing.**
    - **Where:** `gallery.ts` rig positions.
    - **Problem:** the stage 3 tuft, at about (377-500, 487-565), still abuts stage 0's feet and arm. The gap is under about 10 px.
    - **Target:** at least 20 px of clear backdrop between every figure, by staggering the columns or adding depth.

## What is working (keep it)
- **The studio belly's colour and edge:** clean, true cream, with no dither fringe. This was the iter 5 blocker, and it is fixed at the colour level.
- **The clouds** are back on the approved M2 code. The M2 re-shoot shows no regression.
- **The look-ahead camera:**
  - Glazey sits on the right third with lead room.
  - The ring, lagoon, pier and lighthouse layer behind him.
  - The ground grass is warm and fine-grained.
- **The face:** big warm eyes with crisp 2-tone glints, an open smile, blush, and the clean 5-stripe tuft. The coral back view stays consistent.
- **The touch UI:**
  - The candy buttons and the donut joystick are well made.
  - The jump icon is the most charming Glazey in the build: a centred belly, lit form, a hop pose and a floor shadow.
  - Use it as the target for the in-world Glazey.
- **The walk:** visible bob, lean and arm swing. The dust colours are now dough and butter, though they do not read clearly in the stills.

## Store-page test: no
The touch-ui hero frame is composed reasonably: Glazey is on a third, with the ring and lighthouse behind him. But the subject lets it down:
- His belly reads as a lemon slice stuck to his side.
- He is lit like flat felt.
- His face slides off the edge of his body.
- The lighthouse's signature glowing donut is cropped away.
- The left 40 % of the upper frame is two oversized canopies.

It is a pleasant 7/10 indie frame. It would not hold up next to reference 02's warm, modelled hero or the year's best voxel art.

## Previous review (M4-iter5): status of the fix list
| # | item | status |
|---|---|---|
| 1 | Re-author the belly (blocker) | **Partly fixed.** The dither is gone and the colour is true cream (hue 39, sat 0.38, luma 206): met. Coverage is about 13 % against 35-45 %: not met. Convex shading is about 7 luma against at least 20: not met. The play belly is +55 luma over the coral against at most 30, and sits off-axis: not met. |
| 2 | Jump reads as airborne | **Not fixed.** He still stands on the lagoon rim. |
| 3 | Model the form with light, and centre the face | **Not fixed.** The body span is about 20 luma, there is no visible rim or sheen at 1x, and the left eye is still on the outline. |
| 4 | Studio cool core | **Partly fixed.** Shadow hue went from 7 to 2-3. The sat delta is 0.03-0.08, against a target of hue at or below 0 and a delta of 0.08. |
| 5 | Lighthouse donut in frame | **Partly fixed.** It is almost whole in jump, though still clipped at the top. Walk and touch are still cropped. |
| 6 | Pink canopy | **Partly fixed.** The dither is weaker but still visible. The lit side is 117 against the 130 target, and the tree is still about 12 % of the frame. |
| 7 | Cloud band, and the M2 risk | **Partly fixed.** It is reverted to the M2 code, and the M2 re-shoot matches the final. The play-view clouds still show a hard lilac skirt. |
| 8 | Warm dust | **Addressed in code** (butter, golden dough and cream). It does not read clearly in the stills, so I cannot verify the arc or placement. |
| 9 | Milk reads as milk | **Not fixed.** |
| 10 | Studio composition | **Partly fixed.** The rows are 0.4 m further apart, but the stage 3 tuft still abuts stage 0. |

## Regression check
- **M3 (`shots/M3/final/gallery-glazey-belly`): REGRESSION in belly form, blocker** (see Blockers).
  - Colour and edge are at or above M3.
  - The dome shading, size and placement are below it.
  - The eye whites and glints are fine. M3's iris had a glossier environment streak, and iter 6's iris shows a little ragged dark speckle at the lower left (studio stage 4, about (930,700)). That is minor, but worth restoring.
- **M2 (`shots/M2/final/m2-hero`, `m2-ground`): no regression.**
  - I re-shot both at this commit in `shots/M2/m4i6reg/`.
  - The mean absolute difference over all channels is 4.5 for hero and 3.0 for ground. The differing pixels are milk ripple and sprinkle-glint animation.
  - The cloud crops are visually identical to the final. `buildCloud` is back on the approved two-tone code, and `cloudMid` is removed.
- **M0, M1 and other M3 content: no regression found.**
  - The iter 5→6 diff touches:
    - Glazey-only code: `glazey.ts`, the gallery Glazey scene, and `HERO_TUNING`.
    - The `res > 1` play-only sprinkle-tree branch.
    - An opt-in `bounce` parameter in `studio.ts` (default 0.4, unchanged).
    - Play-only FX colours and camera.
  - None of these reach the M0, M1, M2 or M3 default paths.

```json
{"gate":"M4","iter":6,"verdict":"FAIL","mean":6.9,"min":6,"blockers":1,"store_page":false}
```
