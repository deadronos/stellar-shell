# DES008 — Correctness and Meshing Alignment

**Status:** Implemented  
**Owner:** Codex  
**Created:** 2026-03-06

## Overview

This design repairs the chunk meshing pipeline after the architecture/gameplay alignment pass. The focus is correctness and contract alignment rather than new gameplay: stale worker results must not overwrite newer voxel edits, render-chunk geometries must be disposed correctly, the repo must return to a clean validation state, and documentation must describe the shipped meshing lifecycle accurately.

**GitHub issue:** [#44](https://github.com/deadronos/stellar-shell/issues/44)

## Problem Statement

The repo was structurally aligned around ECS-managed chunks and worker-based meshing, but three follow-up gaps remained:

- `ChunkSystem` could apply a worker result for an older chunk snapshot after newer voxel mutations had already dirtied that chunk again.
- `RenderChunk` leaked `THREE.BufferGeometry` instances across unmount/reset churn, and `CompletedSectionRenderer` cleanup comments overstated chunk immutability.
- `pnpm typecheck` failed because several tests no longer matched the current upgrade/type surface.

The implementation also carried architecture drift through two `VoxelMesher` modules with the same behavior but different import paths.

## Requirements (EARS)

- **WHEN** a chunk is dirtied while a mesh job for that chunk is already in flight, **THE SYSTEM SHALL** keep the newer dirty state and re-mesh the chunk after the in-flight job completes.  
  **Acceptance:** regression tests verify no overlapping job is dispatched for the same chunk and a fresh job is queued after the stale result returns.

- **WHEN** a worker returns mesh data for a chunk revision that is no longer current, **THE SYSTEM SHALL** discard that result instead of writing stale `meshData` back to ECS.  
  **Acceptance:** regression tests verify stale worker results do not overwrite the latest chunk state.

- **WHEN** a chunk renderer unmounts, **THE SYSTEM SHALL** dispose its owned `THREE.BufferGeometry`.  
  **Acceptance:** renderer tests verify disposal for both `RenderChunk` and `CompletedSectionRenderer`.

- **WHEN** repository validation is run, **THE SYSTEM SHALL** pass `pnpm test`, `pnpm build`, `pnpm typecheck`, and `pnpm lint`.  
  **Acceptance:** full validation recorded in the task log.

- **WHEN** meshing architecture is documented, **THE SYSTEM SHALL** describe the canonical mesher module, chunk revision lifecycle, and renderer cleanup behavior consistently across Memory Bank and architecture docs.  
  **Acceptance:** `docs/AGENTS/ARCHITECTURE.md`, `docs/ARCHITECTURE/TEC001-rendering-architecture.md`, and the linked task/design artifacts match the implementation.

## Proposed Architecture Changes

1. **Revision-safe chunk meshing**
   - Add monotonic `meshRevision` tracking per chunk entity.
   - Record `pendingMeshRevision` when dispatching a worker job.
   - Apply worker output only if the completed job revision still matches the chunk's latest revision.

2. **One in-flight job per chunk**
   - Preserve the existing worker-pool architecture.
   - Prevent `ChunkSystem` from dispatching a second job while `meshPending` is true for that chunk.
   - Reassert `needsUpdate` when a stale result is discarded so the newest revision is meshed on the next pass.

3. **Canonical mesher ownership**
   - Remove the duplicate service-layer `VoxelMesher`.
   - Use `src/mesher/VoxelMesher.ts` from both `BvxEngine` and worker code.

4. **Renderer lifecycle cleanup**
   - Separate geometry update effects from unmount disposal effects.
   - Keep shared material optimization for completed chunks, but explicitly document that classification does not make those chunks immutable.

## Test Strategy (TDD)

- **Red**
  - Add failing `ChunkSystem` regression coverage for stale result discard and dirty requeue during `meshPending`.
  - Add failing renderer cleanup coverage for `RenderChunk`.
  - Run `pnpm typecheck` and capture current spec typing failures.

- **Green**
  - Implement revision-safe dispatch/apply logic.
  - Add geometry disposal on unmount.
  - Standardize typed test upgrade fixtures and mock casts until `tsc --noEmit` passes.

- **Refactor**
  - Collapse mesher ownership to one module.
  - Remove stale comments/docs that imply completed chunks stop participating in the normal dirty/update lifecycle.

## Risks and Mitigations

- **Risk:** Requeue logic could accidentally allow duplicate jobs for the same chunk.  
  **Mitigation:** gate dispatch on `!meshPending` and cover that invariant with tests.

- **Risk:** Revising renderer cleanup could dispose geometry too early.  
  **Mitigation:** use separate effects for update and unmount cleanup.

- **Risk:** Test-only typing fixes could hide real runtime mismatches.  
  **Mitigation:** keep fixtures aligned to the real `UpgradeId` union rather than widening types with `any`.

## Out of Scope

- Gameplay balance changes.
- Worker-pool sizing changes or shared-memory optimizations.
- Major rendering pipeline redesign beyond the documented correctness/alignment repairs.

## Implementation Outcome (2026-03-06)

- Added chunk revision tracking and stale-result discard semantics to `ChunkSystem`.
- Ensured dirty chunks edited during `meshPending` are requeued after the stale job completes.
- Disposed active/completed chunk geometries on unmount using dedicated cleanup effects.
- Removed the duplicate service-layer `VoxelMesher` and kept `src/mesher/VoxelMesher.ts` as canonical.
- Restored `pnpm typecheck` by standardizing upgrade fixtures and tightening spec mocks.
