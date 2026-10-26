# VMSL frontend

React, TypeScript, React Router, Vite and Tailwind. See the root [setup guide](../README.md) for backend configuration and [engineering handover](../ENGINEERING_IMPROVEMENTS.md) for the audit, changes, verification limits and interview exercises.

Use Node 22.12+ and npm:

```bash
npm ci
npm run dev
```

Set `VITE_API_BASE_URL` in `.env.local` if needed (default `http://127.0.0.1:8000`). No secrets belong in Vite environment variables.

```bash
npm run test          # deterministic Vitest / Testing Library tests
npm run test:watch    # interactive feedback while editing
npm run typecheck    # app, configuration, and browser-test TypeScript
npm run lint
npm run build        # TypeScript + production bundle
npx playwright install chromium
npm run test:e2e     # starts Vite on 127.0.0.1:4173; mocks backend responses
```

Browser tests run the same three scenarios in desktop, tablet and phone Chromium viewports. They do not require a running backend or contact VMSL. Run `npx playwright test --project=mobile` for one viewport. Tests retain failure traces and generate standings screenshots under ignored `test-results/`. On Linux, use `npx playwright install --with-deps chromium` when system packages are missing (as CI does).

Vitest tests query labels, roles and visible feedback. `src/test/frontend.test.tsx` covers picker behavior, navigation, request failures, malformed JSON, cancellation and response races. `e2e/navigation.spec.ts` covers browser navigation, search, keyboard access and API error feedback. There is no verified coverage percentage or claim of full cross-browser coverage.

Pages own route-specific rendering; `useApi` owns request lifecycle; `apiGet` owns transport/error translation; response validation guards fields consumed by known endpoints. Add/update the corresponding runtime response shape and tests when changing an API contract. New page routes use lazy imports to defer their code until visited.

To inspect production home-page JavaScript sizes:

```bash
npm run build
node scripts/measure-bundle.mjs dist
# Optional comparison with a separately built baseline:
node scripts/measure-bundle.mjs dist /path/to/baseline/dist
```

This uses fresh Chromium contexts and local static servers, mocks the division request, and sums actual requested JavaScript file sizes plus per-file gzip estimates. It does not measure real network latency or Lighthouse performance.
