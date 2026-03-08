# Architecture Alignment Report

**Repository:** `deadronos/stellar-shell`  
**Date:** 2026-03-08  
**Scope:** Gameplay mechanics, formulas, and implementation-vs-design alignment across docs, runtime systems, and tests.

## Executive Summary

The project is broadly healthy and internally consistent at runtime.

- Validation passed: `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test` (**31 files, 164 tests**).
- Core gameplay loops (mining, construction, orbit-aware interaction, progression metrics, prestige flow, upgrades, research generation, and swarm role allocation) are implemented and covered by tests.
- Most previously identified Phase 2 implementation gaps are now resolved. The main remaining drift is concentrated in the auto-blueprint growth-shape design question.

## What Is Aligned ✅

- **Mining loop and yields**
  - Drone mining progression scales with prestige and `MINING_SPEED_1`.
  - Deposit yields for surface/core/rare blocks are implemented and tested.
- **Construction loop**
  - `BLUEPRINT_FRAME -> FRAME -> PANEL -> SHELL` with `FRAME_COST` and `SHELL_COST` is functioning.
- **Energy model**
  - Derived from world state via `PANEL_ENERGY_RATE` and `SHELL_ENERGY_RATE`.
- **Orbit model integration**
  - Orbit offsets are deterministic and consistently applied to chunk rendering, drone targets, and player voxel-space ray interactions.
- **Dyson progression metrics**
  - World-derived metrics are computed and surfaced in HUD; prestige visibility uses milestone readiness.
- **Research and swarm role allocation**
  - HUD-driven manual role targets for miners, builders, and explorers are implemented.
  - Remaining drones are auto-balanced evenly with remainder priority `miner -> builder -> explorer`.
  - Research accumulation now comes from explorer-role drones in the `EXPLORING` loop, and `ADVANCED_EXPLORER` boosts those assigned explorers.

## Resolved Since Phase 2 ✅

- **Auto-Replicator runtime toggle** now exists in settings and is respected by `EnergySystem`.
- **Energy tick robustness** now uses catch-up ticking (`while (accumulatedTime >= 1.0)`).
- **Auto-blueprint traversal** is deterministic and radius-aware, rather than a simple `+X` linear walk.
- **Upgrade reset semantics** are reflected by the runtime and now documented more clearly.
- **Research role ambiguity** is resolved by the new swarm role allocator and explicit explorer assignment model from issue `#50`.

## Remaining Design Drift / Open Questions ⚠️

- **Auto-blueprint growth shape remains a design decision.** The runtime seeds a spherical Dyson skeleton, but automated follow-up growth still expands on the `y = 0` plane. Follow-up decision is tracked in GitHub issue #49.

- **Rare-resource narrative should stay explicit about current behavior.** Runtime rare ore placement is seeded-noise-driven, not depth-gated. Gameplay docs should continue to avoid implying a strict deep-core rule unless that mechanic is intentionally added.

## Current Alignment Objectives

- Decide whether auto-blueprint growth should remain planar, become shell-aware, or use a hybrid frontier model.
- Keep gameplay and architecture docs synchronized with whichever decisions land.

## Traceability

- **Design Plan:** `memory/designs/DES007-phase2-architecture-alignment-pass.md`
- **Execution Task:** `memory/tasks/TASK008-phase2-architecture-alignment-pass.md`
- **Open Design Issues:** `#49` (auto-blueprint growth shape)
- **Resolved Follow-up:** `memory/designs/DES010-drone-role-allocation-model.md` + `memory/tasks/TASK011-drone-role-allocation-model.md`
