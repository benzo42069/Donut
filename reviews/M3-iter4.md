# Review M3 iter 4
## Verdict: FAIL

I captured these myself with `npm run shots -- --gate M3 --iter 4` at commit `26deff4` (GPU path, ANGLE Metal, Apple M4; 14 files in `shots/M3/4/`).
- I viewed every 1920x1080 and 844x390 frame, all three strip frames and the composite.
- I viewed 2-3x crops of: classic/blueberry, rainbow, pink/maple/chocolate, the right column, Glazey stages 0-1 and 4-5, the Glazey back (stage 5), the pier/fence, the right-hand props, the cotton-candy tree/lighthouse, the bitten classic and the bitten pink.
- I sampled pixel values in the backdrop, the classic and maple glazes, Glazey's lit and shaded sides, the contact shadows, the bite pockets, the crystal and the lamp.
- Before capturing, I read `art/reference/NOTES.md` and viewed all four references. The primary references for this gate are 04 (donut lineup, studio) and 03 (Glazey sheet).

Summary: the "structural" lighting change is real in code, but it barely shows on screen.
- What improved:
  - Glazey's shaded side is now cooler than the lit side. B/R is about 0.54 shaded vs 0.47 lit, which is +0.07. Iter 3 measured -0.01.
  - The classic glaze is now separated from the maple bar.
  - The bite pockets are golden instead of khaki.
  - The pier planks are rounded.
- What did not change:
  - Every frame is still a high-key, evenly lit peach room. The backdrop is luma 228-234 everywhere except a dirty gray smudge in the upper-right corner.
  - Glazey's lit and shaded sides differ by only about 10-15 luma, so the forms are barely modeled.
  - The cast shadows are the same pale lilac smears, with no contact core.
- Glazey's belly is still a ringed crescent with a concave top. The arms are still horizontal fins.
- Apart from the pier, the props are unchanged.
- The gate mean moved by about 0.1.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 7 | 6 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | – | – | 6.8 |
| gallery-glazey-belly | 7 | 7 | 6 | 6 | 8 | 6 | 6 | 6 | 7 | 7 | – | – | 6.6 |
| gallery-glazey-belly_strip (turntable) | 7 | 7 | 6 | 6 | 8 | 6 | 6 | 6 | 7 | 7 | 6 | – | 6.5 |
| gallery-props | 7 | 6 | 6 | 6 | 7 | 5 | 6 | 7 | 7 | 6 | – | – | 6.3 |
| gallery-donut-bites | 7 | 7 | 6 | 6 | 7 | 6 | 7 | 7 | 7 | 7 | – | – | 6.7 |
| gallery-low-tier | 7 | 7 | 6 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | – | 8 | 6.9 |

- **Gate mean:** about **6.65**. The bar is 9.0, or 8.5 for low-tier.
- **Minimum:** **5** (props materials).
- **Trend:** 6.55 (iter 2), then 6.6 (iter 3), then 6.65 (iter 4).
- **Plateau rule (§5) is still in force.** The lighting change did not move the needle.

## Blockers
None. I found no art bible §10 instant-fail item: no z-fighting, acne, fireflies, holes or overlays.
- The detached shadow islands on the props sweep (fix 8) are close to the line. I record them as a severe defect, not a blocker.
- The gate fails pass-bar items 2 (every category at least 8), 3 (mean) and 4 (store page).

## Fix list (priority order; max 10; each concrete and testable)
1. **Make the new lighting actually visible: a pool of light, a darker surround, and form modeling.**
   - **What:** the spot cone is `atan(ext*2.4/dist)` with penumbra 1 (`studio.ts:130-131`), so the key covers the entire floor evenly. The cream backdrop also gets an emissive self-glow (`studio.ts:113-116`).
     - Result: there is no falloff anywhere. The backdrop measures luma 229 at the left edge, the right edge, the bottom and behind the grid. Behind the donuts it is still brighter than every subject except the powdered tops.
     - The only "falloff" is a cool gray smudge in the top-right corner of gallery-glazey-belly and gallery-props (x 1650-1920, y 0-300, luma about 190, B/R 1.02). It reads as dirt on the lens, not as light.
     - On Glazey stage 5 the lit side measures about luma 150 and the shaded side about 135-140. The form is barely modeled.
   - **Where:** `src/debug/scenes/studio.ts`: the spot angle and penumbra, the key/fill intensity ratio, the cloth self-glow, the `vignette`, and the environment dome.
   - **Target:**
     - Narrow the key so the floor falls off from about luma 225 under the subjects to 175 or less at the frame edges, smoothly, with no corner smudge.
     - Raise the key:fill ratio so a subject's shaded side is at least 35 luma below its lit side, while keeping the cool shift (B/R at least +0.08).
     - The brightest backdrop value must sit below the subject's highlights (art bible §4: the subject has the strongest contrast).
2. **Re-author Glazey's belly and arms (third iteration with no real change).**
   - **What:**
     - All six bellies are still crescent "melon slices" low on the body: a concave or flat top edge, a pointed corner at each side, and concentric contour rings (stage 4 at x 1355-1470, y 570-620; stage 0 at x 175-285, y 580-615). Reference 03's belly is a convex oval filling the lower half of the front.
     - The arms are still horizontal T-pose fins.
     - The back (strip f2) still shows a large circular depression mid-back on stages 3-5 (stage 5 at about x 1600-1760, y 470-600) and lumpy oatmeal dents.
   - **Where:** `src/art/models/glazey.ts`: the belly mask and the "down-tilted facing test" added this iteration (it did not produce a convex top), the arm ellipsoids and the body noise.
   - **Target:**
     - A belly whose top edge is convex at every stage, reaching at least 55 % of body height, with no visible rings at 1:1.
     - Arms angled 30-40° down.
     - A smooth back with no crater.
     - Body silhouette noise of 1 px or less at 1080p.
3. **Make the classic glaze translucent sugar glass, not peach fondant.**
   - **What:** the classic glaze is now well separated from the maple bar (classic (245,196,160) vs maple (237,157,84)), which is good. But it is an opaque, uniform peach plastic covering almost the whole dough band (bottom-left of gallery-donuts; the bottom row of gallery-donut-bites).
     - There is no golden dough tint showing through on the curvature.
     - There is no fresnel rim, and no thin translucent drips.
     - Its luma (about 204) is only 11 % below the backdrop (229). That misses iter 3's 15 % target, mostly because the backdrop is too bright (fix 1).
   - **Where:** `classicGlaze` and `classicGlazeThin` in `src/art/palette.ts`, the classic look in `src/art/models/donut.ts`, and translucent shading in `Materials.ts`.
   - **Target (reference 04 bottom-left):**
     - Pale glass with visible golden underlayer gradients where the glaze thins.
     - A bright rim on the silhouette.
     - Translucent thin drips.
     - At least 30 % of the side height showing golden dough band.
4. **Make the emissives glow (unchanged since iter 1).**
   - **What:**
     - The crystal (gallery-props, x 1215-1300, y 705-850, luma about 215) is a washed-out, flat pastel blob, lighter than its surroundings, with no halo. Art bible §5 requires choco-chip crystals to be emissive with bloom.
     - The lighthouse lamp donut (x 525-630, y 155-265) is an unlit pale disc.
     - The rainbow mega donut has no glow.
   - **Where:** `bloomThreshold: 1.2` in `studio.ts:205` is still above anything these assets reach. Also the `crystalLilac`/`crystalMint` glow strength and the crystal SDF in `props.ts`.
   - **Target:**
     - A soft visible halo on the crystal, lamp and rainbow.
     - A faceted crystal with saturated cores, darker than the floor at its base.
5. **Bring the remaining props up to hero quality.**
   - **What:**
     - The fence rails (x 580-985, y 730-800) are still flat waffle slabs. Only their color changed.
     - The pretzel trunk (x 320-375, y 480-735) is a staircase twist.
     - The gingerbread rock (x 1355-1540, y 720-850) has a flat white cap full of brown holes that reads as mold.
     - The hanging donuts on the donut tree (x 1420-1630, y 490-575) are boxy rings with no stems.
     - The pier is now acceptable: rounded planks, a big improvement.
   - **Where:** `src/art/models/props.ts` (`buildFence`, rock, donut tree) and the trunk builders.
   - **Target:**
     - Rounded candy-stick rails with no grid tiling.
     - A smooth twisted trunk.
     - A rounded boulder with sugar dusted on the top faces only and no holes.
     - Hanging donuts at gallery-donut quality on visible stems.
6. **Fix the hero composition and the rainbow overlap.**
   - **What:**
     - The wider grid helps, but the rainbow still sits on top of the chocolate donut's dough band and stand (x 850-1070, y 375-395). In the 844x390 frame the chocolate reads as half a donut.
     - The top 25 % of the frame (y 0-260) is empty backdrop. The grid sits low and feels like a table photographed from too far away.
   - **Where:** the gallery-donuts camera and grid spacing in `src/debug/scenes/gallery.ts`.
   - **Target:**
     - Every donut's glaze, dough band and stand top fully visible, with at least 30 px between neighbors.
     - No more than 15 % empty space above the top row.
7. **Restore flavor identities: blueberry, rainbow, maple, jelly.**
   - **Blueberry:** it is a mirror-glossy lavender cog with hard, regular scallops and stair-stepped rim edges. It is not craggy cake. Target: irregular soft crag lumps and a satin sheen.
   - **Rainbow:** the band boundaries are visibly jagged (crop: orange/red and yellow/orange edges). The red/orange outer bands still dominate, and the side drips are flat colored wedges. Target: even bands, smooth edges at 1:1 and rounded drips.
   - **Maple bar:** still matte, flat tan-orange with no specular streak. Target: glossy amber.
   - **Jelly:** still a glossy blob glued to the flank (x 1265-1340, y 360-390). Target: it oozes from a dark, AO'd split.
   - **Where:** the looks in `src/art/models/donut.ts`; the `rainbow*`, `maple*` and `blueberry*` entries in the palette.
8. **Fix the detached shadows and the canopy sprinkles on gallery-props.**
   - **What:**
     - The cotton-candy tree throws a large gray shadow onto the curved sweep at x 20-330, y 470-570, plus a dark disc at about (60,555). Both float with no connection to the trunk.
     - The canopy sprinkles on the green and pink trees are flat bars in horizontal bands, and several stick out past the silhouette (green tree right edge, about x 1320-1345, y 480-560).
   - **Where:** sweep `receiveShadow` and the key direction in `studio.ts`, the props layout in `gallery.ts`, and the canopy sprinkle placement in `sprinkleTree.ts`/`props.ts`.
   - **Target:**
     - Cast shadows only on the flat floor, attached to their casters.
     - Sprinkles half-sunk, evenly scattered, with none past the silhouette.
9. **Add contact shadows: ground every object.**
   - **What:** the shadow under the stand feet measures luma 217-223 against a floor of 229, only 3-5 % darker. Under Glazey's feet it is 218. Nothing has a dark contact core, so the stands and Glazeys hover. The crumb piles in gallery-donut-bites have no visible shadow.
   - **Where:** the N8AO radius and intensity for the studio, the shadow map softness (the PCSS/VSM radius), and `studioOcclusion`.
   - **Target:** a tight contact core at least 30 % darker than the floor directly under every foot, leg and crumb pile, fading into the soft long shadow.
10. **Clean the dough band and stand surfaces.**
    - **What:**
      - The dough bands are still shredded bark with dark vertical flecks (under the blueberry, x 800-1120, y 760-830; under the rainbow).
      - The stand tops carry a dashed ring of dark dots and read as cookies.
      - The legs are square posts.
      - The bite pockets are better: golden, about (208,168,117). The deepest areas still have blocky dark clusters (bitten classic, x 1440-1560, y 590-660).
    - **Where:** the dough band and jitter in `donut.ts`, `src/art/models/stand.ts`, and the crumb colors.
    - **Target:**
      - Smooth golden dough with a cream mid-stripe and no streaks.
      - Turned-wood stands with faint grain and rounded legs.
      - Bite pockets with no pixel cluster more than 30 luma below its neighborhood.

**Plateau note:** the lighting model was replaced, but the scene is still configured so that the new model looks like the old one: a full-floor spot cone, a self-lit cloth and a high bloom threshold. Before the next tuning pass, the next iteration should do two things. First, re-author Glazey's belly and arms, which have survived three rounds. Second, get a visible light pool with real falloff and contact cores. These two items account for most of the gap in categories 3, 4, 6 and 7.

## Previous review: status of the M3-iter3 fix list
| # | item | status |
|---|---|---|
| 1 | Studio lighting rebuild | **Partly fixed.** The shaded side is now cooler (+0.07 B/R, just under the +0.08 target). There is still no visible falloff, no contact core and no visible folds, and a new gray corner smudge appeared. |
| 2 | Classic glaze | **Partly fixed.** It is now separated from maple: lighter and pinker. It is still opaque, with no translucency, fresnel or dough band. |
| 3 | Glazey belly and body | **Not fixed.** The belly is still a concave-topped ringed crescent. The fin arms, back crater, lumpy body and bronze mirror irises all remain. |
| 4 | Props to hero quality | **Partly fixed.** The pier planks are rounded (good). The fence, trunk, rock and hanging donuts are unchanged. |
| 5 | Emissive glow | **Not fixed.** |
| 6 | Hero composition | **Partly fixed.** The grid is wider. The rainbow still overlaps the chocolate, and the top 25 % is still empty. |
| 7 | Flavor identities | **Not fixed.** |
| 8 | Bite interiors | **Mostly fixed.** The pockets are golden. There are some blocky dark clusters, and the crumb piles have no contact shadow. |
| 9 | Donut surface noise | **Partly fixed.** The gray pepper specks on the powdered tops are gone. The dough-band streaks and dashed stand rings remain. |
| 10 | Detached shadows and canopy sprinkles | **Not fixed.** |

## What is working (keep it)
- **Glazey's face:** big glossy eyes with 2x2 glints, soft blush, an open mouth, and stage 5's bliss arcs. It still reads at 844x390. The rainbow tuft is clean and on-model from every angle.
- **Chocolate glaze:** still the best material in the gate.
- **Pink sprinkle donut:** glossy, with real drips and capsule sprinkles.
- **Powdered donuts:** clean high-value sugar, with the specks fixed.
- **Bite carves:** real scalloped carves with a glaze overhang, and now golden, appetizing crumb.
- **Classic vs maple:** now clearly different flavors.
- **The cool shift on shadow sides:** keep the direction; push its strength.
- **Pier:** the rounded planks are the right direction for every wooden prop.
- **Bakery and lighthouse:** charming and clean.
- **Low tier:** effectively identical to high, with no broken effects.

## Store-page test: no
- **Hero (gallery-donuts):** next to reference 04 it still reads as a clean, evenly lit CG asset sheet, not a mouth-watering studio photo.
  - There is no pool of light or depth.
  - The donuts hover over faint shadows.
  - The blueberry is a lavender cog, and the rainbow is jagged and unlit.
  - The classic is peach plastic.
- **Glazey:** cute faces, but the crescent belly and fin arms would not survive a side-by-side with reference 03.

## Regression check
- **M0 and M1 finals:** this commit touches only studio, gallery and asset files that those scenes do not use. There is no regression.
- **M2:** `pier.ts`, `props.ts` (the fence), `donut.ts` (sugar grains) and `palette.ts` (the classic glaze) are shared with M2.
  - I recaptured `m2-hero`, `m2-ground` and `m2-closeup-donut` myself into `shots/M2/m3i4-rev/` and compared them with `shots/M2/final/`.
  - The island lighting, grass, path, trees, lighthouse, clouds and lagoon all match.
  - The M2 pier (2x crop) now reads as slatted rounded boards instead of a brick grid. That is neutral to slightly better.
  - The close-up pink donut is essentially identical.
  - **No regression.**

```json
{"gate":"M3","iter":4,"verdict":"FAIL","mean":6.65,"min":5,"blockers":0,"store_page":false}
```
