# Review M3 iter 3 (reviewer r2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M3 --iter 3-r2`, which wrote 14 files to `shots/M3/3-r2/`. The harness used the GPU path (ANGLE Metal, Apple M4) and reported no errors. I viewed every PNG, plus 2× crops of Glazey (front, side, back), every donut flavour, the bite carves, the props, and a contrast-stretched copy of the backdrop. Before that I read `art/reference/NOTES.md` and viewed all four reference images.

Summary: iteration 3 is a sideways step, not a step up.
- **Fixed:** the belly decal no longer wraps around the body, and the stand dashes are lighter.
- **Changed:** the classic glaze was "fixed" by turning it into an opaque peach-caramel. It is now even and separates from the backdrop, but it has lost its identity. It reads as a second maple glaze, not translucent sugar glass.
- **Not touched:** fixes 5, 6, 7, 9 and 10 from the previous review (chunky props, flat canopy sprinkles, grey specks on the powdered sugar and the stuck-on jelly, the blueberry's craggy look, the motion strip).

The gate mean is about 7.0, the same as iteration 2. That triggers the §5 plateau rule. The next iteration needs structural changes, not parameter tweaks.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery-donuts (hero) | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | – | 7.1 |
| gallery-glazey-belly (+ strip) | 7 | 7 | 7 | 7 | 8 | 6 | 7 | 7 | 8 | 7 | 6 | – | 7.0 |
| gallery-props | 7 | 6 | 7 | 6 | 7 | 6 | 6 | 8 | 8 | 7 | – | – | 6.8 |
| gallery-donut-bites | 7 | 7 | 7 | 6 | 6 | 7 | 7 | 7 | 7 | 7 | – | – | 6.8 |
| gallery-low-tier | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 8 | 7 | – | 8 | 7.2 |

The gate mean is about 7.0 against a pass bar of 9.0 (8.5 for low tier). The minimum score is 6. Every shot has several categories below 8.

## Blockers
None. I found no §10 instant-fail item: no z-fighting, acne, holes, fireflies, debug overlays or Lego-scale character voxels. The failure comes from scores, not from blockers.

## Fix list (priority order; max 10; each concrete and testable)
1. **Re-author the classic glaze as translucent sugar glass, not caramel paint.**
   - **Where:** the classic look in `src/art/models/donut.ts`, the glaze colours in `src/art/palette.ts` (changed this iteration), and the glaze material in `src/engine/render/Materials.ts`.
   - **Problem:** in gallery-donuts lower-left (x 290–640, y 605–830) and the whole bottom row of gallery-donut-bites, the glaze is now a uniform opaque peach (sampled 245,188,126). It is the same hue family as the maple bar directly above it (237,158,71) and the peach backdrop. The hero now has three caramel-peach things in the left column, and the "classic" identity from reference 04 (pale, glassy, dough showing through) is gone.
   - **Problem:** there is still no fresnel rim.
   - **Problem:** the hole rim shows a jagged dark-orange staircase (x 420–510, y 680–720).
   - **Target:** a pale cream-ivory glaze, clearly lighter and less saturated than the maple (hue difference of at least 10° or a saturation difference of at least 0.2). The golden dough tint must visibly show through on top, thinner and warmer where the glaze is thin. Add a bright fresnel rim on the silhouette. Keep at least 12 % luma separation from the backdrop, which the glaze now meets. The hole rim should be smooth at 1:1.
2. **Rebuild Glazey's skin and belly to match sheet 03 (structural).**
   - **Where:** `src/art/models/glazey.ts`, covering the body SDF noise or surface jitter, `faceLayout` (belly), and the eye `lift`.
   - **Problem:** at 2× in every frame (front, side, back), the coral body is lumpy, bumpy and stucco-like. It looks like oatmeal or cellulite, worst on the back view (strip f2, all six, e.g. x 1290–1500, y 440–620). Sheet 03 is a smooth plush form with fine, regular voxel steps.
   - **Problem:** the belly patch is still a low crescent, a bowl with a nearly flat top (front, e.g. x 1340–1480, y 570–620). It sits in the bottom fifth of the body and shows concentric terrace rings. On the sheet, the belly is a large convex oval that rises to about mid-body, just under the mouth.
   - **Problem:** in profile (strip f1), the eyes still sit proud of the head line like goggles, and the mouth sticks out as a nub.
   - **Target:** a smooth body surface with no lumps above 1 body voxel of amplitude. Only fine per-voxel colour jitter (§4) should give the handmade feel. The belly is an oval whose top edge is clearly convex, rising to about 45 % of body height, with no visible terracing at 1:1. The eye and mouth decals sit flush with the body silhouette in profile.
3. **Make the bite interiors appetising, and ground the crumbs.**
   - **Where:** the crumb colours in `donut.ts`, the occlusion tint in `Materials.ts`/N8AO, and `scatterCrumbs` in `src/debug/scenes/gallery.ts`.
   - **Problem:** the hue in the carve pockets is now on target (35–38°), but the pockets fall to a desaturated khaki-grey (e.g. 145,119,74 at x 1690,y 620, and 160,130,82 at x 1500,y 620). At 1:1 they still read as stale or mouldy shadows, not toasty crumb.
   - **Problem:** the floor crumb piles (x 1020–1100, y 795–840 and x 1650–1740, y 795–845) have no contact shadow and look pasted on.
   - **Target:** occlusion in the pockets darkens toward toasted caramel `#B86B32`, keeping saturation at or above that of the lit crumb (no drop below 0.55). Each crumb has a visible soft contact shadow. Add a few crumbs on the stand top under the bite, as in reference 04.
4. **Bring the chunky props up to hero smoothness (unchanged from the last review).**
   - **Where:** `src/art/models/props.ts` (rock, pretzel trunk, donut tree), the pier model, and the mushroom patch.
   - **Problem:** in gallery-props, these still read as Minecraft staircases next to the smooth lighthouse and bakery:
     - the chocolate rock (x 1355–1540, y 720–855), whose sugar cap is a flat white patch with holes;
     - the pretzel trunk (x 320–375, y 500–735);
     - the pier stairs, rails and stringers (x 175–290, y 680–830);
     - the mushroom patch base, a stacked green disc (x 985–1120, y 810–870);
     - the hanging donuts (x 1420–1630, y 490–575), which are boxy, float under the canopy with no stems, and include a dark-brown ring.
   - **Target:** every silhouette at this framing reads as rounded. Sugar is dusted into the rock's crevices. The hanging donuts match the gallery donuts' quality and hang from visible stems.
5. **Embed the canopy sprinkles (unchanged).**
   - **Where:** sprinkle placement in `props.ts` / `sprinkleTree.ts`.
   - **Problem:** the green tree (x 1125–1350, y 410–600) and the pink tree (x 1590–1830, y 585–780) still carry flat rectangles in horizontal bands. Some poke past the silhouette (green tree, upper-left and right edges).
   - **Target:** 1×1×3 capsules, rotated in 90° steps, evenly scattered, half-sunk into the canopy and AO'd. None break the silhouette.
6. **Clean up the rainbow mega donut's band edges and drips.**
   - **Where:** the rainbow look in `donut.ts`.
   - **Problem:** the borders between colour bands are serrated staircases, readable at 1:1 (e.g. the red/orange border, x 790–1140, y 520–560). The drips under the rim are flat, hard-edged slabs of pure green, blue, yellow and violet (x 790–1140, y 545–600). They read as blocky debug colours, which is exactly reference 04's "stray green and rainbow artifacts" Ignore item.
   - **Target:** band borders blend over 1–2 voxels or follow a smooth curve. The drips are rounded and taper like the pink donut's, in the band colour above them, with the same gloss.
7. **Fix the powdered donuts: grey specks and the jelly (unchanged).**
   - **Where:** `sugarGrains` and the jelly placement in `donut.ts`.
   - **Problem:** there are still dozens of cool-grey 1–2 px specks on both sugar tops (e.g. x 1263,302; x 1340,360; x 1400,405). They read as pepper or ash.
   - **Problem:** the jelly is still a glossy blob stuck on the flank (x 1265–1355, y 370–410).
   - **Target:** no sugar pixel more than 25 luma below its 5 px median. The jelly oozes out of a dark, AO'd split in the dough band, as in reference 04's top-right donut.
8. **Restore the blueberry's craggy old-fashioned form (unchanged).**
   - **Where:** the blueberry look in `donut.ts`.
   - **Problem:** it is still a smooth lilac glaze with a gear-tooth edge. It now also has blotchy, darker camouflage patches across the glaze (e.g. x 800–900, y 640–760). The dough band underneath is speckled with near-black flecks.
   - **Target:** lumpy crags with shallow cracks that catch the light, keeping the `#7C8CE0` colour, an even glaze value, and warm toasted (not near-black) dough flecks.
9. **Give the studio an appetising key, and fix the backdrop "folds".**
   - **Where:** `src/debug/scenes/studio.ts` (sweep folds, key light, framing).
   - **Problem:** the cloth folds added to the backdrop read as dirty grey vertical smudges, not draped cloth, especially in the upper half of gallery-props and the top corners of gallery-glazey-belly. Real folds have a lit side and a shadow side; these have only the dark streak.
   - **Problem:** the specular highlights are still white rather than warm, and there is no cool tint in the shadow cores.
   - **Problem:** the bottom third of every gallery frame is empty floor (y 880–1080 in the hero).
   - **Target:**
     - The folds are either readable cloth (a highlight paired with each shadow) or removed.
     - The highlights on the chocolate, frosting and glaze are warm.
     - The shadow cores lean slightly cool.
     - The grid is framed so the lowest stand feet sit about 90 px above the bottom edge.
10. **Give the Glazey strip actual motion (unchanged).**
    - **Where:** `gallery.ts`, the `gallery-glazey-belly` strip.
    - **Problem:** the strip is still a static front/side/back turnaround. Rubric 11 needs visible squash and stretch, and §7 needs the belly wobble.
    - **Target:** at least one strip shows a belly-stage transition mid-wobble, plus a land or munch pose with visible squash and stretch.

## What is working (keep it)
- **Belly decal containment:** no cream strap in profile and none visible from the back. The decal now respects the facing test and the foot crease.
- **Glazey's eyes:** big, round, glossy, with a strong upper-left glint and a secondary twinkle. The blush and the stage-5 bliss arcs are still charming, and the six belly stages read as six distinct silhouettes.
- **Pink sprinkle donut and chocolate donut:** at reference quality. Glossy frosting, real drips, a clean continuous chocolate specular.
- **Classic glaze value:** it now separates from the backdrop (luma about 197 vs 225). Keep that separation when re-authoring the hue and translucency.
- **Stands:** the dashes are noticeably lighter than in iteration 2. They are still visible as a ring of dark stitches along each rim, but no longer the busiest texture in the frame.
- **Props:** the bakery, lighthouse (the lantern drum is now clean cream), cotton-candy tree and candy-cane fence are strong and charming.
- **Low tier:** matches high tier, with no broken effects.

## Store-page test: no
The hero (gallery-donuts) is a tidy, likeable asset sheet, but it would not sit next to reference 04 or the year's best indie key art:
- The left column is three shades of caramel.
- The rainbow mega donut, which should be the centrepiece, has staircased band edges and blocky debug-coloured drips.
- Three of the nine flavours miss their material identity: classic (opaque), blueberry (not craggy) and jelly (a stuck-on blob).
- The light is clean but not edible.

## Previous review (M3-iter2-r2) fix-list status
1. Bite interiors and crumbs: **partly fixed.** The hue is now warm, but the pockets desaturate to khaki-grey. The floor crumbs sit next to the stand foot but have no contact shadow.
2. Belly decal projection: **partly fixed.** There is no wrap in profile and no cream from the back. The top edge is still a near-flat bowl with terracing, and the eyes are still slightly proud in profile.
3. Classic glaze translucency and separation: **partly fixed, with a new problem.** It is now even and separates from the backdrop, but it is opaque caramel-peach with no tint-through or fresnel rim, and it duplicates the maple bar.
4. Stand-top striations: **partly fixed.** They are lighter, but the dashed ring is still visible at 1:1.
5. Chunky props: **not fixed.**
6. Canopy sprinkles: **not fixed.**
7. Powdered specks and jelly: **not fixed.**
8. Warm studio light: **partly fixed.** The backdrop is warmer, but the highlights are still white, the shadow cores are not cool, and the empty lower third remains. The new fold streaks read as smudges.
9. Blueberry craggy identity: **not fixed.** It now also has blotchy patches.
10. Motion strip and lantern residue: **lantern fixed, motion not fixed.**

**Plateau note (§5):** reviewer r2's gate means were 6.5 (iteration 1), 7.0 (iteration 2) and about 7.0 (iteration 3). The builder must make structural changes next, for example re-authoring Glazey's surface and belly, the classic glaze material, and the props listed in fix 4, rather than more palette tweaks.

## Regression check
- **M2** (shared `donut.ts`, `palette.ts`, `Materials.ts`, `Renderer.ts`, props): I re-rendered at HEAD into `shots/M2/m3i3reg-r2/` and compared `m2-hero` and `m2-closeup-donut` with `shots/M2/final/`.
  - The island, lighthouse, bakery, grass, lagoon and clouds are unchanged.
  - The closeup donut's frosting specular is slightly smoother than in the final.
  - The small island donuts pick up the new caramel classic glaze, which is acceptable at that scale.
  - **No regression.**
- **M0 and M1:** this iteration touched no shared terrain or test-cube content. The renderer change is a 4-line addition. Iteration 2's comparison found only the pre-M3 pipeline grade differences. **No regression attributable to M3.**

```json
{"gate":"M3","iter":"3-r2","verdict":"FAIL","mean":7.0,"min":6,"blockers":0,"store_page":false}
```
