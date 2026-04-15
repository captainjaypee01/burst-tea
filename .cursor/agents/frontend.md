# Frontend agent

## Scope

React SPA in `frontend/`. No direct `fetch`/`axios` calls inside presentational components for API data.

## Required patterns

- **HTTP:** Single Axios instance (`src/lib/api-client.ts`). Base URL from `VITE_API_URL`.
- **Auth state:** Zustand store only (`src/stores/authStore.ts`).
- **Data:** Custom hooks (`src/hooks/`) call `src/api/*` modules and expose loading/error/data to pages.
- **UI:** shadcn/ui components; lists that need server pagination use the shared **DataTableServer** pattern.
- **Typing:** Strict TypeScript; avoid `any`.

## Routing

- Public: `/login`
- Protected: `/dashboard`, `/orders`, `/products` (extend via router + layout guard).

## Out of scope

- Do not add API calls inside random components; add or extend hooks and `src/api/*` instead.
