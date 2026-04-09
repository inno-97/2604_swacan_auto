# Backend — CLAUDE.md

## Overview

Express + TypeScript API server acting as a **metamodel-based architecture information engine**.
Not a simple CRUD store — it enforces containment rules, manages runtime bindings, and separates latest state from event history.

## Tech Stack

- Express 5 + TypeScript (strict)
- better-sqlite3 with WAL mode
- Socket.IO for real-time push to frontend
- ULID for all internal IDs
- Vitest for testing

## Directory Structure (planned)

```
src/
├── index.ts              # Server bootstrap
├── db/
│   ├── schema.sql        # DDL
│   ├── seed.sql          # Default metamodel data
│   └── connection.ts     # SQLite setup (WAL, pragmas)
├── routes/
│   ├── auth.ts           # Login, session
│   ├── metamodel.ts      # Semantic types, properties, containment rules
│   ├── notation.ts       # Notation registry, palette
│   ├── model.ts          # Architecture model/view CRUD
│   ├── runtime.ts        # Latest state, event queries
│   ├── agent.ts          # Agent batch ingest API
│   └── admin.ts          # Admin endpoints
├── services/
│   ├── containment.ts    # Containment rule validation
│   ├── binding.ts        # Runtime binding + stale management
│   ├── state.ts          # Latest state upsert, event log append
│   ├── event-group.ts    # Event storm grouping
│   └── cleanup.ts        # 7-day log retention, 24h debug log cleanup
├── middleware/
│   ├── auth.ts           # User auth + role check
│   └── agent-auth.ts     # Agent token auth
├── socket/
│   └── realtime.ts       # Socket.IO event broadcasting
└── types/
    └── index.ts          # Shared type definitions
```

## Key Requirements (from spec)

### Metamodel (BE-001, 4.1–4.4)
- Manages: namespace, semantic type, property definition, association definition, containment rule, notation definition, palette group, metamodel version.
- Required types: PhysicalServer, VirtualMachine, SoftwareProcess, ExecutionThread, MonitoringAgent, CommunicationLink.
- Metamodel versions: draft → published → deprecated. Published is immutable.
- Views are pinned to `metamodel_version_id`.

### Notation Registry (BE-002, 5.1–5.2)
- Each notation has `notation_id` (ULID) + `notation_code` (human-readable).
- Linked to a semantic_type_id.
- Stores: shape kind, default size, line style, background, label position, palette visibility, group capability, containment eligibility.
- Frontend dynamically builds palette from registry API.

### Containment (BE-003, 4.3)
- PhysicalServer can contain VirtualMachine, SoftwareProcess, MonitoringAgent.
- VirtualMachine can contain SoftwareProcess, MonitoringAgent.
- SoftwareProcess can contain ExecutionThread.
- ExecutionThread cannot have children.
- MonitoringAgent connects via `monitors` association, not containment.
- Validation at both save and update time.

### Architecture Model (BE-006, 6.1–6.4)
- Model (logical structure) and view (visual layout) are separate.
- One model → many views.
- Each element: element_id, semantic_type_id, notation_id, parent_element_id, display_name, instance_mode, cardinality_scope, expected_min, expected_max, status_rule_set_id.
- instance_mode: single, replicated, pool, cluster.
- View copy shares model, duplicates layout. Diagram copy duplicates both.

### Runtime Binding (BE-007, 7.1–7.2)
- target_id is the logical identifier; PID is transient.
- Binding includes selector, last match result, last seen time.
- Missing process → `stale` (not deleted). Rematch → restart/rematch event.
- Group state = expected_count vs actual_count.

### Latest State & Events (BE-008, 8.1–8.4)
- `latest_state` table: upsert-centric for fast reads.
- `event_log` table: append-only.
- Events: process start/stop/restart, agent heartbeat anomaly, binding change, admin metamodel change, user edit.
- 7-day retention for structured operational logs.
- Event storm mitigation: group repeated events by (agent_id, event_type, target_id, severity, time window). Store raw + grouped separately. Frontend shows grouped by default.

### Agent Ingest API (BE-010, 9.1–9.2)
- HTTPS + JSON batch POST.
- Agent authenticates with agent_id + pre-shared token.
- Dedup by (agent_id, boot_id, seq).
- Response: ack_seq, accepted_count, server_time.
- Partial accept supported.

### MonitoringAgent (BE-004, BE-005, BE-009)
- Managed as semantic type with: status, last_heartbeat_at, queue_depth, last_sent_seq, last_ack_seq, monitored_target_count.
- Contained in PhysicalServer or VirtualMachine.
- Observes targets via `monitors` association.

### Admin (BE-011, 10.1–10.4)
- Metamodel CRUD (draft only editable).
- Session list with user mode and current view.
- Log query: last 7 days, filter by timestamp/severity/component/message/object_id.
- Debug payload viewer (separate from operational logs, 24h retention).

### SQLite Strategy (BE-012, 11.1–11.3)
- WAL mode mandatory.
- Batch/serialized writes for latest_state and events.
- Millisecond precision for all timestamps.
- No long-term time series storage.
- Debug payload stored in separate table, 24h retention, sensitive data masked.

## Conventions

- Raw SQL via better-sqlite3, no ORM.
- All IDs are ULID text.
- Timestamps stored as INTEGER (ms since epoch).
- Use transactions for batch operations.
- Validation errors return 400 with structured error body.
- Agent API errors return structured JSON with ack info where possible.
