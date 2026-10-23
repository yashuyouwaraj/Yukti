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
- Python 3.10+; Python 3.12 is recommended for local backend development
- Docker Desktop (optional, easiest route)

## Run with Docker
```bash
cp .env.example .env
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health

## Run without Docker
### Backend (Windows PowerShell)

These commands create a separate Python 3.12 environment. They do not replace
or modify an existing `backend\.venv`. Install Python 3.12 first if
`py -3.12 --version` is unavailable.

```powershell
Set-Location "D:\Full Stack\Project\Yukti"
py -3.12 --version
py -3.12 -m venv backend\.venv312
& .\backend\.venv312\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
python -m playwright install chromium

if (-not (Test-Path backend\.env)) {
    Copy-Item backend\.env.example backend\.env
}
# Set GEMINI_API_KEY locally in backend\.env; do not commit that file.
Set-Location backend
python -m uvicorn app.main:app --reload --port 8000
```

Python 3.12 is supported by the backend dependencies. The existing Python 3.14
environment can also run the backend; Playwright is isolated onto a
subprocess-capable Proactor loop on Windows.

The configured model defaults to `gemini-3.8-flash`. Verify that model is
available to your Google AI account in Google AI Studio or through Google's
model-list API before changing `GEMINI_MODEL` in `backend\.env`. Yukti does not
silently switch models.

### Backend (macOS/Linux)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m playwright install chromium
python -m uvicorn app.main:app --reload --port 8000
```

Create `backend/.env` from `backend/.env.example` if it does not exist, then
set `GEMINI_API_KEY` locally.

### Frontend

Frontend (in another terminal):
```bash
cd frontend
npm install
npm run dev
```

## Next implementation milestone
1. Add task/run persistence with PostgreSQL and migrations.
2. Add audit logging and production-grade isolation for browser execution.

The browser executor never runs model-generated code and requires explicit
approval. It pins DNS results for planned public hosts, blocks requests to
unplanned hosts and non-GET/HEAD methods, blocks WebSockets and sensitive form
actions, and enforces step, per-action timeout, and output limits. These are
defense-in-depth controls for the development preview, not a guarantee of
production security.
