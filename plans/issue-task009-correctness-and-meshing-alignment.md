# GitHub Issue Draft

**Title**  
`Fix chunk meshing race, restore typecheck, and realign rendering architecture docs`

**Body**

```md
## Summary

The repo currently passes runtime tests and builds, but it has a correctness gap in chunk meshing and a validation gap in `pnpm typecheck`. This issue creates a new spec-driven follow-up to repair runtime behavior, restore the repo's documented validation contract, and realign architecture docs/comments with the actual implementation.

Linked planning artifacts to create:
- `DES008-correctness-and-meshing-alignment.md`
- `TASK009-correctness-and-meshing-alignment.md`

## Problems

1. `ChunkSystem` can apply stale worker results after newer edits to the same chunk.
2. `pnpm typecheck` fails in tests due to upgrade fixture drift and stricter mock typing.
3. `RenderChunk` allocates `BufferGeometry` without disposing it on unmount.
4. Mesher ownership is duplicated across two `VoxelMesher` implementations, which creates architecture drift.
5. Some comments/docs overstate chunk immutability and no longer match runtime behavior.

## Acceptance Criteria

- Worker meshing is revision-safe: stale results for a chunk are ignored.
- A chunk edited during `meshPending` is re-meshed with the newest world state.
- `RenderChunk` disposes geometry on unmount.
- `pnpm test`, `pnpm build`, `pnpm typecheck`, and `pnpm lint` all pass.
- A single canonical `VoxelMesher` implementation is used by both engine and worker flow.
- `docs/AGENTS/ARCHITECTURE.md`, `docs/ARCHITECTURE/TEC001-rendering-architecture.md`, and the new Memory Bank artifacts reflect shipped behavior.

## Implementation Plan

### Phase 1: Correctness repair
- Add per-chunk mesh revision tracking.
- Capture revision at dispatch time and apply worker output only if still current.
- Preserve/reassert dirty state when edits occur during an in-flight mesh job.
- Add `RenderChunk` geometry disposal.
- Fix test typing drift and invalid mock casts.

### Phase 2: Architecture alignment
- Remove duplicated mesher ownership and canonicalize one implementation.
- Rewrite stale comments around completed chunks and dirty propagation.
- Add/update Design + Task docs and sync architecture documentation.

## Test Plan

- Add out-of-order worker completion regression coverage.
- Add requeue coverage for edits during `meshPending`.
- Add renderer cleanup coverage.
- Re-run full validation:
  - `pnpm test`
  - `pnpm build`
  - `pnpm typecheck`
  - `pnpm lint`

## Notes

This work should preserve the existing logic/render split and worker-based chunk pipeline rather than redesign it.
```
