# TASK020 — Remove Unused `multithreading` Dependency

## Goal

Remove the `multithreading` package from production dependencies.

## Background

`multithreading` is listed in `package.json` `dependencies` but is not imported by any source or test file. The project uses its own `MesherWorkerPool` and Web Worker implementation for concurrency.

## Implementation

1. Run `pnpm remove multithreading`.
2. Commit the resulting changes to `package.json` and `pnpm-lock.yaml`.

## Acceptance Criteria

- [ ] `multithreading` no longer appears in `package.json` `dependencies`.
- [ ] `pnpm-lock.yaml` is updated accordingly.
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` still pass.

## Design

DES011-maintenance-fixes-bundle
