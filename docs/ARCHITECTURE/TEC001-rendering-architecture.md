# TEC001 - Rendering & Chunking Architecture

**Summary:**
This spec describes the split between voxel data (bvx-kit `VoxelWorld`), the ECS Logic Layer (`ChunkSystem`), and the Reactive Renderer (`VoxelWorld` component).

**Key files:**
- `src/services/BvxEngine.ts` — Stateless Voxel Data Service (`setBlock`, `getBlock`, `generateChunkMesh`).
- `src/ecs/systems/ChunkSystem.ts` — System that watches dirty Chunk Entities and updates their geometry.
- `src/scenes/VoxelWorld.tsx` — Reactive R3F component that renders Chunk Entities.

**Architecture:**
1.  **Data Layer (`BvxEngine`)**:
    - Stores raw voxel data in `VoxelWorld` (4x4x4 chunks).
    - `setBlock`: Updates data, then finds/creates the **ECS Entity** for the corresponding 16x16x16 chunk and marks it `needsUpdate: true`.

2.  **Logic Layer (ECS)**:
    - **Chunk Entity**: Defined in `src/ecs/world.ts`. Has `position`, `chunkKey`, `needsUpdate`, and `geometry` components.
    - **ChunkSystem**: Iterates over dirty chunks, calls `BvxEngine.generateChunkMesh()`, and assigns the result to `entity.geometry`. Clears `needsUpdate`.

3.  **Presentation Layer (R3F)**:
    - `VoxelWorld`: Uses `useEntities` query to map Chunk Entities to `ChunkRenderer` components.
    - `ChunkRenderer`: Observes `entity.geometry` and updates the React `mesh`.

**Acceptance:**
- **Decoupled**: Engine does not hold `THREE.Mesh` references.
- **Reactive**: Rendering updates happen automatically when ECS state changes.
- **Performant**: Only dirty chunks are re-meshed. Uses `BufferGeometry` reuse where possible.