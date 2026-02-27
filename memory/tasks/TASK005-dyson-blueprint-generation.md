# TASK005 — Generate Dyson sphere blueprints around central star

**Status:** Completed  
**Added:** 2026-02-27  
**Updated:** 2026-02-27

## Original Request

Implement blueprint generation around `(0,0,0)` for Dyson skeleton construction, aligned with `docs/gameplay_design.md`.

## Acceptance Criteria

- [x] Sphere blueprint nodes are generated around star origin.
- [x] Nodes appear as ghost/buildable targets.
- [x] Drones can consume those targets using existing construction flow.

## Implementation Plan

### Red
- Added failing test in `tests/bvx-engine.spec.ts` asserting generated blueprint nodes exist around origin and are `BLUEPRINT_FRAME` blocks.
- Added construction-flow test in `tests/ecs/construction-system.spec.ts` asserting blueprint targets are consumed into `FRAME`.

### Green
1. Added `BvxEngine.generateDysonBlueprintSkeleton()` using deterministic spherical node placement.
2. Called generation during engine startup and after prestige/system jump regeneration in `HUD`.
3. Kept `BrainSystem` and `ConstructionSystem` behavior unchanged by feeding the same `BlueprintManager` + voxel block types they already consume.

### Refactor
- Minor naming cleanup for spherical sampling variables.

## Progress Log

### 2026-02-27
- Baseline checks run (lint/build/tests) before modifications.
- Targeted tests executed in RED then GREEN cycle.
- Final lint/build/full test run completed successfully (one unrelated pre-existing lint warning remains in `tests/ecs/chunk-system.spec.ts`).
