# Product Context — stellar-shell

**Why this project exists:**

- Demonstrate a small, maintainable voxel engine using modern React and Three.js tools.
- Provide a sandbox for experimenting with voxel meshing, ECS patterns, and performance tuning in a single-page app.

**Problems it solves:**

- Shows how to separate simulation (BvxEngine, voxel storage) from rendering (React Three Fiber) to keep update cycles manageable and performant.
- Provides a compact reference implementation for chunked voxel worlds, instanced rendering patterns, and simple AI agents (drones).

**User experience goals:**

- Fast, responsive 3D scene with stable FPS on typical developer machines.
- Minimal, discoverable controls for moving a player and observing drone behaviors.
- Clean developer ergonomics: clear engine interface (BvxEngine), testable systems, and small, focused React components.

**Acceptance criteria:**

- Project is buildable with `npm run build` and runnable with `npm run preview`.
- Core features are covered by small unit tests where applicable (engine logic, meshing, ECS systems).
