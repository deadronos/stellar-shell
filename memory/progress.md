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
- TASK022 completed: per-frame `THREE.Vector3` / `THREE.Color` allocations removed from `MiningSystem`, `ConstructionSystem`, `MovementSystem`, `Drones.tsx`, `LaserRenderer.tsx`, and `VoxelMesher`.
- TASK023 completed: ECS systems decoupled from global singletons via `RuntimeContext`; `SystemRunner` owns service lifetimes; `BvxEngine` construction is side-effect free.
- TASK008 completed: deterministic radius-aware auto-blueprint traversal, runtime Auto-Replicator toggle, and energy catch-up ticking are now implemented and tested.
- Rare-resource policy is explicitly documented as noise-driven and backed by tests.
- TASK009 completed: chunk meshing is now revision-safe, renderer geometries are disposed on unmount, duplicate mesher ownership was removed, and repository validation is green again.
- TASK010 completed: worker-failure recovery now requeues chunks instead of wedging them, auto-blueprint traversal resets on re-enable/System Jump, and `systemSeed` now fully determines asteroid topology.
- TASK011 completed: drones now use HUD-controlled miner / builder / explorer role targets with deterministic auto-fill allocation, and research generation comes only from explorer-role drones.
- Browser verification follow-up completed: HUD/role UI looked consistent in the live app, and a discovered `DroneDebugPanel` key warning was fixed via stable drone ids.
- TASK012 completed: `SystemRunner` keeps throttle remainder using integer-millisecond accumulation, `MovementSystem` reuses scratch vectors to reduce hot-path allocations, and a regression test now covers the short-frame throttle case.
- TASK013 completed: `SystemRunner` now re-reads store state before movement, `BvxEngine` can resync cached Dyson counters from the voxel world snapshot, and `MovementSystem` no longer clones velocity every frame.
- TASK014 completed: CI and deploy workflows now install pnpm explicitly with `pnpm/action-setup@v4`, avoiding the `setup-node` pnpm cache error on GitHub-hosted runners.
- TASK015 completed: CI and deploy workflows now rely on `packageManager` as the sole pnpm version pin, avoiding the `pnpm/action-setup` version mismatch error.
- TASK016 completed: Vite production builds now use `/stellar-shell/` as the base path so GitHub Pages assets load correctly from the repository subpath.
- Maintenance pass completed: direct dependencies were upgraded to latest available compatible versions, including `@astrumforge/bvx-kit`, React 19.2.4, Vite 8, Vitest 4.1, Tailwind 4.2, Three 0.183, and updated tooling packages.
- Full validation for the codebase remains green; the GitHub Pages base-path fix was validated with `pnpm build` and the generated `dist/index.html`.
- Maintenance bundle completed:
  - Removed broken Performance Profiling workflow.
  - Corrected README dev server port to `localhost:3000`.
  - Added `Digit1`/`Digit2` keyboard shortcuts for Laser/Build tools with unit-test coverage.
  - Removed unused `multithreading` dependency.
  - Added inline SVG favicon to stop `/favicon.ico` 404s.
  - Excluded `dist` from `tsconfig.json` so local builds do not break `pnpm typecheck`.

**What's left / planned work:**

- Gameplay balance tuning after deterministic auto-blueprint expansion changes.
- Optional cleanup of any remaining non-blocking test-only lint warnings.
- Continue next feature roadmap item (TBD).

**In progress:**

- No active tasks.

**Known issues / TODOs:**

- Improve documentation for code contributors (design notes, examples).
- Monitor the chunk meshing path during future rendering changes so revision bookkeeping remains aligned with ECS dirtying.
- Monitor the new worker-recovery path during future meshing changes so retry semantics remain aligned with ECS dirtying.
- Monitor how often players pin too many builders or explorers so future fallback-borrowing rules can be evaluated from playtesting rather than guesswork.
- No remaining blocking issues from the review pass.

**Last updated:** 2026-06-15



**Recent completion:**

- TASK023 merged via PR #69: decoupled ECS systems from global singletons, introduced `RuntimeContext`, and migrated tests to isolated contexts. Branch `refactor/decouple-ecs-singletons-67` deleted.
- TASK022 merged via PR #68: reduced per-frame allocations by introducing scratch vectors/colors and a precomputed RGB palette in the voxel mesher. Branch `perf/reduce-per-frame-allocations-63` deleted.
