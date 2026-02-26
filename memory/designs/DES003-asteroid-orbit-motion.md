# DES003 — Optional Asteroid Orbit Motion

**Status:** Implemented  
**Owner:** Copilot  
**Created:** 2026-02-26

## Overview

Add optional deterministic orbital motion for asteroid chunks around the star, while preserving mining/building behavior by keeping voxel-space operations stable and translating world-space interaction targets by the same orbit offset.

## Design Decisions

- Keep voxel storage static in `BvxEngine`; only move rendered chunk entity positions.
- Compute one deterministic orbit offset from elapsed time and store-configured parameters.
- Apply that offset to:
  - chunk render positions (`AsteroidOrbitSystem`)
  - drone build/mine world targets
  - player raycast world-to-voxel conversion
- Expose orbit controls in settings so behavior can be toggled or tuned for performance.

## Validation

- Unit tests for deterministic offset helper and chunk-position orbit updates.
- ECS tests confirming mining/building still complete when orbit is enabled.
