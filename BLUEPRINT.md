# burst-tea — system blueprint & changelog

This document is the **canonical guide** for humans and AI agents working on the Cafe POS monorepo. **Append dated entries to the Changelog** whenever you change APIs, schema, auth, Docker, or frontend contracts.

## Purpose

Production-oriented POS backend (Laravel) and staff SPA (React), with ledger-based inventory, customer credit, and cash drawer tracking for a small cafe.

## Repository layout

- [`backend/`](backend/) — Laravel API (`/api/v1`), Sanctum, Spatie Permission, MySQL.
- [`frontend/`](frontend/) — React 19 + Vite + TypeScript + Tailwind CSS v4 + TanStack Table; Zustand **auth only**; Axios via [`frontend/src/lib/api-client.ts`](frontend/src/lib/api-client.ts).
- [`docker-compose.yml`](docker-compose.yml) — base services (MySQL, Redis).
- [`docker-compose.dev.yml`](docker-compose.dev.yml) — dev overrides (backend `php artisan serve`, frontend Vite, hot reload).
- [`docker-compose.prod.yml`](docker-compose.prod.yml) — production images (PHP-FPM+Nginx API, static Nginx SPA).
- [`AGENTS.md`](AGENTS.md) — links to role prompts in [`.cursor/agents/`](.cursor/agents/).
- [`CLAUDE.md`](CLAUDE.md) — short pointer into this file.

## Stack versions (scaffold)

| Area | Version / notes |
|------|------------------|
| Laravel | 13.x (see `backend/composer.json`) |
| PHP | 8.4 (Dockerfiles) |
| Node | 24 (`docker-compose.dev.yml`, `docker/frontend/Dockerfile.prod`) |
| React | 19 |
| Vite | 8 |
| Tailwind | v4 (`@tailwindcss/vite`) |
| DB | MySQL 8 (Docker default); Laravel can be pointed at PostgreSQL via `.env` if needed |

## Backend conventions (strict)

- **Prefix:** all JSON routes under `/api/v1` ([`backend/routes/api.php`](backend/routes/api.php) → [`backend/routes/api_v1.php`](backend/routes/api_v1.php)).
- **Flow:** `Controller` → `FormRequest` → `Action` → `Service` → `Model` (mutations also check `$employee->hasPermission('...')`; superadmin bypasses permission checks via [`Employee::hasPermission`](backend/app/Models/Employee.php)).
- **Pagination:** Laravel paginator wrapped as `{ data, meta: { current_page, last_page, per_page, total }, links: { first, next, prev, last } }`.
- **Options:** list endpoints for dropdowns use `GET /api/v1/{resource}/options` (no pagination wrapper).
- **Errors:** validation uses Laravel default JSON (`message` + `errors`).
- **Ledgers:** append-only rows for inventory, credit, and cash drawer; multi-step writes use `DB::transaction()`.

### Seeded logins (local)

After `migrate:fresh --seed`:

- **Superadmin:** `admin@example.com` / `password`
- **Manager (all Spatie permissions):** `manager@example.com` / `password`

Permissions are defined in [`backend/app/Support/Permissions.php`](backend/app/Support/Permissions.php) and seeded by [`backend/database/seeders/PermissionSeeder.php`](backend/database/seeders/PermissionSeeder.php).

## Frontend conventions

- **No API calls in presentational components** — use hooks under [`frontend/src/hooks/`](frontend/src/hooks/) which call [`frontend/src/api/`](frontend/src/api/).
- **Auth state** — Zustand store [`frontend/src/stores/authStore.ts`](frontend/src/stores/authStore.ts) only.
- **Routes:** `/login`, `/dashboard`, `/orders`, `/products` ([`frontend/src/App.tsx`](frontend/src/App.tsx)).
- **Env:** `VITE_API_URL` (see [`frontend/.env.example`](frontend/.env.example)).

## Docker

### Development

Compose project network is typically `burst-tea_burst` (inspect with `docker network ls`).

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- API: `http://localhost:8080` (Laravel `serve` inside backend container).
- SPA: `http://localhost:5173`
- Set `VITE_API_URL` for the frontend service if needed (defaults to `http://localhost:8080/api/v1` in [`docker-compose.dev.yml`](docker-compose.dev.yml)).

Backend container runs `composer install`, `migrate`, then `php artisan serve`.

### Production (build smoke)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
```

Pass `VITE_API_URL` at build time so the SPA points at the public API URL ([`docker/frontend/Dockerfile.prod`](docker/frontend/Dockerfile.prod)). Set Laravel `APP_KEY` and database credentials via environment / secrets manager (not committed).

## Changelog

### 2026-04-16 — Repo docs & module workflow

- Added root [`README.md`](README.md): implemented vs pending SPA features, recommended module order, copy-paste implementation prompts, and guidance to minimize React context / global state.
- Added [`docs/MODULE_SPEC_TEMPLATE.md`](docs/MODULE_SPEC_TEMPLATE.md) and [`docs/modules/`](docs/modules/) for per-slice specs; Cursor agent [`module-spec`](.cursor/agents/module-spec.md) documents how to fill specs before coding.

### 2026-04-16 — Initial scaffold

- Laravel API with employees (Sanctum bearer tokens), Spatie roles/permissions, domain modules (categories, products + variants + modifiers, orders, payments, customers, credit ledger, inventory + recipes, shifts + cash ledger, expenses, cash advances).
- React SPA with login, dashboard, server-paginated orders/products tables (TanStack Table).
- Docker Compose base + dev + prod; PHP 8.4 + Node 24; MySQL 8; optional Redis.
- Added [`backend/config/cors.php`](backend/config/cors.php) for API CORS.
