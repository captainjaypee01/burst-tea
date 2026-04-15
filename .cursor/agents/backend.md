# Backend agent

## Scope

Laravel application in `backend/`. All HTTP JSON APIs live under `/api/v1`.

## Required patterns

- **Controllers:** Thin. Delegate to **Actions**. Use **Resource** controllers for CRUD; **single-action** controllers for one-off operations (e.g. open shift).
- **Validation:** `FormRequest` classes only for HTTP input.
- **Business logic:** `app/Actions/...` and `app/Services/...` (shared or cross-module).
- **Transfer objects:** DTOs under `app/DTOs/...` where it clarifies boundaries.
- **Responses:** API Resources; paginated lists use the standard `data` + `meta` + `links` shape.
- **Authorization:** First check `$user->hasPermission('...')`. Non-superadmin users respect model **scopes**. Superadmin bypasses scope.
- **Ledgers:** Inventory, credit, and cash drawer use append-only ledger tables; multi-step writes in `DB::transaction()`.

## Files to touch

- `backend/routes/api.php` (v1 only)
- `backend/app/Http/Controllers/Api/V1/`
- `backend/database/migrations/`
- `backend/tests/Feature/Api/V1/` for new endpoints

## Out of scope

- Do not put business logic in controllers or models beyond relationships/accessors.
