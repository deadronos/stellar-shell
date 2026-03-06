# TASK009 — Correctness and Meshing Alignment

**Status:** Completed  
**Added:** 2026-03-06  
**Updated:** 2026-03-06  
**Linked Design:** [DES008](../designs/DES008-correctness-and-meshing-alignment.md)
**GitHub Issue:** [#44](https://github.com/deadronos/stellar-shell/issues/44)

## Original Request

Implement the follow-up plan to fix chunk meshing correctness, restore clean validation, remove duplicated mesher ownership, and document the repaired architecture. Also record the work as a GitHub issue draft.

## Scope

- Add chunk revision tracking so stale worker results are never applied.
- Preserve one in-flight mesh job per chunk and requeue dirty chunks changed during `meshPending`.
- Dispose chunk geometries correctly on unmount.
- Fix failing `pnpm typecheck` issues in tests.
- Canonicalize `VoxelMesher` ownership to `src/mesher/VoxelMesher.ts`.
- Add/update architecture docs, Memory Bank artifacts, and a GitHub issue draft.

## Implementation Plan (TDD)

### Red

1. Add failing `ChunkSystem` tests for stale result discard and dirty requeue while a job is pending.
2. Add failing renderer cleanup tests for `RenderChunk` / completed chunk renderer disposal.
3. Run `pnpm typecheck` and capture current test fixture/mock typing failures.

### Green

1. Add `meshRevision` / `pendingMeshRevision` bookkeeping to chunk entities and `BvxEngine` dirtying.
2. Update `ChunkSystem` to drop stale results and requeue newer dirty revisions.
3. Fix renderer unmount cleanup with dedicated disposal effects.
4. Standardize typed test upgrade fixtures and repair spec mocks until `pnpm typecheck` passes.
5. Remove the duplicate service-layer mesher and point `BvxEngine` to the canonical mesher module.

### Refactor

1. Rewrite stale comments describing completed chunks as immutable.
2. Sync architecture docs and Memory Bank records to the shipped meshing lifecycle.
3. Record the implementation as a GitHub issue draft in `plans/`.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

|ID|Description|Status|Updated|Notes|
|---|---|---|---|---|
|9.1|Add RED tests for stale worker results and dirty requeue|Complete|2026-03-06|`tests/ecs/chunk-system.spec.ts` now covers stale-result discard and requeue without overlapping jobs.|
|9.2|Add RED renderer cleanup tests|Complete|2026-03-06|Added disposal coverage for `RenderChunk` and `CompletedSectionRenderer`.|
|9.3|Implement chunk revision-safe meshing|Complete|2026-03-06|`BvxEngine` dirtying now increments revisions and `ChunkSystem` only applies current results.|
|9.4|Repair validation drift|Complete|2026-03-06|Standardized upgrade fixtures, repaired mock typing, and restored `pnpm typecheck`.|
|9.5|Refactor docs and canonical mesher ownership|Complete|2026-03-06|Removed duplicate mesher path, updated architecture docs, and added issue draft.|

## Progress Log

### 2026-03-06

- Created `DES008` / `TASK009` as a correctness/alignment follow-up to the earlier architecture pass.
- **RED:** added regression tests for stale worker result discard, dirty requeue during `meshPending`, and renderer geometry disposal.
- **GREEN:**
  - added `meshRevision` and `pendingMeshRevision` tracking to chunk entities,
  - made `ChunkSystem` discard stale results and requeue dirty chunks after pending jobs finish,
  - separated geometry update and unmount cleanup effects,
  - fixed test typing drift and restored `pnpm typecheck`,
  - removed the duplicate service-layer `VoxelMesher`.
- **Refactor/docs:** updated architecture docs and recorded a GitHub issue draft for the follow-up.

## Validation

- `pnpm test`
- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
