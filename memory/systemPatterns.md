# System Patterns — stellar-shell

**Architecture overview:**

- Frontend: React + TypeScript (Vite) with React Three Fiber (R3F) for rendering, and Zustand for lightweight app state.
- Simulation: `BvxEngine` (singleton) serves as the **Data Layer** for voxel operations.
- ECS: `miniplex` is the **Core Logic Layer**. It manages all game entities:
    - **Dynamic Entities**: Drones, Player, Projectiles.
    - **World Entities**: **Chunks** are now entities (`isChunk`) managed by the ECS.
- Rendering: Reactive components (R3F) subscribe to ECS entities or Zustand state.

**Key patterns & conventions:**

- **ECS-Driven Chunks**: Chunks are represented as entities with `chunkPosition`, `needsUpdate`, and `geometry` components.
    - `ChunkSystem`: Watches for `needsUpdate: true`, calls `BvxEngine.generateChunkMesh`, and updates the `geometry`.
    - `VoxelWorld`: Renders chunk entities using `useEntities` hook.
- **Data/Logic Separation**:
    - `BvxEngine`: Handles raw block data (`setBlock`, `getBlock`) and mesh generation algorithms.
    - ECS: Handles lifecycle, updates, and interactions (e.g. mining triggers `setBlock` which updates ECS Entity).
- **Singleton access**: `BvxEngine.getInstance()` for data operations, `ECS` for entity operations.
- **Performance**:
    - Chunk meshes are generated only when dirty.
    - Geometry is cached in the ECS entity.
    - Use `instancedMesh` for standard blocks if possible (future optimization), currently using merged meshes.

**Files of interest:**

- `src/services/BvxEngine.ts` (Voxel Data & Mesh Gen Service)
- `src/ecs/systems/ChunkSystem.ts` (Mesh generation logic)
- `src/ecs/world.ts` (Entity definitions)
- `src/scenes/VoxelWorld.tsx` (Reactive rendering)

**Decision notes:**

- **Moves Chunks to ECS**: To align with R3F/Miniplex best practices and decouple rendering from the engine service.
- **Keep the data->render separation**: `BvxEngine` doesn't know about `THREE.Mesh`, only `BufferGeometry` data.
