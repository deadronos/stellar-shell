# TASK021 — Add Favicon to Eliminate 404

## Goal

Add a favicon to `index.html` so browsers no longer request a missing `/favicon.ico`.

## Background

`index.html` contains no favicon `<link>`. Every page load triggers a 404 request, which clutters dev-server logs and looks unfinished.

## Implementation

1. Add an inline SVG favicon `<link>` to `index.html` using a simple emoji or shape.
2. No new asset files or dependencies.

## Acceptance Criteria

- [ ] `index.html` includes a valid favicon `<link>`.
- [ ] Loading the dev server no longer produces a `/favicon.ico` 404.
- [ ] `pnpm build` still passes.

## Design

DES011-maintenance-fixes-bundle
