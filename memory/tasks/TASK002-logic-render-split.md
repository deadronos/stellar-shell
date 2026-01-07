# TASK002 — Logic/Render Split Refactor

**Status:** In Progress
**Owner:** Jules
**Created:** 2024-10-18
**Linked Design:** [DES002](memory/designs/DES002-logic-render-split.md)

## Objective

Split game logic and rendering into clear submodules, starting with the Voxel Mesher.

## Sub-Tasks

- [ ] Extract Pure Mesher Functions (RED)
- [ ] Implement VoxelMesher (GREEN)
- [ ] Introduce mesher worker wrapper
- [ ] Create MeshUpdater adapter
- [ ] Make RenderChunk component
- [ ] Move heavy logic from React to systems

## Progress Log

- **2024-10-18**: Created task and design docs.

## Notes

- Following TDD: Write failing tests for new modules first.
