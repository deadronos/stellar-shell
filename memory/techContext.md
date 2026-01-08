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
- Tests: Vitest (`npm test`)
    - Unit tests for `BvxEngine` and ECS Systems.
- Linting/format: ESLint + Prettier

**Dependencies of note:**

- `@react-three/fiber`, `three` — rendering
- `@astrumforge/bvx-kit` — voxel storage (wrapped by `BvxEngine`)
- `miniplex` — Entity Component System (Core architecture)

**Environment & run commands:**

- Install: `npm ci`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Test: `npm test`
- Typecheck: `npm run typecheck`

**Testing strategy:**

- **Unit Tests**:
    - `tests/bvx-engine.spec.ts`: Verification of Voxel Data operations and integration with ECS (Chunk Entities).
    - Future: Add tests for `ChunkSystem` and other logic systems.
- **Integration**:
    - Ensure ECS state correctly drives R3F rendering (verified via manual checks currently).
