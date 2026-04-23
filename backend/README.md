# FastAPI Backend Setup

This backend serves data to the frontend app.

## 1) Create and activate virtual environment

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 2) Install dependencies

```powershell
pip install -r requirements.txt
```

## 3) Environment variables

```powershell
notepad .env
```

If you add a `GITHUB_TOKEN`, GitHub API rate limits are much better.

Redis cache settings:
- `REDIS_URL=redis://localhost:6379/0`
- `CACHE_TTL_SECONDS=300`
- `CACHE_KEY_PREFIX=reposcope`

## 4) Run Redis (optional but recommended for caching)

If Redis is running, API responses are cached automatically.

```powershell
docker run -d --name reposcope-redis -p 6379:6379 redis:7
```

## 5) Run server

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at:
- `http://localhost:8000/api/health`
- `http://localhost:8000/api/repo/{owner}/{name}`
