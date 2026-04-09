# Frontend — CLAUDE.md

## Overview

React + Vite + TypeScript SPA providing:

1. **Architecture Editor Canvas** — SVG-based diagram editor with containment rules
2. **Monitoring View** — real-time runtime state overlay on architecture diagrams
3. **Admin Console** — metamodel, sessions, logs, agent status management
4. **Auth** — login, workspace/view list

## Tech Stack

- React 19 + TypeScript (strict)
- Vite for build/dev
- interact.js for drag/drop/resize on SVG canvas
- Socket.IO Client for real-time event streaming
- Inline SVG for all canvas rendering (no canvas 2D or WebGL)

## Directory Structure (planned)

```
src/
├── components/       # Reusable UI components
│   ├── canvas/       # SVG canvas, nodes, edges, palette
│   ├── monitoring/   # Overlay, event panel, badges
│   └── admin/        # Admin console views
├── hooks/            # Custom React hooks
├── services/         # API client, socket client
├── store/            # State management
├── types/            # Shared TypeScript interfaces
└── utils/            # Helpers
```

## Key Requirements (from spec)

### Canvas Editor (FE-002 ~ FE-005)
- Palette is dynamically built from backend notation registry — no hardcoded element types.
- Containment rules enforced: only valid parent-child placements allowed.
- Node position uses parent coordinate system.
- Edge routing info (source/target anchor, control points) must be persisted.
- Views can be saved and duplicated.

### Monitoring View (FE-006 ~ FE-008)
- Overlays latest runtime state on architecture diagram.
- Color, badge, text changes driven by backend-computed visualization rules.
- Group abstraction shown as `×N` badge or stacked notation.
- Event panel at bottom shows recent events.
- MonitoringAgent displayed as a distinct element with heartbeat, connection status, queue depth.

### Real-time Communication (C-006)
- Primary: Socket.IO event stream for live updates.
- Secondary: periodic snapshot polling for resync after disconnects.
- Stale/heartbeat status must be visible to user.

### Admin (FE-009)
- Metamodel viewer/editor (draft only editable).
- Active session list (user, mode, current view, last activity).
- Operational logs (last 7 days, filterable by severity/component).
- Backend health stats (connections, event throughput, DB state).

## Conventions

- All canvas rendering via inline SVG — no `<canvas>` element.
- Notation shapes defined by backend; frontend renders based on shape descriptor.
- New SVG primitives may require frontend code, but within MVP's defined set, notation is dynamic.
- Test with Vitest + React Testing Library.
- API calls go through `services/api.ts`; socket events through `services/socket.ts`.

## Backend API Dependency

Frontend consumes these backend APIs (to be defined):
- Auth (login, session)
- Notation registry (palette data)
- Metamodel (types, containment rules, properties)
- Architecture model CRUD (elements, views, layouts, edges)
- Latest state (runtime overlay data)
- Event log (recent events for panel)
- Admin endpoints (sessions, logs, agent status)
