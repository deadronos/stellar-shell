# [TASK001] - Memory Bank + TDD & Vitest Setup

**Status:** Completed
**Added:** 2026-01-03
**Updated:** 2026-01-03

## Original Request
Create the Memory Bank scaffolding and adopt a strict TDD workflow (RED → GREEN → REFACTOR). Install and configure `vitest`, add initial unit tests for `BvxEngine`, and document the TDD + Memory Bank process in the repository.

## Requirements (EARS-style)
- WHEN contributors or agents need project-level context, THE SYSTEM SHALL provide it via `/memory` files (designs, tasks, activeContext, progress) [Acceptance: files exist and include meaningful brief content].
- WHEN features are implemented, THE TEAM SHALL follow a TDD cycle (RED → GREEN → REFACTOR) and record steps and agent runs in task files [Acceptance: at least one task includes RED/GREEN/REFACTOR entries and links to test names].
- WHEN tests are added, THE TESTS SHALL be deterministic for procedural generation (seeded or small sizes) and runnable via `npm test` [Acceptance: `npm test` runs and tests pass].

## Acceptance Criteria
- Memory Bank core files exist and a TASK001 entry documents the setup.
- `vitest` is installed and configured; `package.json` has `test` and `test:watch` scripts.
- Tests include basic `setBlock/getBlock` behavior and `generateChunkMesh()` verification.
- CI will run `npm test` on PRs (no CI changes required once `test` exists).

## Implementation Plan
- Memory Bank:
  - Create core files under `/memory` and `/memory/tasks/TASK001-*.md` (done).
  - Add `DES001` design capturing architecture/TDD guidance (merged into DES001). 
- Testing & Tooling:
  - Add `vitest` devDependency and `vitest.config.ts` (node env).
  - Add `test` and `test:watch` scripts to `package.json`.
  - Add `tests/bvx-engine.spec.ts` covering `setBlock/getBlock` and `generateChunkMesh`.
  - Run tests locally and verify CI uses `npm test`.
- Documentation:
  - Update `.github/copilot-instructions.md` and `spec-driven-workflow-v1.instructions.md` to require TDD and Memory Bank usage.

## Progress Log
### 2026-01-03
- Memory Bank files created and seeded: `DES001`, `TASK001` (this file), `tasks/_index.md` updated.
- Vitest installed and configured; `vitest.config.ts` added.
- `tests/bvx-engine.spec.ts` added and passes locally (`vitest run`).
- `.github/copilot-instructions.md` and spec-driven workflow updated to mandate RED→GREEN→REFACTOR and Memory Bank usage.

## Subtasks
- [x] Create `/memory` scaffolding and initial design (`DES001`) - Completed
- [x] Add `vitest` and `tests/bvx-engine.spec.ts` - Completed
- [x] Update `.github` instructions to reference TDD agents and Memory Bank - Completed

## Notes
- Prefer deterministic inputs for procedural generation tests (seeded or tiny radii).
- Record RED/GREEN/REFACTOR steps and any agent decisions in the task's progress log.
- When creating new `DES###` or `TASK###` files, check `/memory/*` and `/memory/*/COMPLETED/` to avoid collisions and use sequential numbering.

