# DES013 — Decouple ECS Systems from Global Singletons

## Issue

- Issue #67: Decouple ECS systems from global singletons for testability and HMR safety

## Goal

Eliminate direct imports of global singletons (`BvxEngine.getInstance()`, `BlueprintManager.getInstance()`, `ParticleEvents`, `getMesherPool()`) from ECS systems and `PlayerSystem`. Instead, create a `RuntimeContext` value object that is owned by `SystemRunner` and passed into each system call. This makes systems pure with respect to their runtime dependencies, allows tests to construct isolated contexts, and prevents `BvxEngine.constructor` from rebuilding the world on every instantiation (HMR/dev reload safety).

## Context

Currently these systems hold module-level singleton references or call them inside hot loops:

- `BrainSystem` — `BvxEngine.getInstance()`, `BlueprintManager.getInstance()`
- `MiningSystem` — `BvxEngine.getInstance()`, `ParticleEvents`
- `ConstructionSystem` — `BvxEngine.getInstance()`, `BlueprintManager.getInstance()`, `ParticleEvents`
- `ChunkSystem` — `BvxEngine.getInstance()`, `getMesherPool()`
- `AutoBlueprintSystem` — `BvxEngine.getInstance()`, `BlueprintManager.getInstance()`
- `PlayerSystem` — `BvxEngine.getInstance()`, `BlueprintManager.getInstance()`

In addition, `BvxEngine.constructor` calls `generateAsteroid()` and `generateDysonBlueprintSkeleton()`, which makes it impossible to create a fresh engine without side effects and forces tests to mock `getInstance()` or perform defensive global teardown.

## Constraints

- Keep the public API of `BvxEngine`, `BlueprintManager`, and `MesherWorkerPool` usable for non-system consumers (e.g., direct test utilities, UI panels).
- Preserve existing behavior: world generation, prestige reset, particle emission, chunk meshing, and drone AI must continue to work unchanged.
- Maintain the Logic/Render split: renderers can receive the particle service from context, but they do not import system singletons directly.
- Validation must remain green: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

## Proposed Design

### 1. `RuntimeContext` value object

```ts
export interface RuntimeContext {
  engine: BvxEngine;
  blueprints: BlueprintManager;
  particles: ParticleEventsService;
  mesherPool: MesherWorkerPool;
}
```

A factory `createRuntimeContext()` creates fresh, isolated instances of each service. A helper `resetRuntimeContext(ctx)` performs a full prestige-style reset using the injected dependencies.

### 2. Service ownership

- `SystemRunner` creates the canonical `RuntimeContext` once via `useMemo`.
- `SystemRunner` exposes it to the React tree through a `RuntimeContext.Provider` so renderers (`ParticleSystemRenderer`) can subscribe to the same particle service.
- `SystemRunner` explicitly initializes the world: `engine.generateAsteroid(2, 0, 2, 20)` and `engine.generateDysonBlueprintSkeleton(blueprints)`.
- `SystemRunner` explicitly disposes the worker pool on unmount.

### 3. System signatures

Systems become functions that receive `runtime` as an argument:

- `BrainSystem({ runtime, clock })`
- `MiningSystem({ delta, elapsedTime, ..., runtime })`
- `ConstructionSystem({ elapsedTime, ..., runtime })`
- `ChunkSystem({ runtime })`
- `AutoBlueprintSystem({ runtime, delta, elapsedTime })`
- `PlayerSystem({ runtime, delta, elapsedTime })`

### 4. `BvxEngine` changes

- Constructor only creates an empty `VoxelWorld`, hydrates chunk-entity cache from ECS, and zeroes counters.
- `generateDysonBlueprintSkeleton` accepts a `BlueprintManager` instance.
- `resetWorld` accepts a `BlueprintManager` instance (to clear blueprints) and no longer calls `resetAutoBlueprintTraversal` directly.

### 5. Renderer changes

- `ParticleSystemRenderer` receives `particles: ParticleEventsService` via props from `Drones`, which reads it from `useRuntimeContext()`.
- `LaserRenderer` remains unchanged (it only queries ECS archetypes).

### 6. Test changes

- Tests import `createRuntimeContext` and create a fresh context per test.
- Remove `BlueprintManager.getInstance().resetForTests()`, `ECS.clear()` workarounds where the fresh context already provides isolation, and `vi.mock(...)` of singleton getters where possible.
- Keep `ECS.clear()` only where the test itself mutates ECS drone entities and needs a clean slate between cases.

## Acceptance Criteria

- [ ] No ECS system imports a global singleton directly.
- [ ] `SystemRunner` owns service lifetimes and passes them to systems via `RuntimeContext`.
- [ ] `BvxEngine.constructor` no longer auto-generates world content.
- [ ] Tests create isolated `RuntimeContext` instances and do not rely on global teardown for runtime services.
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` remain green.
- [ ] Memory Bank and architecture docs are updated.
