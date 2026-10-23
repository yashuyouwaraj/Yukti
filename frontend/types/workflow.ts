
export interface PlanRequest {
  prompt: string;
}

export type WorkflowStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type WorkflowAction =
  | "navigate"
  | "click"
  | "fill"
  | "extract_text"
  | "wait"
  | "screenshot";

export interface WorkflowStep {
  id: string;
  title: string;
  action: WorkflowAction;
  description: string;
  status: WorkflowStepStatus;
  url?: string | null;
  target?: string | null;
  value?: string | null;
}

export type PlanStatus = "not_implemented" | "ready" | "error";

export interface PlanResponse {
  status: PlanStatus;
  message: string;
  workflow_id: string | null;
  title: string | null;
  steps: WorkflowStep[];
}

export interface WorkflowPlan {
  title: string;
  steps: WorkflowStep[];
}

export type PlanningStatus = "idle" | "planning" | "success" | "error";

export type ExecutionStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed";

export interface ExecuteRequest {
  plan: WorkflowPlan;
  approved: true;
}

export interface StepExecutionResult {
  step_id: string;
  status: "completed" | "failed";
  result?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionResponse {
  status: "completed" | "failed";
  results: StepExecutionResult[];
}
