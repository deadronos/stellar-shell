# DEC001 - Chunk Meshing Decision Record

**Context:** We need an efficient mesh generation strategy that balances memory and CPU for small browser-based demos.

**Decision:** Use face-culling meshing per 16x16x16 render chunk, generate BufferAttributes (position, normal, color, index) per chunk, update attributes in-place on change.

**Consequences:**
- Pros: Low memory overhead, simpler runtime updates, easy to mark partial updates via `dirty` flags.
- Cons: Edge-case handling for neighbor faces requires careful dirty neighbor marking; larger meshes could still be expensive.

**References:** `src/services/BvxEngine.generateChunkMesh`, `src/components/VoxelWorld.tsx`