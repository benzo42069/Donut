# Review M4 iter 8
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M4 --iter 8` at commit `75e6e9b`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 16 files to `shots/M4/8/` with no errors (`harness.json` `ok: true`, empty log).
- **Viewed:** every 1920x1080 frame, the 844x390 frames, both strip composites and the strip frames.
- **Zoomed crops (2-3x):**
  - Glazey in walk, jump and touch.
  - The studio stage 4 eyes and the M3 final eyes side by side.
  - Studio stage 5 (body, belly, arms).
  - All three walk frames side by side.
  - The ground under the jump.
  - The pink canopy and lighthouse.
  - The milk.
- **Sampled:** 7x7 and 13x13 pixel means (luma, hue, saturation) with a script in the scratchpad.
- **Diff checked:** the iter 7→8 source diff, which touches `glazey.ts`, `palette.ts` (eye entries only), `m4Play.ts` and `FollowCamera.ts`.

Beforehand I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4, `art/reference/NOTES.md`, `docs/REFERENCE_FIXES.md`, the M4 section of `docs/PLAN.md` and `reviews/M4-iter7.md`, and viewed all four references.
- **Primary for Glazey:** 03.
- **Primary for the play frames:** 01 and 02, judged on their Follow lists only. I did not reward 02's chunky grass, blue water or text sign.

**Summary.** Iter 8 fixed the two things that most hurt the character:
- **Face to camera.** Glazey now faces the lens at a shallow 3/4 in every play shot. Both eyes, the smile, the blush and the belly sit well inside the outline. For the first time in M4 he reads as a cute character at 1x and not as a profile.
- **Eyes.** The iter 7 iris speckle is gone. In the studio the irises are clean and glossy again, with a smooth rim, a dark upper iris, a warm lower crescent and a visible environment sheen. The blocker is cleared.

Everything else the iter 7 review asked for is untouched:
- The canopy, milk, clouds and arm tips.
- The felt-like body surface.

The play belly has also turned into a flat sticker. It reads 169-172 luma across its whole area in walk, so it has no convex shading at all. Its khaki-cream (hue 43, sat 0.40, luma 170) is far from the sheet's `#F5E2A8`.

The gate mean is about 7.1 (iter 6: 6.9, iter 7: 7.0). The bar is 9.0. **This is the 8th failed iteration, so §6 escalation to the user is now mandatory.**

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m4-walk-strip (still + strip) | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 8 | 8 | 7 | 7 | 7.1 |
| m4-jump-apex | 7 | 7 | 7 | 6 | 7 | 6 | 7 | 8 | 8 | 7 | – | 7.0 |
| m4-touch-ui (hero) | 7 | 7 | 7 | 7 | 7 | 6 | 7 | 8 | 8 | 7 | – | 7.1 |
| gallery-glazey-belly | 7 | 7 | 8 | 7 | 7 | 7 | 8 | 6 | 7 | 7 | – | 7.1 |
| gallery-glazey-belly_strip (turntable) | 7 | 7 | 8 | 7 | 7 | 7 | 8 | 6 | 7 | 7 | – | 7.1 |

- **Gate mean:** about 7.1. The bar is 9.0.
- **Minimum:** 6. That is materials in every play shot, AO and contact in jump, and detail in the studio. The bar is at least 8 in every category.
- **Score moves since iter 7:**
  - **Charm:** up to 8 in play, because the face is finally presented.
  - **Composition in jump:** up to 7.
  - **Studio materials:** up to 7, because the eyes are glossy again.
  - **Play lighting:** down to 7. Turning him toward the lens flattened his terminator. The lit to core span in walk is now about 40 luma, against about 70 in iter 7, and there is still no sheen or rim at 1x.

**Plateau (§5).** The mean went 6.9 → 7.0 → 7.1, which is less than +0.3 over two iterations. The builder has had nine fix items open for 2-5 iterations with no structural change on the environment side (canopy, milk, clouds). Per §6 the builder must now stop and escalate to the user.

## Blockers
None this iteration.
- **The iter 7 eye regression is cleared.**
  - **Studio stage 4 (irises at about (900-1110, 690-790)):** the irises are smooth, two-zone and glossy, with a lavender environment streak and a white 2x2 glint.
  - **Against the M3 final:** they are at least as glossy, and the left/right sheen asymmetry was already in M3. No iris has isolated speckle voxels in a 3x crop.
- **No art bible §10 instant-fail items:**
  - No acne, holes, z-fighting or debug overlays.
  - Near grass voxels are about 8 px.
  - No blown or crushed fills apart from the intentional eye ink.
- **No regression in shared content** (see the regression check). The studio belly surface is grainier than M3's, but its form is better, so I do not count it as a net drop. It is fix 2.

## Fix list (priority order; max 10; each concrete and testable)
1. **Give the belly real volume and cream colour in play.**
   - **Where:** the belly patch in `src/art/models/glazey.ts`, the `glazeyBellySoft` entry in `src/art/palette.ts`, and `HERO_TUNING` in `src/game/Game.ts`. `facing: -0.1` now paints the patch over the whole front dome. It looks like the patch is lit by flat ambient, or that it is a near-planar decal in play.
   - **Problem:**
     - **Walk:** samples at (1040,790), (1030,830) and (1060,840) are 169, 171 and 172 luma, so the shading is flat. Jump at (1020,660) is 172, and touch at (1050,800) is 169.
     - At 1x it reads as a pale khaki disc stuck on him (hue 43, sat 0.40). It does not read as a tummy.
   - **Target:**
     - At least 35 luma of convex falloff across the oval in play: the upper sun side at about 200 or more, the lower edge at about 160.
     - Lit colour within ΔE of about 8 of the sheet's `#F5E2A8`, so not grey-khaki.
     - At 1x the belly visibly swells out of the coral, as on sheet 03 FRONT.
2. **Studio belly: clean cream surface, and a margin at the bottom.**
   - **Where:** the belly jitter and dither in `glazey.ts` and `palette.ts`, plus `bellyLayout`. The `ry` factor went from 0.40 to 0.36, and the patch still reaches the foot crease.
   - **Problem:**
     - **Stage 4 and 5:** the oval's surface is grainy "sand" at 1x. The lower-left goes khaki at (950,890): luma 130, sat 0.25.
     - The bottom edge runs into the body outline at about y 915, with no coral between the cream and the silhouette on stages 3-5.
     - The height to width ratio is about 0.57.
     - M3's belly read as clean cream with soft terraces.
   - **Target:**
     - Value jitter within ±3 % on the belly.
     - The shadow side stays cream-hued (sat at least 0.3, luma at least 145).
     - At least 2 coral voxels below the oval on every stage.
     - Height at least 0.6x width.
3. **Restore the terminator and add a sheen and rim on Glazey in play (materials 6/10 everywhere for 4 iterations).**
   - **Where:** `HERO_TUNING` in `Game.ts` (`roughMatte`, `heroRim`), plus the `glazeyBody` jitter in `palette.ts`.
   - **Problem:**
     - Turned toward the lens, his walk body spans only about 117-156 luma.
     - The 3x crops show a blotchy per-voxel patchwork (felt), with no specular and no warm rim.
   - **Target:**
     - Lit to core span of at least 60 luma at the new yaw.
     - A broad soft highlight on the upper sun-side shoulder.
     - A 1-2 px warm rim on the shadow-side silhouette, visible at 1x.
     - Body value jitter within ±4 %.
4. **Bring the play eyes up to the studio gloss.**
   - **Where:** the `MAT.gloss` response under the play `HERO_TUNING` environment.
   - **Problem:** in walk, jump and touch the irises are matte two-tone brown with only the white glint. The studio's environment streak does not show in play.
   - **Target:** a soft secondary specular arc on the upper iris, visible at 1x in all three play shots, as on sheet 03.
5. **Body silhouette: back toward the sheet's rounded bean.**
   - **Where:** the body SDF in `glazey.ts`.
   - **Problem:** belly stages 0-2 and the play body now taper to a narrow, egg-like crown under the tuft. They read like a potato or a teardrop. Sheet 03 and the M3 final have broad, rounded shoulders and a fuller top.
   - **Target:** at stage 0, the width at eye height is at least 0.92x the maximum width, and the crown is a broad arc, not a point.
6. **Clean up the pink canopy. Not addressed for 3 iterations.**
   - **Where:** `src/art/models/sprinkleTree.ts` `res > 1` branch, plus placement in `m4Play.ts`.
   - **Problem:**
     - The lit side is luma 108 at walk (200,350). The target is at least 130.
     - The dithered salt-and-pepper band is still at about (0-400, 440-620).
     - The canopy is cut by the left frame edge and fills about 20 % of walk and touch.
     - At 844x390 it is the noisiest thing in the frame.
   - **Target:**
     - A smooth shaded gradient.
     - Lit side at least 130.
     - Either fully in frame or out of it.
7. **Milk reads as milk. Not addressed since iter 3.**
   - **Where:** `src/engine/render/Water.ts`.
   - **Problem:** walk (700,700) is hue 3, sat 0.30, and (600,720) is hue 21, sat 0.50. It is still peach-pink satin.
   - **Target:**
     - Cream-white body with sat at or below 0.2.
     - Pink only as soft reflections of the drip wall.
8. **Jump height cue.**
   - **Where:** `JUMP_STAGE` in `m4Play.ts`, plus the contact shadow.
   - **What iter 8 fixed:** the feet now dangle, the arms are raised, and the path is behind his feet. Those are real improvements.
   - **What iter 8 lost:**
     - There is no readable shadow under him. The path directly below him at (1020-1110, 760-880) is a uniform 188-193 luma. The only darkening is a faint 78-95 smudge in the grass at about (1020-1110, 940-1000).
     - His tuft and head overlap the green canopy behind him at about (930-1130, 320-520), which muddies the silhouette.
   - **Target:**
     - A clearly visible soft shadow at least 20 luma darker than the surface, offset below him.
     - Sky or plain lawn behind the head and tuft.
9. **Arm tips are still muddy. Not addressed.**
   - **Problem:** studio (1225,760) is luma 92 and (820,760) is luma 84. They read as dirty brown stubs on the large stages.
   - **Target:** no arm tip below about 105 luma, and none more saturated than the body.
10. **Play clouds. Not addressed.**
    - **Problem:** at walk (480-700, 175-260) and (985-1210, 235-290) they are still flat slabs with a hard lilac underside band.
    - **Where:** play cloud scale and placement only. Do not change the M2 `buildCloud` output.
    - **Target:** vertically lobed puffs, with the underside shading through light rather than a colour step.

## What is working (keep it)
- **Glazey's presentation in play.**
  - The face is centred on the form, and both eyes are well inside the outline.
  - The belly sits on the front axis with coral all round.
  - Raised arms and dangling feet in the jump.
  - This is the biggest charm gain in M4.
- **The studio eyes.** They are clean, glossy, two-zone irises with a strong glint. Do not reintroduce dither.
- **The studio lighting.** It keeps a real body terminator, a cool shadow side, and a convex belly gradient (130-212 luma).
- **The back view stays coral (RF-10).** The side view shows the cream bulge on the front profile.
- **The play world.** It is set dressed and warm: fine grass with flower specks, the pier, the drip wall, scattered donuts and footfall dust. The whole lighthouse with its glowing donut is in frame in all play shots.
- **The touch UI.** It has candy buttons, the donut joystick knob and the Glazey jump icon.

## Store-page test: no
The touch-ui hero frame is the most appealing M4 frame so far, because Glazey finally looks at you. But the subject is a matte, felt-textured egg with a flat khaki disc for a belly. The upper-left fifth is a dull, dithered mauve canopy. The lagoon is pink satin, and the clouds are slabs. Next to reference 02's warm hero and sheet 03's candy-vinyl Glazey, it still reads as good indie (about 7/10), not premium store-front art.

## Previous review (M4-iter7): status of the fix list
| # | item | status |
|---|---|---|
| 1 | Restore glossy eyes (blocker) | **Fixed in the studio.** There is no speckle, the rim is smooth, the environment sheen is back, and they are at least as glossy as M3. In play the irises are clean but show no visible gloss streak at 1x (new fix 4). |
| 2 | True 3/4 in play | **Fixed.** The face and belly are centred and both eyes are inside the outline in walk, jump and touch. The cost is a flatter terminator (fix 3). |
| 3 | Belly as a soft oval | **Partly fixed.** It now has a rounded top arc. In the studio the ratio is about 0.57, the bottom margin is missing on stages 3-5, and the surface is grainy. In play the shape is good, but the shading is flat (fix 1). |
| 4 | Unambiguous jump | **Partly fixed.** Path behind the feet, feet dangling, arms up. The contact shadow is no longer readable, and the head overlaps a tree canopy. |
| 5 | Material for the candy coral | **Not fixed.** |
| 6 | Pink canopy | **Not fixed.** Luma 108, the dither band is unchanged. |
| 7 | Milk reads as milk | **Not fixed.** |
| 8 | Muddy arm tips | **Not fixed.** Luma 84-92. |
| 9 | Clean frame edges | **Partly fixed.** The chocolate hill and rocks are gone from the left edge. The pink canopy and the corner green tree are still cut by the left edge, and the right tree is cut by the right edge. |
| 10 | Play clouds | **Not fixed.** |

## Regression check
- **M3 (`shots/M3/final/gallery-glazey-belly`):**
  - **Eyes:** no regression. They are glossy and clean like M3, and the iter 7 regression is resolved.
  - **Belly:**
    - Its form is better than M3: an oval with real convex shading.
    - Its surface is grainier and its shadow side more khaki than M3's clean cream terraces (fix 2). Not a net drop.
  - **Body silhouette:** narrower and more egg-shaped than M3's squat bean (fix 5). The lighting is clearly better than M3, so I log this as a fidelity finding, not a blocker.
  - The tuft, blush, mouth and coral back view are at or above M3.
- **M3 donuts, props and low tier: no regression.** The iter 8 diff touches only `glazey.ts`, the three eye entries in `palette.ts`, `m4Play.ts` and `FollowCamera.ts`. Only Glazey, the Glazey gallery, `Game.ts`, `GlazeyRig.ts` and `touchIcons.ts` reference them.
- **M2 (`shots/M2/final`): no regression.** None of the changed modules is imported by the M2 diorama scenes, and the iter 6 M2 re-shoot matched the final.
- **M0 and M1: no regression.** No shared code was changed.

```json
{"gate":"M4","iter":8,"verdict":"FAIL","mean":7.1,"min":6,"blockers":0,"store_page":false}
```
