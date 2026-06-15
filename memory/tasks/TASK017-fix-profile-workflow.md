# TASK017 — Fix or Remove Broken Performance Profiling Workflow

## Goal

Remove the broken `.github/workflows/profile.yml` workflow that cannot succeed in the current pnpm-based repository.

## Background

The workflow runs `npm ci` with `cache: 'npm'`, but the repository has no `package-lock.json` and uses `pnpm-lock.yaml`. It also calls `node scripts/profile.js`, but `scripts/profile.js` does not exist. Triggering this workflow would fail immediately.

## Implementation

1. Delete `.github/workflows/profile.yml`.
2. Run validation to ensure no references remain.

## Acceptance Criteria

- [ ] `.github/workflows/profile.yml` is removed.
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` still pass.

## Design

DES011-maintenance-fixes-bundle
