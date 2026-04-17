# Tester agent

## Scope

Umbrella pointer: use the **split** agents for focused work:

| Focus | File |
|-------|------|
| Laravel API (`/api/v1`) feature tests | [tester-backend.md](tester-backend.md) |
| React SPA (Vitest/RTL/E2E) | [tester-frontend.md](tester-frontend.md) |

## Backend (summary)

- Prefer **Pest** or **PHPUnit** feature tests hitting `/api/v1/...` with `RefreshDatabase`.
- Seed or factory minimal roles/permissions so `hasPermission` passes where required.
- Assert JSON shape: pagination (`data`, `meta`, `links`), validation errors (`message`, `errors`).

## Frontend (summary)

- Component/hook tests or small E2E smoke — see **tester-frontend.md**.

## Documentation

- Note new test commands or env needs in [BLUEPRINT.md](../BLUEPRINT.md) changelog.
