# TASK003 — Add optional asteroid orbital motion system

**Status:** Completed  
**Added:** 2026-02-26  
**Updated:** 2026-02-26  
**Linked Design:** [DES003](../designs/DES003-asteroid-orbit-motion.md)

## Original Request

Implement optional orbital motion for asteroid bodies around the star while keeping mining/build logic stable.

## Implementation Plan (TDD)

- **Red**: Add failing tests for deterministic orbit offset and orbit-enabled mining/build flows.
- **Green**: Implement minimal orbit helper/system and coordinate-space adjustments.
- **Refactor**: Add settings toggles/sliders for tuning and keep system wiring minimal.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                         | Status   | Updated    | Notes |
| --- | --------------------------------------------------- | -------- | ---------- | ----- |
| 3.1 | Add deterministic orbit helper + orbit ECS system   | Complete | 2026-02-26 | Added `AsteroidOrbit` + `AsteroidOrbitSystem`. |
| 3.2 | Keep mining/build/player interactions stable in orbit | Complete | 2026-02-26 | Applied consistent orbit offset in systems. |
| 3.3 | Add toggle/tuning controls and focused tests         | Complete | 2026-02-26 | Added settings controls and new tests. |

## Progress Log

### 2026-02-26

- Added optional deterministic orbit motion with store-configured enable/radius/speed/amplitude.
- Updated `SystemRunner` and core ECS systems to use elapsed-time orbit offsets.
- Added focused tests:
  - `tests/services/asteroid-orbit.spec.ts`
  - `tests/ecs/asteroid-orbit-system.spec.ts`
  - extended `tests/ecs/mining-system.spec.ts`
  - new `tests/ecs/construction-system.spec.ts`
- Validation passed with `pnpm run lint`, `pnpm run build`, `pnpm test`.
