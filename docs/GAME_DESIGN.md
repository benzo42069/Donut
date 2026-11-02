# Glazey's Donut Island — Game Design Document

> Working title. Alternates: *Munch Island*, *Big Munch*, *Dunk Day!*

## 1. Pitch (one breath)

You are **Glazey**, a squishy, round little creature who lives on an island
shaped like a giant donut. Wild donuts grow on trees, roll around like
critters, and bob in the milk lagoon. **Every donut you munch gives you a
silly power** (bounce, slide, float, stick to walls…) and makes you rounder.
Get round enough and you can *roll*. Do a giant **rainbow burp** to shrink
back down and blast clouds, seagulls and sleepy friends out of the way.
Your goal is to find the **Golden Sprinkles** blown away by the Sprinkle Storm
so the island can celebrate **Dunk Day**: dunking the giant Moon Donut into
the milk lagoon.

All of it is built from **small, dense voxels**: chunky enough to look like a
toy diorama, fine enough that a donut has drippy frosting, bite marks and
crumbs that fly off as tiny cubes.

## 2. Audience and design pillars

**Audience:** ages 6+, playing alone or with a parent. They might not read
well yet, they will mash buttons, and they get bored of anything that takes
more than about 3 minutes without a reward.

| Pillar | What it means in practice |
|---|---|
| **Munching feels amazing** | Every bite has a squash-and-stretch chomp, a voxel bite mark carved out of the donut, a crumb explosion, a sound and a belly wobble. This is the most polished interaction in the game. |
| **Silly, never scary** | No death, no enemies to hurt, no timers that punish. Falling in milk makes you bob up in a rubber ring. "Bad guys" are cheeky seagulls who giggle. |
| **Toy-box beautiful** | It should look like a handmade miniature diorama you want to reach into. Graphics quality gates every milestone (see `AGENTIC_LOOP.md`). |
| **No reading needed** | Goals shown as picture bubbles, icons and gibberish voices (like Animal Crossing). Text is optional and large. |
| **Sharing is a superpower** | Feeding a friend their favorite donut rewards you more than eating it yourself. It keeps the game from being only about eating sugar, and parents will appreciate it. |

## 3. Core loop

```
 explore ──► spot donut ──► MUNCH (3 bites) ──► get flavor power + rounder belly
    ▲                                                     │
    │                                                     ▼
 Golden Sprinkle ◄── help a friend / solve a tiny puzzle using the power
    │                                                     │
    └──────────── BURP (shrink + blast) ◄─────────────────┘
```

* **Munch:** walk into a donut and tap *Munch*. Each donut takes 3 bites.
  The voxels really are carved away in a bite-mark shape, and the crumbs are
  voxel particles that bounce and settle. The last bite gives you the power.
* **Belly meter (0–5):** each donut adds +1 roundness. Glazey's model inflates
  in steps. At 3+ you can **roll** (hold *Jump* on a slope). At 5 you're a
  ball and will roll whether you like it or not, which kids find hilarious.
* **Burp:** tap *Burp* at any time. The bigger the belly, the bigger the burp:
  a rainbow shockwave that blows away fog, knocks fruit off trees, wakes
  sleeping NPCs, makes seagulls drop stolen donuts and clears sprinkle piles.
  Burping resets the belly to 0 and keeps the last flavor power for 20 seconds.
* **Powers** last until you eat a different donut. Only one at a time keeps
  it simple.

## 4. Donut flavors = powers

| Donut | Look | Power | Silly side effect |
|---|---|---|---|
| **Pink Sprinkle** | strawberry frosting, rainbow sprinkles | **Boing:** super bounce, 3× jump | squeaky-toy sound on every landing |
| **Chocolate** | glossy dark frosting | **Slide:** belly-skate fast on any surface | leaves a chocolate trail that other critters slip on |
| **Jelly-Filled** | powdered, red jelly peeking out | **Wobble:** burp spits a bouncy jelly cube you can stand on | Glazey turns slightly see-through and jiggly |
| **Maple Bar** | long bar, amber glaze | **Sticky:** climb walls and ceilings | things stick to you (leaves, a confused duck) |
| **Powdered** | white sugar dusting | **Puff:** float slowly like a dandelion | sneezes clouds of sugar |
| **Classic Glazed** | translucent shiny glaze | **Shine:** glow and light up dark caves | sparkle trail, plays a little chime melody |
| **Blueberry Old-Fashioned** | cracked craggy edges | **Heavy:** sink, smash crumbly walls, walk underwater on the lagoon floor | everything sounds deep and slow |
| **Mystery Donut** | swirly question-mark frosting | random: giant head, tiny voice, everything says "honk", gravity flip for 10 s | completely random, never useful, always funny |
| **Rainbow Mega Donut** (rare, one per region) | huge, glowing | all powers at once for 30 s, disco lights | music turns into an accordion polka |

## 5. Where donuts come from (the "wild donut" ecology)

* **Donut trees:** bump the trunk and donuts drop like apples.
* **Wild rolling donuts:** they roll around in herds, flee when you sprint, and
  hop into the lagoon. You catch them by sneaking or by rolling yourself.
* **Donut geysers:** in Jelly Jungle, a geyser shoots donuts into the air
  and you catch them while bouncing.
* **Lagoon floaters:** donuts bob in the milk like ducks. Swim out with a
  rubber ring.
* **Donut Designer creations:** donuts the player designs appear in the world
  (see §8).

## 6. World: Donut Island

The island **is a giant ring-shaped donut** floating in a sky sea. The hole in
the middle is the **Milk Lagoon**. Walking all the way around the ring brings
you back to the start, so you can't get lost. The world is flat-gravity: the
ring is an island in the shape of a donut, not a torus planet.

Regions, clockwise from the start:

1. **Glaze Meadows** (start/tutorial): pink frosting hills dripping over golden
   dough cliffs, sprinkle-flower fields, Granny Dough's bakery, the Dunk Day pier
   and the lighthouse topped by the Moon Donut.
2. **Cruller Canyon:** twisty braided-dough rock arches. Rolling races, echoes.
3. **Jelly Jungle:** wobbly jelly mushrooms you bounce on, donut geysers,
   jelly rivers in red, purple and orange.
4. **Maple Mountains:** amber syrup waterfalls, sticky cliffs to climb, a
   pancake-stack mesa.
5. **Choco Chip Caves:** dark caves with glowing chocolate-chip crystals and
   sleepy bats. Needs Shine.
6. **Powdered Peaks:** powdered-sugar snow, sledding on a cookie, a sugar
   snowman village.
7. **Milk Lagoon** (center): the swimming hub, floating donuts, the Moon Donut
   finale.

Each region has 3 Golden Sprinkles: one from helping a friend, one from a
mini-game and one hidden behind a power puzzle. 18 in total, plus 3 in the
lagoon, makes 21.

## 7. Friends (NPCs)

| Name | Who | Wants |
|---|---|---|
| **Granny Dough** | elderly hedgehog baker, flour on her spines | ingredients for the Moon Donut; she runs the tutorial |
| **Mayor Crullerbeard** | walrus with a braided cruller mustache | to give a speech nobody can understand |
| **Sir Sprinkles** | tiny corgi knight with a spoon sword | someone to "duel" (a burp contest) |
| **Mo & Jo** | glaze ducks, twins | lost ducklings (they're hiding in donut holes) |
| **Professor Pudding** | mole scientist in the Choco Caves | to see the "Mega Donut phenomenon" |
| **Coco** | sleepy chocolate llama | to be woken up (with a burp, obviously) |
| **The Crumb Bandits** | three giggly seagulls | to steal your donuts. Burp at them and they drop the donut and laugh. Recurring comic relief, not enemies. |

**Quests are pictures**: a speech bubble shows, for example, *[duck icon] + [?] +
[donut hole icon]*. When you complete one, the friend dances and confetti made
of voxel sprinkles flies out.

## 8. Mini-games (each awards a Golden Sprinkle)

1. **Dunk Derby** (Glaze Meadows): dunk a donut into milk, hold, release when
   the soak bar hits the sparkle zone. Too long and it goes *floop*, which is
   also funny.
2. **Cruller Roll Race** (Cruller Canyon): roll down the canyon as a ball,
   collect sprinkles and beat the wild donuts to the bottom.
3. **Geyser Catch** (Jelly Jungle): catch donuts from the geyser in your mouth
   while bouncing. Combo counter with silly voices.
4. **Sticky Climb** (Maple Mountains): climb a syrup cliff while the Crumb
   Bandits drop marshmallows (they bounce off harmlessly and make you giggle).
5. **Donut Bowling** (Powdered Peaks): become a mega-ball and bowl into sugar
   snowman pins.
6. **Donut Designer** (Granny's bakery, always available): voxel-paint your
   own donut. Choose dough shape, frosting color, drizzle pattern and sprinkle
   shapes, then press *Bake*. Your donut appears out in the world as a wild
   donut, and NPCs react to it ("Mmm!"). This is the creative toy of the game and
   leans on the voxel engine.

## 9. Story beats (told without words)

1. **Opening (30 s):** it's Dunk Day. Everyone gathers at the pier. The Moon
   Donut glows. A cartoon **Sprinkle Storm** swirls in and blows all its golden
   sprinkles across the island. Everyone gasps. Granny Dough looks at Glazey.
   Glazey's belly rumbles.
2. **Each region:** arriving plays a 5-second vista pan. Every Golden Sprinkle
   flies back onto the Moon Donut, which you can see from anywhere on the ring,
   so you can always see your progress.
3. **Finale:** with all 21 sprinkles, the whole island does the Big Dunk. The
   Moon Donut is dunked, milk splashes into the sky as voxel droplets and
   rains down as stars, everyone gets a donut, and Glazey does the biggest
   burp in history, which turns into fireworks. Credits roll with all friends
   dancing.

## 10. Controls (touch-first, works with keyboard and gamepad)

| Action | Touch | Keyboard | Gamepad |
|---|---|---|---|
| Move | left virtual stick | WASD / arrows | left stick |
| Camera | drag right side (auto-camera by default) | mouse / Q E | right stick |
| Jump / Roll (hold) | big green button | Space | A |
| Munch | big pink button (pulses when a donut is near) | E / click | X |
| Burp | yellow button (grows with belly) | B | Y |

Four buttons, no combos, generous auto-aim on Munch.

## 11. Kid-safety, comfort and accessibility

* No death or fail states. Falling off the island puts you back in a milk
  bubble. Mini-games always give a prize, and a better result gives a sparkle
  badge.
* No ads, no in-app purchases, no online chat, no data collection.
* A parent menu behind a "hold for 3 seconds" gate: volume, session timer
  reminder, colorblind-safe power icons (shape + color), reduced motion
  (no camera shake, softer flashes) and text size.
* Healthy framing: donuts are magical island fruit. Friends cheer when you
  share, and there's an optional "Granny says: brush your teeth!" bedtime
  message.
* Sessions are designed for 10–20 minutes. Autosave everywhere.

## 12. Scope tiers

* **MVP (vertical slice):** Glaze Meadows + Milk Lagoon, 4 donut powers
  (Sprinkle, Chocolate, Powdered, Glazed), munch, belly, burp, 3 NPCs,
  Dunk Derby, Donut Designer, Crumb Bandits, 6 Golden Sprinkles, mini finale.
* **v1:** all 6 regions, all flavors, all mini-games, full finale.
* **Stretch:** couch co-op (a second Glazey, "Sprinkly", in mint), photo mode
  with stickers, seasonal donuts, and a level editor using the Designer tools.
