# TEC001 - Rendering & Chunking Architecture

**Summary:**
This spec describes the split between voxel data (bvx-kit `VoxelWorld`), the ECS Logic Layer (`ChunkSystem`), and the Reactive Renderer (`VoxelWorld` scene component).

**Key files:**
- `src/services/BvxEngine.ts` — Voxel Data Service (`setBlock`, `getBlock`, `generateChunkMesh`).
- `src/mesher/VoxelMesher.ts` — Pure meshing algorithm (`VoxelMesher.generateChunkMesh`).
- `src/mesher/MesherWorkerPool.ts` — Worker pool that runs `VoxelMesher` off the main thread.
- `src/mesher/worker.ts` — Individual worker entry-point consumed by `MesherWorkerPool`.
- `src/mesher/MeshUpdater.ts` — Applies `meshData` to a `THREE.BufferGeometry` in-place.
- `src/ecs/systems/ChunkSystem.ts` — Dispatches mesh jobs and writes `meshData` back to entities.
- `src/scenes/VoxelWorld.tsx` — Reactive R3F scene component that renders Chunk Entities.
- `src/render/RenderChunk.tsx` — Renders active (frontier) chunk entities.
- `src/render/CompletedSectionRenderer.tsx` — Renders completed Dyson-section chunks with a shared material.

**Architecture:**
1.  **Data Layer (`BvxEngine`)**:
    - Stores raw voxel data in `bvxWorld` (4×4×4 bvx-kit chunks).
    - `setBlock`: Updates data, then finds/creates the **ECS Entity** for the corresponding 16×16×16 render chunk and marks it `needsUpdate: true`.

2.  **Logic Layer (ECS)**:
    - **Chunk Entity**: Defined in `src/ecs/world.ts`. Has `isChunk`, `chunkKey`, `chunkPosition`, `needsUpdate`, `meshPending`, `meshData`, and optionally `completedDysonSection` components.
    - **ChunkSystem** (`src/ecs/systems/ChunkSystem.ts`): Iterates over dirty chunks (`needsUpdate: true`), dispatches a mesh job to `MesherWorkerPool`, marks the entity `meshPending: true`. When the worker resolves, `meshData` is added to the entity and `meshPending` is cleared.

3.  **Presentation Layer (R3F)**:
    - `VoxelWorld` (`src/scenes/VoxelWorld.tsx`): Uses two `useEntities` queries — one for active chunks (without `completedDysonSection`) and one for completed Dyson sections — and maps each entity to its renderer.
    - `RenderChunk` (`src/render/RenderChunk.tsx`): Observes `entity.meshData` changes via `useEffect` and applies them to a stable `THREE.BufferGeometry` via `MeshUpdater.updateGeometry()`.
    - `CompletedSectionRenderer` (`src/render/CompletedSectionRenderer.tsx`): Same geometry update path, but shares a single module-level `THREE.MeshStandardMaterial` for reduced draw calls.

**Acceptance:**
- **Decoupled**: Engine does not hold `THREE.Mesh` references.
- **Reactive**: Rendering updates happen automatically when ECS `meshData` changes.
- **Performant**: Only dirty chunks are re-meshed. Meshing is off-thread via `MesherWorkerPool`. `BufferGeometry` instances are reused per chunk.