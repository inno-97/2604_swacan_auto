# Software Architecture Runtime Monitoring System — Claude Implementation

## Project Purpose

This is one of two parallel implementations of the same software specification.
Another developer is building the same system using a different AI assistant.
The goal is twofold:

1. Build a fully functional Software Architecture Runtime Monitoring System per the spec.
2. Enable side-by-side comparison of code, architecture decisions, and implementation quality between AI-assisted codebases.

All implementation lives under `claude/`. The `docs/` directory at repo root contains the shared specification — treat it as read-only.

## Architecture

```
claude/
├── frontend/   # React + Vite + TypeScript (UI, canvas editor, monitoring view)
├── backend/    # Express + TypeScript (API server, metamodel engine, realtime)
└── agent/      # Node.js + TypeScript (Linux monitoring daemon)
```

## Tech Stack

| Layer    | Stack                                                        |
| -------- | ------------------------------------------------------------ |
| Frontend | React 19, Vite, TypeScript, Socket.IO Client, interact.js, inline SVG |
| Backend  | Express 5, TypeScript, better-sqlite3 (WAL), Socket.IO, ULID |
| Agent    | Node.js, TypeScript, systeminformation, better-sqlite3, ULID |
| Test     | Vitest (all three projects)                                  |

## Key Design Decisions

- **Single language**: entire stack is Node.js + TypeScript for shared types and easier comparison.
- **SQLite everywhere**: backend uses SQLite with WAL mode for the main DB; agent uses SQLite for the local outbox.
- **ULID identifiers**: all internal IDs use ULID (text). Human-readable codes are stored alongside.
- **Millisecond timestamps**: all `occurred_at`, `received_at`, `updated_at` stored as integer ms since epoch.
- **Spec fidelity**: follow the spec in `docs/` closely. Do not add features beyond what the spec requires.

## Conventions

- Write all code in TypeScript with strict mode.
- Use ES modules (`"type": "module"` in package.json).
- Prefer named exports over default exports.
- Use Vitest for all testing; colocate test files as `*.test.ts` next to source files.
- No ORM — write raw SQL with better-sqlite3 for clarity and comparison.
- Keep dependencies minimal; justify any new dependency.
- Commit messages and code comments in English.

## Specification Documents

Located at repo root `docs/`:

- `software-architecture-runtime-monitoring-mvp-plan.md` — full product spec and MVP scope
- `mvp-requirements-analysis.md` — prioritized requirement IDs (C-xxx, FE-xxx, BE-xxx, AG-xxx)
- `backend-detailed-requirements.md` — backend detailed requirements
- `agent-detailed-requirements.md` — agent detailed requirements
