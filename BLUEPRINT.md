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

- **UI — shadcn/ui:** Primitives live under [`frontend/src/components/ui/`](frontend/src/components/ui/). New screens should **compose** those components (and add more via `npx shadcn@latest add <name>` from `frontend/`). Do not duplicate design-system widgets outside `components/ui` when the registry offers an equivalent. Agent details: [`.cursor/agents/frontend.md`](.cursor/agents/frontend.md).
- **No API calls in presentational components** — use hooks under [`frontend/src/hooks/`](frontend/src/hooks/) which call [`frontend/src/api/`](frontend/src/api/).
- **Auth state** — Zustand store [`frontend/src/stores/authStore.ts`](frontend/src/stores/authStore.ts) only.
- **Routing (SPA):** [`frontend/src/routes/AppRoutes.tsx`](frontend/src/routes/AppRoutes.tsx) defines the full tree (including `const X = lazy(() => import('@/pages/…'))` per route); each page module **default-exports** its screen component. [`frontend/src/App.tsx`](frontend/src/App.tsx) only renders `<AppRoutes />`. **Public** routes use [`GuestOnly`](frontend/src/components/auth/GuestOnly.tsx) (e.g. `/login` — redirects to `/dashboard` if a token exists). **Private** staff routes nest under [`RequireAuth`](frontend/src/components/auth/RequireAuth.tsx) + [`AdminLayout`](frontend/src/components/layout/AdminLayout.tsx). The route tree is wrapped in `Suspense` with [`RouteLoadingFallback`](frontend/src/components/layout/RouteLoadingFallback.tsx). **Hooks** that fetch data should accept an `enabled` flag (see `useProducts`, `useCategory`) so pages do not call the API when the user lacks permission or the route param is invalid.
- **Paths:** `/login`, `/dashboard`, `/orders`, `/orders/:orderId` (detail), **`/pos/new`**, **`/pos/:orderId/compose`**, **`/pos/:orderId/checkout`** (POS composer + checkout — separate from `/orders` so the sidebar does not double-highlight), `/categories`, `/categories/:categoryId`, `/products`, `/products/:productId`, `/shifts/session`, `/cash-registers`, `/cash-registers/:cashRegisterId/ledger-history`.
- **Dashboard:** [`DashboardPage`](frontend/src/pages/DashboardPage.tsx) is the staff **home** after login — shortcut cards to **Orders**, **New order** (`/pos/new`), **Categories**, **Products**, **Shift session**, and **Cash registers** (same destinations as the sidebar in [`nav-items.ts`](frontend/src/components/layout/nav-items.ts)); not a KPI/reporting surface yet.
- **Env:** `VITE_API_URL` (see [`frontend/.env.example`](frontend/.env.example)).

### Implementation sequencing (repo-wide)

Canonical **order** for **next** SPA work is documented in [`README.md`](README.md) (**Module roadmap**). In short:

- **Catalog** — staff CRUD for **categories**, **products**, and **variants** is **implemented** in the SPA; spec [`docs/modules/catalog.md`](docs/modules/catalog.md).
- **Ordering / POS** — **implemented** per [`docs/modules/ordering.md`](docs/modules/ordering.md): **`/pos/new`**, **`/pos/:orderId/compose`**, **`/pos/:orderId/checkout`**; **category tabs**, **product cards** with **inline variants**, **per-line notes**, **order summary** (collapsible on desktop + **Sheet** on mobile), **checkout** for **Cash / Maya / GCash** (record-only). **Cash register:** **cash/e-wallet** payments post **`sale`** ledger rows when policy requires; **order detail** links to **register ledger history** when a payment has **`shift_id`**. **UX polish:** POS shell uses bounded-height flex + **native `overflow-y-auto`** and **`.scrollbar-thin`** for menu/cart scroll regions where Radix **`ScrollArea`** would collapse in nested flex; see changelog **2026-04-18** (POS scrolling).
- **Recommended next slice:** **Customers & credit** (README roadmap phase **4**); create [`docs/modules/customers.md`](docs/modules/customers.md) from the module template when starting. **Inventory** (phase **5**) remains an **operational record** (not required for sales unless you add **stock enforcement** at checkout); can ship **in parallel** for back-office.

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

### 2026-04-18 — SPA: POS scroll regions, orders list timestamps, checkout toast, product dialog UX

- **Frontend — POS height & scroll:** [`AdminLayout`](frontend/src/components/layout/AdminLayout.tsx) in **POS** routes uses **`h-dvh`**, **`overflow-hidden`**, and full-height wrappers so the composer/checkout tree gets a **bounded height**. [`OrderComposerPage`](frontend/src/pages/OrderComposerPage.tsx) **product column** and [`OrderCartPanel`](frontend/src/components/ordering/OrderCartPanel.tsx) **POS** cart **line list** use **`min-h-0` / `flex-1` / `basis-0`** with **`overflow-y-auto`** and **`.scrollbar-thin`** ([`frontend/src/index.css`](frontend/src/index.css)) so only the **menu** and **line list** scroll; **totals + Checkout** stay visible. Radix **`ScrollArea`** is avoided in these nested-flex hotspots (zero-height viewport issue); **[`scroll-area.tsx`](frontend/src/components/ui/scroll-area.tsx)** keeps **`min-h-0`** on root/viewport for safer use elsewhere (e.g. standard cart **Sheet**).
- **Frontend — Orders index:** [`OrdersPage`](frontend/src/pages/OrdersPage.tsx) **Created** column formats API **UTC** instants as **local** `YYYY-MM-DD HH:mm:ss` via [`formatLocalDateTime`](frontend/src/lib/datetime.ts); row **actions** use **icon** buttons for scanability.
- **Frontend — Checkout:** After successful **`POST /payments`**, Sonner toast **"Payment complete"** (was **"Payment recorded"**); navigation to **`/orders/:orderId`** unchanged ([`OrderCheckoutPage`](frontend/src/pages/OrderCheckoutPage.tsx)).
- **Frontend — New product dialog:** [`ProductCreateDialog`](frontend/src/components/catalog/ProductCreateDialog.tsx) body is **scrollable** (`max-h-[calc(90vh-11rem)]` + overflow) for long variant lists; **remove variant** is an **X** control on the variant card when **`variants.length > 1`**.
- **Docs / roadmap:** [`README.md`](README.md) snapshot and [`docs/prompts/module-delivery-workflow.md`](docs/prompts/module-delivery-workflow.md) default **next** module → **Customers & credit** (ordering spec retained as reference).

### 2026-04-18 — POS cart layout, cancel order API, cash ledger payment labels

- **Backend:** `POST /api/v1/orders/{order}/cancel` — open orders with **no recorded payments** → `cancelled` (`order.delete`). **`CashDrawerService::recordSale`** ledger **notes** append `· Cash` / `· PayMaya` / `· GCash` (or `· E-wallet`) after the order reference.
- **Frontend:** Composer **row** uses **`overflow-hidden`** so only the **menu** scrolls; **cart** column is height-bounded. **Checkout:** **Back** (browser history), **Cancel order** (same permission as API). Loading a **cancelled** order on the composer sends the user to **`/pos/new`**.

### 2026-04-18 — SPA: POS routes under `/pos` (sidebar active state)

- **Why:** `SidebarNav` uses `matchPath({ path: '/orders', end: false })` for the **Orders** item, so URLs like **`/orders/new`** also matched **Orders** and **New order** at once. **Composer + checkout** moved to **`/pos/new`**, **`/pos/:orderId/compose`**, **`/pos/:orderId/checkout`**; **order detail** stays **`/orders/:orderId`**. Nav, dashboard, and docs updated.

### 2026-04-18 — Ordering (POS) slice: API, SPA, cash ledger links

- **Backend:** `order_items.notes` (nullable); `payments.e_wallet_provider` (`maya` \| `gcash`, nullable) and `payments.shift_id` (nullable FK) for audit and UI links. **`PATCH` / `DELETE`** ` /api/v1/orders/{order}/items/{order_item}` for cart edits. **`POST /payments`** accepts optional `reference`; **`e_wallet_provider` required** when `method` is `e_wallet`. **`ProductVariantResource`** may include nested **`product`** when loaded. **`GET /orders/{order}`** includes **`payments.shift.cashRegister`**. **`PostPaymentAction`** persists reference, e-wallet provider, shift id, and still records **cash / e-wallet** sales via **`CashDrawerService`** when the order becomes fully paid.
- **Frontend:** Routes **`/pos/new`**, **`/pos/:orderId/compose`**, **`/pos/:orderId/checkout`** (composer + checkout; **`/pos` prefix** avoids sidebar `matchPath('/orders')` matching the POS flow), **`/orders/:orderId`** (detail with **ledger** link when payment has a shift). **`OrderComposerPage`**: category pills, product **cards** + variants, **collapsible** desktop cart + **Sheet** on small screens. **`OrderCheckoutPage`**: read-only summary, **Cash / Maya / GCash**, register selector for **`shift_id`**. Nav + dashboard **New order** entry. API helpers in [`frontend/src/api/orders.ts`](frontend/src/api/orders.ts), [`frontend/src/api/payments.ts`](frontend/src/api/payments.ts).
- **Tests:** Pest [`backend/tests/Feature/Api/V1/OrderingTest.php`](backend/tests/Feature/Api/V1/OrderingTest.php); Vitest [`frontend/src/hooks/useMediaQuery.test.ts`](frontend/src/hooks/useMediaQuery.test.ts).

### 2026-04-17 — Ordering spec: line notes, checkout page, manual e-wallet

- **[`docs/modules/ordering.md`](docs/modules/ordering.md):** **Per-line notes** on cart lines (`order_items.notes` migration — **§3**); **§4.4** — dedicated **`/orders/:orderId/checkout`** (or equivalent) for **final summary** then **Pay**; payment UI **Cash** | **Maya** | **GCash** — **no** Maya/GCash API integration (**record-only** `POST /payments` with `cash` / `e_wallet`). **Workflow** doc updated.

### 2026-04-17 — Ordering module spec: POS layout (tabs, cards, cart)

- **Docs:** Added [`docs/modules/ordering.md`](docs/modules/ordering.md) (**status:** draft) — POS **menu** layout: category **tabs**, **product cards** with **variant strip** at card bottom, **order summary** on the right (desktop), **14″ / mobile** responsive rules; explicit **non-goals** (no DataTable-first menu, no cloning catalog admin UX). [`docs/prompts/module-delivery-workflow.md`](docs/prompts/module-delivery-workflow.md) updated so Phases 1 and 3 **enforce** §4; **Implementation sequencing** in this file points to the spec.

### 2026-04-17 — Dashboard shortcuts for core staff flows

- **SPA:** [`DashboardPage`](frontend/src/pages/DashboardPage.tsx) links to **orders**, **categories**, **products**, **shift session** (`/shifts/session`), and **cash registers** (`/cash-registers`), with icons aligned to [`staffNavItems`](frontend/src/components/layout/nav-items.ts). Grid layout: two columns on small viewports, three on `xl` breakpoints.

### 2026-04-17 — Docs: next module delivery defaults to Ordering (POS)

- **[`docs/prompts/module-delivery-workflow.md`](docs/prompts/module-delivery-workflow.md)** — master prompt **Module identity** now targets **`ordering`** (README roadmap phase 3); **Catalog** is reference-only. Create **`docs/modules/ordering.md`** in Phase 1 of that slice. **[`README.md`](README.md)** — full-pipeline copy-paste instructions and route snapshot updated (`AppRoutes`, `/categories/:categoryId`).

### 2026-04-17 — SPA: inline lazy imports in AppRoutes

- **Frontend:** Removed the separate `lazyPages.tsx` barrel; [`AppRoutes.tsx`](frontend/src/routes/AppRoutes.tsx) uses `lazy(() => import('@/pages/…'))` per page. Route pages **default-export** their component (named `export function` kept for clarity; `export default` at file end).

### 2026-04-17 — SPA routing: lazy routes, public vs private, thin App

- **Structure:** Routes and `lazy(() => import('@/pages/…'))` live in [`frontend/src/routes/AppRoutes.tsx`](frontend/src/routes/AppRoutes.tsx); [`GuestOnly`](frontend/src/components/auth/GuestOnly.tsx) vs [`RequireAuth`](frontend/src/components/auth/RequireAuth.tsx); [`RouteLoadingFallback`](frontend/src/components/layout/RouteLoadingFallback.tsx) for `Suspense`.
- **Hooks:** [`useCategory`](frontend/src/hooks/useCategory.ts) supports `enabled` (aligned with `useProducts`) so detail pages skip API calls when permissions or IDs disallow access.
- **Conventions:** Frontend section above documents this pattern for future modules.

### 2026-04-17 — Category detail page & locked “New product”

- **Route:** `GET /categories/:categoryId` — [`CategoryDetailPage`](frontend/src/pages/CategoryDetailPage.tsx) lists products filtered by category; **New product** opens the same [`ProductCreateDialog`](frontend/src/components/catalog/ProductCreateDialog.tsx) with `lockedCategory` so the category cannot be changed. Categories list links category names to this page.
- **API:** `GET /api/v1/products?category_id=` optional filter ([`ProductController@index`](backend/app/Http/Controllers/Api/V1/ProductController.php)); Pest coverage in [`CatalogTest`](backend/tests/Feature/Api/V1/CatalogTest.php).

### 2026-04-17 — Tambayan / Burstea demo catalog seeder

- [`Database\Seeders\Catalog\TambayanMenuSeeder`](backend/database/seeders/Catalog/TambayanMenuSeeder.php) seeds categories, products, and variants from the cafe menus (drinks: Regular/Large pricing; meals: Standard or flavor variants for **Flavored Chicken**). Invoked from [`DatabaseSeeder`](backend/database/seeders/DatabaseSeeder.php) after demo users. Idempotent per category slug + product name (`updateOrCreate`, variants hard-reset with `forceDelete`).

### 2026-04-17 — Sonner toasts (shadcn-style)

- Frontend: [`sonner`](https://ui.shadcn.com/docs/components/sonner) wired via [`frontend/src/components/ui/sonner.tsx`](frontend/src/components/ui/sonner.tsx) and `<Toaster />` in [`main.tsx`](frontend/src/main.tsx). Use `import { toast } from 'sonner'` for success/error notifications. Catalog spec updated with **customer menu board** mapping (categories / products / variants → printed or TV layouts).

### 2026-04-17 — Catalog UX: searchable category select, PHP display, dialogs

- **Variants:** Documented that products **without** multiple options still use **one variant** (e.g. “Standard”); API requires `variants.min:1`. **SKU** vs **variant name** clarified in [`docs/modules/catalog.md`](docs/modules/catalog.md).
- **SPA:** Reusable [`SearchableSelect`](frontend/src/components/ui/searchable-select.tsx) (Popover + `cmdk`) for category pickers; [`ScrollArea`](frontend/src/components/ui/scroll-area.tsx) + fixed header/footer on product dialogs. **Default display currency** is **PHP** via [`frontend/src/lib/currency.ts`](frontend/src/lib/currency.ts) (settings hook planned). Product detail **back** link aligned with other pages (top row). `formatMoneyCents` re-exported from `money.ts` via `currency.ts`.

### 2026-04-17 — Database seeders split by concern

- [`DatabaseSeeder`](backend/database/seeders/DatabaseSeeder.php) only orchestrates: `PermissionSeeder` → `Auth\StaffRoleSeeder` → `Shifts\CashRegisterSeeder` → `Auth\DemoUserSeeder`, then clears the Spatie permission cache.
- **Shifts:** [`Shifts\CashRegisterSeeder`](backend/database/seeders/Shifts/CashRegisterSeeder.php) — sample registers.
- **Auth:** [`Auth\StaffRoleSeeder`](backend/database/seeders/Auth/StaffRoleSeeder.php) — `staff` role permissions; [`Auth\DemoUserSeeder`](backend/database/seeders/Auth/DemoUserSeeder.php) — `admin@` / `manager@` / `staff@` demo users.

### 2026-04-17 — Backend tests: phpunit env, `.env.testing`, and config cache

- **Why `php artisan test` wiped MySQL:** If `php artisan config:cache` was run, `bootstrap/cache/config.php` exists. Laravel’s `LoadEnvironmentVariables` **skips** loading `.env` / `.env.testing` when config is cached, so PHPUnit’s `DB_CONNECTION=sqlite` in [`phpunit.xml`](backend/phpunit.xml) does **not** override the cached **MySQL** `database` config. `RefreshDatabase` then runs `migrate:fresh` on **MySQL**.
- **Fix:** [`tests/TestCase.php`](backend/tests/TestCase.php) removes `bootstrap/cache/config.php` before boot, then **after** the app boots sets `database.default` to **sqlite** with **`:memory:`** and purges the DB manager so `RefreshDatabase` never targets MySQL (does not depend on argv or a successful unlink). [`backend/.env.testing`](backend/.env.testing) still documents test DB. **`composer test`** runs `config:clear` then `php artisan test` as an extra safeguard.

### 2026-04-17 — Catalog SPA + soft deletes (domain)

- **Schema:** `deleted_at` added to **users**, **categories**, **products**, **product_variants**, **modifiers**, **customers**, **inventory_items**, **cash_registers**, **expenses**, **cash_advances** (`2026_04_17_100000_add_soft_deletes_to_domain_tables`). **DELETE** on these resources performs **soft delete** where the model uses `SoftDeletes`.
- **Product:** deleting a product **soft-deletes** nested variants; `Product::category()` uses `withTrashed()` so historical category names still resolve when a category is soft-deleted. **ProductResource** includes `category` when loaded. **FormRequest** `exists` / unique rules for soft-deleted tables use `whereNull('deleted_at')` (and cash register shift rules require non-deleted registers).
- **API:** unchanged route map; contract additions are **nested `category`** on product JSON and soft-delete semantics.
- **SPA:** [`/categories`](frontend/src/pages/CategoriesPage.tsx) (CRUD), [`/products`](frontend/src/pages/ProductsPage.tsx) (list + **New product** dialog with embedded variants), [`/products/:productId`](frontend/src/pages/ProductDetailPage.tsx) (edit + variant management). Sidebar: **Categories** + **Products**.
- **Tests:** Pest feature tests [`backend/tests/Feature/Api/V1/CatalogTest.php`](backend/tests/Feature/Api/V1/CatalogTest.php); Feature tests seed all `Permissions::all()` in [`backend/tests/Pest.php`](backend/tests/Pest.php). Shifts tests aligned with **one open shift per user across registers** and **201** on cash register create.
- **Frontend:** Vitest + RTL ([`frontend/vitest.config.ts`](frontend/vitest.config.ts), `npm test`), [`frontend/src/lib/money.test.ts`](frontend/src/lib/money.test.ts). **Composer:** `pestphp/pest` and `pestphp/pest-plugin-laravel` added to lockfile for `composer install` + `./vendor/bin/pest`.

### 2026-04-17 — Frontend agent: mandatory shadcn/ui usage

- Expanded [`.cursor/agents/frontend.md`](.cursor/agents/frontend.md): **shadcn/ui** as the standard for primitives (`src/components/ui/*`), **`npx shadcn@latest add`** workflow, baseline component list, note on custom `select.tsx`. [Code reviewer](.cursor/agents/code-reviewer.md) frontend checklist updated. **Frontend conventions** (this file) reference shadcn.

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

### 2026-04-18 — Theme

- Theme: migrated admin SPA to warm cafe palette (espresso/cream); fonts Inter + Playfair Display.

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
