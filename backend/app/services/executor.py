import asyncio
import base64
import ipaddress
import re
import socket
import sys
from urllib.parse import urlsplit

from playwright.async_api import (
    Browser,
    BrowserContext,
    Page,
    Route,
    async_playwright,
)

from app.schemas import WorkflowPlan, WorkflowStep


MAX_STEPS = 20
MAX_STEP_RESULT_LENGTH = 10000
MAX_SCREENSHOT_BYTES = 2_000_000
_DANGEROUS_ACTION_TERMS = re.compile(
    r"\b(?:buy|purchase|checkout|payment|pay|billing|order|submit|"
    r"transfer|withdraw|donate|subscribe|confirm|credit|debit|card|"
    r"cvv|cvc|iban|bank)\b",
    re.IGNORECASE,
)


class ExecutionError(Exception):
    """Raised when a workflow cannot be executed safely."""


def _normalized_hostname(hostname: str) -> str:
    if hostname.endswith(".") or "%" in hostname:
        raise ExecutionError("The destination hostname is invalid.")

    try:
        return hostname.encode("idna").decode("ascii").lower()
    except UnicodeError as exc:
        raise ExecutionError("The destination hostname is invalid.") from exc


def _public_addresses(hostname: str) -> set[ipaddress.IPv4Address | ipaddress.IPv6Address]:
    try:
        literal = ipaddress.ip_address(hostname)
        addresses = {literal}
    except ValueError:
        try:
            records = socket.getaddrinfo(
                hostname,
                None,
                type=socket.SOCK_STREAM,
            )
        except OSError as exc:
            raise ExecutionError(
                "The destination hostname could not be resolved."
            ) from exc

        addresses = {
            ipaddress.ip_address(record[4][0].split("%", maxsplit=1)[0])
            for record in records
        }

    if not addresses:
        raise ExecutionError("The destination hostname has no resolved addresses.")

    if any(not address.is_global for address in addresses):
        raise ExecutionError("Private or non-public network destinations are blocked.")

    return addresses


def validate_public_url(url: str) -> str:
    """Allow public HTTP(S) destinations only."""
    try:
        parsed = urlsplit(url)
        port = parsed.port
    except ValueError as exc:
        raise ExecutionError("The destination URL is invalid.") from exc

    if parsed.scheme.lower() not in {"http", "https"}:
        raise ExecutionError("Only HTTP and HTTPS URLs are allowed.")

    hostname = parsed.hostname
    if not hostname:
        raise ExecutionError("The URL must include a hostname.")

    if parsed.username or parsed.password:
        raise ExecutionError("URLs containing credentials are not allowed.")

    normalized_hostname = _normalized_hostname(hostname)
    if (
        normalized_hostname == "localhost"
        or normalized_hostname.endswith(".localhost")
    ):
        raise ExecutionError("Local destinations are not allowed.")

    _public_addresses(normalized_hostname)

    expected_port = 443 if parsed.scheme.lower() == "https" else 80
    if port is not None and port != expected_port:
        raise ExecutionError("Only standard HTTP and HTTPS ports are allowed.")

    return url


def _validate_workflow(plan: WorkflowPlan) -> dict[str, str]:
    if not plan.steps:
        raise ExecutionError("The workflow has no steps.")

    if len(plan.steps) > MAX_STEPS:
        raise ExecutionError(f"Workflows cannot exceed {MAX_STEPS} steps.")

    step_ids = [step.id for step in plan.steps]
    if len(step_ids) != len(set(step_ids)):
        raise ExecutionError("Workflow step IDs must be unique.")

    pinned_hosts: dict[str, str] = {}
    for step in plan.steps:
        if step.action == "navigate":
            if not step.url:
                raise ExecutionError("Navigate steps require a URL.")
            if step.target or step.value is not None:
                raise ExecutionError(
                    "Navigate steps cannot include a target or fill value."
                )

            url = validate_public_url(str(step.url))
            hostname = _normalized_hostname(urlsplit(url).hostname or "")
            addresses = _public_addresses(hostname)
            preferred = sorted(
                addresses,
                key=lambda address: (address.version != 4, str(address)),
            )[0]
            pinned_hosts[hostname] = str(preferred)
            continue

        if step.url:
            raise ExecutionError("Only navigate steps may include a URL.")

        if step.value is not None and step.action != "fill":
            raise ExecutionError("Only fill steps may include a value.")

        if step.action in {"click", "fill", "extract_text"}:
            if not step.target or not step.target.strip():
                raise ExecutionError(
                    f"{step.action.replace('_', '-').capitalize()} steps "
                    "require a selector."
                )

        if step.action == "fill" and step.value is None:
            raise ExecutionError("Fill steps require a value.")

        if step.action == "screenshot" and (step.target or step.value is not None):
            raise ExecutionError(
                "Screenshot steps cannot include a target or fill value."
            )

    if not pinned_hosts:
        raise ExecutionError("The workflow must navigate to a public website first.")

    return pinned_hosts


def _host_resolver_rule(hostname: str, address: str) -> str:
    resolver_address = f"[{address}]" if ":" in address else address
    return f"MAP {hostname} {resolver_address}"


def _request_is_allowed(
    url: str,
    method: str,
    pinned_hosts: set[str],
    pinned_addresses: set[str],
) -> bool:
    if method.upper() not in {"GET", "HEAD"}:
        return False

    try:
        parsed = urlsplit(url)
    except ValueError:
        return False

    if parsed.scheme in {"data", "blob", "about"}:
        return True

    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False

    try:
        port = parsed.port
        hostname = _normalized_hostname(parsed.hostname)
    except (ExecutionError, ValueError):
        return False

    expected_port = 443 if parsed.scheme == "https" else 80
    if port is not None and port != expected_port:
        return False

    if hostname in pinned_hosts:
        return True

    try:
        address = ipaddress.ip_address(hostname)
    except ValueError:
        return False

    return str(address) in pinned_addresses and address.is_global


async def _guard_context_request(
    route: Route,
    pinned_hosts: set[str],
    pinned_addresses: set[str],
) -> None:
    request = route.request
    if _request_is_allowed(
        request.url,
        request.method,
        pinned_hosts,
        pinned_addresses,
    ):
        await route.continue_()
    else:
        await route.abort("blockedbyclient")


async def _assert_safe_target(page: Page, step: WorkflowStep) -> None:
    if not step.target:
        raise ExecutionError(f"{step.action.capitalize()} step requires a selector.")

    target = page.locator(step.target).first
    details = await target.evaluate(
        """element => {
          const form = element.closest("form");
          const labels = element.labels
            ? Array.from(element.labels, label => label.innerText).join(" ")
            : "";
          return {
            tag: element.tagName.toLowerCase(),
            type: (element.getAttribute("type") || "").toLowerCase(),
            role: (element.getAttribute("role") || "").toLowerCase(),
            text: element.innerText || element.value || "",
            label: [
              labels,
              element.getAttribute("aria-label") || "",
              element.getAttribute("name") || "",
              element.getAttribute("id") || "",
              element.getAttribute("placeholder") || ""
            ].join(" "),
            href: element.getAttribute("href") || "",
            formAction: form ? form.getAttribute("action") || "" : "",
            formMethod: form ? (form.getAttribute("method") || "get").toLowerCase() : "",
            inForm: Boolean(form)
          };
        }"""
    )

    description = " ".join(
        str(details.get(key, ""))
        for key in ("text", "label", "href", "formAction")
    )
    if _DANGEROUS_ACTION_TERMS.search(description):
        raise ExecutionError(
            "Potentially consequential purchase, payment, or submission actions "
            "are not allowed."
        )

    if step.action == "click":
        is_submit = (
            details["type"] in {"submit", "image"}
            or details["role"] == "submit"
            or (
                details["tag"] == "button"
                and details["inForm"]
                and details["type"] != "button"
            )
        )
        if is_submit or (
            details["inForm"] and details["formMethod"] != "get"
        ):
            raise ExecutionError("Submitting forms is not allowed.")

    if step.action == "fill":
        sensitive_types = {"password", "hidden", "file", "submit", "button"}
        if details["type"] in sensitive_types or _DANGEROUS_ACTION_TERMS.search(
            description
        ):
            raise ExecutionError(
                "Filling sensitive or consequential fields is not allowed."
            )


async def _run_step(page: Page, step: WorkflowStep) -> dict[str, str]:
    if step.action == "navigate":
        if not step.url:
            raise ExecutionError("Navigate step requires a URL.")
        await page.goto(str(step.url), wait_until="domcontentloaded", timeout=20000)
        return {"url": page.url}

    if step.action == "wait":
        if step.target:
            await page.locator(step.target).first.wait_for(
                state="visible",
                timeout=15000,
            )
            return {"target": step.target}
        await page.wait_for_load_state("load", timeout=15000)
        return {"waited_for": "load"}

    if step.action == "click":
        await _assert_safe_target(page, step)
        await page.locator(step.target or "").first.click(timeout=10000)
        return {"target": step.target or ""}

    if step.action == "fill":
        await _assert_safe_target(page, step)
        await page.locator(step.target or "").first.fill(
            step.value or "",
            timeout=10000,
        )
        return {"target": step.target or ""}

    if step.action == "extract_text":
        if not step.target:
            raise ExecutionError("Extract-text step requires a CSS selector.")
        text = await page.locator(step.target).first.inner_text(timeout=10000)
        return {"target": step.target, "text": text[:MAX_STEP_RESULT_LENGTH]}

    if step.action == "screenshot":
        image = await page.screenshot(
            type="png",
            full_page=False,
            timeout=10000,
        )
        if len(image) > MAX_SCREENSHOT_BYTES:
            raise ExecutionError("The screenshot exceeds the output size limit.")
        return {"screenshot_base64": base64.b64encode(image).decode("ascii")}

    raise ExecutionError(f"Unsupported action: {step.action}")


async def execute_workflow(plan: WorkflowPlan) -> dict:
    """Execute a validated plan in an isolated, headless Chromium context."""
    pinned_hosts = _validate_workflow(plan)
    pinned_addresses = set(pinned_hosts.values())
    resolver_rules = ",".join(
        _host_resolver_rule(hostname, address)
        for hostname, address in sorted(pinned_hosts.items())
    )
    results: list[dict] = []

    async with async_playwright() as playwright:
        browser: Browser | None = None
        context: BrowserContext | None = None
        try:
            browser = await playwright.chromium.launch(
                headless=True,
                args=[f"--host-resolver-rules={resolver_rules}"],
            )
            context = await browser.new_context(
                accept_downloads=False,
                service_workers="block",
            )
            allowed_hosts = set(pinned_hosts)
            await context.route(
                "**/*",
                lambda route: _guard_context_request(
                    route,
                    allowed_hosts,
                    pinned_addresses,
                ),
            )

            def block_websocket(websocket) -> None:
                websocket.close(
                    code=1008,
                    reason="WebSocket connections are not allowed.",
                )

            await context.route_web_socket("**/*", block_websocket)
            page: Page = await context.new_page()

            for step in plan.steps:
                try:
                    result = await _run_step(page, step)
                    results.append(
                        {
                            "step_id": step.id,
                            "status": "completed",
                            "result": result,
                        }
                    )
                except Exception as exc:
                    results.append(
                        {
                            "step_id": step.id,
                            "status": "failed",
                            "error": str(exc)[:500],
                        }
                    )
                    break
        finally:
            try:
                if context is not None:
                    await context.close()
            finally:
                if browser is not None:
                    await browser.close()

    return {
        "status": (
            "completed"
            if results and all(item["status"] == "completed" for item in results)
            else "failed"
        ),
        "results": results,
    }


def execute_workflow_in_worker(plan: WorkflowPlan) -> dict:
    """Run Playwright on a subprocess-capable loop isolated from ASGI's loop."""
    loop = (
        asyncio.ProactorEventLoop()
        if sys.platform == "win32"
        else asyncio.new_event_loop()
    )
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(execute_workflow(plan))
    finally:
        try:
            loop.run_until_complete(loop.shutdown_asyncgens())
            loop.run_until_complete(loop.shutdown_default_executor())
        finally:
            loop.close()
            asyncio.set_event_loop(None)
