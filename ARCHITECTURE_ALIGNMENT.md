# Architecture Alignment Report

**Repository:** `deadronos/stellar-shell`  
**Date:** 2026-03-08  
**Scope:** Gameplay mechanics, formulas, and implementation-vs-design alignment across docs, runtime systems, and tests.

## Executive Summary

The project is broadly healthy and internally consistent at runtime.

- Validation passed: `pnpm test` (**29 files, 148 tests**), `pnpm run lint` (success), `pnpm run build` (success).
- Core gameplay loops (mining, construction, orbit-aware interaction, progression metrics, prestige flow, upgrades, and research generation) are implemented and covered by tests.
- Most previously identified Phase 2 implementation gaps are now resolved. The main remaining drift is concentrated in two open design questions that now have explicit GitHub tracking.

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
- **Research and advanced explorer mechanic**
  - Research accumulation by exploring drones and `ADVANCED_EXPLORER` multiplier are implemented and tested.

## Resolved Since Phase 2 ✅

- **Auto-Replicator runtime toggle** now exists in settings and is respected by `EnergySystem`.
- **Energy tick robustness** now uses catch-up ticking (`while (accumulatedTime >= 1.0)`).
- **Auto-blueprint traversal** is deterministic and radius-aware, rather than a simple `+X` linear walk.
- **Upgrade reset semantics** are reflected by the runtime and now documented more clearly.

## Remaining Design Drift / Open Questions ⚠️

- **Auto-blueprint growth shape remains a design decision.** The runtime seeds a spherical Dyson skeleton, but automated follow-up growth still expands on the `y = 0` plane. Follow-up decision is tracked in GitHub issue #49.

- **Research generation model needs explicit product direction.** The runtime grants research from drones in the `EXPLORING` state. Design language still implies a stronger "Explorer drone" identity than the code currently enforces. Follow-up decision is tracked in GitHub issue #50.

- **Rare-resource narrative should stay explicit about current behavior.** Runtime rare ore placement is seeded-noise-driven, not depth-gated. Gameplay docs should continue to avoid implying a strict deep-core rule unless that mechanic is intentionally added.

## Current Alignment Objectives

- Decide whether auto-blueprint growth should remain planar, become shell-aware, or use a hybrid frontier model.
- Decide whether research should come from dedicated explorer drones, explicit swarm roles, or the current passive exploration model.
- Keep gameplay and architecture docs synchronized with whichever decisions land.

## Traceability

- **Design Plan:** `memory/designs/DES007-phase2-architecture-alignment-pass.md`
- **Execution Task:** `memory/tasks/TASK008-phase2-architecture-alignment-pass.md`
- **Open Design Issues:** `#49` (auto-blueprint growth shape), `#50` (research model / explorer role)
