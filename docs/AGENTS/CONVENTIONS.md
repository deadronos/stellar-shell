# Coding Conventions

## Voxel World Conventions

- **Chunking Math**: Always use `worldToChunk()` for coordinate mapping.
- **Dirty Rendering**: Call `setBlock()` (or equivalent) to trigger the `needsUpdate` flag on the chunk ECS entity; `ChunkSystem` dispatches a mesh job to the worker pool on the next frame.
- **Mesh Efficiency**: `RenderChunk` and `CompletedSectionRenderer` apply incoming `meshData` via `MeshUpdater.updateGeometry()` inside `useEffect`, reusing the same `THREE.BufferGeometry` instance.
- **Materials**: Use `BLOCK_COLORS` and `MATERIALS` from `src/constants.ts`.

## ECS Patterns (Miniplex)

- **Archetype Queries**: Cache with `useMemo` to avoid per-frame allocations.
- **Iteration**: Iterate entities in `useFrame` for simulation.
- **Visuals**: Use instanced meshes for ECS entities (see `Drones.tsx` for example).

## Performance

- **Throttling**: `ChunkSystem` runs every frame in `useFrame`; only chunks with `needsUpdate: true` are dispatched to the worker pool.
- **Culling**: Meshing implements face culling in `src/mesher/VoxelMesher.ts` (`VoxelMesher.generateChunkMesh`).
