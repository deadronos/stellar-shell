# TASK002 — Logic/Render Split Refactor

**Status:** In Progress
**Owner:** Jules
**Created:** 2024-10-18
**Linked Design:** [DES002](memory/designs/DES002-logic-render-split.md)

## Objective

Split game logic and rendering into clear submodules, starting with the Voxel Mesher.

## Current State Analysis (Feb 2026)

### Already Done
- ✅ VoxelMesher extracted to `src/mesher/VoxelMesher.ts` (pure static methods)
- ✅ Worker file exists at `src/mesher/worker.ts` (but NOT integrated)
- ✅ RenderChunk component exists at `src/render/RenderChunk.tsx`
- ✅ MeshUpdater utility exists at `src/mesher/MeshUpdater.ts`

### What's Broken / Missing
- ❌ Worker is NOT being used - ChunkSystem calls `BvxEngine.generateChunkMesh` synchronously
- ❌ No communication between ChunkSystem and the worker
- ❌ No tests for VoxelMesher pure functions

## Sub-Tasks

- [ ] **1. Write tests for VoxelMesher** (TDD - RED phase first)
- [ ] **2. Integrate worker into ChunkSystem** (async mesh generation)
- [ ] **3. Handle worker responses in ECS** (update entity when mesh is ready)
- [ ] **4. Update progress documentation**

## Progress Log

- **2024-10-18**: Created task and design docs.
- **2026-02-13**: Analyzed current state - mesher exists but worker not integrated
