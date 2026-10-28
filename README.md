# VMSL / Team Hub

A team-focused analytics application for the **Vancouver Metro Soccer League**. Explore standings, fixtures, recent form, player leaderboards and goal statistics from public league pages.

[Web app](https://vmsl-web-scraper.vercel.app/) · [Source](https://github.com/arobdomingo/VMSLWebScraper)

## Features

- Division standings, team overviews, schedules and scoring, MVP and shutout leaderboards.
- Goal rankings, per-game statistics and match goal-difference charts.
- Head-to-head team comparisons and completed meetings within a selected season and division.
- Home/away records, scoring, conceding and clean-sheet splits.
- Next-fixture difficulty based on the opponent's current pool points per game: High ≥ 2, Medium ≥ 1, Low < 1. This is descriptive, not a prediction; teams with no games or in another pool receive no rating.
- Responsive layouts, searchable player lists and shareable opponent selections.

## Run locally

Requires **Python 3.12**, **Node.js 22.12+** and npm. From the repository root:

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

Open `http://localhost:5173`. API documentation is at `http://127.0.0.1:8000/docs`. Internet access is required for league data; no database or credentials are needed. Select a season by its ending year: `2027` means 2026–27.

## Architecture

React, TypeScript, React Router, Vite and Tailwind render the interface. FastAPI and Pydantic expose normalized JSON. BeautifulSoup and pandas/lxml parse public HTML fetched through HTTPX. A bounded per-process cache reuses source documents for five minutes by default. Team analytics are derived from standings and completed fixtures without additional upstream sources.

The frontend cancels obsolete requests, checks consumed API response shapes at runtime, and loads pages on demand. Tests use synthetic HTML and fixed API fixtures. Optional SQLAlchemy snapshot utilities are separate from the API and are not required for browsing.

## Configuration

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Frontend API origin; defaults to `http://127.0.0.1:8000`. Set in `vmsl-frontend/.env.local` before building. |
| `SCRAPE_CACHE_TTL` | Backend HTML cache lifetime in seconds; defaults to `300`. |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins. |
| `DATABASE_URL` | Optional snapshot utilities only; defaults to `sqlite:///./vmsl.db`. |

Examples are in `backend/.env.example` and `vmsl-frontend/.env.example`. Backend environment files require `--env-file`. Never place secrets in Vite variables. Render uses `render.yaml`; Vercel deep-link rewrites are configured in `vmsl-frontend/vercel.json`.

## Validate

```bash
# Backend, from repository root
python -m pytest -q
ruff check backend tests

# Frontend
cd vmsl-frontend
npm run lint && npm run test && npm run build
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs backend and frontend checks. Python dependencies have a tested-environment lockfile; npm uses `package-lock.json`.

## Data notes

League availability and markup can change. The cache has no durable history or offline fallback. Comparisons cover only the selected season and available fixtures; they are not all-time records. Home/away points use 3 for a win and 1 for a draw and may differ from official standings adjustments. Next-fixture selection uses unscored fixtures dated today or later in Vancouver; kickoff times and postponement status are not currently modeled. Player rankings across pools are exploratory.

This independent project is not affiliated with VMSL. The hosted app may run a different revision from the repository.
