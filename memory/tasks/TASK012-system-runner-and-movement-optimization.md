# TASK012 — System Runner and Movement Optimization

**Status:** Completed  
**Added:** 2026-03-22  
**Updated:** 2026-03-22  
**Linked Design:** None (maintenance/performance pass)

## Original Request

Review the branch, then apply the suggested correctness and performance improvements.

## Scope

- Preserve the 10Hz logic throttle without dropping remainder time between frames.
- Reduce hot-loop allocation churn in `MovementSystem`.
- Add regression coverage for the throttle behavior.
- Validate the result with the repository test and lint/typecheck/build pipeline.

## Planning Outcome

- Keep the change set small and surgical.
- Use integer milliseconds for the throttle accumulator to avoid floating-point drift.
- Reuse scratch vectors inside `MovementSystem` rather than allocating new `Vector3` instances in the frame hot path.

## Implementation Plan (TDD)

### Red

1. Add a regression test proving the throttle remainder survives consecutive short frames.

### Green

1. Update `SystemRunner` to keep leftover throttle time and store the accumulator in integer milliseconds.
2. Reuse scratch vectors in `MovementSystem` to lower per-frame allocation churn.

### Refactor

1. Keep the behavior unchanged outside the targeted performance improvements.
2. Run the targeted and full validation suites.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID | Description | Status | Updated | Notes |
| --- | --- | --- | --- | --- |
| 12.1 | Add throttle regression coverage | Complete | 2026-03-22 | Added a SystemRunner test that proves closely spaced frames still trigger the second throttled tick. |
| 12.2 | Preserve leftover throttle time | Complete | 2026-03-22 | Switched the accumulator to integer milliseconds to avoid floating-point drift. |
| 12.3 | Reduce movement-loop allocations | Complete | 2026-03-22 | Reused scratch `Vector3` instances for steering and separation math. |
| 12.4 | Run validation and sync memory | Complete | 2026-03-22 | `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test` all passed. |

## Progress Log

### 2026-03-22

- Added a regression test for the throttle remainder case in `tests/ecs/system-runner.spec.tsx`.
- Updated `SystemRunner` to accumulate throttle time in milliseconds and preserve leftover time after each 10Hz logic tick.
- Reworked `MovementSystem` to reuse scratch vectors and avoid repeated `Vector3` allocation in the hot path.
- Verified the repository with the full validation suite; all checks passed.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`