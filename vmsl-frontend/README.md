# VMSL frontend

React, TypeScript, React Router, Vite and Tailwind. See the [root README](../README.md) for setup, API configuration and data notes.

```bash
npm ci
npm run dev
```

Run `npm run lint`, `npm run test` and `npm run build` to validate. Browser checks use `npm run test:e2e` after installing Chromium with `npx playwright install chromium`.

Set `VITE_API_BASE_URL` in `.env.local` to override the default API origin (`http://127.0.0.1:8000`).
