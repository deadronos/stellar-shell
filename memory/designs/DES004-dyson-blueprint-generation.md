# DES004 — Dyson blueprint generation around star origin

**Status:** Implemented  
**Owner:** Copilot  
**Created:** 2026-02-27

## Overview

Auto-generate Phase 0 Dyson skeleton blueprint nodes around the central star at `(0,0,0)` so drones can immediately consume ghost build targets through the existing construction flow.

## Design Decisions

- Generate blueprint nodes with a deterministic spherical distribution (Fibonacci sphere) to approximate geodesic coverage.
- Place nodes as `BLUEPRINT_FRAME` voxels and register them in `BlueprintManager` so they are both visible and buildable.
- Keep all construction behavior unchanged by reusing `BrainSystem` target selection and `ConstructionSystem` blueprint consumption.
- Regenerate the same blueprint skeleton after a system jump.

## Validation

- Added unit test asserting generated blueprint nodes are near the intended sphere radius around origin and are rendered as ghost voxels.
- Added construction test asserting drones consume blueprint targets and convert them to `FRAME`.
