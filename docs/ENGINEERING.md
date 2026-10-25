# Engineering decisions and validation

## Tradeoffs

1. **Cache HTML rather than every endpoint.** Standings, team lookup and schedule share the same upstream document. Reusing that document avoids unnecessary requests and keeps derived views aligned within the freshness window. The cache is bounded (64 keys), expires after five minutes by default, and never stores HTTP failures. Expired documents are not served as if current. Each process has its own cache.
2. **Serialize cache misses.** One process-wide lock coalesces duplicate requests without a task queue or cache service. It also blocks unrelated misses during an upstream request. This is deliberately simple for a low-traffic project; a per-key lock or scheduled snapshot refresh is the next step if measured concurrency demands it.
3. **Stateless API over partial persistence.** The old database path stored standings forever while other views fetched current data. Removing that path from requests fixes a correctness problem and makes setup reproducible. Existing SQLAlchemy utilities remain for future explicit snapshot work; they have no freshness policy and should not be presented as production storage.
4. **One leaderboard parser.** Headers determine player/team/metric columns. Only leaf tables are parsed, because VMSL nests data tables inside layout tables. Synthetic fixtures cover this specific failure mode. Missing player tables currently produce empty lists; malformed standings selectors/tables produce upstream errors.
5. **Small request hook.** Pages retain ownership of their presentation and filters. The hook associates results with the request path and ignores late responses. Requests are bounded by a 45-second browser timeout. Ignored requests still finish in the background; there is no client-side cache.
6. **No chart dependency.** A lightweight bar figure summarizes match goal differences, alongside the existing readable values. Color is supplemented by an accessible text description and numerical data. Bars show absolute magnitude; losses are red. This is a match-by-match chart, not cumulative goal difference.

## Validation record — October 24, 2026

- Backend: 23 deterministic pytest cases passed. Ruff lint and formatting are checked.
- Frontend: TypeScript compilation, ESLint and Vite production build passed after compatible dependency updates.
- npm audit reported 16 vulnerabilities in the original lockfile; compatible updates produced zero reported vulnerabilities at validation time. This is a point-in-time registry result, not a security guarantee.
- Live source smoke checks: 2026–27 Division 1 team list, standings, scorers, MVPs and shutouts returned HTTP 200. Browser flow exercised picker → team overview → goal analytics with real upstream data.
- Manual responsive review: goal analytics at 390 × 844 had equal viewport and document widths (no horizontal page overflow); team dashboard and navigation were visually inspected.
- Tests revealed and fixed missing-table parser fallback and an incorrectly annotated query parameter. Live source inspection revealed nested leaderboard duplication; a regression test now covers it.
- Current FastAPI/Starlette test client emits a deprecation warning about HTTPX. Tests pass; revisit the test transport when upgrading that stack.

## Remaining work / boundaries

- No production deployment was changed. CI configuration is added but has not run on GitHub.
- No full historical corpus, malformed leaderboard corpus, load test or PostgreSQL integration test has been run.
- Optional persistence utilities retain per-row commits and unused schema scaffolding. Before reuse, add transactional snapshot replacement, migrations, freshness metadata and persistence tests.
- Match parser drops kickoff time and cannot distinguish postponed fixtures from unplayed fixtures. The next fixture means earliest unscored source fixture, which may be in the past.
- Upstream numeric standings values fail explicitly instead of silently becoming zero. Additional unexpected schema changes can still raise internal errors; source monitoring and representative saved fixtures would improve coverage.
- No distributed cache, rate limiting, stale fallback or background refresh. Do not claim production-scale reliability.
- Most existing leaderboard/analytics layouts remain CSS grids; full standings now use a semantic scrollable table. Broader screen-reader testing and automated frontend tests remain useful next steps.
- Resume claims should focus on verified behavior and design decisions, not fabricated latency or scale improvements.
