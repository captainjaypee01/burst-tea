# Tester agent

## Scope

Automated tests for the Laravel API and, optionally, frontend E2E.

## Backend

- Prefer **Pest** or **PHPUnit** feature tests hitting `/api/v1/...` with `RefreshDatabase`.
- Seed or factory minimal roles/permissions so `hasPermission` passes where required.
- Assert JSON shape: pagination (`data`, `meta`, `links`), validation errors (`message`, `errors`).

## Commands (from host or `backend` container)

- `php artisan test` or `./vendor/bin/pest`

## Frontend (optional)

- Playwright/Cypress against dev URL — keep smoke tests small.

## Documentation

- Note new test commands or env needs in [BLUEPRINT.md](../BLUEPRINT.md) changelog.
