
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


WorkflowAction = Literal[
    "navigate",
    "click",
    "fill",
    "extract_text",
    "wait",
    "screenshot",
]


class PlanRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=4000)


class WorkflowStep(BaseModel):
    id: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=120)
    action: WorkflowAction
    description: str = Field(min_length=1, max_length=500)
    status: Literal["pending", "running", "completed", "failed"] = "pending"
    url: HttpUrl | None = None
    target: str | None = Field(default=None, max_length=250)
    value: str | None = Field(default=None, max_length=1000)


class WorkflowPlan(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    steps: list[WorkflowStep] = Field(max_length=20)


class PlanResponse(BaseModel):
    status: Literal["not_implemented", "ready", "error"]
    message: str
    workflow_id: str | None = None
    title: str | None = None
    steps: list[WorkflowStep] = Field(default_factory=list)
