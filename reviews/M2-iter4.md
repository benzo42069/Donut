# Review M2 iter 4
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M2 --iter 4` at commit `dcadc29`.
- **Harness:** exit 0, SwiftShader fallback, 10 files in `shots/M2/4/`, 608 s.
- **What I viewed:** every 1920x1080 PNG and a contact sheet of all five 844x390 PNGs. I also viewed 2–6x nearest-neighbour crops of:
  - the closeup donut, path and grass
  - the ground donut, path, right-hand frosting slope and bakery gable
  - the hero lagoon, sugar hill, bakery and lighthouse cluster, belly and lighthouse shaft
  - the lagoon-edge left wall, right wall and lighthouse
- **Measurements:** numpy clipping stats, a 3x3-median speck detector on the lighthouse shafts, and colour samples.
- **References:** I viewed references 01–04 and judged fidelity only against the "Follow" lists in `art/reference/NOTES.md`.
- **Comparison:** I compared against the iter-3 hero in `shots/M2/3/`.

Summary: iter 4's structural change (surface relaxation in `mesh.ts`) does real good on the forms.
- The donut frosting and the sugar hill lost their hard concentric terraces.
- The drips are now U-shaped tongues.
- The sugar hill finally reads as a powdered cap on a gingerbread mound.
- The hero lagoon has gone from 28 % to 7 % near-clipped pixels.
- No cloud is cropped any more.

But the relaxation also brings **new artifacts**:
- a crosshatch grid on the ground frosting
- zig-zag specular "scribble" lines on the donut tops
- a faceted low-poly patch in the closeup

And two promised fixes did not land:
- The lighthouse pinholes are **still there**, although the commit message says "solid lighthouse (no pinholes)".
- The path still carries contour and crack lines in both near shots.

Frosting is still matte and salmon or mauve rather than glossy strawberry. The hero milk still reads as a pale floor with wedge shadows on it.

**Gate mean: about 6.1**, flat against iter 3 (6.0 / 6.2). That is the second plateau in a row (§5). The bar is 9.0.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 7 | 7 | 6 | 6 | 7 | 5 | 7 | 7 | 7 | 5 | n/a | n/a | 6.4 |
| m2-ground | 6 | 6 | 7 | 6 | 6 | 5 | 6 | 6 | 6 | 5 | n/a | n/a | 5.9 |
| m2-closeup-donut | 5 | 6 | 6 | 6 | 5 | 5 | 6 | 5 | 5 | 5 | n/a | n/a | 5.4 |
| m2-lagoon-edge | 6 | 7 | 7 | 6 | 7 | 6 | 6 | 6 | 7 | 5 | n/a | n/a | 6.3 |
| m2-low-tier | 7 | 7 | 6 | 6 | 7 | 5 | 7 | 7 | 7 | 5 | n/a | 7 | 6.5 |

- **Gate mean:** about **6.1**. It needs at least 9.0, or at least 8.5 for the low tier.
- **Min:** **5**.
- **Categories at 8 or above:** none, in any shot.

## Blockers
- **[m2-hero, m2-low-tier, m2-lagoon-edge] Lighthouse pinholes are not fixed (§10.1 holes and artifacts).**
  - **Hero shaft:** isolated near-black pixels at (1175,347) = luma 5, (1177,356) = 5 and (1204,352) = 27, plus more on the lamp ring around y 204–212. They are clearly visible in a 6x crop of x 1160–1230, y 270–420.
  - **Low tier:** 14 specks of this kind on the same shaft.
  - **Lagoon-edge, full height of the shaft (x 935–1050, y 260–660):** dark, branching, crack-like vein lines run vertically through both the red and white stripes. The candy stripes read as cracked plaster. They look like seam or AO leaks between unmerged relaxed faces, or between the lighthouse's lathe segments.
- **[m2-ground, m2-closeup-donut] The path is still scored with lines (§10.1 seams, an iter-3 fix-list item from both reviewers).**
  - **Closeup, path below and left of the donut (x 300–1300, y 650–1050):** four or five parallel curved contour lines, like terrace steps drawn on the sand. There is also a diagonal crack from (960,700) to (1250,620).
  - **Ground:**
    - a long dark crack arc from (430,1050) through (700,960) to (1000,930), under and left of the donut shadow
    - a second, doubled line at (1000–1150, 860–900) running to the right grass edge
  - The commit says "seam-free patches", but the frame says otherwise.
- **[m2-ground] Crosshatch grid on the frosting slope (§10.1 artifacts, new in iter 4).** Across the whole right-hand frosting field (x 1500–1920, y 760–950), a fine regular diagonal lattice of light lines reads like a wireframe or a tablecloth weave. It is visible at 1:1. Probable source: `RELAX = 1.5` in `src/engine/voxel/mesh.ts`. The unmerged faces of smooth materials get relaxed corners and per-corner normals, and the result leaves faceted lighting, or T-junction cracks, along every voxel edge on a gently sloped surface.
- **[m2-closeup-donut, m2-ground] Specular aliasing "scribbles" on the donut frosting (§10.7 aliasing).** Thin bright zig-zag and hex-shaped lines sit on the donut top:
  - closeup x 860–1020, y 560–600 and x 940–980, y 470–490
  - ground x 470–760, y 800–830
  They follow the relaxed facet edges. They read as glitter noise, not a glossy highlight, and they will crawl in motion.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Fix the artifacts introduced by the relaxation, rather than reverting it. The forms it produced are the right direction.
   - **Where:** `src/engine/voxel/mesh.ts` (`RELAX`, the corner-offset function near l.230–262, smooth-normal generation).
   - **Fixes:**
     - Weld shared corners so neighbouring unmerged faces use bit-identical positions, which removes the cracks.
     - Average normals over the whole 2x2x2 neighbourhood, or a 3-voxel kernel, so a gentle slope shades as one gradient, not a lattice.
     - Clamp the relaxation so faces cannot fold.
   - **Target:**
     - The ground frosting (x 1500–1920, y 760–950) shows no grid lines.
     - The donut tops show no zig-zag glints. They show one broad, continuous specular lobe instead.
     - No lighthouse shaft cracks in lagoon-edge.
2. **What:** Remove the lighthouse pinholes for real.
   - **Where:** `src/art/models/lighthouse.ts`, plus `mesh.ts` and the N8AO config in `Renderer.ts`.
   - **How:** render the hero with SSAO off and then with relaxation off to isolate the source.
   - **Target:** a 3x3-median speck test (luma drop > 60) finds 0 specks on the shaft in hero, low tier and lagoon-edge.
3. **What:** Make the path clean.
   - **Where:** `IslandTerrain.ts` (macro feather, `MACRO_SKIN` at l.55 and l.241, `buildMacro`) and `nearField()` in `m2Meadow.ts`. The path height field itself is probably quantized into 1-voxel steps that relaxation does not smooth, because the path material is pinned as matte.
   - **Target:** zero contour lines, cracks or doubled edges on the path in m2-ground and m2-closeup-donut. The path reads as one soft, packed-sugar surface.
4. **What:** Make the frosting glossy and strawberry-coloured.
   - **Hue problems today:**
     - The closeup donut samples (247,152,147) and (241,120,120). That is salmon, hue about 0–5°.
     - The ground frosting slopes sample (152,100,124) and (159,107,127), which is mauve.
     - Both sit outside the strawberry family `#F7A6C1` / `#F27BA5` / `#C9507E` (hue 330–350°).
   - **Where:** `palette.ts` frosting entries, the closeup's warm grade or fog, the cool hemisphere strength on frosting, and `MAT.gloss` roughness in `Materials.ts`.
   - **Target:** frosting samples sit at hue 330–350° in every shot. The hero rim and every donut top show a visible sun specular streak and a fresnel rim, so frosting and dough can be told apart by sheen alone.
5. **What:** Make the hero milk read as liquid.
   - **Problems today:**
     - The lagoon (x 740–1120, y 420–600) is still a pale peach floor, with 7 % of pixels at ≥ 250.
     - The tree and lighthouse shadows lie on it as large hard-edged wedges. The 55 % shadow mix lowered their contrast but not their edge hardness.
     - There is no visible reflection of the pink drips or the lighthouse, and no foam ring.
   - **Where:** `src/engine/render/Water.ts` and `Reflection.ts`.
   - **Target:**
     - The shadow penumbra on the milk is at least 3x wider than on the meadow.
     - The far third of the lagoon shows a sky-tinted fresnel band and soft drip reflections.
     - A cream foam line runs along the whole wall base and the pier posts.
     - Fewer than 2 % of lagoon pixels are at ≥ 250.
   - **Also, lagoon-edge foreground (y 900–1080):** 14 % of pixels are at R ≥ 245, and the reflections are blurry pink smears. They should be ripple-broken copies of the drips and trees.
6. **What:** Hit the prop density limit on the wild donut.
   - **Today:** dough-band cells measure about 7–8 px in the closeup and about 9 px in m2-ground, against a limit of about 6 px.
   - **Where:** `src/art/models/donut.ts`. Author it at 1/64 m, as art bible §3 allows for hero close-ups.
   - **Target:** ≤ 6 px per voxel in both shots, with 5–8 drips of varied length. The closeup shows only two drips on the camera side today.
7. **What:** Replace the grass pegs with tapered blades.
   - **Today:** the closeup foreground (x 0–1920, y 650–1080) and the ground foreground are still flat-topped square pegs on a teal-cyan ground that shows between them. Closeup sun-side grass is acid lime.
   - **Where:** `src/art/models/grassTuft.ts` and the macro grass in `buildMacro`.
   - **Target:** blades taper to a 1-voxel tip, are at most 8 px wide and lean in varied directions. No caps and no teal base are visible.
8. **What:** Clean up the closeup frame.
   - **Faceted patch:** a flat, faceted, low-poly yellow sheet with a crenellated block fringe (lower-left, x 0–260, y 760–1000). It reads as untextured placeholder geometry. Identify it (syrup or butter pool?) and give it voxel relief and material, or reframe it out.
   - **Top-left corner (x 0–840, y 0–120):** the saturated orange gingerbread mass is cut by the frame and is the most saturated block in the shot. It pulls the eye away from the donut.
   - **DoF:** heavy foreground and background blur hides the grass problem rather than fixing it. Per §6, DoF is for vistas and menus only. Confirm this shot's status, and judge the grass with DoF off.
9. **What:** Fix the bakery details.
   - **Where:** `src/art/models/bakery.ts`.
   - **Plaster (ground, x 700–1390, y 360–720):** it still reads as about 12 px marshmallow cobbles. Target ≤ 6 px stucco.
   - **Awning (ground, x 1180–1380, y 390–470):** it is still a ghost. The sheet is near-invisible, and only the pink tab tips read.
   - **Chimney (ground, x 1010–1030, y 110–150):** the emissive sliver is still there.
   - **Hero roof (x 880–1000, y 160–260):** tan planks with aliasing diagonal lines, and a black parallelogram chimney shadow that reads as a hole. Ref 01 wants chocolate shingles.
10. **What:** Fix the lagoon wall.
    - **Where:** strata and drip stamping in `IslandTerrain.ts`.
    - **Today, in m2-lagoon-edge:**
      - The drips are still flat, wide curtains painted on a vertical wall, with no thickness or contact shadow: x 720–950 and x 1400–1560, y 650–830.
      - The dough between them still has vertical column striping and wood-grain contours (x 0–700, y 700–830).
    - **Target:** the drips bulge 1–2 voxels off the wall and taper to bulbs, and the dough shows soft toasted strata.

## What is working (keep it)
- **Surface relaxation:** it is the right structural move. The donut top terraces and the sugar hill contour bands are essentially gone. Fix its artifacts (items 1–2) instead of rolling it back.
- **Sugar hill:** it finally reads as a powdered cap on a gingerbread mound, a "Follow" item from ref 01. The dark dimple on the cap (hero about (545,180) in the hill crop) is a little odd. Consider removing it.
- **Hero framing:** no cropped clouds. The island sits well in frame. The deeper meadow green gives the pink rim more separation than in iter 3.
- **Belly drips:** varied, bulb-ended and long. The belly reads more golden than in iter 3.
- **Gamut:** zero channel clipping in every shot.
- **Lagoon-edge mood:** the backlit sunset behind the lighthouse, the glowing lamp donut and the steam are genuinely charming. This is the closest shot to a store frame.
- **Low tier:** visually near-identical to high, with no broken effects. It shares the high tier's defects.

## Store-page test: no
At thumbnail size the hero is a pleasant toy island. Next to ref 01 it is flatter:
- The milk is a pale floor with shadow wedges.
- The frosting has no gloss.
- The bakery roof is beige planks.
At full resolution, a premium listing would also show gameplay height. There, the path is scored with contour lines and the frosting carries a wireframe grid. The grass is pegs on a teal base, and the subject donut is salmon and matte. That is not next to the best indie games of the year.

## Previous-review check (reviews/M2-iter3.md fix list)
| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Re-author the wild donut | **Partly fixed** | Terraces are softened by relaxation and the drips are U-tongues. Still 7–9 px per voxel, few drips, salmon colour, and specular scribbles. |
| 2 | Remove macro-patch seams | **Not fixed** | Contour lines and cracks remain on the path in both near shots. A crosshatch grid is new on the ground frosting. |
| 3 | Hero milk liquid, no blowout | **Partly fixed** | 28 % → 7 % pixels at ≥ 250. Shadows are lighter but still hard-edged. No visible reflections or foam ring. Lagoon-edge foreground 27 % → 14 % at R ≥ 245. |
| 4 | Grass micro-blades | **Not fixed** | Still flat-topped pegs in the closeup and ground. The hue is greener in the hero, lime in the closeup. |
| 5 | Kill speckle pixels | **Not fixed** | Black pinholes remain on the hero and low-tier shafts. New crack veins appear in lagoon-edge. |
| 6 | Bakery density and awning | **Not fixed** | Plaster cobbles and the ghost awning are unchanged. |
| 7 | Golden belly and value hierarchy | **Partly fixed** | The belly is more golden. The lowest band is still dark. The lagoon is still the brightest mass. |
| 8 | Sugar hill and waterfall | **Mostly fixed** | The hill reads correctly now. The waterfall is a readable amber ribbon, still flat. |
| 9 | Inner lagoon wall grain | **Not fixed** | Column striping and flat curtain drips remain. |
| 10 | Composition cleanup | **Partly fixed** | Clouds are fixed and the closeup no longer crops the bakery. The closeup now crops a gingerbread mass and shows a faceted placeholder patch. |

Reviewer 2's iter-3 list (`M2-iter3-r2.md`):
- **#1 (seams):** not fixed.
- **#2 (pinholes):** not fixed.
- **#3 (milk):** partly fixed.
- **#4 (gloss):** not fixed.
- **#5 (donut):** partly fixed.
- **#6 (frosting hue):** not fixed. The closeup is now salmon; the ground is still mauve.
- **#7 (wall drips):** partly fixed (U-ends).
- **#8 (sugar hill):** fixed.
- **#9 (bakery):** not fixed.
- **#10 (framing and clouds):** clouds fixed; value hierarchy not fixed.

## Regression check
No previously passed graphics gate has `final/` shots with shared content. `shots/M0/final` and `shots/M1/final` are engine test scenes, so there is nothing to regress against formally.

Within M2, compared with iter 3, the regressions are new artifacts from the mesher change:
- the crosshatch on the ground frosting
- specular zig-zags on the donut tops
- crack veins on the lagoon-edge lighthouse shaft
- a faceted low-poly patch in the closeup

**Plateau note (§5):** my gate means are 5.8 → 6.0 → 6.1. Both reviewers' iter-3 means were 6.0 and 6.2. This is the second consecutive iteration with < 0.3 gain. The structural change was the right kind of move, but it shipped with artifacts that cost what the forms gained. Next iteration:
- Fix the relaxation artifacts before anything else.
- Make a material change, a real gloss and specular model for frosting, rather than more geometry tweaks.

```json
{"gate":"M2","iter":4,"verdict":"FAIL","mean":6.1,"min":5,"blockers":4,"store_page":false}
```
