# DES009 — Async Recovery and Seeded Determinism

**Status:** Implemented  
**Owner:** Codex  
**Created:** 2026-03-06

## Overview

This design closes three correctness gaps left after the meshing-alignment pass: worker failures must not wedge chunk meshing forever, auto-blueprint traversal must reset with a new world or re-enable edge, and `systemSeed` must fully determine asteroid topology rather than only derived parameters.

## Problem Statement

The current runtime is green under normal execution, but three contract violations remain:

- `MesherWorkerPool` logs worker errors without rejecting the associated mesh job, so `ChunkSystem` can leave a chunk stuck in `meshPending`.
- `AutoBlueprintSystem` keeps traversal state in module scope and only rewinds it in tests, so System Jump and toggle cycles inherit prior cursor history.
- `VoxelGenerator` derives radius/noise parameters from `seed`, but the simplex permutation is still created from an unseeded RNG, so the same `systemSeed` can produce different asteroid shapes across fresh app launches.

## Requirements (EARS)

- **WHEN** a worker fails while generating a mesh, **THE SYSTEM SHALL** reject that job, clear the chunk's pending state, and allow the chunk to retry on a later pass.  
  **Acceptance:** regression tests verify `generateMesh()` rejects, `ChunkSystem` restores `needsUpdate`, and a later retry succeeds.

- **WHEN** auto-blueprint mode is re-enabled or the world is reset, **THE SYSTEM SHALL** restart traversal from the beginning of the deterministic outward candidate list.  
  **Acceptance:** regression tests verify the first placement after reset/re-enable returns to the origin-first ordering.

- **WHEN** an asteroid is generated for a given `systemSeed`, **THE SYSTEM SHALL** produce the same voxel topology across repeated fresh runs.  
  **Acceptance:** regression tests compare full `setBlock` outputs for repeated runs with the same seed and confirm at least one differing seed produces a different result.

- **WHEN** repository validation is run, **THE SYSTEM SHALL** pass `pnpm test`, `pnpm build`, `pnpm typecheck`, and `pnpm lint`.  
  **Acceptance:** validation commands recorded in the task log.

- **WHEN** architecture docs describe meshing and generation behavior, **THE SYSTEM SHALL** reflect worker-recovery retries, auto-blueprint reset semantics, and fully seeded asteroid generation consistently across docs and Memory Bank artifacts.  
  **Acceptance:** `docs/AGENTS/ARCHITECTURE.md`, `docs/ARCHITECTURE/TEC001-rendering-architecture.md`, and linked task/design files match the implementation.

## Proposed Architecture Changes

1. **Recoverable worker-pool failures**
   - Track the active task per worker inside `MesherWorkerPool`.
   - Reject the in-flight job when a worker emits `error`.
   - Remove the failed worker, create a replacement worker, and continue draining queued jobs.
   - Treat worker failures as transient retryable errors at the `ChunkSystem` layer.

2. **Retry-safe chunk-system failure handling**
   - Catch `generateMesh()` rejection in `ChunkSystem`.
   - Clear `meshPending` / `pendingMeshRevision`.
   - Reassert `needsUpdate` without touching the last good `meshData`.

3. **Runtime-supported auto-blueprint reset**
   - Replace the test-only helper with a runtime reset helper.
   - Reset traversal state on `BvxEngine.resetWorld()`.
   - Detect the `false -> true` enable edge within `AutoBlueprintSystem` and rewind traversal there as well.

4. **Fully seeded procedural generation**
   - Build a deterministic RNG from `seed` within `VoxelGenerator`.
   - Pass that RNG to `createNoise3D()` for each asteroid generation call.
   - Reuse the seeded simplex instance for both shape and rare-noise sampling at different frequencies to preserve the current material policy.

## Test Strategy (TDD)

- **Red**
  - Add failing `AutoBlueprintSystem` tests for reset-on-enable and reset-on-world-reset behavior.
  - Add failing `MesherWorkerPool` tests for worker-error rejection and worker replacement.
  - Add failing `ChunkSystem` tests for pending-state recovery after rejected mesh jobs.
  - Add failing `VoxelGenerator` determinism tests that compare actual generated voxel outputs.

- **Green**
  - Implement worker failure rejection/replacement in the pool and retry behavior in `ChunkSystem`.
  - Implement runtime auto-blueprint reset semantics.
  - Seed the simplex generator from `systemSeed`.

- **Refactor**
  - Simplify helper naming so runtime reset helpers are shared by tests and production code.
  - Sync docs and Memory Bank artifacts to the corrected contracts.

## Risks and Mitigations

- **Risk:** Worker replacement could accidentally leak failed workers or double-dispatch queued jobs.  
  **Mitigation:** track one active task per worker and cover replacement/retry behavior with explicit worker-pool tests.

- **Risk:** Resetting auto-blueprint traversal on enable could change pacing expectations.  
  **Mitigation:** keep interval throttling unchanged and only rewind cursor/timer state.

- **Risk:** Full seeding changes current asteroid layouts for existing seeds.  
  **Mitigation:** accept forward-only determinism as the contract and document the behavior clearly.

## Out of Scope

- Gameplay balance tuning.
- Worker backoff, retry budgets, or worker-pool sizing changes.
- New UI or store-level controls.

## Implementation Outcome (2026-03-06)

- `MesherWorkerPool` now rejects failed jobs, replaces crashed workers, and keeps servicing queued work.
- `ChunkSystem` now treats mesh-job failures as retryable and does not leave chunks wedged in `meshPending`.
- Auto-blueprint traversal now resets on world reset and on re-enable.
- `systemSeed` now fully determines asteroid topology by seeding the simplex permutation, not just the derived parameters.
