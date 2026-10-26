# Review M2 iter 5
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M2 --iter 5` at commit `dac9c93`.
- **Harness:** exit 0, SwiftShader fallback, 10 files in `shots/M2/5/`, 541 s.
- **What I viewed:**
  - every 1920x1080 PNG
  - a contact sheet of all five 844x390 PNGs
  - 2–6x nearest-neighbour crops of:
    - hero: sugar hill, lagoon, bakery and lighthouse, front rim; plus a hero/low-tier lagoon comparison
    - ground: path, right frosting field, pink tree, roof, left meadow
    - closeup: donut, lower-left patch, grass, top band, path
    - lagoon-edge: bakery corner, lighthouse shaft, left and right walls, floating-donut dough band
- **Measurements:**
  - an isolated-speck detector (luma < 40, at least 60 below the 8-neighbour mean), with every hit inspected
  - clipping stats
  - 5x5-averaged colour samples
  - lagoon versus bakery luminance
  - sky banding steps
- **References:** I viewed references 01–04 and judged fidelity only against the "Follow" lists in `art/reference/NOTES.md`.

Summary: iteration 5 is a real cleanup pass, but not a quality jump.

**Fixed:**
- **MSAA-resolve pinholes:** gone. All 112 detector hits across the five shots are on legitimately dark bakery timbers and door frames, not holes.
- **Bakery light leak:** gone, and the grey soffit is now shingled.
- **Closeup path contour lines:** gone.
- **Milk clipping:** no longer clips. The hero lagoon has 0 % of pixels at ≥ 245, down from 7 %.
- **Roof:** finally reads as chocolate.

**Still open from the last two reviews:**
- the grey pit on the sugar hill
- crack veins on the lagoon-edge lighthouse
- the faceted low-poly sheet in the closeup
- coral, matte frosting on the hero and the subject donut
- grass pegs on a teal base
- the milk reading as a pale floor from above
- the Minecraft-scale lagoon wall

**Gate mean: about 6.2**, against 6.1 at iter 4 and 6.0 at iter 3. That is the **third consecutive plateau** (§5). The bar is 9.0.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 7 | 7 | 7 | 6 | 7 | 5 | 7 | 7 | 7 | 5 | n/a | n/a | 6.5 |
| m2-ground | 6 | 7 | 7 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | n/a | n/a | 6.2 |
| m2-closeup-donut | 5 | 6 | 7 | 6 | 5 | 5 | 6 | 5 | 5 | 5 | n/a | n/a | 5.5 |
| m2-lagoon-edge | 7 | 7 | 7 | 6 | 7 | 6 | 5 | 6 | 7 | 5 | n/a | n/a | 6.3 |
| m2-low-tier | 6 | 7 | 6 | 6 | 7 | 5 | 7 | 7 | 7 | 5 | n/a | 6 | 6.3 |

- **Gate mean:** about **6.2**. It needs at least 9.0, or at least 8.5 for the low tier.
- **Min:** **5**.
- **Categories at 8 or above:** none, in any shot.

## Blockers
- **[m2-hero, m2-low-tier] The grey pit on the sugar hill is still there (§10.1 holes; flagged as blocker 3 by reviewer 2 at iter 4).**
  - **Hero:** a grey oval about 25 px across sits on the upper-left face of the sugar cap, centred at (545,390). It samples `#A19897` (S 0.06, V 0.63) against a cap of about `#F5DCC8`. At normal viewing distance it reads as a hole punched in the mountain, the most reference-critical prop from 01.
  - **Low tier:** a softer version sits in the same place, so SSAO is not the only cause.
  - **Likely sources:** in `IslandTerrain.ts`, around l.222–280:
    - the coarse/fine handoff (`coarseFilled`, `fineZone` with `below < 1.0`) leaving a cavity at the steepest part of the cap
    - or the `macro && surf - y < MACRO_SKIN` skip carving a pocket on the slope
- **[m2-lagoon-edge] Crack veins on the lighthouse shaft are not fixed (§10.1).**
  - **Where:** x 935–1050, y 260–660.
  - **What:** grey branching vertical vein lines run through every white stripe and through the red ones. They are now grey rather than black, so the speck detector misses them, but at 1:1 the candy stripes still read as cracked plaster or birch bark.
  - **Where to look:** they follow the lathe column boundaries, so look at per-column colour jitter or the AO and normal discontinuities between columns in `src/art/models/lighthouse.ts` and `mesh.ts`.
- **[m2-closeup-donut] The faceted low-poly sheet is not fixed (§10.9 placeholder look, §2 "flat-color micro-voxels").**
  - **Where:** lower-left, x 0–230, y 680–900.
  - **What:**
    - a flat yellow plane with visible large triangles and no voxel relief
    - a crenellated fringe of orange block teeth along its edge
    - teal base showing between it and the grass
  - Both iter-4 reviewers flagged it, and it is unchanged.
- **[m2-lagoon-edge] The density rule is broken at the gameplay-height near camera (§3, §10.2).**
  - **Inner-wall dough:** the cells under the right-hand drips measure about 13–14 px (x 1380–1720, y 660–830) against the ~12 px terrain limit. They read as Lego columns with vertical wood-grain striping.
  - **Floating pink donut:** the dough band cells measure about 7 px (x 1150–1450, y 920–990) against the ~6 px prop limit, and its sprinkles are 20x10 px bricks.
  - This is the shot a player sees from the pier.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Make the frosting strawberry-coloured and glossy, which the iter-5 changes moved away from.
   - **Hue:** the commit says "frosting stays strawberry", but it does not:
     - hero rim (700,780) = `#F29498`, hue 357°
     - closeup donut top (950,470) = `#FAA19D`, hue 3°
     - ground field (150,770) = `#9D6A82`, a dusty mauve at V 0.62
     - only lagoon-edge reaches 346°
     It is still Glazey's coral family.
   - **Gloss:** iter 5 made it worse on purpose:
     - `roughGloss` went 0.16 → 0.26
     - `glaze` went 0.9 → 0.7
     - the lobe exponent went 22 → 9 in `Materials.ts`
     The result is a smeared pale blotch on the closeup donut front (x 880–1020, y 570–620), not a highlight.
   - **Where:** `palette.ts` frosting entries, which need a cooler base to survive the warm key. Also `Materials.ts`: a tight lobe plus a broad clearcoat, not one broad dim lobe.
   - **Target:**
     - every frosting sample in every shot at hue 330–350° and value ≥ 0.6
     - one crisp sun streak per donut top and on the hero rim's sun-facing curve
     - a fresnel rim at grazing angles
     - in grayscale, the hero rim drips separate from the dough behind them
2. **What:** Remove the sugar-hill pit.
   - **Where:** see the blocker; `IslandTerrain.ts`, Zone.Sugar.
   - **Target:** at hero x 460–640, y 330–560, no spot more than 30 luma below its surroundings, in both tiers.
3. **What:** Remove the lighthouse veins.
   - **Target:** in lagoon-edge, each stripe of the shaft is a uniform band with only fine ±4 % value jitter. No connected dark lines longer than 3 voxels.
4. **What:** Remove or re-author the closeup's faceted yellow sheet and its teal gaps.
   - **Where:** probably `SYRUP_SHEET` or a butter pool in `IslandTerrain.ts` or `m2Meadow.ts`.
   - **Target:** either a real voxel syrup pool with relief, gloss and AO, or nothing. No triangle facets and no teal visible anywhere in the frame.
5. **What:** Make the hero milk read as milk from above.
   - **Problems today:**
     - The lagoon (x 740–1120, y 420–600) averages luma 188, against 124 for the bakery wall, so it is still the brightest mass on the island.
     - The tree and lighthouse shadows are hard-edged grey wedges.
     - No drip or lighthouse reflection is visible from this angle.
     - The low tier is flat cream with no reflection at all.
     - Lagoon-edge shows that the reflection pass works, so the hero's problem is fresnel weighting and albedo, not missing tech.
   - **Where:** `Water.ts` and `Reflection.ts`.
   - **Target:**
     - lagoon mean luma ≤ bakery plaster
     - shadow penumbra on the milk at least 3x wider than on the meadow
     - a visible pink drip reflection band along the far wall
     - a cream foam line at the wall base
     - the low tier gets at least an env or fresnel term
6. **What:** Bring the lagoon-edge foreground under the density rule.
   - **Where:** `donut.ts`, the floating donut instances (author them at 1/64 m for near shots), and the inner-wall strata in `IslandTerrain.ts`.
   - **Target:**
     - at most 6 px per voxel on the floating donut and at most 12 px on the near wall
     - no vertical column striping
     - the right-hand wall drips (x 1250–1800, y 680–830) tapered with bulbs, like the left-hand ones, not square-topped slabs
7. **What:** Replace the grass pegs with tapered blades.
   - **Where:** `grassTuft.ts` and the macro grass.
   - **Problems today:**
     - The closeup (x 1100–1600, y 700–1000) and the ground foreground (x 0–640, y 700–1080) are still flat-capped square pegs, about 10 px wide, with teal showing between them.
     - In the hero the meadow reads as dark-green carpet noise.
   - **Target:** blades taper to a 1-voxel tip and are at most 8 px wide, with no flat caps and no teal ground.
8. **What:** Clean up the ground shot.
   - **Path crack:** the lighter band with dark edges crossing the path at x 870–1010, y 870–905 is unchanged.
   - **Frosting slope:** the right field (x 1500–1920, y 780–900) still carries faint horizontal light streaks. The crosshatch is reduced, not gone.
   - **Sprinkles:** on the slope and the pink tree they are 15–20 px bricks, larger than the surrounding voxels. Use 1x1x3 at 1/32 m.
   - **Pink tree (x 1390–1690, y 330–600):** a camouflage blotch of two pinks, with no gloss and no form.
   - **Target:** a clean path, a smooth slope, and sprinkles at most 6 px long.
9. **What:** Fix the near-camera framing and the focal read.
   - **Mobile crops:**
     - `m2-ground_844x390` still cuts the lighthouse at the right edge
     - `m2-lagoon-edge_844x390` cuts a tree at the right edge
   - **Closeup top band (x 0–1200, y 0–60):** still the saturated burnt-orange gingerbread mass.
   - **Ground:** heavy DoF blurs the bakery, the shot's main subject, so the frame has no sharp focal point beyond the small donut.
   - **Target:**
     - no hero prop cut by any frame edge
     - the subject has the strongest value contrast in its frame
     - in ground, the bakery reads crisp enough to see the window boxes and roof
10. **What:** Fix the bakery plaster density.
    - **Where:** `bakery.ts`.
    - **Today:** in lagoon-edge (x 0–200, y 330–650) and ground, the plaster is still 12–15 px marshmallow cobbles with orange flecks.
    - **Target:** stucco at most 6 px per cell, matching the 1/32 m prop rule.

## What is working (keep it)
- **Pinholes:** gone. The MSAA diagnosis was correct and well isolated with `?nomsaa`, and SMAA alone still gives clean silhouettes.
- **Bakery:** no light leak. The roof reads as chocolate shingles with a caramel cruller ridge cap, much closer to ref 01's "Follow" item.
- **Closeup path:** clean, packed sugar with soft tree shadows. No contour lines.
- **Milk clipping:** gone in every shot. The lagoon-edge reflections of drips and trees, with ripple breakup and the chocolate donut's glint ring, are lovely.
- **Hero drips:** the front rim now has tapered drips of varied length that end in points. This is a real improvement over the iter-4 curtains.
- **Light and sky:** the golden-hour gradient from warm upper right to cool lower left is clean. The sky has no banding (max step 1) and nothing clips to pure black or pure white.
- **Lagoon-edge mood:** the backlit lighthouse with its glowing donut lamp and steam is still the most charming frame in the gate.
- **Low tier:** nearly identical to high (mean absolute difference 3.7/255), with no broken effects.

## Store-page test: no
At thumbnail size the hero is a pleasant, coherent floating donut island.

Beside ref 01 it is clearly a tier below:
- coral, matte frosting with no gloss
- a lagoon that reads as a pale floor with grey shadow wedges
- a sugar mountain with a hole in it
- a dark carpet-noise meadow

The near shots, which a premium listing would also show, are weaker still:
- grass pegs on teal
- a low-poly yellow sheet in the closeup
- Lego-scale dough walls and a cracked lighthouse in lagoon-edge

## Previous-review check (reviews/M2-iter4.md fix list)
| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Relaxation artifacts (cracks, lattice, scribbles) | **Partly fixed** | The ground-frosting crosshatch is reduced to faint streaks. The donut zig-zag glints are gone, replaced by a smeared blotch. The lighthouse veins remain. |
| 2 | Lighthouse pinholes | **Fixed** | 0 true specks in hero and low tier. All detector hits are on timbers. |
| 3 | Clean path | **Partly fixed** | The closeup is clean. The ground crack band at x 870–1010, y 870–905 remains. |
| 4 | Glossy strawberry frosting | **Not fixed (regressed on gloss)** | Hue is 356–3° on hero and closeup, mauve on ground. The gloss parameters were softened. |
| 5 | Hero milk reads as liquid | **Partly fixed** | Clipping is gone (7 % → 0 %). It is still the brightest mass, with hard shadow wedges and no visible reflection from above. |
| 6 | Prop density on the wild donut | **Partly fixed** | Ground about 5–6 px and closeup about 4–5 px: OK. The lagoon-edge floating donut is about 7 px. The closeup still shows only 2 slab drips. |
| 7 | Grass blades | **Not fixed** | Pegs on teal, unchanged. |
| 8 | Closeup frame cleanup | **Not fixed** | Faceted sheet, orange top band and heavy DoF unchanged. |
| 9 | Bakery details | **Partly fixed** | Roof, soffit and chimney sliver improved. The plaster cobbles remain. |
| 10 | Lagoon wall drips and strata | **Partly fixed** | Left drips tapered. Right drips still slabs, column grain remains, about 13–14 px cells. |

Reviewer 2's iter-4 list (`M2-iter4-r2.md`):
- **#1 (pinholes and cracks):** mostly fixed; the lighthouse veins remain.
- **#2 (sugar-hill disc):** not fixed.
- **#3 (milk):** partly fixed.
- **#4 (strawberry hue):** not fixed.
- **#5 (gloss):** not fixed.
- **#6 (drips):** partly fixed. The hero rim is good; the lagoon wall is mixed.
- **#7 (path seams):** partly fixed.
- **#8 (faceted plane and grid):** the plane is not fixed; the grid is reduced.
- **#9 (roof and chimney):** fixed.
- **#10 (framing and value hierarchy):** not fixed.

## Regression check
There is nothing to regress against formally. No graphics gate has `final/` shots with shared content: `shots/M0/final` and `shots/M1/final` are engine test scenes.

Within M2, compared with iter 4, the frosting gloss regressed: the softened `roughGloss`, `glaze` and lobe values give a duller, smeared highlight. Nothing else got visibly worse.

**Plateau note (§5):** my gate means are 6.0 → 6.1 → 6.2, so this is the third consecutive iteration with < 0.3 gain. Iteration 5 was a set of good targeted fixes, but every remaining item is either a long-standing asset problem or an unresolved material problem. Parameter passes will not get to 9.0. Next iteration needs a structural move on the two things that dominate every frame:
- **a real frosting material:** a cool-based strawberry palette, plus a clearcoat lobe that survives the warm key
- **a re-authored near-field kit:** blade grass and wall strata at density
Iteration 8 is the escalation point.

```json
{"gate":"M2","iter":5,"verdict":"FAIL","mean":6.2,"min":5,"blockers":4,"store_page":false}
```
