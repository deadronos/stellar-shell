# DES002 — Logic/Render Split Refactor (Archived)

**Status:** Archived (superseded)
**Owner:** Jules
**Created:** 2024-10-18
**Last updated:** 2026-02-28

## Notes

This design originally laid out a plan to separate game logic (engine, mesher, systems) from
React/Three rendering and to introduce a worker-based meshing architecture. The implementation
has since been completed and documented in several other places:

* **Active patterns:** see `memory/systemPatterns.md` for current ECS‑driven chunk
  architecture and `docs/AGENTS/ARCHITECTURE.md` / `docs/ARCHITECTURE/TEC001-rendering-architecture.md`
  for up‑to‑date descriptions.
* **Code locations:**
  * Engine: `src/services/BvxEngine.ts`
  * ECS world and systems: `src/ecs/*`
  * Mesher: `src/mesher/VoxelMesher.ts`, `src/mesher/MesherWorkerPool.ts`, `src/mesher/worker.ts`
  * Render components: `src/render/RenderChunk.tsx` and
    `src/render/CompletedSectionRenderer.tsx` plus the `VoxelWorld` scene in
    `src/scenes/VoxelWorld.tsx`.

Because the architecture is now established and the original file content is no longer
accurate, this document is retained only for historical record and may be referenced
when tracing the evolution of the design.

(If future architectural changes are planned, create a new DES### file rather than editing this one.)
