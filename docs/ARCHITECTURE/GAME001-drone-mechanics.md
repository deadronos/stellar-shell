# GAME001 - Drone Mechanics (Design)

**Summary:**
Describe high-level drone behaviour, state machine and constraints.

**Key points:**
- Drones are ECS entities with `isDrone`, `position`, `velocity`, `state`, `target`, and `targetBlock` components.
- States: `IDLE`, `EXPLORING`, `MOVING_TO_BUILD`, `MOVING_TO_MINE`, `RETURNING_RESOURCE`.
- Mines/Builds are reserved by setting `targetBlock` on the drone entity to prevent duplicates.
- `EXPLORING` is currently both the idle patrol behavior and the source state used by `ExplorerSystem` to generate research over time. GitHub issue #50 tracks whether this should stay multi-role or evolve into a dedicated explorer role/class.

**Balance:**

- `FRAME_COST` and `DRONE_COST` are in `src/constants.ts`.
- Base movement speed is currently defined in `src/ecs/systems/MovementSystem.ts`, then modified by prestige and upgrades at runtime.

**References:** `src/scenes/Drones.tsx`, `src/ecs/world.ts`, `src/ecs/systems/BrainSystem.ts`, `src/ecs/systems/ExplorerSystem.ts`, `src/ecs/systems/MovementSystem.ts`
