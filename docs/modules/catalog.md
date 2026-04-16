# Module: `catalog` (products, categories, variants)

**Status:** draft — **next to implement** (SPA)  
**Owner / branch:** optional  
**Last updated:** 2026-04-17  

## 1. Problem & outcome

- Staff need to **maintain the sellable menu**: **categories** (grouping), **products**, and **variants** (priced lines, SKU) so the future **ordering / POS** UI can list items and attach line items to real catalog rows.
- Backend **already exposes** CRUD for categories, products, variants, modifiers, and recipes (`api_v1.php`); the **gap** is a complete **staff SPA** for create/edit/archive and variant management beyond list-only tables.
- **Out of scope for this slice:** **Inventory** stock counts and ledger UI (separate module — see **§7**). **Ordering / checkout** UI (follows after catalog is usable).

### Relationship to inventory

- **Inventory** in this product is primarily an **operational record**: “Do we still have patties / syrup / cups?” — **inventory items**, movements, **inventory ledger** — for **tracking and reporting**, not necessarily **blocking** every sale.
- **Ordering** needs **catalog** (what you sell, at what price). It does **not** require inventory enforcement to exist first. Later, **recipes** can link **variants → ingredients** so sales can **optionally** drive stock deductions; that is **inventory + ordering integration**, not a prerequisite for a first POS.

---

## 2. Actors & permissions

- Map to `App\Support\Permissions`: **`category.*`**, **`product.*`** (and variant routes nested under products as today).
- Superadmin / `hasPermission` per `BLUEPRINT.md`.

---

## 3. Backend contract

- **Reuse** existing controllers: `CategoryController`, `ProductController`, `ProductVariantController`, `ModifierController`, `RecipeController` as needed by the spec iteration.
- **New migrations:** only if the spec adds fields or endpoints (default: **no** for first SPA slice).

---

## 4. Frontend contract

- **Routes:** extend beyond `/products` list — e.g. product **detail/edit**, variant **create/edit**, category **admin** (exact paths TBD when implementing).
- **Hooks** + `src/api/*` only; **DataTableServer** for paginated lists; forms with `FormRequest`-aligned validation messages.

---

## 5. Acceptance criteria

- [ ] Staff can **CRUD categories** (or minimum: options + assign product category) per permissions.
- [ ] Staff can **CRUD products** and **variants** (price, SKU, active) for sellable lines.
- [ ] Permissions enforced server-side; UI matches.
- [ ] `BLUEPRINT.md` changelog if API or routes change.

---

## 6. Minimal context pack

- `BLUEPRINT.md`
- `README.md` (module roadmap)
- `backend/routes/api_v1.php`
- `backend/app/Support/Permissions.php`
- `frontend/src/pages/ProductsPage.tsx` (current baseline)

---

## 7. Follow-ups

- **Modifiers** UI (if not bundled in v1).
- **Recipes** linking variants to inventory items — bridges **catalog** to **inventory**.
- **Inventory module** (items, ledger, adjustments) — **parallel or after** ordering MVP; see `README.md` roadmap.
