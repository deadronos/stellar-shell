# Agent Playbook

## Common Tasks

### Adding a Block Type

1. Update `BlockType` enum in `src/types.ts`.
2. Add material/color to `BLOCK_COLORS` in `src/constants.ts`.
3. Set `IS_TRANSPARENT` if applicable.
4. Adjust meshing logic in `src/mesher/VoxelMesher.ts` if custom geometry is needed.

### Adding Gameplay Logic

1. Use `BvxEngine.setBlock(wx, wy, wz, type)` for world changes.
2. Add/modify ECS entities for dynamic objects.
3. Implement logic in a dedicated system (`src/ecs/systems/`).

### Adding Tests

- Use **Vitest**. Run with `pnpm test`.
- Add unit tests in `tests/` mirroring `src/` structure.
- Use seeded randomness for any procedural generation tests.

## File Map

- **Game Core**: `src/services/BvxEngine.ts`
- **ECS World**: `src/ecs/world.ts`
- **Voxel Rendering**: `src/scenes/VoxelWorld.tsx` → `src/render/RenderChunk.tsx` / `src/render/CompletedSectionRenderer.tsx`
- **State**: `src/state/store.ts` (Zustand)
- **Constants**: `src/constants.ts`

## CI / Environment

- **Install**: `pnpm install`
- **Test**: `pnpm test`
