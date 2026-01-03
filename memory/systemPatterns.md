# System Patterns — stellar-shell

**Architecture overview:**

- Frontend: React + TypeScript (Vite) with React Three Fiber (R3F) for rendering, and Zustand for lightweight app state.
- Simulation: `BvxEngine` (singleton) manages voxel data, chunking, and meshing responsibilities; keep simulation logic separated from React render components.
- ECS: `miniplex` is used for game entities (drones, player); systems run in `useFrame` loops to update simulation state.

**Key patterns & conventions:**

- Singleton engine: use `BvxEngine.getInstance()` for global operations.
- Chunking: use `CHUNK_SIZE` and world → chunk coordinate helpers to map voxel coordinates into meshable chunks; mark `chunk.dirty` when blocks change.
- Geometry updates: update `BufferAttribute`s in-place (use `useLayoutEffect`), avoid recreating mesh objects each frame.
- Performance: prefer instanced meshes for many similar objects (drones), avoid per-frame allocations in hot loops, and offload heavy computation where possible (workers/throttling).

**Files of interest:**

- `src/services/BvxEngine.ts` (engine & chunk management)
- `src/components/VoxelWorld.tsx`, `Drones.tsx` (rendering)
- `src/ecs/world.ts` (ECS world)
- `src/constants.ts` (materials, colors, CHUNK_SIZE)

**Decision notes:**

- Keep the data->render separation to enable headless simulation and easier unit testing of engine logic.
- When adding features that change world data, prefer engine APIs (`setBlock`, `getBlock`) that take care of marking affected chunks dirty and scheduling mesh updates.
