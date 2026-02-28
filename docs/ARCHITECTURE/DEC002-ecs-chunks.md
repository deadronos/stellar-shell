# DEC002 - ECS-Based Chunk Management

## Context
Originally, the `BvxEngine` was a singleton that managed both voxel data (`VoxelWorld`) and rendering state (`RenderChunk` objects with `dirty` flags). The React component (`VoxelWorld.tsx`) polled the engine for changes.

This approach violated the separation of concerns and the "Best Practices" for integrating BVX-Kit with React Three Fiber, which recommend using Miniplex (ECS) as the single source of truth for game entities.

## Decision
**Move Chunk Management to the Entity Component System (Miniplex).**

- **Chunks are Entities**: Each 16×16×16 render chunk is now an ECS entity with components: `isChunk`, `chunkKey`, `chunkPosition`, `needsUpdate`, `meshPending`, `meshData`, and optionally `completedDysonSection`.
- **System-Driven Updates**: A `ChunkSystem` is responsible for reacting to `needsUpdate` flags, dispatching mesh jobs to `MesherWorkerPool`, and writing `meshData` back to the entity on completion.
- **Reactive Rendering**: The `VoxelWorld` component subscribes to ECS queries (`useEntities`) rather than polling the engine.

## Consequences

**Positive:**
- **Decoupling**: `BvxEngine` is now a pure data service. It doesn't know about the rendering loop or React.
- **Consistency**: All game objects (Drones, Chunks) are managed in the same ECS world, simplifying state management and serialization.
- **React-friendliness**: Using `useEntities` fits naturally into the React lifecycle.

**Negative:**
- **Complexity**: Requires understanding ECS patterns.
- **Entity Overhead**: Creates more entities in the world, but Miniplex is optimized for thousands of entities, so this is negligible for typical chunk counts.

## Lessons Learned
- **Reactive Dependencies**: When using `useEntities`, remember that the hook only updates when the *set* of entities changes. If you rely on a component (like `meshData`) that is added asynchronously, you *must* include it in the query keys (e.g., `ECS.with('isChunk', 'meshData')`) or the component won't re-render to reflect the new data.
