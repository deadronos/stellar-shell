# Active Context — stellar-shell

**Current focus:** Stabilized optional asteroid orbital motion while preserving mining/build logic.

**Recent changes:**

- Added `AsteroidOrbitSystem` and deterministic orbit helper (`src/services/AsteroidOrbit.ts`).
- Added settings controls for orbit toggle/radius/speed.
- Updated `BrainSystem`, `MiningSystem`, `ConstructionSystem`, and `PlayerSystem` to apply orbit offsets consistently.
- Added focused tests for deterministic motion and mining/build compatibility while orbiting.

**Next steps:**

- Evaluate whether orbit defaults should be enabled by default after gameplay testing.
- Consider exposing vertical amplitude in UI if needed for design tuning.

**Notes:**

- Voxel/world data remains static in `BvxEngine`; only render/world-space targets are offset for orbit.
