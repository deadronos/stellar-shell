# Active Context — stellar-shell

**Current focus:** Megastructure rendering optimization — completed Dyson sections use an optimized aggregate renderer while the active frontier stays voxel-interactive.

**Recent changes:**

- Added `completedDysonSection?: true` ECS component to `Entity`.
- Added `VoxelQuery.isChunkCompletedDyson` to classify render chunks whose solid voxels are all PANEL or SHELL.
- Exposed `BvxEngine.isChunkCompletedDyson` delegating to `VoxelQuery`.
- Updated `ChunkSystem` to mark/unmark `completedDysonSection` after every mesh job.
- Created `src/render/CompletedSectionRenderer.tsx` — shared metalness material, FrontSide culling, static geometry for completed chunks.
- Updated `VoxelWorld.tsx` to route completed chunks to `CompletedSectionRenderer` and active chunks to `RenderChunk`.
- Added 6 unit tests for `isChunkCompletedDyson` in `tests/services/voxel/voxel-query.spec.ts`.

**Next steps:**

- Tune `CompletedSectionRenderer` material (emissive glow, opacity) after gameplay review.
- Consider disabling `needsUpdate` re-propagation for completed sections to further reduce mesher pressure.

**Notes:**

- Voxel/world data is unchanged; the optimization is purely at the render classification layer.
- The pre-existing `any` lint warning in `tests/ecs/chunk-system.spec.ts` is unrelated and unchanged.
