# Requirements — stellar-shell (EARS-style)

- WHEN the app is launched, THE SYSTEM SHALL render the voxel world and camera at a responsive framerate (acceptance: scene loads and renders without errors on `npm run dev`).
- WHEN a block is changed via engine API, THE SYSTEM SHALL update the underlying voxel data and mark affected chunks dirty so meshes are regenerated (acceptance: `setBlock` followed by `getBlock` reflects the change and neighbor chunk.dirty flags are set appropriately).
- WHEN many voxels are updated in batch, THE SYSTEM SHALL avoid blocking the main thread and support batched or background meshing strategies (acceptance: no severe frame drops during small batch updates; long operations should be offloaded or throttled).
- WHEN adding new block types, THE SYSTEM SHALL centralize visuals and material definitions in `src/constants.ts` and properly mark transparency/occlusion for meshing (acceptance: new block type renders correctly and is cullable where appropriate).

