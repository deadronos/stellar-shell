# Active Context — stellar-shell

**Current focus:** Refactoring the project architecture to split logic and rendering, specifically moving the Voxel Mesher to a pure module and offloading to a worker.

**Recent changes:**

- **Refactored Voxel Engine:**
  - `BvxEngine` is now a stateless data service.
  - Chunk Management moved to Miniplex ECS (`isChunk` entities).
  - Rendering is reactive via `ChunkSystem` and `useEntities` hook in `VoxelWorld`.
- **Started TASK002:** Logic/Render Split Refactor.
  - Created `memory/designs/DES002-logic-render-split.md`.
  - Created `memory/tasks/TASK002-logic-render-split.md`.

**Next steps:**

- Extract `VoxelMesher` to `src/mesher/`.
- Create a worker for meshing.
- Update rendering to use the worker.

**Notes:**

- The project now strictly follows the "Best Practices" guide for BVX-Kit + R3F + Miniplex.
- Ensure all new game logic interacts with Chunks via ECS Entities.
