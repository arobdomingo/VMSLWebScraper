# Feature roadmap

Proposals reviewed against the repository on October 27, 2026. None of the features below is claimed as implemented. Prioritize correctness and useful team insights over infrastructure or speculative statistics.

## What the current pipeline actually supplies

| Source path | Normalized data available today | Important boundary |
|---|---|---|
| Division statistics HTML | Pool standings: played, wins/draws/losses, goals for/against, goal difference and points | Source tables are a current snapshot, not a history of table changes |
| Same division statistics HTML | Division schedule: date, home/away team, score when present, field | Parser currently discards kickoff time and does not model postponement/cancellation |
| Player/goalkeeper/MVP HTML | Player name, team and season aggregate goals, shutouts or MVP awards | No stable player IDs, appearances, minutes, match events or player-level match history |
| Season/division selectors | Available divisions and discovered season ending year | Historical markup and completeness are not comprehensively verified |

The transport downloads these pages on demand through a bounded, per-process HTML cache (64 entries, five-minute default TTL). It is not a scheduled ingestion job. SQLAlchemy utilities are optional scaffolding; the API does not persist a durable statistical history. The existing team schedule API exposes a filtered view of a parsed division schedule; division-wide features need a service/API contract exposing the relevant records.

## Recommended sequence

### 1. Data trust and recovery

**User value:** show when a source document was fetched, explain partial/unavailable data and let the user retry a failed request.

**Changes:** retain fetch timestamps/provenance in transport metadata, expose them through API metadata or headers, and distinguish an empty leaderboard from missing expected source markup. A retry button should rerun the selected request without an unbounded loop. Preserve kickoff time and explicit fixture status where the source provides them, using fixture-based parser tests first.

**Acceptance:** cache hits preserve the original fetch timestamp; expiration updates it; source failures cannot masquerade as a current empty table. A retry recovers from a mocked transient failure. A user retry must not automatically bypass the upstream cache or create excessive requests. Label a fetched timestamp as retrieval time, not the league's own last-update time.

### 2. Head-to-head / match preview

**User value:** compare two teams before a fixture: standings, per-game goals, recent form and available results against each other.

**Pipeline fit:** reuse standings and the parsed division schedule. Filter completed fixtures involving both teams; no new source or database is required for a same-season comparison. Reuse existing team resolution and perspective calculations through a small service instead of copying route logic.

**Acceptance:** home and away scores are interpreted correctly; unplayed fixtures are excluded from results; no prior meeting produces a clear empty state. Keep season, division and pool visible. Only compare supported teams within a division initially, and do not call limited available meetings an all-time record.

### 3. Home/away and recent-form splits

**User value:** compare home versus away points per completed match, scoring, conceding, clean sheets and last-five form.

**Pipeline fit:** derive from existing fixture home/away names and scores. No new ingestion or persistence is needed. Current overview form already exists; this adds explicit split aggregates and comparisons rather than duplicating it.

**Acceptance:** zero-match groups display unavailable values, not misleading zeros or division-by-zero results. Played means both scores exist, including 0–0. Label fixture-derived points as calculated (3/1/0); they may differ from official standings because of deductions, awarded results or missing fixtures. Do not invent league tie-break rules.

### 4. Remaining-fixture difficulty

**User value:** show which upcoming opponents currently have stronger records.

**Pipeline fit:** combine unplayed fixtures with each opponent's current standings points per game. Use a transparent descriptive score, such as mean opponent points per game. Fetching division schedules uses the existing cached document, not a new upstream integration.

**Acceptance:** handle zero-game opponents, unequal remaining schedules, missing teams and pool boundaries. Display the formula and sample size. Fix or explicitly label unresolved past/unscored fixtures before calling them upcoming. Describe difficulty as a current-table heuristic, not a win probability or calibrated prediction.

### 5. Shareable comparisons and exports

**User value:** bookmark a selected comparison/filter and download standings or fixtures for a spreadsheet.

**Pipeline fit:** URL query parameters, optional local-browser favorites and CSV exports reuse current API data. No account service is needed. Local favorites use season/division/team slug as a scoped key; team renames can invalidate them.

**Acceptance:** direct links restore selections; invalid parameters receive feedback; exports include season, division and retrieval context. Quote CSV correctly and neutralize spreadsheet formulas in source-controlled text fields. Favorites need remove/reset controls and should not be described as synchronized across devices.

### 6. Snapshot history and change tracking

**User value:** show how official table positions and points change between captures; later support meaningful change notifications.

**Pipeline fit:** this is the first proposal that requires a durable ingestion pipeline. Store validated, timestamped division snapshots with source identity and idempotent ingestion. Refresh through an explicit command initially; only add a scheduler after refresh behavior is tested. Rework legacy per-row commits into atomic snapshot transactions and add persistence tests and migrations before reuse.

**Acceptance:** repeated ingestion is idempotent, a failed/partial scrape cannot replace a valid snapshot, retention is bounded and historical gaps are visible. History starts when capture begins; current season totals cannot reconstruct past official standings. Do not promise notifications until reliable change detection and an authorized delivery channel exist.

## Defer until new data is available

- **Expected goals, shot maps and possession analytics:** current ingestion has no shot events, shot locations or possession data.
- **Player efficiency/per-90 rankings:** aggregate leaderboards do not include minutes or appearances.
- **Player career history or transfer tracking:** names and team-local rows are not stable player identifiers. Team-name slugs also need a cross-season identity strategy before reliable season comparisons.
- **Real-time score alerts:** current polling/cache behavior and source publication cadence do not support a real-time claim.
- **Predictive match models:** require an explicit dataset, leakage-safe evaluation and calibration; table-based descriptive insights are more defensible first.

## Suggested next increment

Implement data trust/recovery and head-to-head previews, followed by home/away splits. This yields useful product behavior from existing inputs, a clear data-quality story, and testable pure calculations without new services. Snapshot history is a later engineering project with a distinct storage and ingestion scope.
