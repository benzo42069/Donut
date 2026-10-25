# Reference Image Prompts

The graphics reviewer compares every gate against these images. Generate them
with your favorite image model (Midjourney, GPT-image, Imagen, Flux…), pick
the best result, and save it as listed. **#1 is the one that matters most.**

Tips:
* The image must clearly show **tiny visible cubes**. If the generator gives
  you a smooth 3D render or chunky Minecraft blocks, reroll. The reviewer can
  only hold the game to a target the voxel engine can actually reach.
* Generate 8–16 variations and choose the one with the clearest focal point and
  the most harmonious palette, not just the busiest one.
* Append your tool's aspect-ratio flag (e.g. Midjourney `--ar 16:9 --style raw`).

---

## 1. Environment master (required) → `art/reference/01_environment_hero.png`

```
A whimsical miniature voxel-art diorama of a ring-shaped island shaped like a
giant frosted donut, floating in a soft pastel sky-sea, seen from a 3/4 high
isometric angle. The hole in the center of the ring is a calm lagoon of creamy
milk. The entire scene is built from thousands of tiny, dense voxels — small
cubes clearly visible up close, like a highly detailed MagicaVoxel diorama —
NOT large Minecraft blocks.

On the island: rolling hills of glossy strawberry-pink frosting dripping over
golden-brown baked dough cliffs; meadows of sprinkle flowers; round trees whose
canopies are clusters of rainbow sprinkles; a cozy bakery cottage with a
cruller-shaped roof, chocolate shingles and a little chimney puffing voxel
steam; a wooden pier reaching into the milk lagoon with a candy-striped
lighthouse topped by a glowing glazed donut; small frosted donuts nestled in
the grass like eggs, and a few donuts bobbing in the milk; a thin amber
maple-syrup waterfall pouring into the lagoon; a powdered-sugar snowy peak on
the far side; wobbly translucent jelly mushrooms.

Warm late-afternoon golden-hour sunlight, soft long shadows, rich ambient
occlusion in every crevice, gentle bounce light, subtle tilt-shift depth of
field, puffy cubic voxel clouds, light atmospheric haze toward the horizon.

Palette: warm caramel and toasted dough browns, strawberry pink, mint green,
butter yellow, cream, soft sky blue, with tiny saturated accents only on
sprinkles. Harmonious, appetizing, candy-like but not neon.

Cozy, joyful, storybook charm, family friendly, for young children. Crisp,
highly detailed, premium indie game key art, beautifully lit, 16:9.
```

**Negative / avoid:** `Minecraft, large blocks, pixel textures, low resolution,
smooth non-voxel surfaces, photorealistic food, plastic look, text, letters,
logo, watermark, UI, humans, dark, scary, gloomy, oversaturated neon, harsh
black shadows, noisy, cluttered, blurry`

---

## 2. Ground-level gameplay view → `art/reference/02_ground_level.png`

```
Third-person gameplay view at a low camera height of a cute small round voxel
creature named Glazey — a squishy peach-pink blob with a cream belly, big
glossy eyes with white highlights, a wide happy mouth, stubby little feet and a
tuft of three rainbow sprinkles on its head — standing in a meadow of
sprinkle flowers on glossy pink frosting ground, looking at a frosted donut
with a bite taken out of it and tiny voxel crumbs scattered around. Background:
the bakery cottage, a sprinkle tree, the milk lagoon and the distant lighthouse
with the glowing donut on top, softly out of focus. Built from tiny dense
voxels, MagicaVoxel diorama style, not Minecraft. Golden-hour light, soft
shadows, rich ambient occlusion, warm and cozy, children's game, 16:9.
```

---

## 3. Glazey character sheet → `art/reference/03_glazey_sheet.png`

```
Character turnaround sheet of Glazey, a cute voxel creature for a children's
game: a small round squishy peach-pink body, cream belly, big glossy expressive
eyes with white specular highlights, wide happy mouth, stubby feet, tuft of
three rainbow sprinkles on top. Show front, side, back, and three expressions
(happy munching with cheeks full, surprised, giant burp with rainbow ring),
plus three belly sizes from normal to perfectly round ball. Built from small
dense voxels, smooth rounded silhouette, soft studio lighting, ambient
occlusion, clean pale cream background, premium voxel art, 16:9.
```

---

## 4. Donut lineup / asset sheet → `art/reference/04_donut_lineup.png`

```
Product-shot lineup of nine voxel-art donuts on a soft cream background, each
on a tiny wooden pedestal, studio lighting with glossy highlights: pink
strawberry frosting with rainbow sprinkles; glossy chocolate; powdered sugar
jelly-filled with red jelly peeking out; long amber maple bar; white powdered
donut; translucent classic glazed; craggy blueberry old-fashioned; swirly
pastel mystery donut with a question-mark pattern; and a large glowing rainbow
mega donut in the center. One donut shows a scalloped bite mark with tiny voxel
crumbs. Built from small dense voxels, frosting drips over the edges,
appetizing and cute, crisp detail, 16:9.
```

---

## 5. (Optional) Region mood tiles → `art/reference/05_region_<name>.png`

Reuse prompt #1's style paragraphs (the voxel, lighting and palette lines)
and swap in the subject:

* **Cruller Canyon:** twisting braided-dough rock arches and canyons, warm
  sunset light, echoing depth.
* **Jelly Jungle:** giant wobbly translucent jelly mushrooms in red, purple
  and orange, donut geysers shooting donuts into the air, lush candy foliage.
* **Maple Mountains:** amber maple-syrup waterfalls, pancake-stack mesas,
  sticky glistening cliffs.
* **Choco Chip Caves:** dark cozy caves lit by glowing chocolate-chip crystals,
  sleepy bats, soft cyan and amber glow. Not scary.
* **Powdered Peaks:** powdered-sugar snow mountains, a sugar-snowman village,
  a cookie sled track.
