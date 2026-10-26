# VMSL / Team Hub

A team-focused analytics application for the **Vancouver Metro Soccer League**. Explore standings, recent form, upcoming fixtures, scoring leaders, MVPs, shutouts and goal statistics from publicly available league pages.

[Existing deployment](https://vmsl-web-scraper.vercel.app/) · [Repository](https://github.com/arobdomingo/VMSLWebScraper)

The deployment may run an earlier revision. Changes in this workspace have not been published. This independent project is not affiliated with VMSL.

## Run locally

Use **Python 3.12** and **Node.js 22** (Node 22.12+). Run commands from the repository root unless shown otherwise.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-lock.txt
python -m uvicorn backend.main:app --reload --env-file backend/.env.example
```

```bash
cd vmsl-frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. API documentation: `http://127.0.0.1:8000/docs`; health: `/health`. The API requires Internet access to retrieve league data. No database or credentials are required to browse the application.

The season is identified by its **ending year**: `2027` means 2026–27. The picker proposes a year based on the local date; historical availability depends on the source.

## Configuration

Frontend: copy `vmsl-frontend/.env.example` to `vmsl-frontend/.env.local` to override `VITE_API_BASE_URL`. Vite embeds it at build time; it must contain no secrets.

Backend environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `SCRAPE_CACHE_TTL` | `300` seconds | Per-process HTML freshness window |
| `CORS_ORIGINS` | Local Vite origins and existing Vercel origin | Comma-separated frontend origins |
| `DATABASE_URL` | `sqlite:///./vmsl.db` | Optional legacy snapshot utilities only |

Environment files are loaded only when explicitly passed with `--env-file`. Render uses `render.yaml` from the repository root. Configure the frontend API URL and backend CORS origins for your own deployment. A static frontend host needs an SPA rewrite to `index.html` for deep links (provided in `vmsl-frontend/vercel.json`).

## Architecture

```text
React pages → useApi / apiGet → FastAPI routes → HTML parsers → HTTPX → VMSL
                                        ↓             ↓
                                  Pydantic JSON   bounded TTL cache
```

- **React + TypeScript, Router, Vite, Tailwind:** team navigation, searchable player lists, rankings and match analytics. `useApi` owns asynchronous request state and ignores responses after selection changes or unmounting.
- **FastAPI + Pydantic:** documented JSON contracts, bounded season/division inputs, meaningful 404/422 responses and safe 502 errors for source failures.
- **HTTPX transport:** status validation, timeouts, one connection retry and a maximum of 64 cached HTML documents. A lock coalesces concurrent misses and reduces duplicate upstream requests.
- **BeautifulSoup + pandas/lxml:** controls and leaderboard headers are parsed structurally; standings/schedules are normalized from HTML tables. Nested layout tables are excluded from player lists.
- **Pure analytics:** match results are calculated from the selected team's perspective. Nearby rivals use a bounded window; played fixtures and goal trends are chronological.

The existing SQLAlchemy modules remain as optional snapshot scaffolding and are **not used by the API**. Indefinitely cached database standings could disagree with freshly scraped analytics. A shared short-lived HTML cache is the simpler consistent policy for this portfolio's scope. To initialize optional tables, run `python -m backend.init_db`; PostgreSQL requires an explicit `DATABASE_URL`. Existing database contents are not migrated or deleted.

See [audit and priorities](docs/AUDIT.md), [design decisions and limitations](docs/ENGINEERING.md), and [interview notes](docs/PORTFOLIO.md).

## Validate

```bash
python -m pytest -q
ruff check backend tests
ruff format --check backend tests
cd vmsl-frontend
npm run lint
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

`requirements-lock.txt` captures the validated Python development environment; bounded direct dependencies live in `requirements.txt` and `requirements-dev.txt`. The frontend uses `package-lock.json`. GitHub Actions is configured for backend tests/lint and frontend lint, component tests, TypeScript/build, and Chromium browser tests. Remote execution of the new checks has not been verified.

Tests use synthetic HTML and mocked transport, so they are deterministic and do not burden VMSL. They cover parser contracts, nested tables, completed/unplayed fixtures, cache expiry, failed requests, API validation, team perspective and rival-window boundaries. Live browser checks supplement these tests; they do not guarantee every historical division remains supported.

## Known limits

The upstream site can change markup or be unavailable. The cache is per worker and has no stale-data fallback, durable snapshots or background refresh. Match dates currently omit kickoff time and postponement status. Player rankings across pools are exploratory and are not an official league ranking. The UI now has deterministic component and Chromium interaction tests; these do not replace live integration or full accessibility testing. See the engineering notes for the full validation record and next steps.

See [the current frontend audit, changes, verified results and interview exercises](ENGINEERING_IMPROVEMENTS.md) for this AI-assisted engineering pass, measured asset sizes, remaining limits, and resume evidence.
