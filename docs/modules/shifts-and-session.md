# Module: `shifts-and-session`

**Status:** implemented (evolving with ordering module)  
**Owner / branch:** optional  
**Last updated:** 2026-04-17  

## 1. Problem & outcome

- Staff need a reliable start/end-of-day **cash session** per **cash register**: open shift, record movements, review the **cash ledger**, close shift.
- The **cash ledger** is the append-only story of **physical drawer money** for **one shift** (opening float, cash-related ins and outs, adjustments, closing count). See **§1.1** (plain language) and **§3.3** (technical).
- Conventions for controller → FormRequest → Action → Service → Model, pagination, and auth are in [`BLUEPRINT.md`](../../BLUEPRINT.md) (not duplicated here).

### 1.1 Cash ledger (plain language)

- **Opening cash** — Starting bills/coins in the drawer so you can **give change** (not “profit”).
- **Sale (cash / e-wallet in ledger)** — When the ordering/payment flow records a payment that affects this shift’s drawer story, the backend appends a **sale** line (see **§3.3**). **Cash** increases physical drawer expectation; **e-wallet** may be recorded for **shift totals** depending on product rules—it does not always match physical bills.
- **Expense** — Money **left the drawer** (e.g. petty cash); recorded when an expense is created with **`shift_id`**. **UI:** enter a **positive** amount; `CashDrawerService::recordExpense` stores a **negative** `amount_cents` (outflow).
- **Advance** — Cash **taken from the drawer** as an advance; recorded when a cash advance is created with **`shift_id`**. **UI:** enter a **positive** amount for cash out; backend stores **negative** `amount_cents`, same sign convention as expense.
- **Adjustment** — A **manual correction** to expected vs counted cash (with **required reason** on the API); **`delta_cents`** may be **positive or negative** (not the same as expense/advance entry pattern).
- **Closing** — End of shift: you **count** cash and record **closing**; shift becomes **closed**.

### 1.2 Implemented vs deferred

| Area | Status |
|------|--------|
| Multi-register shifts, current shift, open/close, ledger read, cash adjustment | **Done** (API + SPA) |
| Expense & cash advance from shift session (with `shift_id`) | **Done** — single **entry type** control (expense / cash advance / count adjustment) per permissions |
| Register shift list + per-shift ledger (**history page**) | **Done** — see **§4** |
| Ordering-driven **sale** lines on ledger | **Backend ready**; staff ordering UI when built |
| **Variance** report (expected vs counted) | **Deferred** |
| Filtered expense/advance **index** by `shift_id` (optional dedicated lists) | **Deferred** |

### 1.3 Ordering module (later)

When **cash** (and policy-defined **e-wallet**) payments post, **`PostPaymentAction`** / **`CashDrawerService::recordSale`** should continue to append **sale** rows to the **resolved shift** so the ledger **tallies** with drawer policy at close.

---

## 2. Actors & permissions

- Primary actor: cashier/manager on the shift session and register history screens.
- Constants from `App\Support\Permissions`:
  - `SHIFT_OPEN`, `SHIFT_CLOSE`
  - `CASH_READ` — ledger read (session + history page)
  - `CASH_ADJUST` — cash count adjustments on session
  - `REGISTER_READ`, `REGISTER_MANAGE` — registers CRUD; **register read** required with **cash read** for **shift history** route
  - `EXPENSE_CREATE` — create expense with `shift_id` from session
  - `ADVANCE_CREATE` — create cash advance with `shift_id` (session UI uses **current user** as `user_id` unless a fuller advance flow adds a recipient picker)
  - `EXPENSE_READ`, `ADVANCE_READ` — list/show elsewhere (not required for session recording)
- Superadmin / `hasPermission` behavior per BLUEPRINT.

---

## 3. Backend contract

### 3.1 Shifts & current shift

- `POST /api/v1/shifts/open` — `cash_register_id`, `opening_cash_cents`; `SHIFT_OPEN` + `REGISTER_READ`.
- `GET /api/v1/shifts/current?cash_register_id=` — `CASH_READ` + `REGISTER_READ`.
- `POST /api/v1/shifts/{shift}/close` — `closing_cash_cents`; `SHIFT_CLOSE`.
- `POST /api/v1/shifts/{shift}/cash-adjustment` — `delta_cents`, **required** `reason`; `CASH_ADJUST`.
- `GET /api/v1/shifts/{shift}/cash-ledger` — paginated ledger; `CASH_READ`; `per_page` capped (controller, typically up to 500).

### 3.2 Cash registers

- `GET /api/v1/cash-registers/options` — active registers for pickers; `REGISTER_READ`.
- `GET/POST/PUT/DELETE /api/v1/cash-registers` — index/create/update/deactivate; `REGISTER_READ` / `REGISTER_MANAGE` as applicable.
- `GET /api/v1/cash-registers/{cash_register}` — single register (SPA uses for history page title); `REGISTER_READ`.
- `GET /api/v1/cash-registers/{cash_register}/shifts` — paginated shifts for that register (newest first), `user`, `closedBy`, `cashRegister` loaded; **`REGISTER_READ` + `CASH_READ`**.

### 3.3 Cash ledger line types & amounts

Ledger rows use `CashLedgerType`: `opening`, `sale`, `expense`, `advance`, `adjustment`, `closing`. **Append-only.**

| Source | When it appears | Amount notes |
|--------|-----------------|--------------|
| Open shift | `opening` | Opening float |
| Order / payment | `sale` | Positive; when `PostPaymentAction` records sale for shift |
| Expense + `shift_id` | `expense` | Stored **negative** (outflow); API accepts positive `amount_cents` on expense create |
| Cash advance + `shift_id` | `advance` | Stored **negative** (outflow); same as expense |
| Cash adjustment | `adjustment` | **Signed** `delta_cents` + reason |
| Close shift | `closing` | Counted cash |

**Ordering alignment:** If more than one shift is open, **`shift_id`** is required on cash/e-wallet payments (enforced server-side).

**Reuse routes (no duplicate ledger tables):**

- `POST /api/v1/expenses` — include `shift_id` for `CashDrawerService::recordExpense`.
- `POST /api/v1/cash-advances` — `user_id`, `shift_id`, etc. for `recordAdvance`.

---

## 4. Frontend contract

### Routes ([`frontend/src/App.tsx`](../../frontend/src/App.tsx))

- `/shifts/session` — **`ShiftsSessionPage`**
- `/cash-registers` — **`CashRegistersPage`**
- `/cash-registers/:cashRegisterId/ledger-history` — **`CashRegisterLedgerHistoryPage`**

### APIs & hooks

- `src/api/shifts.ts` — current shift, open/close, adjustment, cash ledger pages, **`fetchShiftsForCashRegister`**
- `src/api/cash-registers.ts` — CRUD, **`fetchCashRegister`**
- `src/api/expenses.ts`, `src/api/cash-advances.ts` — create from session
- `useShiftSession`, `useShiftCashLedger`, `useCashRegisterOptions`, `useCashRegisters`, `useCashRegisterShifts`

### UI behaviors

- **Shift session:** register `Select`, open/close, **Record ledger entry** with **entry type** `Select` (expense / cash advance / count adjustment) gated by permissions; forms call POST expenses / cash-advances / adjustment with `shift_id` where applicable; **`CashLedgerPanel`** (up to 500 rows/page) with reload nonce after posts.
- **Cash registers:** table; **History** → ledger history **page** (not a dialog).
- **Ledger history page:** loads register via `fetchCashRegister`; paginated shifts; **View ledger** → **`CashLedgerPanel`** for that shift; toolbar: **Cash registers** back link; **Refresh shift list** on shifts table only; **← Back to shifts** + **Refresh ledger** when viewing a shift ledger.
- **No raw Axios** in dumb components; hooks + `src/api/*` only.

### Shared components

- `components/shifts/CashLedgerPanel.tsx` — paginated ledger table + `ledgerReloadNonce` to refetch.

---

## 5. Acceptance criteria

- [x] Open / close / current shift / cash adjustment / ledger pagination per §3.
- [x] Ledger shows line kinds produced in production (opening, closing, adjustment; expense/advance when posted; sale when payments post).
- [x] Session UI: expense and cash advance against **current shift** without manual `shift_id`; entry type selector + permission gating.
- [x] Register shift history: **page** with shift list and per-shift ledger; refresh actions match context (shifts vs ledger).
- [ ] Ordering UI: payments append **sale** lines to the correct shift (when POS flow ships).
- [x] Permissions enforced server-side; client hides unauthorized controls.

---

## 6. Minimal context pack (for AI / reviewers)

- `BLUEPRINT.md`
- `docs/modules/shifts-and-session.md`
- `backend/routes/api_v1.php`
- `backend/app/Support/Permissions.php`
- `backend/app/Services/CashDrawerService.php`
- `backend/app/Actions/Payments/PostPaymentAction.php`
- `frontend/src/pages/ShiftsSessionPage.tsx`
- `frontend/src/pages/CashRegisterLedgerHistoryPage.tsx`
- `frontend/src/components/shifts/CashLedgerPanel.tsx`
- `frontend/src/components/ui/select.tsx` (custom select; label map for display)

---

## 7. Follow-ups (optional product / tech)

- **Variance** — compare expected drawer position to `closing_cash_cents` (needs defined “expected” rules).
- **Advance recipient** — session UI could offer staff picker when `USER_READ` allows `GET /users/options`.
- **Expense/advance lists** — API filter by `shift_id` for reconciliation screens.
- **Ordering module spec** — cross-link payment methods, `shift_id`, and ledger lines (after **catalog** exists — see [`README.md`](../../README.md) roadmap).

---

## 8. Module health

The slice is **coherent for production use**: server is source of truth, permissions are explicit, ledger is append-only, and the SPA separates **live session** from **historical per-register** review. The main **gap** relative to a full POS is **staff-facing order/payment** posting **sale** lines; **nice-to-haves** are variance reporting and richer advance/expense browsing—not blockers for the current behavior.

**What to build next (repo):** [`README.md`](../../README.md) — **Catalog** (products + categories + variants) before ordering; **inventory** as separate **stock tracking**, not a dependency for opening ordering unless you add enforcement later. Draft: [`catalog.md`](catalog.md).
