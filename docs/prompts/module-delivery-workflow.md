# Module delivery workflow — master prompt (copy for new sessions)

## How to use this file

1. Open this file in the repo (you are reading it).
2. Scroll to **“Copy everything below this line into a new chat”** and copy the **entire fenced block** (` ```text ` … ` ``` `) into a new Cursor chat.
3. **Name the module** in the last line (see below). For the **next** roadmap slice after catalog, that is **`ordering`** (POS / order builder) — [`README.md`](../../README.md) **Module roadmap** phase **3**. The **catalog** slice is **implemented**; use [`docs/modules/catalog.md`](../../docs/modules/catalog.md) as dependency context, not the active spec unless you are extending catalog.
4. In the same message, **@ attach** (or paste paths) at minimum: `BLUEPRINT.md`, `README.md`, `docs/modules/ordering.md` (create in Phase 1 if missing), `docs/modules/catalog.md`, and `AGENTS.md`.

**Default for the next implementation:** **`ordering`** — staff **POS / order builder** with the **dedicated menu layout** in [`docs/modules/ordering.md`](../../docs/modules/ordering.md) **§4.1** (category **tabs**, **product cards** with **inline variants**, **order summary** / cart, **responsive** desktop vs mobile). **Not** the catalog admin table pattern. Spec file: **`docs/modules/ordering.md`** (set status `ready` in Phase 1 when complete). For a **different** module later, change the **Module identity** block and attach `docs/modules/<that-module>.md`.

---

## What “Ordering” includes (README phase 3)

Aligned with **README → Module roadmap → POS / order builder** (after **Catalog** and **Shifts**):

| Area | Intent |
|------|--------|
| **Orders** | Create/edit orders; **list** view may stay **DataTableServer** on `/orders` — separate from the **composer**. |
| **Composer UI** | **Mandatory:** [`docs/modules/ordering.md`](../../docs/modules/ordering.md) **§4.1** — tabs by category, **card grid**, **variants on each card** (bottom strip), **order summary** on the **right** (desktop), **per-line notes** in cart; **mobile:** cart as **sheet/drawer** or sticky launch + panel (spec §4.1 table). |
| **Checkout page** | **Mandatory:** spec **§4.4** — after **Checkout**, a **separate route** for **final summary** + **Pay**; methods **Cash** / **Maya** / **GCash** — **manual** e-wallet (no PSP integration). |
| **Line items** | Rows reference **product variants**; prices from API; add via card variant controls, edit qty in summary. |
| **Payments / checkout** | Resolve payments; tie **cash** / e-wallet flows to **open shift** and **cash ledger** per `BLUEPRINT.md` and [`docs/modules/shifts-and-session.md`](../../docs/modules/shifts-and-session.md). |
| **Out of scope for Ordering v1 (typical)** | Full inventory deduction, customer loyalty, reporting dashboards — unless the spec explicitly includes them. |

Backend order/payment routes under `/api/v1` are the starting point — the workflow fills the **SPA**, **tests**, and **`docs/modules/ordering.md`** (now tracked in repo — extend in Phase 1 if gaps appear).

### Ordering menu UI (do not skip)

Before coding the **composer**, read **`docs/modules/ordering.md` §4** end-to-end. Implementation reviews should reject a **table-first** or **catalog-clone** layout for the sellable menu unless the spec is formally revised.

### Catalog (phase 2) — reference only

**Implemented:** staff CRUD for categories, products, variants — [`docs/modules/catalog.md`](../../docs/modules/catalog.md). Use it as **dependency context** for variant IDs and pricing, not as the module under delivery unless you are explicitly extending catalog.

---

## Copy everything below this line into a new chat

```text
You are delivering a complete **module slice** for burst-tea (Laravel `/api/v1` + React SPA). Follow the phases **in order**. Do **not** pause mid-implementation to ask clarifying questions — **all** ambiguity must be resolved in **Phase 0** only. If Phase 0 is incomplete, output **only** the question list and stop; once the user answers, continue without asking again unless a **blocking** contradiction appears (then one consolidated reply listing all blockers).

### Module identity for this run

- **Module name:** ordering
- **Business goal:** Staff can **build and complete orders** — line items on **catalog variants**, **per-line notes**, **checkout review page**, and **payments** integrated with **shifts** and cash semantics. See `README.md` roadmap phase 3. Depends on **catalog** (variants/prices) and **shifts** (open shift, ledger). **UI:** **`docs/modules/ordering.md` §4.1** (tabs, cards, variants, cart + notes) and **§4.4** (separate page: summary + **Pay**: **Cash** / **Maya** / **GCash** — manual e-wallet, **no** PSP) — **not** the admin catalog table layout.
- **Spec file:** `docs/modules/ordering.md` (update in Phase 1 if needed; set status `ready` when implementable).

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

- Produce or update **`docs/modules/ordering.md`** (or `docs/modules/<module>.md` for a different run) filled from `docs/MODULE_SPEC_TEMPLATE.md`: problem/outcome, permissions, **exact** backend routes (reuse vs new), request/response notes, **frontend routes** in [`AppRoutes.tsx`](../../frontend/src/routes/AppRoutes.tsx), hooks, API files, acceptance criteria, minimal context pack (≤8 paths), follow-ups.
- For **ordering**, **§4.1 layout** (tabs, cards, variants on cards, cart column, responsive rules) must be **preserved or improved** — if you change it, document **why** in the spec.
- Set **Status:** `ready` when complete enough to implement without guesswork.

---

### Phase 2 — Backend

- Implement only what the **spec** and `BLUEPRINT.md` require: `Controller` → `FormRequest` → `Action`/`Service` → `Model` as per `backend.md`. Prefer **reusing** existing order, line-item, and payment endpoints if the spec says so; extend only where the spec demands new behavior.
- Enforce permissions server-side; use `DB::transaction()` for multi-step writes.
- Append **`BLUEPRINT.md` changelog** if routes, auth, or API contracts change.

---

### Phase 3 — Frontend

- Implement per spec: `src/api/*`, `src/hooks/*`, pages, routes in `src/routes/AppRoutes.tsx`, nav in `nav-items.ts` if needed.
- **Ordering composer:** build the **menu + cart** per **`docs/modules/ordering.md` §4** — **Tabs** (or scrollable pill row), **Card** grid, **variant controls on each card**, **order summary** sidebar (desktop) and **Sheet/Drawer or sticky cart** pattern (mobile); **line notes** per §4.1. **Checkout** navigates to a **separate page** (§4.4) for **review + Pay** (Cash / Maya / GCash — **no** payment gateway).
- **Do not** reuse the **Categories / Products admin** table pattern for the sellable grid.
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

- [ ] `docs/modules/ordering.md` (or the active module spec) matches implementation
- [ ] `BLUEPRINT.md` updated if API/contract changed
- [ ] Backend tests green
- [ ] Frontend tests green or explicitly documented + minimal setup
- [ ] Review checklist addressed
```

---

## Notes for humans

- **Module identity** in the fenced block defaults to **`ordering`** (POS / order builder). For **catalog** work, point **Module name** / **spec file** to `docs/modules/catalog.md` and use the catalog business goal. Duplicate this doc’s pattern for any slice.
- **Visual reference:** the team may use an **Artisanal Admin**–style mock (warm POS, tabs, cards with REGULAR/LARGE style variant strips, right-hand order summary). Behavior and structure are defined in **`docs/modules/ordering.md` §4.1**; pixel-perfect match is **not** required unless you add a design ticket.
- If you want **only** the spec first, run Phase 0 + Phase 1 in one session, then use a shorter “implement Phase 2–6” prompt in a follow-up.
