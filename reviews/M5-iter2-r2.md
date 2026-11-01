# Review M5 iter 2 (reviewer 2)
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M5 --iter 2-r2` at commit `28d8217`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 18 files to `shots/M5/2-r2/` with exit 0.
- **Viewed:**
  - Every 1920x1080 still, plus the 844x390 hero.
  - Both strip composites and all six strip frames.
- **Zoomed crops (2-6x):**
  - Glazey's face in bite-1, bite-3, crumbs f0 and burp f0/f1/f2.
  - The bite-3 carve.
  - The ground under the held donut.
  - The burp ground band.
  - The roll face and belly.
- **Sampled:** 11x11 pixel means (hue, saturation, luma) with a scratchpad script.
- **Read beforehand:**
  - `docs/ART_BIBLE.md` and `docs/AGENTIC_LOOP.md` §3-§4.
  - `art/reference/NOTES.md`, and K-05 and K-07 in `docs/REFERENCE_FIXES.md`.
  - All four references.
  - The M2, M3 and M4 finals.
- **Pass bar:** mean ≥ 7.5 and every category ≥ 6 (§4). I applied it unchanged.

**Summary.** This is a real step up from iter 1:
- The blocker is gone. The squint arcs are thin, warm brown and stay inside the outline.
- The bite-3 munch now reads as 03's "munching": an open laughing mouth with crumbs flying past the cheek.
- The crumbs are at the right scale.
- The burp ground band now hugs the terrain.

It is still well short of the bar, for these reasons:
- **The held donut:** a matte, khaki-beige glaze with no specular. Its carve is ragged and fin-edged, not 04's clean scallops. No hand visibly holds it.
- **The ground under the donut:** a pale, smooth, terraced "bald disc" that reads as a plastic pad.
- **The belly patch:** still a flat sticker.
- **The roll shot:** no dust, no squash and no grass reaction.
- **Near-corner grass:** still well over the 12 px terrain density limit.

Nothing here is broken. The shots are simply mid-6 indie quality.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 6 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | 6 | 6 | – | 6.3 |
| m5-bite-3 (hero) | 7 | 6 | 7 | 6 | 7 | 6 | 6 | 7 | 7 | 6 | – | 6.5 |
| m5-crumbs-strip | 6 | 6 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 6 | 6 | 6.5 |
| m5-burp-strip | 8 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7.0 |
| m5-belly-5-roll | 7 | 6 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 7 | – | 6.7 |

- **Gate mean:** 6.6 over all 52 category scores. The bar is 7.5. Iter 1 was 6.3, so this is +0.3.
- **Minimum:** 6, in many places (listed above). No category is below 6.
- **Gap to the bar:** the gate fails on the mean alone, by about 0.9.

## Blockers
None. Here is the art bible §10 check:
- **Iter 1 blocker (far squint arc outside the head silhouette):** fixed. In burp f1 and f2 the far arc now sits *on* the rim of the head, at about (1150-1165, 660-690). A small coral cheek nub protrudes just past the outline below it. No decal voxel is outside the coral.
- **Lighting artifacts:** no shadow acne, z-fighting or light leaks.
- **Overlays and sky:** no debug overlays and no sky banding.
- **Kid-safety:** nothing would scare a child.

The carve fins in fix 2 are a cleanliness flaw, not mesh holes. I scored them under category 10 and did not count them as a §10.1 instant-fail.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** make the held vanilla donut look glossy and appetizing.
   - **Problem:**
     - In bite-1, bite-3 and the crumbs strip the glaze samples at hue 23-25, saturation 0.34-0.39 and luma about 134 (bite-3 at (760,640) and (745,700)). It reads as dull khaki putty with no specular and no fresnel rim.
     - The same asset is glossy in the M3 gallery and in the burp-strip background (lower-left donut).
     - The cause is the tip-to-sky pose combined with the backlit sun, so the glaze faces only the shadowed fill.
   - **Where:** the held-donut pose in `src/debug/scenes/m5Munch.ts` or `Munch.ts`, and the glaze spec and rim terms in `Materials.ts`.
   - **Target:**
     - Glaze luma ≥ 175 on the side facing the camera.
     - At least one visible specular streak along the rim.
     - A warm fresnel rim against the background, as in 04's classic glazed donut (art bible §5, "Classic glaze").
2. **What:** clean up the carve so it reads as 04's tooth scallops.
   - **Where:** `src/engine/voxel/Carve.ts` (`carveSdf` has no pass that removes orphans or thin fins) and the bite SDF in `src/game/munch/Munch.ts`.
   - **Problem:**
     - In bite-3 the bite edge at about (700-1000, 510-600) is ragged.
     - A 1-voxel glaze sliver sticks up past the bite at about (807-832, 515-525).
     - A lumpy column of crumb stands proud of the glaze at about (782-820, 540-597). It reads as a stray floating chunk.
     - The bite-1 carve is barely legible: only a rough notch on the upper-left rim and a ragged inner hole.
   - **Target:**
     - After each carve, remove voxels with fewer than 2 solid face-neighbours, and drop any connected component that is cut off from the main body.
     - Build the bite from 3-4 overlapping spheres of equal radius on an arc, so the edge reads as clean rounded tooth cups.
     - A visible glaze-over-dough band at the lip, and warm crumb (luma ≥ 160 where it faces the light; today it is 112 at (790,570)).
3. **What:** remove the bald, smooth pad under the held donut.
   - **Where:** most likely `donutShadow` in `Game.ts:954-956` with `ContactShadow.ts`. It is drawn at `groundY + 0.1` over the grass tufts with `depthWrite: false` and a polygon offset, so it flattens the tuft texture. Grass may also be culled under the donut.
   - **Problem:**
     - In bite-1, bite-3 and all crumbs frames a pale, smooth, terraced green disc sits under the donut at about (690-1010, 790-890).
     - At 844x390 it reads as a plastic lens or pad, not a soft shade in the grass.
     - The crumbs "settle" on it, so it also hurts the crumb read.
   - **Target:** the grass blades stay visible and continuous under the donut. The shade is a soft darkening that tucks *between* the blades, with no visible disc edge or terracing.
4. **What:** make the belly a shaded, convex cream form, not a sticker.
   - **Where:** the belly patch in `src/art/models/glazey.ts` and its palette entry in `palette.ts`.
   - **Problem:**
     - In roll the patch samples at luma 172-175 across its whole area ((960,620), (1000,660), (940,700)), with hue 40 and saturation 0.40.
     - It has a ragged, jagged lower edge at about (890-1060, 700-745).
     - It sits high under the mouth and is clipped by the right silhouette, so it reads as a cream bib or beard.
     - In burp f0 the right edge is also ragged, at about (1150-1175, 750-800).
   - **Target:**
     - At least 35 luma from the lit top to the shaded bottom.
     - A smooth elliptical edge that follows the body curve.
     - Centred lower on the ball in roll, as in 03 "perfectly round".
5. **What:** show Glazey holding the donut.
   - **Where:** the arm pose in `GlazeyAnimator.ts` and the munch hold in `m5Munch.ts`.
   - **Problem:**
     - In every bite and crumbs frame the only visible arm sticks out sideways to screen-right at about (1100-1170, 640-720), away from the donut.
     - The donut floats against his belly, and its lower rim rests in the grass.
     - 03 "munching" shows both stubby hands on the food.
   - **Target:** the near arm visibly wraps the donut's near edge, and the donut is visibly lifted clear of the grass in bite-1 and bite-3.
6. **What:** fix the composition tangents in the munch framing.
   - **Where:** the munch camera yaw in `FollowCamera.ts` and `m5Munch.ts`.
   - **Problem:**
     - The pier-ladder rails sit right behind Glazey's head in bite-1, bite-3 and crumbs f0, at about (1050-1200, 380-500).
     - With the dark ladder stringer at about (1180-1220, 450-500), they read as two antennae and a horn growing out of the tuft.
   - **Target:** nothing thin or dark crosses or touches Glazey's head silhouette. Rotate the camera about 10-15° or shift Glazey's spot so the ladder clears the tuft.
7. **What:** spawn the crumbs from the mouth and the bite, and make the arcs read.
   - **Where:** the emit origin in `Game.ts` (`crumbs.emit`) and `VoxelParticles.ts`.
   - **Size:** fixed. Crumbs are now about 6-12 px in three tones.
   - **Problem:**
     - In crumbs f0 the burst still covers the forehead and eye, at about (950-1050, 575-680), above the mouth.
     - In f2 most crumbs hang mid-air over the bald pad rather than lying in a scatter.
     - The strip does not show a bounce.
   - **Target:**
     - The burst originates at the bite and mouth contact, at about mouth height.
     - f1 shows crumbs mid-arc *below* the mouth.
     - f2 shows a settled scatter of 8-15 crumbs on the grass, with at least one mid-bounce.
8. **What:** add a roll cue to the belly-5 roll shot.
   - **Where:** the dust FX and grass interaction, `GlazeyAnimator.ts` (contact squash), and the roll-shot framing.
   - **Already there:** the rotated face and tuft are a good start.
   - **Problem:**
     - There is no dust trail, no grass parting and no contact squash.
     - The ball is about 28 % of the frame height.
     - The upper half of the frame is empty sky.
     - The lower-right third is a flat frosting band.
   - **Target:**
     - 2-4 small dust or crumb puffs behind the ball, and the blades nearest the contact bent away.
     - A 5-8 % flattening at the contact.
     - The ball at least 35 % of the frame height.
9. **What:** fix near-terrain chunkiness at the munch camera. This is not fixed since iter 1.
   - **Where:** the munch camera's distance and pitch, or the grass LOD and tufts in the near band.
   - **Problem:** in bite-1, bite-3 and the crumbs frames the corner grass tufts render at about 15-25 px per voxel, at the lower left (0-480, 860-1080) and lower right (1560-1920, 880-1080). That breaks the ~12 px near-terrain rule (art bible §3).
   - **Target:** no terrain voxel above 12 px in any munch frame.
10. **What:** make the burp's ground reaction and distortion visible.
    - **Where:** `src/game/fx/BurpWave.ts`, and the grass sway it drives.
    - **Already there:** the band is now low and hugs the terrain (good).
    - **Problem:**
      - It is still a painted pastel ellipse of cubes.
      - Grass inside it does not bend outward.
      - No screen-space ripple is detectable in f1.
    - **Target:**
      - Blades just behind the front visibly lean outward in f1.
      - A subtle refraction or warp is visible near the ring.
      - A clear inhale stretch in f0 against a recoil squash in f1 (about 10 %) on the body.

## What is working (keep it)
- **The face.** The squint arcs are now thin and warm brown. The laughing open mouth with a tongue (bite-3, crumbs f1, burp f2) is cute and on-model with 03 "munching" and "giant burp". The surprised "o" with glossy eyes in burp f0 is lovely.
- **The bite-3 munch beat.** Fine crumbs flying past the cheek, with a few landing on the belly, are exactly 03's munching read.
- **Crumb scale.** At 6-12 px in three tones, they now belong to the donut's voxel scale.
- **The burp ring.** It is clean, soft and pastel, with no 2D sprite, and is the closest match to a reference in the gate. The ground band no longer forms a curtain.
- **Squash and stretch.** Crumbs f0 to f1 now shows clear squash and stretch: a squashed ball in f0, a taller egg in f1.
- **The roll pose.** The rotated face and tuft read as rolling, and the round silhouette and eye glints stay charming.
- **The world.** Lighting, grade, sprinkle trees, lighthouse, frosting rim and milk all match the M4 final.

## Store-page test: no
In the hero (m5-bite-3) the subject finally reads at 844x390: a happy munch with crumbs and a bitten donut. But a polished store page would not ship it:
- the khaki, matte donut with fin-edged bites;
- the pale plastic pad under the donut;
- the "antennae" from the ladder rails;
- the chunky corner grass;
- no visible hand on the food.

These are each fixable. Together they keep it at good-indie-minus, not store-page.

## Previous fix list (M5-iter1-r2) status
1. **Far squint arc outside the silhouette, and redrawing the squint:** fixed. The arcs are thin, warm brown and upward-curved. The far arc stays on or inside the rim, though it still sits right on the edge beside a small cheek nub.
2. **Restaging the munch:** partly fixed.
   - The bite-3 carve is visible, and Glazey is at roughly 3/4 with the near eye clear.
   - The bite-1 carve is still barely legible.
   - No arm visibly holds the donut.
3. **Crumb size and spawn point:** partly fixed. The size is fixed. The spawn is still at the forehead and eye in crumbs f0.
4. **Warm, layered crumb interior:** partly fixed.
   - The hole-wall dough is golden (hue 30, saturation 0.60).
   - The cut walls are dark (luma 112) and ragged, and there is no glaze-over-dough band.
5. **Belly patch:** not fixed. It is a flat 172-175 luma sticker with a jagged edge.
6. **Roll read:** partly fixed.
   - The face and tuft are rotated.
   - There is no dust, grass or squash, and the ball is 28 % of the frame.
7. **Burp ground band:** partly fixed.
   - It is low and hugs the terrain.
   - There is no grass bend and no visible distortion.
8. **Squash and stretch:** partly fixed. It is visible in the crumbs strip and weak in the burp strip.
9. **Near-terrain chunkiness:** not fixed.
10. **Glossy vanilla glaze:** not fixed on the held donut.

## Regression check
Against `shots/M2/final`, `shots/M3/final` and `shots/M4/final`:
- **Meadow world (trees, lighthouse, frosting rim, milk, bakery, grade):** no drop. It matches the M4 walk final.
- **Glazey's open-eyed face (burp f0, roll):** it matches or slightly beats the M4 final.
- **Donut carve against the M3 bite gallery:** the in-world carve is noticeably rougher than M3's clean scallops with their golden crumb, because of fins and a stray chunk. The held donut also loses the glaze gloss that M3 shows.
  - The asset and material are shared, so this is a presentation and pose issue (lighting angle, carve SDF), not an asset regression.
  - I scored it under materials, fidelity and cleanliness rather than as a blocker.
  - If the next iteration does not restore gloss on the held donut, treat it as a regression.
- **Belly:** it is still the flat sticker flagged in M4 iter 8. That is not new.

```json
{"gate":"M5","iter":"2-r2","verdict":"FAIL","mean":6.6,"min":6,"blockers":0,"store_page":false}
```
