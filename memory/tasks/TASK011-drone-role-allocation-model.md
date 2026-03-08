# TASK011 — Drone Role Allocation Model

**Status:** Completed  
**Added:** 2026-03-08  
**Updated:** 2026-03-08  
**Linked Design:** [DES010](../designs/DES010-drone-role-allocation-model.md)

## Original Request

Plan GitHub issue [#50](https://github.com/deadronos/stellar-shell/issues/50), then expand the plan to cover explicit miner / builder / explorer roles with HUD `+` / `-` assignment controls and automatic distribution for unassigned drones.

## Scope

- Decide the intended role model for the swarm.
- Add miner, builder, and explorer to the same planning slice instead of solving exploration in isolation.
- Plan a HUD-based role allocator using `+` / `-` buttons.
- Define the auto-fill rule for unassigned drones.
- Keep the current single-drone ECS model unless a stronger reason appears.

## Planning Outcome

The recommended direction is:

- **Keep one drone entity type**.
- **Add explicit swarm-level manual role targets for miner, builder, and explorer**.
- **Place role controls in the main HUD with `+` / `-` buttons**.
- **Automatically distribute unassigned drones evenly across the three roles, with leftovers assigned to miner, then builder, then explorer**.
- **Treat dedicated drone classes as out of scope for this slice**.

## Implementation Plan (TDD)

### Red

1. Add failing unit tests for the role allocation helper and odd-remainder distribution rules.
2. Add failing store tests for increment/decrement bounds and world-reset behavior.
3. Add failing HUD tests for the role rows, counts, and `+` / `-` buttons.
4. Add failing ECS tests proving `BrainSystem` respects miner / builder / explorer assignments.
5. Add failing `ExplorerSystem` tests proving research only comes from explorer-role drones.

### Green

1. Add manual role target state and actions to the store.
2. Implement a pure helper to compute effective role targets from manual counts plus auto-fill remainder.
3. Add persistent role assignment and deterministic rebalance logic for drones.
4. Update `BrainSystem`, `ExplorerSystem`, `HUD`, and upgrade copy.

### Refactor

1. Normalize vocabulary across code and docs (`target`, `assignment`, `state`).
2. Keep the allocator helper pure and well tested.
3. Surface role information in debug tooling if helpful.
4. Run full repository validation and doc-sync review.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID | Description | Status | Updated | Notes |
| --- | --- | --- | --- | --- |
| 11.1 | Finalize product direction for issue #50 | Complete | 2026-03-08 | Chosen direction is swarm-level role allocation, not dedicated classes. |
| 11.2 | Specify auto-fill and target-allocation rules | Complete | 2026-03-08 | Unassigned drones split evenly, leftovers go miner → builder → explorer. |
| 11.3 | Add RED tests for allocator, store, and HUD | Complete | 2026-03-08 | Added helper math coverage, store bounds tests, and `DroneRolePanel` interaction tests. |
| 11.4 | Add RED tests for ECS role dispatch and research gating | Complete | 2026-03-08 | `BrainSystem` and `ExplorerSystem` now have explicit role-driven regression coverage. |
| 11.5 | Implement store, systems, HUD, and doc updates | Complete | 2026-03-08 | Added allocator helper, persistent role assignment, HUD controls, and synced upgrade/docs text. |
| 11.6 | Run validation and final doc sync | Complete | 2026-03-08 | `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test` all passed after doc sync. |

## Progress Log

### 2026-03-08

- Planned issue #50 initially as explicit explorer assignment on a single drone class.
- Expanded the design after user feedback to include miner and builder roles in the same allocator model.
- Chose a HUD-based `+` / `-` role target UI with automatic even distribution for the remaining pool.
- Defined the remainder tie-break priority as miner, then builder, then explorer.
- **RED:** added failing tests for allocator math, store bounds, `DroneRolePanel`, `BrainSystem`, and `ExplorerSystem` role behavior.
- **GREEN:** implemented `src/utils/droneRoles.ts`, store role-target actions, persistent drone `roleAssignment`, role-aware `BrainSystem` / `ExplorerSystem`, HUD role controls, and updated `ADVANCED_EXPLORER` copy.
- **Refactor/docs:** surfaced role assignment in the debug panel and synced gameplay / architecture docs to the new swarm role allocator.
- **Validation:** full repository validation passed via `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test`.

### 2026-03-08 — Browser verification follow-up

- Verified the live HUD and role allocator in a real browser against the local Vite dev server.
- Confirmed the role panel styling is consistent with the HUD and that live counts rebalance correctly after role-target changes and drone purchases.
- Found and fixed a React key warning in `DroneDebugPanel` by giving spawned drones stable numeric ids and moving the id allocator into `src/ecs/droneIdAllocator.ts`.
- Re-ran validation after the fix: `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test` (31 files / 165 tests passing).

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`
