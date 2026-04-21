from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .runtime import approve as approve_run
from .runtime import cancel as cancel_run
from .runtime import create_initial_run, reject as reject_run
from .runtime import start_or_continue
from .schemas import CreateRunRequest, DecisionRequest, Run, TimelineEvent


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="Skhemata Runtime Triage Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/runs", response_model=Run)
def create_run(payload: CreateRunRequest, background_tasks: BackgroundTasks) -> dict:
    goal = payload.goal or payload.problem_description
    if not goal:
        raise HTTPException(status_code=422, detail="goal or problem_description is required")

    run = create_initial_run(payload.tenant, payload.region, goal, payload.scenario)
    background_tasks.add_task(start_or_continue, run["id"])
    return run


@app.get("/api/runs", response_model=list[Run])
def list_runs() -> list[dict]:
    return db.list_runs()


@app.get("/api/runs/{run_id}", response_model=Run)
def get_run(run_id: str) -> dict:
    run = db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    return run


@app.get("/api/runs/{run_id}/events", response_model=list[TimelineEvent])
def get_events(run_id: str) -> list[dict]:
    if not db.get_run(run_id):
        raise HTTPException(status_code=404, detail="run not found")
    return db.list_events(run_id)


@app.post("/api/runs/{run_id}/approve", response_model=Run)
def approve(run_id: str, payload: DecisionRequest | None = None) -> dict:
    run = approve_run(run_id, payload.comment if payload else None)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    return run


@app.post("/api/runs/{run_id}/reject", response_model=Run)
def reject(run_id: str, payload: DecisionRequest | None = None) -> dict:
    run = reject_run(run_id, payload.comment if payload else None)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    return run


@app.post("/api/runs/{run_id}/resume", response_model=Run)
def resume(run_id: str, background_tasks: BackgroundTasks) -> dict:
    run = db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    if run["status"] in {"completed", "failed", "cancelled", "awaiting_approval"}:
        return run
    background_tasks.add_task(start_or_continue, run_id)
    return run


@app.post("/api/runs/{run_id}/cancel", response_model=Run)
def cancel(run_id: str) -> dict:
    run = cancel_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="run not found")
    return run
