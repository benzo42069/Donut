# Review M2 iter 7 (reviewer 2 of the ★ double gate)

Capture: `npm run shots -- --gate M2 --iter 7-r2` at commit `4a70000` (clean tree) → `shots/M2/7-r2/`.
- Exit 0, 10 files in 554 s, SwiftShader fallback.

What I looked at:
- All 10 frames (1920x1080 and 844x390), viewed in full.
- Nearest-neighbour zoom crops (2–3x) of:
  - closeup: the donut and its drips
  - ground: the pink tree, the near donut and the path
  - hero: the lagoon, the sugar mountain, the front rim
  - lagoon-edge: the inner wall
  - low tier: the lagoon
- Numpy checks: clipping, grayscale region means, 5x5 HSV samples.
- Side-by-side comparison with `shots/M2/6-r2/`.
- References 01–04, judged only against the "Follow" lists in `art/reference/NOTES.md`.

## Verdict: FAIL

Iteration 7 barely moved the image. The mean absolute luma difference from iteration 6 is:

| shot | change from iter 6 |
|---|---|
| hero | 0.64 / 255 |
| ground | 0.51 / 255 |
| low tier | 0.59 / 255 |
| lagoon-edge | 3.7 / 255 (reflection strength and a moved floating donut) |
| closeup | 19.3 / 255 (a camera reframe and new grass colour, not new modelling) |

The commit message promises five things. None of them reads in the frames:
- **"Proud beaded drips":** the closeup donut now has only 4 short stubs on its whole visible front.
- **"Craggy sugar skirt":** not visible. The mountain is still a bald dome on a mud lump.
- **"Cleaner milk":** the hero lagoon mean is 167 (was 169).
- **Unchanged problems:** the bakery, the depth-of-field (DoF) sprinkles, the mauve ground frosting, the wall drips and the low-tier milk did not change.

There are no blockers. The FAIL comes from pass-bar items 2, 3 and 4.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | – | – | 6.9 |
| m2-ground | 6 | 7 | 7 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | – | – | 6.4 |
| m2-closeup-donut | 6 | 7 | 7 | 6 | 6 | 6 | 6 | 5 | 6 | 7 | – | – | 6.2 |
| m2-lagoon-edge | 7 | 7 | 7 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | – | – | 6.5 |
| m2-low-tier | 6 | 7 | 6 | 6 | 6 | 5 | 7 | 7 | 7 | 6 | – | 6 | 6.3 |

- **Gate mean:** about **6.5**. The bar is ≥ 9.0, and ≥ 8.5 for the low tier.
- **Min:** **5**.
- **Categories at 8 or above:** none.
- **Plateau (AGENTIC_LOOP §5):** the mean went 6.3 → 6.5 → 6.5. That is +0.0 this iteration, so the loop has plateaued. **Escalate to the user. Do not run another tweak pass.**
  - The remaining gap (about 2.5 points) is asset authoring, not parameter tuning:
    - the bakery
    - the mountain
    - the drips and strata
    - the DoF compositing

## Blockers
None found:
- 0.000 % pure white and 0.000 % pure black in all five 1080p frames
- no holes, acne, z-fighting or light leaks found at zoom

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Re-author the closeup donut's drips. The beads did not land.
   - **Problem:** at 2x (closeup x 640–1280, y 280–680) the outer edge has only 4 drips:
     - left x 640–670
     - front x 790–830, y 590–640
     - two on the right, x 1190–1230
   - **Shape:** each is a short square-ended tab with a hard step from light-top pink to dark-side pink. No bead or bulb is visible at any of them, and the remaining 80 % of the lip is a dead-level line.
   - **Dough:** still orange pixel speckle (hue about 25°), with no golden-to-toasted gradient and no AO line under the glaze lip.
   - **Sprinkles:** they sit in two neat concentric rings, which looks mechanical (reference 04 scatters them).
   - **Where:** `drip()` in `src/art/models/donut.ts`. `hash3 < 0.25 → len 0` plus the narrow `half` leaves most segments without a drip, and the bead (0.009 m, `across` cutoff 0.55) is under one voxel at this scale.
   - **Target, as in reference 04 top-left:**
     - 10 or more drips across the visible front, varied in length, each bulging at least 2 voxels proud with a round bulb
     - a continuous colour over the lip
     - a dark AO line under the glaze
     - dough from golden on top to toasted at the base
     - sprinkles scattered randomly
2. **What:** Fix DoF compositing for sprinkles. This is the third iteration it has been reported.
   - **Problem:** ground pink tree (x 1390–1690, y 330–720): the canopy is blurred, but the sprinkles on it are pin-sharp 3–6 px rectangles. They read as stickers floating in front of the blur, and also as Lego-scale chips.
   - **Where:** the instanced sprinkle layer has to write the depth that `DepthOfFieldEffect` reads (`src/engine/render/Renderer.ts`), or render before the DoF pass.
   - **Target:** the sprinkles blur exactly as much as their canopy.
3. **What:** Fix the hero lagoon's focal pull and the reflection stain.
   - **Brightness:** the lagoon mean is still **167** (bakery 109, lighthouse 132, meadow 136). The milk remains the brightest mass on the island.
   - **Stain:** the bakery gable reflection is now a **dark grey inverted-V outline** (hero x 860–960, y 430–500; clear at 3x). It reads as a smudge or crack on the milk.
   - **Shadows:** the tree shadow bands on the milk (x 1000–1100) are still crisp-edged straight bands.
   - **Where:** `Water.ts`. Raising `k` to 0.6+fres made the reflection sharper and harsher, not softer.
   - **Target:**
     - the lagoon mean is ≤ 150
     - reflections are blurred to soft colour with no readable outline
     - milk shadow penumbrae are ≥ 2× wider than on the meadow
4. **What:** Fix the lagoon-edge milk reading as glass.
   - **Problem:** in lagoon-edge (y 830–1080) the reflection is now a near-mirror. The house windows, trees and drips are reflected crisply, with wobble. The surface reads as glass or pond water, not milk (NOTES 02: "cream white, soft specular").
   - **Target:** cream body colour dominant (≥ 60 % of the mixed colour), with a soft, blurred reflection.
5. **What:** Give the lagoon-wall drips thickness, and turn the wood grain into strata. Not fixed for 3 iterations.
   - **Drips:** in lagoon-edge (x 0–560, y 650–830) they are still flat rectangles painted flush on the wall, with no contact shadow.
   - **Dough:** vertical zig-zag wood grain everywhere, including the hero front rim (x 500–1150, y 860–990).
   - **Where:** `IslandTerrain.ts`, the wall drip and strata generation.
   - **Target:** drips 1–2 voxels proud with AO, and soft horizontal toasted strata as in reference 01.
6. **What:** Give the sugar mountain real form.
   - **Problem:** hero x 470–620, y 355–470. At 3x it is still a smooth bald cream dome with no peak and no drip edge. It sits on a brown corrugated mass with a dark hollow at its base. No "craggy skirt" is visible.
   - **Target:**
     - a peaked silhouette as in reference 01
     - sugar on the top faces only, with irregular drip edges down the slopes
     - a stepped, sunlit gingerbread base
7. **What:** Bakery form. Untouched in 3 iterations.
   - **Problem:** a grid-aligned box with a dead-straight ridge and eaves, and a panel-grid plaster wall (ground x 640–1450, y 30–750).
   - **Where:** `src/art/models/bakery.ts`.
   - **Target:**
     - a sagging ridge and eaves 1–3 voxels out of line
     - a rounded cruller trim
     - chocolate shingles with sun specular
8. **What:** Ground frosting colour.
   - **Measured:** still mauve: `#9D697C` at (150,770), `#9E6879` at (1700,880) and `#B07287` at (640,830). That is saturation 0.33–0.35 and value 0.62–0.69, against 344–346° and much higher saturation in the hero and closeup.
   - **Target:** hue 330–350° with saturation ≥ 0.45, matching the other shots.
9. **What:** Path seam and closeup grass.
   - **Path seam:** the thin dark curve across the ground path (x 830–1020, y 870–910) is still there.
   - **Closeup grass:** the new "candy grass" is a pale, low-contrast mint (closeup right half). It flattens the value structure around the donut and looks hazy.
   - **Target:** no line on the path, and grass with a clear light-to-shadow value range (≥ 60 luma between sunlit and shadowed blades).
10. **What:** Low-tier milk.
    - **Measured:** still a flat beige disc (mean 182, std 34) with ripple rings, and no sky fresnel.
    - **Target:** a cheap sky-tinted fresnel and a darker body, so the low tier reaches a ≥ 8.5 mean.

## Previous review fix-list status (reviews/M2-iter6-r2.md)
1. **Milk recession, soft shadows and blurred reflection: not fixed.**
   - The mean went 169 → 167.
   - The reflection is sharper, and the V is now a dark outline.
2. **Closeup drips and dough: not fixed.**
   - The drips are still tabs, and there are now fewer of them.
   - The dough is unchanged, and there is still no AO line.
   - **Partly better:** contact shadow on the right.
3. **DoF sprinkles and path line: not fixed.**
4. **Lagoon-wall drips and strata: not fixed.**
5. **Sugar mountain form: not fixed.** There is no visible change.
6. **Bakery form: not fixed.**
7. **Ground frosting colour: not fixed.** It is the same mauve.
8. **Syrup waterfall: not fixed.** It is still a small slab (hero x 795–835, y 365–410).
9. **Mobile framing: partly fixed.**
   - **Fixed:** in lagoon-edge 844x390 the floating donut no longer crosses the bottom edge.
   - **Not fixed:** in ground 844x390 the chimney smoke still touches the top edge (x 490–520).
10. **Low-tier milk: not fixed.**

## What is working (keep it)
- **Clean tech:** no clipping, holes, acne or light leaks in any frame.
- **Closeup reframe:** the donut now fills more of the frame, and the long golden-hour tree shadows across path and grass are lovely.
- **Hero rim drips:** varied and tapered. The frosting is on hue across the hero.
- **Lagoon-edge backlight:** the glowing donut lamp, the low sun haze and the warm windows. It is still the best mood frame.
- **Clouds:** puffy and finer than reference 01's (correct per NOTES).
- **Sprinkle-ball trees:** they read as rounded at hero distance.

## Store-page test: no
- **At thumbnail size:** the hero reads as a cute floating donut island.
- **Next to reference 01:**
  - the brightest thing in frame is a beige puddle with a grey V smudge on it
  - the mountain is a bald dome on mud
  - the waterfall is a slab
  - the bakery is a box
  - the rim is zebra wood grain
- **The near shots:** they would expose tab drips, sticker sprinkles over blur and flat painted wall drips.

Solid prototype quality, not a premium listing.

## Regression check
- **Earlier gates:** `shots/M0/final` and `shots/M1/final` are engine test scenes (a test cube and a flat terrain disc) with no shared M2 assets. Nothing regresses.
- **Compared with M2 iter 6:**
  - **Hero and lagoon-edge milk reflection:** harsher. A dark V outline in the hero and mirror-like glass in lagoon-edge. This is a minor visual step back.
  - **Closeup grass:** paler and lower-contrast.
  - **Closeup drips:** they now read as fewer and stubbier because of the closer camera.

```json
{"gate":"M2","iter":"7-r2","verdict":"FAIL","mean":6.5,"min":5,"blockers":0,"store_page":false}
```
