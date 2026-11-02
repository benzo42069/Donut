# Review M4 iter 3
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M4 --iter 3` at commit `3a6fb2d`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 16 files to `shots/M4/3/`.
- **Viewed:** every 1920x1080 frame, both strip composites and every strip frame.
- **Zoomed crops (2-4x, nearest neighbour):**
  - Glazey in walk f0/f1/f2 side by side, and at the jump apex.
  - The pink and the green foreground canopies.
  - The near frosting rim, the near meadow and the terrain under it.
  - The lagoon, a cloud, the jump contact shadow and dust.
  - The joystick, the jump button, and the studio side view (turntable f1).
- **Sampled:** 5x5 pixel means and a scan for blown highlights (luma ≥ 245).

Beforehand I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4 and `art/reference/NOTES.md`, and viewed all four references.
- **Primary for Glazey:** 03.
- **Primary for the gameplay frames:** 01 and 02, judged on their Follow lists only. I did not reward the chunky grass in 02.

**Summary.** This iteration fixed the three loudest problems of iter 2:
- **Trees:** the canopies are now 1/64 m, so the Lego-mosaic trees are gone.
- **Sky:** it has a real lilac-to-peach gradient with clouds.
- **Milk glare:** the blown smear is gone. Lagoon luma tops out around 208 in the glare region, with only a few specular pixels near 250.

**The new hero frame is still nowhere near store-page quality:**
- **Lower camera:** it now exposes **staircase 1/8 m terrain** under the grass across the bottom third. That is a density-rule blocker.
- **Belly:** it is still a flat, bright cream sticker, not a tummy.
- **Jump shadow:** it is a muddy brown smudge that reads as dirt. Glazey looks perched on the frosting wall, not airborne.
- **Grass:** a cool teal-sage under a milky veil, so the frame lacks golden-hour warmth.
- **Green trees:** generic green blobs with a light sprinkle dusting, not the sprinkle-balls of reference 01.
- **Composition:** Glazey is still dead centre, and the lighthouse is still chopped at the top.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m4-walk-strip (still + strip) | 7 | 6 | 6 | 7 | 6 | 6 | 6 | 7 | 7 | 6 | 7 | 6.5 |
| m4-jump-apex | 7 | 6 | 6 | 6 | 6 | 6 | 6 | 7 | 7 | 6 | – | 6.3 |
| m4-touch-ui (hero) | 7 | 6 | 6 | 7 | 6 | 6 | 6 | 7 | 7 | 6 | – | 6.4 |
| gallery-glazey-belly | 7 | 7 | 7 | 7 | 7 | 6 | 8 | 6 | 7 | 7 | – | 6.9 |
| gallery-glazey-belly_strip (turntable) | 7 | 7 | 7 | 7 | 6 | 6 | 8 | 6 | 7 | 6 | – | 6.7 |

- **Gate mean:** about 6.6, the same as iter 2 (6.6). Iter 1 was 5.9. The bar is 9.0.
- **Minimum:** 6.
- **Plateau warning (§5):** this iteration gained 0.0. If iter 4 also gains less than 0.3, the plateau rule requires a structural change. The likely candidates are the near-terrain representation and the play-mode colour grade.

## Blockers
- **[m4-walk-strip, m4-jump-apex, m4-touch-ui] Stair-stepped near terrain over the 12 px terrain limit (art bible §3 density rule, §10.2 "Lego/Minecraft-scale voxels on near terrain").**
  - **Where:** in the bottom third of every gameplay frame. It is worst in the lower-left and lower-centre meadow (about x 0-1100, y 880-1080 in the walk still), and also right of the path at (1100-1500, 900-1080).
  - **What:** the 1/8 m terrain under the grass shows as clean, hard-edged terrace cubes. In a 4x crop of (380-700, 930-1080) each step face measures **about 15-20 px** at 1080p, with a lit top and a dark riser. That is the Minecraft staircase silhouette §2 forbids. The micro-grass is too sparse and too translucent to hide it.
  - **Why it is a blocker now:** iter 2 listed this as fix item 7. The lower iter 3 camera has made it a large, plainly visible part of the hero frame.
  - **Source:** `src/game/world/IslandTerrain.ts` (meshing and normals of the near surface) and `src/game/world/MicroDecor.ts` (blade density and opacity).

## Fix list (priority order; max 10; each concrete and testable)
1. **Remove the visible terrain staircase near the camera (blocker).**
   - **Where:** `IslandTerrain.ts` and `MicroDecor.ts`.
   - **Options:**
     - Smooth the near surface: a 1/16-1/32 m near ring, or smoothed per-vertex normals plus a heightfield blend so step risers do not shade as hard faces.
     - Thicken the grass so no bare terrain face shows between blades within about 10 m of the camera.
   - **Target:** no terrain voxel or step face over 12 px in any gameplay frame. The meadow reads as a soft rolling lawn at 844x390 and in a 2x crop of the lower third.
2. **Make the belly a tummy, not a sticker.**
   - **Where:** `src/art/models/glazey.ts` (`bellyBulge` SDF at about l.162-173; patch `bellyRx`/`bellyRy` at about l.356-363; `glazeyBellyRim`). Also the per-material light response for cream under the lilac fill.
   - **Problem:**
     - **In play:** the belly is a hard-edged, flat-lit cream oval at about (875-945, 715-765) in the walk still. At luma 213 it is the brightest part of Glazey, so the eye goes to it first. It touches the left body outline, so in 3/4 view it still reads as a lower lip or bill. It has no shading gradient, so there is no swell.
     - **In the studio:** it is about 45 % of body width. Sheet 03 shows about 60 % that wraps the lower front.
     - **In side view (turntable f1):** it is a thin **olive-khaki** sliver on the front edge, at about x 900-925, y 640-760 of f1. That is a muddy colour (§10.5) and it does not bulge past the body line.
   - **Target:**
     - The belly is wide: about 60 % of the body, and its lower edge wraps toward the feet.
     - It has a visible lit-to-shaded gradient across the swell, with value inside the patch varying at least 25 luma top to bottom.
     - It is soft-edged in gameplay and stays inside the coral silhouette in 3/4 view.
     - In profile it shows as a warm cream bulge past the body line, never olive.
3. **Make the jump read as airborne.**
   - **Where:** `src/game/fx/ContactShadow.ts`, which uses `LIGHT_PALETTE.studioOcclusion` `#7A4424`. Also the dust in `VoxelParticles.ts` and the pose and placement in `m4Play.ts`.
   - **Problem:**
     - **Shadow:** at (960,845) of the jump apex the shadow is luma 81 against grass at 97, only 16 darker. It has hue 44 and saturation 0.53, so it reads as a **mud patch** next to the donut.
     - **Placement:** Glazey's feet overlap the top of the lagoon frosting wall at about y 640, so he reads as standing on the wall.
     - **Dust:** cool-white unlit cubes of about 8-12 px at (920-1040, 780-830) that look like litter.
   - **Target:**
     - A cool, desaturated shadow tint (toward the cool grass-shadow hue) at least 25 luma darker than the surrounding grass.
     - The apex framed so open grass or path sits between the feet and the shadow, with nothing the feet visually rest on.
     - Warm cream dust lit by the sun, at most 8 px, clustered at the take-off point.
4. **Warm the play grade and the grass.**
   - **Where:** the play-mode grade and fog in `Game.ts`/`m4Play.ts`, the grass entries in `palette.ts`, and the `MicroDecor.ts` blade material.
   - **Problem:**
     - The grass samples at hue 135 (near) and **hue 196, a blue-teal**, at (1300,700). It sits under a milky veil.
     - Glazey's lit-to-shade split is small, and there is no warm rim.
     - The frame reads as overcast pastel, not golden hour (§6 "warm low-angle sun ... noon is not allowed"). Reference 02's warm backlit glow is absent.
   - **Target:**
     - Grass hue 95-120 with warm, yellow-green sunlit tips, and cooler but still green shadow pockets.
     - A visible warm sun side and rim on Glazey and the props.
     - Less veil in the foreground.
     - The frame warm overall (about 70 % warm per §4).
5. **Make the green trees sprinkle-balls, and give the pink tree form.**
   - **Where:** `src/art/models/sprinkleTree.ts` (the `want` sprinkle count, the pink `k` jitter and crown shading).
   - **Problem:**
     - **Green trees:** at (1480-1920, 0-460) they are generic green blobs with sparse sprinkles. NOTES-02 explicitly says "use sprinkle-ball trees as in 01". Reference 01's crowns are densely covered.
     - **Pink tree, left:** it is a flat two-tone checker with almost no light-to-shade gradient across the ball, and it reads as a flat pink wall.
   - **Target:**
     - Sprinkle coverage of at least 25-35 % of the visible crown surface on the green trees.
     - On the pink canopy, a clear sun-side highlight and an occluded underside, with at least 40 luma between them, and per-voxel grain that is no longer checker-like at 2x.
6. **Recompose the gameplay frame (repeat of iter 2 item 8, not fixed).**
   - **Where:** `FollowCamera.ts` (offset and yaw) and the `m4Play.ts` spawn and heading.
   - **Problem:**
     - Glazey stands at x about 950, dead centre.
     - The lighthouse lantern is cut by the top edge in the walk and touch frames.
     - The cropped pink canopy fills about 18 % of the frame on the left.
     - The confetti-covered rim fills the lower-right corner.
   - **Target:**
     - Glazey on a vertical third.
     - The lighthouse fully in frame as a landmark.
     - No single cropped prop over 12 % of the frame.
     - Foreground rim at most 12 %.
7. **Put Glazey at the top of the value hierarchy (§4).**
   - **Problem:** the near rim (1700,1000) is luma 171, and Glazey's body is 143-160. The belly at 213 is the brightest part of him.
   - **Where:** the play-mode `heroRim`/`selfLight` in `Materials.ts`, and a play-mode vignette or darkening on the foreground in the post grade.
   - **Target:** Glazey's lit body is brighter than every foreground surface. In grayscale the strongest contrast in the frame is on his face and body, not the belly patch or the rim.
8. **Restore clear belly-stage progression in the studio, and make the core cool.**
   - **Where:** the layout in `src/debug/scenes/gallery.ts` (about l.189-260), and `studio.ts` with `studioLilac`.
   - **Progression:**
     - **Problem:** the small stages 0-2 stand in front, so perspective makes them look as big as stages 3-5 behind. Growth is far harder to read than in `shots/M3/final/gallery-glazey-belly`, where stages 0-5 grew clearly left to right.
     - **Target:** a lineup where stage size visibly increases monotonically. Every stage's body width differs by at least 6 % of frame width from stage 0 to stage 5.
   - **Core colour:**
     - **Problem:** at (1460,330) the shaded side is hue 9 against hue 13 on the lit side, at the same saturation (0.52). That shadow is redder, not lilac, so the lilac fill is not landing.
     - **Target:** a shadow-side hue at or below 0 (rose-lilac) with lower saturation than the lit side.
9. **Make the milk read as milk.**
   - **Where:** the lagoon shader.
   - **Problem:** in the walk still at (60-860, 520-720) the lagoon is pink-tinted and has long satin specular streaks. It reads as pink plastic or a mirror, not cream milk. There is no depth tint near the drip wall.
   - **Target:** cream-white body colour (§4 cream milk `#FFF6E6`), soft broad specular, a gentle darker depth tint near the walls and under the pier, and no pink cast outside reflections of the wall.
10. **Clean up the UI icon and the clouds.**
    - **Jump icon:** in `voxelIcon.ts`/`touchIcons.ts`, Glazey renders as a desaturated **tan "potato"** with a washed-out tuft, at about (1660-1760, 830-950) of the touch frame. It is not coral. The hop pose and shadow are good. Target: icon body hue and saturation within a few points of in-game coral `#F28B6E`, and a fully saturated tuft.
    - **Clouds:** every cloud has a separate, stair-stepped pink-lilac band across its bottom quarter, for example at (920-1150, 105-130). It reads as a layer seam. Target: a soft continuous underside shade with no hard horizontal step.

## What is working (keep it)
- **The tree blocker from iter 2 is fixed.** The canopies are 1/64 m, with sprinkles about 5x15 px. Nothing reads as Lego on the trees.
- **The play sky** now runs from lilac-grey at the zenith (hue 282) to a peach horizon, with no banding (dithered, short runs) and with soft, fine-voxel clouds. This is a big depth win.
- **The milk glare** is no longer blown.
- **The walk cycle now reads:**
  - The arm swings visibly between f0, f1 and f2, and a foot lifts.
  - A small footfall puff appears in f2.
  - The tuft lean changes.
- **The face:** big warm-brown eyes with clean white glints, an open smile and soft blush. It is charming at gameplay distance.
- **The jump button** now shows Glazey mid-hop with a ground shadow, and the jump and joystick bases carry a candy bevel and a soft drop shadow.
- **Set dressing** stays good: the drip lagoon wall, the pier, the striped lighthouse, the dropped donuts and the tree shadows across the path.

## Store-page test: no
The touch-ui hero frame would not go on a premium store page:
- Its lower third is a blocky green staircase.
- The grade is cool and hazy, not golden.
- Glazey's most eye-catching feature is a flat cream sticker.
- The left fifth is a cropped flat pink wall.

The world is now coherent and has a sky. The surface quality and light still sit at good-indie level, not best-of-year level.

## Previous review (M4-iter2): status of the fix list
| # | item | status |
|---|---|---|
| 1 | Sprinkle-tree density (blocker) | **Fixed.** The canopies are 1/64 m with scattered sprinkles. The new items are the form and sprinkle density of the green trees (item 5). |
| 2 | Real sky | **Fixed.** There is a gradient and clouds, with no banding. The clouds have a hard bottom band (item 10). |
| 3 | Belly as a tummy, not a beak | **Partly fixed.** The patch is lower, with coral between it and the mouth. It is still a flat, bright, hard-edged sticker, and olive in profile (item 2). |
| 4 | Jump reads as airborne | **Partly fixed.** The arms are up and a shadow exists. The shadow is mud-brown and too weak, the dust is cool-white litter, and Glazey looks perched on the wall (item 3). |
| 5 | Walk cycle | **Mostly fixed.** The arm swing, foot lift, footfall puff and tuft change all read. The amplitude is still modest. |
| 6 | Value hierarchy and grade | **Partly fixed.** The glare is fixed. The rim is still brighter than Glazey, and the grass is teal-sage and veiled (items 4 and 7). |
| 7 | Near-terrain terracing | **Not fixed. Worse exposure, now a blocker.** |
| 8 | Recompose the frame | **Not fixed** (item 6). |
| 9 | Cool studio core | **Not fixed.** The shade is hue 9 against hue 13 lit (item 8). |
| 10 | Touch UI polish | **Mostly fixed.** The drop shadows are present and the icon shows a hop. The icon colour is washed out (item 10). |

## Regression check
- **Shared code changed this iteration:**
  - **`sprinkleTree.ts`:** a new `res` parameter. Sprinkle placement switched to a Fibonacci sphere for **all** resolutions, so M2 trees at `res` 1 get a different, more even sprinkle scatter. The pink jitter is unchanged at `res` 1 (q = 1).
  - **`Sky.ts`:** the new `rise` and `glowFalloff` uniforms default to the old 0.7 and 5.
  - **`palette.ts`:** only additions (`glazeyBellyRim`, `studioLilac`) and Glazey eye material flags.
- **M0-M2 terrain and props:** the default paths are unchanged, apart from the tree sprinkle distribution, which by construction can only scatter more evenly. The island assets in the M4 frames match `shots/M2/final/m2-ground` and `m2-hero` in palette and light direction. **No regression** in shared world content.
- **`gallery-glazey-belly` against `shots/M3/final/gallery-glazey-belly`:**
  - **Better than M3:** smoother skin and a bigger, warmer face.
  - **Worse than M3:** the stage progression is now visibly harder to read, and the body has drifted from M3's wider gumdrop toward a taller egg with a smaller belly. Both drift further from sheet 03.
  - **How I classified it:** M3 was accepted with Glazey explicitly re-gated in M4, so I list this as fix items 2 and 8 rather than a separate regression blocker. It must not ship in this state.

```json
{"gate":"M4","iter":3,"verdict":"FAIL","mean":6.6,"min":6,"blockers":1,"store_page":false}
```
