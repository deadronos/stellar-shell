# DES002 — Logic/Render Split Refactor

**Status:** Draft
**Owner:** Jules
**Created:** 2024-10-18

## Overview

Refactor the codebase to split game logic (engine, voxel data, systems, meshing) from rendering (three/react-three-fiber React components, buffer updates) into smaller, testable submodules with clear contracts.

## Goals

- Improve testability.
- Enable off-main-thread meshing.
- Reduce coupling between logic and UI.

## Architecture

### 1. Engine / Data Layer
- **`src/engine/BvxEngine.ts`**: Pure game logic state, voxel data, and event emission.
- **Responsibilities**: Store voxel data, manage blueprints, emit events.

### 2. Mesher / Worker Layer (Pure Compute)
- **`src/mesher/VoxelMesher.ts`**: Pure function `(cx, cy, cz, source) -> Buffers`.
- **`src/mesher/worker.ts`**: Web Worker entry point handling mesh generation requests.
- **Responsibilities**: Deterministic mesh generation, transfer buffers.

### 3. Rendering Layer (React + R3F)
- **`src/render/RenderChunk.tsx`**: Component that receives buffer updates and renders a chunk.
- **`src/render/ChunkManager.tsx`**: Manages chunk lifecycle and worker communication.
- **Responsibilities**: Visualize the game state using Three.js, consume worker outputs.

### 4. Systems / Game Logic (ECS)
- **`src/systems/*`**: Pure logic systems (Physics, AI, etc.).
- **Responsibilities**: Mutate state, emit events, do not touch DOM/WebGL directly.

## Migration Plan

1. **Extract Pure Mesher**: Move `VoxelMesher` to `src/mesher/` and ensure it is pure.
2. **Worker Implementation**: Create a worker wrapper for the mesher.
3. **Render Refactor**: Update `VoxelWorld` to use the worker/mesher via a `ChunkManager` or direct worker communication.
4. **System Cleanup**: Ensure systems do not touch renderer directly.

## Decision Records

- **DEC003**: Use Web Workers for meshing to offload main thread.
- **DEC004**: Split Engine and Renderer into distinct directories (`src/engine` and `src/render`).
