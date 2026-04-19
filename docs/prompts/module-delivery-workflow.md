# Module delivery workflow — master prompt (copy for new sessions)

## How to use this file

1. Open this file in the repo (you are reading it).
2. Scroll to **“Copy everything below this line into a new chat”** and copy the **entire fenced block** (` ```text ` … ` ``` `) into a new Cursor chat.
3. **Name the module** in the last line (see below). **Ordering / POS** (roadmap phase **3**) is **implemented** — [`docs/modules/ordering.md`](../../docs/modules/ordering.md) is **reference** for regressions. The **default next** slice is **Customers & credit** (phase **4**) — create [`docs/modules/customers.md`](../../docs/modules/customers.md) in **Phase 1** from [`MODULE_SPEC_TEMPLATE.md`](../MODULE_SPEC_TEMPLATE.md) if it does not exist. For **catalog**-only work, attach [`docs/modules/catalog.md`](../../docs/modules/catalog.md) and point **Module identity** at `catalog`.
4. In the same message, **@ attach** (or paste paths) at minimum: `BLUEPRINT.md`, `README.md`, `AGENTS.md`, the **active** `docs/modules/<module>.md`, plus **dependency** specs (`catalog.md`, `ordering.md`, `shifts-and-session.md` as relevant).

**Default for the next implementation:** **`customers`** (and **credit** UI) — roadmap phase **4** in [`README.md`](../../README.md). Spec file: **`docs/modules/customers.md`** (author in Phase 1; set **Status:** `ready` when complete). Depends on existing **orders** / **payments** API surface; align with `BLUEPRINT.md`. For **ordering** fixes or **catalog** extensions, change **Module identity** and the spec path accordingly.

---

## What “Ordering” included (README phase 3) — **implemented**

The **POS** slice is **shipped** in the SPA; use [`docs/modules/ordering.md`](../../docs/modules/ordering.md) for **acceptance** and **layout** rules when changing composer/checkout.

| Area | Intent |
|------|--------|
| **Orders** | Create/edit orders; **list** = **DataTableServer** on `/orders` — separate from **`/pos/...`** composer. |
| **Composer UI** | **§4.1** — category tabs, **card grid**, **variants on each card**, **order summary** (desktop) + **Sheet** cart (mobile), **per-line notes**. **Scroll:** **product menu** uses **`.no-scrollbar`**; cart line list may use **`.scrollbar-thin`** (see `BLUEPRINT.md` **2026-04-19**). |
| **Checkout page** | **§4.4** — **`/pos/:orderId/checkout`**; **Pay** **Cash** (tendered + change) / **Maya** / **GCash** (manual); **`Dialog`** confirms totals / due / tendered before **`POST /payments`**; **`ConfirmDialog`** for cancel order (not **`window.confirm`**); post-pay toast **“Payment complete”** → **`/orders/:orderId`**. |
| **Line items** | **Product variants**; qty/notes in cart; API `PATCH`/`DELETE` items as per backend. |
| **Payments / shifts** | **`shift_id`** when required; cash ledger **`sale`** rows per `BLUEPRINT.md` + [`shifts-and-session.md`](../../docs/modules/shifts-and-session.md). |

**Next default module:** **Customers & credit** (README phase **4**) — new spec **`docs/modules/customers.md`**.

### Ordering menu UI (do not skip)

When changing **POS / composer** code, read **`docs/modules/ordering.md` §4** end-to-end. Reviews should reject a **table-first** or **catalog-clone** layout for the **sellable menu** unless the spec is formally revised.

### Catalog (phase 2) — reference only

**Implemented:** staff CRUD for categories, products, variants — [`docs/modules/catalog.md`](../../docs/modules/catalog.md). Use it as **dependency context** for variant IDs and pricing, not as the module under delivery unless you are explicitly extending catalog.

---

## Copy everything below this line into a new chat

```text
You are delivering a complete **module slice** for burst-tea (Laravel `/api/v1` + React SPA). Follow the phases **in order**. Do **not** pause mid-implementation to ask clarifying questions — **all** ambiguity must be resolved in **Phase 0** only. If Phase 0 is incomplete, output **only** the question list and stop; once the user answers, continue without asking again unless a **blocking** contradiction appears (then one consolidated reply listing all blockers).

### Module identity for this run

- **Module name:** customers *(replace with `ordering`, `catalog`, `inventory`, etc. if this run targets a different slice)*
- **Business goal:** Staff can **attach customers to sales** and surface **credit ledger** (and related permissions) in the SPA — see `README.md` roadmap **phase 4**. Depends on **orders** / existing customer + credit **API** routes in `api_v1.php` (confirm in Phase 0). **Out of scope unless spec says otherwise:** full marketing CRM, automated collections.
- **Spec file:** `docs/modules/customers.md` — **create in Phase 1** from `docs/MODULE_SPEC_TEMPLATE.md` if missing; set **Status:** `ready` when implementable.

### Agent roles (use as mental hats; follow each file’s rules)
- **Module spec:** `.cursor/agents/module-spec.md` + `docs/MODULE_SPEC_TEMPLATE.md`
- **Backend:** `.cursor/agents/backend.md`
- **Frontend:** `.cursor/agents/frontend.md` (shadcn/ui — `src/components/ui/*`, `npx shadcn@latest add` as needed)
- **Tester — Backend:** `.cursor/agents/tester-backend.md` (Pest/PHPUnit, `/api/v1`)
- **Tester — Frontend:** `.cursor/agents/tester-frontend.md` (Vitest/RTL or minimal E2E if configured)
- **Code reviewer:** `.cursor/agents/code-reviewer.md`

Canonical rules: `BLUEPRINT.md`. Roadmap: `README.md`.

---

### Phase 0 — Clarification gate (NO CODE)

Before writing or changing implementation code:

1. Restate the **module name** and **business goal** in 2–4 sentences.
2. List **open questions** (API scope, permissions, routes, UI surfaces, out-of-scope items). Use **numbered** questions.
3. Propose **defaults** for each question (sensible choices aligned with existing patterns in `api_v1.php` and `Permissions.php`).
4. **STOP** after Phase 0 **unless** the user has already answered all questions in this chat. If the user has **not** provided answers, wait for answers, then proceed — **do not** implement until Phase 0 is settled.

**Rule:** After Phase 0 is settled, **do not** ask one-off questions between phases. Implement straight through Phases 1–6.

---

### Phase 1 — Spec writer

- Produce or update **`docs/modules/<module>.md`** (e.g. **`customers.md`**) filled from `docs/MODULE_SPEC_TEMPLATE.md`: problem/outcome, permissions, **exact** backend routes (reuse vs new), request/response notes, **frontend routes** in [`AppRoutes.tsx`](../../frontend/src/routes/AppRoutes.tsx), hooks, API files, acceptance criteria, minimal context pack (≤8 paths), follow-ups.
- For **ordering** maintenance, **`docs/modules/ordering.md` §4.1 / §4.4** are the UX contract — document **why** any layout change deviates from them.
- Set **Status:** `ready` when complete enough to implement without guesswork.

---

### Phase 2 — Backend

- Implement only what the **spec** and `BLUEPRINT.md` require: `Controller` → `FormRequest` → `Action`/`Service` → `Model` as per `backend.md`. Prefer **reusing** existing API routes the spec lists; extend only where the spec demands new behavior.
- Enforce permissions server-side; use `DB::transaction()` for multi-step writes.
- Append **`BLUEPRINT.md` changelog** if routes, auth, or API contracts change.

---

### Phase 3 — Frontend

- Implement per spec: `src/api/*`, `src/hooks/*`, pages, routes in `src/routes/AppRoutes.tsx`, nav in `nav-items.ts` if needed.
- **Module UI:** implement screens per the **active spec §4** (and `BLUEPRINT.md` frontend conventions). Example — **ordering:** **Tabs** (or pill row), **Card** grid, **variants on cards**, **order summary** + **Sheet** cart (mobile), **checkout** page §4.4; **do not** use the **catalog admin table** as the POS product grid.
- Follow `.cursor/agents/frontend.md`: **shadcn/ui** primitives from `src/components/ui/*`; run `npx shadcn@latest add <component>` in `frontend/` when the registry has what you need—**no** parallel hand-rolled design system.
- **No** raw Axios in presentational components; Zustand **auth only** (composer cart state stays local unless `BLUEPRINT` is updated).
- Use **DataTableServer** only where the spec calls for a **paginated list** (e.g. existing **Orders** index page), **not** for the POS product menu.

---

### Phase 4 — Tester (Backend)

- Follow `.cursor/agents/tester-backend.md`: Pest (preferred) feature tests under `backend/tests/Feature/Api/V1/` covering acceptance criteria, **401/403/422**, and happy paths.
- Tests must run with `php artisan test` (or `pest`) from `backend/`.

---

### Phase 5 — Tester (Frontend)

- Follow `.cursor/agents/tester-frontend.md`: add **Vitest + RTL** tests for critical hooks/pages **if** the repo has a test script; if **no** frontend runner exists, add **minimal** `vitest` + `@testing-library/react` setup **only** for this module’s hooks/components, or document in `BLUEPRINT.md` that E2E is deferred — **pick one approach** in Phase 0 so this phase does not stall.

---

### Phase 6 — Code reviewer

- Apply `.cursor/agents/code-reviewer.md` checklist to **all** touched backend and frontend files.
- Output a **short** review summary: **pass** or **must-fix** items; if must-fix, apply fixes in the same session.

---

### Deliverables checklist (end of session)

- [ ] `docs/modules/<module>.md` (active spec) matches implementation
- [ ] `BLUEPRINT.md` updated if API/contract changed
- [ ] Backend tests green
- [ ] Frontend tests green or explicitly documented + minimal setup
- [ ] Review checklist addressed
```

---

## Notes for humans

- **Module identity** in the fenced block defaults to **`customers`** (README phase 4). For **catalog** or **ordering** work, replace **Module name**, **business goal**, and **spec file** with `catalog` / `ordering` and attach the matching `docs/modules/*.md`. Duplicate this doc’s pattern for any slice.
- **Visual reference:** the team may use an **Artisanal Admin**–style mock (warm POS, tabs, cards with REGULAR/LARGE style variant strips, right-hand order summary). Behavior and structure are defined in **`docs/modules/ordering.md` §4.1**; pixel-perfect match is **not** required unless you add a design ticket.
- If you want **only** the spec first, run Phase 0 + Phase 1 in one session, then use a shorter “implement Phase 2–6” prompt in a follow-up.
