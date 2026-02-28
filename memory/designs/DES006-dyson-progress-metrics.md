# DES006 — Dyson Progress Metrics and Completion Tracking

**Created:** 2026-02-28  
**Author:** automation (GitHub Copilot)

## Summary

Add explicit Dyson progression metrics computed from voxel world state, surface those metrics in the HUD, and use them as a prestige-gating signal.

## Requirements (EARS style)

- **WHEN** the game needs Dyson progression status, **THE SYSTEM SHALL** compute frame/panel/shell/blueprint counts from world voxels.
- **WHEN** the HUD is visible, **THE SYSTEM SHALL** show Dyson progress metrics including milestone progress.
- **WHEN** prestige readiness is evaluated, **THE SYSTEM SHALL** require Dyson milestone readiness in addition to energy threshold.

## Minimal Design

- Add `computeDysonProgress()` to `BvxEngine` that scans chunked world state and returns counts + milestone flags.
- Add `dysonProgress` to Zustand store so systems and UI share a single progression snapshot.
- Update build/mining systems to refresh `dysonProgress` after voxel mutations.
- Render compact Dyson metrics in HUD and gate the System Jump button with `dysonProgress.prestigeReady`.
