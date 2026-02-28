# Progress — stellar-shell

**What works:**

- Basic voxel world rendering using React Three Fiber.
- `BvxEngine` provides core voxel storage and chunking behavior.
- Simple drone entities and player controller exist in `src/components`.
- Basic tests for `BvxEngine` and ECS Integration (`pnpm test`).
- Optional deterministic asteroid orbital motion with runtime tuning/toggle in settings.
- Mining/build/player interaction logic remains functional with moving asteroid render positions.
- Dyson progression metrics (frames/panels/shells/milestones) are computed from world state and shown in HUD.
- Prestige jump visibility now requires both energy threshold and Dyson milestone readiness.

**What's left / planned work:**

- Flesh out Memory Bank with requirements, tasks, and designs (this task).
- Auto‑blueprint expansion mode implemented and tested; integrates with construction flow.
- Add deterministic unit tests for engine logic and meshing.
- Consider adding background worker for heavy meshing or batch updates.
- Tune orbit defaults from playtesting data (performance and feel).

**Known issues / TODOs:**

- Improve documentation for code contributors (design notes, examples).

**Last updated:** 2026-02-28
