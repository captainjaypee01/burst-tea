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

### Domain: Cash drawer & shift ledger

- **Cash ledger** (`GET /api/v1/shifts/{shift}/cash-ledger`) is **append-only** for a single shift. Line kinds include **`opening`**, **`sale`**, **`expense`**, **`advance`**, **`adjustment`**, **`closing`** (see `CashLedgerType`).
- **Sales** post when the **ordering/payment** flow resolves a **cash** or **e-wallet** payment and records a row via `CashDrawerService` / `PostPaymentAction` (requires a resolved **`shift_id`** when policy demands it).
- **Expenses** and **cash advances** append ledger rows when created with **`shift_id`** (`POST /api/v1/expenses`, `POST /api/v1/cash-advances`). Shift session UI prefills `shift_id` from the current open shift; **positive** amounts in the API represent money **out** of the drawer—`CashDrawerService` stores **negative** `amount_cents` for expense/advance lines. **Adjustments** use **signed** `delta_cents` with a required **reason**.
- **Closing** records **counted physical cash** (`closing_cents`); e-wallet totals may appear in ledger/history for reconciliation but **close** is about **cash in the drawer** per product rules.
- Full narrative and acceptance criteria: [`docs/modules/shifts-and-session.md`](docs/modules/shifts-and-session.md).

### Seeded logins (local)

After `migrate:fresh --seed`:

- **Superadmin:** `admin@example.com` / `password`
- **Manager (all Spatie permissions):** `manager@example.com` / `password`
- **Staff (typical register permissions):** `staff@example.com` / `password`

Permissions are defined in [`backend/app/Support/Permissions.php`](backend/app/Support/Permissions.php) and seeded by [`backend/database/seeders/PermissionSeeder.php`](backend/database/seeders/PermissionSeeder.php).

## Frontend conventions

- **No API calls in presentational components** — use hooks under [`frontend/src/hooks/`](frontend/src/hooks/) which call [`frontend/src/api/`](frontend/src/api/).
- **Auth state** — Zustand store [`frontend/src/stores/authStore.ts`](frontend/src/stores/authStore.ts) only.
- **Routes:** `/login`, `/dashboard`, `/orders`, `/products`, `/shifts/session`, `/cash-registers`, `/cash-registers/:cashRegisterId/ledger-history` ([`frontend/src/App.tsx`](frontend/src/App.tsx)).
- **Env:** `VITE_API_URL` (see [`frontend/.env.example`](frontend/.env.example)).

### Implementation sequencing (repo-wide)

Canonical **order** for **next** SPA work is documented in [`README.md`](README.md) (**Module roadmap**). In short:

- **Next module:** **Catalog** — staff CRUD for **categories**, **products**, and **variants** (APIs already exist); planned spec [`docs/modules/catalog.md`](docs/modules/catalog.md).
- **Ordering / POS** follows **catalog** so line items reference real variants and prices.
- **Inventory** (inventory items, **inventory ledger**, stock movements, recipes) is an **operational record** of what you keep in stock (e.g. patties, cups). It is **not** a prerequisite to **taking orders** unless you later add **hard stock enforcement** at checkout. Inventory can ship **after** a minimal ordering path or **in parallel** for back-office use only.

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

### 2026-04-17 — Roadmap: catalog next; inventory vs ordering

- [`README.md`](README.md) **Module roadmap** updated: **Catalog** (categories + products + variants) is **next**; **POS/ordering** after catalog; **inventory** described as **stock records** (optional enforcement later), **not** blocking ordering MVP.
- [`docs/modules/catalog.md`](docs/modules/catalog.md) added as **draft** next-module spec. **Implementation sequencing** subsection added above (this file).

### 2026-04-17 — Shifts & cash module spec alignment

- Refreshed [`docs/modules/shifts-and-session.md`](docs/modules/shifts-and-session.md) for **current** API and SPA: register **shift history page** (`/cash-registers/:cashRegisterId/ledger-history`), **entry-type** control on shift session (expense / advance / adjustment), **refresh** behavior (shift list vs ledger), amount semantics (positive outflows vs signed adjustment), and acceptance criteria.
- **Domain: Cash drawer** note above: expense/advance **positive input → negative stored**; adjustments **signed**.

### 2026-04-17 — Register shift history page & session cash-out UI

- **`GET /api/v1/cash-registers/{cash_register}/shifts`** — Paginated shifts for a register (newest first), with `user`, `closedBy`, and `cash_register` loaded. Requires **`register.read`** and **`cash.read`**.
- **SPA:** Shift session records **expense** / **cash advance** (`POST /expenses`, `POST /cash-advances` with `shift_id`); **`CashLedgerPanel`** refreshes after posts. **Cash registers** → **History** opens **`/cash-registers/:cashRegisterId/ledger-history`** (**`CashRegisterLedgerHistoryPage`**: shift list, **View ledger**, back to registers; uses **`fetchCashRegister`** + existing shift/ledger APIs). Replaces the prior history **dialog**.

### 2026-04-17 — Cash ledger & ordering alignment (documentation)

- Documented **cash ledger** semantics (append-only rows; kinds `opening`, `sale`, `expense`, `advance`, `adjustment`, `closing`), **payment → shift → ledger** expectations for the future **ordering** UI, and **expense / cash advance** via `shift_id` in [`docs/modules/shifts-and-session.md`](docs/modules/shifts-and-session.md).
- Added a short **Domain: Cash drawer & shift ledger** subsection above to keep implementers aligned without duplicating API tables.

### 2026-04-17 — Multi-register shifts & cash audit

- Added `cash_registers` (admin-named) and required `shifts.cash_register_id`; at most one **open** shift per register; staff cannot open a second register’s shift until they close their own open shift elsewhere.
- Shifts record **`closed_by_user_id`**; closing ledger notes include the closer. **`POST /api/v1/shifts/{shift}/cash-adjustment`** (`Permissions::CASH_ADJUST`) appends an `adjustment` ledger row with actor reference for count corrections.
- **`GET /api/v1/shifts/current`** now requires `cash_register_id` (query) plus `Permissions::REGISTER_READ` and `Permissions::CASH_READ`. **`POST /api/v1/shifts/open`** requires `cash_register_id` and `Permissions::REGISTER_READ` in addition to `SHIFT_OPEN`.
- Added **`/api/v1/cash-registers`** (options, CRUD-style resource; manage via `Permissions::REGISTER_MANAGE`). Cash/e-wallet payments require explicit **`shift_id`** when more than one shift is open (`PostPaymentRequest` / `PostPaymentAction`).
- Seeded **`staff@example.com`** with role `staff` and two sample registers (`Front register`, `Second register`). Dev dependencies document **Pest** (`pestphp/pest`, `pestphp/pest-plugin-laravel`).
- Frontend shift session page: register selector, admin “add register” block, opener/closer display, and cash adjustment form when permitted.

### 2026-04-16 — Shifts & cash session slice

- Added `GET /api/v1/shifts/current` to fetch the active open shift as `ShiftResource` (or `{ data: null }` when none exists), with server-side `Permissions::CASH_READ` enforcement.
- Added frontend shift-session contract: new `/shifts/session` route/page, sidebar navigation entry, and hook/api modules for current shift, open/close actions, and cash-ledger pagination.
- Added backend API feature coverage for shift session behavior and access control in `backend/tests/Feature/Api/V1/ShiftsAndSessionTest.php`.

### 2026-04-16 — Repo docs & module workflow

- Added root [`README.md`](README.md): implemented vs pending SPA features, recommended module order, copy-paste implementation prompts, and guidance to minimize React context / global state.
- Added [`docs/MODULE_SPEC_TEMPLATE.md`](docs/MODULE_SPEC_TEMPLATE.md) and [`docs/modules/`](docs/modules/) for per-slice specs; Cursor agent [`module-spec`](.cursor/agents/module-spec.md) documents how to fill specs before coding.

### 2026-04-16 — Initial scaffold

- Laravel API with employees (Sanctum bearer tokens), Spatie roles/permissions, domain modules (categories, products + variants + modifiers, orders, payments, customers, credit ledger, inventory + recipes, shifts + cash ledger, expenses, cash advances).
- React SPA with login, dashboard, server-paginated orders/products tables (TanStack Table).
- Docker Compose base + dev + prod; PHP 8.4 + Node 24; MySQL 8; optional Redis.
- Added [`backend/config/cors.php`](backend/config/cors.php) for API CORS.
