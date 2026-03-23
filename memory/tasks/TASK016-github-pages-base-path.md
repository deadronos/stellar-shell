# TASK016 — GitHub Pages Base Path

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Linked Design:** None (deployment/runtime fix)

## Original Request

The deployed site at `https://deadronos.github.io/stellar-shell/` failed to load because production assets were being requested from the domain root instead of the repository subpath.

## Scope

- Configure Vite so production builds emit GitHub Pages-friendly asset URLs.
- Document the Pages base path for future maintainers.
- Verify the built HTML points to the repository subpath.

## Planning Outcome

- Use the repository name as the Vite base path in production builds.
- Keep local development on the root path for convenience.
- Add a short README note explaining the deployment base path.

## Implementation Plan (TDD)

### Red

1. Confirm the deployed page was requesting assets from `/assets/...` on the root domain.

### Green

1. Set Vite's production `base` to `/stellar-shell/`.
2. Confirm the generated `dist/index.html` points to `/stellar-shell/assets/...`.

### Refactor

1. Add a brief code comment and README note describing the GitHub Pages path.
2. Update memory notes for the deployment convention.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID | Description | Status | Updated | Notes |
| --- | --- | --- | --- | --- |
| 16.1 | Confirm Pages asset failure | Complete | 2026-03-23 | The live deployment requested `https://deadronos.github.io/assets/...`, which 404'd. |
| 16.2 | Set production base path | Complete | 2026-03-23 | Vite now uses `/stellar-shell/` as the base during production builds. |
| 16.3 | Verify generated HTML | Complete | 2026-03-23 | `pnpm build` produced `/stellar-shell/assets/...` URLs in `dist/index.html`. |
| 16.4 | Document deployment path | Complete | 2026-03-23 | Added a README note and an inline Vite comment. |

## Progress Log

### 2026-03-23

- Observed the deployed app requesting `index` bundle and CSS from the domain root instead of the repository subpath.
- Added a production-only Vite base path so GitHub Pages emits `/stellar-shell/assets/...` URLs.
- Added a short README note and code comment so future changes preserve the deployment path.
- Verified the generated build output points to the repository subpath.

## Validation

- `pnpm build`
