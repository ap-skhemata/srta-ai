from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parents[1] / "runtime.sqlite3"


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                tenant TEXT NOT NULL,
                region TEXT NOT NULL,
                goal TEXT NOT NULL,
                problem_description TEXT NOT NULL,
                status TEXT NOT NULL,
                current_step TEXT NOT NULL,
                scenario TEXT NOT NULL,
                approval_state TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                observations TEXT NOT NULL,
                hypotheses TEXT NOT NULL,
                tool_outputs TEXT NOT NULL,
                proposed_actions TEXT NOT NULL,
                checkpoints TEXT NOT NULL,
                errors TEXT NOT NULL,
                final_summary TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                metadata TEXT,
                FOREIGN KEY(run_id) REFERENCES runs(id)
            )
            """
        )
        conn.commit()


JSON_FIELDS = {
    "observations",
    "hypotheses",
    "tool_outputs",
    "proposed_actions",
    "checkpoints",
    "errors",
}


def _decode_run(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    for field in JSON_FIELDS:
        data[field] = json.loads(data[field])
    data["timeline"] = list_events(data["id"])
    return data


def create_run(data: dict[str, Any]) -> None:
    payload = data.copy()
    payload.pop("timeline", None)
    for field in JSON_FIELDS:
        payload[field] = json.dumps(payload[field])

    columns = ", ".join(payload.keys())
    placeholders = ", ".join(f":{key}" for key in payload)
    with connect() as conn:
        conn.execute(f"INSERT INTO runs ({columns}) VALUES ({placeholders})", payload)
        conn.commit()


def update_run(run_id: str, updates: dict[str, Any]) -> None:
    payload = updates.copy()
    for field in JSON_FIELDS.intersection(payload):
        payload[field] = json.dumps(payload[field])
    payload["id"] = run_id
    assignments = ", ".join(f"{key} = :{key}" for key in payload if key != "id")
    with connect() as conn:
        conn.execute(f"UPDATE runs SET {assignments} WHERE id = :id", payload)
        conn.commit()


def get_run(run_id: str) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
    return _decode_run(row) if row else None


def list_runs() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM runs ORDER BY created_at DESC").fetchall()
    return [_decode_run(row) for row in rows]


def add_event(run_id: str, event: dict[str, Any]) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO events (id, run_id, timestamp, type, title, description, metadata)
            VALUES (:id, :run_id, :timestamp, :type, :title, :description, :metadata)
            """,
            {
                **event,
                "run_id": run_id,
                "metadata": json.dumps(event.get("metadata")) if event.get("metadata") else None,
            },
        )
        conn.commit()


def list_events(run_id: str) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, timestamp, type, title, description, metadata FROM events WHERE run_id = ? ORDER BY timestamp ASC",
            (run_id,),
        ).fetchall()
    events = []
    for row in rows:
        event = dict(row)
        event["metadata"] = json.loads(event["metadata"]) if event["metadata"] else None
        events.append(event)
    return events
