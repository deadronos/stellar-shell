# Coding Conventions

## Voxel World Conventions

- **Chunking Math**: Always use `worldToChunk()` for coordinate mapping.
- **Dirty Rendering**: Call `setBlock()` (or equivalent) to trigger the `dirty` flag for mesh updates and neighbor re-meshing.
- **Mesh Efficiency**: Modify `BufferAttributes` in `useLayoutEffect` instead of re-allocating heavy geometry objects.
- **Materials**: Use `BLOCK_COLORS` and `MATERIALS` from `src/constants.ts`.

## ECS Patterns (Miniplex)

- **Archetype Queries**: Cache with `useMemo` to avoid per-frame allocations.
- **Iteration**: Iterate entities in `useFrame` for simulation.
- **Visuals**: Use instanced meshes for ECS entities (see `Drones.tsx` for example).

## Performance

- **Throttling**: Poll `chunk.dirty` in `useFrame` with intervals if necessary.
- **Culling**: Meshing must implement face culling (see `generateChunkMesh`).
