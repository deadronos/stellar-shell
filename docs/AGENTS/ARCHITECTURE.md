# Architecture Principles

## Logic vs. Render Separation

- **Logic**: `BvxEngine.ts` and ECS systems handle all voxel data and game state.
- **Renderer**: React components (`VoxelWorld.tsx`, `RenderChunk.tsx`) wrap logic and handle R3F/Three.js updates.
- **Avoid**: Never inline large voxel loops in React render bodies.

## Core Components

- **BvxEngine**: The canonical singleton (`BvxEngine.getInstance()`) for voxel metadata and world state.
- **ECS (Miniplex)**: Entities live in `src/ecs/world.ts`. Simulation systems run in `useFrame` or via `SystemRunner`.
- **Meshing**: Offloaded to a pool of Web Workers (`MesherWorkerPool.ts` / `worker.ts`) to keep the main thread fluid. `ChunkSystem` dispatches jobs to the pool; results are written back as `meshData` on the ECS entity.
- **Chunking**: World is divided into chunks of `CHUNK_SIZE` (see `src/constants.ts`).

## Technical Specs

- **Technical specs**: `/docs/ARCHITECTURE/TEC###-*.md`
- **Decision records**: `/docs/ARCHITECTURE/DEC###-*.md`
- **Game design**: `/docs/ARCHITECTURE/GAME###-*.md`
