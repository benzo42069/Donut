# Agentic Loop — Build → Shoot → Review → Fix

How the builder session (the main Claude Code context) works with the
**Graphics Reviewer** subagent (`.claude/agents/graphics-reviewer.md`). The
reviewer is deliberately picky. Its job is to refuse anything short of
store-page beautiful.

## 1. Roles

| Role | Who | Can | Cannot |
|---|---|---|---|
| **Builder** | the main session | write code and assets, run the harness, spawn reviewers, commit | edit the rubric, thresholds, art bible, shot list for a gate in progress, or reviewer definition; hand-pick or edit screenshots; argue a score down without evidence |
| **Graphics Reviewer** | subagent `graphics-reviewer`, fresh context every time | read docs, references and code; run `npm run shots`; view PNGs; write its report to `reviews/` | modify `src/`, assets or rules |
| **User** | you | change the art bible, approve a gate override, provide reference images | — |

The reviewer **captures the screenshots itself** from the committed code, so
the builder cannot cherry-pick frames.

## 2. The loop

```
for each milestone M with a gate:
  build deliverables for M
  run lint / tests / build                      → must be green before any review
  iter = 1
  loop:
    commit WIP ("M<n> gate iter <iter>")         → the reviewer judges committed code
    spawn graphics-reviewer (1, or 2 in parallel for ★ double gates) with:
        gate id, shot IDs, iteration number,
        path to the previous review (if any),
        paths: docs/ART_BIBLE.md, art/reference/*, docs/AGENTIC_LOOP.md §3–4
    reviewer: npm run shots -- --gate <id> --iter <iter>
              → views every PNG and the reference images
              → writes reviews/<gate>-iter<iter>[-r2].md (incl. JSON verdict)
    if every reviewer verdict == PASS:
        copy the shots to shots/<gate>/final/, update docs/PROGRESS.md, commit, push
        break
    builder reads the "Fix list" and fixes items in priority order (blockers first)
    plateau check (§5)
    iter += 1
    if iter > 8: escalate to the user (§6)
```

Spawning in Claude Code: `Agent(subagent_type: "graphics-reviewer", prompt: <the
template in §7>)`. For a double gate, send **two Agent calls in the same message**
so they run independently. Neither sees the other's report.

## 3. Rubric (scored 1–10 per category)

| # | Category | A "10" looks like |
|---|---|---|
| 1 | **Reference fidelity** | it could have been rendered from the same world as `art/reference/` images |
| 2 | **Composition and focal point** | a clear subject, a readable silhouette, a pleasing frame, the eye lands where it should |
| 3 | **Lighting** | warm key, cool fill, soft accurate shadows, depth and mood |
| 4 | **Ambient occlusion and contact** | every object sits *in* the world; crevices are rich and nothing floats |
| 5 | **Color and palette harmony** | palette-true, harmonious, appetizing, reads in grayscale |
| 6 | **Materials** | glossy frosting, matte dough, sparkly sprinkles, believable milk; you could tell them apart with eyes closed |
| 7 | **Voxel density and form** | micro-voxels, rounded organic forms, nothing that looks like Minecraft (art bible §3 density rule) |
| 8 | **Detail and set dressing** | rich but not noisy; rewards a close look |
| 9 | **Charm and appeal** | a 6-year-old would gasp; characters are cute and expressive |
| 10 | **Technical cleanliness** | no artifacts from the art bible §10 instant-fail list |
| 11 | **Motion and FX** (only for motion strips) | squash, stretch and particle arcs read as delightful |
| 12 | **Low-tier acceptability** (only for `*-low-tier` shots) | simplified but still charming; no broken effects |

## 4. Pass bar (the reviewer may not relax it)

A gate **passes only if all of these hold**:

1. **Zero blockers.** Any instant-fail item (art bible §10) in any shot is an automatic FAIL.
2. **Every category ≥ 8** in every shot it applies to.
3. **Mean across categories ≥ 9.0** for the gate (≥ 8.5 for `*-low-tier` shots).
4. **The store-page test.** The reviewer answers "yes" to: *would I put the
   hero shot of this gate on the front page of a premium kids' game store
   listing, next to the best indie games of the year?*
5. **No regressions.** If earlier gates have `final/` shots, any visible quality
   drop in shared content (the same assets or lighting) is a blocker.
6. For ★ double gates, **both** reviewers must pass independently.

A score of 10 is reserved for work that matches or beats the reference. The
reviewer is told that a 7 is already "good indie quality" and good is not
enough here.

## 5. Plateau rule (stops endless tweaking)

If the gate mean improves by **< 0.3 over 2 consecutive iterations**, the
builder must make a **structural change** rather than parameter tweaks. For
example: a new lighting model, a different AO technique, a re-authored asset,
a changed voxel scale, a new color grade, or recomposed set dressing. The
builder writes one paragraph in `docs/PROGRESS.md` saying what it is changing
and why before the next iteration.

## 6. Escalation

After **8 failed iterations** on one gate (or if a reviewer reports a
requirement that contradicts the art bible), the builder stops and asks the
user, showing:
* the best iteration's hero shot and score table,
* the top 3 unresolved findings,
* 2–3 options (e.g. "accept with follow-ups", "change art bible rule X",
  "provide a better reference image", "allocate a structural rewrite").

The builder never lowers the bar on its own.

## 7. Reviewer spawn prompt (template)

```
You are reviewing graphics gate <GATE_ID>, iteration <N>.
Shots to capture: <comma-separated shot IDs>.
Previous review: <path or "none">.
Previously passed gates for the regression check: <list of shots/*/final dirs or "none">.

1. Read docs/ART_BIBLE.md and docs/AGENTIC_LOOP.md §3–§4 in full.
2. View every image in art/reference/.
3. Run: npm run shots -- --gate <GATE_ID> --iter <N>
4. View every resulting PNG at full resolution. Zoom mentally into silhouettes,
   shadows and edges; look for every artifact.
5. Write your report to reviews/<GATE_ID>-iter<N><SUFFIX>.md using the format
   in your agent definition, then return the JSON verdict as your final message.
Be ruthless. You are the last line of defense for visual quality.
```

## 8. Report format (written by the reviewer)

````markdown
# Review <GATE_ID> iter <N>
## Verdict: PASS | FAIL
## Scores
| shot | 1 ref | 2 comp | 3 light | 4 AO | 5 color | 6 mat | 7 voxel | 8 detail | 9 charm | 10 tech | 11 fx | mean |
## Blockers
- [shot] what, where in frame, why it violates which rule
## Fix list (priority order; max 10; each concrete and testable)
1. **What:** … **Where:** file/system if known … **Target:** what "fixed" looks like
## What is working (keep it)
## Store-page test: yes/no, and why
## Regression check
```json
{"gate":"M2","iter":3,"verdict":"FAIL","mean":8.4,"min":6,"blockers":2,"store_page":false}
```
````

## 9. Other checks in the loop (cheap, run by the builder)

* **Perf probe:** `npm run perf -- --gate <id>` logs fps, draw calls, triangle
  count and memory. Log regressions in `docs/PROGRESS.md`. A drop below 30 fps
  on `low` blocks the gate even if the reviewer passes it.
* **Kid-sense check** (once per milestone): the builder rereads
  `docs/GAME_DESIGN.md` §2 and §11 and confirms in `docs/PROGRESS.md` that
  nothing added is scary, text-heavy or punishing.
