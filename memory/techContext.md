# Tech Context — stellar-shell

**Stack:**

- Language: TypeScript 5.x targeting ES2022
- Bundler/dev server: Vite
- UI: React
- 3D: Three.js + React Three Fiber
- ECS: miniplex
- State: Zustand

**Dev tooling:**

- Node 18 (CI uses Node 18)
- Tests: currently no test script; consider Vitest for unit tests of engine logic
- Linting/format: repo follows Markdown/Docs conventions; add linters if needed for code style

**Dependencies of note:**

- `@react-three/fiber`, `three` — rendering
- `@astrumforge/bvx-kit` or local `BvxEngine` for voxel storage/meshing
- `miniplex` for ECS

**Environment & run commands:**

- Install: `npm ci`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

**Testing strategy recommendation:**

- Use Vitest and small unit tests for `BvxEngine` (set/get blocks, chunk generation), meshing helpers, and ECS systems. Keep tests deterministic (use seeds for procedural generation where necessary).
