# Stellar Shell Agent Guide

A React + TypeScript voxel space engine using React Three Fiber, powered by `@astrumforge/bvx-kit` and Miniplex ECS.

## Core Stack

- **Runtime**: Node 18+
- **Manager**: `pnpm`
- **Build**: Vite (React 19)
- **Testing**: Vitest

## Primary Directives

1. **Spec-Driven Workflow**: Every feature starts with a Design (`DES###`) and Task (`TASK###`) in the [Memory Bank](/memory).
2. **TDD Required**: Follow RED → GREEN → REFACTOR strictly.
3. **Architecture First**: Respect the [Logic/Render split](docs/AGENTS/ARCHITECTURE.md).

## Progressive Disclosure

For detailed guidance, consult these specialized files:

- 🚀 **[Workflow & TDD](docs/AGENTS/WORKFLOW.md)**: Spec-Driven loop, Memory Bank, and Handoff rules.
- 🏗️ **[Architecture](docs/AGENTS/ARCHITECTURE.md)**: Logic/Render separation and core systems.
- 📏 **[Conventions](docs/AGENTS/CONVENTIONS.md)**: Voxel math, ECS patterns, and performance rules.
- 📖 **[Agent Playbook](docs/AGENTS/PLAYBOOK.md)**: Implementation examples, file maps, and dev commands.

## Quick Commands

- `pnpm install` — Install dependencies
- `pnpm dev` — Start development server
- `pnpm test` — Run unit tests
- `pnpm build` — Production build
