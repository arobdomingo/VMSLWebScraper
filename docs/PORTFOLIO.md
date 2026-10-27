# Portfolio and interview preparation

## Defensible resume bullets

- Built a React/TypeScript and FastAPI soccer analytics application that normalizes public league HTML into typed standings, fixture and player-statistics APIs.
- Improved scraping reliability with bounded TTL caching, HTTP status validation, timeouts and safe API failure responses; consolidated three player-statistics parsers.
- Added 23 deterministic Python tests covering parsing, cache behavior, API contracts and team analytics, plus CI checks for backend lint/tests and frontend lint/build.
- Added 24 frontend component tests and 9 Chromium checks covering selection flows, request failures, keyboard navigation and responsive layouts.
- Redesigned the team explorer with responsive navigation, accessible selection controls, semantic standings and match goal-difference visualization.

Use only bullets you can explain and reproduce from the code, and describe AI assistance accurately. Frontend counts are recorded local results from October 26, 2026, not exhaustive coverage. Do not claim production throughput, deployed behavior or remote CI success without verification. The detailed [engineering report](../ENGINEERING_IMPROVEMENTS.md) attributes the frontend pass and documents measured asset sizes separately from page-load performance.

## A 60-second architecture explanation

“The app helps Vancouver soccer players understand their team's season. React pages call typed FastAPI endpoints. The backend downloads public league HTML through one HTTPX transport, parses it into normalized records, and uses Pydantic to define the JSON contract. Several endpoints need the same HTML, so I use a bounded five-minute cache at the document layer. Match analytics are computed from the selected team's perspective. The tests exercise parsers and API behavior using synthetic HTML and mocked requests, React behavior with mocked fetch, and routed browser flows with fixed API fixtures. Earlier manual checks also exercised a real season.”

## Discussion prompts

- Why cache HTML instead of endpoint responses? Walk through standings and team overview using the same source document.
- What was wrong with permanent database caching? Explain freshness and inconsistent views; discuss a future snapshot schema with timestamps and transactional replacement.
- How do you test a scraper without depending on a live website? Show the nested-table, no-table and unplayed-fixture tests.
- Why is the cache lock acceptable here? Explain serialized misses, worker-local state and when to replace it.
- How did a pool-edge bug happen? Trace slicing for the first and last teams and explain the parameterized boundary tests.
- How do you prevent stale frontend responses? Walk through `useApi` request keys, cancellation and cleanup guards, including A → B → A.
- What does TypeScript not guarantee? The generic fetch cast is compile-time only; Pydantic validates backend output and the frontend checks the consumed JSON structure at runtime. Neither guarantees that upstream data is accurate; the manual validators and interfaces can drift.
- How do you know the project is correct? Distinguish deterministic tests, live smoke checks, manual visual review and unverified historical coverage.
- What would you implement next? Saved representative upstream fixtures, source freshness indicators, head-to-head comparisons and a measured refresh/storage strategy. Explain which features use current records and which need new ingestion or persistence. See the [roadmap](ROADMAP.md).

## Suggested demo

Choose the 2027 ending year, Division 1, and a team. Explain standings and nearby rivals, show recent results, open fixtures, then compare goal rankings and the goal-difference figure. Demonstrate an invalid season or unavailable source gracefully. Explain that a season ending year differs from a calendar year and that upstream availability is outside the app's control.
