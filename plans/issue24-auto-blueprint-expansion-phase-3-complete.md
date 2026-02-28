# Phase 3 Complete: GREEN implementation (store + system + wiring + UI)

Exposed the auto-blueprint toggle in `SettingsModal` and wired `AutoBlueprintSystem` into the runtime frame loop in `SystemRunner`. Added focused tests that verify the toggle interaction and runtime invocation path while keeping existing behavior intact.

**Files created/changed:**

- src/components/SettingsModal.tsx
- src/ecs/SystemRunner.tsx
- tests/components/settings-modal.spec.tsx
- tests/ecs/system-runner.spec.tsx

**Functions created/changed:**

- `SystemRunner()` runtime loop now invokes `AutoBlueprintSystem(delta, elapsedTime)`
- `SettingsModal` now binds `autoBlueprintEnabled` and `toggleAutoBlueprint`

**Tests created/changed:**

- `SettingsModal should render and toggle auto-blueprint checkbox`
- `SystemRunner should call AutoBlueprintSystem in frame callback`

**Review Status:** APPROVED

**Git Commit Message:**
feat: wire auto-blueprint toggle runtime

- add Settings modal checkbox for auto-blueprint mode
- call AutoBlueprintSystem from SystemRunner frame updates
- add component/system-runner tests for toggle and invocation
