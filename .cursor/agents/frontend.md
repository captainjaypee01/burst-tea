# Frontend agent

## Scope

React 19 SPA in `frontend/`. No direct `fetch`/`axios` calls inside presentational components for API data.

---

## UI stack — shadcn/ui (mandatory)

The staff UI is built on **shadcn/ui** (Radix primitives + Tailwind + `cn()`). Treat [`frontend/src/components/ui/`](../../frontend/src/components/ui/) as the **only** source of design-system primitives for new work.

### Rules

1. **Import primitives from `@/components/ui/*`** — e.g. `Button`, `Input`, `Dialog`, `Sheet`, `Tooltip`, `Separator`, `Skeleton`, `Sidebar` parts. Do **not** hand-roll styled `<button>`, `<input>`, or modal `<div>`s when a shadcn component exists or can be added.
2. **Before building custom UI**, check [shadcn/ui components](https://ui.shadcn.com/docs/components) and **add** the official component into the repo (see **Adding components** below). Prefer **Card**, **Label**, **Table**, **Tabs**, **Dropdown Menu**, **Alert**, **Badge**, **Checkbox**, **Switch**, **Select** (official), **Form**, **Popover**, **Scroll Area**, etc., over one-off class strings on raw HTML.
3. **Consistency:** Use **`lucide-react`** icons (already a dependency). Match spacing, radius, and focus rings used in existing `components/ui/*` (see `button.tsx`, `input.tsx`).
4. **Project-specific:** [`select.tsx`](../../frontend/src/components/ui/select.tsx) is a **custom** Select (same public API as shadcn; Radix `@radix-ui/react-select` was removed for install reasons). Prefer it for selects until the team standardizes on the registry Select again. Style new select usage like other form controls.
5. **Data tables:** Keep server pagination in **`DataTableServer`**; wrap tables with shadcn **Table** primitives when you add/import them (`npx shadcn@latest add table`).
6. **New features** must use shadcn components end-to-end. **Refactors** of older pages should progressively replace raw elements with `@/components/ui/*` when touching those files.

### Adding components (agents & humans)

With Node/npm working (e.g. WSL fixed):

```bash
cd frontend
# First-time only, if components.json is missing:
npx shadcn@latest init
# Then add what you need (examples):
npx shadcn@latest add card label table tabs alert badge checkbox dropdown-menu popover scroll-area form
```

Follow CLI prompts (Tailwind v4 + Vite paths are supported in current shadcn). New files land under `src/components/ui/` unless the CLI says otherwise—**keep that convention**.

### Currently present (baseline)

`button`, `input`, `dialog`, `sheet`, `tooltip`, `separator`, `skeleton`, `sidebar`, **`sonner`** ([`sonner.tsx`](../../frontend/src/components/ui/sonner.tsx) + `toast` from `sonner`), plus custom `select`. **Expand** this set as features require—do not duplicate patterns outside `components/ui` for the same role.

---

## Required patterns (data & architecture)

- **HTTP:** Single Axios instance (`src/lib/api-client.ts`). Base URL from `VITE_API_URL`.
- **Auth state:** Zustand store only (`src/stores/authStore.ts`).
- **Data:** Custom hooks (`src/hooks/`) call `src/api/*` modules and expose loading/error/data to pages.
- **Lists:** Server-paginated lists use the shared **DataTableServer** pattern.
- **Typing:** Strict TypeScript; avoid `any`.

---

## Routing

- **Definition:** [`frontend/src/routes/AppRoutes.tsx`](../../frontend/src/routes/AppRoutes.tsx) — not inline in `App.tsx`.
- **Lazy routes:** In [`frontend/src/routes/AppRoutes.tsx`](../../frontend/src/routes/AppRoutes.tsx), `const Page = lazy(() => import('@/pages/…'))` per screen (page modules default-export the component); `Suspense` + [`RouteLoadingFallback`](../../frontend/src/components/layout/RouteLoadingFallback.tsx).
- **Public:** [`GuestOnly`](../../frontend/src/components/auth/GuestOnly.tsx) — `/login` (logged-in users redirect to `/dashboard`).
- **Private:** [`RequireAuth`](../../frontend/src/components/auth/RequireAuth.tsx) → [`AdminLayout`](../../frontend/src/components/layout/AdminLayout.tsx) — `/dashboard`, `/orders`, `/categories`, `/products`, `/shifts/session`, `/cash-registers`, etc.

---

## Out of scope

- Do not add API calls inside random components; add or extend hooks and `src/api/*` instead.
- Do not introduce new global client state stores (Zustand remains auth-only).
