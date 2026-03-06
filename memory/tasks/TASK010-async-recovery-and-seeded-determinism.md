# TASK010 — Async Recovery and Seeded Determinism

**Status:** Completed  
**Added:** 2026-03-06  
**Updated:** 2026-03-06  
**Linked Design:** [DES009](../designs/DES009-async-recovery-and-seeded-determinism.md)

## Original Request

Implement the follow-up plan to fix worker-failure recovery, auto-blueprint reset semantics, and fully seeded asteroid determinism while keeping the existing architecture intact.

## Scope

- Make worker-pool mesh failures reject and recover instead of hanging indefinitely.
- Make `ChunkSystem` retry chunks after transient mesh-job failures.
- Reset auto-blueprint traversal on System Jump and on runtime re-enable.
- Seed asteroid topology from `systemSeed` so repeated runs are reproducible.
- Add/update architecture docs and Memory Bank artifacts for the repaired contracts.

## Implementation Plan (TDD)

### Red

1. Add failing `AutoBlueprintSystem` tests for reset-on-enable and reset-on-world-reset behavior.
2. Add failing `MesherWorkerPool` tests for worker-error rejection and replacement.
3. Add failing `ChunkSystem` tests for pending-state recovery after rejected mesh jobs.
4. Add failing `VoxelGenerator` tests for same-seed reproducibility and different-seed divergence.

### Green

1. Implement worker failure rejection/replacement in `MesherWorkerPool`.
2. Update `ChunkSystem` to clear pending state and requeue on mesh-job rejection.
3. Replace the test-only auto-blueprint reset helper with a runtime reset helper and call it from world reset.
4. Seed the simplex generator from `systemSeed` in `VoxelGenerator`.

### Refactor

1. Rename reset helpers to reflect runtime use, not tests-only semantics.
2. Sync architecture docs and Memory Bank records to the corrected contracts.
3. Run full repository validation.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

|ID|Description|Status|Updated|Notes|
|---|---|---|---|---|
|10.1|Add RED tests for auto-blueprint reset semantics|Complete|2026-03-06|Added reset-on-re-enable and reset-on-world-reset coverage in `tests/ecs/auto-blueprint-system.spec.ts`.|
|10.2|Add RED tests for worker failure rejection/replacement|Complete|2026-03-06|`tests/mesher/mesher-worker-pool.spec.ts` now covers rejection and replacement-worker reuse.|
|10.3|Add RED test for chunk retry after rejected mesh job|Complete|2026-03-06|`tests/ecs/chunk-system.spec.ts` now verifies pending-state recovery and retry after rejection.|
|10.4|Add RED tests for seeded asteroid reproducibility|Complete|2026-03-06|`tests/services/voxel/voxel-generator.spec.ts` now compares full placement sets across fresh module loads.|
|10.5|Implement runtime fixes and sync docs|Complete|2026-03-06|Recovered worker failures, reset traversal semantics, seeded topology generation, and synced architecture docs.|

## Progress Log

### 2026-03-06

- Created `DES009` / `TASK010` for worker-recovery, auto-blueprint reset, and seeded-determinism correctness fixes.
- **RED:**
  - added auto-blueprint regression tests for reset on re-enable and System Jump/world reset,
  - added worker-pool tests for error rejection and replacement-worker recovery,
  - added `ChunkSystem` coverage for retry after rejected mesh jobs,
  - added seeded-topology tests that compare full generated voxel placements across fresh module loads.
- **GREEN:**
  - made `MesherWorkerPool` reject failed jobs, replace crashed workers, and continue draining queued work,
  - made `ChunkSystem` clear pending state and restore `needsUpdate` when meshing rejects,
  - replaced the test-only auto-blueprint reset helper with runtime reset semantics used by both tests and `BvxEngine.resetWorld()`,
  - seeded `VoxelGenerator` noise fields from `systemSeed` so topology is reproducible across fresh runs.
- **Refactor/docs:** updated architecture/docs/Memory Bank wording to describe retry-on-failure meshing, traversal reset behavior, and fully seeded topology generation.

## Validation

- `pnpm test`
- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
