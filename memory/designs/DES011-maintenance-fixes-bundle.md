# DES011 — Maintenance Fixes Bundle

## Overview

A single design bundling five small, independent maintenance fixes identified during a project review. Each item is tracked by its own TASK### file and can be reviewed/merged as one branch.

## Fixes

### 1. Repair or remove broken Performance Profiling workflow
- **File:** `.github/workflows/profile.yml`
- **Problem:** Uses `npm ci` and `cache: 'npm'`, but the project is pnpm-based with no `package-lock.json`. Also invokes `node scripts/profile.js`, which does not exist.
- **Decision:** Remove the workflow. The project has no profiling script, no baselines, and no current plan to maintain this job. Removing it avoids CI confusion and a guaranteed failure path.

### 2. Reconcile dev server port documentation
- **Files:** `vite.config.ts`, `README.md`
- **Problem:** `vite.config.ts` sets `server.port: 3000`, but `README.md` points users to `localhost:5173`. The server actually binds to 3000.
- **Decision:** Update `README.md` to reference `localhost:3000` and briefly note that Vite is configured to use port 3000.

### 3. Implement documented keyboard tool shortcuts
- **Files:** `src/components/PlayerController.tsx`, `README.md`, tests
- **Problem:** README documents `1` = Laser and `2` = Frame (Build), but `PlayerController.tsx` only handles WASD/Space/Shift and mouse buttons.
- **Decision:** Add `Digit1`/`Digit2` key handlers in `PlayerController.tsx` that call `useStore.getState().setTool(...)`. Keep README consistent.

### 4. Remove unused `multithreading` dependency
- **File:** `package.json`
- **Problem:** `multithreading` is listed in `dependencies` but never imported in `src/` or `tests/`. The engine uses its own Web Worker pool.
- **Decision:** `pnpm remove multithreading` and commit the lockfile update.

### 5. Add favicon to eliminate 404
- **File:** `index.html`
- **Problem:** No favicon is declared, so browsers request `/favicon.ico` and the dev server returns 404.
- **Decision:** Add an inline SVG favicon (emoji-based) to avoid adding asset files. This is dependency-free and works for GitHub Pages.

### 6. Exclude `dist` from TypeScript compilation (incidental)
- **File:** `tsconfig.json`
- **Problem:** `tsconfig.json` had no `exclude`, so the default `**/*` pattern included generated files in `dist/`, causing `pnpm typecheck` to fail whenever a build artifact existed locally.
- **Decision:** Add `"exclude": ["node_modules", "dist"]` to `tsconfig.json`.

## Acceptance Criteria

- [x] `pnpm test` passes.
- [x] `pnpm typecheck` passes.
- [x] `pnpm lint` passes.
- [x] `pnpm build` passes.
- [x] `README.md` is internally consistent about dev port and controls.
- [x] New keyboard shortcut behavior is covered by a unit test.
- [x] `multithreading` no longer appears in `dependencies`.
- [x] Profile workflow is removed from `.github/workflows/`.
- [x] `tsconfig.json` excludes `dist`.

## Traceability

- Tasks: TASK017, TASK018, TASK019, TASK020, TASK021
