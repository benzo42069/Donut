# Review M2 iter 6
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M2 --iter 6` at commit `6fa5b77`.
- **Harness:** exit 0, SwiftShader fallback, 10 files in `shots/M2/6/`, 549 s.
- **What I viewed:**
  - every 1920x1080 PNG in full
  - a contact sheet of all five 844x390 PNGs
  - 1.2–8x nearest-neighbour crops of:
    - hero: sugar hill, lagoon, bakery and lighthouse, front rim, meadow
    - ground: path, donut, right field and pink tree, left meadow, roof
    - closeup: donut, lower-left corner, top band
    - lagoon-edge: lighthouse shaft, left and right inner walls (8x cell count), floating donut, pier, bakery
    - low tier: sugar hill, lagoon
  - a grayscale render of the hero
- **Measurements:**
  - an isolated-speck detector (luma < 40, at least 60 below the 8-neighbour mean), with the hits inspected: all are on bakery timbers, chimney mortar and pier rail tips
  - clipping stats: ≤ 1.1 % of pixels at ≥ 250 and 0 % at ≤ 8, in every shot
  - 5x5-averaged colour samples
  - lagoon versus bakery luminance
  - sky banding: max step 1
  - high/low tier mean absolute difference: 3.6/255
- **References:** I viewed 01–04 and judged fidelity only against the "Follow" lists in `art/reference/NOTES.md`.

**Summary:** this is the best iteration so far, and the first with **zero instant-fail blockers**. All four iter-5 blockers are gone:
- the sugar-hill pit
- the lighthouse veins
- the faceted syrup sheet
- the Lego-scale floating donut (it now sits at about 5 px per voxel)

The candy hue hold also worked: every frosting sample in every shot now falls at hue 338–349°.

But this is a cleanup pass, not a beauty pass. Not one category reaches 8 in any shot. The images are now clean but plain:
- matte, clay-like frosting with square slab drips
- a muddy café-au-lait lagoon from above
- a featureless egg for a sugar mountain
- a dark carpet meadow in the hero and grey-teal "real grass" up close
- a closeup frame that is mostly empty grass

**Gate mean: about 6.5**, up from 6.2. The bar is 9.0.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 7 | 7 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 6 | n/a | n/a | 6.7 |
| m2-ground | 6 | 7 | 6 | 6 | 6 | 6 | 6 | 7 | 7 | 6 | n/a | n/a | 6.3 |
| m2-closeup-donut | 6 | 6 | 7 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | n/a | n/a | 6.4 |
| m2-lagoon-edge | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 6 | 7 | 6 | n/a | n/a | 6.6 |
| m2-low-tier | 6 | 7 | 6 | 6 | 7 | 5 | 7 | 7 | 7 | 6 | n/a | 6 | 6.4 |

- **Gate mean:** about **6.5**. It needs at least 9.0, or at least 8.5 for the low tier.
- **Min:** **5** (low-tier materials).
- **Categories at 8 or above:** none, in any shot.
- **Plateau (§5):** the means were 6.1 at iter 4, 6.2 at iter 5 and 6.5 at iter 6, a gain of 0.4 over two iterations, so the plateau rule is not triggered this time. Iteration 8 is still the escalation point, and the remaining gap of 2.5 points will not close with parameter passes.

## Blockers
None. I checked every shot against the art bible §10 list:
- **Holes:** the iter-5 holes (sugar pit, faceted sheet) are gone. No z-fighting or flicker either.
- **Specks:** the detector hits are all legitimate dark timber.
- **Clipping:** no clipping and no crushed blacks.
- **Sky:** no banding.
- **Density:** at the gameplay-height lagoon-edge camera, the inner dough wall now measures about 10–13 px per cell. That is at the ~12 px terrain limit, not clearly over it, so I score it rather than block on it (see fix 5).

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Make the hero lagoon read as cream milk, not a muddy floor.
   - **Colour:** the lagoon (hero x 760–1100, y 440–590) averages `#C5A696` (hue 22°, S 0.24, V 0.77). That is café-au-lait or dishwater grey-beige. Lowering the albedo to 0.4x darkened it from iter 5 but did not make it read as milk.
   - **Value:** at luma 172 against 125 for the bakery wall, it is still the brightest mass on the island.
   - **Reflections:** from above the only visible reflection is a big sky V wedge. There is no pink drip reflection band along the far wall, and no foam line at the wall base. The low tier draws foam rings round the floaters, so the tech exists.
   - **Where:** the `Water.ts` albedo, the sky-mix weight (`sky * 0.8`, `fr * 0.6`) and the reflection `k` weighting.
   - **Target:**
     - the milk hue is 35–45° (cream) with saturation ≤ 0.15
     - lagoon mean luma ≤ bakery plaster luma + 10
     - a soft pink and gold reflection band of the drips along the far wall, visible at hero distance
     - a 2–4 px cream foam line where the milk meets the dough wall, in both tiers
2. **What:** Make the gloss on every donut and on the rim read like ref 04. The hue is fixed; the sheen is not.
   - **Closeup donut:** still a smeared pale blotch on the front lip (x 900–1000, y 540–575) and a soft glow in the hole. There is no crisp sun streak. It reads as pink clay or plastic.
   - **Ground subject donut:** fully matte. Its top is `#A66B80` (V 0.65, S 0.35), a dusty mauve, because the whole foreground sits in shade.
   - **Hero rim:** one faint highlight on the right curve and nothing on the drips.
   - **Lagoon-edge floater:** the only frosting that reads glossy, with a rim streak on its upper inner edge. Use it as the target.
   - **Where:** `Materials.ts`, the two-lobe glaze: the `pow(rl, 90)` streak needs a light direction the camera actually sees, or a view-dependent env or matcap term. Also the ground shot's key and fill in `m2Meadow.ts`.
   - **Target:**
     - every donut top has one crisp, elongated highlight plus a fresnel rim
     - the closeup front-lip blotch is gone
     - the ground subject donut frosting reaches V ≥ 0.8 and is the highest-contrast object in its frame
3. **What:** Re-author the sugar mountain.
   - **Today:** the pit is fixed, but the cap is now a smooth, featureless egg (hero x 470–600, y 355–480). Its flat value ramp has no drifts, no crags and no silhouette breakup.
   - **Base:** the gingerbread base is a shapeless brown clay blob, with an arch-shaped hole at about (563–583, 537–543) where the path shows through. The arch is in both tiers.
   - **Ref 01's "Follow" item:** a craggy gingerbread cone with powdered-sugar snow pooled on its ledges.
   - **Where:** `IslandTerrain.ts`, the Zone.Sugar and Zone.Rock height and colour functions.
   - **Target:**
     - a cone that reads as a peak, with a broken, drifting snow line
     - at least 3 visible rock ledges with sugar on their top faces
     - no see-through arches at the base
4. **What:** Fix the meadow colour and value, in the hero and up close.
   - **Hero:** the meadow (x 950–1250, y 680–760) is `#44724E` at V 0.45, a dark carpet that reads as noise and fights the frosting. Ref 01's meadow is light mint-green with flower sprinkles.
   - **Ground and closeup:** the new tapered blades are a real improvement. But the ground grass is a grey-teal `#527243` that reads as a realistic wheat field, not a candy meadow.
   - **Flowers in ground:** they are 8–10 px square pegs with flat caps (left foreground, x 0–560, y 700–1080).
   - **Target:**
     - hero meadow mean V ≥ 0.6, hue 95–130°
     - ground grass that reads as candy green in a side-by-side with ref 01
     - flower stems at most 1 voxel (≤ 4 px), with rounded 5-petal blooms, no flat-capped pegs
5. **What:** Re-author the lagoon-edge inner wall.
   - **Left curtain (x 0–280, y 650–830):** flat-topped rectangular slabs with a dark vertical slit between them at x ≈ 185. Pale `frostingPinkLight` rectangles are stamped on the vertical face (x 150–260, y 675–700), so it reads as a quilt, not a drip.
   - **Dough:** still vertical column grain, at about 10–13 px per cell.
   - **Where:** the inner-wall strata and drip generation in `IslandTerrain.ts`.
   - **Target:**
     - every inner-wall drip tapers to a bulb, like the right-hand ones now do
     - no pale rectangles on vertical frosting faces
     - dough cells ≤ 10 px at this camera
     - horizontal baked strata as in ref 01, not vertical grain
6. **What:** Re-author the drips on the donut asset.
   - **Today:** every wild donut has 3–4 square-ended slab drips:
     - closeup: x 740–800, x 1150–1190
     - ground: x 560–600, x 750–790
     - lagoon-edge floater: the bottom edge
   - **Ref 04:** many drips of varied length, each with a rounded bead tip.
   - **Where:** `donut.ts`, the drip loop.
   - **Target:** 6–10 drips per donut with lengths varying 2–4x, each ending in a rounded bead at least 1 voxel wider than its neck. No flat-bottomed drips.
7. **What:** Clean up the ground shot.
   - **Path seams:** both remain:
     - a light curved band with dark edges at x 880–1025, y 870–910
     - a dark diagonal scratch at x 430–680, y 990–1050
   - **Right-hand frosting field:** carries a dark trench (x 1550–1900, y 760–830) that reads as a gash.
   - **Pink tree (x 1390–1690, y 330–600):** still a two-tone camouflage blotch with 15–20 px sprinkle bricks.
   - **Far frosting:** the far left field has 20–25 px red and yellow sprinkle bricks along its crest (x 0–230, y 735–750).
   - **Target:**
     - no linear marks on the path
     - no trench
     - sprinkles ≤ 6 px long everywhere
     - the tree canopy reads as a sprinkle ball (rounded lobes, AO between lobes), not a camo sphere
8. **What:** Fix the mobile framing (844x390). The iter-6 aspect fix kept horizontal coverage but now cuts things vertically:
   - **lagoon-edge:** the lighthouse lamp donut is cut by the top edge
   - **ground:** the chimney and roof peak are cut by the top edge
   - **hero:** the island's base is cut by the bottom edge, and the smoke by the top
   - **Where:** `m2Shot` in `m2Meadow.ts`. Fit on both axes, using the smaller of the two FOVs.
   - **Target:** no hero prop or the island silhouette touches any frame edge at either resolution.
9. **What:** Recompose the closeup so the donut is a hero.
   - **Size:** the donut covers only about 25 % of the frame width.
   - **Empty frame:** about 60 % of the frame is flat grass and path with two large hard tree-shadow wedges.
   - **Dough band:** an over-saturated, near-clipping orange `#F6A164` (S 0.59, V 0.97).
   - **Top edge:** a burnt-orange gingerbread sliver remains (x 600–1060, y 0–20).
   - **Ref 02 "Follow":** a low camera, crumbs scattered around the donut, and something glowing on the horizon.
   - **Target:**
     - the donut covers at least 45 % of the frame width
     - a few voxel crumbs and a fallen sprinkle or two around its base
     - the dough band at V ≤ 0.9 and S ≤ 0.5 in the sun
     - nothing cut at the top edge
10. **What:** Give the bakery charm to match its new prominence.
    - **Today:** in ground it fills about 40 % of the frame but reads as a plain Tudor box with a straight-edged gable.
    - **Awning (x 1180–1370, y 395–470):** washed out almost to white.
    - **Roof:** darker blotches with no shingle rhythm.
    - **Ref 01 "Follow" item:** a cruller-roof bakery with chocolate shingles. The cruller ridge is good. The roof needs a visible row-by-row shingle scallop and a glossy chocolate glint, and the awning needs saturated stripes.
    - **Where:** `bakery.ts`.
    - **Target:**
      - shingle rows legible at ground distance
      - awning stripes at S ≥ 0.4
      - one more candy detail on the façade (an icing trim under the eave, or a sprinkle border)

## What is working (keep it)
- **Candy hue hold (`MAT.candy`, `HUE_HOLD` in `Materials.ts`):** strawberry now reads as strawberry in every shot (hue 338–349°). This was the right diagnosis.
- **Sugar-hill pit, lighthouse veins and faceted syrup sheet:** all gone. The lighthouse stripes are clean, even bands.
- **Bakery plaster:** fine cream stucco with sparse crumbs. The 1/32 m prop rule is met.
- **Lagoon-edge:**
  - the backlit sun disk behind the lighthouse
  - the glowing donut lamp
  - the soft milk reflections of the drips and trees
  - the glossy floater with its rim streak
  This is still the most charming frame and the closest to a store image.
- **Milk shadows:** the 9-tap soft shadow made the tree shadows on the milk soft, no longer hard grey wedges.
- **Tapered grass blades:** no teal base shows anywhere.
- **Sky and clouds:** a clean golden-hour gradient (max step 1), fine-voxel clouds with soft edges, and no clipping anywhere.
- **Low tier:** visually near-identical to high (MAD 3.6/255), with no broken effects. Its foam rings round the floaters are a nice touch to bring to the high tier.

## Store-page test: no
- **Beside ref 01:** the hero is a tidy, coherent island but clearly a tier below. It has matte clay frosting, a grey-beige lagoon, an egg-shaped mountain and a dark carpet meadow. Nothing in it makes a child gasp.
- **The near shots:** lagoon-edge is close, held back only by the quilted wall and the boxy pier. But the closeup, the shot meant to sell the donut, is mostly empty grass around a matte donut with slab drips. Ground reads as a realistic grass field in front of a plain house.
- **The verdict:** a premium listing would not lead with any of these.

## Previous-review check (reviews/M2-iter5.md fix list)
| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Strawberry, glossy frosting | **Partly fixed** | The hue is fixed: 338–349° in every shot, against 355–5° before. The gloss is crisp only on the lagoon-edge floater. The closeup blotch remains, and the ground donut is matte at V 0.65. |
| 2 | Sugar-hill pit | **Fixed** | No dark spot at hero x 460–640, y 330–560 in either tier (cap `#EAC0A9`, V 0.92). The new problem is form (fix 3). |
| 3 | Lighthouse veins | **Fixed** | The lagoon-edge shaft at 3x shows uniform stripes with fine jitter only. |
| 4 | Faceted sheet and teal gaps in the closeup | **Fixed** | The lower-left is clean voxel path with relief. No teal anywhere. |
| 5 | Hero milk reads as milk | **Partly fixed** | The shadows are soft now. It is still the brightest mass (luma 172 against 125), it shifted toward grey-beige, there is no drip reflection band from above, and the low tier has no env term. |
| 6 | Lagoon-edge density | **Partly fixed** | The floater is now about 5 px per voxel, OK. The wall is about 10–13 px with column grain. The right drips are now tapered; the left curtain is slab-like. |
| 7 | Grass blades | **Partly fixed** | The blades taper and there is no teal base. The colour is now grey-teal, the hero meadow is still a dark carpet, and the flower stems are square pegs. |
| 8 | Ground cleanup | **Not fixed** | The path seams, the camo pink tree and the large sprinkles remain, and there is a new trench in the right field. |
| 9 | Framing and focal read | **Partly fixed** | At 1920x1080 nothing is cut and the ground bakery is crisp. The closeup top band is reduced to a sliver. **Mobile regressed:** there are new vertical cuts (fix 8). |
| 10 | Bakery plaster density | **Fixed** | Fine stucco in ground and lagoon-edge. |

Reviewer 2's iter-5 fixes for the sugar disc, the faceted plane and the strawberry hue are covered in rows 2, 4 and 1 above.

## Regression check
- **Earlier gates:** `shots/M0/final` and `shots/M1/final` are engine test scenes with no shared M2 assets or lighting, so there is nothing to regress against.
- **Within M2, against iter 5:**
  - **Mobile framing:** the 844x390 crops now cut the lighthouse lamp (lagoon-edge), the chimney (ground) and the island base (hero) at the top and bottom edges.
  - **Hero milk:** a little darker and greyer: `#D4B6A6` at V 0.84 became `#C5A696` at V 0.77, with the same hue, so it reads muddier, not creamier.
  - **Sugar hill:** it lost its pit but also lost what little form it had.
  - **Everything else:** equal or better.

```json
{"gate":"M2","iter":6,"verdict":"FAIL","mean":6.5,"min":5,"blockers":0,"store_page":false}
```
