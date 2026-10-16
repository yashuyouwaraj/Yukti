# Yukti — starter project

A first local-development scaffold for Yukti, an AI-powered browser workflow assistant. This is a starter UI and API skeleton, not a finished automation engine.

## Included
- Next.js App Router + TypeScript + Tailwind frontend
- Branded Yukti dashboard starter
- FastAPI backend with health endpoint
- Docker Compose for local frontend/backend development
- `.env.example` placeholders only

## Prerequisites
- Node.js 20+
- Python 3.11+ (if running backend outside Docker)
- Docker Desktop (optional, easiest route)

## Run with Docker
```bash
cp .env.example .env
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health

## Run without Docker
Backend:
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Frontend (in another terminal):
```bash
cd frontend
npm install
npm run dev
```

## Next implementation milestone
1. Add strict Pydantic workflow schemas and validation.
2. Add task/run persistence with PostgreSQL and migrations.
3. Add a safe, allowlisted Playwright executor.
4. Add an AI planning adapter that returns structured steps.
5. Connect the UI to plan → validate → approve → execute → results.

Safety baseline: never execute model-generated code; require approval before execution; restrict browser navigation to public destinations and block loopback/private/link-local/metadata addresses; use step, time, and output limits.
