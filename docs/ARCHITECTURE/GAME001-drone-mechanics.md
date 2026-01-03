# GAME001 - Drone Mechanics (Design)

**Summary:**
Describe high-level drone behaviour, state machine and constraints.

**Key points:**
- Drones are ECS entities with `isDrone`, `position`, `velocity`, `state`, `target`, and `targetBlock` components.
- States: `IDLE`, `MOVING_TO_BUILD`, `MOVING_TO_MINE`, `RETURNING_RESOURCE`.
- Mines/Builds are reserved by setting `targetBlock` on the drone entity to prevent duplicates.

**Balance:**
- `DRONE_SPEED`, `FRAME_COST`, and `DRONE_COST` are in `src/constants.ts` and should be tuned in design changes.

**References:** `src/components/Drones.tsx`, `src/ecs/world.ts`