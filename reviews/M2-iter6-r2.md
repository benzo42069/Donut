# Review M2 iter 6 (reviewer 2 of the ★ double gate)

Capture: `npm run shots -- --gate M2 --iter 6-r2` at commit `6fa5b77` (clean tree) → `shots/M2/6-r2/`.
- Exit 0, 10 files in 549 s, SwiftShader fallback.

What I looked at:
- All 10 frames (1920x1080 and 844x390), viewed in full.
- Nearest-neighbour zoom crops (2–5x) of:
  - hero: sugar hill, lagoon, bakery and lighthouse, front rim
  - closeup: the donut, its drips (4x), the upper-left corner
  - ground: the donut, the bakery wall, the right pink tree and field
  - lagoon-edge: the inner wall, the floating donut, the lighthouse lamp
  - low tier: the bakery roof (4x), the lagoon
  - mobile: the ground top edge and the hero bottom edge
- Numpy checks: clipping, isolated dark pinholes (luma < 40 and ≥ 60 below the 8-neighbour mean), 5x5 colour samples and grayscale region means.
- References 01–04, judged only against the "Follow" lists in `art/reference/NOTES.md`.
- Comparison with `shots/M2/5-r2/`.

## Verdict: FAIL

Iteration 6 removed both blockers from iteration 5:
- The grey disc on the sugar hill is gone.
- The faceted syrup sheet in the closeup is gone, with no teal gaps.

The closeup frosting is also finally strawberry pink (hue 346°, not coral).

But the gate is still far from the bar:
- **Categories:** none reaches 8.
- **Unchanged problems:** most of the visual problems from the last two reviews have not been touched:
  - the boxy bakery
  - the flush lagoon-wall drips with wood-grain dough
  - the tab drips on the closeup donut
  - the milk is still the brightest mass in the hero
  - the sprinkles stay sharp inside the depth-of-field blur
  - the low-tier milk is still flat
- **Gate mean:** about **6.5**, against a bar of 9.0.

This iteration was a cleanup. The art quality did not step up.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | – | – | 6.9 |
| m2-ground | 6 | 7 | 7 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | – | – | 6.4 |
| m2-closeup-donut | 6 | 6 | 7 | 6 | 7 | 6 | 6 | 6 | 6 | 6 | – | – | 6.2 |
| m2-lagoon-edge | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 6 | 7 | 6 | – | – | 6.6 |
| m2-low-tier | 6 | 7 | 6 | 6 | 6 | 5 | 7 | 7 | 7 | 6 | – | 6 | 6.3 |

- **Gate mean:** about **6.5**. The bar is ≥ 9.0, and ≥ 8.5 for the low tier.
- **Min:** **5**.
- **Categories at 8 or above:** none.
- **Plateau (§5):** the mean went 6.2 → 6.3 → 6.5. That is +0.2 per iteration, still under the 0.3-over-two-iterations threshold. Escalate per §5.

## Blockers
None found this iteration:
- no holes, light leaks, shadow acne or z-fighting found at zoom
- clipping is 0.000 % pure white and 0.000 % pure black in all 10 frames
- the pinhole-detector hits are all on legitimate dark timber or shingle edges

The FAIL comes from pass-bar items 2, 3 and 4 (category scores, mean and the store-page test), not from item 1.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Make the milk recede so the bakery and lighthouse cluster is the focal contrast in the hero. Soften the shadows on the milk.
   - **Measured now:** the hero lagoon's grayscale mean is **169** (it was 187). The bakery is 110, the lighthouse 126 and the meadow 117, so the milk is still by far the brightest mass on the island. The eye lands on a beige puddle, not on Glazey's world.
   - **Shadows:** the tree shadows on the milk are crisp straight bands (hero x 1000–1100, y 440–590). A large inverted pink V reflection (the bakery gable, x 880–1010, y 400–500) reads as a stain rather than a reflection.
   - **Where:** albedo and fresnel in `Water.ts`, l.125 and l.242. Also the reflection blur and strength under `uReflect`.
   - **Target:**
     - the lagoon's grayscale mean is ≤ 150
     - the shadow penumbrae on the milk are ≥ 2× wider than on the meadow
     - reflections are blurred enough to read as soft colour, not a shape
2. **What:** Re-author the closeup donut drips and dough so this frame sells the prop.
   - **Drips:** the frosting drips are still flat-cut tabs (closeup x 725–760, y 515–590 and x 820–870, y 570–620). Each has a hard horizontal step from the light top pink to the darker side pink, square bottoms and no bulb.
   - **Dough:** the band is orange pixel speckle (`#F7A265`, hue 25°, value 0.97) with no golden-to-toasted gradient. There is no AO line under the frosting overhang.
   - **Contact:** there is barely any contact shadow under the donut on the path side.
   - **Where:** `src/art/models/donut.ts`.
   - **Target, as in reference 04:**
     - rounded drips that bulge 1–2 voxels proud with bulb ends
     - a continuous colour across the lip
     - an AO line under the glaze edge
     - the dough grading from golden on top to toasted at the base
     - a soft contact shadow all round
3. **What:** Fix depth-of-field compositing for sprinkles.
   - **Problem:** the pink tree in the ground shot (x 1390–1690, y 330–720) is blurred, but its sprinkles render pin-sharp on top. They look like stickers floating in front of the blur.
   - **Not fixed:** this is the same as last iteration's fix 6.
   - **Path seam:** the thin dark curve across the ground path (x ≈ 830–1015, y ≈ 870–910) is also still there.
   - **Where:** the sprinkle instanced layer versus the depth that the `DepthOfFieldEffect` pass reads (`Renderer.ts` l.130). Also check the path mesh seam in `IslandTerrain.ts`.
   - **Target:** the sprinkles blur with their surface, and there is no line across the path.
4. **What:** Give the lagoon-wall drips thickness, and turn the wood-grain dough into baked strata.
   - **Drips:** in lagoon-edge (x 0–1920, y 650–830) the drips are still painted flush on the wall with no contact shadow. At x 0–260 they are straight-sided rectangles.
   - **Dough:** it is still vertical wood-grain zig-zag. The hero front rim (x 500–1100, y 860–990) has the same zebra-grain strata.
   - **Target:** the drips stand 1–2 voxels proud with an AO line, and the dough shows soft horizontal toasted strata as in reference 01.
5. **What:** Give the sugar mountain real form.
   - **Fixed:** the grey disc is gone.
   - **Problem:** the cap (hero x 470–620, y 355–470) is now a featureless smooth cream dome, like a bald head or mushroom cap. It sits on a lumpy brown mass with a dark cave-like hollow (x 540–600, y 520–550). The mass reads as a mud blob, not a craggy gingerbread mountain.
   - **Target:**
     - a peaked silhouette as in reference 01
     - sugar dusted over the top faces only, with irregular drip edges down the slopes
     - a stepped, craggy gingerbread base lit by the sun
6. **What:** Bakery form: wobbly roof and cruller trim.
   - **Problem:** the bakery is still a grid-aligned box with a dead-straight ridge and eaves (§2 "wobbly roofs"). In the ground shot the plaster is a uniform panel grid.
   - **Not fixed:** this is the same as last iteration's fix 8.
   - **Where:** `src/art/models/bakery.ts`.
   - **Target:** the ridge sags and the eaves sit 1–3 voxels out of line, with a rounded cruller trim and roof shingles that catch a sun specular.
7. **What:** Frosting consistency in the ground shot.
   - **Fixed:** the closeup (346°) and hero rim (344°) are now on target.
   - **Problem:** the ground frosting field is still dusty mauve (`#9D697C` at (150,770) and `#9E6879` at (1700,880), value 0.62). The ground donut reads mauve too (`#A66B80`).
   - **Where:** the per-shot fog and grade in `m2Meadow.ts` and `ColorGrade.ts`, or the shadow-side colour.
   - **Target:** all frosting has value ≥ 0.55 and hue 330–350°, with saturation that matches the other shots.
8. **What:** Syrup waterfall and pool presence.
   - **Problem:** the amber waterfall from reference 01 is now only a small yellow slab (hero x 795–835, y 365–410). It has no fall, no splash and no glow.
   - **Target:** a visible ribbon of syrup falling into the milk, with a translucent amber gradient and a splash ring.
9. **What:** Mobile framing.
   - **Problem:** in `m2-ground_844x390` the chimney and its smoke are cut by the top edge (x 440–480). In both lagoon-edge frames the foreground floating donut's drips touch or cross the bottom edge.
   - **Partly fixed:** the lighthouse and the tree from last iteration are no longer cut.
   - **Where:** the per-aspect cameras in `m2Meadow.ts`.
   - **Target:** no hero prop touches any frame edge at either aspect.
10. **What:** Low-tier milk and props.
    - **Problem:** the low-tier lagoon is still a flat grey-beige disc with ripple rings. Its grayscale std is 34 and there is no sky fresnel or reflection. The donut lamp has no glow. The detector flags 55 hits on the low tier, mostly on the bakery roof (x 850–1000, y 150–320); at 4x they are shingle gaps, not flecks.
    - **Target:** the low tier has a cheap sky-tinted fresnel and a lamp emissive, and keeps its charm (≥ 8.5 mean).

## Previous review fix-list status (reviews/M2-iter5-r2.md)
1. **Sugar-hill disc and form: partly fixed.**
   - **Fixed:** the disc is gone.
   - **Not fixed:** the form is now a smooth dome on a mud-like base (fix 5).
2. **Faceted syrup plane and teal gaps: fixed.** Closeup x 0–330, y 640–870 is now grass and path with no facets and no teal.
3. **Frosting hue and gloss: partly fixed.**
   - **Fixed:** the closeup is 346° and the hero rim 344°. The closeup shows a specular streak in the inner ring and along the front.
   - **Not fixed:** the ground stays mauve (value 0.62), and the gloss is still modest.
4. **Closeup donut as hero: partly fixed.**
   - **Fixed:** the colour is right now, and the burnt-orange top band is smaller (x 600–1060, y 0–20).
   - **Not fixed:** the drips are still tabs, and the dough is still speckle with no gradient.
5. **Milk value and shadows: partly fixed.**
   - **Improved:** the mean went from 187 to 169.
   - **Not fixed:** the milk is still the brightest mass, the shadows are crisp, and the low tier is unchanged.
6. **DoF sprinkles and path line: not fixed.**
   - **Ground-field stripes:** these are no longer visible.
7. **Lagoon-wall drips and dough: not fixed.**
8. **Bakery form: not fixed.**
9. **Mobile framing: partly fixed.** The old crops are gone, but there are new ones (fix 9).
10. **Low-tier roof dither: partly fixed.** The flecks are not visible at 4x, but the detector count went up because of the shingle gaps.

## What is working (keep it)
- **Clean tech:** there is no clipping, no holes and no light leaks, and the closeup ground is clean.
- **Hero rim drips:** varied, tapered and beaded. Frosting is on hue across the hero.
- **Closeup donut colour:** finally strawberry frosting, with a visible spec streak.
- **Lagoon-edge mood:** the backlit lighthouse with a glowing donut lamp and the pink reflections. It is still the best frame.
- **Golden-hour light:** long tree shadows in the closeup and hero. The puffy clouds are finer than reference 01's (correct per NOTES).
- **Sprinkle-ball trees:** they read as rounded at hero distance.

## Store-page test: no
- **At thumbnail size:** the hero is a coherent, cute floating donut island.
- **Next to reference 01:**
  - the lagoon is a big bright beige puddle that dominates the frame
  - the sugar mountain is a bald dome on a mud lump
  - the waterfall has shrunk to a slab
  - the bakery is a box
- **The near shots:** they would show tab drips, sticker sprinkles over blur and wood-grain walls.

This is solid indie-prototype quality, not a premium listing.

## Regression check
- **Earlier gates:** `shots/M0/final` and `shots/M1/final` are engine test scenes (test cube and a flat terrain disc) with no shared M2 assets. Nothing regresses.
- **Compared with M2 iter 5:**
  - Nothing shared got worse.
  - The sugar-hill form traded the grey disc for a featureless dome. That is a net technical gain, but no artistic gain.
  - The syrup falls are visually smaller.

```json
{"gate":"M2","iter":"6-r2","verdict":"FAIL","mean":6.5,"min":5,"blockers":0,"store_page":false}
```
