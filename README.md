# VMSL Team Hub

A web application for exploring Vancouver Metro Soccer League standings, fixtures, team performance, and player statistics.

**[Live application](https://vmsl-web-scraper.vercel.app/)**

## Tech stack
React, TypeScript, Vite, Tailwind CSS, Python, FastAPI, HTTPX, BeautifulSoup, pandas.

## Architecture
- `vmsl-frontend/` — React interface for standings, schedules, team comparisons, and player statistics.
- `backend/` — FastAPI endpoints that retrieve, parse, and normalize public league data.
- The frontend consumes JSON APIs; the backend caches source pages and derives team-level analytics.

## Run locally
```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-lock.txt
python -m uvicorn backend.main:app --reload --env-file backend/.env.example
```

In another terminal:
```bash
cd vmsl-frontend
npm ci
npm run dev
```

Independent project; not affiliated with VMSL.
