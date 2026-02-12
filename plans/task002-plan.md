# Plan: TASK002 — Logic/Render Split Refactor

Refactor the codebase to integrate a worker pool for async mesh generation, completing the logic/render split.

**Phases 3**

1. **Phase 1: Add VoxelMesher Edge Case Tests**
   - **Objective:** Improve test coverage for the mesher with deterministic edge cases
   - **Files/Functions to Modify/Create:** `tests/mesher/voxel-mesher.spec.ts`
   - **Tests to Write:**
     - `should cull faces against solid neighbors`
     - `should expose faces against air`
     - `should handle single block in chunk correctly`
   - **Steps:**
     1. Add failing tests for face culling logic
     2. Verify tests fail (RED)
     3. If implementation already correct, mark GREEN

2. **Phase 2: Implement Worker Pool with Queue**
   - **Objective:** Create a worker pool that queues mesh generation requests
   - **Files/Functions to Modify/Create:**
     - `src/mesher/MesherWorkerPool.ts` (new)
     - `src/ecs/systems/ChunkSystem.ts` (modify)
   - **Tests to Write:**
     - `tests/mesher/worker-pool.spec.ts`
   - **Steps:**
     1. Create `MesherWorkerPool` class with N workers
     2. Implement job queue with backpressure
     3. Update ChunkSystem to dispatch jobs to pool instead of sync call

3. **Phase 3: Integrate Async Mesh Updates in ECS**
   - **Objective:** Handle worker responses and update ECS entities
   - **Files/Functions to Modify/Create:**
     - `src/ecs/systems/ChunkSystem.ts`
   - **Tests to Write:** None (integration tested manually)
   - **Steps:**
     1. Handle mesh responses in ChunkSystem
     2. Update entity meshData when worker returns
     3. Run tests and verify rendering works

**Open Questions**

1. How many workers in pool? (Default: navigator.hardwareConcurrency || 4)

**Acceptance Criteria (CI & Quality):**

- CI pipeline must pass for the changes in the phase.
- Linter/formatting checks must pass.
- Tests must pass locally and in CI.
- Coverage should meet the project default or an explicitly-specified threshold in the plan.

---

## Metadata

- **auto_commit**: true
- **branch**: task002
