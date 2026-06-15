# DES012 — Reduce Per-Frame Object Allocations in Hot Paths

## Context
Profiling and code review of the ECS/render loop identified repeated `THREE.Vector3` and `THREE.Color` construction inside per-frame paths. These allocations pressure the GC during active drone swarms and chunk meshing.

## Goal
Remove unnecessary per-frame object construction from the hottest loops without changing behavior or visual output.

## Requirements (EARS)

- WHEN `MiningSystem` processes a frame, THE SYSTEM SHALL not allocate new `THREE.Vector3` instances for drone world targets or return positions. [Acceptance: unit test or static review confirms scratch-vector usage]
- WHEN `ConstructionSystem` processes a frame, THE SYSTEM SHALL not allocate new `THREE.Vector3` instances for build targets. [Acceptance: unit test or static review]
- WHEN `MovementSystem` processes a frame, THE SYSTEM SHALL reuse scratch vectors for separation steering. [Acceptance: existing movement tests still pass; no `new THREE.Vector3` in the hot loop]
- WHEN `Drones.tsx` renders a frame, THE SYSTEM SHALL not allocate `THREE.Vector3` or `THREE.Color` instances per drone. [Acceptance: render tests or static review]
- WHEN `LaserRenderer.tsx` renders a frame, THE SYSTEM SHALL not allocate a `THREE.Vector3` per drone target. [Acceptance: render tests or static review]
- WHEN `VoxelMesher` generates chunk mesh colors, THE SYSTEM SHALL not allocate a `THREE.Color` per visible face. [Acceptance: mesher tests still pass; no `new THREE.Color` in `addFace`]

## Architecture Overview

The change is localized to scratch-object usage inside existing functions. No public API changes are required.

```
┌─────────────────┐     ┌──────────────────────┐
│  Systems/Render │────▶│  Module-level scratch │
│  hot loops      │     │  vectors / colors     │
└─────────────────┘     └──────────────────────┘
```

## Implementation Notes

- Prefer module-level `const _scratchVec = new THREE.Vector3()` over inline construction.
- Use `Vector3.copy()`, `.set()`, `.addVectors()`, `.subVectors()` for arithmetic.
- In `VoxelMesher.addFace`, compute `BLOCK_COLORS[type]` once per block type at module load (or use a precomputed `THREE.Color` palette) and mutate a single scratch color for noise.
- Keep function signatures and external behavior identical.

## Test Strategy

1. Unit tests for `MiningSystem`, `ConstructionSystem`, `MovementSystem` already exercise behavior; keep them green.
2. Add a focused test that inspects `VoxelMesher.generateChunkMesh` output to confirm identical colors/geometry before and after the refactor.
3. Run the full suite: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

## Files Likely to Change

- `src/ecs/systems/MiningSystem.ts`
- `src/ecs/systems/ConstructionSystem.ts`
- `src/ecs/systems/MovementSystem.ts`
- `src/scenes/Drones.tsx`
- `src/components/renderers/LaserRenderer.tsx`
- `src/mesher/VoxelMesher.ts`
- Tests as needed.

## Risks / Tradeoffs

- Scratch vectors are not thread-safe; they are only used on the main thread inside systems/renderers, so this is acceptable.
- `VoxelMesher` runs in workers; using module-level scratch colors inside a worker is safe because each worker has its own module instance.
