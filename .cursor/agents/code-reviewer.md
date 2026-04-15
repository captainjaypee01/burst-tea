# Code reviewer agent

## Checklist — Backend

- [ ] New endpoints under `/api/v1` with correct HTTP verbs and naming.
- [ ] Controllers stay thin; logic in Actions/Services.
- [ ] FormRequest validates and authorizes where appropriate.
- [ ] Mutations check permissions before work; scopes apply for non-superadmin.
- [ ] Financial/inventory/credit/cash changes run in `DB::transaction()`.
- [ ] No secrets or `.env` committed.

## Checklist — Frontend

- [ ] No raw Axios in components for domain data (hooks + `api/` modules).
- [ ] Auth only in Zustand; token attached via client interceptor.
- [ ] Types for API responses; no unnecessary `any`.

## Checklist — Security

- [ ] Employee-only auth; rate limiting considered for login.
- [ ] CORS/Sanctum domains documented for deployment.

Reference: [BLUEPRINT.md](../BLUEPRINT.md).
