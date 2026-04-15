# burst-tea — AI assistant context

- **Architecture and changelog:** [BLUEPRINT.md](BLUEPRINT.md) — read this first; append dated entries when you change behavior, APIs, or infrastructure.
- **What’s implemented, module order, prompts, context rules:** [README.md](README.md).
- **Agent specialization:** [AGENTS.md](AGENTS.md) and [`.cursor/agents/`](.cursor/agents/).

## Stack (summary)

- **Backend:** Laravel, Sanctum, MySQL (default in Docker), API under `/api/v1`, Controller → Action → Service → Model.
- **Frontend:** React 19, Vite, TypeScript, Tailwind v4, shadcn/ui, Zustand (auth only), Axios via hooks.
- **Dev:** `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`

Do not bypass FormRequests for validation or skip permission checks in mutating Actions.
