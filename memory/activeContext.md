# Active Context — stellar-shell

**Current focus:** Dyson skeleton bootstrapping — generate sphere blueprint targets around the central star and keep drone construction flow unchanged.

**Recent changes:**

- Added `BvxEngine.generateDysonBlueprintSkeleton()` with deterministic spherical node placement around `(0,0,0)`.
- Generate skeleton blueprints during engine startup and after system jump regeneration.
- Added test coverage for blueprint-node generation (`tests/bvx-engine.spec.ts`) and drone blueprint consumption (`tests/ecs/construction-system.spec.ts`).

**Next steps:**

- Add unlock/progression gating for auto-blueprint expansion.
- Tune blueprint density/radius after gameplay balance pass.
- Document auto-blueprint expansion mode requirements and start TDD process (TASK006).

**Notes:**

- Blueprint targets use existing `BLUEPRINT_FRAME` + `BlueprintManager` flow, so no new drone state paths were introduced.
- The pre-existing `any` lint warning in `tests/ecs/chunk-system.spec.ts` is unrelated and unchanged.
