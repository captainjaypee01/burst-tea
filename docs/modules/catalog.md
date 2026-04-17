# Module: `catalog` (categories, products, variants)

**Status:** ready  
**Owner / branch:** optional  
**Last updated:** 2026-04-17  

## 1. Problem & outcome

- Staff maintain the **sellable catalog**: **categories**, **products**, and **variants** (price, SKU, active) so ordering/POS can reference real rows.
- **SPA:** dedicated **Categories** page (server-paginated list + create/edit/remove dialogs), **Products** list with **New product** dialog (embedded variants on create), and **Product detail** at `/products/:productId` for editing details and managing variants after creation.
- **Out of scope:** modifiers UI, recipe UI, inventory enforcement. **Deletes** are **soft deletes** (retained rows); API `DELETE` performs soft delete.

## 2. Actors & permissions

| Action | Permission |
|--------|------------|
| List/read categories | `category.read` |
| Create/update/delete category | `category.create` / `category.update` / `category.delete` |
| List/read products | `product.read` |
| Create product (with embedded variants) | `product.create` |
| Update product / add·update·remove variants | `product.update` |
| Delete product | `product.delete` (soft-deletes product; variants cascade soft delete) |

Superadmin bypasses checks per `Employee::hasPermission` / `User::hasPermission`.

## 3. Backend contract

- **Routes** (unchanged surface, reuse controllers): `GET/POST /api/v1/categories`, `GET/PUT/PATCH/DELETE /api/v1/categories/{category}`; `GET/POST /api/v1/products`, `GET/PUT/PATCH/DELETE /api/v1/products/{product}`; `POST/PUT/DELETE /api/v1/products/{product}/variants` and variant `{variant}`.
- **Soft deletes:** `deleted_at` on users, categories, products, product_variants, modifiers, customers, inventory_items, cash_registers, expenses, cash_advances. **Foreign-key** validation uses `Rule::exists(...)->whereNull('deleted_at')` where applicable.
- **Product delete:** `Product` model cascades soft delete to **variants** in `deleting` when not force-deleting.
- **Product JSON:** `ProductResource` includes optional nested `category` when loaded.
- **Migrations:** `2026_04_17_100000_add_soft_deletes_to_domain_tables.php`.

## 4. Frontend contract

- **Routes:** `/categories`, `/categories/:categoryId` (category detail + products in group + **New product** locked to that category), `/products`, `/products/:productId` (see [`AppRoutes.tsx`](../../frontend/src/routes/AppRoutes.tsx)).
- **Nav:** `nav-items.ts` — Categories + Products.
- **API:** `src/api/categories.ts`, `src/api/products.ts`.
- **Hooks:** `useCategories`, `useProducts`, `useProduct`.
- **UI:** shadcn/ui (`Dialog`, `Button`, `Input`, `Select`, `DataTableServer`, **Sonner** toasts via [`components/ui/sonner.tsx`](../../frontend/src/components/ui/sonner.tsx) + `import { toast } from 'sonner'`). No raw Axios in pages — hooks only.
- **Money helpers:** `src/lib/money.ts` (`dollarsToCents`, `centsToDollarsString`); display formatting via `src/lib/currency.ts` (`formatMoneyCents`, default **PHP** until settings exist).
- **Searchable selects:** `src/components/ui/searchable-select.tsx` for consistent category (and future) pickers with search.
- **Permissions:** `src/constants/permissions.ts` + `hasPermission`.

## 5. Acceptance criteria

- [x] Staff can **CRUD categories** (list + dialogs) when permitted.
- [x] Staff can **create products** with **initial variants** in one step; **edit** product and **variants** on the detail page.
- [x] **Remove** actions use **soft delete** on the API; lists exclude deleted rows.
- [x] Permissions enforced server-side; UI gates actions by `auth/me` permissions.
- [x] `BLUEPRINT.md` changelog updated for API/schema/testing.

## 6. Minimal context pack

- `BLUEPRINT.md`
- `backend/routes/api_v1.php`
- `backend/app/Support/Permissions.php`
- `backend/app/Models/Product.php` (cascade soft delete)
- `frontend/src/App.tsx`
- `frontend/src/pages/CategoriesPage.tsx`
- `frontend/src/pages/ProductsPage.tsx`
- `frontend/src/pages/ProductDetailPage.tsx`

## 7. Variants, SKU, and “no options” products

- **Pricing** is stored on **`product_variants`**, not on `products`. Creating a product **requires at least one variant** (`StoreProductRequest`: `variants` array `min:1`).
- Items **without** size/flavor/options should still use **one variant**: e.g. **“Standard”**, **“Regular”**, or the same name as the product. That variant is the sellable line the POS will add to an order.
- **Variant name** — label staff see at checkout (e.g. `Large`, `Hot`, `Standard`).
- **SKU** (stock-keeping unit) — optional internal or **barcode** id for scanning, reporting, or receiving stock (e.g. `SKU-MILK-1L`). Not the same as variant name unless you choose to align them.

## 8. Display currency (SPA)

- Until a **Settings** module exists, the SPA formats money as **Philippine Peso (PHP)** via [`frontend/src/lib/currency.ts`](../../frontend/src/lib/currency.ts) (`DEFAULT_CURRENCY_CODE`, `DEFAULT_CURRENCY_LOCALE`). Replace `getCurrencyCode` / `getCurrencyLocale` with API-driven settings later.

## 9. Customer menu board (printed / display TV)

**Is the data model enough?** **Yes** for both patterns below — categories, products, and variants map cleanly; **menu layout** is a **presentation** concern on top of the same API.

| Your example | How it maps |
|--------------|-------------|
| **GROUP — SIZZLING MEALS** | **Category** name (and/or a display “group” field later). |
| **Liempo / Porkchop / Sisig @ P123** | **Products** with **one variant each** (e.g. name `Standard`) **or** show a single primary variant per product. |
| **ICED COFFEE — columns R and L** | **Products** (Caramel, Vanilla, …) each with **two variants** whose **names align** across rows — e.g. `Regular` & `Large` (or `R` & `L`). Prices differ per cell (`price_cents` per variant). |

**Same group, different variant setups (e.g. some items one price, others R/L):** Allowed in data — each product carries its own variant list. When **rendering** the menu you can:

1. **Ragged rows** — list each product with only its variants (simplest; printed menus often look like this).
2. **Matrix with empty cells** — build column headers from the **union** of variant names in that category (or a **fixed order**); products missing a size show `—` or leave blank.
3. **Split sections** — use **separate categories** for “single-price boards” vs “size matrix” boards so each section uses one template.
4. **Later** — optional **category** fields such as `menu_layout` / `menu_column_variants` so a TV menu app knows which template to use without heuristics.

**Ordering** within a category: use **category `sort_order`** and (when added) **product `sort_order`** or manual ordering in the menu app.

## 10. Demo data (local)

- **`php artisan db:seed`** (or `migrate:fresh --seed`) runs [`TambayanMenuSeeder`](../../backend/database/seeders/Catalog/TambayanMenuSeeder.php): Tambayan Cafe–style categories/products/variants from the reference menus (PHP amounts stored as `price_cents`).

## 11. Follow-ups

- Modifiers & recipe UIs.
- Optional **restore** or admin “trashed” views for soft-deleted catalog rows.
- Inventory linkage and stock enforcement at checkout (separate modules).
- **Settings:** store currency and other locale prefs (see §8).
- **Customer menu / TV** — read-only view or export using §9; optional category metadata for layout templates.
