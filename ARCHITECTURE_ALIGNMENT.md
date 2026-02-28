# Architecture Alignment Report

**Repository:** `deadronos/stellar-shell`  
**Date:** 2026-02-28  
**Scope:** Gameplay mechanics, formulas, and implementation-vs-design alignment across docs, runtime systems, and tests.

## Executive Summary

The project is broadly healthy and internally consistent at runtime.

- Validation passed: `pnpm test` (**28 files, 130 tests**), `pnpm run lint` (0 errors, 2 pre-existing warnings), `pnpm run build` (success).
- Core gameplay loops (mining, construction, orbit-aware interaction, progression metrics, prestige flow, upgrades, and research generation) are implemented and covered by tests.
- A small set of **design drift items** and one **logic robustness issue** should be handled in a Phase 2 alignment pass.

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

## Alignment Gaps / Drift ⚠️

1. **Auto-blueprint placement strategy differs from design intent**
   - Current logic advances along `+X` (`(0,0,0)`, `(1,0,0)`, ...).
   - DES005 intent describes deterministic outward/radius-constrained expansion.

2. **Auto-Replicator is not toggleable after purchase**
   - Gameplay design text describes toggleable behavior; implementation is always active when upgrade is owned.

3. **Rare-material sourcing differs from design narrative**
   - Design text implies deep/core sourcing.
   - Runtime uses noise-threshold `RARE_ORE` placement not strictly depth-gated.

4. **Energy tick robustness under large delta**
   - `EnergySystem` processes one 1-second tick per frame with `if (accumulatedTime >= 1)`.
   - Under frame hitches, this can undercount expected progression.

5. **Documentation contract mismatch (upgrade persistence semantics)**
   - Runtime resets upgrades on System Jump, but some early design wording suggests persistent upgrades.

## Phase 2 Alignment Objectives

- Replace linear auto-blueprint expansion with deterministic radius-aware expansion rules.
- Add explicit Auto-Replicator runtime toggle and UI control.
- Decide and codify rare-material policy (depth-biased vs free-noise distribution), then align generator + docs.
- Make energy ticking hitch-safe using catch-up ticking semantics.
- Normalize gameplay docs to reflect intended persistence/reset rules.

## Traceability

- **Design Plan:** `memory/designs/DES007-phase2-architecture-alignment-pass.md`
- **Execution Task:** `memory/tasks/TASK008-phase2-architecture-alignment-pass.md`
