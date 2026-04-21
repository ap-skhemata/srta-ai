from __future__ import annotations

import json
from pathlib import Path
from time import perf_counter
from typing import Any, Callable

FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "scenarios.json"


def load_scenarios() -> dict[str, Any]:
    return json.loads(FIXTURE_PATH.read_text())


def select_scenario(goal: str, requested: str | None = None) -> str:
    scenarios = load_scenarios()
    if requested in scenarios:
        return requested

    goal_lower = goal.lower()
    scored = []
    for name, scenario in scenarios.items():
        score = sum(1 for term in scenario["match_terms"] if term in goal_lower)
        scored.append((score, name))
    scored.sort(reverse=True)
    return scored[0][1] if scored[0][0] > 0 else "deployment_regression"


def _scenario(name: str) -> dict[str, Any]:
    return load_scenarios()[name]


def get_tenant_health_summary(tenant: str, region: str, scenario: str) -> dict[str, Any]:
    health = _scenario(scenario)["tenant_health"]
    return {"tenant": tenant, "region": region, **health}


def get_metrics_snapshot(tenant: str, region: str, scenario: str) -> dict[str, Any]:
    return {"tenant": tenant, "region": region, **_scenario(scenario)["metrics"]}


def get_recent_logs(tenant: str, region: str, scenario: str) -> dict[str, Any]:
    return {"tenant": tenant, "region": region, "lines": _scenario(scenario)["logs"]}


def get_recent_deployments(tenant: str, region: str, scenario: str) -> dict[str, Any]:
    return {"tenant": tenant, "region": region, "deployments": _scenario(scenario)["deployments"]}


def get_worker_health(tenant: str, region: str, scenario: str) -> dict[str, Any]:
    return {"tenant": tenant, "region": region, **_scenario(scenario)["workers"]}


def rollback_deployment(tenant: str, region: str, scenario: str, service: str, target_version: str) -> dict[str, Any]:
    return {
        "tenant": tenant,
        "region": region,
        "service": service,
        "target_version": target_version,
        "result": "rollback_started",
        "message": f"{service} rolled back to {target_version} in mocked control plane",
    }


def restart_worker(tenant: str, region: str, scenario: str, worker_id: str) -> dict[str, Any]:
    return {
        "tenant": tenant,
        "region": region,
        "worker_id": worker_id,
        "result": "restart_started",
        "message": f"{worker_id} restarted in mocked orchestrator",
    }


def failover_route(tenant: str, region: str, scenario: str, from_pool: str, to_pool: str) -> dict[str, Any]:
    return {
        "tenant": tenant,
        "region": region,
        "from_pool": from_pool,
        "to_pool": to_pool,
        "result": "route_updated",
        "message": f"Tenant route moved from {from_pool} to {to_pool} in mocked router",
    }


TOOL_REGISTRY: dict[str, Callable[..., dict[str, Any]]] = {
    "get_tenant_health_summary": get_tenant_health_summary,
    "get_metrics_snapshot": get_metrics_snapshot,
    "get_recent_logs": get_recent_logs,
    "get_recent_deployments": get_recent_deployments,
    "get_worker_health": get_worker_health,
    "rollback_deployment": rollback_deployment,
    "restart_worker": restart_worker,
    "failover_route": failover_route,
}


def call_tool(name: str, **kwargs: Any) -> tuple[dict[str, Any], int]:
    start = perf_counter()
    result = TOOL_REGISTRY[name](**kwargs)
    duration_ms = max(1, int((perf_counter() - start) * 1000))
    return result, duration_ms
