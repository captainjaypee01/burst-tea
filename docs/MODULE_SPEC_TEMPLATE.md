# Module: `<module-name>`

**Status:** draft | ready | in-progress | done  
**Owner / branch:** optional  
**Last updated:** YYYY-MM-DD  

## 1. Problem & outcome

- What user-facing problem does this solve?
- What is explicitly **out of scope** for this slice?

## 2. Actors & permissions

- Which staff roles use it? (map to `App\Support\Permissions` constants.)
- Superadmin vs permission-gated behavior.

## 3. Backend contract

- **Routes** (`/api/v1/...`): list methods and request/response shapes (or “reuse existing `XController`”).
- **Domain rules:** validations, state machines, ledger/double-entry notes, `DB::transaction` boundaries.
- **New migrations / enums:** yes/no.

## 4. Frontend contract

- **Routes** (`/...`): new pages or nested routes.
- **Hooks** (`src/hooks/use….ts`) and **`src/api/*.ts`** modules (no raw Axios in UI).
- **UI:** layout pieces, tables (DataTableServer pattern), forms, empty/error states.

## 5. Acceptance criteria

- [ ] API behavior matches §3 (manual or automated checks listed).
- [ ] UI matches §4; loading/error handling.
- [ ] Permissions enforced server-side; UI hides or disables unauthorized actions.
- [ ] `BLUEPRINT.md` changelog entry appended if APIs/env/Docker changed.

## 6. Minimal context pack (for AI / reviewers)

Files an implementer must read **before** coding (keep this list short):

- `BLUEPRINT.md` (conventions)
- `docs/MODULE_SPEC_TEMPLATE.md` (this doc — replace with this module’s filled spec path)
- …

## 7. Follow-ups (later modules)

- Bullets pointing to future work **not** done in this slice.
