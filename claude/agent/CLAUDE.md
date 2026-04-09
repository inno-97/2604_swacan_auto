# Agent — CLAUDE.md

## Overview

Node.js + TypeScript Linux monitoring daemon. Non-invasive — reads from `/proc`, `/sys`, and OS-provided interfaces only. No ptrace, no code injection, no application hooks.

Collects host and process metrics, sends them to the backend as JSON batch payloads via HTTPS, and maintains a local SQLite outbox for reliability.

## Tech Stack

- Node.js + TypeScript (strict)
- systeminformation for host/process data collection
- better-sqlite3 for local outbox (WAL mode)
- ULID for identifiers
- Vitest for testing

## Directory Structure (planned)

```
src/
├── index.ts              # Daemon entry point, lifecycle
├── config.ts             # Configuration loading
├── collector/
│   ├── host.ts           # Host-level metrics (cpu, mem, disk, network)
│   ├── process.ts        # Process-level metrics per target
│   └── self-state.ts     # Agent self-state generation
├── selector/
│   └── matcher.ts        # target_id selector evaluation (cmdline regex, exe path, name, pid)
├── outbox/
│   ├── schema.sql        # Local SQLite DDL
│   ├── db.ts             # SQLite connection + setup
│   ├── writer.ts         # Enqueue payloads
│   └── reader.ts         # Dequeue for sending, ack cleanup
├── transport/
│   ├── sender.ts         # HTTPS batch POST to backend
│   ├── ack.ts            # ack_seq processing, partial accept handling
│   └── backoff.ts        # Retry with exponential backoff
├── scheduler/
│   └── loop.ts           # Heartbeat, snapshot, flush scheduling
└── types/
    └── index.ts          # Shared type definitions
```

## Key Requirements (from spec)

### Core Role (AG-001 ~ AG-009)
- Daemon process on Linux, one per host.
- Collects host + process metrics and sends as JSON batch to backend.
- On backend failure, stores in local SQLite outbox; replays on recovery.
- Reports own state as MonitoringAgent runtime data.
- Only collects and delivers — alert judgment and visualization are backend's job.

### Selectors (5.1–5.2)
- Monitoring targets managed by `target_id` (stable logical ID, not PID).
- Selector types (all required):
  - `cmdline_regex` — command line regex match
  - `exe_path` — executable path exact match
  - `process_name` — process name exact match
  - `pid` — PID exact match
- Each target has `single` or `multi` matching mode.
- Selectors re-evaluated every collection cycle.

### Multi-Process (5.3)
- One selector can find multiple PIDs.
- Group summary: actual_count, running_count, cpu_total, cpu_avg, memory_total, restart_detected.
- Instance detail: pid, state, start_time, cpu_usage, memory_rss.

### Host Collection (6.1)
- hostname, boot_id, uptime, load_average
- cpu_usage, memory_total/used/free
- disk_total/used/free, network_rx_bytes/tx_bytes

### Process Collection (6.2)
- pid, ppid, name, exe_path, cmdline, state, start_time, uptime
- cpu_usage, memory_rss, memory_vms, thread_count, fd_count
- io_read_bytes, io_write_bytes

### Timing (7.1–7.3)
- Heartbeat: every 5s.
- Host/process snapshot: every 5–10s.
- Outbox flush: every 1–2s when connected.
- Backoff on failure.
- Immediate events: process start/stop/restart, target not_found, connection recovery.
- Snapshot vs event separation: snapshots for current state, events for history.

### Self-State (8)
- agent_id, agent_pid, agent_version, start_time, heartbeat_time
- backend_connection_status, outbox_queue_depth
- last_sent_seq, last_ack_seq, monitored_target_count, host_boot_id

### Payload Structure (9.1–9.3)
- Batch payload fields: agent_id, boot_id, seq_start, seq_end, sent_at, items[].
- Each item: seq, payload_type, occurred_at, target_id, payload body.
- payload_type: host_snapshot, process_snapshot, process_event, agent_state.
- seq is monotonically increasing per boot.
- Idempotent: same seq on retransmit for backend dedup.
- Handle partial accept from backend.

### Local SQLite Outbox (10.1–10.3)
- Tables: outbox, agent_meta, target_cache, (optional) debug_transport_log.
- outbox: seq, payload_json, occurred_at, retry_count, acked_at.
- agent_meta: agent info, last seq, last ack.
- target_cache: target_id, recent PIDs, last seen, previous CPU sample for delta calc.
- WAL mode.
- Write-ahead: always write to outbox first, then send.
- Only remove after backend ack.
- On restart, resume from unacked outbox entries.

### Stale Handling (11)
- Missing PID is not immediate target deletion.
- Provide state transition info so backend can determine stale.
- New PID matching same target → restart/rematch info.
- Emit `not_found` event after target missing for configured duration.

### Debug Mode (12)
- Configurable, off by default.
- Includes trace_id in payloads when enabled.
- Logs request/response metadata (timing, status, size) locally.
- Never logs auth tokens in plaintext.

### Configuration (13)
- Required settings: backend_endpoint, agent_id, auth_token, heartbeat_interval, snapshot_interval, retry_backoff, target list with selectors, debug_mode.
- MVP: config changes require restart.

## Conventions

- All timestamps in milliseconds (Date.now()).
- Outbox is the single source of truth — never send without writing to outbox first.
- Secrets must never appear in logs, even in debug mode.
- Use `systeminformation` where convenient, fall back to direct `/proc` reads for Linux-specific data.
- Test selectors, grouping, outbox lifecycle, payload serialization, and debug masking.
