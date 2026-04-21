from __future__ import annotations

import json
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Any

from . import db
from .tools import call_tool, load_scenarios, select_scenario

STEPS = [
    "intake",
    "plan",
    "inspect_metrics",
    "inspect_logs",
    "inspect_deployments",
    "inspect_worker_health",
    "update_hypothesis",
    "decide_action",
    "approval_gate",
    "execute_action",
    "verify",
    "summarize",
]


def now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def create_initial_run(tenant: str, region: str, goal: str, scenario: str | None = None) -> dict[str, Any]:
    scenario_name = select_scenario(goal, scenario)
    timestamp = now()
    run = {
        "id": new_id("run"),
        "tenant": tenant,
        "region": region,
        "goal": goal,
        "problem_description": goal,
        "status": "pending",
        "current_step": "intake",
        "scenario": scenario_name,
        "approval_state": "not_required",
        "created_at": timestamp,
        "updated_at": timestamp,
        "observations": [],
        "hypotheses": [],
        "tool_outputs": [],
        "proposed_actions": [],
        "checkpoints": [],
        "errors": [],
        "final_summary": None,
        "timeline": [],
    }
    db.create_run(run)
    record_event(run["id"], "status_change", "Run Created", "Incident triage run created and queued.")
    checkpoint(run["id"], "intake", {"goal": goal, "scenario": scenario_name})
    return db.get_run(run["id"])


def record_event(run_id: str, event_type: str, title: str, description: str, metadata: dict[str, Any] | None = None) -> None:
    db.add_event(
        run_id,
        {
            "id": new_id("evt"),
            "timestamp": now(),
            "type": event_type,
            "title": title,
            "description": description,
            "metadata": metadata,
        },
    )


def checkpoint(run_id: str, step: str, data: dict[str, Any]) -> None:
    run = db.get_run(run_id)
    if not run:
        return
    checkpoints = run["checkpoints"]
    checkpoints.append({"timestamp": now(), "step": step, "data": data})
    db.update_run(run_id, {"checkpoints": checkpoints, "updated_at": now()})


def start_or_continue(run_id: str) -> None:
    thread = threading.Thread(target=advance_until_blocked, args=(run_id,), daemon=True)
    thread.start()


def approve(run_id: str, comment: str | None = None) -> dict[str, Any] | None:
    run = db.get_run(run_id)
    if not run or run["status"] != "awaiting_approval":
        return run
    actions = run["proposed_actions"]
    if actions:
        actions[-1]["status"] = "approved"
    db.update_run(
        run_id,
        {
            "approval_state": "approved",
            "status": "running",
            "current_step": "execute_action",
            "proposed_actions": actions,
            "updated_at": now(),
        },
    )
    record_event(run_id, "status_change", "Action Approved", comment or "Operator approved the proposed remediation.")
    checkpoint(run_id, "approval_gate", {"decision": "approved", "comment": comment})
    start_or_continue(run_id)
    return db.get_run(run_id)


def reject(run_id: str, comment: str | None = None) -> dict[str, Any] | None:
    run = db.get_run(run_id)
    if not run or run["status"] != "awaiting_approval":
        return run
    actions = run["proposed_actions"]
    if actions:
        actions[-1]["status"] = "rejected"
    summary = "Operator rejected the proposed remediation. No risky action was executed."
    db.update_run(
        run_id,
        {
            "approval_state": "rejected",
            "status": "failed",
            "current_step": "summarize",
            "proposed_actions": actions,
            "final_summary": summary,
            "updated_at": now(),
        },
    )
    record_event(run_id, "status_change", "Action Rejected", comment or summary)
    checkpoint(run_id, "approval_gate", {"decision": "rejected", "comment": comment})
    return db.get_run(run_id)


def cancel(run_id: str) -> dict[str, Any] | None:
    run = db.get_run(run_id)
    if not run:
        return None
    db.update_run(run_id, {"status": "cancelled", "current_step": "cancelled", "updated_at": now()})
    record_event(run_id, "status_change", "Run Cancelled", "Operator cancelled the run.")
    checkpoint(run_id, "cancelled", {})
    return db.get_run(run_id)


def advance_until_blocked(run_id: str) -> None:
    while True:
        run = db.get_run(run_id)
        if not run or run["status"] in {"awaiting_approval", "completed", "failed", "cancelled"}:
            return

        try:
            next_step(run)
        except Exception as exc:
            latest = db.get_run(run_id)
            errors = latest["errors"] if latest else []
            errors.append(str(exc))
            db.update_run(run_id, {"status": "failed", "errors": errors, "current_step": "failed", "updated_at": now()})
            record_event(run_id, "status_change", "Run Failed", str(exc))
            return
        time.sleep(0.35)


def next_step(run: dict[str, Any]) -> None:
    step = run["current_step"]
    if run["status"] == "pending":
        db.update_run(run["id"], {"status": "running", "updated_at": now()})
        record_event(run["id"], "status_change", "Run Started", "Agent state machine started triage.")

    handlers = {
        "intake": step_intake,
        "plan": step_plan,
        "inspect_metrics": step_inspect_metrics,
        "inspect_logs": step_inspect_logs,
        "inspect_deployments": step_inspect_deployments,
        "inspect_worker_health": step_inspect_worker_health,
        "update_hypothesis": step_update_hypothesis,
        "decide_action": step_decide_action,
        "approval_gate": step_approval_gate,
        "execute_action": step_execute_action,
        "verify": step_verify,
        "summarize": step_summarize,
    }
    handlers[step](run)


def set_step(run_id: str, step: str) -> None:
    db.update_run(run_id, {"current_step": step, "updated_at": now()})
    checkpoint(run_id, step, {})


def append_observation(run: dict[str, Any], source: str, content: str, severity: str) -> None:
    observations = run["observations"]
    observations.append(
        {
            "id": new_id("obs"),
            "timestamp": now(),
            "source": source,
            "content": content,
            "severity": severity,
        }
    )
    db.update_run(run["id"], {"observations": observations, "updated_at": now()})
    record_event(run["id"], "observation", f"{source} observation", content)


def append_tool_output(run: dict[str, Any], tool_name: str, inputs: dict[str, Any], output: dict[str, Any], duration_ms: int) -> None:
    tool_outputs = run["tool_outputs"]
    tool_outputs.append(
        {
            "id": new_id("tool"),
            "timestamp": now(),
            "tool_name": tool_name,
            "input": inputs,
            "output": json.dumps(output, indent=2),
            "status": "success",
            "duration_ms": duration_ms,
        }
    )
    db.update_run(run["id"], {"tool_outputs": tool_outputs, "updated_at": now()})
    record_event(run["id"], "tool_execution", tool_name, f"Executed {tool_name}.")


def run_tool(run: dict[str, Any], tool_name: str, **extra: Any) -> dict[str, Any]:
    inputs = {"tenant": run["tenant"], "region": run["region"], "scenario": run["scenario"], **extra}
    output, duration_ms = call_tool(tool_name, **inputs)
    append_tool_output(run, tool_name, inputs, output, duration_ms)
    return output


def step_intake(run: dict[str, Any]) -> None:
    output = run_tool(run, "get_tenant_health_summary")
    append_observation(run, "tenant_health", output["summary"], "critical" if output["status"] == "degraded" else "info")
    set_step(run["id"], "plan")


def step_plan(run: dict[str, Any]) -> None:
    record_event(
        run["id"],
        "status_change",
        "Investigation Plan",
        "Plan: inspect metrics, logs, deployments, worker health, then choose a remediation.",
    )
    set_step(run["id"], "inspect_metrics")


def step_inspect_metrics(run: dict[str, Any]) -> None:
    output = run_tool(run, "get_metrics_snapshot")
    if output.get("latency_p99_ms", 0) > 1000:
        append_observation(run, "metrics", f"P99 latency is {output['latency_p99_ms']}ms.", "critical")
    if output.get("job_queue_depth", 0) > 1000:
        append_observation(run, "metrics", f"Job queue depth is {output['job_queue_depth']}.", "warning")
    if output.get("model_queue_depth", 0) > 500:
        append_observation(run, "metrics", f"Model queue depth is {output['model_queue_depth']}.", "critical")
    set_step(run["id"], "inspect_logs")


def step_inspect_logs(run: dict[str, Any]) -> None:
    output = run_tool(run, "get_recent_logs")
    append_observation(run, "logs", output["lines"][0], "critical")
    set_step(run["id"], "inspect_deployments")


def step_inspect_deployments(run: dict[str, Any]) -> None:
    output = run_tool(run, "get_recent_deployments")
    deployment = output["deployments"][0]
    append_observation(
        run,
        "deployments",
        f"{deployment['service']} is running {deployment['version']} deployed at {deployment['deployed_at']}.",
        "info",
    )
    set_step(run["id"], "inspect_worker_health")


def step_inspect_worker_health(run: dict[str, Any]) -> None:
    output = run_tool(run, "get_worker_health")
    severity = "critical" if output["status"] == "unhealthy" else "info"
    append_observation(run, "worker_health", output["notes"], severity)
    set_step(run["id"], "update_hypothesis")


def step_update_hypothesis(run: dict[str, Any]) -> None:
    scenario = load_scenarios()[run["scenario"]]
    hyp = scenario["hypothesis"]
    hypotheses = run["hypotheses"]
    hypotheses.append(
        {
            "id": new_id("hyp"),
            "timestamp": now(),
            "description": hyp["description"],
            "confidence": hyp["confidence"],
            "supporting_evidence": hyp["evidence"],
            "status": "confirmed",
        }
    )
    db.update_run(run["id"], {"hypotheses": hypotheses, "updated_at": now()})
    record_event(run["id"], "hypothesis", "Hypothesis Updated", hyp["description"])
    set_step(run["id"], "decide_action")


def step_decide_action(run: dict[str, Any]) -> None:
    scenario = load_scenarios()[run["scenario"]]
    action = scenario["action"]
    proposed = run["proposed_actions"]
    proposed.append(
        {
            "id": new_id("act"),
            "type": action["type"],
            "label": action["label"],
            "risk": action["risk"],
            "params": action["params"],
            "status": "proposed",
            "created_at": now(),
        }
    )
    db.update_run(run["id"], {"proposed_actions": proposed, "updated_at": now()})
    record_event(run["id"], "approval_request", "Approval Required", action["label"], {"risk": action["risk"]})
    set_step(run["id"], "approval_gate")


def step_approval_gate(run: dict[str, Any]) -> None:
    action = run["proposed_actions"][-1]
    db.update_run(
        run["id"],
        {
            "status": "awaiting_approval",
            "approval_state": "pending",
            "current_step": action["label"],
            "updated_at": now(),
        },
    )
    checkpoint(run["id"], "approval_gate", {"action": action})


def step_execute_action(run: dict[str, Any]) -> None:
    action = run["proposed_actions"][-1]
    output = run_tool(run, action["type"], **action["params"])
    action["status"] = "executed"
    db.update_run(run["id"], {"proposed_actions": run["proposed_actions"], "updated_at": now()})
    append_observation(run, "remediation", output["message"], "warning")
    set_step(run["id"], "verify")


def step_verify(run: dict[str, Any]) -> None:
    verification = load_scenarios()[run["scenario"]]["verification"]
    append_observation(run, "verification", verification["summary"], "info")
    record_event(run["id"], "status_change", "Recovery Verified", verification["summary"], verification)
    checkpoint(run["id"], "verify", verification)
    set_step(run["id"], "summarize")


def step_summarize(run: dict[str, Any]) -> None:
    latest = db.get_run(run["id"])
    action = latest["proposed_actions"][-1] if latest["proposed_actions"] else None
    hypothesis = latest["hypotheses"][-1] if latest["hypotheses"] else None
    summary = (
        f"Resolved incident for {latest['tenant']} in {latest['region']}. "
        f"Confirmed hypothesis: {hypothesis['description'] if hypothesis else 'n/a'} "
        f"Executed action: {action['label'] if action else 'n/a'}."
    )
    db.update_run(
        run["id"],
        {
            "status": "completed",
            "current_step": "summarize",
            "approval_state": "approved",
            "final_summary": summary,
            "updated_at": now(),
        },
    )
    record_event(run["id"], "status_change", "Run Completed", summary)
    checkpoint(run["id"], "summarize", {"final_summary": summary})
