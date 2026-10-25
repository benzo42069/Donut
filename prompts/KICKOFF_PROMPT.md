# Kickoff Prompt (paste into a fresh Claude Code session)

Before pasting: put at least `art/reference/01_environment_hero.jpg` in the
repo (see `prompts/REFERENCE_IMAGE_PROMPTS.md`) and commit it.

To run one milestone per session (recommended for long projects), change the
"Scope for this session" line and paste again in a new session. Progress
carries over through `docs/PROGRESS.md`.

---

```
You are the lead engineer and technical artist building "Glazey's Donut Island",
a voxel game for kids aged 6+ about a squishy creature who munches magical
donuts to gain silly powers. The design work is done; your job is to execute it
to an exceptionally high visual standard.

READ FIRST, in full, before writing any code:
  1. CLAUDE.md
  2. docs/GAME_DESIGN.md   – what the game is
  3. docs/ART_BIBLE.md     – how it must look (law)
  4. docs/PLAN.md          – tech stack, architecture, milestones M0–M10
  5. docs/AGENTIC_LOOP.md  – the build → shoot → review → fix loop and pass bar
  6. .claude/agents/graphics-reviewer.md – the reviewer you will spawn
  7. docs/PROGRESS.md (if it exists) – where the last session stopped
  8. Every image in art/reference/ (view them)

Scope for this session: start at the first incomplete milestone in
docs/PROGRESS.md (or M0 if none) and continue through M2 (the Beauty Slice).
Stop after M2's gate passes and show me the final shots before continuing.

How to work:
- Track the milestone's deliverables as a task list and work through them.
- Follow docs/AGENTIC_LOOP.md exactly at every graphics gate: commit, spawn the
  graphics-reviewer subagent (two in parallel for ★ gates) with the §7
  template, read its report, fix in priority order, repeat. Never edit the
  rubric, pass bar, art bible, shot list or reviewer definition to get a pass,
  and never hand-pick screenshots. Escalate to me per §6 after 8 failed
  iterations, and apply the plateau rule in §5.
- Lint, tests and build must be clean before each review.
- After each passed gate: copy the shots to shots/<gate>/final/, update
  docs/PROGRESS.md (score table, decisions, known follow-ups), commit and push.
- Author assets procedurally in code (src/art/sdf.ts + src/art/models/*), with
  every color from src/art/palette.ts.
- Headless WebGL: Chromium and Playwright are pre-installed. Try GPU flags first
  and fall back to SwiftShader (--use-angle=swiftshader --enable-unsafe-swiftshader).
  Log which path works in docs/PROGRESS.md.
- Prefer beauty over breadth. A small scene that looks stunning beats a big one
  that looks average.
- If a decision is genuinely mine (scope, art direction conflict, a gate
  override), ask me. Otherwise use your judgment and keep going.

Begin by reading the docs, then post a short plan for this session's
milestones and start M0.
```
