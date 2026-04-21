# Architecture

## Overview

Skhemata Runtime Triage Agent is split into a Next.js frontend and a FastAPI backend. The frontend renders the operator experience; the backend owns persistence, state transitions, event history, mock tool execution, and approval handling.

The project is local-first. SQLite is the only datastore, and every runtime operation is backed by fixture data rather than real infrastructure.

```text
Operator browser
  -> Next.js dashboard
  -> FastAPI API
  -> Agent state machine
  -> Mock local tools
  -> SQLite runs/events
```

## Frontend

The frontend was already generated and lives in `frontend/`. It remains a Next.js app with dashboard routes for:

- `/` dashboard summary
- `/runs` run list
- `/runs/new` create-run form
- `/runs/[id]` run detail, timeline, evidence, hypotheses, approval flow, and final report

Targeted integration changes were limited to:

- `frontend/lib/api.ts` for backend calls
- `frontend/lib/types.ts` for expanded backend state
- page-level data fetching and client polling
- approve/reject wiring through the existing `ApprovalPanel`

The UI does not implement authentication, account state, or cloud configuration.

## Backend

The backend lives in `backend/app/`.

- `main.py` defines the FastAPI API layer.
- `db.py` manages SQLite tables for runs and events.
- `runtime.py` implements the deterministic agent state machine.
- `tools.py` exposes mock local tools.
- `schemas.py` defines request and response models.
- `fixtures/scenarios.json` contains scenario data and expected remediation actions.

The API layer stays thin. It validates input, loads or updates run state, and asks the runtime to continue work where appropriate.

## Persistence Model

SQLite stores two tables:

- `runs`: current aggregate state for each run
- `events`: append-only timeline events for each run

The run record persists:

- run id
- tenant
- region
- goal/problem description
- status
- current step
- selected scenario
- observations
- hypotheses
- tool results
- proposed actions
- approval state
- checkpoints
- errors
- final summary

JSON fields are serialized into SQLite text columns. This keeps the assessment implementation explicit and easy to inspect without adding an ORM.

## Runtime

The agent is a state machine, not a chatbot wrapper. It advances through fixed named steps:

```text
intake
plan
inspect_metrics
inspect_logs
inspect_deployments
inspect_worker_health
update_hypothesis
decide_action
approval_gate
execute_action
verify
summarize
```

Each step persists output before moving to the next step. This makes runs resumable because the current step, checkpoints, events, and aggregate state are stored after every meaningful transition.

The runtime pauses at `approval_gate` with:

- `status = awaiting_approval`
- `approval_state = pending`
- a proposed remediation action
- an approval timeline event

`approve` marks the action approved, resumes from `execute_action`, verifies recovery, and writes a final summary.

`reject` marks the action rejected, records the operator decision, and ends the run without executing remediation.

## Mock Tools

The local tool surface is:

- `get_tenant_health_summary`
- `get_metrics_snapshot`
- `get_recent_logs`
- `get_recent_deployments`
- `get_worker_health`
- `rollback_deployment`
- `restart_worker`
- `failover_route`

Tools read deterministic fixture data and return structured results. Remediation tools do not modify real systems; they return mocked control-plane responses.

## Scenario Selection

Scenario selection is based on goal text keywords:

- deployment regression -> rollback deployment
- unhealthy worker -> restart worker
- overloaded model pool -> fail over route

This is intentionally simple and testable. In a production system, this decision would likely combine richer telemetry, rule-based constraints, and model-assisted ranking.

## API Design

The API supports the core operator workflow:

- create a run
- list runs
- inspect run details
- fetch timeline events
- approve remediation
- reject remediation
- resume in-progress work
- cancel a run

The frontend polls run details while a run is active. This avoids introducing WebSockets or SSE for the assessment while still showing live progress.

## Tradeoffs

- Background execution uses a local Python thread for simplicity. This is sufficient for local assessment, but a production system would use a durable worker queue.
- SQLite JSON text fields keep persistence easy to inspect, but a larger system would normalize selected entities or use typed JSON columns where available.
- Scenario matching is deterministic keyword selection rather than probabilistic reasoning. This keeps tests stable and avoids paid APIs.
- CORS is limited to local frontend origins.

## Verification

Backend tests cover:

- creating a run
- reaching the approval gate
- approving and completing a run
- rejecting and persisting the rejected state
- selecting the correct remediation by scenario

Frontend verification uses TypeScript and Next production build checks.
