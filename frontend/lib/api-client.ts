
import type { PlanRequest, PlanResponse } from "@/types/workflow";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
  "http://localhost:8000";

export async function createPlan(
  request: PlanRequest,
): Promise<PlanResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(
      "Can't reach the Yukti API. Check that the backend is running.",
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof data.detail === "string"
        ? data.detail
        : `The API request failed (${response.status}).`;

    throw new Error(message);
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("The API returned an invalid response.");
  }

  return data as PlanResponse;
}
