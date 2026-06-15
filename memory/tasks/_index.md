# Tasks Index — Memory Bank

## In Progress

- No in progress tasks at the moment.

## Pending

- No pending tasks at the moment.

## Completed

- [TASK001] Memory Bank + TDD & Vitest Setup - Completed 2026-01-03 - Memory Bank created and initial Vitest configuration and tests added.
- [TASK002] Logic/Render Split Refactor - Completed 2026-02-13 - Implemented worker pool for async mesh generation, separating rendering from computation.
- [TASK003] Optional Asteroid Orbit Motion - Completed 2026-02-26 - Added deterministic/toggleable orbit with mining/build compatibility tests.
- [TASK004] Megastructure Rendering Optimization - Completed 2026-02-27 - Completed Dyson sections use `CompletedSectionRenderer` (aggregate/instanced-friendly) while active frontier stays on `RenderChunk`.
- [TASK005] Dyson Blueprint Generation - Completed 2026-02-27 - Auto-generated spherical blueprint-frame nodes around (0,0,0) and validated drone consumption via existing construction flow.
- [TASK006] Auto-Blueprint Expansion Mode - Completed 2026-02-28 - Added optional auto‑blueprint mode with throttled deterministic placement and construction integration.
- [TASK007] Dyson Progress Metrics and Completion Tracking - Completed 2026-02-28 - Added world-derived Dyson metrics, HUD display, and prestige gating based on milestone readiness.
- [TASK008] Phase 2 Architecture Alignment Pass - Completed 2026-02-28 - Implemented deterministic outward auto-blueprint traversal, runtime Auto-Replicator toggle semantics, energy catch-up ticking, and rare-policy docs/test alignment.
- [TASK009] Correctness and Meshing Alignment - Completed 2026-03-06 - Added revision-safe chunk meshing, renderer geometry cleanup, typecheck fixes, canonical mesher ownership, and synced docs/spec artifacts.
- [TASK010] Async Recovery and Seeded Determinism - Completed 2026-03-06 - Added worker-failure retry recovery, auto-blueprint reset semantics, fully seeded asteroid topology, and synced validation/docs.
- [TASK011] Drone Role Allocation Model - Completed 2026-03-08 - Added HUD role targets, deterministic auto-fill allocation, persistent drone role assignment, and explorer-only research generation.
- [TASK012] System Runner and Movement Optimization - Completed 2026-03-22 - Preserved the 10Hz logic throttle without dropping remainder time and reduced `MovementSystem` allocation churn with scratch vectors.
- [TASK013] Correctness and State Sync Follow-up - Completed 2026-03-23 - Freshened the movement energy snapshot, added Dyson counter resync support, and removed the remaining movement hot-path clone allocation.
- [TASK014] Fix Deploy pnpm Setup - Completed 2026-03-23 - Removed the pnpm cache dependency from `actions/setup-node` and installed pnpm explicitly in CI/deploy workflows.
- [TASK015] Remove Duplicate pnpm Pin - Completed 2026-03-23 - Removed the explicit pnpm version from `pnpm/action-setup` so the workflows use `packageManager` as the single source of truth.
- [TASK016] GitHub Pages Base Path - Completed 2026-03-23 - Set Vite's production base to `/stellar-shell/` so GitHub Pages loads assets from the repository subpath.
- [TASK017] Fix Broken Performance Profiling Workflow - Completed 2026-06-15 - Removed `.github/workflows/profile.yml` because it used npm in a pnpm repo and referenced a missing script.
- [TASK018] Reconcile Dev Server Port Documentation - Completed 2026-06-15 - Updated `README.md` to reference `localhost:3000`, matching `vite.config.ts`.
- [TASK019] Implement Keyboard Tool Shortcuts - Completed 2026-06-15 - Wired `Digit1`/`Digit2` to Laser/Build tool selection in `PlayerController.tsx` with unit tests.
- [TASK020] Remove Unused `multithreading` Dependency - Completed 2026-06-15 - Removed `multithreading` from `package.json` and `pnpm-lock.yaml`.
- [TASK021] Add Favicon - Completed 2026-06-15 - Added an inline SVG favicon to `index.html` to stop `/favicon.ico` 404s.
- [TASK022] Reduce Per-Frame Object Allocations - Completed 2026-06-15 - Refactored six hot paths to use scratch vectors/colors or a precomputed RGB palette; issue #63.
- [TASK023] Decouple ECS Systems from Global Singletons - Completed 2026-06-15 - Introduced `RuntimeContext`, moved service lifetimes to `SystemRunner`, and migrated tests to isolated contexts; issue #67.
