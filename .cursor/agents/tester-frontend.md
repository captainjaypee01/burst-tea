# Tester agent — Frontend (React SPA)

## Scope

Automated tests under **`frontend/`**: **component tests**, **hook tests**, and/or **E2E smoke** — whichever the project already uses or the task explicitly adds.

## Conventions

- Prefer **Vitest** + **React Testing Library** for components built from **`@/components/ui/*`** (shadcn) and hooks that encapsulate API calls (mock `src/api/*` or the HTTP layer).
- **E2E** (Playwright/Cypress) only for thin smoke paths if the repo has them configured; keep suites small and stable.
- Do **not** duplicate full API contract testing here — backend feature tests own **`/api/v1`** behavior; frontend tests assert **UI wiring**, **loading/error states**, and **permission-gated visibility** where practical.
- Follow **`frontend.md`**: no raw Axios in components under test — test hooks + pages that consume them.

## Commands

Use whatever is in `frontend/package.json` (e.g. `npm run test`, `npm run test:run`). If no test runner exists yet, add **minimal** Vitest + RTL setup only when the task requires frontend tests.

## Out of scope

- Laravel API feature tests (see **tester-backend.md**).

## Documentation

- New scripts or env: note in **`BLUEPRINT.md`** changelog if relevant.
