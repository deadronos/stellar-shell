# GAME001 - Drone Mechanics (Design)

**Summary:**
Describe high-level drone behaviour, state machine and constraints.

**Key points:**

- Drones are ECS entities with `isDrone`, `position`, `velocity`, `roleAssignment`, `state`, `target`, and `targetBlock` components.
- `roleAssignment` is persistent intent (`MINER`, `BUILDER`, `EXPLORER`) and is distinct from transient state.
- States: `IDLE`, `EXPLORING`, `MOVING_TO_BUILD`, `MOVING_TO_MINE`, `RETURNING_RESOURCE`.
- Mines/Builds are reserved by setting `targetBlock` on the drone entity to prevent duplicates.
- `IDLE` and `EXPLORING` both use orbital patrol movement, but only drones with `roleAssignment = EXPLORER` generate research while in the `EXPLORING` state.
- Swarm roles are controlled from the HUD via manual role targets; the remaining drone pool is auto-balanced evenly, with leftovers assigned in `MINER`, then `BUILDER`, then `EXPLORER` priority order.

**Balance:**

- `FRAME_COST` and `DRONE_COST` are in `src/constants.ts`.
- Base movement speed is currently defined in `src/ecs/systems/MovementSystem.ts`, then modified by prestige and upgrades at runtime.

**References:** `src/scenes/Drones.tsx`, `src/components/DroneRolePanel.tsx`, `src/ecs/world.ts`, `src/ecs/systems/BrainSystem.ts`, `src/ecs/systems/ExplorerSystem.ts`, `src/ecs/systems/MovementSystem.ts`, `src/utils/droneRoles.ts`
