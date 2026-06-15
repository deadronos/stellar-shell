# TASK023 — Decouple ECS Systems from Global Singletons

**Design:** DES013  
**Issue:** #67  
**Status:** In Progress  
**Created:** 2026-06-15

## Goal

Refactor ECS systems (and `PlayerSystem`) to receive runtime services through a `RuntimeContext` object instead of importing global singletons. Move service lifetime ownership into `SystemRunner`, make `BvxEngine` construction side-effect-free, and update tests to use isolated contexts.

## Implementation Checklist

- [x] Create feature branch `refactor/decouple-ecs-singletons-67`.
- [x] Define `RuntimeContext` interface + factory in `src/ecs/RuntimeContext.ts`.
- [x] Create React context/provider/hook in `src/ecs/RuntimeContextProvider.tsx`.
- [x] Refactor `BvxEngine` constructor to avoid world generation; accept `BlueprintManager` in `generateDysonBlueprintSkeleton` and `resetWorld`.
- [x] Refactor `ParticleEvents` to export `ParticleEventsService` class; keep a legacy singleton fallback if needed.
- [x] Refactor `BrainSystem`, `MiningSystem`, `ConstructionSystem`, `ChunkSystem`, `AutoBlueprintSystem`, `PlayerSystem`, `TrailSystem` to receive `RuntimeContext`.
- [x] Refactor `SystemRunner` to create runtime, provide it via context, initialize world explicitly, and dispose pool on unmount.
- [x] Update `App.tsx` so `VoxelWorld`, `Drones`, and `PlayerController` are children of `SystemRunner`.
- [x] Update `Drones.tsx` / `ParticleSystemRenderer` to consume runtime context for particle service.
- [x] Update affected tests to use isolated `RuntimeContext` and remove global-singleton workarounds.
- [x] Add new test(s) verifying `createRuntimeContext` isolation.
- [x] Run validation: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- [x] Update Memory Bank and architecture docs if needed.
- [x] Open PR and link issue #67.

## Notes

- Keep the public surface of services intact where possible to minimize churn outside the listed systems.
- The existing `getInstance()` / `getMesherPool()` helpers can remain for non-system consumers, but systems must not call them.
- Prestige reset flow should still clear blueprints and auto-blueprint traversal; do this through `resetRuntimeContext` or explicit SystemRunner orchestration.

## Log

### 2026-06-15 — Analyze & Design
Created DES013 and this task. Identified six systems importing global singletons.

### 2026-06-15 — Implement & Validate
- Created `RuntimeContext` value object and React provider/hook.
- Removed side effects from `BvxEngine.constructor`; moved world generation to `SystemRunner`.
- Refactored `BrainSystem`, `MiningSystem`, `ConstructionSystem`, `ChunkSystem`, `AutoBlueprintSystem`, `PlayerSystem`, and `TrailSystem` to receive runtime services.
- Updated `App.tsx` so `SystemRunner` wraps the game-world children and provides runtime context.
- Migrated tests to `createRuntimeContext({ mesherWorkerCount: 0 })` and removed singleton mocks/teardown where possible.
- Added `tests/ecs/runtime-context.spec.ts` for isolation.
- Full validation green: 175 tests, lint, typecheck, and production build.

### 2026-06-15 — Open PR
- Opened PR #69 linking issue #67.

### Next
Await review/merge.
