# TASK008 — Phase 2 Architecture Alignment Pass

**Status:** Completed  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Linked Design:** [DES007](../designs/DES007-phase2-architecture-alignment-pass.md)

## Original Request

Create a Phase 2 pass to align implemented gameplay mechanics and formulas with architecture/gameplay intent documented in project design artifacts.

## Scope

- Deterministic radius-aware auto-blueprint expansion.
- Auto-Replicator ownership vs runtime toggle behavior.
- Rare-resource generation policy alignment (code + docs + tests).
- Energy tick catch-up for large frame deltas.
- Documentation normalization for reset/persist semantics.

## Implementation Plan (TDD)

### Red

1. Add failing tests for deterministic auto-blueprint ordering and occupied-cell skipping.
2. Add failing tests for Auto-Replicator runtime enable/disable behavior.
3. Add failing tests for multi-second energy catch-up ticking.
4. Add/adjust failing tests for selected rare-resource policy.

### Green

1. Implement deterministic radius-aware candidate traversal in `AutoBlueprintSystem`.
2. Add store flag + UI control for Auto-Replicator runtime toggle.
3. Update `EnergySystem` to process elapsed whole-second intervals robustly.
4. Implement rare-resource policy decision in `VoxelGenerator` and align associated logic.

### Refactor

1. Consolidate constants and naming.
2. Remove stale comments and clarify docs.
3. Keep logic/render separation intact.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

|ID|Description|Status|Updated|Notes|
|---|---|---|---|---|
|8.1|Add RED tests for blueprint ordering + skip semantics|Complete|2026-02-28|Added/validated failing tests in `auto-blueprint-system.spec.ts`.|
|8.2|Add RED tests for Auto-Replicator toggle behavior|Complete|2026-02-28|Added failing store/energy/settings tests for runtime toggle semantics.|
|8.3|Add RED tests for energy catch-up ticking|Complete|2026-02-28|Added failing catch-up tick test in `energy-system.spec.ts`.|
|8.4|Implement Green phase changes across systems/store/UI|Complete|2026-02-28|Implemented store flags/actions, settings control, energy gate, and deterministic auto-blueprint traversal.|
|8.5|Refactor + docs sync + full validation|Complete|2026-02-28|Updated docs + added rare-policy test; full lint/build/tests passing (warnings only).|

## Progress Log

### 2026-02-28

- Task created from architecture alignment audit.
- Linked to `DES007` design plan.
- Ready to begin RED phase in next implementation session.

### 2026-02-28 (implementation complete)

- **RED:** Added failing tests for deterministic outward auto-blueprint ordering/skip behavior, runtime Auto-Replicator toggling, and energy catch-up ticking.
- **GREEN:**
  - Reworked `AutoBlueprintSystem` to deterministic radius-aware candidate ordering.
  - Added `autoReplicatorEnabled` state and toggle actions in `useStore`.
  - Added `Auto-Replicator Runtime` settings control gated by upgrade ownership.
  - Updated `EnergySystem` to process catch-up whole-second ticks and require runtime auto-replicator enablement.
- **Policy alignment:** codified rare-resource policy as noise-driven via docs + deterministic test.
- **Validation:**
  - Targeted: `pnpm test tests/ecs/auto-blueprint-system.spec.ts tests/ecs/energy-system.spec.ts tests/state/store.spec.ts tests/components/settings-modal.spec.tsx tests/services/voxel/voxel-generator.spec.ts`
  - Full: `pnpm run lint && pnpm run build && pnpm test`
  - Result: all tests pass; lint has pre-existing test warnings only.
