from __future__ import annotations

import time
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import db
from app.main import app


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test-runtime.sqlite3")
    with TestClient(app) as test_client:
        yield test_client


def create_run(client: TestClient, goal: str = "checkout latency after deployment regression") -> dict:
    response = client.post(
        "/api/runs",
        json={
            "tenant": "acme-corp",
            "region": "us-east-1",
            "goal": goal,
        },
    )
    assert response.status_code == 200
    return response.json()


def wait_for_status(client: TestClient, run_id: str, status: str, timeout: float = 8.0) -> dict:
    deadline = time.time() + timeout
    while time.time() < deadline:
        run = client.get(f"/api/runs/{run_id}").json()
        if run["status"] == status:
            return run
        time.sleep(0.1)
    pytest.fail(f"run {run_id} did not reach {status}")


def test_create_run_persists_initial_state(client: TestClient):
    run = create_run(client)

    assert run["id"].startswith("run-")
    assert run["tenant"] == "acme-corp"
    assert run["region"] == "us-east-1"
    assert run["goal"] == "checkout latency after deployment regression"
    assert run["scenario"] == "deployment_regression"
    assert run["status"] in {"pending", "running", "awaiting_approval"}

    listed = client.get("/api/runs").json()
    assert any(item["id"] == run["id"] for item in listed)


def test_run_reaches_approval_gate(client: TestClient):
    run = create_run(client)
    gated = wait_for_status(client, run["id"], "awaiting_approval")

    assert gated["approval_state"] == "pending"
    assert gated["proposed_actions"]
    assert gated["proposed_actions"][0]["type"] == "rollback_deployment"
    assert any(event["type"] == "approval_request" for event in gated["timeline"])
    assert gated["current_step"].startswith("Rollback checkout-api")


def test_approve_resumes_and_completes(client: TestClient):
    run = create_run(client)
    gated = wait_for_status(client, run["id"], "awaiting_approval")

    response = client.post(f"/api/runs/{gated['id']}/approve", json={"comment": "approved for test"})
    assert response.status_code == 200
    assert response.json()["status"] == "running"

    completed = wait_for_status(client, run["id"], "completed")
    assert completed["approval_state"] == "approved"
    assert completed["final_summary"]
    assert completed["proposed_actions"][0]["status"] == "executed"
    assert any(tool["tool_name"] == "rollback_deployment" for tool in completed["tool_outputs"])


def test_reject_records_state_correctly(client: TestClient):
    run = create_run(client)
    gated = wait_for_status(client, run["id"], "awaiting_approval")

    response = client.post(f"/api/runs/{gated['id']}/reject", json={"comment": "too risky"})
    assert response.status_code == 200
    rejected = response.json()

    assert rejected["status"] == "failed"
    assert rejected["approval_state"] == "rejected"
    assert rejected["proposed_actions"][0]["status"] == "rejected"
    assert "Operator rejected" in rejected["final_summary"]
    assert any(event["title"] == "Action Rejected" for event in rejected["timeline"])


@pytest.mark.parametrize(
    ("goal", "scenario", "action_type"),
    [
        ("checkout latency after deployment regression", "deployment_regression", "rollback_deployment"),
        ("analytics worker is stuck and queue depth is rising", "unhealthy_worker", "restart_worker"),
        ("model pool overloaded and inference requests timing out", "overloaded_model_pool", "failover_route"),
    ],
)
def test_scenario_based_remediation_selection(client: TestClient, goal: str, scenario: str, action_type: str):
    run = create_run(client, goal)
    gated = wait_for_status(client, run["id"], "awaiting_approval")

    assert gated["scenario"] == scenario
    assert gated["proposed_actions"][0]["type"] == action_type
