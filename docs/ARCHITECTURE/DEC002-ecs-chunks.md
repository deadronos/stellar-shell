# DEC002 - ECS-Based Chunk Management

## Context
Originally, the `BvxEngine` was a singleton that managed both voxel data (`VoxelWorld`) and rendering state (`RenderChunk` objects with `dirty` flags). The React component (`VoxelWorld.tsx`) polled the engine for changes.

This approach violated the separation of concerns and the "Best Practices" for integrating BVX-Kit with React Three Fiber, which recommend using Miniplex (ECS) as the single source of truth for game entities.

## Decision
**Move Chunk Management to the Entity Component System (Miniplex).**

- **Chunks are Entities**: Each 16x16x16 render chunk is now an ECS entity with components: `isChunk`, `chunkPosition`, `needsUpdate`, `geometry`.
- **System-Driven Updates**: A `ChunkSystem` is responsible for reacting to `needsUpdate` flags and generating geometry.
- **Reactive Rendering**: The `VoxelWorld` component subscribes to ECS queries (`useEntities`) rather than polling the engine.

## Consequences

**Positive:**
- **Decoupling**: `BvxEngine` is now a pure data service. It doesn't know about the rendering loop or React.
- **Consistency**: All game objects (Drones, Chunks) are managed in the same ECS world, simplifying state management and serialization.
- **React-friendliness**: Using `useEntities` fits naturally into the React lifecycle.

**Negative:**
- **Complexity**: Requires understanding ECS patterns.
- **Entity Overhead**: Creates more entities in the world, but Miniplex is optimized for thousands of entities, so this is negligible for typical chunk counts.
