# Review M5 iter 2 (reviewer r1)
## Verdict: FAIL

Commit reviewed: 28d8217. Harness OK on the GPU path (ANGLE Metal, Apple M4) with 18 files in `shots/M5/2/`. I viewed every 1920x1080 frame, the strip composites, every strip frame (f0 to f2), the 844x390 bite-3, and 2x to 3x crops of the faces, the carve, the crumbs, the burp hoop and the ground ring. Before that I read the art bible, the rubric and pass bar, `NOTES.md` and all four references. The fidelity targets are K-07 (ref 04 bottom-left: the scalloped bite with a crumb interior and crumbs on the table) and K-05 (ref 03: the giant burp with a luminous rainbow ring).

Short version: this is real progress. The crumbs are now at donut-voxel scale. The carve shows a golden interior and rolls round into view. The squint arcs are thinner and warm and curve the right way. The roll finally tilts. But the Munch still doesn't look like store art, for four reasons:
- The held donut's glaze is still chalky and matte, which is a regression against the M3 gallery.
- A flat, near-opaque green disc erases the grass under the donut in every munch frame.
- Glazey's arms still don't touch the donut.
- A thin glaze "fin" sticks up out of the bite-3 carve.

The gate mean rises from 6.44 to 6.65. It is still well short of 7.5.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m5-bite-1 | 6 | 6 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 6 | – | 6.50 |
| m5-bite-3 | 7 | 6 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 6 | – | 6.60 |
| m5-crumbs-strip | 7 | 6 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 6 | 6 | 6.55 |
| m5-burp-strip | 7 | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | 6.91 |
| m5-belly-5-roll | 7 | 6 | 7 | 6 | 7 | 6 | 7 | 7 | 7 | 7 | – | 6.70 |

**Gate mean: 6.65. Minimum: 6.** No category is below 6 this time. The gate fails on the mean (bar 7.5), on the blocker below, and on the store-page test.

## Blockers
- **[m5-bite-1, m5-bite-3, m5-crumbs-strip] Regression in shared content (§4 rule 5): the held donut's glaze has lost its gloss.**
  - In `shots/M3/final/gallery-donut-bites` the classic glaze has bright specular bands, a fresnel rim and a semi-translucent look (art bible §5, "Classic glaze").
  - In M5 the same donut, once held, is a flat, pale beige with a fuzzy value noise. It has no specular band anywhere on the camera-facing face (bite-3 x 720–980, y 520–830; bite-1 x 740–1000, y 480–800). The only hint of shine is one tiny star glint on the top rim in crumbs f0/f1 (x ~835, y ~515–600).
  - The world donuts in the same build still look glossy (burp f0, cream donut lower-left x 100–400, y 990–1080, with rim highlights). So this is specific to the held pose or material, not a global lighting change.
  - This was part of the iter-1 blocker (fix 6) and it is not fixed.

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Restore the classic glaze's gloss on the held donut (the blocker).
   **Where:** the edible donut's material while it is reparented or posed in `Game.ts` (~l. 902–956, the held-donut pose). Check whether the held instance swaps to a different material or loses its env map, spec or roughness flags. Compare against the gallery material in `src/engine/render/Materials.ts` and the glaze flags in `src/art/palette.ts`.
   **Target:** At bite-3 framing, the glaze shows a visible warm specular band along the upper, camera-facing rim and a light fresnel rim on the silhouette, matching the M3 `gallery-donut-bites` classic glaze. The carve interior then reads at least two value steps darker and warmer than the glaze.
2. **What:** A flat green "bald patch" erases the grass under the held donut in every munch frame. It is a smooth, near-opaque disc with no blades, and it reads as a mown hole or a puddle (bite-1 x 700–1010, y 780–900; bite-3 x 690–1000, y 800–900; crumbs f2 x 700–1000, y 790–900; clearly visible at 844x390 too). It breaks art bible §2 (rich, soft lighting, not flat fills) and §10.1 in spirit (a visible rendering artifact).
   **Where:** `src/game/fx/ContactShadow.ts`. `place()` puts the disc at `groundY + 0.1`, *above* the grass tufts, with opacity up to 0.9 and `polygonOffsetFactor -4`. It paints over the blades instead of shading the soil under them. `Game.ts:954–956` (`donutShadow`) uses it for the donut.
   **Target:** Grass blades stay visible through the shadow. Draw the shadow at soil level (or as a multiply/darken term in the grass and terrain shader), and keep peak opacity at about 0.4 to 0.5 with a wide soft falloff. The donut should read as lifted above a soft darkening *among* the blades, with no smooth disc.
3. **What:** Glazey still isn't holding the donut. The near arm is a stub pointing at the camera (bite-1 x 1090–1170, y 640–720; bite-3 x 1090–1150, y 650–720) that is nowhere near the rim. The far arm can't be seen. In crumbs f0 the donut's lower rim still sinks into the grass blades (x 790–900, y 860–890). Sheet 03 "munching" shows both hands at the mouth, gripping the food.
   **Where:** the arm pose for the `munch` look in `GlazeyRig.ts` and `GlazeyAnimator.ts`, plus `HOLD` (`Game.ts:70`, y −0.01 puts the donut centre almost at mouth height, so a 20-voxel donut reaches the ground).
   **Target:** The near hand visibly overlaps the donut's right rim at mid-height in bite-1, bite-3 and every crumbs frame. The donut's lowest point clears the grass tips by at least about 15 px at 1080p in every munch frame.
4. **What:** In bite-3 a thin, one-voxel glaze fin sticks straight up out of the top-left carve (x 790–830, y 515–560), with a loose golden lump behind it (x 780–810, y 560–600). It reads as a horn, even at 844x390. Scallops should be clean rounded arcs (art bible §8, ref 04 bottom-left).
   **Where:** the carve in `biteDonut` and the munch carve code (`src/game/munch/`). Overlapping bite spheres leave unsupported slivers between them.
   **Target:** After each carve, remove glaze and dough voxels that keep fewer than 2 face neighbours, or merge neighbouring bite radii, so the rim between scallops is a soft cusp, never a free-standing fin.
5. **What:** The background pier handrails stick out of Glazey's head like antennae in every munch frame (bite-1 x 1090–1200, y 380–470; bite-3 x 1110–1210, y 375–470; crumbs f1 x 1160–1200, y 385–470). This is a silhouette tangency that hurts the hero read (rubric 2).
   **Where:** `munchStage()` in `src/debug/scenes/m5Munch.ts` (camera yaw and position). The in-game munch camera should avoid it as well.
   **Target:** Nothing in the background crosses Glazey's silhouette within about 40 px of his head and tuft. Rotate the camera a few degrees, or frame against the lagoon or sky.
6. **What:** The crumb motion is better but still not a delightful arc. In f0 the burst sits over his brow and eyes (x 940–1010, y 570–680), not at his lips. In f1 crumbs are pasted flat on the belly (x 990–1080, y 660–790) and read as dirt flecks. In f2 they lie scattered with no visible bounce. Art bible §8 asks for crumbs that bounce 1–2 times and settle.
   **Where:** the emit origin and direction in `chomp()` (`Game.ts` ~l. 636–642, the bite point and the dir bias), and the particle collision against Glazey's body.
   **Target:** In f0 the crumbs leave from the newest scallop at mouth height and fan out forward and down. No crumbs sit on his face or belly in any frame. In f2 at least a few crumbs are caught mid-hop just above the grass, and most of them form a loose crescent in front of the donut.
7. **What:** The cream belly still pokes out of the profile as a flat "bib" toward the donut (bite-1 x 1000–1080, y 660–770; burp f0 x 1085–1175, y 680–810). Its lighting is better than iter 1, but its outer edge is a hard, stair-stepped cut against the coral, and in the roll shot its lower-right border is ragged (x 890–1050, y 600–740).
   **Where:** the belly region mask in `src/art/models/glazey.ts`.
   **Target:** The belly patch stays inside the body silhouette in profile and has a one- to two-voxel graded blend into the coral, as in the sheet 03 front and side views.
8. **What:** The burp hoop comes out about 150 px *in front of* his mouth with nothing in between (burp f1: mouth x ~1160, y 720; hoop centre x ~915, y 700). The screen ripple still can't be seen in any frame. The hoop is a smooth, non-voxel tube (rubric 7) next to voxel ground-ring cubes, and the ground ring runs straight through the chocolate donut at the lower right (f1 x 1450–1700, y 990–1060).
   **Where:** the spawn offset in `BurpWave.ts` and `src/engine/render/Ripple.ts` (`uv -= dir * band * ripple.w * 0.03`, so the band is too narrow or `w` too small to show).
   **Target:** In f1 the hoop's near edge touches his lips, as in sheet 03. A ripple shows about 6 to 10 px of displacement on the grass and frosting behind the ring. The hoop shows faint voxel stepping at the silhouette, or a sparkle-voxel sheath, so it belongs to the world. Ring cubes skip or sit on top of props instead of passing through them.
9. **What:** The roll frame is still weak. The upper 45 % is empty sky. The lighthouse donut, the landmark, is half-hidden behind the cropped pink tree at the top-left (x 0–190, y 0–520). There's no motion cue other than the tilt: no squash, no grass puffs and almost no contact shadow under the ball (x 860–960, y 800–820).
   **Where:** the roll stage in `m5Munch.ts`, and the roll pose and FX in `GlazeyAnimator.ts`.
   **Target:** Lower the horizon to about the top third and put the lighthouse fully in frame. Add a small squash (about 5 %) along the contact axis and a trail of 3 to 6 grass or sprinkle puffs behind him. Give him a soft contact shadow that reads at 844x390.
10. **What:** The camera still shows the munch in strict profile, so the munch face is only half visible (the mouth sits on the silhouette edge in bite-1 x 990–1050, y 580–660). Sheet 03 "munching" is a front three-quarter view.
    **Where:** `CAM` in `m5Munch.ts`, and the shipped munch camera.
    **Target:** Rotate the camera about 25 to 35° toward his front, so both squint arcs, both blush cheeks and the newest scallop are all visible together.

## Previous fix list (iter 1 r1): status
1. Bites on the far side from the mouth: **fixed.** The newest bite now meets his lips, and earlier bites roll round to the visible left rim (bite-3 left scallop x 720–770, y 600–720).
2. Crumbs far too large: **fixed.** The crumbs are now about 5 to 10 px, in 3 tones including toasted darks, and in line with the M3 gallery.
3. Glazey not holding the donut: **partly fixed.** The donut is lifted a little and has a shadow, but the arms don't touch it, and in crumbs f0 its rim still sinks into the grass (fix 3).
4. Munch and burp faces: **mostly fixed.** The arcs are thinner, warm dark brown and curve upward, and the far-eye notch is gone. The mouth still sits on the silhouette (fix 10).
5. Belly patch unlit, sticker-like: **partly fixed.** It now shades with a terminator, but its edges are still hard and it sticks out as a bib in profile (fix 7).
6. Matte, chalky glaze: **not fixed** (the blocker, fix 1). The carve interior is warmer, which helps.
7. Crumb motion arc: **partly fixed** (fix 6).
8. Burp ripple invisible, no glow, coarse ring: **partly fixed.** The hoop now has a soft glow halo, and the ring cubes are smaller (about 10 to 12 px) and sit on the lawn. The ripple still can't be seen (fix 8).
9. Munch framing: **partly fixed.** The lighthouse is now in frame. The view is still profile, and there's a new antenna tangency (fixes 5 and 10).
10. Roll doesn't read as rolling: **partly fixed.** The body is now tilted about 30°. There's still no squash, trail or contact, and the sky is empty (fix 9).

## What is working (keep it)
- **The crumb scale and palette.** Fine, three-tone grains that match the donut's voxel pitch and the M3 gallery. This was the iter-1 blocker and it is resolved.
- **The bite-3 carve with its golden interior** on the left rim. It now reads as a bite at both 1080p and 844x390, and it is a true carve, not a decal (art bible §8, K-07).
- **The munch face.** Warm, thin "^ ^" squint arcs, an open grinning mouth and pink blush. It reads as happy munching, not shouting.
- **The burp hoop.** Pastel rainbow band order, a soft glowing edge, and a ground ring that hugs the lawn. Burp f0's surprised face (glossy eyes, 2x2 glints) and the f2 blissful smile are the best Glazey expressions in the gate.
- **The roll pose.** The tilted ball with an upturned, delighted face is very cute.
- **The world.** The golden-hour key, cool fill, haze, frosting rim with drips, and the milk lagoon. It is unchanged from M4 and holds up.

## Store-page test: no
The hero frame (m5-bite-3) now tells the story: Glazey is chomping, crumbs are flying, and a bitten donut is beside him. But the donut is a chalky, matte ring that looks unbaked next to the glossy M3 donuts. It hovers over an obvious smooth green disc where the grass has vanished. A horn-like glaze sliver sticks up from the bite, and two dark rails rise out of Glazey's head. A polished indie store page would not show this frame.

## Regression check
- **M2 final (meadow, bakery, lagoon, lighting):** no regression. The lighting, AO, frosting rim, trees and lagoon are consistent.
- **M3 final (donut bites, Glazey belly):** **regression** in the classic glaze gloss on the held donut (the blocker). The carve and crumbs now match M3 quality, so that part of the iter-1 regression is resolved.
- **M4 final (Glazey and the meadow at play):** no regression. The body colour, tuft, eyes and front face match `m4-jump-apex`. The new ContactShadow placement (fix 2) is an M5 addition. The same class is used for Glazey's own shadow, so check that M4 jump shots don't gain the same disc once it is fixed.

```json
{"gate":"M5","iter":2,"verdict":"FAIL","mean":6.65,"min":6,"blockers":1,"store_page":false}
```
