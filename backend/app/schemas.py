from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


RunStatus = Literal["pending", "running", "awaiting_approval", "completed", "failed", "cancelled"]
ApprovalState = Literal["not_required", "pending", "approved", "rejected"]
EventType = Literal["observation", "hypothesis", "tool_execution", "approval_request", "status_change"]


class CreateRunRequest(BaseModel):
    tenant: str = Field(min_length=1)
    region: str = Field(min_length=1)
    goal: str | None = None
    problem_description: str | None = None
    scenario: str | None = None


class DecisionRequest(BaseModel):
    comment: str | None = None


class TimelineEvent(BaseModel):
    id: str
    timestamp: str
    type: EventType
    title: str
    description: str
    metadata: dict[str, Any] | None = None


class Observation(BaseModel):
    id: str
    timestamp: str
    source: str
    content: str
    severity: Literal["info", "warning", "critical"]


class Hypothesis(BaseModel):
    id: str
    timestamp: str
    description: str
    confidence: float
    supporting_evidence: list[str]
    status: Literal["proposed", "investigating", "confirmed", "rejected"]


class ToolOutput(BaseModel):
    id: str
    timestamp: str
    tool_name: str
    input: dict[str, Any]
    output: str
    status: Literal["success", "error"]
    duration_ms: int


class ProposedAction(BaseModel):
    id: str
    type: str
    label: str
    risk: str
    params: dict[str, Any]
    status: Literal["proposed", "approved", "rejected", "executed"]
    created_at: str


class Run(BaseModel):
    id: str
    tenant: str
    region: str
    goal: str
    problem_description: str
    status: RunStatus
    current_step: str
    scenario: str
    approval_state: ApprovalState
    created_at: str
    updated_at: str
    observations: list[Observation]
    hypotheses: list[Hypothesis]
    tool_outputs: list[ToolOutput]
    proposed_actions: list[ProposedAction]
    checkpoints: list[dict[str, Any]]
    errors: list[str]
    final_summary: str | None
    timeline: list[TimelineEvent]
