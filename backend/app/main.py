
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import PlanRequest, PlanResponse
from app.services.planner import (
    PlannerConfigurationError,
    PlannerOutputError,
    create_workflow_plan,
)

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

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
    except PlannerOutputError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc
