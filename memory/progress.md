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
- Architecture alignment audit completed and documented in `ARCHITECTURE_ALIGNMENT.md`.
- TASK008 completed: deterministic radius-aware auto-blueprint traversal, runtime Auto-Replicator toggle, and energy catch-up ticking are now implemented and tested.
- Rare-resource policy is explicitly documented as noise-driven and backed by tests.

**What's left / planned work:**

- Gameplay balance tuning after deterministic auto-blueprint expansion changes.
- Optional cleanup of non-blocking test lint warnings.
- Continue next feature roadmap item (TBD).

**Known issues / TODOs:**

- Improve documentation for code contributors (design notes, examples).
- Pre-existing lint warnings remain in test files (`tests/components/settings-modal.spec.tsx`, `tests/ecs/chunk-system.spec.ts`) and are unrelated to gameplay logic.

**Last updated:** 2026-02-28
