# Repository audit and implementation plan

## Baseline architecture
React 19 / TypeScript / Vite 7 / Tailwind 4 / React Router 7 render eight pages. Pages fetch FastAPI JSON endpoints. HTTPX downloads public VMSL HTML; BeautifulSoup identifies controls and pandas normalizes tables. SQLAlchemy stores standings only; other statistics are scraped on demand. There are no tests or CI checks. Database models for matches and player statistics are unused scaffolding.

## Findings (before changes)
- Critical: package imports conflict with Render's root-level launch command; Render installs a nonexistent root requirements file. Local startup requires a developer-specific PostgreSQL account and manual table creation.
- High: persisted standings never refresh. Team overview and analytics can disagree with the table. HTTP status codes are ignored; malformed upstream markup becomes opaque 500 responses containing exception details.
- High: no tests, input constraints, CI, dependency bounds, request deduplication or documented failure policy.
- High: rival-window calculation uses negative slicing and incorrect arithmetic at pool boundaries. Schedule reverses React state in place. Frontend requests can overwrite newer selections.
- Medium: repeated leaderboard parsing, route/business logic coupling, debug prints, unused dependencies and committed bytecode.
- Medium: demo CSS constrains and centers the entire app, overrides buttons, and applies conflicting dark colors. Tables lack semantic markup; selectors lack label associations. Goal trend is unfinished. Nullable API fields are represented as required in TeamHub.
- Presentation: README lists features but omits engineering tradeoffs, tests, deployment details and interview context.

## Prioritized implementation
1. Fix package startup, portable SQLite default, schema initialization and deployment configuration. Keep SQLAlchemy and optional PostgreSQL rather than adding infrastructure.
2. Centralize bounded HTTP fetching, status handling and short-lived HTML caching. Stop indefinitely caching standings in the API; keep the existing persistence module available for future snapshot work.
3. Extract pure team analytics; fix pool boundaries and chronology; validate API inputs and return safe upstream errors.
4. Add deterministic parser, analytics and API tests with synthetic HTML and mocked HTTP. Add CI for backend tests and frontend build/lint.
5. Establish a navy/emerald sports design system, responsive navigation, accessible selectors, semantic standings and a real goal-difference visualization. Address request lifecycle and empty states.
6. Document setup, architecture, limitations, resume claims and interview tradeoffs; record actual validation results.

## Portfolio assessment
The original breadth is useful: scraping heterogeneous HTML, typed API contracts and team analytics form a coherent problem. Reliability and reproducibility matter more than adding features. Avoid claims of production scalability, performance gains or complete historical coverage without measurement. A short-lived per-process cache is appropriate for this scope; distributed refresh jobs and durable snapshots remain explicit future work.
