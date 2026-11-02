# Review M3 iter 2
## Verdict: FAIL

Captured by the reviewer: `npm run shots -- --gate M3 --iter 2` at commit `3a25777` (GPU path, ANGLE Metal on Apple M4; harness `ok: true`; 14 files in `shots/M3/2/`). I viewed every 1920x1080 and 844x390 frame, all three strip frames and the composite, plus 2-6x crops and grayscale and contrast-stretched versions of the hero and props shots. Before capturing, I read all four reference images and `art/reference/NOTES.md`. The main references for this gate are 04 (donut lineup, studio) and 03 (Glazey sheet).

Note: iter 1 ran on SwiftShader and this run used the GPU path. That accounts for small pixel-level differences but does not change any finding below.

This is a real step forward. Both iter-1 blockers are gone: the lantern streaks are fixed, and Glazey's back view has no fireflies (an automated isolated-pixel scan found 0; the only hits in the front and side views are the intended eye glints). Glazey's eyes are now large, round and glossy and on-model, so stages 0-4 are genuinely cute. Powdered now reads as white and rough. The blueberry is no longer Minecraft-stepped.

It is still nowhere near the bar. The studio is still a flat, high-key peach box with no warm/cool shaping. The new 1/128 m face and belly decal is projected flat from the front. It reads as a sticker mask in the side view, and the belly patch is a protruding plate. The classic glaze is an opaque cream donut with camouflage blotches. Most of the props from iter 1's fix 6 (crystal, lamp, pink tree, pier and fence, rock) are untouched. Every shot still has categories at 5-6.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 7 | 6 | 7 | 7 | 6 | 6 | 6 | 7 | 7 | – | – | 6.6 |
| gallery-glazey-belly | 7 | 7 | 6 | 6 | 8 | 6 | 6 | 6 | 8 | 7 | – | – | 6.7 |
| gallery-glazey-belly_strip (turntable) | 6 | 7 | 6 | 6 | 8 | 6 | 6 | 6 | 6 | 7 | 6 | – | 6.4 |
| gallery-props | 7 | 6 | 6 | 6 | 7 | 5 | 5 | 7 | 7 | 6 | – | – | 6.2 |
| gallery-donut-bites | 7 | 7 | 6 | 7 | 6 | 6 | 7 | 7 | 7 | 7 | – | – | 6.7 |
| gallery-low-tier | 7 | 7 | 6 | 7 | 7 | 6 | 6 | 6 | 7 | 7 | – | 8 | 6.7 |

- **Gate mean:** about **6.55**. The bar is 9.0, or 8.5 for low-tier.
- **Minimum:** **5** (props materials and voxel form).
- **Plateau watch:** iter 1 scored 6.1 (r1) and 6.5 (r2), and this iteration scores about 6.55. Against r2 that is a gain of less than 0.3. If iter 3 also improves by less than 0.3, §5 requires a structural change.
- **Strip column 11:** the strip is a front/side/back turntable, not a squash-and-stretch sequence. Column 11 therefore scores only how well the forms hold up in rotation.

## Blockers
None. No art bible §10 instant-fail item was found this iteration:
- **Lantern streaks:** fixed. The lantern drum and cap are clean at 3x.
- **Glazey fireflies:** fixed. The back view has 0 isolated bright pixels.
- **Blueberry slits:** they no longer show dough. What remains are short dark-blue grooves (see fix 8), not holes.
- **Floor gradient banding:** only visible after a 6x contrast stretch (1-level steps). It is not visible at normal viewing, so it is not a blocker.

The gate fails pass-bar items 2 (every category at least 8), 3 (mean) and 4 (store page).

## Fix list (priority order; max 10; each concrete and testable)
1. **Glazey's face and belly decal is a flat front projection.**
   - **What:**
     - In the strip's side view (f1), the eyes, blush and mouth sit on one flat card. The far eye is visible beside the near one, and the eyes jut past the head silhouette like goggles.
     - The cream belly patch is a separate plate standing proud of the body. In the front view it has a straight horizontal top edge, so it reads as a D-shaped bib. At stages 4-5 its lower-left corner overhangs the body outline (gallery-glazey-belly, about x 1250 and x 1530, y 600-640). In profile it is a flat cream wedge sticking out of the curve.
     - The 1/128 m decal is 4x denser than the 1/32 m body, so the face looks vector-smooth while the body looks knitted. That is two art styles on one character.
   - **Where:** `src/art/models/glazey.ts`:
     - `faceGrid.generate`, about line 152, samples `face(x, y, 0)`, a pure orthographic z projection.
     - `lift` and `SOCKET_DEPTH`, about lines 193-200.
     - The belly ellipse, about lines 226-273.
   - **Target:**
     - Features wrap the body curvature: project along the surface normal, or fall off by facing angle. Nothing extends beyond the body silhouette in any of the three turntable views.
     - The belly patch is flush, with a lift of 0.5 body voxel or less, and is a soft oval with a rounded top as in reference 03.
     - Author the decal at 1/64 m (the art bible's finest sanctioned scale) so it sits closer to the body's density.
2. **Glazey's body surface and pose.**
   - **What:**
     - The body still has the knit/oatmeal mottling. Square facet shading is visible across the whole sphere at stage 5 (far right) and on the back view, and the 1/32 m cells show as a checker of value patches.
     - The arms stick out horizontally as flat fins in a T-pose, unlike the stubby, slightly lowered arms in reference 03.
     - The arms of stages 4 and 5 touch and overlap (about x 1505-1525, y 540).
   - **Where:**
     - Character normal smoothing in `src/engine/voxel/mesh.ts` and `Materials.ts`, and the body jitter amplitude in `palette.ts`.
     - The arm ellipsoids in `glazey.ts`.
     - The lineup spacing in `src/debug/scenes/gallery.ts`.
   - **Target:**
     - The body reads as a smooth, squishy surface at gallery distance, with value jitter within ±3-6 % and no visible facet checker.
     - The arms angle about 30-40° downward and are rounder.
     - There is at least 40 px of background between neighboring Glazeys.
3. **Classic glaze is still opaque, and now has camouflage blotches.**
   - **What:** The bottom-left donut in gallery-donuts and the bottom row of gallery-donut-bites are fully covered in an opaque cream fondant with large irregular light and dark patches. In the stretched grayscale these look like camouflage. The glaze reaches the stand, so the dough band is almost hidden. It is not semi-translucent (art bible §5), and it is the weakest grayscale read in the frame: glaze top luma 220 against backdrop 231.
   - **Where:** `classicGlaze`, `classicGlazeThin` and `classicGlazePool` in `src/art/palette.ts` (lines 68, 171, 197), the classic look in `src/art/models/donut.ts`, and the translucent flag shading in `Materials.ts`.
   - **Target:**
     - A thin, even, glossy amber-cream layer through which the golden dough tints (warmer and darker where the glaze is thin over curvature).
     - No large-scale blotch noise.
     - A visible golden dough band on the lower 35-40 % of the side.
     - A fresnel rim on the silhouette.
     - At least 15 % luma separation from the backdrop, as in reference 04 bottom-left.
4. **The studio lighting is still flat and high-key.**
   - **What:**
     - In every shot the key barely shapes form. There is no visible warm-key/cool-fill split: the shadow sides of the glaze are not cooler, and Glazey's shaded side is the same coral, just darker. Shadows are pale lilac-gray smears.
     - The "cloth folds" show up only on the props wall, as regular vertical light and dark columns (about x 330, 1400 and 1800). They look like banding or curtains, not draped fabric, and are absent from the donut shots.
     - Reference 04 has a bright warm key, defined specular, darker tight contact shadows and soft irregular fabric folds behind the subjects.
   - **Where:** `src/debug/scenes/studio.ts`: the key, fill and rim intensities and colors, and the fold function at lines 74-83.
   - **Target:**
     - A clear warm key with cool fill, so a Glazey or donut shaded side reads measurably bluer than its lit side.
     - Contact shadows under stands and feet that are noticeably darker and tighter than the long cast shadows.
     - Irregular diagonal folds of varying width (not periodic vertical columns), visible behind the donut lineup as well.
     - Every subject at least 15 % luma apart from the background directly behind it.
5. **Props materials are untouched since iter 1.**
   - **What:**
     - The rock-candy crystal (gallery-props, centre bottom, about x 1215-1300, y 710-840) is still a smooth, unvoxelled lilac/mint plastic blob with no glow, although art bible §5 says crystals must be emissive with bloom.
     - The lighthouse lamp donut (about x 525-630, y 155-265) is a pale, unlit disc, while the same asset glows in M2's island hero.
     - The pink sprinkle tree (lower right) is still a wet, glossy gumball.
     - The rainbow mega donut has no glow at all, and its outer orange band dominates.
     - The maple bar is still a matte tan plastic eclair with no amber gloss.
   - **Where:**
     - `bloomThreshold: 1.2` in `studio.ts` (line 172) is above what the crystal and lamp reach.
     - The `crystalLilac` and `crystalMint` emissive strength (palette lines 168-169) and the crystal SDF in `props.ts` (about line 187).
     - The pink canopy material, and the `rainbow*` and maple entries in `palette.ts`.
   - **Target:**
     - The crystal and lamp have a soft visible bloom halo in the studio.
     - The crystal is faceted with voxel steps visible on close view.
     - The pink canopy roughness is at least 0.7, with sprinkles embedded in it.
     - The rainbow has a gentle glow, with band widths even across the six colors.
     - The maple top is glossy amber with a specular streak.
6. **Props density and form are mismatched.**
   - **What:**
     - The pier is boxy Lego decking (lower left, x 180-650, y 680-870).
     - The fence rails are flat waffle-grid slabs.
     - The pier stair stringers and the pretzel trunk are hard staircases.
     - The gingerbread rock (about x 1355-1540, y 720-850) shows 6-7 px cubes with a blotchy white cap. It still reads as a moldy lump, which is close to the art bible §3 6 px prop limit.
     - These sit next to the near-smooth crystal and trees, so the set does not look like one world (art bible §2: "grid-aligned, boxy" is forbidden).
   - **Where:** `src/art/models/props.ts` (pier, fence and rock builders) and `lighthouse.ts` (pier stairs, if they are shared).
   - **Target:**
     - Planks with rounded ends, slight warp and a per-plank height wobble.
     - Fence rails as rounded candy or wood rails with no grid tiling.
     - The rock's voxels at or below 4 px, with sugar dusted on top faces only and a recognizable choco or gingerbread read.
7. **Stands and dough bands look unappetizing.**
   - **What:**
     - The stand tops show stepped contour rings with rows of dark dash speckles (every stand, e.g. the blueberry stand at about x 810-1110, y 700-800), and the rims are vertical stripe noise.
     - On every donut, the dough band reads as shredded bark or coconut, with vertical dark streaks, rather than soft baked dough with the cream mid-stripe of reference 04.
   - **Where:** `src/art/models/stand.ts`, the wood and dough jitter in `palette.ts`, and the dough band in `donut.ts`.
   - **Target:**
     - Stand tops read as one smooth turned-wood disc with a faint grain hint and no dark dashes.
     - The dough band is smooth golden caramel with a lighter cream stripe, with value jitter within ±3-6 % and no vertical streaks.
8. **The blueberry has lost its identity, and the grooves remain.**
   - **What:** The bottom-centre donut is now a smooth, glossy lavender iced ring with a scalloped edge. The craggy old-fashioned cake look of reference 04 is gone. Three short dark grooves remain on its top and front: about (970, 690-720), (1050, 675) and (1065, 620). At normal view they read as knife cuts.
   - **Where:** the `craggy` form and `crackGlaze()` in `donut.ts`.
   - **Target:**
     - Soft, rounded crag lumps (4-6 per quadrant) with a matte-to-satin cake-glaze sheen, not a mirror gloss.
     - Fissures that are irregular, shallow and lighter, not dark straight slots.
     - At 1080p the silhouette is lumpy but smooth, never stepped.
9. **Bite interiors are olive, and the crumbs don't sit.**
   - **What:**
     - In gallery-donut-bites, the AO in the bite cavities shifts to a desaturated khaki-olive: RGB (150,128,88) at (1700,630), and (151,131,93) at (1560,360). It looks moldy next to the warm crumb.
     - The crumbs at the stand rims hang over the edge without support (about x 1735-1770, y 715-745, and x 1065-1095, y 440-460).
     - The two floor piles (about x 1090-1150 and x 1725-1800, y 825-860) have no contact shadow.
   - **Where:** the bite interior colors and AO tint in `donut.ts` and `mesh.ts`, and `scatterCrumbs` in `gallery.ts`.
   - **Target:**
     - Cavity shadows stay warm (hue held toward toasted dough, R > G by at least 25).
     - Every crumb rests on a surface and casts a visible small contact shadow.
     - The floor piles sit within about 60 px of the stand foot.
10. **Detached shadow blobs on the props backdrop.**
    - **What:**
      - The cotton-candy tree's canopy shadow falls on the curved backdrop as two floating dark blobs (about x 220-450, y 570-625, plus an island at x 215-260, y 605-625), disconnected from its trunk.
      - The bakery roof casts a mystery smudge on the wall to its left (about x 700-760, y 520-570).
      - The big centre blob from iter 1 is gone, but the problem has moved rather than been solved.
    - **Where:** `studio.ts` (sweep `receiveShadow`, key direction) and the props layout in `gallery.ts`.
    - **Target:** No prop shadow lands on the vertical or curved part of the sweep. All cast shadows stay on the flat floor and stay attached to their caster.

## Previous review: status of M3-iter1 fix list
| # | item | status |
|---|---|---|
| 1 | Blueberry staircase, slits and pits | **Partly fixed.** The staircase and the dough-showing slits are gone, but the craggy form is lost and dark grooves remain (fix 8). |
| 2 | Glazey eyes and mouth | **Mostly fixed.** The eyes are big, round, glossy and glinted. The mouth is a small open slot with a tongue. A new problem is the flat-projection decal (fix 1). |
| 3 | Flavors read apart | **Partly fixed.** Powdered reads white and rough (fixed). The jelly is a glossy blob stuck on the side, not seated in a split (partly). The classic glaze is still opaque, now blotchy (not fixed). |
| 4 | Studio flat and monochrome | **Partly fixed.** The sweep is lighter and donut colors separate better, but there is still no warm/cool shaping, no real cloth folds, and the cream items are weak in grayscale. |
| 5 | Stands dominate | **Partly fixed.** They are smaller and quieter, but still show contour-ring and speckle noise (fix 7). |
| 6 | Props fidelity | **Mostly not fixed.** Only the green canopy is matte. The crystal, lamp, pink tree, rock, pier and fence are unchanged. |
| 7 | Props wall shadow and composition | **Partly fixed.** The centre blob is gone and the clouds are higher, but new detached blobs appear at left and near the bakery. |
| 8 | Glazey body noise, belly edge, blush | **Partly fixed.** The blush is a soft oval (fixed) and the belly edge is a clean ellipse (fixed, but it is now a proud plate). The body noise is not fixed. |
| 9 | Rainbow mega donut | **Partly fixed.** The bands are smoother and the hole is clean, but there is no glow and the orange band dominates. |
| 10 | Maple bar | **Partly fixed.** A dough band and small drips now show, but there is no amber gloss and it still reads as plastic. |

Reviewer r2's blockers (lantern streaks, Glazey fireflies) are both **fixed**. Status of r2's other items:
- **Chocolate specular terraces:** fixed. The chocolate highlight is now continuous and is the best material in the gate.
- **Classic glaze translucency:** not fixed.
- **Powdered:** fixed.
- **Bite interior:** partly fixed. It is warmer than before, but still olive in the AO.

## What is working (keep it)
- **Glazey's new eyes:** large, round dark-brown irises with a lighter lower half, a 2x2-style main glint plus a secondary glint, and glossy domes. At stages 0-4 the character is now on-model and charming. Stage 5's closed bliss arcs are lovely. The silhouette and face still read at the 844x390 size (about 100 px tall).
- **Chocolate glaze:** rich, with a continuous elongated specular. It is the closest asset to reference 04.
- **Powdered and jelly-powdered:** high-value and rough, with dough visible below. They now read clearly apart from the classic.
- **Pink sprinkle donut:** still good, with glossy frosting, real drips and capsule sprinkles.
- **Pastel swirl:** clean, appetizing and palette-true.
- **Lighthouse lantern:** clean now. The railing, cap and drum have no streaks.
- **Bakery:** charm, donut sign instead of text, cruller trim, lit windows.
- **Green canopies:** now matte.
- **Bite carves:** real scalloped two-lobe carves with a glaze overhang.
- **Low tier:** visually indistinguishable from high. About 45k pixels differ by more than 10 levels and 3.7k by more than 30, and no effect is broken.

## Store-page test: no
- **Hero (gallery-donuts):** next to reference 04 it still looks like a clean CG asset sheet, not a mouth-watering premium studio shot. The lighting is flat and peach with no shaping. The classic donut looks like a blotchy fondant ring, and the blueberry has become a generic glossy iced ring. The stands and dough bands are noisy and staircased next to smooth glazes, and nothing glows.
- **Glazey:** the most improved asset. A front crop of stage 1-3 would almost hold up on a store page, but the side view's stuck-on mask and plate belly would not survive a turntable trailer.

## Regression check
- **M0 and M1 finals:** they share only the mesher. The `mesh.ts` change in this commit (6³ normal window on gloss corners, crack-growth skip for relaxed quads) does not affect their flat test content. No regression is expected or seen in shared content.
- **M2:**
  - **Recapture:** this commit changed shared files (`donut.ts`, `palette.ts`, `Materials.ts`, `mesh.ts`, `lighthouse.ts`, `props.ts`), so I recaptured all of M2 myself into `shots/M2/m3i2-rev/` (GPU path) and compared it with `shots/M2/final/` (SwiftShader).
  - **Side by side:** `m2-hero` and `m2-closeup-donut` are visually the same. The island lighting, pink sprinkle donut, grass, path, the still-glowing lighthouse lamp and the clouds all match.
  - **Pixel diffs:** pixel differences (hero: 3.4k pixels more than 50 levels apart; closeup: 343) match the change of renderer path.
  - **One content change:** one lagoon-ring donut on the island (about x 1130, y 745) is now the classic-glazed look. It reads fine at that distance.
  - **Verdict:** **no regression.**

```json
{"gate":"M3","iter":2,"verdict":"FAIL","mean":6.55,"min":5,"blockers":0,"store_page":false}
```
