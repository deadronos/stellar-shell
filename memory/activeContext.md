# Active Context — stellar-shell

**Current focus:** TASK008 Phase 2 architecture/gameplay alignment pass is implemented and validated.

**Recent changes:**

- Added `BvxEngine.computeDysonProgress()` to derive blueprint/frame/panel/shell counts and milestone readiness directly from world voxels.
- Wired `dysonProgress` into Zustand store and updated build/mining systems to refresh metrics after voxel mutations.
- Added HUD Dyson metrics row and gated System Jump visibility by both energy rate and Dyson prestige readiness milestone.
- Added `ARCHITECTURE_ALIGNMENT.md` summarizing implementation-vs-design alignment and identified Phase 2 drift items.
- Completed `DES007` + `TASK008` implementation:
  - deterministic radius-aware auto-blueprint traversal,
  - runtime Auto-Replicator toggle semantics,
  - hitch-safe energy catch-up ticking,
  - rare-resource policy docs/test alignment.

**Next steps:**

- Tune pacing/balance after new deterministic auto-blueprint ordering in live playtesting.
- Optionally clean remaining non-blocking lint warnings in test files.
- Continue roadmap work (next feature/task TBD).

**Notes:**

- Blueprint targets use existing `BLUEPRINT_FRAME` + `BlueprintManager` flow, so no new drone state paths were introduced.
- The pre-existing `any` lint warning in `tests/ecs/chunk-system.spec.ts` is unrelated and unchanged.
