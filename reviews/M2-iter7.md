# Review M2 iter 7
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M2 --iter 7` at commit `4a70000`.
- **Harness:** exit 0, SwiftShader fallback, 10 files in `shots/M2/7/`, 551 s.
- **What I viewed:**
  - every 1920x1080 PNG in full
  - a contact sheet of all five 844x390 PNGs
  - 1.2–6x nearest-neighbour crops of:
    - hero: lagoon (and the same crop from iter 6), the reflection chevron at 5x, sugar hill, the arch at 6x, front rim, bakery and lighthouse
    - ground: donut, path, right field and pink tree, roof, left meadow
    - closeup: donut, gloss at 4x, sunlit grass
    - lagoon-edge: left curtain, floater, pier, lamp, trees
  - iter 6's lagoon-edge and closeup, for the regression check
- **Measurements:**
  - 5x5 and region-mean colour samples
  - clipping stats: 0.00 % of pixels at ≥ 250 and 0.00 % at ≤ 8, in every shot
  - high/low tier mean absolute difference: 3.8/255
- **References:** I viewed 01–04 and judged fidelity only against the "Follow" lists in `art/reference/NOTES.md`.

**Summary:** iteration 7 is a **sideways step**. Two things improved:
- **Wild-donut drips:** they now taper to rounded tips (ground donut, closeup), which is a real step toward ref 04.
- **Closeup and mobile hero:** the closeup is tighter, and the mobile hero no longer cuts the island.

Most of the iter-6 fix list was not touched:
- **Hero lagoon:** byte-for-byte the same colour as iter 6: `#C4A495` against `#C5A696`.
- **Hero meadow:** the same dark carpet, V 0.50.
- **Sugar cap:** still a featureless egg.
- **Ground cleanup:** the path seams, the trench, the camouflage sprinkle bricks on the pink tree and the peg flowers are all unchanged.
- **Bakery:** the roof and awning are unchanged; `bakery.ts` is not in the diff.
- **Lagoon-edge left curtain:** unchanged.

And one thing regressed: moving the foreground floater emptied the lagoon-edge foreground.

**Gate mean: about 6.5**, the same as iter 6. Not one category reaches 8 in any shot. The bar is 9.0. This is now a plateau (see Scores), and parameter tweaks will not close a 2.5-point gap.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 7 | 7 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 6 | n/a | n/a | 6.7 |
| m2-ground | 6 | 7 | 6 | 6 | 6 | 6 | 6 | 7 | 7 | 6 | n/a | n/a | 6.3 |
| m2-closeup-donut | 6 | 7 | 7 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | n/a | n/a | 6.5 |
| m2-lagoon-edge | 7 | 6 | 7 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | n/a | n/a | 6.4 |
| m2-low-tier | 6 | 7 | 6 | 6 | 7 | 5 | 7 | 7 | 7 | 6 | n/a | 6 | 6.4 |

- **Gate mean:** about **6.5** (6.45). It needs at least 9.0, or at least 8.5 for the low tier.
- **Min:** **5** (low-tier materials).
- **Categories at 8 or above:** none, in any shot.
- **Plateau (§5):** the means were 6.2 at iter 5, 6.5 at iter 6 and 6.5 at iter 7. That is +0.0 over the last iteration and +0.3 over two.
  - **Iter 8 is the last before escalation.** The builder should treat iter 8 as a **structural change** under §5, not another tuning pass.
  - **Candidates:**
    - a re-authored lagoon material
    - a re-authored sugar mountain
    - a re-authored bakery roof
    - a new gloss model (an env or matcap term the camera actually sees)

## Blockers
None. I checked every shot against the art bible §10 list:
- **Clipping:** no clipping and no crushed blacks (0.00 % / 0.00 %).
- **Z-fighting:** none, and no flicker.
- **Holes:** no mesh holes I can confirm (see the arch note in fix 3).
- **Density:** the lagoon-edge inner dough and the pier posts are about 10–12 px per cell, at the art bible §3 limit but not clearly over it. I score these rather than block on them.
- **Ground donut dough:** about 8–10 px per voxel, but the ground camera is a low beauty camera, not the default gameplay camera, so the 6 px rule does not strictly bind.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Make the hero lagoon read as cream milk. This is the **third iteration** with the same muddy result. The iter-7 changes (albedo 0.4→0.45, depth mix 0.7→0.3, reflection `k` raised) left it measurably unchanged.
   - **Colour:** `#C4A495` (hue 20°, S 0.24, V 0.77) at hero x 760–1100, y 440–590.
   - **Value:** luma 170, still the brightest mass on the island.
   - **The dominant reflection:** a grey V-shaped smudge in mid-lagoon (x 855–965, y 425–495). It is the bakery gable mirrored as a dirty grey wedge with a pink blot inside, plus pale diagonal light bands in the lower lagoon (x 880–1000, y 520–600). From above it reads as a stain, not a reflection.
   - **Structural suggestion:** stop tuning the planar mirror at this angle. Fresnel at about 45° down should give a mostly diffuse, cream, slightly translucent surface. Pick one of these:
     - clamp the reflection weight to fresnel only (no 0.6 floor) for steep views
     - add a cream subsurface or scatter term, and tint the reflection toward milk
   - **Where:** `Water.ts`, the `k = clamp((0.6 + fres) * uReflect …)` floor and the albedo and emissive terms.
   - **Target:**
     - hero lagoon hue 35–45° with S ≤ 0.15
     - no dark wedge or diagonal bands in mid-lagoon
     - a soft pink and gold drip-reflection band only along the far wall
     - a 2–4 px foam line at the wall base
2. **What:** Make the frosting gloss read like ref 04. Clearcoat 0.22→0.4 and lobe exponent 8→20 did not change the read.
   - **Closeup (x 860–1060, y 360–600):**
     - a soft blob in the hole
     - a cluster of pale smudges on the front lip (x 900–1000, y 545–580)
     - no crisp, elongated streak and no fresnel rim
     - it still reads as pink clay or plastic
   - **Ground donut top:** `#B07386`, V 0.69, a dusty mauve in shade.
   - **New lagoon-edge floater:** `#A26D77`, V 0.64, matte. Iter 6's rim streak is gone with the move.
   - **Where:** `Materials.ts`, the glaze lobe. A sun-dependent `pow(rl, N)` only fires when the reflection vector meets the sun. Add a view-dependent env or matcap highlight (a sky-gradient reflection) so gloss reads from any camera.
   - **Target:**
     - every donut top shows one crisp, elongated highlight plus a fresnel rim at every gate camera
     - no blob clusters
     - the ground donut frosting at V ≥ 0.8
3. **What:** Re-author the sugar mountain. This is still not fixed.
   - **Cap:** the same smooth, featureless egg (hero x 470–600, y 355–480, `#CBB6A0`). The drift noise added in `islandShape.ts` is invisible at hero distance.
   - **Gingerbread skirt:** now crisper, but still a single brown lump with no ledges carrying sugar.
   - **Arch:** a pale, path-coloured see-through lens remains under the skirt lip at about (565–580, 535–542), smaller than in iter 6.
   - **Where:** `islandShape.ts` (the sugar height function) and `IslandTerrain.ts` (Zone.Sugar/Rock).
   - **Target:**
     - a peaked cone silhouette
     - a broken snow line that drips down the gullies
     - at least 3 ledges with sugar on their top faces
     - no see-through gap at the base
4. **What:** Fix the hero meadow value and the ground grass colour.
   - **Hero meadow:** unchanged at `#6A7E58`, V 0.50 (x 950–1250, y 680–760).
   - **Ground grass:** `#578259`, V 0.50, still a grey-teal field. The candy flag only shows in sunlit closeup grass (`#7EB570`, which is good).
   - **Ground flowers:** still flat-capped square pegs (left foreground).
   - **Where:** the grass palette and value in `palette.ts`, and the ground shot's fill and bounce in `m2Meadow.ts`. The shade fill is too dark and too cool for candy grass.
   - **Target:**
     - hero meadow V ≥ 0.6 at hue 95–130°
     - ground grass in shade at V ≥ 0.6
     - the closeup's rounded 5-petal flowers used in ground too (they already exist in the closeup)
5. **What:** Re-author the lagoon-edge left curtain. This is not fixed.
   - **Today (x 0–280, y 650–830):**
     - flat rectangular slabs
     - a dark vertical slit at x ≈ 185
     - pale `frostingPinkLight` rectangles stamped on the vertical face (x 150–260, y 675–700)
   - **Dough:** about 10–12 px cells.
   - **Where:** the inner-wall drip generation in `IslandTerrain.ts`.
   - **Target:**
     - every wall drip tapers to a bulb, like the right-hand ones
     - no pale rectangles on vertical faces
     - no slit
     - dough cells ≤ 10 px
6. **What:** Restore a foreground subject in lagoon-edge. This is a regression.
   - **Iter 6:** a large glossy strawberry floater anchored the lower-right third.
   - **Iter 7:** that floater is moved to (1510–1730, 815–890). It is now small, matte and half cropped by its own position. The lower 25 % of the frame is just reflection.
   - **Where:** the `floaters` table in `MeadowDiorama.ts`.
   - **Target:**
     - a glossy floater, or a fallen sprinkle cluster, in the lower third
     - at least 12 % of the frame width
     - it carries the frame's strongest specular
7. **What:** Clean up the ground shot. Nothing here has changed since iter 6.
   - **Path:** a light curved band with dark edges (x 880–1025, y 870–910) and a dark diagonal scratch (x 430–680, y 990–1050).
   - **Right frosting field:** a dark trench (x 1520–1900, y 760–830).
   - **Pink tree:** now monotone, which is good, but a fuzzy ball with 15–20 px sprinkle bricks and no lobes.
   - **Far-left crest:** 20–25 px red and yellow sprinkle bricks (x 0–230, y 735–750).
   - **Target:**
     - no linear marks on the path
     - no trench
     - sprinkles ≤ 6 px long everywhere
     - a lobed sprinkle-ball canopy with AO between the lobes
8. **What:** Give the bakery its candy charm. This is not addressed; `bakery.ts` is untouched.
   - **Roof (ground x 640–1200, y 60–460):** still blotchy brown with no shingle rows and no chocolate glint.
   - **Awning (x 1180–1370, y 395–470):** washed out to near white.
   - **Target:**
     - legible scalloped shingle rows at ground distance
     - a glossy chocolate glint on the roof
     - awning stripes at S ≥ 0.4
     - one more candy trim on the façade
9. **What:** Fix the closeup composition and dough. The donut is better at about 33 % of the frame width, against 25 % before, but:
   - **Dough band:** still `#F8AC77` (S 0.52, V 0.97), near clipping and over-saturated.
   - **Tree shadows:** two hard-edged wedges still cut across the path and grass. They are the strongest value shapes in the frame and pull the eye off the donut.
   - **Set dressing:** no crumbs and no fallen sprinkles (ref 02 "Follow").
   - **Target:**
     - the donut covers at least 45 % of the frame width
     - the dough band at V ≤ 0.9 and S ≤ 0.5
     - shadow edges softened, or moved out of the frame centre
     - 5–10 voxel crumbs around the base
10. **What:** Fix the mobile ground framing.
    - **Steam:** the top puff of chimney steam touches the top edge.
    - **Composition:** with `keep: 'height'` and the yaw, the subject donut is about 15 % of the frame width, low in the frame, under a big empty sky.
    - **Where:** the `ground.wide` plan in `m2Meadow.ts`.
    - **Target:**
      - nothing touches the frame edges
      - the subject donut at least as large, relative to the frame, as at 16:9

## What is working (keep it)
- **Wild-donut drips:** they now taper to rounded tips (ground donut x 560–600 and 750–790, and the closeup). This is the first real form improvement on the donut asset.
- **Closeup grass in sun:** candy mint, with rounded 5-petal flowers on single-voxel stems. This is what the ground shot's grass should look like.
- **Mobile hero:** the island now fits wholly, top to bottom.
- **Lagoon-edge:**
  - the backlit sun, the glowing lamp donut and the gallery
  - the soft milk reflections of the drips and trees
  - the right-hand tapered wall drips
- **Clean tech:** no clipping, no specks found, and no banding.
- **Sprinkle glints:** the ones on the back of the ground donut are a lovely touch.
- **Pink tree:** the monotone pink removed the camouflage split.
- **Low tier:** visually near-identical to high (MAD 3.8/255), with no broken effects.

## Store-page test: no
The hero is a tidy, readable island but clearly a tier below ref 01:
- a grey-beige lagoon with a dirty grey wedge reflection
- a featureless egg mountain
- a dark carpet meadow
- matte clay frosting

The near shots don't rescue it:
- **Ground:** a realistic grass field in front of a plain house.
- **Closeup:** a pastel-plastic donut under hard shadow wedges.
- **Lagoon-edge:** still the most charming frame, but it lost its foreground subject.

A premium kids' listing would not lead with any of these.

## Previous-review check (reviews/M2-iter6.md fix list)
| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Hero lagoon reads as cream milk | **Not fixed** | `#C4A495`, hue 20°, S 0.24, luma 170, against `#C5A696` and luma 172 in iter 6. The grey V-wedge reflection persists. There is no drip band and no visible foam line from above. |
| 2 | Gloss on every donut | **Not fixed** | The closeup still has blob highlights and no streak. The ground donut is at V 0.69. The new floater is matte. |
| 3 | Re-author the sugar mountain | **Partly fixed** | The skirt is crisper and the arch is smaller. The cap is still a smooth egg, with no ledges and no snow line. |
| 4 | Meadow colour and value | **Partly fixed** | Closeup sunlit grass is now candy mint. The hero meadow is unchanged at V 0.50, the ground grass is unchanged at `#578259`, and the flowers in ground are still pegs. |
| 5 | Lagoon-edge inner wall | **Not fixed** | The slabs, the slit at x ≈ 185 and the pale stamps are all still there. |
| 6 | Donut drips | **Partly fixed** | The drips are tapered with rounded tips. They are still 3–4 per visible side, not 6–10, and the floater's drips read as a scalloped skirt. |
| 7 | Ground cleanup | **Not fixed** | The pink tree is monotone now. The seams, the trench and the large sprinkles all remain. |
| 8 | Mobile framing | **Partly fixed** | The hero fits and the lagoon-edge lamp is in frame. The ground steam touches the top edge, and the donut is tiny. |
| 9 | Closeup composition | **Partly fixed** | The donut is at 33 % width and the top sliver is gone. The dough band is still S 0.52 / V 0.97. The hard shadow wedges remain, and there are no crumbs. |
| 10 | Bakery charm | **Not fixed** | `bakery.ts` is unchanged. The roof has no shingle rows, and the awning is washed out. |

## Regression check
- **Earlier gates:** `shots/M0/final` and `shots/M1/final` are engine test scenes with no shared M2 assets or lighting, so there is nothing to regress against.
- **Within M2, against iter 6:**
  - **Lagoon-edge foreground (regression):** the large glossy strawberry floater that anchored the lower third, and that the iter-6 review named the gloss target, was moved and is now small and matte (fix 6).
  - **Closeup:** better (tighter framing).
  - **Mobile hero:** better.
  - **Everything else:** equal.

```json
{"gate":"M2","iter":7,"verdict":"FAIL","mean":6.5,"min":5,"blockers":0,"store_page":false}
```
