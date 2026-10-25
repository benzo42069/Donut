# Reference Fixes Backlog

These are the decisions we made about the AI-generated reference images in
`art/reference/`. Each item is something the game must do **better than or
differently from** a reference. Fix each one in the milestone listed. When it's
done, tick it, note the commit, and say in `docs/PROGRESS.md` which gate shot
proves it.

`art/reference/NOTES.md` tells the graphics reviewer the same rules. Keep the two files in sync.

## Decisions (already applied to the docs)
- [x] **D-01** Glazey's canonical body color is **coral (~`#F28B6E`)**, taken from the character sheet, not the original "peach-pink". Already in `docs/ART_BIBLE.md` §7.
- [x] **D-02** `02_ground_level.jpg` is used for **mood, lighting and camera height only**. Its asset style is not a target.

## Fixes: world and environment
| ID | Source | Issue in the reference | What the game does instead | Milestone |
|---|---|---|---|---|
| [ ] RF-01 | 01 hero | island is a horseshoe/C-shape | a **complete ring** island | M6 (M2 diorama follows the ring curvature) |
| [ ] RF-02 | 01 hero | lagoon is a flat cream slab | real **milk lagoon**: animated surface, soft specular, depth tint, reflections | M2 (lagoon strip), M6 (full lagoon) |
| [ ] RF-03 | 01 hero | clouds are much chunkier than the island | clouds built from finer voxels, with softer, puffier edges | M2 |
| [ ] RF-04 | 02 ground | grass, flowers and bushes are Minecraft-scale blocks | **micro-voxel** grass tufts and sprinkle flowers (art bible §3 density rule) | M2, M3 |
| [ ] RF-05 | 02 ground | frosting ground is a flat plastic sheet | frosting terrain with voxel relief, drips, swells and AO | M2 |
| [ ] RF-06 | 02 ground | generic green blob trees | **sprinkle-ball trees** as in 01 | M2, M3 |
| [ ] RF-07 | 02 ground | blue water | cream-white **milk** | M2 |
| [ ] RF-08 | 02 ground | text on the bakery sign ("SWEET BAKERY") | **no text in world art**; signs use voxel icons (a donut) | M2, M3 |

## Fixes: Glazey
| ID | Source | Issue in the reference | What the game does instead | Milestone |
|---|---|---|---|---|
| [ ] RF-09 | 02 ground | Glazey's voxels are too large | character-sheet density: about 32 voxels tall at belly 0 (1/32 m) | M3 |
| [ ] RF-10 | 03 sheet | back view is pink, not coral | coral consistent from every angle | M3 |
| [ ] RF-11 | 03 sheet | side view has an extra limb or tail | clean silhouette: 2 arms, 2 feet, nothing else | M3 |
| [ ] RF-12 | 03 sheet | "normal" vs "full" belly barely differ | belly stages 0–5 clearly distinct in a silhouette lineup | M3 (model), M5 (animated) |
| [ ] RF-13 | 03 sheet | text labels on the sheet | annotations are not part of the art; never render text on the character | M3 |

## Fixes: donuts
| ID | Source | Issue in the reference | What the game does instead | Milestone |
|---|---|---|---|---|
| [ ] RF-14 | 04 lineup | stray green/rainbow artifacts in the chocolate drip | clean, palette-true chocolate drips | M3 |
| [ ] RF-15 | 04 lineup | blueberry glaze is nearly navy | softer blueberry in the `#7C8CE0` family | M3 |
| [ ] RF-16 | 04 lineup | rainbow mega donut is very neon | it can glow, but stays the single sanctioned neon item and is used sparingly | M3 |

## Keep: positive targets to match
These are not fixes, but the reviewer checks them as fidelity targets.
- **K-01** (01) Golden-hour key light from the upper right, long soft shadows, pastel haze.
- **K-02** (01) Pink frosting drips over golden dough cliffs, with layered dough strata.
- **K-03** (01) Cruller-roof bakery with chocolate shingles, voxel chimney steam, the candy-striped lighthouse with the glowing donut, the pier and the syrup waterfall.
- **K-04** (02) Low camera, sunset backlight and background depth of field for the ground-level shots.
- **K-05** (03) Glazey's face (glossy eyes with highlights, blush), the 5-stripe tuft, and all the expressions. The burp ring is the target for the M5 burp VFX.
- **K-06** (04) Each flavor's look, drips over the dough band, glossy specular, and the studio turntable look for the M3 gallery.
- **K-07** (04) **The scalloped bite mark** on the glazed donut, showing the crumb interior, with crumbs on the table. This is the target for the M5 Munch carve.
