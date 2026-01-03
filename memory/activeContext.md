# Active Context — stellar-shell

**Current focus:** Refactoring the project architecture to align with best practices, specifically moving Chunk Management to ECS and ensuring documentation is up-to-date.

**Recent changes:**

- **Refactored Voxel Engine:**
  - `BvxEngine` is now a stateless data service.
  - Chunk Management moved to Miniplex ECS (`isChunk` entities).
  - Rendering is reactive via `ChunkSystem` and `useEntities` hook in `VoxelWorld`.
- Updated unit tests (`tests/bvx-engine.spec.ts`) to support ECS integration.
- Documented ECS Refactor in `docs/ARCHITECTURE/DEC002-ecs-chunks.md`.

**Next steps:**

- Continue with feature development (Mining, Drones) on the new stable ECS architecture.
- Monitor performance of the new reactive rendering system.

**Notes:**

- The project now strictly follows the "Best Practices" guide for BVX-Kit + R3F + Miniplex.
- Ensure all new game logic interacts with Chunks via ECS Entities, not by directly manipulating the Engine's internal state unless necessary for raw data operations.
