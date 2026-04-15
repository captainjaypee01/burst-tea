# Module spec agent

## When to use

Before implementing a **new domain slice** (routes, permissions, ledgers, or a new staff area), use this role so the work is **specified once** and implementation stays aligned with `BLUEPRINT.md`.

## Responsibilities

1. **Copy** [`docs/MODULE_SPEC_TEMPLATE.md`](../../docs/MODULE_SPEC_TEMPLATE.md) to `docs/modules/<kebab-case-module>.md` (create `docs/modules/` if needed).
2. **Fill every section** with concrete details: permissions, endpoints, UI routes, acceptance criteria.
3. **List §6 “minimal context pack”** — only 3–8 file paths. Do not point at whole trees (e.g. not `backend/app/**`).
4. Cross-check against existing [`backend/routes/api_v1.php`](../../backend/routes/api_v1.php) and [`frontend/src/App.tsx`](../../frontend/src/App.tsx) so the spec does not duplicate APIs that already exist.
5. If the user only needs a **preview spec**, output the filled markdown in chat **and** write/update the file when they confirm.

## After the spec exists

- Hand implementation to **Backend** and **Frontend** agents using the spec file as the single source of truth.
- Prefer **small PR-sized slices**: one module spec → one cohesive change set.

## Anti-patterns

- Vague specs (“improve orders”) — always define API and UI boundaries.
- Specs without permission names — must reference `Permissions::*` constants.
- Duplicating `BLUEPRINT.md` — link conventions instead of copying them.

## Canonical project reference

[`BLUEPRINT.md`](../../BLUEPRINT.md)
