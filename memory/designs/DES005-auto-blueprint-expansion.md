# DES005 — Auto-Blueprint Expansion Mode

**Created:** 2026-02-28
**Author:** automation (GitHub Copilot)

## Summary

Introduce a toggleable, gradual blueprint generation mode that automatically places
`BLUEPRINT_FRAME` nodes over time. The intent is to provide an optional "auto-
expansion" play mode where the dyson swarm grows on its own and drones simply
track and consume new targets. This design focuses on deterministic rules for
placement, throttling, and integration with existing drone build priority logic.

## Requirements (EARS style)

- **WHEN** the player toggles the auto-blueprint setting, **THE SYSTEM SHALL**
  enable or disable automatic generation of blueprint nodes. [Acceptance: store
  flag updates and UI reflects current state]
- **WHEN** auto-blueprint mode is enabled, **THE SYSTEM SHALL** attempt to add a
  single valid blueprint frame every fixed interval (e.g. 1 second). [Acceptance:
  tests simulate time progression and count added blueprints]
- **WHEN** choosing a location for a new blueprint, **THE SYSTEM SHALL** use a
  deterministic, repeatable scanning rule that prefers empty (AIR) voxels within a
  defined radius and proceeds outward in a predictable pattern. [Acceptance: tests
  assert sequence of coordinates given a seeded random or scan state]
- **WHEN** the chosen coordinate is not AIR (occupied by block or existing
  blueprint), **THE SYSTEM SHALL** skip it and continue scanning until a
  suitable spot is found within the current interval. [Acceptance: tests cover
  skip conditions]
- **WHEN** auto-blueprint mode is disabled or the radius limit is reached,
  **THE SYSTEM SHALL** stop generating new blueprints until re-enabled or reset.

## Deterministic Gradual Generation Rules

1. Maintain a scan cursor or index that advances one step per interval. The
   cursor traverses a precomputed list of world coordinates sorted by distance
   from origin (0,0,0) and then by a fixed ordering (e.g. lexicographic). This
   ensures repeatable behavior across sessions and tests.
2. At each tick, attempt to place at the cursor location; if the block at that
   location is not AIR, advance the cursor and retry within the same interval.
   Only one successful placement is permitted per interval to throttle growth.
3. Wrap the cursor when it reaches the end of the list; the list itself may be
   dynamically extended if the player expands the allowable radius (future
   feature).
4. Radius limit and/or total-count limit should be configurable via constants or
   store state so tests can drive small scenarios.

## Integration with Existing Systems

- Use the same `BlueprintManager` infrastructure to register new targets so that
  existing drone pathing and build-priority logic requires no changes.
- Add a new `AutoBlueprintSystem` that runs on each frame (or fixed-step) when
  the store flag is enabled. The system will measure elapsed time and decide when
  to advance the generation cursor and request a new blueprint.
- Expose a boolean flag `autoBlueprintEnabled` in the application store
  (`src/state/store.ts`) with corresponding actions to toggle it. Update
  `SettingsModal.tsx` to surface a checkbox.

## Test Strategy

- Unit tests for store: initial value, toggling behavior, and maybe interval
  accumulator logic (if moved into store helpers).
- Unit tests for `AutoBlueprintSystem`: simulate frames/timestamps and verify
  blueprint count increments correctly, that coordinates follow deterministic
  sequence, and that non-AIR positions are skipped.
- Integration tests in later phases will verify drones consume auto-generated
  blueprints exactly like handcrafted ones.

## Error Handling & Edge Cases

- If the scan list becomes empty (zero radius), the system should do nothing but
  remain enabled; allowing re-enabling later when radius grows.
- If the engine reports an error placing a blueprint (rare), log a warning and
  advance cursor to avoid infinite loops.

## Open Questions / Future Work

- How to reset or rewind the scan cursor? Could be useful when the player
  clears a completed dyson or toggles mode off/on.
- Whether to allow adjustable interval duration per difficulty or settings.
- If the blueprint generation should respect existing completed sections or
  avoid crowding near the star – currently out of scope.

> This design is a living document; update it in phase 4 when implementation
> details solidify or requirements evolve.