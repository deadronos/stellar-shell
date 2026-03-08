# Active Context — stellar-shell

**Current focus:** TASK011 drone role allocation is implemented; the next work item is roadmap selection and playtest tuning.

**Recent changes:**

- Completed `DES010` + `TASK011`:
  - manual HUD targets for miner / builder / explorer roles,
  - deterministic even auto-fill with remainder priority `MINER -> BUILDER -> EXPLORER`,
  - persistent drone `roleAssignment` separate from transient state,
  - `BrainSystem` / `ExplorerSystem` updated to honor roles,
  - `ADVANCED_EXPLORER` copy and docs synced to assigned explorer behavior.
- Browser verification pass confirmed the HUD/role panel flow works live; follow-up fix added stable numeric drone ids to eliminate the `DroneDebugPanel` React key warning.
- Added `BvxEngine.computeDysonProgress()` to derive blueprint/frame/panel/shell counts and milestone readiness directly from world voxels.
- Wired `dysonProgress` into Zustand store and updated build/mining systems to refresh metrics after voxel mutations.
- Added HUD Dyson metrics row and gated System Jump visibility by both energy rate and Dyson prestige readiness milestone.
- Added `ARCHITECTURE_ALIGNMENT.md` summarizing implementation-vs-design alignment and identified Phase 2 drift items.
- Completed `DES007` + `TASK008` implementation:
  - deterministic radius-aware auto-blueprint traversal,
  - runtime Auto-Replicator toggle semantics,
  - hitch-safe energy catch-up ticking,
  - rare-resource policy docs/test alignment.
- Completed `DES008` + `TASK009` implementation:
  - revision-safe chunk meshing with stale worker result discard,
  - dirty-chunk requeue after `meshPending`,
  - active/completed chunk geometry disposal on unmount,
  - canonical `VoxelMesher` ownership in `src/mesher`,
  - restored `pnpm typecheck` and synced architecture docs,
  - filed GitHub issue `#44` for traceability.
- Started `DES009` + `TASK010` implementation:
  - recover from worker mesh failures without wedging chunks,
  - reset auto-blueprint traversal on re-enable and System Jump,
  - make `systemSeed` fully determine asteroid topology.
- Completed `DES009` + `TASK010` implementation:
  - worker mesh-job failures now reject, replace the failed worker, and retry chunks on later passes,
  - auto-blueprint traversal now rewinds on re-enable and world reset,
  - asteroid topology is now fully seeded from `systemSeed`,
  - full validation (`pnpm test`, `pnpm build`, `pnpm typecheck`, `pnpm lint`) is green again.

**Next steps:**

- Playtest and tune the new swarm role allocator so builder starvation / over-allocation feels sensible.
- Tune pacing/balance after the deterministic auto-blueprint ordering changes in live playtesting.
- Continue roadmap work (next feature/task TBD).

**Notes:**

- Blueprint targets use existing `BLUEPRINT_FRAME` + `BlueprintManager` flow, so no new drone state paths were introduced.
- Chunk meshing now treats ECS chunk entities as the source of truth for mesh revision state; workers are pure snapshot processors only.
- The next pass keeps the current architecture boundaries intact; all fixes are correctness-focused rather than gameplay-facing.
- Issue `#50` is now implemented with swarm-level role allocation instead of dedicated drone classes.
- Browser-only issue discovered during live verification: `DroneDebugPanel` required stable spawn ids for list keys; fixed by introducing `src/ecs/droneIdAllocator.ts`.
