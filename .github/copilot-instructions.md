# GitHub Copilot / Agent Instructions — stellar-shell

Quick, actionable guidance for AI coding agents working on this repo.

## Quick start (developer commands)
- Install: `npm ci` (CI uses `npm ci` / Node 18).
- Run locally: `npm run dev` (Vite). Preview build: `npm run preview`, build: `npm run build`.
- Local env: set `GEMINI_API_KEY` in `.env.local` for features that call Gemini.

## Big picture
- This is a small React + TypeScript app that renders a voxel-based space scene using React Three Fiber (`@react-three/fiber`) and `three`.
- Core responsibilities are split: game logic / voxel data (uses `@astrumforge/bvx-kit`) is in `src/services/BvxEngine.ts` while rendering is in `src/components/*` (e.g., `VoxelWorld.tsx`, `Drones.tsx`, `PlayerController.tsx`).
- The renderer uses a lightweight "RenderChunk" wrapper (managed in `BvxEngine.chunks`) and a separate VoxelWorld store (bv x-kit) for voxel metadata. Keep this separation when adding features.

## Important patterns & conventions
- Singletons: `BvxEngine.getInstance()` exposes the canonical engine; prefer it for global game logic.
- Chunking: use `CHUNK_SIZE` from `src/constants.ts` and follow `worldToChunk()` conventions when mapping world coords → chunk coords.
- Dirty rendering: when changing voxel data call `setBlock()` (or mirror that behavior) so the render `RenderChunk.dirty` flag is set and neighbors marked dirty when boundary changes occur.
- Mesh updates: `VoxelWorld` uses `bufferGeometry` and updates `BufferAttribute`s in `useLayoutEffect` (avoid recreating meshes every frame; update attributes instead).
- Performance: meshing uses face culling (see `generateChunkMesh`), and renderer polls for chunk.dirty in `useFrame`. Keep heavy work off the main thread or throttle checks (use `useFrame` intervals or background workers for big operations).
- Materials/colors: use `BLOCK_COLORS` / `MATERIALS` in `src/constants.ts` for visual consistency.

## ECS (miniplex)
- The project uses `miniplex` for an Entity-Component-System. The canonical world and entity type live in `src/ecs/world.ts` (`ECS` and `Entity`).
- Common usage patterns:
  - Create entity: `ECS.add({ position: new THREE.Vector3(), velocity: new THREE.Vector3(), isDrone: true, state: 'IDLE' })`
  - Query archetypes: `const drones = ECS.with('isDrone', 'position', 'velocity')` — use `.entities` to iterate results.
  - Add/remove components: `ECS.addComponent(entity, 'target', new THREE.Vector3(...))` / `ECS.removeComponent(entity, 'target')`
  - Remove entity: `ECS.remove(entity)`
- Performance notes:
  - Cache archetype queries with `useMemo` and avoid recreating them each frame (see `src/components/Drones.tsx`).
  - Minimize per-frame allocations in hot loops — reuse vectors/objects and use instanced meshes for visuals (the `Drones` component demonstrates this).
  - ECS query results are simple arrays; iterate them in `useFrame` for simulation systems and keep computations lean.
- Note: `miniplex-react` is present as a dependency but not used; introduce it only if you need reactive bindings to ECS queries.

## Typical changes & examples
- Add a new block type: update `src/types.ts` (BlockType enum) → add color/material in `src/constants.ts` → ensure `IS_TRANSPARENT` set correctly → adjust meshing logic if needed.
- Add gameplay logic that changes world: call `BvxEngine.setBlock(wx, wy, wz, type)` so it updates bvx-kit, sets render chunk dirty and marks neighbors.
- Adding tests: prefer unit tests that instantiate `BvxEngine` and assert `setBlock/getBlock/findBlueprints/generateChunkMesh` behaviors (there is no `npm test` script yet; add one and update CI if you add tests).

## CI / Tests caveat
- CI workflow (`.github/workflows/ci.yml`) runs `npm ci` and `npm test`. Currently `package.json` has no `test` script; if you add tests, update `package.json` and ensure `npm test` exits non-zero on failures.

## Files to inspect for related work
- Game core: `src/services/BvxEngine.ts`
- Rendering: `src/components/VoxelWorld.tsx`, `Drones.tsx`, `PlayerController.tsx`, `HUD.tsx`
- State: `src/store.ts` (Zustand) and `src/types.ts`
- Constants & visuals: `src/constants.ts`
- Build & run: `package.json`, `vite.config.ts`, `README.md`

## Developer etiquette & PR checklist (concise)
- Preserve the `BvxEngine` separation (data vs render). Avoid inlining large voxel loops into React render bodies.
- Keep geometry updates incremental (modify BufferAttributes) instead of re-allocating heavy objects.
- If adding a test: add `test` script and update CI; include small deterministic inputs for procedural generation (seed or small radius) to keep tests stable.

## Development workflow & TDD (required)
- We follow the Spec-Driven Workflow and persistent Memory Bank for requirements and decisions: see `./.github/instructions/spec-driven-workflow-v1.instructions.md` and `./.github/instructions/memory-bank.instructions.md`.
- **Critical:** During the IMPLEMENT phase, prefer and very strongly follow a strict TDD cycle: RED → GREEN → REFACTOR.
  1. RED — write a failing test that specifies the next small behaviour (see `.github/agents/tdd-red.agent.md`).
  2. GREEN — implement the minimal code to make that test pass (see `.github/agents/tdd-green.agent.md`).
  3. REFACTOR — improve design, remove duplication, and harden edge cases while keeping tests green (see `.github/agents/tdd-refactor.agent.md`).
- Tests for procedural generation should use deterministic, seeded inputs (or very small radii) to remain stable and fast.
- Recommended test runner: **Vitest** (see `./.github/instructions/nodejs-javascript-vitest.instructions.md`) — add `vitest` and a `test` script to `package.json` and update CI if you add tests.
- When creating features, add tasks and a short design to `memory/tasks/` (Memory Bank) and reference them in PRs to preserve the spec-driven process.

---
If any section is unclear or you want a different level of detail (examples, tests, or PR checklist expanded), tell me which parts to expand and I'll iterate. ✅
