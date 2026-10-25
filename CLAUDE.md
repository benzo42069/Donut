# CLAUDE.md — Glazey's Donut Island

A voxel game for kids aged 6+ about munching magical donuts. Small, dense
voxels in a toy-diorama look, not Minecraft.

## Source of truth
- `docs/GAME_DESIGN.md`: what the game is
- `docs/ART_BIBLE.md`: how it must look (non-negotiable)
- `docs/PLAN.md`: stack, architecture, milestones
- `docs/AGENTIC_LOOP.md`: the graphics gate process
- `docs/PROGRESS.md`: current status (create it at M0, update it after every milestone)
- `art/reference/`: reference images the gates are judged against (see `NOTES.md` there)
- `docs/REFERENCE_FIXES.md`: fixes and ignores against the references, tagged by milestone
- `prompts/KICKOFF_PROMPT.md`: the per-thread prompt and the handoff procedure

## Rules
- Every visual milestone must pass the graphics gate (`graphics-reviewer` subagent).
  Never weaken the rubric, pass bar, art bible or reviewer to get a pass.
- All voxel colors come from `src/art/palette.ts`. No bitmap textures on voxels.
- Kid-safe: no death, no scary content, no text-required gameplay, no ads, IAP or network chat.
- `npm run lint && npm test && npm run build` must be clean before review or commit.
- Commit the review reports (`reviews/`) and the final gate shots (`shots/*/final/`).
  Iteration shots are git-ignored.
- **One milestone per thread.** When a milestone is done, write the handoff note in
  `docs/PROGRESS.md`, push, and start a new thread with the kickoff prompt
  (`prompts/KICKOFF_PROMPT.md`). Pause for the user after M2, after M10, and on any escalation.
