# Plan: Auto-Blueprint Expansion Mode

## Plan Metadata

- auto_commit: true
- auto_advance: true
- branch_name: deadronos/issue24
- owner: Conductor
- approved_on: 2026-02-28

Implement a toggleable, gradual Dyson blueprint expansion path that reuses the existing `BlueprintManager` and drone build-priority flow. We will follow strict RED → GREEN → REFACTOR with small, testable phases and full validation after implementation.

## Phases (4)

1. **Phase 1: Memory Bank spec + task/design setup**
   - **Objective:** Capture issue #24 requirements/design and register task state in Memory Bank.
   - **Files/Functions to Modify/Create:**
     - `memory/designs/DES005-auto-blueprint-expansion.md`
     - `memory/tasks/TASK006-auto-blueprint-expansion.md`
     - `memory/tasks/_index.md`
     - `memory/activeContext.md`
   - **Tests to Write:** None (documentation/spec phase)
   - **Steps:**
     1. Write EARS-style requirements for toggle, gradual generation, and drone-priority integration.
     2. Define deterministic initial expansion rules and throttling.
     3. Record TDD test strategy and acceptance checks.

2. **Phase 2: RED tests for toggle + gradual generation**
   - **Objective:** Add failing tests that define expected behavior before implementation.
   - **Files/Functions to Modify/Create:**
     - `tests/ecs/auto-blueprint-system.spec.ts` (new)
     - `tests/state/store.spec.ts` (new)
   - **Tests to Write:**
     - `should initialize autoBlueprintEnabled as false`
     - `should toggle autoBlueprintEnabled`
     - `should not add blueprints when auto mode is disabled`
     - `should add at most one blueprint per interval when enabled`
     - `should skip non-AIR coordinates during auto expansion`
   - **Steps:**
     1. Define deterministic time/rule behavior in tests.
     2. Assert no generation when disabled.
     3. Assert throttled generation when enabled.

3. **Phase 3: GREEN implementation (store + system + wiring + UI)**
   - **Objective:** Implement minimal code to satisfy tests and issue acceptance criteria.
   - **Files/Functions to Modify/Create:**
     - `src/state/store.ts`
     - `src/components/SettingsModal.tsx`
     - `src/ecs/systems/AutoBlueprintSystem.ts` (new)
     - `src/ecs/SystemRunner.tsx`
   - **Tests to Write:** Update/complete phase-2 tests to pass.
   - **Steps:**
     1. Add store state/action for auto toggle.
     2. Add Settings modal control bound to store action.
     3. Implement throttled auto-generation that places `BLUEPRINT_FRAME` and registers in `BlueprintManager`.
     4. Wire system into frame loop.

4. **Phase 4: REFACTOR + validation + memory updates**
   - **Objective:** Improve clarity, validate full suite, and close task tracking.
   - **Files/Functions to Modify/Create:**
     - touched files above
     - `memory/tasks/TASK006-auto-blueprint-expansion.md`
     - `memory/tasks/_index.md`
     - `memory/activeContext.md`
     - `memory/progress.md`
   - **Tests to Write:**
     - Integration assertion that auto-generated blueprints are consumable by construction flow (if not already covered).
   - **Steps:**
     1. Refactor naming/constants and keep behavior unchanged.
     2. Run `pnpm run lint && pnpm run build && pnpm test`.
     3. Finalize Memory Bank status and handoff artifacts.

**Acceptance Criteria (CI & Quality):**

- Player can toggle auto-blueprint mode.
- New blueprint nodes are generated gradually under defined rules.
- Behavior integrates with existing drone build prioritization.
- CI-equivalent local checks pass: lint, build, tests.
- Linter/format checks pass (allow known pre-existing warning only, if unchanged).
