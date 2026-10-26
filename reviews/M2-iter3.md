# Review M2 iter 3
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M2 --iter 3` at commit `c57f050`.
- **Harness:** `ok: true`, SwiftShader fallback, 10 files in `shots/M2/3/`, empty log. My first run hit my shell's 590 s timeout after three shots, so I re-ran the full harness to completion. The outputs are byte-identical in size, so the renders are deterministic.
- **What I viewed:** every 1920x1080 and 844x390 PNG; 2–5x nearest-neighbour crops of the ground donut, path, bakery wall and awning, both frosting slopes, the closeup donut, path and foreground grass, the hero lagoon, belly, sugar hill, bakery and lighthouse, the lagoon-edge wall, milk and trees, and the low-tier sugar hill and top; a grayscale version of the hero.
- **Measurements:** I measured per-pixel clipping and isolated-speckle counts with numpy.
- **References:** I viewed references 01–04 and judged fidelity only against the "Follow" lists in `art/reference/NOTES.md`.
- **Comparison:** I compared against my own iter-2 captures in `shots/M2/2/`.

Summary: iteration 3 fixed two of the four iter-2 blockers.
- **Gamut clipping is fixed.** 0.00 % of pixels have a zero channel in every shot, down from 2–21 %.
- **The ground-shot frosting slopes are fixed.** They are now fine, rounded swells with no terraces.
- **Hero underside:** the coarse checkerboard is replaced by a smooth 1/32 m shell with long, varied, bulb-ended drips.

That is real progress. But the shots that matter most for "this is NOT Minecraft" barely moved:
- **Wild donut:** the model is unchanged (`donut.ts` is not in the diff). It is still a ziggurat of 8–10 px frosting rings with rectangular drip tabs.
- **Grass:** still flat-topped pegs.
- **New macro discs:** the multi-disc `nearField()` patches add *more* seam lines across the path.
- **Hero lagoon:** still a blown peach floor with hard tree shadows. 28 % of its pixels have R ≥ 250.

The gate mean rises from 5.8 to about **6.1**. The bar is 9.0. This is still far from passing, and progress over the last iteration is +0.3, right at the plateau threshold (§5).

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 6 | 7 | 6 | 6 | 7 | 5 | 7 | 7 | 7 | 6 | n/a | n/a | 6.4 |
| m2-ground | 6 | 6 | 7 | 6 | 7 | 5 | 5 | 6 | 6 | 5 | n/a | n/a | 5.9 |
| m2-closeup-donut | 5 | 5 | 6 | 6 | 6 | 5 | 4 | 5 | 5 | 5 | n/a | n/a | 5.1 |
| m2-lagoon-edge | 6 | 6 | 7 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | n/a | n/a | 6.3 |
| m2-low-tier | 6 | 7 | 6 | 6 | 7 | 5 | 7 | 7 | 7 | 7 | n/a | 7 | 6.5 |

- **Gate mean:** about **6.0–6.1**. It needs at least 9.0, or at least 8.5 for the low tier.
- **Min:** **4** (m2-closeup-donut, voxel density).
- **Categories at 8 or above:** none, in any shot.

## Blockers
- **[m2-closeup-donut, m2-ground] Prop voxels are over the density limit, and the near decor reads as Minecraft (§10.2, §3 density rule, §2 "silhouettes are staircases").**
  - **Closeup donut frosting (centre, x 710–1210, y 410–660):** each voxel is about 8–10 px, against a prop limit of about 6 px. The top and hole read as about 12 concentric stepped terraces, not a smooth glossy dome.
  - **Closeup drips:** they are flat rectangular tabs, about 60–90 px wide, with square corners: at x 780–860, x 900–960 and x 1150–1190, around y 580–650.
  - **Closeup sprinkles:** about 25×10 px bricks lying on the steps.
  - **Ground donut (lower-left, x 430–850, y 790–945):** the same model, at 8–10 px per voxel, with the same tabs.
  - **Ground bakery plaster (centre, x 700–1390, y 360–720):** it reads as cobblestones of about 12 px. The brick foundation strip (y 745–780) has bricks of about 25 px.
  - **Grass in both shots:** it is still flat-topped cylindrical pegs, about 10–14 px wide in the closeup foreground (lower-left, x 0–600, y 700–1080) and the ground foreground. This is the same peg read as iter 2. The flowers are fixed (now 15–20 px blooms on stems).
- **[m2-closeup-donut, m2-ground] Macro-patch seams, now multiplied (§10.1 holes and seams).** The new `nearField()` in `src/debug/scenes/m2Meadow.ts` lays 4–5 overlapping discs (`d *= 1.7`). Each disc boundary leaves a visible step.
  - **Closeup, right path edge (x 1150–1900, y 560–1000):** a doubled and tripled orange band, with three parallel dotted sawtooth lines running down it.
  - **Closeup, across the path below the donut (x 1000–1250, y 780–900):** a thin dark curved arc.
  - **Ground, path in front of the donut:** three or four concentric dark contour arcs on the left half (x 380–700, y 900–1080) and a curved arc under the donut shadow (x 600–1000, y 940–1000). On the right edge (x 1000–1100, y 860–1080) there are parallel doubled lines.

  They read as cracks or contour lines drawn on the ground. Source: the disc boundary in `buildMacro` and `inDetail` in `IslandTerrain.ts`, where `MACRO_SKIN = 0.09` replaces the coarse surface with no feathering, plus overlapping disc radii.
- **[m2-hero, m2-low-tier, m2-lagoon-edge] Blown whites on the milk; the hero lagoon still reads as a dry floor (§10.7 "blown whites", RF-02, NOTES 01 "Ignore": the flat cream slab).**
  - **Hero lagoon (x 740–1120, y 420–600):** 28 % of pixels have R ≥ 250, and the mean is (214,182,165). The lit milk is a flat, blown peach sheet.
  - **Shadows on the hero lagoon:** the lighthouse and tree shadows lie on it as hard-edged gray wedges, like shadows on a floor.
  - **What the hero milk lacks:** there is no sky fresnel, no reflection of the drips, pier or lighthouse, no glint path, and no foam line where the milk meets the wall.
  - **Lagoon-edge, bottom band (y 900–1080):** 27 % of pixels have R ≥ 245. It reads as overexposed pink Vaseline, with vertical pink reflection smears.
  - **Low tier:** identical to the hero.
- **[m2-hero] Black speckle pixels on the lighthouse (§10.1 artifacts and acne-like noise; §10.7).** The white and red stripes (x 1165–1215, y 285–420) carry about 20–30 scattered near-black single pixels, for example (12,6,0) at (1201,299) and (12,5,0) at (1183,307), plus a few bright ones. The low tier, at the same framing, has none, so this is a high-tier-only pass: N8AO at `aoSamples`/denoise, or NaN or negative values feeding the new `GamutEffect`. It sits right on a secondary focal prop. In iter 2 these were white fireflies; now they are black.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Re-author the wild donut.
   - **Where:** `src/art/models/donut.ts`. It was not touched in iter 3, although both iter-2 reviews put it in the top 6.
   - **Target, at the closeup framing with DoF disabled:**
     - Frosting voxels are 6 px or less: author at 1/64 m (the close-up hero asset scale in §3), or pull the camera back.
     - The top is a smooth, swelling dome with one broad soft specular highlight, as in ref 04 top-left, and no visible concentric contour rings.
     - There are 5–8 drips of varied width and length with rounded bulb ends, like the iter-3 island-belly drips, which already prove this can be done.
     - Sprinkles are 1×1×3 capsules at 1/64 m, so 12×4 px or less on screen.
     - The dough band shades golden to toasted, with no pale rectangular patch on the front (ground x 620–800, y 880–930).
2. **What:** Remove every macro-patch seam.
   - **Where:** `IslandTerrain.ts` (`buildMacro`, `inDetail`, the `MACRO_SKIN` cull at line 237), and `nearField()` in `m2Meadow.ts`.
   - **Target:** zero visible arcs, doubled edges or sawtooth bands on the path in m2-ground and m2-closeup-donut.
   - **How:** merge the discs into one union (a frustum-shaped region), so there are no internal boundaries. Then either push the outer boundary out of frame, or blend the macro surface down to the coarse height across a 0.5 m feather. Cut the coarse columns exactly to the union, not to each disc.
3. **What:** Give the hero milk liquid behaviour, and stop it blowing out.
   - **Where:** `src/engine/render/Water.ts` (albedo, fresnel at steep angles, sheen), `Reflection.ts`, and shadow reception on the water.
   - **Target, in m2-hero:**
     - The lagoon has fewer than 2 % of pixels with any channel at 250 or above.
     - The milk shows a cool-to-warm fresnel gradient toward the far wall, a soft broken sun glint path, soft reflections of the pink drips and the lighthouse, and a cream foam ring along the whole wall base.
     - Shadows on the milk are soft and lilac-tinted, not hard gray wedges: scatter or blur the shadow term on water.
   - **Target, in m2-lagoon-edge:** the foreground milk keeps its highlight without blowing out (fewer than 3 % of pixels at R ≥ 245), and the reflections are ripple-broken copies of the objects above, not pink smears.
4. **What:** Replace the grass pegs with micro-blades.
   - **Where:** `src/art/models/grassTuft.ts` and the macro grass in `buildMacro`.
   - **Target:** in the closeup and ground foreground, blades are tapered (2–3 voxels wide at the base, narrowing to 1), of varied height and leaning in varied directions. No flat-topped caps are visible, and no blade is wider than about 8 px at 1080p. Also shift the closeup grass hue from the current sickly olive-yellow (lower-left) toward the fresh mint-green of ref 01. Judge this with DoF off.
5. **What:** Kill the speckle pixels.
   - **Where:** the N8AO configuration in `Renderer.ts` (lines 114–120) and `GamutEffect` in `ColorGrade.ts`. Guard against NaN: `if (any(isnan(c))) c = vec3(0.0)` is not a fix. Find the source, likely a zero-length normal or a depth discontinuity on the lighthouse cylinder.
   - **Target:** zero isolated near-black or near-white single pixels on the hero lighthouse at the same framing.
6. **What:** Bring the bakery under the prop density limit at the ground camera, and fix the ghost awning.
   - **Where:** `src/art/models/bakery.ts`. The awning is at line 217.
   - **Target:**
     - Plaster reads as fine stucco, at 6 px or less per voxel, in m2-ground.
     - The foundation bricks are 12 px or less.
     - The striped awning (ground x 1180–1380, y 390–470) is a solid, shaded, sloped canopy. Today only the tab tips render; the sloped sheet is a near-invisible translucent smear.
7. **What:** Restore golden dough on the hero belly, and get the hero's golden hour and value hierarchy right.
   - **Where:** the iter-3 belly crust gradient in `IslandTerrain.ts`, the `SUN_DIR` and light colours in `MeadowDiorama.ts`, and `LIGHT_PALETTE` in `palette.ts`.
   - **Target:**
     - The belly reads golden caramel `#E8A85C` to toasted `#B86B32`, with deep crust `#7A3E1D` only on the lowest band, as in ref 01's golden strata. Today the whole lower 15 % of the frame is dark brown, (121,59,6) at (900,960), and reads as chocolate.
     - In grayscale, the bakery, lighthouse and lagoon group carries the strongest contrast. Today the rim, grass, sky and clouds all sit in one mid-gray band.
     - Long, warm, raking shadows, and a warm rim light on the trees and lighthouse.
8. **What:** The sugar hill and the syrup waterfall, both "Follow" items in ref 01.
   - **Where:** `smallProps.ts` and the hill in `IslandTerrain.ts`.
   - **Target:**
     - The hill (hero x 470–620, y 350–540) reads as a chocolate or dough mountain with powdered sugar on its top faces only. Today it is a beige, striated rock with horizontal staircase contour lines and a brown gravel skirt. At the low tier (x 440–660, y 340–560) it reads as a termite mound.
     - The waterfall (hero about x 800–840, y 345–410) is a glossy amber ribbon with a highlight streak and a splash at its foot, not a flat striped plank.
9. **What:** Fix the inner lagoon wall grain.
   - **Where:** the strata and jitter in `IslandTerrain.ts`, and `jitteredLinear` in `Materials.ts`.
   - **Target:** in lagoon-edge (x 0–1920, y 680–830), no vertical column striping and no wood-grain contour lines. Soft toasted strata of varied thickness, matching the quality of the iter-3 outer belly. The inner drips (x 360–480, x 760–830, x 1690–1800) should vary in width, not be uniform wide slabs.
10. **What:** Clean up composition.
    - **m2-closeup-donut:** the bakery base is cut by the top frame edge (x 490–1470, y 0–110). Either frame the whole bakery or exclude it.
    - **m2-ground at 844x390:** the lighthouse is cropped by the right edge, and the donut, the subject, is tiny and lower-contrast than the bakery.
    - **m2-ground:** the far-rim sprinkles at the horizon (left, x 0–230, y 735–750; right, x 1480–1920, y 720–760) are 30–40 px bricks. Fade or shrink them.
    - **Hero:** two clouds are still cropped by the bottom edge (x 980–1230, y 1015–1080 and x 150–290, y 1055–1080).
    - **Clouds:** their groove lines are softer but still faintly stepped (hero right, x 1430–1790, y 780–910).

## What is working (keep it)
- **Gamut:** fully fixed. Zero clipped channels in every shot, and the dough now has gradation. `GamutEffect` before tone mapping was the right call.
- **Ground frosting slopes (right, x 1480–1920, y 720–950):** fine, rounded, glossy swells with small inlaid sprinkles. The terrace blocker is gone, and this is the quality bar the grass and donut need to meet.
- **Hero belly drips:** long and short, varied width, bulb ends, overlapping. They are the best frosting form in the gate. The underside silhouette is smooth, with no staircase.
- **Foreground flowers:** now small blooms on stems, 15–20 px.
- **Tree canopies:** the sprinkles are now inlaid, not hairs. The dithered canopy shading in lagoon-edge reads well.
- **Lagoon wall height:** lowering the meadow to 0.85 m above the milk removed the "quarry" read in lagoon-edge.
- **Mood:** the lagoon-edge sunset behind the lighthouse and the ground shot's backlit amber sky with glowing windows both have real atmosphere. The per-shot aerial fog helps depth.
- **Low tier:** it holds up next to high, with no broken effects. It is even cleaner on the lighthouse.

## Store-page test: no
At thumbnail size the hero is a pleasant, coherent toy island. Next to ref 01, the centre of the composition, the lagoon, is a blown-out peach floor with hard gray shadows. The belly has gone dark chocolate-brown instead of golden dough, and the value structure is flat. A premium listing would also show a gameplay-height shot. The current ground and closeup shots show a terraced, peg-grass donut sitting on a path scored with seam lines, which is exactly the Minecraft read the art bible forbids. Not next to the best indie games of the year.

## Previous-review check (reviews/M2-iter2.md fix list)
| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Near-field density in ground and closeup | **Partly fixed** | The frosting slopes are fine now, and the flowers are small. The donut is 8–10 px, the bakery plaster about 12 px, and the grass is still pegs. The closeup was pulled back to 3.2 m and still fails. |
| 2 | Gamut clipping | **Fixed** | 0.00 % zero channels in all shots (was 2–21 %). |
| 3 | Frosting terraces to smooth swells | **Mostly fixed** | Ground slopes are smooth. Hero rim sprinkles are fine. The donut is still terraced (item 1). |
| 4 | Hero lagoon reads as milk | **Not fixed** | Blown peach floor (28 % at R ≥ 250), hard gray shadows, no reflections or foam visible. The wall is lower (partial credit). |
| 5 | Wild donut form | **Not fixed** | `donut.ts` is unchanged: concentric step-rings, rectangular tabs, the pale patch on the band. |
| 6 | Inner cliff barcode and hero underside | **Partly fixed** | The underside is smooth now. The inner wall still has vertical grain and wood-grain strata. |
| 7 | Golden hour and value hierarchy | **Partly fixed** | The sun is lower and the shadows longer. The grayscale value hierarchy is still flat, and the belly went dark brown. |
| 8 | Clouds | **Partly fixed** | Smoother shading. Still faintly grooved, and still cropped at the bottom edge. |
| 9 | Sprinkle-tree canopies | **Fixed** | Sprinkles are inlaid and the two-tone band is dithered. |
| 10 | Set dressing and composition | **Partly fixed** | The sugar hill was re-dusted but now reads as a rock. The waterfall is still a plank. The chocolate donut crop is gone, but the closeup now crops the bakery. The white fireflies on the lighthouse are now black speckles. |

Reviewer 2's iter-2 list (`M2-iter2-r2.md`):
- **#1 (frosting terrain):** fixed.
- **#2 (seams):** worse.
- **#3 (blue clipping):** fixed.
- **#4 (hero milk):** not fixed.
- **#5 (gloss):** partly fixed.
- **#6 (donut dome):** not fixed.
- **#7 (grass):** partly fixed (flowers yes, blades no).
- **#8 (wall grain):** partly fixed.
- **#9 (milk reflection smears):** not fixed.
- **#10 (framing and clouds):** partly fixed.

## Regression check
No previously passed graphics gate has `final/` shots with shared content. `shots/M0/final` and `shots/M1/final` are engine test scenes with no gate, so there is nothing to regress against formally. Within M2, compared with iter 2:
- **Path seams:** more numerous (multi-disc `nearField`).
- **Hero belly:** lost its golden-dough read and now looks dark chocolate.
- **Lighthouse:** the speckle artifacts changed from white to black.

Everything else held or improved.

**Plateau note (§5):** my gate means are 5.2 → 5.8 → 6.1. The last step is +0.3, right on the threshold. The two biggest remaining problems, the donut model and the grass blades, need re-authored assets rather than parameter tweaks.

```json
{"gate":"M2","iter":3,"verdict":"FAIL","mean":6.0,"min":4,"blockers":4,"store_page":false}
```
