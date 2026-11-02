# Review M4 iter 7
## Verdict: FAIL

I captured the shots myself with `npm run shots -- --gate M4 --iter 7` at commit `43d8002`, with a clean working tree.
- **Harness:** GPU path (ANGLE Metal, Apple M4). It wrote 16 files to `shots/M4/7/` with no errors (`harness.json` `ok: true`, empty log).
- **Viewed:** every 1920x1080 frame, the 844x390 touch frame, both strip composites, and the turntable frames.
- **Zoomed crops (2-3x):**
  - Glazey in walk and at the jump apex.
  - The ground under the jump.
  - Studio stage 4 (belly and eyes).
  - The M3 final eyes, for comparison.
  - The lighthouse top.
  - The pink canopy band.
  - The left edge of walk frame f2.
- **Sampled:** 5x5 and 7x7 pixel means (luma, hue, saturation), using a small PNG decoder in the scratchpad.

Beforehand I read `docs/ART_BIBLE.md`, `docs/AGENTIC_LOOP.md` §3-§4, `art/reference/NOTES.md`, `docs/REFERENCE_FIXES.md` and the M4 section of `docs/PLAN.md`, and viewed all four references.
- **Primary for Glazey:** 03.
- **Primary for the play frames:** 01 and 02, judged on their Follow lists only. I did not reward 02's chunky grass, blue water or text sign.

**Summary.** Iter 7 is the first iteration in a while where Glazey's form actually changed. Three things improved for real:
- **Lighting.** Glazey now has a terminator in play. In walk the lit coral is luma 171 at (1290,640) and the core shadow is 102 at (1310,760), a span of about 70 (iter 6: about 20).
- **Studio belly.** It is now a real swell. It shades from luma 210 on the upper sun side at (1100,830) to 131 on the lower shadow side at (950,890), which beats the M3 final's span of about 40. It also starts directly under the smile.
- **Lighthouse.** It is whole in all three play shots, with the glowing donut well clear of the top edge.

The things that hold the gate back are still there:
- **3/4 face and belly.** In play, Glazey is still shown at roughly 60-70° yaw. The face and belly sit on the near-left silhouette edge, so the belly still reads as a cream pita he is holding against his side, and the left eye still sits on the outline.
- **Belly shape.** In the studio the belly is a wide, flat-topped slab on the bottom third, not the sheet's soft oval.
- **Eyes.** The irises have lost the M3 gloss and gained ragged dither speckle. That is a regression in a shared asset.
- **Canopy, milk and play clouds.** None of them was touched.

The gate mean is about 7.0 (iter 5: 6.7, iter 6: 6.9, now 7.0). The bar is 9.0.

## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m4-walk-strip (still + strip) | 7 | 7 | 8 | 7 | 7 | 6 | 7 | 8 | 7 | 7 | 7 | 7.1 |
| m4-jump-apex | 7 | 6 | 7 | 7 | 7 | 6 | 7 | 8 | 7 | 7 | – | 6.9 |
| m4-touch-ui (hero) | 7 | 7 | 8 | 7 | 7 | 6 | 7 | 8 | 7 | 7 | – | 7.1 |
| gallery-glazey-belly | 7 | 7 | 8 | 7 | 7 | 6 | 8 | 6 | 7 | 7 | – | 7.0 |
| gallery-glazey-belly_strip (turntable) | 7 | 7 | 8 | 7 | 7 | 6 | 8 | 6 | 7 | 7 | – | 7.0 |

- **Gate mean:** about 7.0. The bar is 9.0.
- **Minimum:** 6 (materials everywhere, and composition in jump). The bar is at least 8 in every category.
- **Categories at 8:** lighting in walk, touch and studio; detail in play; voxel density in the studio.

**Plateau (§5).** The mean went 6.7 → 6.9 → 7.0. That is +0.3 over two iterations, exactly at the threshold, and only +0.1 this iteration. More important: iter 8 is the last one before escalation (§6), and the gap to the bar is 2.0 points. One more iteration of parameter work will not close it. The builder should expect to escalate after iter 8 unless the 3/4 presentation (fix 2) and the materials (fix 5) change structurally.

## Blockers
- **[gallery-glazey-belly and all play shots] Regression in the eyes against `shots/M3/final/gallery-glazey-belly` (pass bar §4.5).**
  - **M3 final:** clean, glossy dark irises with a soft environment streak and a crisp rim. They read as wet candy eyes (art bible §7, "big glossy eyes"; NOTES 03 Follow list).
  - **Iter 7, studio stage 4 at about (900-1110, 690-790):**
    - The irises are matte brown with a ragged, salt-and-pepper band of light and dark iris voxels across the lower half (left eye at about (920-960, 740-780)).
    - The rim is jagged, and there is no environment gloss. Only the white glint remains.
    - It is visible at 1x on the large back-row figures and in the play close-ups.
  - **Cause:** `src/art/models/glazey.ts` about l.405-411. The hash dither `n < warm ? 'eyeIrisLight' : 'eyeIris'` scatters two iris colours per decal voxel.
  - **Rule:** this is shared content (the Glazey asset) that is visibly worse than a passed final, so it is a blocker.

There are no art bible §10 instant-fail items:
- No acne, no holes, no z-fighting and no debug overlays.
- Near grass voxels are about 8 px.
- No blown or crushed values outside the intentional eye ink.

**The iter 6 belly-form blocker is cleared.** The studio belly now has more convex shading than M3 and sits directly under the smile. Its shape still needs work (fix 3), but it is no longer a loss of form against the approved asset.

## Fix list (priority order; max 10; each concrete and testable)
1. **Restore glossy eyes (blocker).**
   - **Where:** `glazey.ts` iris branch, about l.398-412. Drop the per-voxel hash between `eyeIrisLight` and `eyeIris`, and use a smooth radial or vertical split: a dark upper iris and a warm lower crescent with one clean edge. Restore the M3 iris gloss (the env/spec streak) in the eye material flags.
   - **Target:**
     - No isolated light or dark iris voxels in a 3x crop of studio stage 4.
     - A smooth iris rim.
     - A visible soft specular streak besides the white glint.
     - Side by side, at least as glossy as the M3 final.
2. **Present Glazey at a true 3/4 in play (structural).**
   - **Where:** the walk heading and camera offset in `src/debug/scenes/m4Play.ts` (`stage(112, 0.3, 24)` and the stick direction), plus the `FollowCamera.ts` look-ahead yaw.
   - **Problem:** at the current camera he is turned about 60-70° away from the viewer.
     - **Walk:** the left eye touches the outline at about (1150,690). The belly runs into the left silhouette at about (1155, 790-850). The mouth and blush wrap off the form.
     - **Jump and touch:** the same, at about (1135,600) in jump and (1150,700) in touch.
   - **Target:**
     - A 25-35° yaw toward camera while walking.
     - Every face feature at least 15 % of the body width inside the outline.
     - The belly oval centred on the front axis, with at least 1 coral voxel between it and the outline.
     - At 1x the read is "a tummy", not "a held cracker". The touch-button icon already gets this right.
3. **Belly shape: a soft oval, not a flat-topped slab.**
   - **Where:** `glazey.ts` `bellyLayout` (l.328), the patch `facing: 0.15`, and `FOOT_CREASE`. The patch is probably clipped by the facing test along the top, and runs into the foot crease along the bottom.
   - **Problem:** on studio stage 4 the top edge is a near-straight horizontal at y about 810 across x 905-1120, and the bottom spills to the body outline at y about 915. It covers only about 16 % of the front and is about 2:1 wide. It reads as a bib or a sandbag.
   - **Target:**
     - A rounded top arc, as in sheet 03 FRONT and the M3 final.
     - Height at least 0.6x width.
     - At least 1-2 coral voxels between the bottom of the oval and the outline.
     - 25-35 % of the front silhouette.
     - Keep the colour (hue 39, sat about 0.39) and the 75-luma convex shading.
4. **Make the jump unambiguous.**
   - **Where:** `JUMP_STAGE` in `m4Play.ts`. `stage(112, 0.6, 24)` still puts the lagoon rim directly behind him.
   - **What iter 7 fixed:** a soft contact shadow now sits on the lawn at about (1130-1250, 900-950), about 190 px below the soles. That is a real height cue.
   - **Problem:**
     - His soles at y about 735 overlap the pink rim behind him, so at a glance he still reads as standing on the rim.
     - The feet are tucked, not dangling.
   - **Target:**
     - Plain lawn or sky directly behind his feet.
     - Visible stretch (taller than the walk pose) with the feet hanging below the body.
     - The shadow clearly under him in screen space, with nothing at sole height that he could be standing on.
5. **Give the candy coral a material (structural, materials 6/10 everywhere).**
   - **Where:** `HERO_TUNING` in `src/game/Game.ts` (`roughMatte`, `heroRim`) and `GLAZEY_STUDIO_TUNING`, plus the per-voxel jitter on `glazeyBody` in `palette.ts`.
   - **Problem:**
     - The terminator is fixed, but the surface still reads as fuzzy felt. Blotchy per-voxel value noise is visible on studio stage 4 at 2x and on the play body.
     - At 1x I see no sheen and no warm rim in any play shot.
   - **Target:**
     - A soft broad specular sheen on the upper sun-side body.
     - A thin warm rim visible at 1x.
     - Value jitter within ±4 %, so he reads as soft candy vinyl, as in sheet 03.
6. **Clean up the pink canopy. Not addressed.**
   - **Where:** `src/art/models/sprinkleTree.ts` `res > 1` branch, plus tree placement in the play stage.
   - **Problem:**
     - The two-tone dither band is still at walk (300-720, 440-620). A 2x crop shows clear salt-and-pepper.
     - The lit side is luma 113 at (500,300). Iter 6 was 117, and the target is at least 130.
     - With the green tree it still walls off the upper-left 40 % of walk and touch.
   - **Target:**
     - A smooth shaded gradient.
     - Lit side at least 130.
     - No foreground tree over about 10 % of the frame.
7. **Make the milk read as milk. Not addressed since iter 3.**
   - **Where:** `src/engine/render/Water.ts`.
   - **Problem:** it still reads peach-pink satin: hue 14-29, sat 0.32-0.36 at walk (600-900, 640-660), with long pink and amber streaks.
   - **Target:**
     - Cream-white body (sat at or below 0.2).
     - Broad soft specular and a depth tint at the drip wall.
     - Pink only as soft reflections of the wall.
8. **Muddy arm tips (studio).**
   - **Where:** arm tip colour and AO in `glazey.ts` and the studio rig.
   - **Problem:** luma 91, sat 0.63 at (1225,750), and the left tip at (815,750) is luma 85. They read as dirty brown stubs.
   - **Target:** no arm tip below about luma 105 or more saturated than the body (about 0.55).
9. **Clean the play frame edges.**
   - **Where:** `m4Play.ts` stage and the walk path.
   - **Problem:**
     - In walk frame f2 a large chocolate-and-powder hill enters at the left edge at (0-330, 350-830) and is cut off by the frame.
     - The walk and touch stills have chocolate rocks cut at the left edge at about (0-200, 640-830).
   - **Target:** no large mass cut by the frame edge in the play shots. Either keep the whole form in frame or move it out entirely.
10. **Play clouds. Not addressed.**
    - **Where:** play-mode cloud scale and placement only. Do not change the M2 `buildCloud` output.
    - **Problem:** the clouds at walk (1000-1220, 130-210) and (1530-1800, 170-235) still read as flat slabs with a hard lilac underside band.
    - **Target:** rounder, vertically lobed puffs with a shaded underside that transitions through lighting, not a colour step.

## What is working (keep it)
- **Hero lighting.**
  - **Play:** the sun-to-core span is about 70 luma in walk and 45 in jump.
  - **Studio:** the body goes from about 164 to 113, and the belly from 210 to 131. He finally reads as a round lit object.
- **The belly swell in the body SDF.** It is the right structural approach. The side turntable frame shows a real cream bulge on the front profile, as on sheet 03 SIDE. Keep the geometry and fix the outline shape (fix 3).
- **The lighthouse.** The whole tower and glowing donut are in frame in all three play shots, with the warm glow in the hole reading well. This is a Follow item for references 01 and 02.
- **The studio.**
  - The rows now have clear backdrop between figures. The iter 6 tuft-on-feet overlap is gone.
  - The shadow side is cooler: hue -1 to 3, sat 0.45-0.50, against 0.52-0.58 lit.
  - The back view stays coral (RF-10).
- **The touch UI.** It still has the best Glazey in the build (the jump icon), and the candy buttons and donut joystick are well made. At 844x390 Glazey is about 90 px tall and his silhouette reads.
- **The play world.** Warm, fine grass with flower specks, the pier, the drip wall and sprinkle-scattered rims. Detail stays at 8.

## Store-page test: no
The touch-ui hero frame has better light than ever, and the lighthouse and ring now layer nicely behind him. But the subject is still mostly turned away. His face slides off the left edge of his head, and his belly reads as a cream slab held against his side. The upper-left 40 % is two dithered, dull canopies, and the lagoon looks like pink satin. It is a solid 7/10 indie frame. Next to sheet 03's Glazey or reference 02's warm, frontal hero, it does not hold up.

## Previous review (M4-iter6): status of the fix list
| # | item | status |
|---|---|---|
| 1 | Model the belly as a tummy (blocker) | **Partly fixed.** Met: a real SDF swell, convex shading of about 75 luma in the studio (target at least 25), directly under the smile, and cream colour (hue 39, sat 0.39). Not met: an upright oval with 30-40 % coverage (now a flat-topped slab, about 16 %), and centred in the 3/4 play view (it still runs into the near-left outline). The play belly is about 166-174 against adjacent lit coral of about 137, so +30-37. That is borderline but about met. |
| 2 | Jump reads as airborne | **Partly fixed.** There is a new stage and an offset soft shadow on the lawn, about 190 px below the soles. But the rim is still directly behind his feet and the feet are tucked. |
| 3 | Model Glazey with light | **Mostly fixed.** The span is about 70 luma in walk (target at least 50) and 45 in jump. The warm rim and spec sheen are still not visible at 1x. |
| 4 | Centre the face on the 3/4 form | **Not fixed.** The left eye is still on the outline in all three play shots. |
| 5 | Lighthouse donut in frame | **Fixed.** It is whole, and more than 40 px below the top edge in all play shots. |
| 6 | Pink canopy | **Not fixed.** The dither band is still there. The lit side went from 117 to 113 against a target of at least 130. The size is unchanged. |
| 7 | Milk reads as milk | **Not fixed.** |
| 8 | Studio cool core | **Mostly fixed.** The shadow hue is -1 to 3 with a sat delta of about 0.07. The arm tips are still muddy (luma 85-91, sat 0.63). |
| 9 | Play clouds | **Not fixed.** Not addressed. |
| 10 | Studio row spacing | **Fixed.** There is at least 20 px of clear backdrop between all figures. |

## Regression check
- **M3 (`shots/M3/final/gallery-glazey-belly`):**
  - **Belly:** no longer a regression in form. The shading span is about 75 (M3: about 40), and it sits under the smile like M3. The shape is worse than M3's rounded top arc (fix 3), but I do not count it as a net quality drop.
  - **Eyes: REGRESSION, blocker** (see Blockers). The M3 irises were glossy and clean. Iter 7's are matte with a dithered speckle band and a jagged rim.
  - The tuft, blush, mouth and coral back view are at or above M3.
- **M2 (`shots/M2/final`): no regression.**
  - The iter 6→7 diff touches only `glazey.ts`, `gallery.ts` (the Glazey gallery only), `m4Play.ts`, `FollowCamera.ts` and `HERO_TUNING` in `Game.ts`.
  - A grep shows that none of these is imported by the M2 diorama scenes.
  - The iter 6 re-shoot (`shots/M2/m4i6reg/`) matched the final, and nothing on the M2 path has changed since.
- **M0, M1 and other M3 content (donuts, props, low tier): no regression.** None of the changed files reaches their scenes.

```json
{"gate":"M4","iter":7,"verdict":"FAIL","mean":7.0,"min":6,"blockers":1,"store_page":false}
```
