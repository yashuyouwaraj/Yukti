
import asyncio
import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import ExecuteRequest, PlanRequest, PlanResponse
from app.services.planner import (
    PlannerConfigurationError,
    PlannerOutputError,
    PlannerUnavailableError,
    create_workflow_plan,
)
from app.services.executor import (
    ExecutionError,
    execute_workflow_in_worker,
)

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yukti API",
    version="0.2.0",
    description="AI-assisted browser workflow planning API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "yukti-api",
        "version": "0.2.0",
    }


@app.post("/api/plan", response_model=PlanResponse)
def create_plan(request: PlanRequest) -> PlanResponse:
    try:
        return create_workflow_plan(request.prompt)
    except PlannerConfigurationError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc
    except PlannerUnavailableError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc
    except PlannerOutputError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc


@app.post("/api/execute")
async def execute_plan(request: ExecuteRequest) -> dict:
    if not request.approved:
        raise HTTPException(
            status_code=403,
            detail="Approve the workflow before execution.",
        )

    try:
        return await asyncio.to_thread(
            execute_workflow_in_worker,
            request.plan,
        )
    except ExecutionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Workflow execution failed.")
        raise HTTPException(
            status_code=500,
            detail=(
                "The browser could not start or the workflow could not finish. "
                "Check the backend logs and confirm Chromium is installed."
            ),
        ) from exc