import asyncio
import socket
import sys
from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import WorkflowPlan, WorkflowStep
from app.services import executor
from app.services.executor import ExecutionError


client = TestClient(app)


def _plan(steps: list[dict] | None = None) -> WorkflowPlan:
    return WorkflowPlan.model_validate(
        {
            "title": "Example workflow",
            "steps": steps
            or [
                {
                    "id": "step-1",
                    "title": "Open website",
                    "action": "navigate",
                    "description": "Open a public website.",
                    "status": "pending",
                    "url": "https://example.com",
                }
            ],
        }
    )


def _public_dns_records(hostname: str, port: int | None, **kwargs) -> list[tuple]:
    return [
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 0))
    ]


def test_execution_requires_approval() -> None:
    response = client.post(
        "/api/execute",
        json={
            "approved": False,
            "plan": {
                "title": "Example workflow",
                "steps": [
                    {
                        "id": "step-1",
                        "title": "Open website",
                        "action": "navigate",
                        "description": "Open a public website.",
                        "status": "pending",
                        "url": "https://example.com",
                    }
                ],
            },
        },
    )

    assert response.status_code == 403
    assert "Approve the workflow" in response.json()["detail"]


def test_execution_api_returns_backend_result_contract() -> None:
    result = {
        "status": "completed",
        "results": [
            {
                "step_id": "step-1",
                "status": "completed",
                "result": {"url": "https://example.com/"},
            }
        ],
    }
    with patch(
        "app.main.execute_workflow_in_worker",
        return_value=result,
    ):
        response = client.post(
            "/api/execute",
            json={"approved": True, "plan": _plan().model_dump(mode="json")},
        )

    assert response.status_code == 200
    assert response.json() == result


def test_execution_setup_failure_returns_generic_api_error() -> None:
    with patch(
        "app.main.execute_workflow_in_worker",
        side_effect=RuntimeError("internal browser process details"),
    ):
        response = client.post(
            "/api/execute",
            json={"approved": True, "plan": _plan().model_dump(mode="json")},
        )

    assert response.status_code == 500
    assert "internal browser process details" not in response.text
    assert "backend logs" in response.json()["detail"]


def test_validate_public_url_rejects_internal_destinations() -> None:
    for url in (
        "http://127.0.0.1",
        "http://10.0.0.1",
        "http://169.254.169.254",
        "http://[::1]",
        "http://localhost",
        "http://service.localhost",
        "file:///etc/passwd",
        "https://user:password@example.com",
        "https://example.com:8443",
    ):
        with pytest.raises(ExecutionError):
            executor.validate_public_url(url)


def test_validate_public_url_rejects_private_dns_answers() -> None:
    private_record = (
        socket.AF_INET,
        socket.SOCK_STREAM,
        6,
        "",
        ("192.168.1.20", 0),
    )
    with patch(
        "app.services.executor.socket.getaddrinfo",
        return_value=[private_record],
    ):
        with pytest.raises(ExecutionError, match="non-public"):
            executor.validate_public_url("https://rebound.example")


def test_validate_public_url_accepts_public_destination() -> None:
    with patch(
        "app.services.executor.socket.getaddrinfo",
        side_effect=_public_dns_records,
    ):
        assert (
            executor.validate_public_url("https://example.com")
            == "https://example.com"
        )


def test_request_guard_blocks_unpinned_redirects_and_mutations() -> None:
    pinned_hosts = {"example.com"}
    pinned_addresses = {"93.184.216.34"}

    assert executor._request_is_allowed(
        "https://example.com/page", "GET", pinned_hosts, pinned_addresses
    )
    assert not executor._request_is_allowed(
        "https://internal.example/page", "GET", pinned_hosts, pinned_addresses
    )
    assert not executor._request_is_allowed(
        "http://127.0.0.1/admin", "GET", pinned_hosts, pinned_addresses
    )
    assert not executor._request_is_allowed(
        "https://example.com/submit", "POST", pinned_hosts, pinned_addresses
    )
    assert not executor._request_is_allowed(
        "https://example.com:8443/", "GET", pinned_hosts, pinned_addresses
    )


def test_request_guard_allows_only_standard_http_ports_for_pinned_hosts() -> None:
    pinned_hosts = {"example.com"}

    assert executor._request_is_allowed(
        "http://example.com/", "GET", pinned_hosts, set()
    )
    assert executor._request_is_allowed(
        "https://example.com/", "GET", pinned_hosts, set()
    )
    assert not executor._request_is_allowed(
        "http://example.com:8080/", "GET", pinned_hosts, set()
    )


def test_workflow_validation_requires_url_and_selectors() -> None:
    missing_url = _plan(
        [
            {
                "id": "step-1",
                "title": "Navigate",
                "action": "navigate",
                "description": "Go somewhere",
            }
        ]
    )
    missing_selector = _plan(
        [
            {
                "id": "step-1",
                "title": "Navigate",
                "action": "navigate",
                "description": "Go somewhere",
                "url": "https://example.com",
            },
            {
                "id": "step-2",
                "title": "Extract",
                "action": "extract_text",
                "description": "Extract text",
            },
        ]
    )

    with patch(
        "app.services.executor.socket.getaddrinfo",
        side_effect=_public_dns_records,
    ):
        with pytest.raises(ExecutionError, match="require a URL"):
            executor._validate_workflow(missing_url)
        with pytest.raises(ExecutionError, match="require a selector"):
            executor._validate_workflow(missing_selector)


def test_wait_step_without_target_waits_for_page_load() -> None:
    plan = _plan(
        [
            {
                "id": "step-1",
                "title": "Navigate",
                "action": "navigate",
                "description": "Open a public website",
                "url": "https://example.com",
            },
            {
                "id": "step-2",
                "title": "Wait for page load",
                "action": "wait",
                "description": "Wait for the page body to load",
            },
        ]
    )
    page = Mock()
    page.wait_for_load_state = AsyncMock()

    with patch(
        "app.services.executor.socket.getaddrinfo",
        side_effect=_public_dns_records,
    ):
        executor._validate_workflow(plan)
    result = asyncio.run(executor._run_step(page, plan.steps[1]))

    page.wait_for_load_state.assert_awaited_once_with("load", timeout=15000)
    assert result == {"waited_for": "load"}


@pytest.mark.parametrize(
    ("action", "details"),
    [
        (
            "click",
            {
                "tag": "button",
                "type": "submit",
                "role": "",
                "text": "Search",
                "label": "",
                "href": "",
                "formAction": "/search",
                "formMethod": "get",
                "inForm": True,
            },
        ),
        (
            "fill",
            {
                "tag": "input",
                "type": "text",
                "role": "",
                "text": "",
                "label": "Credit card number",
                "href": "",
                "formAction": "",
                "formMethod": "get",
                "inForm": False,
            },
        ),
    ],
)
def test_rejects_form_submission_and_financial_fields(
    action: str,
    details: dict,
) -> None:
    target = Mock()
    target.evaluate = AsyncMock(return_value=details)
    page = Mock()
    page.locator.return_value.first = target
    step = WorkflowStep(
        id="step-1",
        title="Risky action",
        action=action,
        description="Do something",
        target="#target",
        value="example" if action == "fill" else None,
    )

    with pytest.raises(ExecutionError):
        asyncio.run(executor._assert_safe_target(page, step))


def test_execution_failure_stops_after_failed_step_and_closes_browser() -> None:
    context_manager = Mock()
    context_manager.__aenter__ = AsyncMock()
    context_manager.__aexit__ = AsyncMock(return_value=False)
    playwright = Mock()
    context_manager.__aenter__.return_value = playwright

    browser = Mock()
    browser.new_context = AsyncMock()
    browser.close = AsyncMock()
    context = Mock()
    context.route = AsyncMock()
    context.route_web_socket = AsyncMock()
    context.new_page = AsyncMock(return_value=Mock(spec=[]))
    context.close = AsyncMock()
    browser.new_context.return_value = context
    playwright.chromium.launch = AsyncMock(return_value=browser)

    steps = _plan(
        [
            {
                "id": "step-1",
                "title": "Open",
                "action": "navigate",
                "description": "Open example.com",
                "url": "https://example.com",
            },
            {
                "id": "step-2",
                "title": "Extract",
                "action": "extract_text",
                "description": "Extract page text",
                "target": "body",
            },
        ]
    )

    with (
        patch(
            "app.services.executor.socket.getaddrinfo",
            side_effect=_public_dns_records,
        ),
        patch(
            "app.services.executor.async_playwright",
            return_value=context_manager,
        ),
        patch(
            "app.services.executor._run_step",
            new=AsyncMock(side_effect=RuntimeError("step failed")),
        ) as run_step,
    ):
        result = asyncio.run(executor.execute_workflow(steps))

    assert result == {
        "status": "failed",
        "results": [
            {
                "step_id": "step-1",
                "status": "failed",
                "error": "step failed",
            }
        ],
    }
    run_step.assert_awaited_once()
    context.close.assert_awaited_once()
    browser.close.assert_awaited_once()
    context.route_web_socket.assert_awaited_once()
    websocket_handler = context.route_web_socket.call_args.args[1]
    websocket = Mock()
    websocket_handler(websocket)
    websocket.close.assert_called_once_with(
        code=1008,
        reason="WebSocket connections are not allowed.",
    )
    context_manager.__aexit__.assert_awaited_once()


def test_worker_uses_windows_proactor_loop_when_available() -> None:
    async def report_loop(plan: WorkflowPlan) -> str:
        assert plan.steps
        return type(asyncio.get_running_loop()).__name__

    with patch(
        "app.services.executor.execute_workflow",
        new=AsyncMock(side_effect=report_loop),
    ):
        loop_type = executor.execute_workflow_in_worker(_plan())

    if sys.platform == "win32":
        assert loop_type == "ProactorEventLoop"
