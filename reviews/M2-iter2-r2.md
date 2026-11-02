# Review M2 iter 2 (reviewer 2 of the ★ double gate)

Capture: `npm run shots -- --gate M2 --iter 2-r2` at commit `ef6e551` → `shots/M2/2-r2/`
(harness `ok: true`, SwiftShader fallback, 10 files, empty log). I viewed every 1920x1080
frame, plus full-resolution crops of the hero lagoon, hero outer cliff, hero bakery and
lighthouse, the ground foreground (both corners and the path), the closeup donut and path,
the lagoon-edge milk, wall and tree canopies, and a grayscale conversion of the hero. I
measured channel clipping with numpy. I viewed references 01–04 and judged them against the
NOTES.md "Follow" lists only.

## Verdict: FAIL

This is real progress. The gate mean rises from about 5.3 to about 6.1. The donut now
has a hole, a dough band and drips. The milk in lagoon-edge finally moves and reflects. The
clouds are cream, bloom no longer floods the grass, and the outer wall bulges with crumb
noise instead of a barcode. But the work is still well short of the bar. The frosting
terrain is still a pink staircase at ground level. The new 1/128 m macro patches leave
visible seams across the path. Dough still clips to blue = 0 across large areas. Frosting
still reads as matte plastic. And from the hero camera, the lagoon is still a dry cream
floor at the bottom of a pit. The biggest remaining problem is **material and form at
the terrain scale**, not lighting.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 7 | 7 | 7 | 6 | 6 | 5 | 7 | 7 | 7 | 6 | – | – | 6.5 |
| m2-ground | 6 | 6 | 7 | 6 | 6 | 5 | 4 | 6 | 6 | 5 | – | – | 5.7 |
| m2-closeup-donut | 6 | 6 | 7 | 7 | 6 | 5 | 5 | 6 | 6 | 5 | – | – | 5.9 |
| m2-lagoon-edge | 6 | 6 | 7 | 6 | 5 | 6 | 6 | 6 | 7 | 5 | – | – | 6.0 |
| m2-low-tier | 7 | 7 | 6 | 6 | 6 | 5 | 7 | 7 | 7 | 6 | – | 7 | 6.5 |

Gate mean ≈ **6.1** (needs ≥ 9.0, and ≥ 8.5 for low tier). Min **4**. Every shot has several
categories below 8.

## Blockers
- **[m2-ground] Staircase frosting terrain (§10.2; §2 "silhouettes are staircases").** On the
  right, from about x 1480–1920 and y 730–900, the frosting slope is a stack of terraces with
  hard step edges about 25–35 px tall and wide. It looks like a pink Minecraft hillside with
  1/8 m-scale yellow and red sprinkle "bricks" (about 30x12 px) lying on the steps. The
  left-hand slope (x 0–330, y 710–850) is the same. The macro patches (`IslandTerrain.ts`
  `buildMacro`, line ~216) only cover `Zone.Meadow` and `Zone.Path`, so frosting near a
  ground camera stays at the coarse/FINE resolution. This was fix #5 last iteration and it is
  **not fixed**.
- **[m2-closeup-donut, m2-ground] Visible mesh seams and doubled edges where the macro patch
  meets the coarser terrain (§10.1).**
  - Closeup, lower right (x 900–1900, y 700–1080): several thin dark curved lines cut across
    the path like cracks. The right path edge is a doubled orange band with a sawtooth step
    pattern, where the coarse edge pokes through or sits beside the 1/128 m skin.
  - Closeup, top (x 720–1000, y 20–190): the far path shows horizontal terrace bands, because
    the path is coarse beyond the patch.
  - Ground, lower left (x 250–700, y 980–1080): a doubled, rope-like curved outline is drawn on
    the path in front of the donut.
  All of these read as geometry errors. Source: the `MACRO_SKIN` replacement and the patch
  disc boundary in `IslandTerrain.ts` (`buildMacro`, `inDetail`).
- **[m2-lagoon-edge, m2-hero, all shots] Pure-saturation dough fills; the gamut is still
  clipping (§4 "avoid pure-saturation fills on large areas", §10.7).** Pixels with a channel
  at 0: lagoon-edge **21.1 %**, ground 8.6 %, hero 7.7 %, low-tier 7.4 %, closeup 2.0 %.
  Samples:
  - lagoon-edge dough wall (300,700) = (141,85,0) and (1500,700) = (106,50,0)
  - hero underside (900,980) = (124,66,0)

  The palette dough `#E8A85C` has blue = 92, so the wall reads as Cheeto orange, not baked
  dough. The new `ColorGrade.ts` saturation limit is correct, but it can't help, because its
  first line `clamp(inputColor.rgb, 0.0, 1.0)` already receives negative or zero blue from
  upstream (the AgX output or the HDR material color). The fix has to happen before the
  grade.
- **[m2-hero, m2-low-tier] From the hero camera the lagoon still reads as a dry cream floor in
  a pit (RF-02; NOTES 01 "Ignore": the flat cream slab).** In the hero (x 720–1130, y
  400–590) the milk is an opaque peach-white plane. The hard tree and pier shadows lie on it
  like on a floor. It shows no fresnel, no sky tint, no reflection of the drips or lighthouse,
  and no ripple glints. The inner wall is still 2–3 m of vertical dough above the milk. The
  lagoon-edge camera proves that the water shader works at grazing angles. At the hero angle
  it does nothing.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Smooth frosting terrain near ground cameras. **Where:** extend `buildMacro` in
   `src/game/world/IslandTerrain.ts` to `Zone.Frosting`/rim. Or replace the frosting
   heightfield quantization with a smooth SDF swell at 1/32 m or finer, and stamp terrain
   sprinkles as 1/32 m capsules. **Target:** in m2-ground, no frosting step is taller than
   ~12 px. Both side slopes read as rounded glossy swells. No terrain sprinkle is bigger than
   about 12x4 px.
2. **What:** Remove the macro-patch seams. **Where:** `IslandTerrain.ts` (`MACRO_SKIN`, patch
   radius and blend, the coarse/fine cull under the patch). **Target:** no dark lines and no
   doubled or sawtooth edges on the path in m2-closeup-donut or m2-ground. Either feather the
   patch boundary out of frame, or make the coarse surface carve out exactly where the macro
   skin starts. The far path in the closeup should not show terrace bands.
3. **What:** Stop the blue channel clipping to 0. **Where:** the material base colors and wrap
   lighting in `src/engine/render/Materials.ts` (`jitteredLinear`), and the AgX stage in
   `Renderer.ts`. Use gamut compression before tone mapping, or reduce the saturation boost in
   the dough wrap/subsurface term. **Target:** fewer than 0.5 % of pixels in any shot have a
   zero channel. The lagoon-edge wall samples land near the `#E8A85C` → `#B86B32` family,
   with blue ≥ 30.
4. **What:** Make the hero lagoon read as milk. **Where:** `src/engine/render/Water.ts`
   (fresnel term and reflection strength at steep view angles), `Reflection.ts`, and the lagoon
   level in `islandShape.ts`. **Target:** from the hero camera the milk shows:
   - a soft sky-tinted fresnel gradient
   - a broken sun glint path
   - a soft reflection of the pink drips and the lighthouse
   - a cream foam line along the wall and the pier posts
   - shadows softened by the scattering surface, not hard floor shadows

   Raise the milk to within about 1 m of the meadow, or add a sloped dough beach, so it no
   longer looks like a pit.
5. **What:** Make the frosting glossy. **Where:** the gloss flags and roughness in `palette.ts`
   and `Materials.ts` (the new "broad glaze sheen" is too weak). **Target:** the rim frosting
   in the hero (lower-left front, x 420–900, y 560–800) and the donut tops in ground and closeup
   show clear sun specular streaks and a fresnel rim, and you can tell frosting from dough by
   sheen alone. In the hero grayscale, the pink drips currently vanish into the dough wall,
   so give them a value separation too.
6. **What:** Make the donut frosting a smooth dome, not concentric terraces. **Where:**
   `src/art/models/donut.ts` (the frosting shell SDF and drip shapes). **Target:**
   - In m2-closeup-donut (x 640–1280, y 360–720) the top no longer shows concentric contour
     rings, and the steps are ≤ 6 px.
   - The drips are rounded and vary in width and length, with bulb ends. Right now there are
     five identical rectangular tabs, about 90 px wide, that read like a crown.
   - The ground-shot donut is the same.
   - The chocolate donut behind it in the ground shot (x 560–750, y 710–770) still reads as a
     dark basket floating above the grass. Give it contact and a visible glaze highlight.
7. **What:** Use finer foreground grass and flowers in the ground shot. **Where:** the
   `grassTuft.ts` macro grass, flower stamps, and the `ground` lift (0.3 m) in
   `src/debug/scenes/m2Meadow.ts`. **Target:**
   - The foreground blades are tapered, varied-height strands, not flat-topped 10–14 px pegs.
   - Foreground flowers are ≤ 25 px across. The orange bloom at about (1760,1050) is about
     90 px, and the lilac ones at (1400,990) and (110,1000) are about 60 px.
   - In the closeup, the lower-left grass reads as soft strands, not rounded 20 px pegs.
8. **What:** Fix the lagoon-edge wall's grain and the hovering sprinkles. **Where:** the strata
   logic and jitter in `IslandTerrain.ts`, and the sprinkle placement in
   `src/art/models/sprinkleTree.ts`. **Target:** the inner wall (lagoon-edge, x 0–1920,
   y 560–820) shows no vertical streak grain. The dark brown strata read as soft toasted
   bands, not wood-grain lines. Canopy sprinkles sit flush on the canopy. In lagoon-edge, many
   stand out like hairs or pins along the silhouettes of the pink tree (x 280–580, y 280–420)
   and the right tree (x 1630–1910, y 240–420).
9. **What:** Fix the milk reflection artifacts in lagoon-edge. **Where:** `Reflection.ts` and
   `Water.ts`. **Target:** the pink vertical smears (x 330–420 and x 1150–1250, y 900–1080)
   and the gray pier-reflection band (x 950–1100, y 870–1080) become soft, ripple-broken
   reflections that match the objects above them. Also add a visible foam ring where the milk
   meets the wall along its whole base.
10. **What:** Clean up the hero framing and the clouds. **Where:** the hero camera in
    `m2Meadow.ts` and `buildCloud` in `src/art/models/smallProps.ts`. **Target:**
    - No cloud clipped by the bottom or right edge: currently at x 980–1210, y 1015–1080;
      x 150–290, y 1055–1080; and x 1830–1920, y 920–1050.
    - Cloud edges are softer and less stepped.
    - The underside silhouette (x 640–1300, y 940–1005) no longer shows a coarse staircase.
    - The amber syrup waterfall (a Follow item in 01) is barely readable at about (810,350).
      Make it a clear glossy amber ribbon.

## Previous review fix-list status (reviews/M2-iter1-r2.md)
1. Near grass as micro-voxels: **partly fixed.** The macro patch has finer grass, but it is
   still flat-topped pegs, and the foreground flowers are still 60–90 px.
2. Re-author the wild donut: **partly fixed.** It has a hole, a dough band and drips. The
   frosting still shows concentric terraces, and the drips are uniform tabs.
3. Glossy frosting: **partly fixed.** There are faint glints on the closeup donut top. The
   hero rim and the drips are still matte.
4. Milk reads as liquid: **partly fixed.** At lagoon-edge there are ripples, reflections and
   waterlines. In the hero it is not fixed.
5. Staircase frosting terraces and terrain sprinkle bricks: **not fixed.**
6. Corrugated cliff striping: **partly fixed.** The hero outer wall is good now. The inner
   lagoon wall still has vertical grain and wood-grain strata.
7. Bloom threshold: **fixed.** No halo on the grass or frosting. The lighthouse and windows
   glow correctly.
8. Clouds: **mostly fixed.** They are cream-white now with soft lilac undersides. They are
   still clipped at the frame edges and still a bit stepped.
9. Contact AO: **partly fixed.** The floating donuts have waterlines, and the closeup donut
   sits well. The ground chocolate donut still floats.
10. Bakery details and ground composition: **mostly fixed.** The broken braces are gone, the
    awning has some depth, and the lighthouse and canopy crops are gone. The bakery is now a
    clear midground anchor.

Also noted: the gamut clipping blocker from reviewer 1 (`M2-iter1.md` #2) is **not fixed** in
effect. See blocker 3.

## What is working (keep it)
- The hero outer drum now bulges, with crumb noise and varied, overlapping drips. It is a big
  step toward 01.
- The clouds are cream, with lilac undersides and a cloud bed under the island. The island no
  longer hangs in a void.
- The bloom is disciplined. Only the lighthouse lamp and the bakery windows glow, and the
  lagoon-edge sunset glow behind the lighthouse is the best mood in the gate.
- The lagoon-edge milk: ripple rings around floating donuts, waterlines and backlit sheen.
  This is the right direction.
- The closeup donut now reads as a donut, with an open hole, a dough band and a soft contact
  shadow on the path.
- The bakery in the ground shot is charming. It has warm windows, flower boxes, a donut emblem
  instead of text, and a chocolate-shingle roof with cruller trim.
- The overall layout fidelity to 01 is good, with the RF-01 ring island kept.
- The low tier is nearly identical to high, with no broken effects. The lighthouse glow is
  reduced but acceptable.

## Store-page test: no
At thumbnail size the hero is a pleasant, coherent diorama. Next to reference 01, though,
the frosting is matte, the lagoon is a dry cream floor in a pit, and the dough is a
clipped orange. Any premium listing would also include a ground-level shot. Here, that shot
still shows pink terraces and peg grass, which is the Minecraft read the art bible exists to
prevent.

## Regression check
No previously passed graphics gate has `final/` shots with shared content (`shots/M0/final` and
`shots/M1/final` are engine test scenes with no gate), so there is nothing to regress against.
Within M2, nothing got worse compared to iter 1. Every previous item held or improved.

```json
{"gate":"M2","iter":"2-r2","verdict":"FAIL","mean":6.1,"min":4,"blockers":4,"store_page":false}
```
