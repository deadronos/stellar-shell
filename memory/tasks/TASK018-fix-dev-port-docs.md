# TASK018 — Reconcile Dev Server Port Documentation

## Goal

Make `README.md` match the actual dev server port configured in `vite.config.ts`.

## Background

`vite.config.ts` sets `server.port: 3000`. `README.md` tells users to open `http://localhost:5173`, which is Vite's default and no longer correct for this project.

## Implementation

1. Update the "Running Locally" section in `README.md` to reference `http://localhost:3000`.
2. Add a short note that port 3000 is configured in `vite.config.ts`.

## Acceptance Criteria

- [ ] `README.md` points to `localhost:3000`.
- [ ] No contradictory port references remain in `README.md`.

## Design

DES011-maintenance-fixes-bundle
