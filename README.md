# Glazey's Donut Island 🍩

A silly, beautiful voxel game for kids aged 6+. Munch magical donuts, gain
goofy powers, burp rainbows, and help the island celebrate Dunk Day.

**Status:** M0 (scaffold + screenshot harness) done. Implementation runs one milestone per thread (see `docs/PROGRESS.md`).

| Doc | Purpose |
|---|---|
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | concept, core loop, powers, world, friends, mini-games |
| [docs/ART_BIBLE.md](docs/ART_BIBLE.md) | visual rules ("toy-box diorama voxels") |
| [docs/PLAN.md](docs/PLAN.md) | tech stack, architecture, milestones M0–M10 |
| [docs/AGENTIC_LOOP.md](docs/AGENTIC_LOOP.md) | build → shoot → review → fix loop with the graphics gate |
| [.claude/agents/graphics-reviewer.md](.claude/agents/graphics-reviewer.md) | the art-director subagent |
| [prompts/REFERENCE_IMAGE_PROMPTS.md](prompts/REFERENCE_IMAGE_PROMPTS.md) | image-generator prompts for the references |
| [prompts/KICKOFF_PROMPT.md](prompts/KICKOFF_PROMPT.md) | per-milestone thread prompt with automatic handoff |
| [docs/REFERENCE_FIXES.md](docs/REFERENCE_FIXES.md) | fixes and ignores against the reference images, by milestone |

## Getting started
Reference images are in `art/reference/`. To start or resume, paste the kickoff prompt into a new Claude Code thread. Each thread hands off to the next on its own.

## Commands
```
npm install
npm run dev                         # http://localhost:5173 (?shot=<id>, ?quality=low|medium|high)
npm run lint && npm test && npm run build
npm run shots -- --gate M0 --iter 1 # → shots/M0/1/*.png
npm run perf -- --gate M0
```
