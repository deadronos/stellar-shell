---
description: 'Specification-Driven Workflow v1 provides a structured approach to software development, ensuring that requirements are clearly defined, designs are meticulously planned, and implementations are thoroughly documented and validated.'
applyTo: '**'
---

# Spec-Driven Workflow (v1)

Receipt: “Follow a 6-phase spec-driven loop: Analyze → Design → Implement → Validate → Reflect → Handoff.”

This is a lightweight workflow to keep changes intentional, testable, and well-documented.

## Memory Bank Rules (Repo Convention)

- Store designs under `/memory/designs/` and tasks under `/memory/tasks/`.
- Keep IDs unique across both active and archived folders:
  - Designs: check `/memory/designs/` and `/memory/designs/COMPLETED/` before picking the next `DES###`.
  - Tasks: check `/memory/tasks/` and `/memory/tasks/COMPLETED/` before picking the next `TASK###`.
- Record decisions and progress in the relevant `TASK###` file as work proceeds.

Recommended placement:

- Requirements: `/memory/requirements.md`
- Design notes: `/memory/designs/DES###-*.md`
- Task plan + progress: `/memory/tasks/TASK###-*.md` and `/memory/tasks/_index.md`
- Current focus: `/memory/activeContext.md`

## Phase 1: Analyze

Write 2–5 testable requirements using EARS.

Template:

- WHEN <event>, THE SYSTEM SHALL <behavior>. [Acceptance: how to test]

If blocked or uncertain, explicitly estimate a confidence score and choose an execution strategy:

- High confidence (>85%): proceed with full plan.
- Medium confidence (66–85%): do a small PoC/MVP first with clear success criteria.
- Low confidence (<66%): research first (read code, search patterns, write a short research note), then re-run Analyze.

## Phase 2: Design

Create a short design note capturing:

- Architecture overview (components + responsibilities)
- Interfaces / public APIs (function signatures, schemas)
- Data flow (diagram if helpful)
- Error handling expectations
- Test strategy (what tests prove each requirement)

## Phase 3: Implement (TDD)

Use a strict RED → GREEN → REFACTOR loop for each small behavior.

- RED: add one failing test that describes the next behavior.
- GREEN: implement the minimum to pass.
- REFACTOR: improve quality without changing behavior; keep tests green.

Operational rules:

- Don’t write production code without a failing test first (when practical).
- Prefer deterministic tests for procedural systems (seed/small radius).
- Record notable decisions (tradeoffs, constraints, “why”) in the task file.

## Phase 4: Validate

- Run the narrow tests for the change, then the broader suite.
- Verify acceptance criteria from the EARS requirements.
- If performance-sensitive, capture a small baseline/measurement.

## Phase 5: Reflect

- Refactor for clarity and maintainability.
- Update docs and Memory Bank notes.
- Record technical debt explicitly if you chose a shortcut.

## Phase 6: Handoff

Provide a short handoff summary (PR description or task note):

- Goal: one line
- Key changes: main files/symbols
- Validation: commands/tests run
- Follow-ups: any debt or deferred docs
