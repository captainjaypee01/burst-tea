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
- [ ] **shadcn/ui:** New UI uses `@/components/ui/*` primitives; no ad-hoc styled `<button>`/`<input>`/modals where a shadcn component exists or should be added (`npx shadcn@latest add …`). See `.cursor/agents/frontend.md`.

## Checklist — Security

- [ ] Employee-only auth; rate limiting considered for login.
- [ ] CORS/Sanctum domains documented for deployment.

Reference: [BLUEPRINT.md](../BLUEPRINT.md).
