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
- **Routes:** `/login`, `/dashboard`, `/orders`, `/products` — see [`frontend/src/App.tsx`](frontend/src/App.tsx).
- **Data access:** Hooks + `src/api/*` modules for **auth**, **orders**, **products**, **customers** (customers API present; dedicated staff UI may not exist yet).
- **Lists:** Server-paginated **Orders** and **Products** using shared [`DataTableServer`](frontend/src/components/DataTableServer.tsx) + TanStack Table.

### Not implemented in the SPA yet (typical next work)

Full UI and flows for **shifts/sessions**, **POS composer** (editing carts as staff), **payments** in the UI, **customers/credit**, **inventory/recipes**, **expenses/cash advances**, **user administration**, rich **dashboard KPIs**, etc. Many of these already have **API** endpoints; the gap is mostly **product UI**, rules wiring, and polish.

---

## Module roadmap (recommended order)

Order balances **operational dependencies** (day-open → sales → money → stock → admin):

| Phase | Module | Why this order |
|------|--------|----------------|
| 1 | **Shifts & cash session** | Anchor the business day; cash ledger reads are shift-scoped. |
| 2 | **POS order builder** | Create/edit orders, line items, checkout & payment — core revenue path. |
| 3 | **Customers & credit** | Attach customers to orders; credit ledger reads/writes in UI. |
| 4 | **Inventory & recipes** | Stock levels, movements, align recipes with variants. |
| 5 | **Expenses & cash advances** | Close the loop on cash in drawer vs payouts. |
| 6 | **Catalog admin** | Categories/modifiers/variants/recipes beyond list-only screens. |
| 7 | **Users & permissions** | Staff CRUD aligned with Spatie roles (API exists). |
| 8 | **Dashboard & reports** | KPIs, exports — after events exist in earlier modules. |

Adjust if your go-live priority is different (e.g. catalog before POS). Each slice should get its own **filled module spec** (template below) before implementation.

---

## Module implementation prompts (copy-paste)

Use the same structure every time so context stays small and reviews are predictable. Replace placeholders in ALL CAPS.

### A — New module spec only (planning)

```text
Read BLUEPRINT.md and docs/MODULE_SPEC_TEMPLATE.md. Create docs/modules/SPEC_FILE_NAME.md for the MODULE_NAME module: fill sections 1–6 with concrete permissions (Permissions::*), API routes, UI routes, hooks, and acceptance criteria. List no more than 8 existing file paths in §6. Do not write implementation code yet.
```

Follow the **Module spec agent**: [`.cursor/agents/module-spec.md`](.cursor/agents/module-spec.md).

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
