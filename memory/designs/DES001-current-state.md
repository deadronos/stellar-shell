# DES001 — Current Implementation & Architecture (snapshot)

**Created:** 2026-01-03  
**Author:** automation (GitHub Copilot)

## Summary
This design captures the current implementation, file responsibilities, runtime behavior, public APIs, and known limitations for `stellar-shell` (React + R3F voxel demo). It's intended as a reference for contributors and to help plan follow-up work (tests, performance improvements, background meshing).

## High-level architecture

- Rendering: React + React Three Fiber (R3F). `src/components` contains visual components (`VoxelWorld`, `Drones`, `HUD`, `PlayerController`, `Sun`).
- Simulation / Engine: `src/services/BvxEngine.ts` - singleton `BvxEngine.getInstance()` manages voxel storage via `@astrumforge/bvx-kit` (4x4x4 chunks) and `RenderChunk` wrappers for renderer-facing 16x16x16 chunks.
- ECS: `miniplex` world in `src/ecs/world.ts` stores entities (drones) and components used by systems inside `Drones.tsx`.
- Shared constants: `src/constants.ts` defines `CHUNK_SIZE=16`, `BLOCK_COLORS`, `IS_TRANSPARENT`, and common `MATERIALS`.

## Key source files and responsibilities

- `src/services/BvxEngine.ts`
  - Holds `bvxWorld` (voxel storage), and `chunks` (Map of RenderChunk wrappers), procedural generation (`generateAsteroid()`), block API (`setBlock`, `getBlock`), meshing (`generateChunkMesh`), and simple queries (`findBlueprints`, `findMiningTargets`).
  - Uses face-culling based on `IS_TRANSPARENT` to only generate visible faces.
  - Marks `RenderChunk.dirty` when `setBlock` is called and attempts to mark neighbors when changes occur on chunk boundaries.

- `src/components/VoxelWorld.tsx`
  - Renders `ChunkRenderer` components for each `RenderChunk` in `engine.chunks`.
  - `ChunkRenderer` polls (via `useFrame`) for `chunk.dirty` periodically (~every 0.5s) and calls `engine.generateChunkMesh(chunk)` to update `BufferAttributes` in-place.

- `src/components/Drones.tsx`
  - Contains drone AI systems (decision-making, steering, arrival actions) implemented in `useFrame`.
  - Uses `miniplex` queries to find drones and their components; uses instanced meshes for rendering and reuses temporary objects to minimize allocations.

- `src/ecs/world.ts`
  - Defines `Entity` type shape and exports typed `ECS` world.

- `src/constants.ts`
  - Centralizes block colors, transparency flags, and materials.

## Runtime behavior & data flow

1. Initialization: `BvxEngine` runs `generateAsteroid()` to populate voxels. `RenderChunk` entries are created when `setBlock()` touches the corresponding render chunk or during mesh generation.
2. When `setBlock(x,y,z,type)` is called:
   - Compute bvx chunk (4x4x4) and set metadata and voxel bit.
   - Map world coords to render chunk (16x16x16) and set `RenderChunk.dirty = true`.
   - If voxel is on render-chunk boundary, call `ensureDirty` on neighboring render chunks.
3. Renderer: `ChunkRenderer` checks `chunk.dirty` periodically and, if dirty, calls `generateChunkMesh(chunk)` then updates geometry attributes and clears `chunk.dirty`.
4. Drones: `Drones.tsx` contains a combined set of systems:
   - Brain system: chooses build/mine targets using `engine.findBlueprints()` and `engine.findMiningTargets()` (cached per frame), reserves target blocks, and assigns `target` components.
   - Movement & interaction: moves drones toward targets, performs actions on arrival (e.g., `ENGINE.setBlock()` for mining/building), and updates ECS state.
   - Render & particle systems: apply instanced mesh updates and particle matrices.

## Public APIs (current)

- BvxEngine.getInstance(): BvxEngine
- BvxEngine.setBlock(wx:number, wy:number, wz:number, type:BlockType): void
- BvxEngine.getBlock(wx:number, wy:number, wz:number): BlockType
- BvxEngine.generateChunkMesh(chunk:RenderChunk): { positions: Float32Array, normals: Float32Array, colors: Float32Array, indices: number[] }
- BvxEngine.findBlueprints(): {x,y,z}[]
- BvxEngine.findMiningTargets(limit?:number): {x,y,z}[]
- BvxEngine.worldToChunk(x,y,z) => {cx,cy,cz,lx,ly,lz}

## Important constants

- CHUNK_SIZE = 16 (render chunk)
- bvx-kit internal chunk size = 4 (VoxelChunk8)
- IS_TRANSPARENT controls face culling and occlusion rules

## Known limitations & technical debt

- Neighbor dirty marking is present but has a commented note: "... simplified: omit for now ..." — ensure correctness at chunk boundaries and when chunks do not yet exist.
- Meshing and `generateChunkMesh()` run on the main thread and may be expensive for large chunks or many dirty chunks. Consider worker-based meshing or frame-sliced meshing.
- `RenderChunk` lifecycle: chunks are created on demand by `setBlock` but there's no eviction strategy for remote/unused chunks.
- `ChunkRenderer` polls `chunk.dirty` via a time modulus check (every 0.5s); this is simple but could cause delayed updates or uneven updates depending on the frame time.
- `bvxWorld` uses MortonKey/VoxelChunk8 and currently may allocate chunks eagerly during generation — ensure tests avoid creating huge worlds.
- Tests: repository currently lacks unit tests and a `test` script; CI does not run tests yet.

## Acceptance criteria (derived from requirements)

- Unit tests for `setBlock/getBlock` and neighbor dirty propagation pass.
- Deterministic small-chunk meshing unit test passes (face counts and color array shapes).
- Integration test for small asteroid generation and `findMiningTargets()` returns non-empty list for surface blocks.

## Suggested next work items

- Add `vitest` and `npm test` script and add minimal unit tests (TASK002).
- Add a worker or frame-sliced meshing approach to avoid main-thread stalls during large updates.
- Harden neighbor dirty marking with tests that show cross-chunk face correctness.
- Add chunk lifecycle management (eviction or reference-counting for RenderChunks).
- Add more documentation and small diagrams (update this DES file if architecture changes).

## Memory Bank & TDD Integration

This DES001 should also document how we use the Memory Bank and TDD workflow for design and implementation.

- Use the Memory Bank for tracing work: place short designs in `/memory/designs/` and tasks in `/memory/tasks/` (see `memory/tasks/_index.md` for indexing).
- Naming convention for designs: use `DES###-short-name.md` (sequential numeric IDs). Avoid `DESIGN###` variants to keep a consistent prefix.
- Before creating a new `DES###` or `TASK###` file, check both the active folder and the `COMPLETED` folder to avoid number collisions (e.g., `/memory/designs/COMPLETED`).
- TDD process:
  1. RED — add a failing test and document the test intent in the task file (record test name and failing assertion).
  2. GREEN — implement the minimal change to make the test pass and link to the exact commit.
  3. REFACTOR — improve the implementation, add tests, and record decision notes in the task and design files.
- When using agents, prefer running the TDD agents as subagents (`TDD Red`, `TDD Green`, `TDD Refactor`) and record their outputs in the task's progress log.

**Decision:** Consolidated TDD/Mem-Bank guidance into DES001; the previous `DESIGN001` file will be removed to avoid duplication.

## Files referenced (snapshot)

- `src/services/BvxEngine.ts` (engine & meshing)
- `src/components/VoxelWorld.tsx` (ChunkRenderer and mesh updates)
- `src/components/Drones.tsx` (ECS systems & AI)
- `src/ecs/world.ts` (entity definitions)
- `src/constants.ts` (CHUNK_SIZE, IS_TRANSPARENT, materials)
- `package.json`, `vite.config.ts` (build/run)

## Validation & tests (how to validate this design)

- Create unit tests for `setBlock/getBlock` with a small coordinate range and assert dirty flags and `getBlock` values.
- Create a small deterministic chunk and assert `generateChunkMesh()` produces expected face counts and vertex counts.
- Run a short integration test: generate asteroid radius 3 and assert `findMiningTargets()` returns > 0.


**Decision notes:** This DES001 is a living snapshot; update it as code or architecture changes. When implementing changes, reference DES001 and add a new DESxxx when design shape changes significantly.
