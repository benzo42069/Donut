# Art Bible — "Toy-box diorama voxels"

The graphics reviewer agent treats this document as **law**. If a screenshot
breaks a rule here, it fails.

## 1. The look in one sentence

*A handmade miniature bakery world in warm afternoon light, built from
thousands of tiny cubes. It should look like a tilt-shift photo of a toy
diorama you want to reach into and nibble.*

Touchstones: high-end MagicaVoxel dioramas, *Teardown*'s voxel density, the
cozy palettes of *Animal Crossing* and *Tearaway*, and Pixar-like squash and
stretch on characters.

## 2. This is NOT Minecraft

| Minecraft (forbidden) | Glazey (required) |
|---|---|
| 1 m blocks, 16 px textures | **flat-color micro-voxels**, no textures on voxels |
| silhouettes are staircases | silhouettes read as **smooth, rounded forms** from normal camera distance; the cubes show up when you look closer |
| grid-aligned, boxy architecture | organic shapes: drips, swells, rounded hills, wobbly roofs |
| flat lighting | **rich lighting**: soft sun shadows, AO in every crevice, bounce light |

## 3. Voxel scale (hard numbers)

| Thing | Voxel size | Typical size in voxels |
|---|---|---|
| Hero props and characters | **1/32 m** (3.125 cm) | Glazey ≈ 32 tall at belly 0; a wild donut ≈ 20 across |
| Close-up hero assets (Moon Donut, Designer donut) | **1/64 m** | 64–128 across |
| Terrain near camera (≤ 40 m) | **1/8 m** (12.5 cm) | — |
| Terrain far (LOD) | 1/4 m, 1/2 m | must never be visibly chunky in a shot |

**Density rule:** at the default gameplay camera, no single voxel may be
larger than **~6 px tall at 1080p** on a character or prop, or **~12 px** on
terrain. If voxels look like Lego bricks, it fails.

## 4. Color

* **Palette-driven.** Every voxel color comes from a curated palette file
  (`src/art/palette.ts`). No ad-hoc hex values in asset code.
* **Per-voxel jitter:** ±3–6 % value and ±2° hue noise per voxel, so surfaces
  feel handmade and never flat-filled.
* **Core palette families:**
  * Dough: golden caramel `#E8A85C` → toasted `#B86B32` → deep crust `#7A3E1D`
  * Strawberry frosting: `#F7A6C1` / `#F27BA5` / shadow `#C9507E`
  * Chocolate: `#6B3A2A` / `#4A2418`, with specular highlights
  * Mint `#9EE3C8`, butter `#FFE29A`, blueberry `#7C8CE0`, sky `#A8D8FF`, cream milk `#FFF6E6`
  * Sprinkles: saturated accents (red, orange, yellow, green, blue, violet). They
    are the **only** near-neon colors allowed, and only in small amounts.
* **Harmony:** the warm palette dominates (about 70 %), with cool sky and mint
  accents. Avoid pure black, pure white and pure-saturation fills on large areas.
* **Value structure:** every shot must read clearly in grayscale. The subject
  (Glazey or the target donut) gets the strongest value contrast in the frame.

## 5. Materials (voxel flags in the palette)

| Material | Treatment |
|---|---|
| Dough | matte, slightly warm subsurface feel (wrap lighting), fine value noise |
| Frosting / glaze | **glossy**: low roughness, visible specular highlights, slight drip silhouettes over edges |
| Classic glaze | semi-translucent look (lighter, higher spec, fresnel rim) |
| Sprinkles | tiny 1×1×3 voxel capsules, randomly rotated in 90° steps, slight emissive pop |
| Milk / jelly / syrup | animated surface with soft specular, depth-tinted, gentle caustics where possible |
| Powdered sugar | high-value, rough, dusted over the top faces only |
| Choco-chip crystals | emissive with bloom; the only strong glow outside effects |

## 6. Lighting and post

* **Key light:** warm low-angle sun (golden hour by default; noon is not
  allowed in hero shots), **soft shadow maps** (PCSS or VSM, no shadow acne,
  no peter-panning).
* **Fill:** cool sky hemisphere plus a subtle warm ground bounce.
* **Ambient occlusion:** per-vertex voxel AO baked at meshing time **plus** a
  screen-space pass (N8AO/GTAO). Every crevice, sprinkle and drip must sit in
  its surface.
* **Tone mapping:** AgX or ACES with a gentle filmic curve and a color grade
  (slight warm highlights, cool shadows).
* **Bloom:** subtle, threshold-limited. Only glaze highlights, emissives and FX.
* **Depth of field:** optional tilt-shift in vistas and menus only, never
  during play.
* **Atmosphere:** height fog and aerial perspective toward pastel sky. Puffy
  voxel clouds.
* **Anti-aliasing:** SMAA or TAA. No crawling edges on voxel silhouettes.

## 7. Characters

* Rounded, squishy, big eyes with **specular eye highlights** (a white 2×2
  voxel glint). Mouths are big and expressive.
* **Squash and stretch** on every jump, land and munch. Belly inflation is
  animated with a wobble, not snapped.
* Glazey (canonical: `art/reference/03_glazey_sheet.jpg`): coral body (~`#F28B6E`), cream belly, pink blush, a 5-stripe rainbow sprinkle tuft on top, stubby arms and
  feet. The silhouette must read at 64 px tall.

## 8. Effects ("juice")

* Crumbs: voxel particles with physics. They bounce 1–2 times, settle and
  fade after 4 s.
* Bite marks: a real scalloped voxel carve in the donut (not a decal).
* Burp: rainbow ring shockwave, screen-space distortion (reduced in
  reduced-motion mode), and nearby grass and sprinkles ripple outward.
* Sparkles, confetti and steam all use voxel particles. No flat 2D sprites in
  the 3D world.

## 9. UI

* Big, rounded, candy-like buttons with a soft drop shadow and a pressed state.
* Icons are drawn in the same voxel style (rendered from voxel models).
* Font: a rounded, friendly typeface (e.g. *Baloo 2* or *Fredoka*),
  minimum 28 px on mobile.

## 10. Instant-fail list (the reviewer must reject on sight)

1. Visible z-fighting, flickering, shadow acne, light leaks or holes in meshes.
2. Lego/Minecraft-scale voxels on characters or near terrain.
3. Flat, un-shadowed lighting, or a missing AO pass.
4. Texture stretching, or any bitmap texture on voxel surfaces.
5. Unharmonized palette: random hex colors, muddy browns, neon floods.
6. Default three.js look: gray background, harsh black shadows, unlit `MeshBasicMaterial`.
7. Aliasing shimmer, banding in the sky or fog, crushed blacks, blown whites.
8. Empty, sparse scenes with no set dressing, or the opposite: noise and clutter
   with no focal point.
9. Placeholder art, debug helpers, stats panels or console overlays in a shot.
10. Anything that would scare or upset a 6-year-old.
