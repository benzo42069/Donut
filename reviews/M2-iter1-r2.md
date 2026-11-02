# Review M2 iter 1 (reviewer 2 of the ★ double gate)

Capture: `npm run shots -- --gate M2 --iter 1-r2` → `shots/M2/1-r2/` (harness ok,
SwiftShader path, 10 files). I viewed every 1920x1080 frame and zoomed into crops of the
hero cliff, hero lagoon, lagoon-edge milk and ground bakery. The references I viewed
were 01–04, judged against the Follow lists in `art/reference/NOTES.md` only.

## Verdict: FAIL

This is not close. The hero establishes the right *idea* (a ring island, frosting
over dough, sprinkle trees, bakery, lighthouse). But all three close or low-camera shots
break the density rule and the "this is NOT Minecraft" rule. The milk lagoon reads as a dry
cream floor at the bottom of a pit. Materials are close to absent: frosting, dough and milk
all look like the same matte plastic. The lighting is passable, but it is not a fundamental
problem. **Form and material are.**

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 6 | 7 | 6 | 6 | 6 | 5 | 6 | 7 | 7 | 6 | – | – | 6.2 |
| m2-ground | 5 | 5 | 6 | 5 | 6 | 4 | 3 | 6 | 5 | 4 | – | – | 4.9 |
| m2-closeup-donut | 3 | 5 | 6 | 5 | 5 | 3 | 3 | 4 | 4 | 5 | – | – | 4.3 |
| m2-lagoon-edge | 5 | 6 | 7 | 4 | 6 | 3 | 5 | 4 | 5 | 5 | – | – | 5.0 |
| m2-low-tier | 6 | 7 | 6 | 5 | 6 | 5 | 6 | 7 | 7 | 6 | – | 7 | 6.2 |

Gate mean ≈ 5.3. Minimum 3. Every shot has categories below 8.

## Blockers
- **[m2-ground] Lego-scale near terrain (instant-fail §10.2, art bible §2–3, RF-04).**
  The foreground grass across the whole bottom third is made of single cubes about 25–35 px
  tall at 1080p. The flowers (red/white plus-shaped blooms, lower-left and lower-right) are
  about 60 px across and built from voxels of about 15–20 px. This is the exact
  Minecraft-scale grass that NOTES.md 02 says to "ignore / do better". The terrain limit is
  ~12 px.
- **[m2-ground] Staircase frosting slope (instant-fail §10.2, §2 "silhouettes are
  staircases").** In the right half, from the frosting rim down toward the camera, the slope
  is a stack of terraces 30–40 px tall with hard step edges and big 1×1×4 yellow and red
  "sprinkles" lying on the steps like bricks. It reads as a pink Minecraft hillside, not a
  smooth frosting swell.
- **[m2-closeup-donut] Lego-scale hero prop and grass (§10.2, §3).** The donut's frosting
  steps are about 12–18 px each. The grass cubes are 30–50 px. The donut has no visible
  hole: it reads as a terraced pink cupcake or ziggurat with a concentric step pattern on
  top. Compare 04 top-left, which has a clear hole, a dough band and drips.
- **[m2-lagoon-edge] Milk does not read as liquid (RF-02, art bible §5 Milk; the 01
  "Ignore" item is reproduced).** The lower 20% of the frame is an opaque, flat
  peach-cream plane. There are no ripples, no shoreline foam or meniscus where the cliff
  meets the milk, and no depth tint. The only "reflection" is a faint smeared gray ghost of
  the pier and a hard dark shadow wedge (lower-center, x≈750–1100). Three donuts sit on the
  surface with no waterline (left, a chocolate donut at about 650,880; center, a pink one at
  about 1290,990; right, a plain one at about 1830,930). They look like they are sitting on
  a floor. From the hero angle the lagoon is identical: it looks like the cream slab NOTES.md
  says to ignore.
- **[m2-lagoon-edge] Unidentified object on the milk (§10.9 placeholder or debug look).**
  Right of the pier at about (1350,880) there is a red-and-white fragment of blocks with no
  readable form: a broken candy cane, half a lighthouse cap, or a stray stamp. Whatever it
  is, it reads as an error.
- **[m2-closeup-donut] Bloom is flooding non-emissive surfaces (§6 "Bloom: only glaze
  highlights, emissives, FX"; §10.7 blown highlights).** The sunlit grass tips across the
  whole frame glow yellow-white, and there is a soft halo on every blade in the upper-left
  quadrant. Matte grass must never bloom.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Make near-camera grass true micro-voxels. **Where:**
   `src/art/models/grassTuft.ts`, the near-field instancing in `MeadowDiorama.ts`, and the
   `ground` / `closeupDonut` cameras in `src/debug/scenes/m2Meadow.ts`. **Target:** in
   m2-ground and m2-closeup-donut, no grass or flower voxel is larger than ~12 px at 1080p.
   Blades read as thin tapered strands, and flowers read as small rounded blooms (≤ 25 px
   across in the foreground). If 1/64 m tufts still render at 30 px, the camera is too close
   for the voxel scale. Either pull the camera back and narrow the FOV, or go to 1/128 m for
   tufts within 1 m of the lens.
2. **What:** Re-author the wild donut so it reads as a donut at close range. **Where:**
   `src/art/models/donut.ts` (SDF torus resolution and frosting shell). **Target:** at the
   closeup framing the donut shows (a) an open hole with visible inner dough, (b) a
   golden-to-toasted dough band below the frosting, (c) 5–8 rounded drips over the outer
   edge, and (d) a smooth torus silhouette with no visible concentric terraces. That means
   the closeup asset uses 1/64 m with ≥ 64 voxels across, framed so steps are ≤ 6 px
   (art bible §3). Sprinkles must be 1×1×3 capsules, not the current 1×2×5 bricks.
3. **What:** Give frosting and glaze a real glossy material. **Where:**
   `src/engine/render/Materials.ts` (per-palette roughness and clearcoat flags in
   `palette.ts`). **Target:** pink frosting on donuts, rims and drips shows clear specular
   highlights facing the sun (hero rim lower-left, closeup donut top, lagoon-edge drips).
   Dough stays matte with wrap lighting. You should be able to tell the two materials apart
   in grayscale.
4. **What:** Make the milk lagoon read as liquid. **Where:**
   `src/engine/render/Water.ts`, `Reflection.ts`, and the lagoon depth in `islandShape.ts`.
   **Target:** visible ripple specular glints, a soft cream foam line where milk meets the
   cliff and pier posts, a warm depth tint gradient, and a recognizable soft reflection of
   the cliff drips and lighthouse. Floating donuts get a meniscus ring. Raise the milk level
   (or add a sloped dough beach) so that from the hero angle the lagoon is not a dry floor
   3–4 m down a vertical pit.
5. **What:** Remove the staircase frosting terraces and the oversized sprinkles on terrain.
   **Where:** `src/game/world/IslandTerrain.ts` (1/8 m terrain near camera and the frosting
   heightfield quantization) and the terrain sprinkle stamp. **Target:** in m2-ground the
   right-hand frosting slope reads as a smooth, glossy swell with steps ≤ 12 px. Terrain
   sprinkles are at most 1/32 m capsules, not 1/8 m bricks.
6. **What:** Break up the vertical "corrugated" striping on the dough cliffs. **Where:**
   the per-voxel jitter in `palette.ts` and the strata logic in `IslandTerrain.ts`.
   **Target:** the lagoon-edge wall and the hero outer wall no longer show uniform vertical
   column stripes (currently every 1/8 m column is its own value band, like corrugated
   cardboard or a picket fence). They show baked-dough crumb noise, swelling strata and some
   overhangs and bulges like in 01. The outer wall should also bow outward, so the island
   reads as a fat donut rather than a straight-sided cake tin.
7. **What:** Put bloom behind a real emissive/specular threshold. **Where:**
   `src/engine/render/Renderer.ts` (BloomEffect is applied before AgX at
   `luminanceThreshold` 0.85 on HDR values). **Target:** no bloom halo on sunlit grass, dough
   or frosting. Only the lighthouse donut, the bakery windows and glaze specular glints
   bloom.
8. **What:** Re-color and refine the clouds (RF-03). **Where:** `buildCloud` in
   `src/art/models/smallProps.ts` and its material. **Target:** cream-white
   (`#FFF6E6` family) puffs with a warm-lit top and lilac shadow, finer voxels and soft
   edges. The current clouds are a muddy tan-beige that reads as sand or toast against the
   peach sky (hero top corners, bottom center). Don't let clouds clip the frame edges in a
   way that reads as a mistake (hero bottom center behind the island, bottom-right).
9. **What:** Add contact and AO grounding for props. **Where:** N8AO radius and intensity
   in `Renderer.ts`, and baked AO in `mesh.ts`. **Target:** every donut in grass and on milk,
   the pier posts in the milk, and the tree trunks show a dark contact core. Right now the
   lagoon donuts and pier posts have none, and the ground-shot chocolate donut (mid-left)
   floats over the path.
10. **What:** Fix the bakery details and the ground composition. **Where:**
    `src/art/models/bakery.ts` and the `ground` camera. **Target:** the diagonal timber
    braces on the bakery's left wall currently render as broken, jagged dark lines that read
    as cracks. Make them continuous and solid, or remove them. Make the awning a 3D
    overhang that casts a shadow, not a stripe painted flat on the wall. Reframe the ground
    shot so the lighthouse top is not cropped and the clipped tree canopy (top-left corner)
    is removed or deliberate. Add some sky interest (clouds) so the upper half is not an
    empty peach wash.

Also missing against the 01 Follow list: the amber syrup waterfall. I did not put this in
the top 10, but it is required for reference fidelity at ≥ 8.

## What is working (keep it)
- The overall concept and layout of the hero match 01 well: frosting rim with drips, a
  winding path, sprinkle-ball trees in green and pink, a bakery with dark shingles and
  cruller trim, chimney steam, a candy-striped lighthouse with a glowing donut, and a pier
  with stairs into the lagoon. The ring-island correction (RF-01) is in.
- The sky gradient (cool blue left to warm peach right) and the backlit golden sun in the
  lagoon-edge shot give a nice mood. I saw no visible banding.
- The warm lit bakery windows are charming and correctly emissive.
- Pink and green sprinkle canopies at hero distance read as rounded forms at the right
  density.
- At hero distance the cool lilac shadow cast across the frosting rim (left-front)
  is the right direction for the cool-shadow grade.
- The low tier degrades gracefully: it is nearly identical to high, with no broken effects.

## Store-page test: no
The hero is a pleasant diorama at thumbnail size. But next to 01 it looks flatter and
more plastic: no frosting gloss, a dry-looking lagoon, tan clouds, and a straight-walled
cake tin instead of a plump donut. Any screenshot from ground level looks like a
Minecraft texture-pack mod. A premium store page always has a close-up, and these
close-ups would sink the listing.

## Regression check
No previously passed graphics gates exist (`shots/M0/final` and `shots/M1/final` are engine
test scenes only), so there is nothing to regress against. This is the first gate.

```json
{"gate":"M2","iter":"1-r2","verdict":"FAIL","mean":5.3,"min":3,"blockers":6,"store_page":false}
```
