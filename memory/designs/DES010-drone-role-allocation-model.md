# DES010 — Drone Role Allocation Model

**Status:** Implemented  
**Owner:** GitHub Copilot  
**Created:** 2026-03-08

## Overview

GitHub issue [#50](https://github.com/deadronos/stellar-shell/issues/50) started as a question about research generation, but the cleaner product direction is broader: keep a **single drone class** and introduce an explicit **swarm role allocation model** for **miners**, **builders**, and **explorers**.

This design recommends a **swarm-level target UI** with `+` / `-` controls for each role. Manual targets consume drones from the total pool. Any remaining unassigned drones are distributed automatically across roles as follows:

1. split the remainder as evenly as possible across miner, builder, and explorer,
2. assign leftover single drones by priority: **miner**, then **builder**, then **explorer**.

That gives the player meaningful control without introducing separate drone classes or per-drone micromanagement.

## Problem Statement

The current runtime has no explicit role layer:

- all drones share one entity shape,
- `BrainSystem` assigns build first, then mining, then idle exploration,
- `ExplorerSystem` generates research from the fallback `EXPLORING` state,
- the UI exposes total drone count, but not role control.

This creates three issues:

1. **Weak gameplay agency** — the player cannot decide how much of the swarm should mine, build, or explore.
2. **Design drift** — docs imply stronger role identity than the runtime actually provides.
3. **No scalable UI model** — if explorer assignment is added in isolation, miner/builder control will likely need a second redesign later.

## Recommendation

Adopt **single-class drones with explicit swarm-level role targets**.

### Core model

- Keep one drone entity type.
- Add persistent role assignment distinct from transient action state.
- Let the player adjust **manual targets** for `MINER`, `BUILDER`, and `EXPLORER` with `+` / `-` buttons.
- Compute **effective targets** from:
  - manual targets, plus
  - automatic distribution of the remaining unassigned pool.

### Why this is the best fit now

1. **Fits the current architecture**
   - The repo already uses one drone type and task-state-driven systems.
   - Role targets can be layered on top without introducing drone subclasses.

2. **Solves the research ambiguity cleanly**
   - Research becomes the output of explicitly allocated explorer capacity.
   - `ADVANCED_EXPLORER` gets a clear, player-visible meaning.

3. **Adds control without heavy micromanagement**
   - `+` / `-` controls are lightweight and legible.
   - Auto-distribution keeps the swarm useful even when the player does not fully assign every drone.

4. **Creates a durable foundation**
   - Future features can reuse the same role-target model for upgrades, automation, and balancing.

## Options Considered

### 1. Dedicated drone classes

- **Pros**
  - Strong role fantasy.
  - Clean thematic separation.

- **Cons**
  - Requires new production rules, economy balancing, spawn logic, and likely visual/UI differentiation.
  - Larger architecture change than this issue currently warrants.

**Verdict:** too large for the current slice.

### 2. Per-drone manual assignment

- **Pros**
  - Maximum control.
  - Natural fit for a debug/editor workflow.

- **Cons**
  - Too much micromanagement for the current game loop.
  - Adds UI and state complexity without clear gameplay payoff.

**Verdict:** overkill for the current UX.

### 3. Swarm-level role targets with auto-fill (**recommended**)

- **Pros**
  - Gives clear player control.
  - Keeps the current one-class swarm architecture.
  - Scales well to miner / builder / explorer together.

- **Cons**
  - Requires new vocabulary and allocator logic.
  - Needs careful UI wording so “manual” vs “auto” counts are understandable.

**Verdict:** best balance of control, scope, and clarity.

### 4. Keep the current passive model

- **Pros**
  - Minimal implementation work.
  - No new UI required.

- **Cons**
  - Leaves the core role problem unsolved.
  - Research remains an accidental byproduct of idle patrol.

**Verdict:** no longer recommended.

## Requirements (EARS)

- **WHEN** the player clicks `+` or `-` for a role, **THE SYSTEM SHALL** adjust that role’s manual target within the bounds of the total drone pool.  
  **Acceptance:** store and UI tests verify counts cannot go below `0` or above `droneCount` when combined.

- **WHEN** total manual role targets sum to less than the number of drones, **THE SYSTEM SHALL** distribute the remaining drones evenly across miner, builder, and explorer, with leftover priority `MINER`, then `BUILDER`, then `EXPLORER`.  
  **Acceptance:** deterministic unit tests verify example distributions such as remainder `1 -> +1 miner`, remainder `2 -> +1 miner, +1 builder`, remainder `5 -> +2 miner, +2 builder, +1 explorer`.

- **WHEN** drone count changes, **THE SYSTEM SHALL** recompute effective role targets deterministically and keep the total effective targets equal to `droneCount`.  
  **Acceptance:** tests verify recomputation after drone purchase and world reset.

- **WHEN** drones are dispatched to work, **THE SYSTEM SHALL** use persistent role assignment to decide whether a drone should prioritize mining, building, or exploration, while still keeping transient movement/action state separate.  
  **Acceptance:** ECS/system tests verify miners prefer mining work, builders prefer blueprint/frame/panel work, and explorers enter the exploration loop.

- **WHEN** research is generated, **THE SYSTEM SHALL** derive it from explorer-role drones rather than from generic idle fallback behavior.  
  **Acceptance:** `ExplorerSystem` regression tests verify unassigned fallback patrol does not generate research.

- **WHEN** the role allocator is presented in the HUD, **THE SYSTEM SHALL** show both player control and resulting allocation clearly enough that the user can understand the current swarm split at a glance.  
  **Acceptance:** component tests verify the HUD shows role labels, counts, `+` / `-` buttons, and remaining auto-fill context.

## Proposed Architecture Changes

1. **Store-level manual role targets**
   - Add a store shape such as:
     - `manualDroneRoleTargets.miner`
     - `manualDroneRoleTargets.builder`
     - `manualDroneRoleTargets.explorer`
   - Expose increment/decrement actions per role.

2. **Pure allocation helper**
   - Add a pure helper that computes:
     - manual totals,
     - unassigned remainder,
     - automatic even split,
     - final effective role targets.
   - Keep this logic deterministic and easy to test.

3. **Persistent ECS role assignment**
   - Add a persistent field such as `roleAssignment?: 'MINER' | 'BUILDER' | 'EXPLORER'`.
   - Keep this separate from action state like `MOVING_TO_MINE` and `MOVING_TO_BUILD`.

4. **Role allocation system or helper pass**
   - Add a deterministic allocator pass before `BrainSystem`, or extract role allocation into a dedicated system.
   - Stable assignment should prefer low churn, ideally by sorting drones by `id` and only rebalancing when targets change.

5. **Brain / Explorer system updates**
   - `BrainSystem` should route drones according to `roleAssignment`.
   - `ExplorerSystem` should count explorer-role drones in the exploration loop.
   - `ADVANCED_EXPLORER` should explicitly say it boosts assigned explorers.

6. **HUD role panel**
   - Add a compact “Swarm Roles” card near the top resource bar.
   - Each row should show:
     - role label,
     - effective count,
     - optional manual/auto breakdown,
     - `-` and `+` buttons.
   - Show remaining unassigned pool or auto-fill summary so the player can understand why totals changed.

## Proposed Allocation Rules

Given:

- `totalDrones`
- manual targets `miner`, `builder`, `explorer`

Compute:

1. `manualTotal = miner + builder + explorer`
2. `unassigned = max(0, totalDrones - manualTotal)`
3. `baseAuto = floor(unassigned / 3)`
4. give `baseAuto` to each role
5. distribute the remainder one at a time in priority order:
   - first extra goes to `MINER`
   - second extra goes to `BUILDER`
   - third extra goes to `EXPLORER`

Example with `10` drones and manual targets `miner: 2, builder: 1, explorer: 0`:

- manual total = `3`
- unassigned = `7`
- even split = `2 / 2 / 2`
- remainder `1` goes to `MINER`
- final effective targets = `MINER 5`, `BUILDER 3`, `EXPLORER 2`

## UI Notes

The HUD already shows resources, drone count, and upgrade/settings controls in `src/components/HUD.tsx`, so the role allocator should live there instead of in a hidden modal.

Recommended presentation:

- a compact inline card or stacked panel called **Swarm Roles**,
- one row each for **Miner**, **Builder**, and **Explorer**,
- tactile `-` and `+` buttons sized like existing HUD actions,
- an explicit readout such as `3 manual · 2 auto · 5 total` when space allows,
- subtle color coding:
  - miner = amber/red,
  - builder = cyan/blue,
  - explorer = teal.

## Test Strategy (TDD)

### Red

1. Add failing unit tests for the allocation helper covering balanced and odd-remainder cases.
2. Add failing store tests for increment/decrement bounds and reset semantics.
3. Add failing HUD tests for the role rows and `+` / `-` controls.
4. Add failing ECS tests showing role assignments influence `BrainSystem` dispatch.
5. Add failing `ExplorerSystem` tests proving only explorer-role drones generate research.

### Green

1. Implement manual target state and allocation helper.
2. Add persistent role assignment and deterministic rebalance logic.
3. Update `BrainSystem`, `ExplorerSystem`, and `HUD`.
4. Update upgrade copy and role documentation.

### Refactor

1. Consolidate terminology: `role target`, `role assignment`, and `state` should each mean one thing.
2. Keep allocator logic pure and reusable.
3. Surface role info in the debug panel if it improves inspection.

## Risks and Mitigations

- **Risk:** assignments churn every frame and produce unstable drone behavior.  
  **Mitigation:** rebalance deterministically and only when targets or population change.

- **Risk:** manual builder targets feel wasteful when nothing is available to build.  
  **Mitigation:** keep this explicit in the UI and evaluate fallback borrowing only as a later design choice.

- **Risk:** the player may not understand the difference between manual targets and auto-fill.  
  **Mitigation:** show the breakdown and the auto-fill rule in the panel copy or tooltip text.

## Out of Scope

- Dedicated drone classes.
- Separate drone meshes or art per role.
- Per-drone click-selection and individual assignment.
- Advanced fallback borrowing rules between roles in the same change.

## Implementation Outcome (2026-03-08)

- Added manual HUD role targets for `MINER`, `BUILDER`, and `EXPLORER` with `+` / `-` controls.
- Added deterministic auto-fill distribution for unassigned drones with remainder priority `MINER -> BUILDER -> EXPLORER`.
- Added persistent `roleAssignment` on drone entities, distinct from transient task state.
- Updated `BrainSystem` so builder drones build, miner drones mine, and explorer drones stay in the exploration loop.
- Updated `ExplorerSystem` so only explorer-role drones generate research.
- Updated `ADVANCED_EXPLORER` copy and synced gameplay / architecture docs.
