
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas import WorkflowPlan, WorkflowStep
from app.services.planner import PlannerUnavailableError

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@patch("app.main.create_workflow_plan")
def test_plan_returns_validated_steps(mock_plan) -> None:
    mock_plan.return_value = {
        "status": "ready",
        "message": "Workflow plan created. Review the steps before any execution.",
        "workflow_id": "test-workflow",
        "title": "Search a public website",
        "steps": [
            {
                "id": "step-1",
                "title": "Open website",
                "action": "navigate",
                "description": "Open the public website.",
                "status": "pending",
                "url": "https://example.com",
            }
        ],
    }

    response = client.post(
        "/api/plan",
        json={"prompt": "Open example.com and read its page title"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["steps"][0]["action"] == "navigate"


def test_plan_rejects_short_prompt() -> None:
    response = client.post("/api/plan", json={"prompt": "hi"})

    assert response.status_code == 422


def test_plan_rejects_missing_prompt() -> None:
    response = client.post("/api/plan", json={})

    assert response.status_code == 422


def test_plan_rejects_long_prompt() -> None:
    response = client.post("/api/plan", json={"prompt": "a" * 4001})

    assert response.status_code == 422


@patch(
    "app.main.create_workflow_plan",
    side_effect=PlannerUnavailableError(
        "Gemini is temporarily unavailable after several attempts. "
        "Please try again shortly."
    ),
)
def test_plan_reports_gemini_unavailable_as_service_unavailable(
    mock_plan,
) -> None:
    response = client.post(
        "/api/plan",
        json={"prompt": "Open example.com"},
    )

    assert response.status_code == 503
    assert "temporarily unavailable" in response.json()["detail"]
    mock_plan.assert_called_once()
