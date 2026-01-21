# GitHub Copilot Instructions — stellar-shell

This repository uses a progressive disclosure model for agent guidance. 

**Primary Entrypoint**: Please refer to [AGENTS.md](../AGENTS.md) for core directives, stack information, and links to specialized guidance.

## Core Rules
- **Memory Bank**: All tasks must be tracked in `/memory`.
- **TDD**: RED → GREEN → REFACTOR is mandatory.
- **Architecture**: Maintain the Logic/Render separation defined in `BvxEngine.ts`.
- **Validation**: Use `pnpm test` for unit verification.

---
If any section is unclear or you want a different level of detail (examples, tests, or PR checklist expanded), tell me which parts to expand and I'll iterate. ✅
