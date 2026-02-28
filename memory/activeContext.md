# Active Context — stellar-shell

**Current focus:** Dyson progression telemetry in HUD is now implemented and prestige gating is tied to progression milestones.

**Recent changes:**

- Added `BvxEngine.computeDysonProgress()` to derive blueprint/frame/panel/shell counts and milestone readiness directly from world voxels.
- Wired `dysonProgress` into Zustand store and updated build/mining systems to refresh metrics after voxel mutations.
- Added HUD Dyson metrics row and gated System Jump visibility by both energy rate and Dyson prestige readiness milestone.

**Next steps:**

- Tune milestone thresholds from gameplay balance pass.
- Consider surfacing blueprint-frame count in dedicated progression panel if top-bar density becomes an issue.
- Begin new task for performance profiling or user telemetry (TBD).

**Notes:**

- Blueprint targets use existing `BLUEPRINT_FRAME` + `BlueprintManager` flow, so no new drone state paths were introduced.
- The pre-existing `any` lint warning in `tests/ecs/chunk-system.spec.ts` is unrelated and unchanged.
