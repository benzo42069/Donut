# Review M2 iter 2
## Verdict: FAIL

I captured these myself with `npm run shots -- --gate M2 --iter 2` at commit `ef6e551`. The harness
reported `ok: true` and took the SwiftShader fallback path. It wrote 10 files to `shots/M2/2/`. I viewed
every 1920x1080 and 844x390 PNG, plus 2x nearest-neighbour crops (hero cliff, lagoon, bakery, sugar
hill, lighthouse, clouds; ground left, right, donut and tree; closeup donut, top-right and foreground;
lagoon milk, wall, right and trees). I also viewed a grayscale conversion of the hero and ran per-pixel
channel statistics. I viewed all four references (01–04) and judged fidelity only against the
"Follow" lists in `art/reference/NOTES.md`.

Summary: iteration 2 is a real step forward:
- The closeup donut now has an open hole and a dough band.
- The milk in lagoon-edge has ripples, reflections and ripple rings around the floating donuts.
- The clouds are cream instead of tan.
- Bloom no longer floods the grass.
- The red-and-white mystery object is gone.

The fundamental problem from iter 1 is still here: **the near-camera shots still break the
density rule and the "NOT Minecraft" rule.** The ground shot is now taken from even lower
(`lift 0.3`, down from 0.42). Its 1/128 m macro patch covers only a radius of 3.1 m around the donut. Everything
outside it, including the whole frosting slope on the right, still renders as coarse terraces and
brick sprinkles. Heavy bokeh is covering for the closeup instead of fixing it. The colour grade
now claims to be gamut-safe, but the blue channel still clips to 0 on 7–21 % of every frame.
The gate mean rises from 5.2 to about 5.8, and the bar is 9.0. This is not close.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 6 | 7 | 6 | 6 | 6 | 5 | 6 | 7 | 7 | 5 | n/a | n/a | 6.1 |
| m2-ground | 5 | 6 | 7 | 6 | 6 | 5 | 3 | 6 | 6 | 4 | n/a | n/a | 5.4 |
| m2-closeup-donut | 5 | 5 | 7 | 6 | 6 | 6 | 4 | 5 | 6 | 5 | n/a | n/a | 5.5 |
| m2-lagoon-edge | 6 | 6 | 7 | 5 | 6 | 6 | 5 | 6 | 6 | 5 | n/a | n/a | 5.8 |
| m2-low-tier | 6 | 7 | 6 | 5 | 6 | 5 | 6 | 7 | 7 | 5 | n/a | 7 | 6.1 |

- **Gate mean:** about **5.8**. It needs at least 9.0, or at least 8.5 for the low tier.
- **Min:** **3** (m2-ground, voxel density).
- **Categories at 8 or above:** none, in any shot.

## Blockers
- **[m2-ground] Minecraft-scale near terrain and props (§10.2, §2 "silhouettes are staircases", §3 density rule, NOTES 02 "Ignore").**
  - **Frosting slope (right third, x 1480–1920, y 730–900):** it is a stack of terraces with steps about 18–22 px tall and hard edges. Yellow and red "sprinkles" lie on the steps as bricks about 30×12 px. This is the iter-1 blocker, unchanged.
  - **Frosting rise (left, x 0–330, y 710–840):** the same terracing, now dotted with blown bokeh discs.
  - **Foreground grass (bottom quarter):** blades are still square pillars about 15–20 px wide. The flowers (lower-right, around (1400,980) and (1800,1050)) are flat 5-voxel plus-sign slabs about 60–80 px across.
  - **Wild donut (prop):** each voxel is about 11 px. The prop limit is about 6 px.
  - **Bakery:** the wall plaster voxels are about 10–14 px and the cruller trim reads as a row of Lego bumps.
- **[m2-closeup-donut] Prop and terrain density, with blur used as camouflage (§10.2, §3).**
  - **Hero donut:** the frosting is concentric stepped rings with voxels about 9–11 px (limit about 6 px). The top and hole read as a ziggurat of rings, not a smooth glossy dome.
  - **Drips (bottom edge):** they are flat-bottomed rectangular tabs, not rounded drips.
  - **Grass (foreground, lower-left and left third):** the grass is cylinders 25–30 px wide, blurred by `bokehScale: 5` (`m2Meadow.ts:83`). Blur does not make a voxel smaller. It turns Minecraft grass into green pills.
  - **Background (top-right, x 1550–1920, y 0–330):** a soft pink staircase of 40 px blobs.
- **[all shots] Gamut clipping persists (§4 "avoid pure-saturation fills on large areas", §10.5, §10.7).**
  - **Pixels with a channel at exactly 0:** hero 7.7 %, ground 8.6 %, closeup 2.0 %, lagoon-edge 21.1 %, low-tier 7.4 %. Almost all of these are blue = 0.
  - **Samples:** sugar hill (hero, (560,420)) = (160,93,0); lagoon inner wall (lagoon-edge, (300,700)) = (141,85,0); hero underside crust (1203,937) = (82,34,0). The deep crust should read near `#7A3E1D` (122,62,29).
  - **Why it matters:** the dough reads as a flat, pure-saturation orange with no gradation. It is worst in lagoon-edge, where it covers about a fifth of the frame.
  - **Likely cause:** `ColorGrade.ts` now clamps on input (`clamp(inputColor.rgb…)`, line 24), so the clipping happens **upstream**, in tone mapping or in the warm key and wrap lighting pushing blue negative before AgX. A clamp in the grade cannot recover it.
- **[m2-hero, m2-low-tier] Visibly chunky coarse terrain on the island underside (§3 "Terrain far (LOD) must never be visibly chunky in a shot").**
  - **Where:** the lower drum (x 470–1450, y 830–1000).
  - **What:** a checkerboard of cells about 10–12 px, each with its own value. It reads as pixel noise, not crumb.
  - **Silhouette:** the bottom contour (lower-left, x 480–760, y 860–990) is a clear staircase.
  - **Progress:** the wall now bulges, which is progress. But at this camera distance the 1/8 m cells read as Lego.

## Fix list (priority order; max 10; each concrete and testable)
1. **Near-field density for the ground and closeup cameras.**
   - **What:** Near terrain, decor and props render 2–4× over the density limit.
   - **Where:** `src/debug/scenes/m2Meadow.ts`: the `ground` lift of 0.3, the `detail` radius of 3.1, and the `closeupDonut` distance of 2.4 with fov 28. Also `IslandTerrain.ts` macro patches, `grassTuft.ts` and `donut.ts` resolution.
   - **Target, measured on the 1920 shot:**
     - In both shots, no terrain, grass or flower voxel is over 12 px and no prop voxel is over 6 px.
     - The macro patch covers **everything inside the frame up to about 8–10 m**, including the frosting slopes left and right in m2-ground.
     - Grass reads as tapered micro-blades and flowers as small rounded blooms of 25 px or less.
   - **How:** either raise and pull back the camera so the existing voxels fall under the limit, or go finer. Bokeh must not be what makes it pass. The shot must pass the density check with DoF disabled.
2. **Gamut clipping upstream of the grade.**
   - **Where:** `Renderer.ts` tone-mapping order, the AgX input, key and wrap light colours (`LIGHT_PALETTE`), and `Materials.ts` wrap lighting.
   - **Target:**
     - Fewer than 0.5 % of pixels in any shot have a channel at 0.
     - The dough on the lagoon wall and the sugar hill keep a visible blue component, so the toasted-to-golden gradient is visible.
     - The underside crust reads as deep caramel near `#7A3E1D`.
   - **How:** do the chroma compression in linear HDR before tone mapping, not after.
3. **Frosting terraces to smooth swells.**
   - **What:** The rim and slope frosting is a quantized heightfield of hard steps.
   - **Where:** the frosting heightfield quantization in `IslandTerrain.ts` and the terrain sprinkle stamp.
   - **Target:**
     - In m2-ground, the rim slopes read as soft, glossy, rounded swells, and no step edge is over 12 px.
     - Terrain sprinkles are 1×1×3 capsules at 1/32 m or finer, not 30 px bricks.
     - The smooth-normal gloss that iter 2 added to the donut also applies to the terrain frosting.
4. **The lagoon at hero distance is still a dry cream floor in a pit.**
   - **Where:** `Water.ts`, `Reflection.ts`, `islandShape.ts`.
   - **Target, in m2-hero:**
     - The milk shows a sky-tinted fresnel gradient, a sun-path glint and reflections of the drips and pier.
     - A foam or meniscus line is visible where the milk meets the cliff.
     - The milk in shadow is warm cream-lilac, not neutral gray. It samples (179,168,164) at (1000,470), the same default-three.js gray as iter 1.
     - The shadow edges on the milk are softened. The lighthouse and tree wedges, centre-right, are currently razor-sharp.
     - The inner wall shows less than half its current height above the milk, so the lagoon reads as a lagoon, not a quarry.
   - **Progress:** lagoon-edge proves the water shader can do this. It just doesn't read at all from the hero camera.
5. **Wild donut form.**
   - **Where:** `src/art/models/donut.ts`.
   - **Target, at the closeup framing:**
     - The frosting top is a smooth dome with one broad soft specular highlight, as in ref 04 top-left. It should not be concentric step-rings or a scatter of per-voxel pinpoint glints.
     - There are 5–8 drips of varied width and length with **rounded bulb ends**. They should not be rectangular tabs.
     - The dough band shades golden to toasted, with no pale rectangular patch (current front-centre, x 900–1100, y 620–680).
     - The sprinkles sit flush on the frosting.
6. **Inner cliff barcode and the hero underside.**
   - **Where:** `IslandTerrain.ts` strata and coarse runs, and `hash3`/`jitteredLinear` in `Materials.ts`.
   - **What's wrong now:**
     - The lagoon-edge wall still shows per-column vertical striping, like corrugated card. The strata are thin, dark, wobbly lines that read as wood grain.
     - The hero underside is a coarse checkerboard (blocker 4).
   - **Target:**
     - The wall reads as baked dough: soft toasted gradients, swelling strata bands of varied thickness and fine crumb.
     - The underside silhouette is smooth from the hero camera, with no staircase visible.
7. **Golden hour in the hero.**
   - **Where:** `SUN_DIR` and the light colours in `MeadowDiorama.ts` and `LIGHT_PALETTE`.
   - **Target:**
     - A low sun from the upper right, with long, warm-edged shadows raking across the meadow.
     - A warm rim light on the trees, bakery and lighthouse.
     - Visibly cool shadow sides.
     - In grayscale, the hero needs a value hierarchy. Today the island, the sky and the clouds all sit in the same mid-gray, and only the milk pops. The strongest contrast should land on the bakery, lighthouse and lagoon group (§4 value structure).
8. **Clouds.**
   - **Where:** `buildCloud` in `smallProps.ts`.
   - **What's wrong now:** they are cream now (good), but every cloud is etched with dark contour grooves, like topographic layer lines (hero bottom-right, x 1430–1790, y 780–910), and they read as carved soap.
   - **Target:**
     - Soft, puffy forms with gentle lilac undersides and no groove lines. Shade them with a smooth or blurred normal like the gloss path.
     - No clouds cropped at the frame bottom (bottom-centre and bottom-left of the hero).
9. **Sprinkle-tree canopies.**
   - **Where:** `sprinkleTree.ts`.
   - **Target:**
     - The sprinkles lie on the canopy surface. Today they stand off it like stray hairs or staples, as in lagoon-edge (x 280–700, y 280–460) and the ground pink tree (x 1400–1700, y 320–520).
     - The pink canopy loses its hard horizontal two-tone band (lagoon-edge pink tree, mid-height), and its silhouette edge stops stair-stepping.
10. **Set dressing and composition.**
    - **Sugar hill (hero left):** it is a smooth, flat-orange cone with two flat white caps. It needs voxel relief and powdered sugar dusted on its top faces only.
    - **Syrup waterfall (hero, top-left of the lagoon, about (800,340)):** it reads as a flat orange plank. It needs amber translucency, a highlight streak and a splash at its foot.
    - **m2-ground:** the subject donut must get the strongest value contrast. Today the backlit bakery wins.
    - **m2-closeup-donut:** the cropped chocolate donut at the top-left frame edge (x 350–600, y 0–60) is distracting. Remove it or bring it fully into the frame.
    - **Fireflies:** remove the isolated white firefly pixels on the lighthouse stripes (hero, x 1170–1200, y 300–480) and on the underside crust.

## What is working (keep it)
- **Lagoon-edge milk:** ripple rings around the floating donuts, a soft reflection of the pier and donuts, and a warm backlit surface. This is the first time the milk reads as liquid. Carry it to the hero.
- **Closeup donut:** the open hole with the dough visible inside, and a real dough band below the frosting. The silhouette is now clearly a donut.
- **Drips on the lagoon wall:** they now vary in length and have rounded bulb ends.
- **Clouds:** the cream colour is correct, and the lilac underside tint has started.
- **Bloom:** it no longer floods matte grass. The lighthouse lamp and bakery windows carry the glow.
- **Ground lighting:** the backlit warm sky, the glowing windows and the long donut shadow on the path give the ground shot genuine mood.
- **Bakery:** still charming, with the donut emblem, the awning (now a 3D overhang), the window boxes and the chimney steam.
- **Low tier:** it holds up next to the high tier with no broken effects.
- **Cleanup:** the unidentified red-and-white object on the milk is gone.

## Store-page test: no
- **Hero:** at thumbnail size it is a pleasant diorama. Beside reference 01 it looks flat and matte, for four reasons: the lagoon is a pale floor in a pit with hard gray shadows, the underside is a pixel-noise checkerboard, there are no golden-hour rakes, and the clouds look like carved soap.
- **Ground and closeup:** a premium store listing would include a ground-level shot, and those two shots still read as a Minecraft resource pack behind a blur filter.
- **Verdict:** I would not put this next to the best indie games of the year.

## Previous-review check (reviews/M2-iter1.md fix list)
| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Ground and closeup density | **Not fixed** (partly, inside the 3.1 m patch only) | Grass 15–20 px, frosting terraces 18–22 px, donut voxels 9–11 px. The ground camera is now *lower* (0.3 m). |
| 2 | Gamut clipping | **Partly fixed** | Red-channel clipping is gone. Blue = 0 on 7.7 % (hero) and 21.1 % (lagoon-edge) of pixels, down from 11.9 % and 31.1 %. |
| 3 | Frosting gloss | **Partly fixed** | Per-voxel glints and smooth normals on the donut. The terrain rim frosting is still matte, and there is no broad specular highlight. |
| 4 | Milk reads as liquid | **Partly fixed** | Good in lagoon-edge. In the hero it is unchanged: flat, gray in shadow (179,168,164), with no foam visible. |
| 5 | Cliff barcode and chunky underside | **Partly fixed** | The outer wall bulges. The inner wall still has column stripes, and the underside is still chunky. |
| 6 | Donuts read as donuts | **Partly fixed** | The hole and dough band are there. The frosting is terraced and the drips are rectangular. |
| 7 | Golden-hour hero | **Not fixed** | The hero is still neutral afternoon light with short shadows. |
| 8 | Clouds | **Partly fixed** | The colour is right. They have contour-groove texture and are still cropped at the bottom edge. |
| 9 | Ground and closeup composition | **Partly fixed** | The ground shot has sky, a cloud and a focal donut, but the bakery out-contrasts the donut. The closeup is still about 70 % grass. |
| 10 | Set dressing | **Partly fixed** | The red-and-white object is removed. The sugar hill is unchanged, and the canopy sprinkle "hairs" remain. |

Reviewer 2's iter-1 items: the bloom on grass is **fixed**. The syrup waterfall is **added, but weak** (a flat plank).

## Regression check
No previous graphics gate has `final/` shots. `shots/M0/final` and `shots/M1/final` are engine test
scenes only, so there is nothing to regress against. Compared with M2 iter 1 there is no visible
regression, except that the ground camera now sits lower, which makes the density problem worse.

```json
{"gate":"M2","iter":2,"verdict":"FAIL","mean":5.8,"min":3,"blockers":4,"store_page":false}
```
