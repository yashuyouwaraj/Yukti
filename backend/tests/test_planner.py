import os
from types import SimpleNamespace
from unittest.mock import Mock, patch

import httpx
import pytest
from google.genai.errors import ClientError, ServerError

from app.schemas import PlanResponse
from app.services import planner


VALID_PLAN = (
    '{"title":"Open example.com","steps":['
    '{"id":"step-1","title":"Open site","action":"navigate",'
    '"description":"Open the public website.","url":"https://example.com"}]}'
)


def _api_error(
    error_type: type[ClientError] | type[ServerError],
    code: int,
    headers: dict[str, str] | None = None,
) -> Exception:
    return error_type(
        code,
        {"error": {"message": "provider error"}},
        response=httpx.Response(code, headers=headers or {}),
    )


def _mock_client(side_effect: list[object]) -> tuple[Mock, Mock]:
    generate_content = Mock(side_effect=side_effect)
    client = Mock()
    client.models.generate_content = generate_content
    return client, generate_content


def test_retries_transient_errors_with_retry_after_and_jitter() -> None:
    client, generate_content = _mock_client(
        [
            _api_error(ServerError, 503, {"Retry-After": "2"}),
            _api_error(ClientError, 429),
            SimpleNamespace(text=VALID_PLAN),
        ]
    )

    with (
        patch.dict(
            os.environ,
            {"GEMINI_API_KEY": "test-key", "GEMINI_MODEL": "test-model"},
        ),
        patch.object(planner.genai, "Client", return_value=client) as make_client,
        patch.object(planner.time, "sleep") as sleep,
        patch.object(planner.random, "uniform", return_value=0),
    ):
        result = planner.create_workflow_plan("Open example.com")

    assert isinstance(result, PlanResponse)
    assert result.status == "ready"
    assert generate_content.call_count == planner.MAX_ATTEMPTS
    assert [call.args[0] for call in sleep.call_args_list] == [2.0, 2]
    retry_options = make_client.call_args.kwargs["http_options"].retry_options
    assert retry_options.attempts == 1
    client.close.assert_called_once()


def test_does_not_retry_permanent_gemini_request_error() -> None:
    client, generate_content = _mock_client([_api_error(ClientError, 400)])

    with (
        patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
        patch.object(planner.genai, "Client", return_value=client),
        patch.object(planner.time, "sleep") as sleep,
    ):
        with pytest.raises(planner.PlannerOutputError, match="HTTP 400"):
            planner.create_workflow_plan("Open example.com")

    generate_content.assert_called_once()
    sleep.assert_not_called()
    client.close.assert_called_once()


def test_does_not_retry_invalid_gemini_credentials() -> None:
    client, generate_content = _mock_client([_api_error(ClientError, 401)])

    with (
        patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
        patch.object(planner.genai, "Client", return_value=client),
        patch.object(planner.time, "sleep") as sleep,
    ):
        with pytest.raises(
            planner.PlannerConfigurationError,
            match="Verify GEMINI_API_KEY",
        ):
            planner.create_workflow_plan("Open example.com")

    generate_content.assert_called_once()
    sleep.assert_not_called()
    client.close.assert_called_once()


def test_reports_unavailable_after_bounded_transient_retries() -> None:
    client, generate_content = _mock_client(
        [_api_error(ServerError, 503)] * planner.MAX_ATTEMPTS
    )

    with (
        patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
        patch.object(planner.genai, "Client", return_value=client),
        patch.object(planner.time, "sleep"),
        patch.object(planner.random, "uniform", return_value=0),
    ):
        with pytest.raises(
            planner.PlannerUnavailableError,
            match="temporarily unavailable",
        ):
            planner.create_workflow_plan("Open example.com")

    assert generate_content.call_count == planner.MAX_ATTEMPTS
    client.close.assert_called_once()
