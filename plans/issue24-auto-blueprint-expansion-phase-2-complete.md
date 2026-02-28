# Phase 2 Complete: RED tests for toggle + gradual generation

Added focused test coverage and minimal supporting logic for auto-blueprint toggle state and deterministic gradual generation rules. The new behavior is now test-defined and verified as green, preparing cleanly for Phase 3 UI and system wiring completion.

**Files created/changed:**

- tests/ecs/auto-blueprint-system.spec.ts
- tests/state/store.spec.ts
- src/ecs/systems/AutoBlueprintSystem.ts
- src/state/store.ts

**Functions created/changed:**

- `AutoBlueprintSystem(...)`
- `resetAutoBlueprintSystemForTests()`
- `setAutoBlueprintEnabled(enabled)`
- `toggleAutoBlueprint()`

**Tests created/changed:**

- `should initialize autoBlueprintEnabled as false`
- `should toggle autoBlueprintEnabled`
- `should not add blueprints when auto mode is disabled`
- `should add at most one blueprint per interval when enabled`
- `should skip non-AIR coordinates during auto expansion`

**Review Status:** APPROVED

**Git Commit Message:**
test: cover auto-blueprint generation rules

- add store tests for auto-blueprint default and toggle actions
- add deterministic auto-blueprint system tests for throttling and skip logic
- implement minimal store/system code required to satisfy new tests
