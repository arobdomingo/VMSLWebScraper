# Engineering improvements

Validation date: October 26, 2026. Baseline: `9c47149da426409e12aaa4f461d4e21fcf4f4a2c`.

These are local, AI-assisted changes prepared for the project owner's review. Nothing was deployed or pushed. Existing Git history does not establish who personally wrote every baseline feature. The owner should review, reproduce, and explain these changes before claiming authorship or using the candidate resume statements below.

## A. Original implementation and audit

The baseline already provided eight routed React pages: a season/division/team picker, team overview, standings, fixtures, scorers, MVPs, shutouts, and goal analytics. FastAPI/Pydantic supplied scraped data through a bounded HTTPX HTML cache; SQLAlchemy remained optional snapshot scaffolding. Existing backend tests, CI, deployment configuration, and extensive engineering notes were present. `docs/AUDIT.md` describes an earlier round of work and must not be interpreted as the baseline for this request.

| Area | Baseline status | Evidence and qualification |
|---|---|---|
| Frontend architecture | Implemented; reuse partial | Eight pages, shared Layout, GoalTrend, useApi and apiGet. Pages still contain substantial JSX and repeated feedback. No global state library needed for the current flows. |
| TypeScript | Implemented; API safety partial | Strict compilation and domain types; `res.json() as T` did not validate runtime JSON. |
| API and async state | Partial | HTTP error mapping, 45-second timeout, loading state, and active-effect stale-response guard existed. No cleanup cancellation; rapid A → B → A could reuse old A data before its new request completed. |
| Responsive design | Partial; initially browser-unverified | Existing breakpoints, horizontal navigation, and semantic scrollable standings already replaced the older dense grid. Long nowrap team names and narrow card padding needed attention. |
| Accessibility | Partial; initially browser-unverified | Skip link, focus styles, picker labels, table caption and column headers existed. MVP/shutout search labels, consistent status/error announcements, row headers, and explicit season validation feedback were missing. |
| Unit/integration tests | Frontend missing; backend implemented | No frontend test runner or test scripts. Existing `tests/test_api.py` contains deterministic parser/transport/API/analytics tests. |
| End-to-end tests | Missing | No browser automation configuration. Historical manual checks do not establish automated coverage. |
| Errors and edge cases | Partial | HTTP errors and several empty states existed. Malformed nested JSON could crash rendering; zero-game overview averages could display NaN/Infinity; empty goal data could leave a blank content area. |
| Performance | Partial; timings unverified | Schedule/leaderboard/analytics already use memoization. All pages eagerly imported into a single bundle. No render profile, Lighthouse report, or field measurements. |
| Build/lint/deployment | Configured | Vite production build, strict TypeScript, ESLint, lockfile, Vercel SPA rewrite, and Render config existed. Existing deployment revision was not verified. |
| CI/CD | CI configured; execution unverified | `.github/workflows/ci.yml` already ran backend pytest/ruff and frontend lint/build. Frontend tests were absent. Deployment automation success was not verified. |

Priorities presented before substantial edits: (1) deterministic frontend behavior tests; (2) request lifecycle and response safety; (3) shared feedback and scoped responsive/accessibility fixes; (4) bundle measurement and route splitting; (5) extend existing CI and document verified evidence. No major architecture or stack change was required.

## B. Implemented improvements and design decisions

### Testing

`vmsl-frontend/vitest.config.ts`, `src/test/setup.ts`, and `src/test/frontend.test.tsx` introduce Vitest, React Testing Library, and user-event. Tests exercise labeled controls and rendered outcomes rather than component internals. They cover successful selection/navigation, dependent resets, disabled controls, loading/network errors, empty/malformed responses, HTTP failures, invalid JSON, timeouts, abort/unmount behavior, late results, A → B → A changes, and semantic standings navigation.

`playwright.config.ts` and `e2e/navigation.spec.ts` run Chromium at 1280×720, 768×1024, and 390×844. Three scenarios per viewport exercise the picker through standings/fixtures/player/analytics pages, keyboard skip navigation, and direct-link API failure/malformed-data feedback. They also exercise scorer search and empty leaderboard/analytics results. API routes use fixed fixtures; no league service is contacted. Screenshots and traces are debugging artifacts, not screenshot-comparison tests.

Alternative considered: only testing mocked hooks would miss real API parsing and lifecycle failures. Component tests instead mock fetch; browser tests mock HTTP responses, retaining the real UI, router and API client. Full live scraping in browser tests would be slow and nondeterministic, so existing backend tests remain the lower-layer complement.

### API lifecycle and response boundaries

`src/hooks/useApi.ts` creates an AbortController per effect and aborts on selection changes/unmount. The active flag remains essential because cancellation is not a guarantee that an already-completing response stops. Request-key changes reset displayed state, including a return to an earlier selection while another request is pending. The conditional state adjustment occurs during render only when the key changes; React rerenders this component before committing its children. It does not run indefinitely or trigger another fetch by itself.

`src/api/client.ts` combines caller cancellation with the existing timeout and gives invalid JSON and timeouts readable messages. `src/api/responseValidation.ts` checks fields consumed by known pages before returning the generic result. It accepts additive unknown fields and permitted nullable/optional values, but rejects missing arrays, wrong nested types and non-finite numbers. This is a manually maintained, partial runtime contract, not generated end-to-end type safety or semantic data verification. A schema library/code generation could reduce duplication later; adding that infrastructure was unnecessary here. Unknown future endpoint paths still require a new validator.

No frontend cache, retry loop, global state manager, or new backend infrastructure was added. Navigating back can fetch again; React Strict Mode may start and cancel a development request. Existing backend caching remains the upstream deduplication policy.

### Reuse, responsiveness and accessibility

`RequestFeedback.tsx` centralizes page loading (`role="status"`) and failure (`role="alert"`) markup across data pages. `StandingsTable.tsx` isolates table semantics and formatting from standings page request/pool orchestration. Existing table scrolling, captions and column headers were retained; team names are now row headers and wrap on phones. Mobile spacing and the header wrap preserve the navy/emerald design.

The picker marks invalid seasons with `aria-invalid` and a linked error message; dependent controls and navigation are disabled when their prerequisites are invalid/unavailable. Empty division/team collections have feedback. MVP and shutout search inputs now have accessible names and empty-result messages. Main is programmatically focusable for the existing skip link. Team overview per-game averages display an em dash for zero games. Goal analytics explicitly reports missing team statistics.

Alternative considered: hiding statistics or replacing the whole table with mobile cards would duplicate content and risk losing information. The scrollable semantic table keeps all statistics available with a small change. No blanket memoization or large generic page/leaderboard framework was introduced.

### Performance and CI

`App.tsx` uses React Router's existing lazy route API to import page code on demand, with initial/transition loading feedback. This adds chunk requests when visiting a new route; it does not eliminate the framework bundle. No unmeasured re-render, caching, or virtualization optimization was added.

The existing Actions frontend job now runs `npm run test`, installs Chromium, runs `npm run test:e2e`, and uploads failure artifacts. The existing production build includes TypeScript compilation. Browser configs and browser tests also participate in TypeScript checking. Backend jobs and deployment settings are preserved.

## C. Verification

Local environment: macOS arm64, bundled Node 24.22.1, npm 10.9.9 for clean installation, Python 3.12 virtual environment; CI remains configured for Node 22 and Python 3.12. The default shell had no npm; the bundled Node plus pnpm's npm launcher supplied it. npm 10 encountered a resolver error upgrading Vitest; npm 11 completed the upgrade, then a clean npm 10 `ci` successfully validated the resulting lockfile. Vitest 4.1.12 is the patched selected version; the initially tried Vitest 3 was replaced after audit findings.

| Check | Local result |
|---|---|
| `npm ci` | Passed; 290 packages audited, zero reported vulnerabilities at verification time |
| `npm run test` | 24 tests passed |
| `npm run typecheck` | Passed, including browser test/config types |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `npm run test:e2e` | 9 Chromium checks passed: 3 scenarios × 3 viewports |
| `python -m pytest -q` | 23 existing backend tests passed; one Starlette/httpx deprecation warning |
| `ruff check backend tests` | Passed |
| GitHub Actions | Workflow extended; no remote execution claimed. Push and inspect Actions before claiming CI passed. |
| Deployed/live application | Not deployed or verified against live upstream data in this session |

Browser checks also verified no document-wide horizontal overflow on the tested standings fixture. Mobile, tablet and desktop standings screenshots were visually reviewed. This is a targeted fixture-based review, not all-device or full accessibility certification.

### Measured asset sizes

Baseline source was exported from the baseline commit to a temporary directory and built with the same Vite 7.3.7 toolchain. `scripts/measure-bundle.mjs` opens a fresh Chromium context for each production build, waits for the home picker, records requested JavaScript files, and calculates raw and default-zlib gzip sizes from those files. API data is mocked. This measures assets, not page-load duration, CDN compression, or bandwidth.

| Fresh home-page JavaScript | Baseline | Updated |
|---|---:|---:|
| Raw bytes across requested JS files | 327,177 | 298,504 |
| Sum of individually gzipped JS files | 98,595 | 96,464 |

This is a reduction of 28,673 raw bytes (8.8%) and 2,131 gzipped bytes (2.2%). The updated total includes entry, Home and shared useApi chunks; comparing only the entry chunk would overstate the benefit. Total bytes across every route can increase because of validation code and chunk overhead. CSS, HTML, HTTP headers and real source latency are excluded. No Lighthouse score, FCP/LCP improvement, render-time reduction, large-table benchmark, or real-user speed improvement is claimed.

Reproduce with ordinary installed Node/npm:

```bash
cd vmsl-frontend
npm ci
npm run test
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
node scripts/measure-bundle.mjs dist /path/to/baseline/dist
```

For the baseline comparison, export commit `9c47149` to a separate temporary directory, install/build its frontend with the same tool versions, and pass its dist directory as the second argument. The measurement script serves static assets on ephemeral loopback ports and closes the browser/server afterwards. Browser tests require permission to launch Chromium and bind a local port. Failure traces/screenshots appear under the ignored `test-results/` directory; inspect traces with `npx playwright show-trace <trace.zip>`.

## D. Remaining limitations

- No coverage percentage was collected. Counts describe executed cases, not comprehensive coverage. Firefox/WebKit, screen readers, contrast audits, zoom, reduced motion, every responsive breakpoint, and real mobile hardware remain untested.
- Browser fixture data is intentionally small. Large standings rendering, many pools, live scraper-to-browser integration, unusual historical seasons, and all leaderboard sorting/analytics cases remain outside this frontend suite.
- TypeScript interfaces and runtime response shapes must be maintained together. Runtime checking protects consumed structure, not source accuracy, cross-field invariants, or all API fields.
- No automatic retry button, stale-data fallback, shared frontend cache, durable snapshots, or background refresh was implemented. Upstream availability/markup can still break retrieval; the existing cache is per worker.
- TeamHub and leaderboard pages retain substantial JSX; a common leaderboard component may be useful after tests cover their ranking/highlighting differences. Avoid extracting a configurable framework solely to remove similar markup.
- Route import failures and unknown URLs still use Router's default error behavior. Deployments must retain SPA rewrites and old hashed assets appropriately; chunk-fetch failure recovery is a future improvement.
- CI is configured but has not run remotely for this change. Local verification used a different Node major from CI. No production reliability, deployment success, scalability, or Core Web Vitals claim follows from these checks.
- Existing backend dependency deprecation warning remains; backend code and dependency versions were not changed.

## E. Resume evidence and interview handover

These are candidate statements about repository work after personal review, not assertions that the owner independently authored the AI-assisted changes. The existing platform, backend tests/cache, design, strict types, and CI predate this session. The frontend suite, lifecycle/validation fixes, scoped UI changes, lazy loading, CI extensions and this documentation were AI-assisted in this session. State your actual review, testing and understanding accurately when asked.

| Candidate wording, after reviewing and reproducing | Exact supporting evidence | Boundary |
|---|---|---|
| Added deterministic React component and API lifecycle tests with Vitest and Testing Library, verifying dependent selectors, error states and stale-response handling. | `src/test/frontend.test.tsx`, `vitest.config.ts`; 24 locally passing cases | Do not say comprehensive coverage. Describe AI assistance accurately. |
| Added Chromium browser checks for team navigation, keyboard access and failure feedback at mobile, tablet and desktop sizes. | `e2e/navigation.spec.ts`, `playwright.config.ts`; 9 local checks | Three scenarios across three Chromium viewport configurations, not nine distinct flows or three browser engines. |
| Improved frontend request handling with cancellation, timeouts and runtime checks for malformed API responses. | `src/hooks/useApi.ts`, `src/api/client.ts`, `src/api/responseValidation.ts`; lifecycle and malformed-response regression tests | Stale-response protection and HTTP error mapping already existed; do not claim they were introduced from scratch. |
| Refined responsive standings and accessible form feedback while retaining the existing interface. | `StandingsTable.tsx`, `RequestFeedback.tsx`, `Home.tsx`, search labels, `App.css`; keyboard/standings browser checks | Existing semantic table, scrolling, picker labels and focus styles predate this session. No WCAG conformance claim. |
| Reduced measured initial home-page JavaScript asset size with lazy route loading. | `App.tsx`, `scripts/measure-bundle.mjs`, final byte measurements in section C | Use measured asset numbers only; do not turn them into page-load latency claims. CI extension is configured, not remotely proven. |

Paths in this evidence table are relative to `vmsl-frontend/` except the workflow and this document.

Practice explaining and demonstrating:

1. **Effects and races:** Why both abort and an active flag? Run the old/new response test and the A → B → A test; explain that response order can differ from selection order and why previously displayed data must reset.
2. **TypeScript vs JSON:** Explain how an `as T` assertion differs from runtime validation. Change a numeric API field to a string in a fixture and observe error feedback rather than a render crash. Discuss schema drift and when generated schemas would become worthwhile.
3. **Testing layers:** Component tests verify the real client/hook/React controls with fetch replaced. Browser tests verify routed browser interactions with HTTP fixtures. Backend tests check parsing/API logic separately. None of these alone proves the live source works.
4. **Accessibility:** Explain label associations, live status versus alerts, table captions/row headers, focusable skip targets, and horizontal scrolling. Navigate with only Tab/Enter and inspect the table's accessible name.
5. **Performance:** Explain dynamic imports, entry versus total initial assets, gzip, network-request overhead, and why smaller bytes are not proof of lower LCP. Run the measurement script and identify the three requested home chunks.
6. **CI and honest claims:** Explain lockfiles, clean installation, build/type checks, browser installation, deterministic fixtures and failure artifacts. Push/review the Actions run separately before saying the workflow passed remotely.
