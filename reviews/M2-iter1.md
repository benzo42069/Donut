# Review M2 iter 1
## Verdict: FAIL

Captured by the reviewer with `npm run shots -- --gate M2 --iter 1` at commit `2eb168a`
(SwiftShader fallback path; all 10 files rendered without harness errors). I viewed every
1920x1080 and 844x390 PNG, plus zoomed crops and a grayscale conversion of the hero.
I viewed all four references (01–04) against the "Follow" lists in `art/reference/NOTES.md`.

Summary: the hero diorama has the right ingredients and layout (complete ring, milk lagoon,
bakery, lighthouse, pier, sprinkle trees, drips). That is a solid M2 skeleton. But every
ground-level shot reproduces the exact flaw NOTES.md tells us to ignore in reference 02:
Minecraft-scale chunky grass and terraced, brick-sized frosting. The color pipeline also
clips channels to 0 across 7–31 % of every frame. Materials are almost absent: frosting is
matte, the milk reads as a flat cream floor, and there is no glaze gloss anywhere. It is
not close to the bar yet.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | 12 low | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2-hero | 6 | 7 | 6 | 6 | 5 | 5 | 6 | 7 | 7 | 4 | n/a | n/a | 5.9 |
| m2-ground | 4 | 4 | 6 | 6 | 5 | 4 | 2 | 5 | 5 | 4 | n/a | n/a | 4.5 |
| m2-closeup-donut | 4 | 5 | 6 | 6 | 4 | 3 | 3 | 5 | 4 | 5 | n/a | n/a | 4.5 |
| m2-lagoon-edge | 5 | 6 | 7 | 6 | 5 | 5 | 5 | 5 | 6 | 4 | n/a | n/a | 5.4 |
| m2-low-tier | 6 | 7 | 6 | 5 | 5 | 5 | 6 | 7 | 7 | 4 | n/a | 7 | 5.9 |

Gate mean: **5.2** (needs at least 9.0; low tier needs at least 8.5). Min: **2**. Every shot has categories below 8.

## Blockers
- **[m2-ground, m2-closeup-donut] Minecraft-scale voxels on near terrain (§10.2, §3 density rule, NOTES 02 "Ignore").**
  In m2-ground, the foreground grass blades (bottom third of the frame) are about 35–50 px
  cubes. The frosting rim on the right half is a terraced staircase with steps about
  40–50 px wide, and the rim sprinkles there (yellow and red bars, right-center) are
  80–100 px "bricks". In m2-closeup-donut, the whole frame is lime pillars about 25–40 px
  wide, and the flowers are 5-cube plus signs. The terrain limit is ~12 px. This is exactly
  the "chunky Minecraft grass" that NOTES.md forbids us from copying out of reference 02.
  Cause: the ground camera sits 0.42 m above the surface (`m2Meadow.ts` `ground`/`closeupDonut`,
  lift 0.42/0.5). At that distance, 1/32 m (`FINE` in `IslandTerrain.ts`) and even 1/64 m
  decor (`grassTuft.ts`) voxels render 45 px or more.
- **[all shots] Gamut clipping / pure-saturation fills (§10.7 crushed blacks, §4 "avoid pure-saturation fills", §10.5).**
  Pixels with at least one channel at exactly 0: hero 11.9 %, ground 16.3 %, closeup 6.7 %,
  lagoon-edge 31.1 %, low-tier 10.9 %. Examples: the hero island underside crust at (900,980)
  is RGB (78,0,0) and at (700,950) it is (59,0,0). The bottom band of the drum is a clipped
  blood-red, not deep crust `#7A3E1D`. The closeup grass at (300,600) is (94,135,0) and at
  (100,450) it is (223,213,77), an acid lime. The dough wall in lagoon-edge is orange with
  blue=0 over most of its area. Cause: `src/engine/render/ColorGrade.ts` applies
  `c = mix(vec3(g), c, saturation)` with saturation 1.08 **after** the clamp, and the
  smoothstep contrast pushes values out of range first, so channels go negative and clip.
- **[m2-hero, m2-lagoon-edge, m2-low-tier] Visible per-column "barcode" striping on the dough cliffs (§10.4-adjacent texture look, §2 "silhouettes read as smooth").**
  Outer drum (hero lower half) and inner lagoon wall (lagoon-edge, whole middle band): every
  voxel column is a separate vertical stripe with its own value. It reads as corrugated
  cardboard or a wooden fence, not baked dough. The strata are flat horizontal brown bands,
  like wood grain. The bottom contour of the drum (hero, lower-left to lower-right, y ≈ 880–1010)
  is a visible coarse staircase, so the 1/8 m coarse terrain is chunky in the hero shot
  (§3: "must never be visibly chunky in a shot").

## Fix list (priority order; max 10; each concrete and testable)
1. **What:** Ground-level framings render terrain voxels at 3–4× the density limit. **Where:** `src/debug/scenes/m2Meadow.ts` (`ground`, `closeupDonut` lifts/distances), `IslandTerrain.ts` `FINE`, `grassTuft.ts`. **Target:** In m2-ground and m2-closeup-donut, no terrain, grass or rim voxel is over ~12 px tall, and no prop voxel is over ~6 px (measure in the 1920 shot). Grass reads as a soft micro-blade carpet with silhouettes, not pillars. Achieve this by raising and pulling the camera back to the real gameplay distance, by finer near-field decor (1/128 m blades in the macro patch), or both. The rim frosting must not show a staircase of terraces.
2. **What:** Gamut clipping in the grade. **Where:** `src/engine/render/ColorGrade.ts`. **Target:** Do saturation and contrast in a gamut-safe way (saturate in a perceptual space, or compress chroma toward luma before clamping) and clamp the final color. Fewer than 0.5 % of pixels in any shot have a channel at 0. The underside crust reads as deep caramel brown (around `#7A3E1D` after the grade), not (78,0,0).
3. **What:** Frosting and glaze have no gloss. **Where:** palette `MAT` flags and roughness for strawberry frosting, `Materials.ts`. **Target:** Rim frosting, drips and the donut tops show visible, soft sun speculars and a fresnel rim (as in reference 04, top-left donut). Side by side, frosting and dough are distinguishable by sheen alone (rubric 6).
4. **What:** The milk lagoon reads as a flat cream floor. **Where:** `src/engine/render/Water.ts`, `Reflection.ts`. **Target:** In the hero, the milk shows a sky-tinted fresnel gradient, gentle ripple specular along the sun path, reflections of the cliff drips and pier, and a visible depth or foam tint at the shore. In shadow, the milk must not be neutral gray (it is (177,170,163) today, a default-three.js look). Contact foam rings are visible around the floating donuts and pier legs. In lagoon-edge, the foreground half of the frame needs readable ripples and reflection, not a blank plane.
5. **What:** Dough cliff barcode and chunky underside. **Where:** `IslandTerrain.ts` (coarse runs and strata), jitter hashing in `Materials.ts` (`hash3`/`jitteredLinear`), drip generator. **Target:** The cliff walls read as baked dough. Jitter breaks up per voxel, not per full-height column. The strata wobble in thickness and color, with soft toasted gradients like reference 01, not flat brown stripes. The underside bottom edge is rounded with fine voxels, with no visible staircase in the hero. The drips vary in width, length and bulb end, rather than being uniform parallel rods.
6. **What:** The wild donuts don't read as donuts. **Where:** `src/art/models/donut.ts`, donut placement. **Target:** In m2-closeup-donut and m2-ground, the hole is clearly open (you can see grass through it). A golden dough band and a drip lip are visible below the frosting, and the frosting is a smooth glossy dome, not concentric terraces. It should match reference 04's top-left donut. Sprinkles sit flush on the frosting (several on the left flank of the closeup donut float off the surface). The ground-shot chocolate donut currently reads as a dark basket.
7. **What:** Golden-hour mood is weak in the hero. **Where:** `SUN_DIR` and light colors in `MeadowDiorama.ts`, palette `LIGHT_PALETTE`. **Target:** A lower sun from the upper right with longer, warm-edged shadows across the meadow, a visible warm rim on the bakery, lighthouse and trees, and cool-violet shadows, matching reference 01. The hero currently looks close to afternoon-neutral. The lit and shadowed sides of the drum should differ in temperature, not just in value.
8. **What:** The clouds read as tan rocks or potatoes. **Where:** cloud build in `MeadowDiorama.ts` (`CLOUD = 1/16`), cloud palette. **Target:** Clouds are cream-white to pale pink with soft lavender undersides and finer voxels with softer edges (NOTES 01). They should not be beige or brown (hero top-right is (161,147,139)). Also add a soft cloud or haze bed under the island so it doesn't hang in a void, and keep cropped clouds out of the bottom edge (bottom-center and bottom-left corners).
9. **What:** Ground and closeup compositions lack a focal point and a sky. **Where:** `m2Meadow.ts`. **Target:** In m2-ground, the subject donut gets the strongest value contrast and sits on a third. Nothing intrudes from the edges (the tree canopy in the upper-left corner, the lighthouse cropped at the top). The sky shows a gradient and clouds, not a flat peach wash. In closeup, the frame is not 85 % lime grass.
10. **What:** Set-dressing reads. **Where:** `MeadowDiorama.ts` props. **Target:** The sugar-capped hill (hero, left of the ring) gets voxel texture and powdered-sugar dusting on its top faces only, instead of a smooth pale blob. The red-and-white object in the milk at lagoon-edge (about x 1300–1400, y 870) has a readable silhouette or is removed. Sprinkles on the canopies attach to the canopy surface instead of hovering like stray hairs (pink tree in m2-ground, about x 1100–1300, y 180–420).

## What is working (keep it)
- The ring-island layout, a real lagoon inside a complete ring, fixes the reference-01 horseshoe as NOTES asks. The path loop, tree placement and bakery/lighthouse pairing compose well from the hero angle.
- The bakery is charming: chocolate-shingle roof, cruller trim, donut emblem instead of text, glowing windows and voxel chimney smoke.
- The candy-striped lighthouse with the glowing donut lamp, backlit in lagoon-edge, is the best moment in the gate. The sun glow behind it has real mood.
- The pier and stair read well, with good wood value structure.
- The hero grayscale value read is decent: the island separates cleanly from the sky.
- Soft VSM shadows: tree shadows on the rim and meadow are soft, with no acne or peter-panning visible.
- The low tier is visually close to high with no broken effects. Once the high tier is fixed, it should hold up.

## Store-page test: no
The hero alone might pass for a promising indie prototype. But it sits clearly below
reference 01: there is no gloss, the milk is flat, the underside is clipped red, the cliffs
look like a barcode and the clouds look like rocks. The other gate shots would actively hurt
a store listing, because the ground shots look like Minecraft, which is the one thing this
art bible exists to prevent.

## Regression check
No previous gate has `final/` shots with shared content (M0 and M1 are engine test scenes with no graphics gate). Nothing to compare; no regressions recorded.

## Previous review
None (iteration 1).

```json
{"gate":"M2","iter":1,"verdict":"FAIL","mean":5.2,"min":2,"blockers":3,"store_page":false}
```
