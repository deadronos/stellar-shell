# DES007 — Phase 2 Architecture Alignment Pass

**Status:** Implemented  
**Owner:** Copilot  
**Created:** 2026-02-28

## Overview

Phase 2 aligns gameplay implementation with declared design intent while preserving existing stable behavior. The pass focuses on deterministic blueprint growth, explicit automation controls, economy semantics clarity, and tick robustness under variable frame times.

## Problem Statement

The current runtime is stable and tested, but several mechanics drift from documented intent:

- Auto-blueprint expansion is linear on +X rather than radius-aware deterministic expansion.
- Auto-Replicator cannot be toggled once purchased.
- Rare-resource generation policy is ambiguous between depth/core and noise-based placement.
- Energy accumulation can undercount under large `delta` values.
- Gameplay docs contain mixed messaging around persistence/reset semantics.

## Requirements (EARS)

- **WHEN** auto-blueprint mode is enabled, **THE SYSTEM SHALL** place at most one valid blueprint target per interval using a deterministic, radius-aware scan order.  
  **Acceptance:** deterministic tests verify sequence and skip behavior for occupied cells.

- **WHEN** Auto-Replicator is purchased, **THE SYSTEM SHALL** allow users to enable or disable it at runtime without losing ownership.  
  **Acceptance:** store + UI tests verify toggle state and drone auto-purchase only when enabled.

- **WHEN** resource-generation policy is evaluated, **THE SYSTEM SHALL** use a single documented rule for rare materials and keep docs/tests consistent with that rule.  
  **Acceptance:** generator tests and gameplay docs reflect identical rule language.

- **WHEN** frame time spikes occur (`delta > 1.0`), **THE SYSTEM SHALL** process all elapsed energy/automation ticks without dropping progression.  
  **Acceptance:** tests verify catch-up behavior for multi-second deltas.

- **WHEN** System Jump semantics are documented, **THE SYSTEM SHALL** consistently state which currencies/upgrades reset or persist.  
  **Acceptance:** docs and UI labels agree with runtime behavior.

## Proposed Architecture Changes

1. **AutoBlueprintSystem strategy update**
   - Replace linear cursor with deterministic candidate stream ordered by radius then stable tie-break (e.g., lexicographic).
   - Keep one successful placement per interval.
   - Preserve current integration via `BlueprintManager` and `BLUEPRINT_FRAME`.

2. **Auto-Replicator mode split**
   - Keep `upgrades.AUTO_REPLICATOR` as ownership flag.
   - Add store flag `autoReplicatorEnabled` for runtime behavior toggle.
   - Update `EnergySystem` to require both ownership and enabled state.

3. **Rare-resource policy codification**
   - Choose one policy:
     - **Option A:** depth-biased rare placement (core-weighted), or
     - **Option B:** noise-only placement with updated design docs.
   - Apply policy and align tests/docs.

4. **Energy tick catch-up**
   - Convert one-shot second tick into catch-up loop (`while accumulatedTime >= 1`) to process elapsed whole-second intervals.

5. **Documentation normalization**
   - Update gameplay/architecture notes with explicit reset/persist contracts.

## Test Strategy (TDD)

- **Red**
  - Add failing tests for deterministic radius-aware auto-blueprint ordering.
  - Add failing tests for Auto-Replicator enable/disable behavior.
  - Add failing tests for energy catch-up on large `delta`.
  - Add/adjust tests for selected rare-resource policy.

- **Green**
  - Implement minimal logic to satisfy each failing test.

- **Refactor**
  - Keep system boundaries intact (`BvxEngine` data layer, ECS systems logic layer, UI rendering layer).
  - Remove redundant comments and keep constants centralized.

## Risks and Mitigations

- **Risk:** Economy rebalance impact from rare-resource policy changes.  
  **Mitigation:** preserve constants where possible, isolate policy change, and verify with targeted tests.

- **Risk:** Auto-blueprint sequence changes may alter pacing.  
  **Mitigation:** gate by interval/radius constants and keep deterministic ordering for reproducible tuning.

## Out of Scope

- Major rendering pipeline changes.
- New prestige economy formulas beyond alignment fixes.
- Additional gameplay content unrelated to existing drift items.

## Implementation Outcome (2026-02-28)

- Implemented deterministic radius-aware auto-blueprint candidate traversal.
- Added runtime Auto-Replicator toggle semantics via store + settings UI + `EnergySystem` gating.
- Added catch-up ticking in `EnergySystem` (`while accumulatedTime >= 1`).
- Selected rare-resource **Option B** (noise-driven policy) and aligned docs/tests to this behavior.
