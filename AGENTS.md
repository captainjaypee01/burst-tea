# Agent roles (burst-tea)

Use the specialized instructions in [`.cursor/agents/`](.cursor/agents/) when working on this codebase.

| Role | File | Remit |
|------|------|--------|
| Backend | [backend.md](.cursor/agents/backend.md) | Laravel API, migrations, Actions/Services, permissions, transactions |
| Frontend | [frontend.md](.cursor/agents/frontend.md) | React, hooks-only data access, Zustand auth, shadcn/ui |
| Tester | [tester.md](.cursor/agents/tester.md) | PHPUnit/Pest, `/api/v1` feature tests, CI-friendly commands |
| Code Reviewer | [code-reviewer.md](.cursor/agents/code-reviewer.md) | SOLID, security, thin controllers, consistency with BLUEPRINT |
| Module spec | [module-spec.md](.cursor/agents/module-spec.md) | Fill `docs/modules/<name>.md` from [MODULE_SPEC_TEMPLATE.md](docs/MODULE_SPEC_TEMPLATE.md) before a new slice |

Canonical project context: [BLUEPRINT.md](BLUEPRINT.md). For push-ready overview and roadmap: [README.md](README.md).
