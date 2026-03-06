# System Patterns — stellar-shell

**Architecture overview:**

- Frontend: React + TypeScript (Vite) with React Three Fiber (R3F) for rendering, and Zustand for lightweight app state.
- Simulation: `BvxEngine` (singleton) serves as the **Data Layer** for voxel operations.
- ECS: `miniplex` is the **Core Logic Layer**. It manages all game entities:
    - **Dynamic Entities**: Drones, Player, Projectiles.
    - **World Entities**: **Chunks** are now entities (`isChunk`) managed by the ECS.
- Rendering: Reactive components (R3F) subscribe to ECS entities or Zustand state.

**Key patterns & conventions:**

- **ECS-Driven Chunks**: Chunks are represented as entities with `chunkKey`, `chunkPosition`, `needsUpdate`, `meshPending`, `meshData`, and optionally `completedDysonSection` components.
    - `ChunkSystem`: Watches for `needsUpdate: true`, dispatches mesh jobs to `MesherWorkerPool` (marks `meshPending: true`), writes `meshData` back to the entity when the worker resolves, and re-marks the chunk dirty if the worker job fails so it can retry.
    - `VoxelWorld`: Renders chunk entities using `useEntities` hook. **Crucial:** Must query for `meshData` to trigger re-render when mesh is ready. Active chunks render via `RenderChunk`; completed Dyson sections render via `CompletedSectionRenderer`.
- **Auto-blueprint traversal reset**:
    - `AutoBlueprintSystem` keeps its cursor internal, but rewinds it on `false -> true` enable edges and on `BvxEngine.resetWorld()` so deterministic outward placement always restarts with a new system.
- **Data/Logic Separation**:
    - `BvxEngine`: Handles raw block data (`setBlock`, `getBlock`) and mesh generation algorithms.
    - ECS: Handles lifecycle, updates, and interactions (e.g. mining triggers `setBlock` which updates ECS Entity).
- **Singleton access**: `BvxEngine.getInstance()` for data operations, `ECS` for entity operations.
- **Performance**:
    - Chunk meshes are generated only when dirty (`needsUpdate: true`).
    - Meshing runs off the main thread via `MesherWorkerPool`; mesh data is transferred back as `meshData` on the entity.
    - `RenderChunk` and `CompletedSectionRenderer` reuse a stable `THREE.BufferGeometry` per chunk, updated via `MeshUpdater`.
- **Procedural determinism**:
    - `VoxelGenerator` derives asteroid parameters from `systemSeed` and seeds the simplex permutation from the same value, so repeated fresh runs of the same seed reproduce the same topology.

**Files of interest:**

- `src/services/BvxEngine.ts` (Voxel Data Service)
- `src/mesher/VoxelMesher.ts` (Mesh generation algorithm)
- `src/mesher/MesherWorkerPool.ts` (Off-thread meshing pool)
- `src/ecs/systems/ChunkSystem.ts` (Mesh dispatch & ECS integration)
- `src/ecs/world.ts` (Entity definitions)
- `src/scenes/VoxelWorld.tsx` (Reactive rendering scene)
- `src/render/RenderChunk.tsx` (Active chunk renderer)
- `src/render/CompletedSectionRenderer.tsx` (Completed Dyson section renderer)

**Decision notes:**

- **Moves Chunks to ECS**: To align with R3F/Miniplex best practices and decouple rendering from the engine service.
- **Keep the data->render separation**: `BvxEngine` doesn't know about `THREE.Mesh`; mesh geometry is managed in `RenderChunk` / `CompletedSectionRenderer` components.
- **Off-thread meshing**: Mesh generation runs in `MesherWorkerPool` workers; only `meshData` (plain typed arrays) crosses the thread boundary.
