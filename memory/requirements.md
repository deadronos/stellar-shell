# Requirements — stellar-shell (EARS-style)

- WHEN the app is launched, THE SYSTEM SHALL render the voxel world and camera at a responsive framerate on typical developer machines (Acceptance: scene loads and renders without runtime errors; basic interactions (move, drone behaviors) run at >= 30 FPS on a typical dev notebook).

- WHEN a block is changed via engine API, THE SYSTEM SHALL update the underlying voxel storage and mark affected render chunks dirty so meshes are regenerated. (Acceptance: `setBlock(x,y,z,t)` followed by `getBlock(x,y,z)` returns `t`; the corresponding `RenderChunk.dirty` is set and neighbors are marked dirty when changes occur on chunk boundaries.)

- WHEN meshing a render chunk, THE SYSTEM SHALL perform face-culling using visibility from neighbor voxels and respect transparency rules from `IS_TRANSPARENT` (Acceptance: `generateChunkMesh()` returns geometry with faces only for visible surfaces; transparent blocks do not occlude identical transparent neighbors).

- WHEN many voxels are updated (batch generation or mining), THE SYSTEM SHALL avoid long main-thread stalls; heavy meshing or bulk updates should be batched or offloaded to a worker (Acceptance: no multi-second frame freezes for moderate batch sizes; an MVP batching strategy that slices work across frames is acceptable).

- WHEN adding or changing block types, THE SYSTEM SHALL centralize visual and material definitions in `src/constants.ts` and mark `IS_TRANSPARENT` appropriately for meshing (Acceptance: a new block type shows correct color/material and is mesh-culled properly per its transparency setting).

- WHEN adding gameplay rules (e.g., drone behavior), THE SYSTEM SHALL keep game logic testable and separated from rendering (Acceptance: logic that does not depend on Three.js state is implemented in engine/ECS-friendly functions that can be unit-tested).

- WHEN introducing CI checks, THE SYSTEM SHALL include unit tests for core engine behavior (set/get blocks, neighbor dirty marking, simple deterministic meshing) and a `test` script in `package.json` (Acceptance: `npm test` runs deterministically and fails on regressions).

- WHEN documentation is needed, THE SYSTEM SHALL keep the Memory Bank up-to-date with requirements, designs, tasks, and decisions (Acceptance: `memory/*` files contain current requirements, DES files for designs, and tasks for planned work).


## Non-functional requirements

- Performance: avoid per-frame allocations in hot loops (drones simulation, meshing). Use instanced meshes and object reuse where possible.
- Determinism for tests: procedural generation and meshing helpers should either accept a seed or be small enough to reason about for unit tests.
- Developer ergonomics: `BvxEngine` should expose simple public APIs (`setBlock`, `getBlock`, `generateChunkMesh`, `findBlueprints`, `findMiningTargets`) with clear behavior.


## Acceptance test suggestions

- Unit: test `setBlock/getBlock` for basic set/get and neighbor dirty propagation.
- Unit: small fixed chunk to test `generateChunkMesh()` output (counts of positions/normals/colors, expected faces for a simple cube configuration).
- Integration: generate a small asteroid of radius 3, assert that some `ASTEROID_SURFACE` blocks exist and `findMiningTargets()` returns exposed blocks.
- CI: add `vitest` and an `npm test` script and run the tests on PRs.
