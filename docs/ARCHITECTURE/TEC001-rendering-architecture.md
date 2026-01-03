# TEC001 - Rendering & Chunking Architecture

**Summary:**
This spec describes the split between voxel data (bv x-kit `VoxelWorld`) and the renderer (RenderChunk wrappers + Three.js meshes).

Key files:
- `src/services/BvxEngine.ts` — game engine and voxel operations (`setBlock`, `getBlock`, `generateChunkMesh`).
- `src/components/VoxelWorld.tsx` — React renderer that maps `RenderChunk`s to Three.js `mesh`es and updates `BufferAttribute`s.
- `src/constants.ts` — `CHUNK_SIZE`, `BLOCK_COLORS`, `MATERIALS`, `IS_TRANSPARENT`.

Design notes:
- Data lives in `@astrumforge/bvx-kit` `VoxelWorld` (4x4x4 chunks). Render chunks are 16x16x16 abstractions that hold dirty state and mesh geometry.
- Meshing uses face culling and per-face colors (no textures) for low memory use.
- When voxel data changes, `BvxEngine.setBlock()` updates the `bvxWorld` and marks the appropriate RenderChunk(s) dirty; renderer updates geometry in `useLayoutEffect` on next re-render.

Acceptance:
- Keep data vs render separation for any new features.
- Heavy mesh work should be offloaded or throttled to avoid main-thread jank.