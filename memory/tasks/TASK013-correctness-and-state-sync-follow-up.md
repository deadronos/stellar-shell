# TASK013 — Correctness and State Sync Follow-up

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Linked Design:** None (follow-up correctness/performance pass)

## Original Request

Review the branch, then apply the suggested correctness and performance improvements.

## Scope

- Ensure `MovementSystem` sees the current energy snapshot after throttled systems mutate state.
- Provide a recovery path for Dyson counters so cached metrics can be rebuilt from the voxel world.
- Remove one more hot-path allocation in `MovementSystem`.
- Add regression coverage for the energy snapshot and counter resync behavior.
- Validate the result with the repository test and lint/typecheck/build pipeline.

## Planning Outcome

- Keep the movement fix surgical: re-read store state only after the throttled systems run.
- Add a world-scan helper in `BvxEngine` so cached Dyson counters can be rebuilt when needed.
- Reuse existing frame hot-path math helpers instead of allocating a cloned velocity vector.

## Implementation Plan (TDD)

### Red

1. Add a test proving `MovementSystem` receives the post-throttle energy snapshot.
2. Add a test proving Dyson counters can be rebuilt from actual voxel state.

### Green

1. Refresh the store before calling `MovementSystem`.
2. Add `BvxEngine.refreshDysonCountersFromWorld()` and use it during initialization/reset.
3. Replace the remaining `Vector3.clone()` in the movement hot path with `addScaledVector()`.

### Refactor

1. Keep the behavior unchanged outside the targeted fixes.
2. Run the targeted and full validation suites.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID | Description | Status | Updated | Notes |
| --- | --- | --- | --- | --- |
| 13.1 | Add energy-snapshot regression coverage | Complete | 2026-03-23 | Added a `SystemRunner` test that verifies `MovementSystem` sees energy after `EnergySystem` mutates it. |
| 13.2 | Re-sync cached Dyson counters | Complete | 2026-03-23 | Added `refreshDysonCountersFromWorld()` and used it to rebuild cached counts from the voxel world snapshot. |
| 13.3 | Remove movement hot-path allocation | Complete | 2026-03-23 | Replaced the per-drone velocity clone with `addScaledVector()`. |
| 13.4 | Run validation and sync memory | Complete | 2026-03-23 | `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all passed. |

## Progress Log

### 2026-03-23

- Added a `SystemRunner` regression test that proves `MovementSystem` receives the fresh energy snapshot after throttled systems run.
- Added `BvxEngine.refreshDysonCountersFromWorld()` and used it to rebuild cached Dyson counts from the voxel world snapshot.
- Removed the remaining `Vector3.clone()` allocation from `MovementSystem`'s frame hot path.
- Verified the repository with the full validation suite; all checks passed.

## Validation

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
