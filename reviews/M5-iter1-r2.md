# Review M5 iter 1 (reviewer 2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M5 --iter 1-r2` at commit `a6583d7`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 18 files to `shots/M5/1-r2/` with exit 0.
- **Viewed:**
  - Every 1920x1080 still.
  - The 844x390 frames for bite-3, burp and roll.
  - Both strip composites and all six strip frames at full resolution.
- **Zoomed crops (2-3x):**
  - Glazey's face in bite-1 and burp f1/f2.
  - The bite-3 carve and crumbs.
  - The roll face and belly.
  - The bite-1 foreground grass and path.
  - The roll shot's right cliff edge.
- **Sampled:** 11x11 pixel means (hue, saturation, luma) with a scratchpad script.
- **Read beforehand:**
  - `docs/ART_BIBLE.md` and `docs/AGENTIC_LOOP.md` §3-§4.
  - `art/reference/NOTES.md`, K-05 and K-07 in `docs/REFERENCE_FIXES.md`, and PLAN M5.
  - All four references.
  - The M2, M3 and M4 finals.
- **Fidelity targets:**
  - **K-07 (04):** the scalloped bite with a crumb interior and crumbs on the table.
  - **K-05 (03):** the munching and giant-burp expressions and the rainbow ring.
- **Pass bar:** mean ≥ 7.5, every category ≥ 6, as in §4.

**Summary.** The Munch exists as real systems:
- a real scalloped voxel carve;
- physics crumbs;
- a 3D rainbow burp ring with a ground shock band;
- a perfectly round belly-5 ball.

The world is the accepted M4 meadow, and it holds up. The new content is what lets the gate down:
- **The face.** Glazey's munch and burp face has a geometry error: the far squint arc stands outside the head's silhouette. With the heavy near-black arcs and the mouth on the profile edge, the face reads as a grinning man with a moustache, not 03's blissful munch.
- **Bite-1.** The shot does not show the bite at all.
- **Crumbs.** They are 25-35 px dice.
- **Roll shot.** It shows a ball standing still, not rolling.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 6 | 5 | 7 | 6 | 7 | 6 | 6 | 7 | 5 | 5 | – | 6.0 |
| m5-bite-3 (hero) | 7 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | 6 | 5 | – | 6.3 |
| m5-crumbs-strip | 6 | 6 | 7 | 6 | 7 | 6 | 5 | 7 | 5 | 5 | 6 | 6.0 |
| m5-burp-strip | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 6 | 5 | 7 | 6.6 |
| m5-belly-5-roll | 7 | 6 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 7 | – | 6.7 |

- **Gate mean:** about 6.3. The bar is 7.5.
- **Minimum:** 5, in five places:
  - composition in bite-1;
  - charm in bite-1 and crumbs;
  - voxel scale of the crumbs;
  - technical cleanliness in every shot that shows the munch or burp face.

## Blockers
- **[m5-bite-1, m5-bite-3, m5-crumbs-strip f0-f2, m5-burp-strip f1-f2] The far squint-eye arc stands outside the head silhouette.**
  - **Where:**
    - bite-1 at about (935-960, 520-570);
    - bite-3 at about (925-950, 530-570);
    - burp f2 at about (1170-1185, 690-720), at the left edge of the head.
  - **What:** the far eye's dark arc sits *outside* the coral outline on a small coral nub. It is decal geometry poking out of the profile.
  - **Why it fails:** this is a mesh error on the hero character at the focal point of every munch frame (art bible §10.1). It also wrecks the read of the face: the near arc becomes a "brow" and the far arc a "moustache".
  - **Likely cause:** `decalHere` in `src/art/models/glazey.ts` sinks the decal flush toward the sides of the head. The squint arcs for `munch` and `burp` still stand proud and/or are not culled at the silhouette, and the munch lean and turn make it worse.
  - **What fixed looks like:** in a 3/4 or profile view nothing dark sits outside the coral outline. The far arc is either hidden behind the head's curve or clipped flush with it.

No other §10 instant-fail items:
- no shadow acne, z-fighting or light leaks;
- no debug overlays;
- the sky has no banding;
- nothing would scare a child.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** fix the far squint arc poking outside the silhouette (the blocker), and redraw the squint itself.
   - **Where:** `src/art/models/glazey.ts`, the face lookup for `munch` and `burp` and `decalHere`/`facing`.
   - **Target:**
     - No decal voxel outside the body outline from any yaw between 0° and 90°.
     - The squint arcs are thin, upward-curved "^ ^" happy arcs at eye height, as in 03 "munching" and "giant burp". They should be at most about 2 decal voxels thick, in a warm dark brown and not near-black.
     - They must not read as brows. In burp f1 the arcs slant down toward the nose, which reads as angry shouting.
2. **What:** restage the munch so the shot shows the bite and the face.
   - **Where:** `src/debug/scenes/m5Munch.ts` (the bite poses) and the munch framing in `src/game/camera/FollowCamera.ts`.
   - **Problem:**
     - In bite-1 the carve is hidden behind Glazey's cheek. The shot named "bite-1" shows no bite.
     - In both bite shots Glazey is in near profile, with the mouth on the silhouette edge, the same face-presentation problem M4 iter 8 just fixed.
     - The donut stands on its rim in the grass with no hand visible on it, so it does not read as "held".
   - **Target:**
     - The bite-1 carve is clearly visible on the near rim.
     - Glazey is at least a 3/4 view toward the lens, with both eyes inside the outline.
     - Both stubby arms visibly wrap the donut's sides.
3. **What:** shrink and soften the crumbs.
   - **Where:** the `size: [0.022, 0.04]` passed to `this.crumbs.emit` in `src/game/Game.ts` (around line 652), and `VoxelParticles.ts`.
   - **Problem:**
     - At the munch camera each crumb renders 25-35 px (bite-3 lower-left pile at (600-950, 800-900), and the burst at (600-880, 470-700)).
     - They read as wooden dice or Lego, not crumbs. 04 shows small irregular crumbs at roughly 1/3 of that.
     - In crumbs f0 the burst spawns at Glazey's *eye* (930-1000, 540-660), not at the bite.
   - **Target:**
     - Crumbs about 0.008-0.016 m, so at most about 10 px at this camera, with some 2-3 voxel clusters.
     - They emit from the carved rim at mouth height.
     - Visible 1-2 bounces in the strip, then a sparse scatter on the grass, not a heap.
4. **What:** warm and lighten the bite's crumb interior, and show its layers.
   - **Where:** `crumbFresh` and `crumbFreshPore` in `src/art/palette.ts`, and the carve shading.
   - **Problem:** the bite-3 carve samples at hue 26-38, saturation 0.31-0.34 and luma about 140, with dark pores. It reads as dry gray-khaki sponge, not 04's warm golden crumb.
   - **Target:**
     - A warm, lighter crumb (hue about 35-40, saturation ≥ 0.5, luma ≥ 165 where it faces the light), with sparse rather than dark pores.
     - A visible thin glaze layer over a dough band at the scallop lip.
     - AO inside each scallop cup.
5. **What:** fix the belly patch.
   - **Where:** the raised belly patch in `glazey.ts` and its palette entry.
   - **Problem:**
     - In roll it is still a flat sticker: luma about 172 across its whole area, hue 44, saturation 0.36, which is khaki, not `#F5E2A8`.
     - It has a hard straight lower edge at about (870-960, 820-830).
     - In bite and burp it bulges outside the body outline as a separate lobe (burp f2 (1165-1230, 770-840)).
   - **Target:** convex shading (at least 35 luma from lit to core), a cream closer to `#F5E2A8`, and an edge that follows the body's curve.
6. **What:** make the roll read as rolling.
   - **Where:** `m5Munch.ts` roll still, `GlazeyAnimator.ts`, and the dust FX.
   - **Problem:**
     - The face and tuft are perfectly upright.
     - There are no dust puffs, no bent grass and no contact squash.
     - The ball is only about 25 % of the frame height, with the upper-right 40 % empty sky.
   - **Target:**
     - A visible roll cue: the tuft and face rotating, a dust trail behind, a slight squash on the contact side, and grass parting.
     - A camera close enough that the ball is at least 35 % of the frame height.
7. **What:** clean up the burp ground band.
   - **Where:** `src/game/fx/BurpWave.ts`.
   - **Problem:**
     - In f1 the rainbow cubes stack into a tall "curtain" over the frosting rim at about (830-1060, 720-820). It reads as a voxel wall or glitch.
     - The ring on the lawn reads as a painted crop circle rather than grass rippling outward.
     - No screen-space ripple is visible in f1.
   - **Target:**
     - A thin, low band (at most 2 cubes high) that hugs the terrain.
     - Grass blades visibly bending outward behind the front.
     - A subtle visible distortion near the ring in f1.
8. **What:** add squash and stretch to the chomp and burp.
   - **Where:** `GlazeyAnimator.ts`.
   - **Problem:** across crumbs f0→f2 and burp f0→f2 the body silhouette barely changes, apart from a lean.
   - **Target:**
     - The chomp has a 10-15 % vertical squash with a sideways bulge, and the belly wobble is visible between frames.
     - The burp has an inhale stretch in f0 and a recoil squash in f1, as in art bible §7.
9. **What:** fix near-terrain chunkiness at the munch camera.
   - **Where:** the munch camera distance and pitch, or the meadow foreground.
   - **Problem:**
     - In bite and crumbs, the grass tuft in the bottom-right corner (1580-1920, 950-1080) renders at about 20-25 px per voxel.
     - The path tiles in the lower left are about 30 px.
     - Both break the ~12 px terrain density rule (§3) at the camera these shots use.
   - **Target:** no terrain voxel above 12 px in any munch frame. Pull the camera back or up, or keep coarse terrain out of the near corners.
10. **What:** make the vanilla-glazed donut glossy.
    - **Where:** the donut's glaze material flags (`Materials.ts`).
    - **Problem:** its glaze reads matte off-white with no visible specular, unlike the glossy M3 gallery donuts.
    - **Target:** visible specular highlights and a fresnel rim on the glaze (art bible §5), and a soft contact shadow where the rim meets the grass.

## What is working (keep it)
- **The carve.** It is a real scalloped voxel carve (bite-3 left rim), with a crumb interior and a clean scallop silhouette. That is the right K-07 idea, and it is not a decal.
- **The burp ring.** The ring is a soft pastel 3D rainbow torus with clean bands and no 2D sprite. At 844x390 it reads instantly as "rainbow burp", and it is the closest thing in the gate to the 03 sheet.
- **Belly 5.** The ball is a lovely "perfectly round" silhouette. In roll the happy face, glossy eyes with glints and blush are cute and on-model.
- **The world.** The meadow, lighthouse, sprinkle trees, frosting rim, bakery and golden-hour grade are all intact. They give every shot a warm, rich backdrop.
- **The crumbs strip.** Its three beats (burst, fall, settle on the grass) are the right structure. Only the size and spawn point are wrong.

## Store-page test: no
The hero (m5-bite-3) puts the game's key moment at the center of the frame, but:
- the munch face reads as a moustached grin with a stray dark nub off the head;
- the crumbs look like a pile of dice;
- Glazey is shown in profile.

A polished kids' game's store page would show a face-forward, blissful munch with fine crumbs. The burp f1 frame comes closest, but its angry-reading brows and noisy ground band keep it out too.

## Regression check
Against `shots/M2/final`, `shots/M3/final` and `shots/M4/final`:
- **Meadow world (lighthouse, trees, frosting rim, milk, bakery, grade):** no visible quality drop. The assets and lighting match the M4 final.
- **Glazey's open-eyed face (roll, burp f0):** it matches the M4 final. The irises are glossy, with clean glints.
- **Belly:** it is still the flat sticker flagged in M4 iter 8. That is not a new regression, but it is still open.
- **Donut carve against the M3 bite gallery:**
  - Same technique. The in-world carve faces away from the sun, so it is darker, and a like-for-like comparison is not possible.
  - It reads grayer than the M3 lit carve (hue 34, saturation 0.74, luma 188). See fix 4.
- **Glazey's presentation:** turning him back to near-profile in the bite shots undoes the M4 iter 8 "face to the lens" gain. I scored this as composition and charm, not as an asset regression.

```json
{"gate":"M5","iter":"1-r2","verdict":"FAIL","mean":6.3,"min":5,"blockers":1,"store_page":false}
```
