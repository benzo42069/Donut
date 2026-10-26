# Review M3 iter 3
## Verdict: FAIL

Captured by the reviewer with `npm run shots -- --gate M3 --iter 3` at commit `29a384b` (GPU path, ANGLE Metal, Apple M4; harness `ok: true`; 14 files in `shots/M3/3/`). I viewed every 1920x1080 and 844x390 frame, all three strip frames and the composite, plus 2-3x crops of Glazey (front, side, back), the classic/blueberry pair, the rainbow, the bite column, the powdered/jelly pair, the pier/fence, the right-hand props and the lighthouse lamp. I sampled pixel values in the bite pockets, the classic glaze, the backdrop and Glazey's lit and shaded sides. Before capturing, I read `art/reference/NOTES.md` and viewed all four reference images. The primary references for this gate are 04 (donut lineup, studio look) and 03 (Glazey sheet).

Summary: this iteration fixes real things. Glazey's face no longer juts out of the profile like goggles. The stands are now quiet, smooth discs instead of striped staircases. The camouflage blotches on the classic glaze are gone. The six Glazeys no longer touch. The pink tree is matte. None of these changes the overall read, though. The studio is still a flat, high-key peach box with no warm/cool shaping. The classic glaze has turned from blotchy cream into an opaque caramel fondant that is now the same hue as the maple bar. The belly is still a ringed crescent bib. The props set is almost unchanged: Lego pier, waffle fence, chunky rock, unlit crystal and lamp. Every shot still has categories at 5-6.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 6 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | – | – | 6.7 |
| gallery-glazey-belly | 7 | 7 | 6 | 6 | 8 | 6 | 6 | 6 | 8 | 7 | – | – | 6.7 |
| gallery-glazey-belly_strip (turntable) | 7 | 7 | 6 | 6 | 8 | 6 | 6 | 6 | 7 | 7 | 6 | – | 6.5 |
| gallery-props | 7 | 6 | 6 | 6 | 7 | 5 | 5 | 7 | 7 | 6 | – | – | 6.2 |
| gallery-donut-bites | 7 | 7 | 6 | 7 | 6 | 6 | 7 | 7 | 7 | 7 | – | – | 6.7 |
| gallery-low-tier | 7 | 6 | 6 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | – | 8 | 6.8 |

- **Gate mean:** about **6.6**. The bar is 9.0, or 8.5 for low-tier.
- **Minimum:** **5** (props materials and voxel form).
- **Plateau rule (§5) is now triggered.** The scores were 6.1/6.5 (iter 1), then 6.55 (iter 2), then 6.6 (iter 3), so the gain over two consecutive iterations is under 0.3. The builder must make a **structural change** (see the closing note in the fix list), not more parameter tweaks, and log it in `docs/PROGRESS.md`.

## Blockers
None. I found no art bible §10 instant-fail item. There is no z-fighting, no acne, no fireflies (Glazey back view is clean), no holes and no debug overlay. The remaining defects fail pass-bar items 2 (every category at least 8), 3 (mean) and 4 (store page).

## Fix list (priority order; max 10; each concrete and testable)
1. **Rebuild the studio lighting (structural; this is the biggest single lever).**
   - **What:** every shot is still lit like a softbox in a peach room. I measured Glazey stage 5 at (227,130,101) on the lit side and (201,115,91) on the shaded side: B/R is 0.445 vs 0.453, so the shaded side is only darker, not cooler. Cast shadows are pale lilac-gray smears with no tight contact core. The new diagonal folds are invisible at normal viewing, and the vertical light/dark columns still show at the top of gallery-props (x 1030-1080 and x 1690-1760, y 0-260). The bigger vignette only darkens the corners.
   - **Where:** `src/debug/scenes/studio.ts` (key, fill and rim colors and intensities, the sweep fold function at about lines 71-85, `STUDIO_POST`).
   - **Target:**
     - A clearly warm, stronger key from upper right with a cool blue-lilac fill, so a subject's shaded side is measurably bluer than its lit side (B/R at least 0.08 higher).
     - Contact shadows under stand feet and Glazey's feet at least 30 % darker than the long cast shadow.
     - A backdrop that falls off to a darker warm tone behind the subjects, so the subjects carry the strongest value contrast in the frame (art bible §4).
     - Visible, irregular cloth folds behind the donut grid, as in reference 04.
2. **Make the classic glaze actually classic.**
   - **What:** the bottom-left donut in gallery-donuts and the bottom row of gallery-donut-bites are now an even, opaque caramel fondant, top (245,190,131). The blotches are gone and the value separation is better (luma about 198 vs 224 backdrop, roughly 12 %). But it is the same hue as the maple bar, so the two flavors no longer read apart. There is no translucency, no golden dough tint showing through, no fresnel rim, and the glaze covers almost the whole dough band down to the stand.
   - **Where:** `classicGlaze`, `classicGlazeThin` and `classicGlazePool` in `src/art/palette.ts`, the classic look in `src/art/models/donut.ts`, and translucent-flag shading in `src/engine/render/Materials.ts`.
   - **Target (reference 04 bottom-left):**
     - A pale, slightly pink-beige sugar glass, clearly lighter and cooler than the maple amber.
     - Golden dough tint showing through where the glaze thins over curvature.
     - A bright fresnel rim on the silhouette.
     - A visible golden dough band on the lower 35-40 % of the side.
     - Luma separation from the backdrop of at least 15 %.
3. **Re-author Glazey's belly and body surface (structural).**
   - **What:**
     - The belly is still a crescent "bib" low on the body with a flat-to-concave top edge and concentric contour rings (all six, e.g. stage 4 at about x 1345-1480, y 570-620). Reference 03's belly is a large soft oval with a convex top, filling the lower half of the front.
     - The body surface is still lumpy oatmeal. Stage 0's silhouette (x 115-340, y 450-650) wobbles like melted clay. The back view (strip f2) shows blotchy dents and a circular depression mid-back on stages 3-5.
     - The arms are still horizontal fins in a T-pose.
     - The irises have mirror-like environment reflections that read as bronze ball bearings at 3x.
   - **Where:** `src/art/models/glazey.ts` (belly ellipse and decal mask, arm ellipsoids, body SDF noise), the body jitter in `src/art/palette.ts`, and the eye material roughness.
   - **Target:**
     - A convex-topped oval belly reaching about 55 % of body height, flush, with no visible contour rings at 1:1.
     - A smooth, squishy body at gallery distance: silhouette noise of 1 px or less at 1080p and no dents on the back.
     - Arms angled 30-40° down.
     - Glossy but dark irises (roughness about 0.15, with no readable environment image), keeping the 2x2 white glint.
4. **Bring the props set up to the hero assets (structural; mostly untouched since iter 1).**
   - **What:**
     - The pier (lower left, x 180-660, y 680-870) is still a Lego plank grid with stepped stair stringers.
     - The fence rails are flat waffle slabs.
     - The pretzel trunk (x 320-375, y 480-735) is a staircase.
     - The gingerbread rock (x 1355-1540, y 720-850) is chunky, with a flat white cap full of holes that reads as mold.
     - The hanging donuts on the donut tree (x 1420-1630, y 490-575) are boxy and float with no stems.
   - **Where:** `src/art/models/props.ts` (pier, fence, rock, donut-tree builders) and `src/art/models/lighthouse.ts` if the stairs are shared.
   - **Target:**
     - Rounded, slightly warped planks with a per-plank height wobble, and rounded candy rails with no grid tiling.
     - A rock with voxels of 4 px or less, sugar drifts dusted on the top faces only, and a rounded boulder silhouette.
     - Hanging donuts at gallery-donut quality on visible stems.
     - Every silhouette in the frame reads as rounded, like the bakery and lighthouse.
5. **Make the emissives glow.**
   - **What:** the crystal (x 1215-1300, y 710-860) is still a flat, smooth pastel blob with no glow, although art bible §5 requires choco-chip crystals to be emissive with bloom. The lighthouse lamp donut (x 525-630, y 155-265) is an unlit pale disc. The rainbow mega donut has no glow either.
   - **Where:** `bloomThreshold: 1.2` in `studio.ts` is above what these assets reach; also the `crystalLilac`/`crystalMint` emissive strength in `palette.ts` and the crystal SDF in `props.ts`.
   - **Target:** a soft visible bloom halo on the crystal, lamp and rainbow in the studio. The crystal is faceted, with voxel steps visible on close view.
6. **Fix the hero composition.**
   - **What:** the camera moved in. The rainbow donut now hides the chocolate donut's dough band and stand (about x 840-1080, y 380-400), and the blueberry overlaps the rainbow's stand. The grid reads as crammed, and the top 25 % of the frame is still empty backdrop. At 844x390 the chocolate is half-hidden.
   - **Where:** the gallery-donuts camera and grid spacing in `src/debug/scenes/gallery.ts`.
   - **Target:** every donut's glaze, dough band and stand top are fully visible, with at least 30 px of background between neighbors. The grid's visual centre sits at the frame centre, with no more than 15 % empty space above the top row.
7. **Restore flavor identities: blueberry, rainbow, maple, jelly.**
   - **Blueberry:** the grooves are gone, but it is still a smooth, mirror-glossy lavender ring with blotchy light/dark patches. The craggy old-fashioned form of reference 04 is lost. Target: 4-6 soft crag lumps per quadrant, a satin cake-glaze sheen and a smooth but lumpy silhouette.
   - **Rainbow:** the red/orange outer band dominates. The band boundaries are stair-stepped, and the side drips are flat colored slabs. Target: even band widths, smooth band edges at 1:1 and rounded drips.
   - **Maple bar:** it is unchanged. It is still matte tan with stepped drips along the bottom. Target: glossy amber top with a specular streak.
   - **Jelly:** it is still a glossy blob stuck on the flank (x 1265-1330, y 370-410). Target: it oozes from a dark, AO'd split in the dough band.
   - **Where:** the respective looks in `src/art/models/donut.ts`, and the `rainbow*`, `maple*` and `blueberry*` entries in `src/art/palette.ts`.
8. **Make the bite interiors appetizing.**
   - **What:** the deep pockets are warmer than in iter 2 (now (144,114,67) at (1700,620) and (152,123,76) at (1060,610), with R-G about 30). They still read as drab khaki sponge next to the peach glaze, with dark blocky pixel clusters and a stair-stepped carve contour at the glaze/crumb boundary. The floor crumb piles are now close to the feet (good), but their contact shadow is barely visible.
   - **Where:** the torn-crumb colors in `donut.ts`, `studioOcclusion` (the AO tint) in the palette, and `scatterCrumbs` in `src/debug/scenes/gallery.ts`.
   - **Target:**
     - Pockets that stay golden-toasted (saturation at least 0.45 at every depth), with fine crumb texture and no dark blocky clusters.
     - A soft, scalloped carve edge.
     - A visible soft contact shadow under each floor crumb pile.
9. **Clean the remaining surface noise on the donuts.**
   - **What:**
     - The powdered tops still have scattered gray pepper specks (e.g. x 1270-1420, y 300-350 and on the lower powdered donut).
     - Every dough band still reads as shredded bark with vertical dark streaks (e.g. under the blueberry, x 800-1120, y 760-830).
     - The stand tops are much better, but they carry a dashed ring of dark dots and read as a cookie rather than turned wood. The legs are square posts.
   - **Where:** `sugarGrains` in `donut.ts`, the dough band and dough jitter, and `src/art/models/stand.ts`.
   - **Target:**
     - No sugar pixel more than 25 luma below its 5 px median.
     - Smooth golden dough with a lighter cream mid-stripe, value jitter within ±3-6 %, and no vertical streaks.
     - Stands that read as warm turned wood with faint grain, no dashed rings, and rounded legs.
10. **Fix the detached shadows and canopy sprinkles on gallery-props.**
    - **What:**
      - The cotton-candy tree's canopy shadow still lands on the curved backdrop as floating islands (x 200-250, y 625-640 and x 240-410, y 615-630), detached from its trunk.
      - The canopy sprinkles on the green and pink trees are flat bars grouped in horizontal bands, and several stick out past the silhouette (right edge of the green tree, about x 1320-1345, y 480-560).
    - **Where:** `studio.ts` (sweep `receiveShadow`, key direction), the props layout in `gallery.ts`, and the canopy sprinkle placement in `src/art/models/sprinkleTree.ts`/`props.ts`.
    - **Target:**
      - All cast shadows stay on the flat floor and stay attached to their caster.
      - Sprinkles are 1x1x3 capsules, half-sunk into the canopy, evenly distributed, AO'd, and none project past the silhouette.

**Plateau note:** items 1, 3 and 4 are the structural candidates. Small palette and noise nudges have now moved the mean by only about 0.05 per iteration. The next iteration must change the lighting model of the studio, or re-author Glazey's body/belly or the props set, rather than tune values.

## Previous review: status of M3-iter2 fix list
| # | item | status |
|---|---|---|
| 1 | Glazey face/belly flat-projection decal | **Partly fixed.** The eyes and blush no longer jut past the profile in the side view (fixed). The belly is still a ringed crescent bib with a flat/concave top. The decal-vs-body density mismatch remains. |
| 2 | Body surface and pose | **Partly fixed.** Neighbor spacing is fixed. The body mottling, stage-0 lumpy silhouette and T-pose fin arms remain. |
| 3 | Classic glaze opaque and blotchy | **Partly fixed.** The blotches are gone and the luma separation is about 12 %. It is still opaque, with no translucency, dough band or fresnel, and is now confusable with maple. |
| 4 | Studio flat and high-key | **Not fixed.** The fold function and vignette changed, but there is still no warm/cool split and no tight contact shadows. |
| 5 | Props materials and emissives | **Mostly not fixed.** The pink canopy is now matte. The crystal, lamp, rainbow glow and maple gloss are unchanged. |
| 6 | Props density and form | **Not fixed.** |
| 7 | Stands and dough bands | **Partly fixed.** The stands are smooth and quiet (a big improvement). The dough bands are still streaky bark. |
| 8 | Blueberry identity and grooves | **Partly fixed.** The dark grooves are gone. The craggy form is still lost. |
| 9 | Bite interiors and crumbs | **Partly fixed.** They are warmer (R-G about 30), rim crumbs are removed and the floor piles are near the feet. The pockets are still drab khaki, and contact shadows are faint. |
| 10 | Detached shadow blobs on the props backdrop | **Partly fixed.** The bakery smudge is gone. The cotton-candy tree's floating shadow islands remain. |

Reviewer r2's iter-2 items:
- **Bite colour:** partly fixed.
- **Belly decal bleed:** fixed. There is no cream strap in the side view and no cream seam on the back.
- **Classic translucency and value:** partly fixed.
- **Stand tops:** mostly fixed.
- **Chunky props:** not fixed.
- **Canopy sprinkles:** not fixed.
- **Powdered specks and jelly seat:** not fixed.
- **Warm studio light:** not fixed.
- **Blueberry crags:** not fixed.
- **Strip motion:** not addressed. The strip is still a static turntable.

## What is working (keep it)
- **Glazey's face:** big, round, glossy eyes with 2x2 glints, soft oval blush, a small open mouth, and stage 5's closed bliss arcs. The face is now flush with the head in profile. It still reads at 844x390.
- **Rainbow tuft:** clean five-stripe capsules and on-model.
- **Stands:** now quiet. The donuts are clearly the subject.
- **Chocolate glaze:** still the best material in the gate, with a continuous elongated specular.
- **Pink sprinkle donut:** glossy frosting, real drips and capsule sprinkles. It is on-reference.
- **Powdered donuts:** high-value, rough and clearly sugar, apart from the specks.
- **Bite carves:** real scalloped two-lobe carves with a glaze overhang, and the crumbs now sit near the stand feet.
- **Bakery and lighthouse:** charming, with a donut sign instead of text. The lighthouse is clean.
- **Low tier:** essentially identical to high, with no broken effects.

## Store-page test: no
- **Hero (gallery-donuts):** next to reference 04 it still looks like a clean CG asset sheet under a flat softbox, not a mouth-watering premium studio shot.
  - The classic donut is now a caramel twin of the maple bar.
  - The blueberry is a generic glossy lavender ring.
  - The rainbow is orange-heavy, stair-stepped and does not glow.
  - The grid is crammed, and the rainbow hides the chocolate.
- **Glazey:** the cutest it has been, but the ringed bib belly and lumpy oatmeal body would not survive a turntable trailer next to reference 03.

## Regression check
- **M0 and M1 finals:** the `Renderer.ts` change adds an opt-in `aoColor` that only the studio sets. No shared content changed, so there is no regression.
- **M2:** this commit changed `donut.ts`, `palette.ts`, `props.ts`, `sprinkleTree.ts` and `Renderer.ts`, which M2 shares. I recaptured `m2-hero` and `m2-closeup-donut` myself into `shots/M2/m3i3-rev/` and compared them side by side with `shots/M2/final/`.
  - The island lighting, grass, path, trees, lighthouse lamp glow, clouds and lagoon all match.
  - The close-up pink donut's dough band is marginally smoother. That is neutral to slightly better.
  - **No regression.**

```json
{"gate":"M3","iter":3,"verdict":"FAIL","mean":6.6,"min":5,"blockers":0,"store_page":false}
```
