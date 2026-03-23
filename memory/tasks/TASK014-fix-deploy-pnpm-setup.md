# TASK014 — Fix Deploy pnpm Setup

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Linked Design:** None (workflow reliability fix)

## Original Request

Fix the deploy workflow so `actions/setup-node@v6` no longer fails with `Unable to locate executable file: pnpm`.

## Scope

- Remove the pnpm setup ordering issue in the GitHub Actions workflows.
- Keep the workflow reliable on GitHub-hosted runners.
- Update docs/memory if workflow behavior changes.

## Planning Outcome

- Use an explicit pnpm installation step before any `pnpm` commands.
- Avoid requesting pnpm caching from `actions/setup-node` before pnpm exists on PATH.
- Apply the same fix to sibling workflows that use the same setup pattern.

## Implementation Plan (TDD)

### Red

1. Inspect the workflows using `actions/setup-node@v6` with pnpm caching.

### Green

1. Remove the setup-node pnpm cache dependency.
2. Install pnpm explicitly before dependency installation.

### Refactor

1. Keep the workflow minimal and readable.
2. Update the task index and memory notes after validation.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID | Description | Status | Updated | Notes |
| --- | --- | --- | --- | --- |
| 14.1 | Inspect failing workflow pattern | Complete | 2026-03-23 | Confirmed `actions/setup-node@v6` was trying to use pnpm caching before pnpm existed on PATH. |
| 14.2 | Patch pnpm installation order | Complete | 2026-03-23 | Replaced `cache: pnpm` on `actions/setup-node` with explicit `pnpm/action-setup` installation before dependency install. |
| 14.3 | Validate workflow files | Complete | 2026-03-23 | Confirmed the modified workflow YAML formats cleanly with `git diff --check` and Prettier. |
| 14.4 | Sync memory/docs | Complete | 2026-03-23 | Updated task index, active context, progress notes, and repo memory with the new workflow pattern. |

## Progress Log

### 2026-03-23

- Investigated the deploy workflow failure reported by GitHub Actions.
- Confirmed the root cause is `actions/setup-node@v6` being asked to cache `pnpm` before pnpm is installed on the runner.
- Identified the same setup pattern in CI, so the fix should be applied consistently there too.
- Reworked both CI and deploy workflows to install pnpm explicitly with `pnpm/action-setup@v4` before running `pnpm install`.
- Validated the edited workflow files with `git diff --check` and `pnpm exec prettier --check`.

## Validation

- `git diff --check`
- `pnpm exec prettier --check .github/workflows/ci.yml .github/workflows/deploy-pages-on-tag.yml`
