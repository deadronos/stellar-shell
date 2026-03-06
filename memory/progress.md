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
- TASK009 completed: chunk meshing is now revision-safe, renderer geometries are disposed on unmount, duplicate mesher ownership was removed, and repository validation is green again.
- TASK010 completed: worker-failure recovery now requeues chunks instead of wedging them, auto-blueprint traversal resets on re-enable/System Jump, and `systemSeed` now fully determines asteroid topology.

**What's left / planned work:**

- Gameplay balance tuning after deterministic auto-blueprint expansion changes.
- Optional cleanup of any remaining non-blocking test-only lint warnings.
- Continue next feature roadmap item (TBD).

**Known issues / TODOs:**

- Improve documentation for code contributors (design notes, examples).
- Monitor the chunk meshing path during future rendering changes so revision bookkeeping remains aligned with ECS dirtying.
- Monitor the new worker-recovery path during future meshing changes so retry semantics remain aligned with ECS dirtying.

**Last updated:** 2026-03-06
