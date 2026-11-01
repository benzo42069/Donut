# Review M4 iter 1
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M4 --iter 1` at commit `c629840`, with a clean working tree. The harness used the GPU path (ANGLE Metal, Apple M4) and wrote 16 files to `shots/M4/1/`. `harness.json` reports `ok: true` with an empty log.

What I looked at:
- Every 1920x1080 and 844x390 frame, both strip composites, and each strip frame (f0-f2).
- 2-3x nearest-neighbour crops of:
  - Glazey in walk f0/f1/f2, the jump apex and the touch shot;
  - the joystick and the jump button;
  - the near frosting rim (the lower-left sprinkles and the raised slab edge);
  - the grass seam at the left;
  - the lagoon;
  - gallery stages 0-1 and 4-5, and the side (f1) and back (f2) turntable rows.
- 5x5 pixel means on Glazey (lit and shaded), the grass around him, and the backdrop corners.
- A grayscale conversion of the walk still.

Beforehand I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4 and `art/reference/NOTES.md`, and viewed all four references. 03 (Glazey sheet) is primary for Glazey. 01 and 02 (mood, camera and scale only) are primary for the gameplay shots.

**Summary.** The new Glazey rig is a real step forward in the studio:
- The belly is an oval with a rounded bottom.
- There are two distinct feet and short arm stubs.
- The eyes now match.
- The belly stages grow clearly.

The three gameplay shots, though, are far from the bar:
- The camera is high and distant, so Glazey takes about 18 % of frame height and is lost in grass of the same value.
- A raised rectangular "detail patch" slab shows as a hard seam in the frosting rim and the grass.
- Outside that patch the near terrain is Lego-scale: brick sprinkles and chunky grass cubes.
- The jump has no ground cue, so it barely reads as a jump.
- The motion amplitudes are too timid to show squash and stretch in the strip.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m4-walk-strip (still + strip) | 6 | 5 | 6 | 6 | 6 | 6 | 5 | 7 | 7 | 4 | 5 | 5.2 |
| m4-jump-apex | 6 | 5 | 6 | 5 | 6 | 6 | 5 | 7 | 7 | 4 | – | 5.7 |
| m4-touch-ui | 6 | 5 | 6 | 6 | 6 | 6 | 5 | 7 | 7 | 4 | – | 5.8 |
| gallery-glazey-belly | 7 | 6 | 6 | 6 | 7 | 6 | 7 | 6 | 8 | 7 | – | 6.6 |
| gallery-glazey-belly_strip (turntable) | 7 | 6 | 6 | 6 | 7 | 6 | 7 | 6 | 7 | 6 | – | 6.4 |

- **Gate mean:** about 5.9, against a bar of 9.0.
- **Minimum:** 4 (technical cleanliness in all three gameplay shots).
- **Categories at 8 or above:** one, Glazey's charm in the gallery still.

## Blockers
- **[m4-walk-strip, m4-jump-apex, m4-touch-ui] Visible detail-patch seam (art bible §10.1 mesh discontinuity; §3 "LOD must never be visibly chunky in a shot").**
  - **Frosting rim:** a raised rectangular slab runs from about (575,650) to (1700,1000) in the walk still. Its hard stepped edges are visible:
    - the left edge at x 575-615, y 880-1000;
    - the far edge at about (1500-1700, 620-760).
  - Inside the slab, the sprinkles are 2-3 px. Outside it, they are 25-30 px bricks.
  - **Grass:** a hard, un-feathered boundary runs at about x 380-460, y 560-760. It separates fine macro grass on the right from chunky cubes of 10-15 px on the left.
  - The same seam is in every frame of the strip and in the 844x390 frames.
  - **Source:** the `walkDetail()` patches in `src/debug/scenes/m4Play.ts`, and `buildMacro` and the `FEATHER` blend in `src/game/world/IslandTerrain.ts`.
- **[m4-walk-strip, m4-jump-apex, m4-touch-ui] Lego-scale near terrain at the default gameplay camera (§10.2, §3 density rule).**
  - The frosting sprinkles at lower left (x 0-570, y 870-1080) are 25-30 px long and 8-10 px thick, like Lego bricks.
  - The grass cubes at left (x 0-460, y 580-900) are 10-15 px. That is chunky Minecraft grass, which is exactly the NOTES-02 "Ignore" item.
  - This is the camera the player will see all game.

## Fix list (priority order; max 10; each concrete and testable)
1. **Remove the detail-patch seam and the Lego-scale near terrain (blocker).**
   - **Where:** `IslandTerrain.ts` (`buildMacro`, `detailDepth` and `FEATHER`) and `m4Play.ts` (`walkDetail`). In real play the patch must follow the camera, not a scripted line.
   - **Target:**
     - Macro resolution covers every terrain surface within about 15 m of the gameplay camera.
     - The transition is height-continuous, with no step or slab edge, and feathered over at least 1 m.
     - The sprinkle size is constant across it.
     - No terrain voxel or sprinkle is over 12 px at 1080p anywhere in the three gameplay frames.
2. **Make Glazey the strongest value in the gameplay frame.**
   - **Problem:** in grayscale (walk still), Glazey's coral is luma 102-132, for example (940,560) = 103 and (1040,560) = 132. The grass around him is luma 88-94, at (900,700), (1000,700) and (1100,700). Only his eyes and belly survive in grayscale (art bible §4, value structure).
   - **Where:** the character material and rig lighting (`GlazeyRig.ts`, the voxel material tuning), or the grass value near the player.
   - **Target:**
     - A warm fresnel rim on the character, or a lighter coral body under the gameplay grade.
     - A slightly darker, less saturated grass under the player.
     - At least 40 luma between Glazey's midtone and the ground ring around him, and his silhouette readable in grayscale at 844x390.
3. **Reframe the gameplay camera.**
   - **Where:** the follow distance, height and pitch in `src/game/camera/FollowCamera.ts`.
   - **Problem:** Glazey is about 190 px tall (18 % of the frame) at dead centre. The flat pink rim takes the bottom 30 % of the frame, and the sky is a thin beige strip.
   - **Target:**
     - A lower, closer third-person view in the spirit of reference 02, keeping its camera and mood but not its chunky grass.
     - Glazey 25-30 % of frame height, placed on a third.
     - The lagoon or bakery as a readable backdrop, with a pastel sky band of at least 15 % in the top of the frame.
     - The foreground rim no more than 15 %.
4. **Make the jump read at the apex.**
   - **Where:** a contact shadow (in `Game.ts`/`GlazeyRig.ts`), the jump pose in `GlazeyAnimator.ts`, and the dust in `src/game/fx/VoxelParticles.ts`.
   - **Problem:**
     - At the apex there is no shadow or ground cue under Glazey, so the ground at (900-1000, 600-700) is the same luma as the grass around it. He reads as standing further back, not airborne.
     - The take-off dust at (830-960, 620-700) is grey-lilac specks that look like litter on the grass.
     - The pose is near-neutral: the arms are barely raised and the feet are not tucked.
   - **Target:**
     - A soft, darkened blob shadow directly below the player that shrinks and fades with height.
     - Arms up and feet tucked at the apex, with a clear stretch on the rise.
     - Cream or sugar-coloured dust puffs, bright and slightly emissive, that arc and fade.
5. **Increase the walk-cycle amplitude so the strip shows squash and stretch (rubric 11).**
   - **Where:** the `ANIM` constants in `GlazeyAnimator.ts` (`bob: 0.045`, the squash target and the arm swing).
   - **Problem:** f0, f1 and f2 differ mainly by a small lean and one lifted foot. The squash at the contact and the stretch on the pass are not visible at strip scale. No dust is legible.
   - **Target:**
     - At least an 8 % body-height difference between the contact (squash) and pass (stretch) frames.
     - Visible counter-swinging arms.
     - A tuft lag you can see.
     - A small cream dust puff at each footfall.
6. **Rework the touch controls into candy UI (art bible §9).**
   - **Where:** `src/ui/TouchControls.ts` and `src/ui/touchIcons.ts`.
   - **Problem:**
     - The joystick base (100-330, 790-1015) is a thin pink ring with a mostly transparent fill over pink frosting, so it nearly disappears.
     - Neither control has a soft drop shadow.
     - The jump button (1640-1810, 830-1010) is pink on pink drips.
     - Its icon is a generic off-white arrow, and the right diagonal bevel is stair-stepped at 2x.
   - **Target:**
     - An opaque cream or butter stick base with a darker candy rim and a soft drop shadow, and the donut knob kept.
     - A jump button with a contrasting rim and drop shadow.
     - A voxel-rendered icon in the game's style (for example a little Glazey hop or a spring) with clean edges.
     - Both controls readable on pink, green and milk backgrounds.
7. **Make the belly a raised swell, not a decal, and fix how it reads at the gameplay angle.**
   - **Where:** the belly patch and the `bellyBulge` SDF in `src/art/models/glazey.ts`.
   - **Problem:**
     - In the gallery the belly is now a good oval, but it is a flat colour patch with no rim AO or swell.
     - In the side view (turntable f1) it is a thin sliver that does not bulge past the body line.
     - From the high 3/4 gameplay camera (walk f0, about (930-1060, 610-660)), it reads as a pale crescent under the mouth, like a duck bill or lower jaw.
   - **Target:**
     - A belly that bulges 1-2 voxels with soft AO at its rim.
     - In profile, it pushes past the body line as on sheet 03 "SIDE".
     - Its top edge sits high enough to read as a tummy from the 3/4 gameplay view.
8. **Clean up the skin, seams and eyes.**
   - **Where:** the jitter and part seams in `glazey.ts` and `GlazeyRig.ts`.
   - **Problems:**
     - A light/dark square checker on the coral is plainly visible at 2x, especially in the back view (turntable f2) and in the walk crops.
     - A dark crease runs down from the tuft base at the top of the head (jump apex near (960,387); gallery back view near (1390,410)).
     - The stage-4 right arm tip has a dark notch in the back view, near (1565,550).
     - The eyes still have a lighter lower-iris band with a stair-stepped boundary at 2x.
     - The stage-5 profile eye is still a black sliver standing proud of the silhouette, near (1875,490) in f1.
   - **Target:**
     - Plush coral with ±3-6 % value noise and no visible squares.
     - No dark seams or tips.
     - A 2-3 voxel soft iris gradient.
     - Face decals that conform to the surface in profile.
9. **Fix the Glazey studio lighting.**
   - **Where:** `studio.ts` and its fill for subjects.
   - **Problem:** the form split fell to about 27 luma: stage 4 shaded (1340,480) is luma 142 and lit (1530,480) is 169. The shaded side is still hot coral (hue 11, against 12 on the lit side), so there is still no cool fill.
   - **Target:**
     - A split of at least 35 luma.
     - A visibly cooler, lilac-leaning core shadow (art bible §6).
     - The backdrop corner (1900,20), now hue 17 and luma 189, within ±4° of hue 25 and luma 180 or more.
10. **Recompose the Glazey gallery.**
    - **Where:** the camera in `buildGlazeyGallery` in `gallery.ts`.
    - **Problem:** the lineup still fills only y 345-660 (about 29 % of the frame), with bare cloth above and below.
    - **Target:**
      - The six figures fill 60-75 % of frame height, for example in a closer camera or a 3+3 two-row layout.
      - Nothing clipped at 844x390.

## What is working (keep it)
- **The Glazey re-author:**
  - The belly is now a true oval with a rounded bottom, with no terrace rings at 2x.
  - There are two distinct stubby feet.
  - The arm stubs sit inside the side silhouette.
  - The six belly stages differ clearly, ending in a convincingly "perfectly round" stage 5.
  - The coral is consistent front, side and back.
- **The eyes now match.** Dropping the mirror gloss fixed the navy-versus-bronze mismatch. The white 2x2 glints and the small twinkles are charming.
- **The face is very appealing:** the open smile with tongue, the two-tone blush and the stage-5 bliss arcs.
- **The rainbow tuft** reads cleanly from every angle and lags nicely in the jump.
- **SDF normals** give Glazey a smooth, plush silhouette with no staircase at gameplay distance.
- **The island backdrop** (bakery, lighthouse, pier, sprinkle trees and lagoon) carries over from M2 unchanged, with warm golden-hour light.

## Store-page test: no
No hero shot of this gate would go on a premium store page:
- In m4-walk-strip, the subject is small, centred and nearly the same value as the grass.
- The bottom third is a flat pink slab with a visible rectangular seam.
- Lego-brick sprinkles fill the lower-left corner.

Glazey himself is close to store-ready in the studio. The in-game presentation is not.

## Previous review: status of the Glazey items (M3-iter8 and M3-iter8-r2)
| source | item | status |
|---|---|---|
| iter8 #2 / r2 #1 | Belly oval (rings, D-shape, size growth) | **Mostly fixed.** It is an oval with a rounded bottom, has no rings, and grows clearly. It is still a flat decal with no swell or rim AO (new item 7). |
| iter8 #2 | Bell skirt, fused feet | **Fixed.** Two distinct feet. |
| iter8 #2 | Side-view nose-like arm | **Fixed.** A short stub inside the outline. |
| iter8 #2 | Side-view belly sliver; stage-5 eye proud of the silhouette | **Not fixed.** |
| r2 #2 | Eyes: mismatched reflections | **Fixed.** |
| r2 #2 | Eyes: hard iris band | **Partly fixed.** The band is still stair-stepped at 2x. |
| r2 #3 | Skin checker and dark arm tip | **Partly fixed.** The silhouette is smoother. The checker and a dark arm tip remain, and the tuft crease is new. |
| iter8 #8 | Cool shadow side | **Not fixed.** The split also dropped from about 46 to about 27 luma. |
| iter8 #9 | Backdrop corner | **Not fixed.** Hue 17, luma 189. |
| iter8 #10 / r2 #6 | Glazey composition | **Not fixed.** Same camera; y 345-660. |

## Regression check
- **Glazey against `shots/M3/final/gallery-glazey-belly`:** better form overall (belly, feet, arms, eyes). There is a small drop in the form split, from about 28 to about 27 luma at the same sample points, plus the new tuft crease. Glazey was not accepted in M3, so this is not a regression of passed content.
- **M0-M2 and the M3 donuts and props:**
  - Since the M3 acceptance (`de4b373`), the diff touches only:
    - `glazey.ts`;
    - the eye entries in `palette.ts` (gloss to smooth);
    - Glazey's gallery scene;
    - an opt-in `normalField` in `VoxelObject.ts`, which is null by default;
    - new game, UI and player files.
  - No terrain, renderer, post, studio or shared-asset code changed.
  - The island in the gameplay frames matches `shots/M2/final/m2-hero` in palette, light direction and assets.
  - **No regression.**
- **New exposure, not a regression:** the near-field chunky grass and brick sprinkles are newly exposed by the gameplay camera, not regressed. They are listed as blockers above because this is now the default play view.

```json
{"gate":"M4","iter":1,"verdict":"FAIL","mean":5.9,"min":4,"blockers":2,"store_page":false}
```
