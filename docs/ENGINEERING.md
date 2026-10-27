# Engineering status and decisions

Documentation reconciled October 27, 2026. The October 26 frontend pass supersedes the frontend limitations in the earlier implementation notes. [ENGINEERING_IMPROVEMENTS.md](../ENGINEERING_IMPROVEMENTS.md) contains its detailed evidence; [ROADMAP.md](ROADMAP.md) separates proposed features from current capabilities.

## Tradeoffs

1. **Cache HTML rather than every endpoint.** Standings, team lookup and schedule share the same upstream document. Reusing that document avoids unnecessary requests and keeps derived views aligned within the freshness window. The cache is bounded (64 keys), expires after five minutes by default, and never stores HTTP failures. Expired documents are not served as if current. Each process has its own cache.
2. **Serialize cache misses.** One process-wide lock coalesces duplicate requests without a task queue or cache service. It also blocks unrelated misses during an upstream request. This is deliberately simple for a low-traffic project; a per-key lock or scheduled snapshot refresh is the next step if measured concurrency demands it.
3. **Stateless API over partial persistence.** The old database path stored standings forever while other views fetched current data. Removing that path from requests fixes a correctness problem and makes setup reproducible. Existing SQLAlchemy utilities remain for future explicit snapshot work; they have no freshness policy and should not be presented as production storage.
4. **One leaderboard parser.** Headers determine player/team/metric columns. Only leaf tables are parsed, because VMSL nests data tables inside layout tables. Synthetic fixtures cover this specific failure mode. Missing player tables currently produce empty lists; malformed standings selectors/tables produce upstream errors.
5. **Small request hook.** Pages retain ownership of their presentation and filters. The hook associates results with the request path, cancels obsolete requests and ignores late responses, including A → B → A selection changes. The client combines cancellation with a 45-second timeout. Runtime checks validate fields consumed by known pages; TypeScript types and validators still need to be maintained together. There is no shared client-side cache.
6. **No chart dependency.** A lightweight bar figure summarizes match goal differences, alongside the existing readable values. Color is supplemented by an accessible text description and numerical data. Bars show absolute magnitude; losses are red. This is a match-by-match chart, not cumulative goal difference.

## Recorded verification

October 26 frontend validation recorded 24 component tests and 9 Chromium checks passing, together with TypeScript, ESLint and production build checks. The 23 backend tests and Ruff lint also passed in that session. Browser scenarios use fixed API fixtures at 1280 × 720, 768 × 1024 and 390 × 844. No coverage percentage or cross-browser conformance is claimed. These checks were not rerun for the October 27 documentation update.

### Earlier live verification — October 24, 2026

- Backend: 23 deterministic pytest cases passed. Ruff lint and formatting are checked.
- Frontend: TypeScript compilation, ESLint and Vite production build passed after compatible dependency updates.
- npm audit reported 16 vulnerabilities in the original lockfile; compatible updates produced zero reported vulnerabilities at validation time. This is a point-in-time registry result, not a security guarantee.
- Live source smoke checks: 2026–27 Division 1 team list, standings, scorers, MVPs and shutouts returned HTTP 200. Browser flow exercised picker → team overview → goal analytics with real upstream data.
- Manual responsive review: goal analytics at 390 × 844 had equal viewport and document widths (no horizontal page overflow); team dashboard, navigation and horizontally scrollable standings were visually inspected.
- Tests revealed and fixed missing-table parser fallback and an incorrectly annotated query parameter. Live source inspection revealed nested leaderboard duplication; a regression test now covers it.
- Current FastAPI/Starlette test client emits a deprecation warning about HTTPX. Tests pass; revisit the test transport when upgrading that stack.

## Remaining work / boundaries

- Deployment behavior and remote CI execution are not verified by the recorded local checks. The workflow now includes frontend component and Chromium tests as well as backend tests, lint and build checks.
- No full historical corpus, malformed leaderboard corpus, load test or PostgreSQL integration test has been run.
- Optional persistence utilities retain per-row commits and unused schema scaffolding. Before reuse, add transactional snapshot replacement, migrations, freshness metadata and persistence tests.
- Match parser drops kickoff time and cannot distinguish postponed fixtures from unplayed fixtures. The next fixture means earliest unscored source fixture, which may be in the past.
- Upstream numeric standings values fail explicitly instead of silently becoming zero. Additional unexpected schema changes can still raise internal errors; source monitoring and representative saved fixtures would improve coverage.
- No distributed cache, rate limiting, stale fallback or background refresh. Do not claim production-scale reliability.
- Leaderboard/analytics layouts still include CSS grids; standings use a shared semantic scrollable table with captions, column and team row headers. Shared feedback announces loading and errors. Broader screen-reader, contrast, zoom, Firefox/WebKit and real-device testing remain outstanding.
- Route import failures and unknown URLs use Router defaults. Retry controls and a designed recovery flow remain outstanding.
- Automated frontend tests are implemented, but large fixture datasets, many pools and live scraper-to-browser integration remain outside the recorded suite.
- Resume claims should focus on verified behavior and design decisions, not fabricated latency or scale improvements.
