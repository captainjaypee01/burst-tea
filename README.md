# Burst Tea — POS (staff admin)

Monorepo: **Laravel 13 API** (`/api/v1`) + **React 19 (Vite) staff SPA**. Ledger-backed inventory, customer credit, cash drawer, and cafe ordering flows are modeled in the backend; the SPA progressively exposes them per module.

**Canonical technical detail & changelog:** [`BLUEPRINT.md`](BLUEPRINT.md)  
**Agent roles (backend / frontend / tests / review / module spec):** [`AGENTS.md`](AGENTS.md)

---

## Quick start (Docker)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- API: `http://localhost:8080` — JSON under `/api/v1`
- SPA: `http://localhost:5173`
- After migrations + seed: see **Seeded logins** in [`BLUEPRINT.md`](BLUEPRINT.md) (e.g. `manager@example.com` / `password`)

Production build smoke: see Docker section in `BLUEPRINT.md`.

---

## What is implemented (snapshot)

Use this as the baseline before adding new modules.

### Backend

- **Auth:** Sanctum bearer login/logout/me; `auth:sanctum` + `staff.active` middleware on staff routes.
- **Authorization:** Spatie roles/permissions; constants in [`backend/app/Support/Permissions.php`](backend/app/Support/Permissions.php).
- **HTTP surface:** REST-style resources under [`backend/routes/api_v1.php`](backend/routes/api_v1.php), including:
  - Categories, products, product variants, recipes, modifiers  
  - Users (staff) CRUD + options  
  - Customers + options  
  - Orders (index/store/show), order line items, payments  
  - Credit ledger (read)  
  - Inventory items + inventory ledger (read)  
  - Shifts (open/close), cash ledger per shift  
  - Expenses, cash advances  
- **Data:** Migrations for the domain tables listed in `backend/database/migrations/` (users, catalog, orders, credit, inventory, shifts/cash, expenses, etc.).

### Frontend

- **Auth:** Login page; session/token via Zustand [`frontend/src/stores/authStore.ts`](frontend/src/stores/authStore.ts); API wrapper [`frontend/src/lib/api-client.ts`](frontend/src/lib/api-client.ts).
- **Shell:** [`AdminLayout`](frontend/src/components/layout/AdminLayout.tsx) with **shadcn-style Sidebar** (collapsible, mobile sheet).
- **Routes:** `/login`, `/dashboard`, `/orders`, `/orders/:orderId`, `/pos/new`, `/pos/:orderId/compose`, `/pos/:orderId/checkout`, `/categories`, `/categories/:categoryId`, `/products`, `/products/:productId`, `/shifts/session`, `/cash-registers`, `/cash-registers/:cashRegisterId/ledger-history` — defined in [`frontend/src/routes/AppRoutes.tsx`](frontend/src/routes/AppRoutes.tsx); [`App.tsx`](frontend/src/App.tsx) renders `<AppRoutes />` only.
- **Data access:** Hooks + `src/api/*` modules for **auth**, **orders**, **products**, **categories**, **customers** (customers API present; dedicated staff UI may not exist yet).
- **Lists:** Server-paginated **Orders** and **Products** using shared [`DataTableServer`](frontend/src/components/DataTableServer.tsx) + TanStack Table. **Orders** table **Created** column shows **local** wall time from UTC API (`formatLocalDateTime` in [`frontend/src/lib/datetime.ts`](frontend/src/lib/datetime.ts)).
- **Catalog:** **Categories**, **Products** list, **product detail** (`/products/:productId`) — create product with embedded variants, edit variants, soft-delete; spec [`docs/modules/catalog.md`](docs/modules/catalog.md).
- **POS / ordering:** **`/pos/new`**, **`/pos/:orderId/compose`**, **`/pos/:orderId/checkout`** — category tabs, product **cards** with inline **variants**, cart with **per-line notes**, **checkout** (**Cash** tendered + **change**, **Maya** / **GCash** record-only, **`shift_id`** when required); **`Dialog`** confirms payment before **`POST /payments`**; **`ConfirmDialog`** for cancel / destructive flows instead of **`window.confirm`**. Product menu scroll uses **`.no-scrollbar`**. Spec [`docs/modules/ordering.md`](docs/modules/ordering.md).
- **Shifts & cash:** Shift session, cash registers, register **ledger history** page (see [`docs/modules/shifts-and-session.md`](docs/modules/shifts-and-session.md)).

### Not implemented in the SPA yet (typical next work)

- **Inventory:** **stock records** (items, ledger, adjustments) — **operational tracking** (e.g. “do we still have patties?”); **not** a hard prerequisite to **ordering** unless you later add **stock enforcement** at checkout.
- **Customers & credit**, **user administration**, rich **dashboard KPIs**, **recipes** UI bridging variants to ingredients, etc. Many areas already have **API** endpoints; gaps are mostly **staff UI** wiring.

---

## Module roadmap (recommended order)

This order matches **burst-tea** today: **catalog** and **POS / ordering** are **shipped** in the SPA; **inventory** is its own **operational track** (not blocking sales unless you choose to enforce stock later).

| Phase | Module | Why this order |
|------|--------|----------------|
| 1 | **Shifts & cash session** | Business day anchor; cash ledger shift-scoped. **Implemented** in SPA (see spec). |
| 2 | **Catalog** — categories, products, variants (+ modifiers/recipes as needed) | **Sellable menu** and prices; **SPA CRUD** shipped — [`docs/modules/catalog.md`](docs/modules/catalog.md). |
| 3 | **POS / order builder** | **Implemented** in SPA — [`docs/modules/ordering.md`](docs/modules/ordering.md) (`/pos/...` composer + checkout, `/orders` list + detail). |
| 4 | **Customers & credit** | **Next** recommended slice — attach customers; credit ledger in UI (add **`docs/modules/customers.md`** from [`MODULE_SPEC_TEMPLATE.md`](docs/MODULE_SPEC_TEMPLATE.md) before building). |
| 5 | **Inventory** — items, ledger, movements | **Stock records** for ingredients/supplies; optional **recipe** links from variants. **Independent** of “can we take an order” — ordering does not require inventory to exist first. |
| 6 | **Expenses & cash advances** (extended admin) | Broader than shift session shortcuts if needed. |
| 7 | **Users & permissions** | Staff CRUD (API exists). |
| 8 | **Dashboard & reports** | KPIs after events exist. |

**Inventory vs ordering:** Treat inventory as **what you have on hand** (record-keeping, alerts, future optional **deduction** when a sale completes). **Ordering** needs **catalog**, not inventory, unless you explicitly build **block sale when out of stock**.

Each slice should get a **filled module spec** under [`docs/modules/`](docs/modules/) (template: [`docs/MODULE_SPEC_TEMPLATE.md`](docs/MODULE_SPEC_TEMPLATE.md)) before implementation.

---

## Module implementation prompts (copy-paste)

Use the same structure every time so context stays small and reviews are predictable. Replace placeholders in ALL CAPS.

### A — New module spec only (planning)

```text
Read BLUEPRINT.md and docs/MODULE_SPEC_TEMPLATE.md. Create docs/modules/SPEC_FILE_NAME.md for the MODULE_NAME module: fill sections 1–6 with concrete permissions (Permissions::*), API routes, UI routes, hooks, and acceptance criteria. List no more than 8 existing file paths in §6. Do not write implementation code yet.
```

Follow the **Module spec agent**: [`.cursor/agents/module-spec.md`](.cursor/agents/module-spec.md).

**Full pipeline (spec → backend → frontend → backend tests → frontend tests → code review) in one go:** open [`docs/prompts/module-delivery-workflow.md`](docs/prompts/module-delivery-workflow.md), copy the fenced prompt into a **new chat**, and **@ attach** `BLUEPRINT.md`, this file, [`AGENTS.md`](AGENTS.md), plus the **active** module spec. The workflow defaults to the **next** roadmap slice — **Customers & credit** (phase **4**); create **`docs/modules/customers.md`** in Phase 1 if it does not exist. Use [`docs/modules/ordering.md`](docs/modules/ordering.md) and [`docs/modules/catalog.md`](docs/modules/catalog.md) as **dependency context** for POS/catalog work. For catalog-only changes, point the **Module identity** block at `docs/modules/catalog.md` per “Notes for humans” in the workflow doc.

### B — Backend for an approved spec

```text
Implement the backend for MODULE_NAME per docs/modules/SPEC_FILE_NAME.md and BLUEPRINT.md. Touch only routes, actions, services, policies, and migrations required by the spec. Append a short dated entry to BLUEPRINT.md changelog if the API or env changed.
```

### C — Frontend for an approved spec

```text
Implement the frontend for MODULE_NAME per docs/modules/SPEC_FILE_NAME.md and BLUEPRINT.md. Add routes, hooks under src/hooks, API helpers under src/api, and pages/components. No axios in presentational components. Reuse DataTableServer where lists are server-paginated.
```

### D — Tests (when you add automated coverage)

```text
Add API feature tests for MODULE_NAME covering the acceptance criteria in docs/modules/SPEC_FILE_NAME.md. Use the Tester agent conventions; keep tests CI-friendly.
```

### E — Review before merge

```text
Review the MODULE_NAME changes against docs/modules/SPEC_FILE_NAME.md and BLUEPRINT.md: permissions enforced server-side, thin controllers, transactions for multi-step writes, frontend data only via hooks/api modules.
```

---

## Keeping context small (humans & AI)

### Application code

- **Global state:** Zustand is for **auth only** — do not add new global stores for every feature.
- **React Context:** Use only where a library expects it (e.g. Radix/shadcn Sidebar) or for truly local trees. Prefer **hooks + props**, **route-level data fetching**, and **composition** over new app-wide `ContextProvider`s.
- **Server-ish data:** One hook per concern (`useOrders`, `useShift`, …) calling `src/api/*`; pages stay thin.

### Cursor / LLM usage

- Attach **`BLUEPRINT.md` + the single `docs/modules/<module>.md` spec** for the task — avoid pasting the whole repo.
- Use **AGENTS.md** to pick **backend** vs **frontend** vs **module-spec** roles instead of one giant instruction block.

**Module spec template (copy per feature):** [`docs/MODULE_SPEC_TEMPLATE.md`](docs/MODULE_SPEC_TEMPLATE.md)

**Generated specs (you create these):** `docs/modules/<name>.md` — one file per module slice.

---

## Repository map

| Path | Role |
|------|------|
| [`backend/`](backend/) | Laravel API |
| [`frontend/`](frontend/) | Vite + React SPA |
| [`docker-compose.yml`](docker-compose.yml) | Base services |
| [`docker-compose.dev.yml`](docker-compose.dev.yml) | Dev overrides |
| [`docker-compose.prod.yml`](docker-compose.prod.yml) | Production |

---

## License

If you add a license file for publication, describe it here; otherwise omit or mark as private.
