# TASK015 — Remove Duplicate pnpm Pin

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Linked Design:** None (workflow reliability follow-up)

## Original Request

Fix the deploy workflow after `pnpm/action-setup@v4` reported a version mismatch between the workflow and `packageManager` in `package.json`.

## Scope

- Remove the duplicated pnpm version declaration from the workflow.
- Keep the workflows using the repo's `packageManager` pin as the single source of truth.
- Validate the modified workflow YAML files.

## Planning Outcome

- Let `pnpm/action-setup` infer pnpm from `packageManager` in `package.json`.
- Avoid specifying a second version in workflow YAML.

## Implementation Plan (TDD)

### Red

1. Confirm the current workflow still specifies a pnpm version alongside `packageManager`.

### Green

1. Remove the explicit `version` input from `pnpm/action-setup@v4`.

### Refactor

1. Validate the YAML and update memory notes for the new workflow pattern.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID | Description | Status | Updated | Notes |
| --- | --- | --- | --- | --- |
| 15.1 | Confirm version mismatch source | Complete | 2026-03-23 | The workflows specified `version: 10.29.3` while `packageManager` already pinned pnpm 10.29.3 with integrity metadata. |
| 15.2 | Remove explicit version pin | Complete | 2026-03-23 | Removed the `version` input from `pnpm/action-setup@v4` in both CI and deploy workflows. |
| 15.3 | Validate workflow files | Complete | 2026-03-23 | `git diff --check` and `pnpm exec prettier --check` passed on the edited workflow files. |
| 15.4 | Sync memory/docs | Complete | 2026-03-23 | Added task/index and repo-memory notes for the packageManager-as-source-of-truth pattern. |

## Progress Log

### 2026-03-23

- Identified that `pnpm/action-setup@v4` was being passed a second pnpm version through `version: 10.29.3`.
- Removed the redundant workflow version pin so the action uses the version encoded in `package.json`'s `packageManager` field.
- Confirmed the workflow YAML remains clean with `git diff --check` and Prettier.

## Validation

- `git diff --check`
- `pnpm exec prettier --check .github/workflows/ci.yml .github/workflows/deploy-pages-on-tag.yml`
