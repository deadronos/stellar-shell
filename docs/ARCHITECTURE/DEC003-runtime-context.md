# DEC003 — Runtime Context for ECS Systems

## Status

Accepted

## Context

The ECS systems in `src/ecs/systems/` imported global singletons directly:

- `BvxEngine.getInstance()`
- `BlueprintManager.getInstance()`
- `ParticleEvents`
- `getMesherPool()`

This caused several problems:

1. **Test isolation** — tests had to mock singleton getters or perform defensive global teardown (`BlueprintManager.getInstance().resetForTests()`, `ECS.clear()`, `disposeMesherPool()`).
2. **HMR safety** — `BvxEngine.constructor` auto-generated the asteroid and Dyson blueprint skeleton, so hot reloads reconstructed the world inside the constructor.
3. **Hidden dependencies** — it was impossible to tell what a system needed without reading its imports.

## Decision

Introduce a `RuntimeContext` value object that bundles the services systems need:

```ts
export interface RuntimeContext {
  engine: BvxEngine;
  blueprints: BlueprintManager;
  particles: ParticleEventsService;
  mesherPool: MesherWorkerPool;
}
```

- `SystemRunner` creates the canonical `RuntimeContext` once and owns service lifetimes.
- Systems receive `runtime` as an explicit parameter and no longer import singletons.
- `BvxEngine.constructor` becomes side-effect free; world generation is explicit.
- A React context provider exposes the same `RuntimeContext` to renderers that need it (e.g., `ParticleSystemRenderer`).
- A factory `createRuntimeContext()` allows tests to construct isolated contexts.

## Consequences

### Positive

- Systems are easier to unit test: pass a mock/fake `RuntimeContext` instead of mocking modules.
- Service lifetimes are explicit and centralized in `SystemRunner`.
- `BvxEngine` can be constructed without rebuilding the world, improving HMR behavior.
- Dependencies are visible in function signatures.

### Negative / Trade-offs

- System signatures grow by one parameter.
- UI components that still need services (e.g., `HUD`) continue to use singletons; they are outside the `SystemRunner` lifetime boundary.
- The legacy singleton exports (`BvxEngine.getInstance`, `getMesherPool`, `ParticleEvents`) remain for non-system consumers.

## Related

- Issue #67
- `src/ecs/RuntimeContext.ts`
- `src/ecs/RuntimeContextProvider.tsx`
- `src/ecs/SystemRunner.tsx`
