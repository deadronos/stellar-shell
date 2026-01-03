# AGENTS.md — Guidance for automated agents and assistants

Purpose: provide a short, predictable entrypoint for agents (Codex, Copilot, etc.) working on this repository. Agents should consult this file first, then follow `.github/copilot-instructions.md` for repository-specific rules and patterns.

Quick checklist for agents
- Read `AGENTS.md` then `.github/copilot-instructions.md` and `.github/instructions/spec-driven-workflow-v1.instructions.md`.
- Use the Memory Bank (`/memory`) for designs, tasks, and progress; prefer `/memory/designs/DES###-*.md` and `/memory/tasks/TASK###-*.md`.
- Enforce naming rules: use `DES###` and `TASK###` patterns and avoid number collisions (check `.../COMPLETED/` folders before creating a new ID).
- Follow TDD strictly (RED → GREEN → REFACTOR). Use the TDD agents as subagents when helpful:
  - `.github/agents/tdd-red.agent.md` — **TDD Red Phase - Write Failing Tests First**
  - `.github/agents/tdd-green.agent.md` — **TDD Green Phase - Make Tests Pass Quickly**
  - `.github/agents/tdd-refactor.agent.md` — **TDD Refactor Phase - Improve Quality & Security**

Agent behavior expectations
- Respect the spec-driven workflow and Memory Bank: create or update `DES###` and `TASK###` files for design and implementation work, and record decisions and agent outputs there.
- **On handoff (REQUIRED):** When a task or PR is handed off or merged, ensure related documentation is updated: add/update `/docs/ARCHITECTURE` artifacts (TEC/DEC/GAME), and update `/memory/designs/DES###` and `/memory/tasks/TASK###` with a short handoff note and links to the PR/commits. If docs are intentionally deferred, record the reason and assign an owner in the task file.

- **Docs scan (REQUIRED):** As part of handoff, scan `/docs` and `/memory` for out-of-date or inconsistent content. If issues are found, make small corrections directly when feasible or create a `TASK###` to track more substantial updates, assign an owner, and record the findings and planned actions in the task progress log and PR.
- When assigned an implementation task, prefer to add a small failing test (RED), write minimal code to satisfy it (GREEN), then refactor (REFACTOR). Record each step in the task progress log.
- If tests are added or modified, run the test suite (`npm test`) and ensure the suite remains green before suggesting merges.
- For potentially expensive operations (meshing, heavy loops), prefer suggesting worker-based or throttled solutions and document performance rationale in `DES###` and decision records (`/docs/ARCHITECTURE/DEC###-*.md`).

Quick references
- Copilot instructions: `.github/copilot-instructions.md`
- Spec-driven workflow: `.github/instructions/spec-driven-workflow-v1.instructions.md`
- Memory Bank instructions: `.github/instructions/memory-bank.instructions.md`
- TDD agents: `.github/agents/tdd-red.agent.md`, `.github/agents/tdd-green.agent.md`, `.github/agents/tdd-refactor.agent.md`

If anything is ambiguous, update the relevant Memory Bank task (`/memory/tasks/`) with findings and proposed next steps and ask for human clarification rather than guessing. Thank you.