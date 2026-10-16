from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Yukti API", version="0.1.0", description="API scaffold for Yukti workflow automation.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

class PlanRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=4000)

@app.get("/health")
def health():
    return {"status": "ok", "service": "yukti-api", "version": "0.1.0"}

@app.post("/api/plan")
def create_plan(request: PlanRequest):
    """Temporary placeholder. Real LLM planning and schema validation are not implemented yet."""
    return {
        "status": "not_implemented",
        "message": "Workflow planning is not connected yet. This endpoint is a scaffold only.",
        "received_prompt_length": len(request.prompt),
        "steps": [],
    }
