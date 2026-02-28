# Agent Workflow & TDD

## Spec-Driven Workflow

We follow a 6-phase spec-driven loop: **Analyze → Design → Implement → Validate → Reflect → Handoff**.
See [docs/instructions/spec-driven-workflow-v1.instructions.md](.github/instructions/spec-driven-workflow-v1.instructions.md) for full details.

### 1. Memory Bank Management

- **Persistence**: Use `/memory/` to track requirements, designs, and tasks.
- **IDs**: Assign unique `DES###` and `TASK###`. Check `COMPLETED/` folders to avoid collisions.
- **Active Context**: Keep `memory/activeContext.md` and `memory/progress.md` updated in real-time.

### 2. TDD Cycle (RED → GREEN → REFACTOR)

- **RED**: Write a failing test first. Use deterministic/seeded inputs for procedural logic.
- **GREEN**: Implement minimal code to pass.
- **REFACTOR**: Improve design while keeping tests green.
- **Subagents**: Use `.github/agents/tdd-*.agent.md` for guidance.

### 3. Agent Behavior Expectations

- **Handoff (REQUIRED)**: Update `/docs/ARCHITECTURE` (TEC/DEC/GAME) and Memory Bank task files upon completion.
- **Docs Scan (REQUIRED)**: Before closing a task, scan `/docs` and `/memory` for inconsistencies. Fix small issues or file a task for larger ones.
- **Validation**: Ensure `pnpm test` passes before submitting.

### 4. PR & Handoff Checklist

- [ ] Goal clearly stated.
- [ ] Logic/Render separation respected.
- [ ] Worker-based meshing flow respected: `needsUpdate` → `ChunkSystem` → `MesherWorkerPool` → `meshData`.
- [ ] Tests cover new behaviors.
- [ ] Architecture docs (TEC/DEC/GAME) updated.
- [ ] **Doc sync verified**: `/docs/AGENTS/` and `/docs/ARCHITECTURE/` file paths and component names match current implementation.
