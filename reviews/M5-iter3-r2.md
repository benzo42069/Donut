# Review M5 iter 3 (reviewer 2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M5 --iter 3-r2` at commit `497f9da`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 18 files to `shots/M5/3-r2/`.
- **Viewed:**
  - Every 1920x1080 still, the 844x390 hero and the roll at 844x390.
  - Both strip composites and all six strip frames.
- **Zoomed crops (2x, nearest-neighbour):**
  - Glazey's face and the donut in bite-1, bite-3 and crumbs f0/f1/f2.
  - Burp f0 and f1, and the burp f2 foreground donut.
  - The roll ball and the roll foreground band.
  - The bite-3 lower-left foreground.
- **Sampled:** pixel luma, hue and saturation with a scratchpad script (11x11 means and region percentiles).
- **Read beforehand:**
  - `docs/ART_BIBLE.md` and `docs/AGENTIC_LOOP.md` §3-§4.
  - `art/reference/NOTES.md` and all four references.
  - The M2, M3 and M4 finals.
- **Pass bar:** mean ≥ 7.5 and every category ≥ 6. I applied it unchanged.

**Summary.** This is a real improvement in staging over iter 2:
- The bald grass pad is gone.
- The ladder rails no longer grow out of Glazey's head.
- The donut is lifted and turned so the glaze and sprinkles face the lens.
- The bite-3 scallops sit at his lips.
- The world framing (bakery, lighthouse, trees) is lovely.

Even so, the gate is still a mid-6 because of the core M5 subject:
- **The held glaze** is still beige-khaki (median luma 133). Its "gloss" is a chain of bloom sparkles, not a specular surface.
- **The foreshortened near arm** reads as a pig snout under the mouth.
- **The crumbs** still spray over the forehead and eye in crumbs f0.
- **The belly** is still a flat sticker, now with a darker outline ring.
- **The roll shot** has lost the tuft, has no motion cue and keeps the cream "bib".

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 7 | 7 | 7 | 6 | 7 | 6 | 6 | 7 | 6 | 7 | – | 6.6 |
| m5-bite-3 (hero) | 7 | 7 | 7 | 6 | 7 | 6 | 6 | 7 | 7 | 7 | – | 6.7 |
| m5-crumbs-strip | 6 | 7 | 7 | 6 | 7 | 6 | 6 | 7 | 6 | 6 | 6 | 6.4 |
| m5-burp-strip | 8 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 8 | 7 | 7 | 7.1 |
| m5-belly-5-roll | 6 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | 7 | 7 | – | 6.5 |

- **Gate mean:** 6.7 over all 52 category scores (346 / 52). The bar is 7.5.
- **Minimum:** 6. No category is below 6.
- **Gap to the bar:** the gate fails on the mean, by 0.8.
- **Trend:** 6.3 → 6.6 → 6.7. That is +0.4 over the last two iterations, so the §5 plateau rule is not formally triggered. However, this iteration gained only +0.1. If iter 4 also gains less than 0.3, a structural change is mandatory.

## Blockers
None. Here is the art bible §10 check across all shots:
- **Lighting artifacts:** no z-fighting, shadow acne, light leaks or mesh holes.
- **Overlays and sky:** no debug overlays and no sky banding.
- **Kid-safety:** nothing scary.
- **Carve slivers (bite-3):** the 1-voxel slivers and the proud crumb column from iter 2 are gone. One glaze tooth remains at the bite lip (fix 3). That is a cleanliness issue, not a mesh hole.
- **Roll foreground:** the faceted zig-zag shading on the frosting band is also present in the M4 final, so it is not new. I scored it under category 10.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** make the held vanilla glaze truly glossy and light, not beige with sparkles. This is the third iteration in a row on this item.
   - **Problem:**
     - In bite-1 the glaze samples at median luma 132-135, p98 145, with hue 23 and saturation 0.27-0.34. The regions are the left lobe (735-790, 580-640) and the front (800-880, 640-680).
     - The only bright pixels are a dotted chain of bloom sparkles along the inner rim at (880-960, 560-600), with p98 at 226. It reads as fairy lights strung on putty, not as a glossy surface.
     - Compare the M3 gallery (`shots/M3/final/gallery-donut-bites`): the same glaze is pale cream, about 200 luma, with a broad soft specular lobe and a fresnel rim.
   - **Where:**
     - The glaze spec, roughness and rim terms in `Materials.ts`.
     - The sparkle emitter for the held donut, if it is separate.
     - The held-donut orientation relative to the sun in `Munch.ts` and `m5Munch.ts`.
   - **Target:**
     - Glaze median ≥ 175 luma on the lit top.
     - One continuous soft specular streak (not discrete sparkle dots), plus a warm rim against the background.
     - It should read at 844x390 as M3's donut.
     - If the sun angle makes this impossible, add a character-local rim or key light for the munch close-up.
2. **What:** stop the near arm reading as a snout.
   - **Where:** the munch arm pose in `GlazeyAnimator.ts` and `m5Munch.ts`.
   - **Problem:**
     - In bite-1 (1010-1080, 600-680), bite-3 (980-1060, 630-700) and every crumbs frame, the near stubby arm points straight at the camera from just under the mouth.
     - Foreshortened, it is a round coral bulb right below the lips that reads as a pig nose or trunk.
     - It does not visibly touch the donut. The donut's rim ends roughly 10-30 px left of it.
   - **Target:**
     - Both hands sit on the donut's rim at its sides, as in 03 "munching": the near hand overlaps the donut's front-lower edge, and the far hand peeks around the far rim.
     - No coral blob sits between the mouth and the belly.
3. **What:** finish the carve so it reads as 04's clean scallops with a golden crumb.
   - **Where:** `src/engine/voxel/Carve.ts` (the fin and orphan pass) and the bite SDF in `Munch.ts`.
   - **Problem:**
     - In bite-3 a tall glaze tooth still stands up at the bite lip, at about (985-1000, 615-640).
     - The scallop edge is irregular.
     - The exposed crumb across the donut's lower half (700-960, 680-750) samples at luma 111-117 with hue 35. It is a dark, noisy granola texture rather than 04's light golden crumb.
   - **Target:**
     - No glaze voxel protrudes past the scallop line.
     - The crumb face is ≥ 160 luma where it faces the light, with lower-amplitude jitter.
     - A clean glaze-over-dough band at the lip.
4. **What:** make the crumbs burst from the bite at mouth height, not over the forehead. This is the second iteration with no fix.
   - **Where:** the `crumbs.emit` origin and initial velocity in `Game.ts` and `VoxelParticles.ts`.
   - **Problem:** in crumbs f0 about 40 crumbs cover the forehead and the near eye squint, at about (950-1060, 580-690).
   - **Already working:**
     - f1 is good: crumbs tumble over the belly and down to the grass, a nice nod to 03.
   - **Also a problem:** f2's settled crumbs are swallowed by the grass and almost invisible, as a dark scatter at about (960-1050, 830-880).
   - **Target:**
     - f0 shows no crumbs above the mouth line.
     - In f2, 8-15 crumbs are readable on top of the grass blades, lit and at least 140 luma, so they don't sink below the blade tops.
5. **What:** make the belly a shaded, convex form. This item is not fixed.
   - **Where:** the belly patch in `src/art/models/glazey.ts`, its palette entry in `palette.ts`, and the character shading.
   - **Problem:**
     - In roll the belly samples at luma 174 at the top (1040-1120, 630-660) and 170 at the bottom (1040-1120, 710-735). That is a 4-point gradient, so the patch is flat.
     - The new "graded seam" is a darker ochre outline ring, which makes it read more like a sticker with a border. It also has a stair-stepped left edge in bite-1 and crumbs f2.
     - In roll it has a straight, flat bottom edge at about y = 735 and starts right under the mouth, so it still reads as a cream bib or chin.
   - **Target:**
     - At least 35 luma from top to bottom, following the ball's lighting.
     - No outline ring, with a soft one-voxel blend into the coral.
     - An elliptical outline, centred low on the ball in roll as in 03 "perfectly round".
6. **What:** make the belly-5 roll read as a roll and as Glazey.
   - **Where:** the roll pose and FX in `GlazeyAnimator.ts`, and the roll stage framing in the M5 stages.
   - **Problem:**
     - The face is upright and smiling, but the rainbow tuft is almost entirely hidden behind the ball. Only the tips peek out at about (975-1060, 480-500).
     - There is no visible dust, no grass parting and no contact squash, despite "more roll dust" in the commit.
     - The ball is about 30 % of the frame height.
     - The bottom 15 % of the frame is a flat pink frosting band of oversized sprinkles (fix 8).
   - **Target:**
     - The tuft is visible on the silhouette.
     - 2-4 lit dust or crumb puffs trail behind the ball and are visible at 844x390.
     - A 5-8 % contact squash and bent blades at the contact.
     - The ball at ≥ 35 % of the frame, and the camera raised or yawed so the foreground band takes ≤ 5 %.
7. **What:** keep near terrain within the density rule. This has been open since iter 1.
   - **Where:** the munch, crumbs and roll camera distance and pitch, or the near-band grass and tuft LOD and the path mesher.
   - **Problem:**
     - In bite-1, bite-3 and crumbs, the corner grass tufts at the lower left (0-160, 980-1080) and lower right (1500-1920, 940-1080) measure about 13-16 px per voxel.
     - The dough-path cells across the lower third are about 15-20 px.
   - **Target:** no terrain voxel above 12 px at 1080p in any frame. Pulling the camera up slightly or cropping the near band achieves this.
8. **What:** fix the oversized foreground sprinkles and the faceted frosting.
   - **Where:** the sprinkle scatter scale for near terrain, and the frosting surface mesher or normals.
   - **Problem:**
     - In roll (0-1920, 920-1080) and on the upper-left canopy in bite and crumbs (0-330, 0-420), single sprinkles are about 20-25 px long and 8-10 px thick, about 8 px per voxel. That is over the prop limit of about 6 px.
     - The frosting under them shows zig-zag triangle shading creases (roll, 700-1000, 940-1000).
     - Both are shared with the M4 final, so this is not a regression, but they are what drags density and cleanliness to 6.
   - **Target:**
     - Sprinkles at ≤ 6 px per voxel at every gameplay camera.
     - Smooth frosting shading with no sawtooth creases.
9. **What:** make the burp's ground reaction and distortion visible.
   - **Where:** `src/game/fx/BurpWave.ts` and the grass sway it drives.
   - **Already there:** the upright pastel ring and the expanding dotted ground ripple from f1 to f2 read well.
   - **Problem:**
     - No grass inside the ring visibly bends outward.
     - No screen-space warp is detectable near the ring in f1.
   - **Target:**
     - In f1, the blades within about 1 m of the ripple front lean outward visibly.
     - A subtle refraction band hugs the ring's outer edge.
10. **What:** clean up the munch composition.
    - **Where:** the munch camera in `FollowCamera.ts` and `m5Munch.ts`.
    - **Problem:**
      - The near canopy is cropped hard into the top-left corner (0-330, 0-430) in all bite and crumbs frames. It is a heavy, noisy pink mass that competes with the subject.
      - A long dark tree shadow cuts the foreground path (450-1400, 940-1080).
    - **Target:**
      - The top-left canopy is either fully out of frame or reads as a soft framing element no larger than about 10 % of the frame.
      - The lower third is quiet and readable.

## What is working (keep it)
- **The bald pad is fixed.** The lawn is continuous under the donut.
- **No more antennae.** The ladder rails are clear of the head and tuft.
- **The donut is lifted and opened toward the lens**, so the sprinkles read and the scallop sits at the lips (bite-3).
- **Munch framing.** Bakery, lighthouse, sprinkle trees and the frosting rim with drips make a rich, warm, on-reference backdrop.
- **Burp strip:** the surprised "o" face with big glossy eyes (f0), the wide-open burp mouth (f1) and the laugh (f2) are charming and on-model with 03. The ring is clean, pastel and voxel.
- **Crumbs f1:** crumbs tumble over the belly toward the grass, a direct nod to 03 "munching".
- **Roll face:** the happy face with large glinting eyes and blush is very cute.
- **Lighting and grade:** they match the M4 final.

## Store-page test: no
At 844x390 the hero (m5-bite-3) now reads as "a happy creature munching a big donut in a candy world", which is real progress. A polished store page would still not ship it:
- The donut glaze is dull beige rather than appetizing gloss.
- The coral snout-like arm sits under the mouth.
- The crumb face is noisy.
- The cream belly patch is flat.

## Previous fix list (M5-iter2-r2) status
1. **Glossy vanilla glaze:** partly fixed. The donut faces up and has sparkle glints, but the glaze median is still about 133 luma with no specular lobe.
2. **Carve scallops:** partly fixed.
   - The fins and stray chunk are gone, and the scallops read at the lips.
   - One glaze tooth remains, and the crumb is dark and noisy (111-117 luma).
3. **Bald pad under the donut:** fixed.
4. **Belly as a shaded form:** not fixed. It is still flat (174 to 170 luma), and an outline ring was added.
5. **Hands holding the donut:** partly fixed.
   - The donut is lifted and the arm is now near it.
   - But the arm reads as a snout and does not visibly grip the rim.
6. **Rails behind the head:** fixed.
7. **Crumb spawn and arcs:** partly fixed. f1 is good. f0 still sprays over the forehead, and the f2 scatter is invisible in the grass.
8. **Roll cue:** not fixed.
   - There is no visible dust, squash or grass reaction.
   - The ball is about 30 % of the frame.
   - The tuft is now mostly hidden (worse).
9. **Near-terrain chunkiness:** not fixed. The tufts and path cells are about 13-20 px.
10. **Burp ground reaction and distortion:** partly fixed. The ripple ring expands nicely, but there is no grass bend and no warp.

## Regression check
Against `shots/M2/final`, `shots/M3/final` and `shots/M4/final`:
- **World (trees, lighthouse, bakery, frosting rim, milk, grade):** no drop. It matches the M4 walk final and the M2 ground final. The near-band sprinkle size and the frosting facets are already in the M4 final.
- **Glazey's face:** it matches or beats the M4 final.
- **Held donut against the M3 bite gallery:** the in-world glaze is still clearly duller than M3's pale, glossy glaze.
  - In iter 2 I said I would treat it as a regression if gloss was not restored. Sparkle bloom was added and the pose was changed, so the presentation moved in the right direction. I am therefore holding it at materials 6 instead of a blocker.
  - If iter 4 does not reach the M3 glaze value and specular (fix 1), it becomes a regression blocker.
- **Belly:** the same flat sticker flagged since M4 iter 8. It is not new.

```json
{"gate":"M5","iter":"3-r2","verdict":"FAIL","mean":6.7,"min":6,"blockers":0,"store_page":false}
```
