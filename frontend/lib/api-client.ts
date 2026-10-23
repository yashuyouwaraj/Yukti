
import type {
  ExecuteRequest,
  ExecutionResponse,
  PlanRequest,
  PlanResponse,
  WorkflowPlan,
} from "@/types/workflow";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
  "http://localhost:8000";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Can't reach the Yukti API. Check that the backend is running.",
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? data.detail
        : null;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((item) =>
                typeof item === "object" &&
                item !== null &&
                "msg" in item &&
                typeof item.msg === "string"
                  ? item.msg
                  : null,
              )
              .filter((item): item is string => item !== null)
              .join(" ")
          : "";

    throw new Error(message || `The API request failed (${response.status}).`);
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("The API returned an invalid response.");
  }

  return data as T;
}

export function createPlan(
  request: PlanRequest,
): Promise<PlanResponse> {
  return postJson<PlanResponse>("/api/plan", request);
}

export function executePlan(
  plan: WorkflowPlan,
): Promise<ExecutionResponse> {
  const request: ExecuteRequest = {
    plan,
    approved: true,
  };

  return postJson<ExecutionResponse>("/api/execute", request);
}
