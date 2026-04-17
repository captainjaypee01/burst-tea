# Module: `ordering` (POS / order builder)

**Status:** ready (SPA **implemented** — keep spec as regression reference)  
**Owner / branch:** optional  
**Last updated:** 2026-04-18  

## 1. Problem & outcome

- Staff need to **compose and complete sales** quickly: pick **sellable variants** from the catalog, add **per-line notes** (e.g. “no ice”, “extra rice”), adjust quantities, then **review** the order on a **separate page** and **pay** — with correct **shift** and **cash ledger** behavior when payments are cash/e-wallet.
- The **ordering experience must not reuse** the catalog admin patterns (server tables, dense list/detail flows, dialogs-first variant editing). The **sellable menu** for ordering is a **dedicated layout**: category **tabs**, **product cards** with **inline variant choice**, and a persistent **order summary** (cart). See **§4.1**.
- **Checkout is two-step in the SPA:** (1) **Composer** — build cart + notes + **Checkout** CTA; (2) **Checkout / review page** — read-only (or limited-edit) **order summary**, then **Pay** with a **payment method** choice. **No** hosted payment gateway or PSP redirect (no Maya/GCash API integration): staff record **Cash** or **e-wallet transfer** (Maya vs GCash as **labels** for how the customer paid offline).
- **Out of scope (typical v1):** payment gateway / QR auto-capture, inventory stock enforcement at checkout, full modifier builder UI, customer loyalty, rich reporting. **Modifiers** may be a follow-up if the API already supports them; confirm in Phase 0.

## 2. Actors & permissions

| Action | Permission (see `App\Support\Permissions`) |
|--------|---------------------------------------------|
| List/read orders | `order.read` |
| Create order / add line items | `order.create` (and related item endpoints as enforced by backend) |
| Update order | `order.update` |
| Delete/cancel order (if exposed) | `order.delete` |
| Post payment | `payment.create` |

Superadmin bypasses permission checks per existing `Employee` / `User` helpers.

## 3. Backend contract

- **Reuse first:** existing routes in [`backend/routes/api_v1.php`](../../backend/routes/api_v1.php):
  - `GET/POST /api/v1/orders`, `GET /api/v1/orders/{order}`
  - `POST /api/v1/orders/{order}/items`
  - `PATCH /api/v1/orders/{order}/items/{order_item}` — update quantity / notes
  - `DELETE /api/v1/orders/{order}/items/{order_item}` — remove line
  - `POST /api/v1/payments`
- **Catalog read:** `GET /api/v1/categories`, `GET /api/v1/products` (with filters as needed), product resources including **variants** and prices — align with [`docs/modules/catalog.md`](catalog.md).
- **Shifts / cash:** `GET /api/v1/shifts/current`, cash ledger semantics per `BLUEPRINT.md` and [`shifts-and-session.md`](shifts-and-session.md).
- **Domain rules:** validate `product_variant_id` (active, non-deleted product/category), order state, payment amounts vs totals, `shift_id` when required — **server-side** in FormRequests + Actions/Services; use `DB::transaction()` for multi-step writes.
- **Per-line notes:** `order_items` needs a nullable **`notes`** (text) column — **migration** + `OrderItem` fillable + `StoreOrderItemRequest` / DTO / resource exposure. Staff enter notes when adding or editing a line (kitchen / bar instructions).
- **Payments — manual methods only:** `POST /api/v1/payments` accepts `method`: `cash` | `e_wallet` | `credit` (see `App\Enums\PaymentMethod`). **Maya** / **GCash** → `method: e_wallet` plus **`e_wallet_provider`** (`maya` \| `gcash`) on **`payments`**. Optional **`reference`** for receipt/txn text. **No** hosted wallet redirect or webhooks in this slice.
- **Migrations / enums:** **`order_items.notes`**; **`payments.e_wallet_provider`**, **`payments.shift_id`** (nullable; set when the payment is recorded against a shift for cash/e-wallet audit and SPA links to the cash register ledger).

## 4. Frontend contract

### 4.1 Ordering menu layout (mandatory UX)

This is the **default** POS composer layout for burst-tea. **Do not** implement the ordering menu as a mirror of **Categories** / **Products** admin tables or the category-detail product list.

| Area | Behavior |
|------|----------|
| **Category groups** | **Horizontal tabs** (pill / segmented style) — one tab per **category** (or curated group). Switching tabs filters the **product grid** to that group only. Inactive tabs remain readable; **active** tab is visually distinct (e.g. filled background). Tabs should **scroll horizontally** on narrow viewports instead of wrapping awkwardly. |
| **Product cards** | Each **product** is a **card**: image (if available placeholder otherwise), **title**, short **description** (optional), and **price context**. **Variants are not** edited here — they are **chosen on the card**. |
| **Variants on the card** | At the **bottom** of each card, show **all sellable variants** for that product as a **single row or split control** (e.g. “REGULAR ₱85” \| “LARGE ₱105”). Tapping/clicking a variant adds that **variant line** to the order (or opens quantity if you standardize on double-tap — default: **one tap = add 1** of that variant). **Do not** send users to product detail or a separate dialog for routine variant picks. |
| **Featured / promo** | Optional: support a “featured” or **best seller** visual treatment for individual products (badge, emphasis) — data can come from product flags later; v1 can be static styling hooks only. |
| **Order summary (cart)** | **Right-hand column** on large screens: **“Order summary”** with line items (thumbnail optional), variant labels, **per-line notes** (see below), **quantity steppers** (− / +), line subtotals, then **subtotal**, taxes if applicable, **total**, and primary **Checkout** (or **Review order**) — **not** the final payment screen (see §4.4). **Scroll:** the **line list** scrolls inside the column; **totals + Checkout** remain **pinned/visible** below the scroll region (desktop **POS** layout uses **native `overflow-y-auto`** + **`.scrollbar-thin`**, not Radix **`ScrollArea`**, so nested flex does not collapse scroll height). |
| **Per-line notes** | Each cart line MUST support an optional **note** (textarea or inline field per row): e.g. “50% sugar”, “no onions”. Show the note in the summary and on the **checkout review** page. Persist via **`order_items.notes`** once the line exists on the server; composer may collect notes **before** POSTing items (implementation choice: prompt on add vs edit in cart). |

**Responsive behavior (required):**

| Viewport | Layout |
|----------|--------|
| **Desktop / ~14″ laptop** (~`lg` and up) | **Three-region** layout: **app sidebar** (existing `AdminLayout`) \| **menu grid** (flex-1) \| **order summary** (fixed min-width column). The **cart column can be collapsed** (toggle) to widen the menu; **default: expanded**. Menu grid uses **2–3 columns** of cards depending on breakpoint. **Product grid column** scrolls with **`overflow-y-auto`** + thin scrollbar when the shell is **`h-dvh`** / **`overflow-hidden`** so the **whole page** does not scroll. |
| **Tablet** | Same as desktop or slightly narrower cart; reduce card columns to 2. |
| **Mobile** | **Stacked**: category tabs (horizontal scroll) → product grid (**1–2 columns**) → **sticky bottom bar** (total + item count) opens a **right Sheet** with full cart. **Do not** rely on a permanently visible right column on small screens. |

**Accessibility:** focus order for tabs and variant controls; cart sheet/drawer must trap focus and be closable; quantity buttons need `aria-label`s`; note fields need labels.

### 4.2 Routes, hooks, and files

- **Composer route:** **`/pos/new`** (no order id yet) → after the first **`POST /orders`**, the SPA navigates to **`/pos/:orderId/compose`** so refresh keeps the in-progress order. **Use `/pos`** (not `/orders/...`) for the POS shell so the **Orders** sidebar item does not highlight together with **New order** (`matchPath('/orders')` would otherwise match `/orders/new`). **Order lifecycle:** server-backed order on **first line add** (first `POST /orders` includes at least one line).
- **Checkout / review route:** **`/pos/:orderId/checkout`** — read-only **summary**; **Pay** on this page (§4.4). Reached from **Checkout** in the cart.
- **Order detail:** **`/orders/:orderId`** — after payment, **redirect here**; shows **payments** and links to **cash register ledger history** (`/cash-registers/:cashRegisterId/ledger-history`) when a payment has **`shift_id`** (cash register integration).
- **Existing:** `/orders` remains the **server-paginated order list** (`DataTableServer`) — separate from the composer UI in §4.1.
- **Hooks / API:** [`frontend/src/api/orders.ts`](../../frontend/src/api/orders.ts), [`frontend/src/api/payments.ts`](../../frontend/src/api/payments.ts); `useOrder`, `useProducts`, `useCategoryOptions`, `useShiftSession` (checkout) — **no** raw Axios in card components.
- **State:** composer cart can be **React state** + optional `useReducer` or a **small local store** scoped to the page (do **not** expand Zustand beyond auth unless `BLUEPRINT` is updated).
- **UI:** shadcn/ui — `Tabs` or custom pill row, `Card`, `Button`, `Sheet` / `Drawer` for mobile cart, `Separator`, `Badge`; match existing theme tokens (`bg-card`, `border-card-border`, accent). Use **`ScrollArea`** only where it receives a **bounded height** (e.g. mobile **Sheet** cart). **POS desktop:** **menu** + **embedded cart line list** use **`overflow-y-auto`** and **`.scrollbar-thin`** ([`index.css`](../../frontend/src/index.css)) with **`min-h-0` / `basis-0`** flex children — avoids Radix scroll viewport **0 height** inside nested flex.

### 4.3 Explicit non-goals for the ordering menu UI

- No **DataTableServer** for the **sellable product grid**.
- No **variant management** (add/edit SKU) on this page — that stays in **catalog** (`/products/...`).
- No requirement to match the **category detail** product list layout from catalog.

### 4.4 Checkout & pay page (mandatory)

After **Checkout** from the composer, the user lands on a **dedicated page** (not a modal) for **final review** and **payment**.

| Area | Behavior |
|------|----------|
| **Summary** | Full order: lines with product/variant names, qty, **line notes**, line totals, **subtotal**, **tax** if applicable, **grand total**. Read-only or allow only **note/qty** edits if spec allows — default **read-only** review before pay. |
| **Payment method** | **No third-party integration** — staff select how the customer settled: **Cash** | **Maya** | **GCash** (or equivalent labels). **Cash** → `POST` payment `method: cash`. **Maya** / **GCash** → `method: e_wallet` plus **provider** in `reference` or dedicated field (§3). |
| **Shift** | If multiple shifts open, require **`shift_id`** on payment per existing `PostPaymentRequest` rules. |
| **Post-payment** | On success, show Sonner **`toast.success('Payment complete')`**, **`reload()`** order, then **navigate** to **`/orders/:orderId`** (order detail). |

**Explicit exclusions:** No Maya/GCash **API keys**, no redirect to wallet apps for automated capture, no webhook handlers for this slice — **record-keeping only**.

## 5. Acceptance criteria

- [x] Staff can open the **ordering menu page** and see **category tabs** + **product cards** with **variants on each card** as in §4.1.
- [x] Each line in the cart supports **notes**; notes appear in summary and on the **checkout** page; persisted on **`order_items.notes`**.
- [x] **Checkout** navigates to a **separate page** with full **order summary** before payment.
- [x] **Pay** flow offers **Cash**, **Maya**, and **GCash** (or agreed labels); **no** payment gateway integration; API uses `cash` / `e_wallet` as in §3.
- [x] Adding variants updates the **order summary**; quantities can be changed from the summary (composer); totals reflect **variant prices** (PHP via `currency.ts`).
- [x] **Responsive:** layout matches §4.1 table for **desktop (~14″)** and **mobile** (cart accessible without horizontal scroll of the whole page); checkout page stacks cleanly on small screens.
- [x] **Permissions:** server-side enforcement; UI hides pay if unauthorized.
- [x] **Payments / shifts:** behavior matches spec + `BLUEPRINT.md` for cash/e-wallet and `shift_id` when required.
- [x] `BLUEPRINT.md` changelog updated for API/routes and SPA polish (see **2026-04-18** entries).

## 6. Minimal context pack

- `BLUEPRINT.md`
- `docs/modules/catalog.md` (variants & pricing model)
- `docs/modules/shifts-and-session.md`
- `backend/routes/api_v1.php`
- `backend/app/Support/Permissions.php`
- `frontend/src/routes/AppRoutes.tsx`
- `frontend/src/components/layout/AdminLayout.tsx`
- `frontend/src/lib/currency.ts`

## 7. Follow-ups

- Optional **PSP / QR** integration for e-wallets (out of scope for manual-transfer v1).
- Customer attach, discounts, modifiers on lines, receipt printing.
- **Inventory** deduction or soft warnings when stock is tracked.
- **KPI dashboard** (separate module).
