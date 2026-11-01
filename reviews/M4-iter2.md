# Review M4 iter 2
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M4 --iter 2` at commit `2645a49`, with a clean working tree. The harness used the GPU path (ANGLE Metal, Apple M4) and wrote 16 files to `shots/M4/2/`. `harness.json` reports `ok: true` with an empty log.

What I looked at:
- Every 1920x1080 and 844x390 frame, both strip composites, and each strip frame (f0-f2).
- 2x nearest-neighbour crops of:
  - Glazey in walk f0/f1/f2 side by side, and at the jump apex;
  - the near frosting rim (lower right);
  - the near meadow (lower left);
  - the foreground sprinkle-tree canopies (upper left);
  - the lagoon and its glare;
  - the joystick and the jump button.
- 5x5 pixel means on Glazey, the grass, the rim, the sky, the lagoon glare, and the studio lit and shaded sides.

Beforehand I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4 and `art/reference/NOTES.md`, and viewed all four references. 03 (Glazey sheet) is primary for Glazey. 01 and 02 (mood, camera and scale only) are primary for the gameplay shots.

**Summary.** This is a big step up from iter 1:
- The detail-patch seam is gone.
- The meadow is now true micro-grass with tiny flowers.
- The camera is lower and closer, and Glazey stands about 25 % of frame height.
- Glazey now separates from the grass in value.
- The touch UI is real candy UI.
- The studio lineup fills the frame.

The gameplay frames are still a long way from store-page quality, for four reasons:
- **Lego-mosaic trees.** At this closer camera the sprinkle-tree canopies show 1/32 m voxels at about 10-12 px and 3-voxel sprinkles at 30-40 px. They are the largest, busiest objects in the frame.
- **A dead sky.** The sky is a flat beige fill with no gradient and no clouds.
- **A "duck bill" belly.** From the gameplay angle Glazey's belly still reads as a flat cream crescent jutting out under his mouth.
- **Weak jump cues.** The jump still has no ground shadow you can read, and the dust is grey sugar cubes.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m4-walk-strip (still + strip) | 7 | 6 | 6 | 7 | 6 | 6 | 5 | 7 | 7 | 6 | 6 | 6.3 |
| m4-jump-apex | 7 | 6 | 6 | 6 | 6 | 6 | 5 | 7 | 7 | 6 | – | 6.2 |
| m4-touch-ui | 7 | 6 | 6 | 7 | 6 | 6 | 5 | 7 | 7 | 6 | – | 6.3 |
| gallery-glazey-belly | 7 | 8 | 7 | 7 | 7 | 6 | 8 | 6 | 8 | 8 | – | 7.2 |
| gallery-glazey-belly_strip (turntable) | 7 | 7 | 7 | 7 | 7 | 6 | 8 | 6 | 7 | 7 | – | 6.9 |

- **Gate mean:** about 6.6 (iter 1 was 5.9), against a bar of 9.0.
- **Minimum:** 5 (voxel density in all three gameplay shots).

## Blockers
- **[m4-walk-strip, m4-jump-apex, m4-touch-ui] Lego-scale voxels on the foreground sprinkle trees at the default gameplay camera (art bible §3 density rule of about 6 px for props; §10.2).**
  - **Pink tree, upper left (about x 80-560, y 100-580 in the walk still):** individual canopy voxels are about 10-12 px. They show as a hard pink/rose checker mosaic.
  - **Its sprinkle band:** 30-40 px bricks, stacked into a ragged horizontal stripe from about (100,250) to (550,330).
  - **Green trees:** the same bricks on the upper-left canopy (0-260, 0-400) and the right-hand canopy (1570-1920, 50-470).
  - **Why it matters:** these are the largest objects in the frame and they read exactly like Minecraft. They also pull the eye away from Glazey.
  - **Source:** `src/art/models/sprinkleTree.ts` builds at 1/32 m (`TREE_SIZE` 100x132x100). The inlaid 3-voxel sprinkle rows come from the "recolor three exposed crown voxels" block (about line 147).
  - **Context:** in iter 1 this was hidden because the camera was further away. It is newly exposed, but it is the default play view.

## Fix list (priority order; max 10; each concrete and testable)
1. **Fix the sprinkle-tree density at the gameplay camera (blocker).**
   - **Where:** `sprinkleTree.ts`, plus the tree placement near the play path in `MeadowDiorama.ts` and `meadowLayout.ts`.
   - **Fix:** re-voxelize the canopies at 1/64 m, or use a 1/64 m near-LOD within about 12 m of the camera. Replace the inlaid 3-voxel stripe rows with scattered 1x1x3 sprinkle capsules at 1/64 m, randomly oriented as in reference 01. Cut the per-voxel value jitter on the crown so the surface reads as a soft frosted ball, not a checkerboard.
   - **Target:** no canopy voxel over 6 px and no sprinkle over 12 px at 1080p in any gameplay frame. Sprinkles are scattered rather than banded. The pink tree reads as a smooth rounded ball at 844x390.
2. **Give the gameplay shots a real sky (art bible §6 atmosphere: "pastel sky ... puffy voxel clouds").**
   - **Problem:** the whole top band of every gameplay frame is a flat peach fill: (960,30) is hue 28, luma 207, and (1500,150) is hue 26, luma 211. There is no gradient, no cool zenith and no clouds. It reads as an unrendered backdrop and kills depth. The M2 hero sky had a lilac-to-peach gradient and clouds.
   - **Where:** the sky, fog and clouds setup used by `Game.ts` and `m4Play.ts`.
   - **Target:**
     - A vertical gradient from about `#A8D8FF`/lilac at the top to a warm peach horizon glow.
     - At least 2-3 fine-voxel clouds visible in the gameplay frame.
     - Fog tinting the far rim slightly toward the sky.
     - No banding.
3. **Make the belly read as a tummy, not a beak, from the 3/4 gameplay view.**
   - **Problem:**
     - In all walk frames, the jump and the touch shot, the belly is a cream crescent at Glazey's lower left, about (860-940, 715-760). It sits directly under the open mouth and pokes past the body outline, so it reads as a duck bill or lower jaw.
     - In the studio it is still a flat bib with no swell or rim AO.
     - In side view (turntable f1) it is a thin sliver.
   - **Where:** the belly patch and the `bellyBulge` SDF in `src/art/models/glazey.ts`.
   - **Target:**
     - The belly wraps the front of the lower body as a gentle 1-2 voxel swell with soft occlusion at its rim.
     - Its top edge sits well below the mouth, with at least 4-5 voxels of coral between them.
     - In the 3/4 view it follows the body curve instead of jutting out.
     - In profile it bulges past the body line, as on sheet 03 "SIDE".
4. **Make the jump read as airborne.**
   - **Where:** `src/game/fx/ContactShadow.ts`, `src/game/fx/VoxelParticles.ts`, `GlazeyAnimator.ts`, and the scripted pose in `m4Play.ts`.
   - **Problem:**
     - At the apex, the area under Glazey (about 830-990, 680-780) holds a frosted donut, and no blob shadow is legible on the grass. The eye reads him as standing behind the donut, not jumping over it.
     - The take-off dust (about 980-1110, 760-930) is 10-20 px unlit grey-white cubes that look like scattered sugar cubes or litter.
     - The arms are not raised.
   - **Target:**
     - A clearly visible soft dark ellipse on the ground directly below him (at least 25 luma darker than the surrounding grass), not occluded by a prop in the hero frame.
     - Cream dust puffs that are warm-lit, smaller (at most 8 px), clustered at the take-off point and visibly arcing.
     - Arms up and feet tucked at the apex.
5. **Finish the walk cycle (rubric 11).**
   - **What changed:** f0 and f2 now show a squat contact pose and f1 a taller pass pose with a lifted foot. That is real progress.
   - **Still missing:**
     - Arm swing: the arms are hidden behind the body in all three frames.
     - Footfall dust: none in any frame.
     - Tuft lag: barely changes.
   - **Where:** the `ANIM` constants in `GlazeyAnimator.ts`, and footfall emission in `VoxelParticles.ts`.
   - **Target:**
     - A visible counter-swinging arm silhouette in at least two frames.
     - A small cream puff at the planted foot in the contact frames.
     - A tuft lean that differs by at least 10° between contact and pass.
6. **Fix the frame's value hierarchy and grade.**
   - **Problem:**
     - Glazey (luma about 150) is now 45 above the grass (about 105), which is good.
     - But the foreground frosting rim (lower right, luma about 185) is brighter than him.
     - The milk glare beside the pink tree trunk (about 400-560, 545-580) is near-clipped at 252/245/237, which is §10.7 blown white territory.
     - The grass is a hazy desaturated sage (hue about 126-136) under a milky veil, so the frame lacks the warm-light, cool-shadow grade (§6).
   - **Where:** the lagoon specular and bloom threshold, the post grade, and the grass palette entries in `palette.ts`.
   - **Target:**
     - Lagoon highlights at most about 240 luma, with no flat white smear.
     - The foreground rim darkened or vignetted below Glazey's midtone.
     - Grass a richer, warmer meadow green with cooler, bluer shadow pockets.
     - Glazey the highest-contrast element in grayscale.
7. **Hide the near-terrain terracing under the grass.**
   - **Problem:** in the lower-left meadow (about 300-700, 880-1080) the 1/8 m terrain under the grass shows clear stair-step terraces, each step about 15-20 px wide. They read as blocky ridges through the grass.
   - **Where:** `IslandTerrain.ts` surface smoothing and normals under micro-decor, and the density in `MicroDecor.ts`.
   - **Target:** a near meadow that reads as a smooth rolling surface, with no visible step lines within 10 m of the camera.
8. **Recompose the gameplay frame.**
   - **Problem:**
     - Glazey sits dead centre (x about 950).
     - The lighthouse is chopped by the top edge.
     - Two big canopies crowd the left third.
     - The lower-right rim takes about 20 % of the frame.
   - **Where:** `FollowCamera.ts` (offset and pitch) and the `m4Play.ts` spawn and heading.
   - **Target:**
     - Glazey on a vertical third, with headroom.
     - The lighthouse or bakery fully in frame as a backdrop landmark.
     - Foreground rim at most 15 %.
     - No canopy covering more than about 15 % of the frame.
9. **Make the studio core shadow cool.**
   - **Problem:** the form split is fixed: 32-46 luma, for example (1460,330) is luma 134 and (1700,330) is luma 166. But the shaded side is hue 9-10 against hue 12-13 on the lit side. It is redder, not cooler, so there is still no lilac core (§6 "cool shadows").
   - **Where:** `studio.ts` (the fill colour and the new `fill` option) and the `hueHold` setting for Glazey.
   - **Target:** a shadow-side hue visibly shifted toward rose or lilac (hue 0-5 or below, with lower saturation) while the lit side stays coral.
10. **Touch UI polish.**
    - **What is good:** both controls now read on any background.
    - **Remaining problems:**
      - The joystick has no visible soft drop shadow, only a thin offset pink lip.
      - The knob rests at the top-right edge of the base. If that is the deflected state, fine. The rest pose must be centred.
      - The jump icon is a static front portrait of Glazey, so it doesn't say "jump".
    - **Where:** `src/ui/TouchControls.ts` and `src/ui/voxelIcon.ts`.
    - **Target:**
      - A soft 6-10 px blurred drop shadow under both controls.
      - The jump icon shows Glazey mid-hop: stretched, arms up, with motion lines or a little dust puff under his feet.

## What is working (keep it)
- **The detail-patch seam is completely gone.** The meadow is island-wide micro-grass with tiny flowers. This is what NOTES-02 asked for instead of chunky grass.
- **The near frosting rim** has much finer sprinkles (about 8-15 px at the very nearest edge) and soft relief.
- **The camera is lower and closer,** as in reference 02. Glazey is about 25 % of frame height.
- **Glazey separates from the grass** in value.
- **The SDF body is plush and smooth,** with the checker largely gone. The eyes have warm brown gradients and white glints.
- **The tuft** is crisp and joyful.
- **The walk** now shows a squash/stretch difference.
- **Tree shadows on the path, the frosting-drip lagoon wall and the pier** all read well.
- **The touch UI:** an opaque cream joystick base with a candy rim and a voxel donut knob, and a bevelled jump button with a cream rim and a voxel-rendered icon.
- **The studio:** the two-row lineup now fills about 18-82 % of frame height. The backdrop corner sits at hue 22, luma 191. The six belly stages and the stage-5 bliss face are clearly distinct.

## Store-page test: no
The touch-ui hero frame would not go on a premium store page:
- The two biggest objects in it are Lego-mosaic tree balls.
- The sky is a flat beige fill.
- The milk has a blown glare smear.
- Glazey's belly reads as a beak from this angle.

The composition now has a subject and a sense of place. The surface quality around him does not yet hold up next to the best indie games of the year.

## Previous review (M4-iter1): status of the fix list
| # | item | status |
|---|---|---|
| 1 | Detail-patch seam and Lego near terrain | **Mostly fixed.** The seam is gone and the grass is micro. Terraces still show under the grass (new item 7). Lego trees are newly exposed (blocker). |
| 2 | Glazey strongest value | **Partly fixed.** He is 45 luma above the grass. The rim and milk glare are brighter (item 6). |
| 3 | Reframe the camera | **Mostly fixed.** The size is right. He is still centred, the lighthouse is clipped, and the rim takes about 20 % (item 8). |
| 4 | Jump readability | **Partly fixed.** `ContactShadow` was added but is not legible in the shot. The dust reads as grey cubes. The arms are not raised. |
| 5 | Walk amplitude | **Partly fixed.** Squash and stretch are visible. There is no arm swing and no footfall dust. |
| 6 | Candy touch UI | **Mostly fixed.** The drop shadow is weak, and the icon semantics are unclear (item 10). |
| 7 | Belly swell and gameplay read | **Not fixed.** It is still a flat crescent and reads as a duck bill in 3/4 view. |
| 8 | Skin checker, seams, eyes | **Mostly fixed.** The checker is largely gone and the eyes are softer. I saw no tuft crease at gameplay scale. |
| 9 | Studio light split, cool core, backdrop | **Partly fixed.** The split (32-46) and the backdrop are fixed. The core is still not cool. |
| 10 | Studio composition | **Fixed.** |

## Regression check
- **Shared code changed since M3 final:** `Materials.ts` and `VoxelObject.ts`.
  - **`Materials.ts`:** the new `selfLight` and `heroRim` default to 0.
  - **`VoxelObject.ts`:** the AO drop applies only to `normalField` parts, and `normalField` is null by default.
  - **`IslandTerrain.ts`:** `blades` defaults to on.
  - **`studio.ts`:** `fill` defaults to the old 1.1.
- **Effect on passed gates:** the default paths for M0-M2 terrain and props, and for the M3 donut and props galleries, are unchanged by construction.
- **Visual comparison:** the island assets in the gameplay frames (lagoon wall drips, pier, lighthouse, donuts) match `shots/M2/final/m2-hero` in palette and light direction.
- **Glazey against `shots/M3/final/gallery-glazey-belly`:** better form and composition, and no drop.
- **Result: no regression.**
- **Not a regression:** the gameplay sky lacks the M2 gradient and clouds because of what the low camera sees, not a change in shared code. It is listed under item 2.

```json
{"gate":"M4","iter":2,"verdict":"FAIL","mean":6.6,"min":5,"blockers":1,"store_page":false}
```
