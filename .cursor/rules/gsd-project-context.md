<!-- gsd-project-start source:PROJECT.md -->
## Project

**Champ** — Book exclusive training sessions and consultations with famous fighters: catalog → profile → service → slot → pay → confirmation. Backend owns fighters, services, slots, bookings, users, payments; optional admin for operations.

See full context: `.planning/PROJECT.md`
<!-- gsd-project-end -->

<!-- gsd-stack-start source:.planning/research/STACK.md -->
## Technology Stack

- **Client:** Angular 20 + Ionic 8 (existing scaffold)
- **Server:** Node API (NestJS or Fastify) + PostgreSQL + ORM (Prisma/Drizzle recommended)
- **Payments:** Stripe Checkout + webhooks

Details: `.planning/research/STACK.md`
<!-- gsd-stack-end -->

<!-- gsd-conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet centralized. Follow Angular style guide and existing `src/` patterns until a conventions doc is added.
<!-- gsd-conventions-end -->

<!-- gsd-architecture-start source:.planning/research/ARCHITECTURE.md -->
## Architecture

Server-authoritative bookings and slots; Stripe webhooks finalize payment state. Diagram and flow: `.planning/research/ARCHITECTURE.md`
<!-- gsd-architecture-end -->

<!-- gsd-skills-start source:skills/ -->
## Project Skills

| Skill | Description | Path |
| ----- | ----------- | ---- |
| *(GSD skills excluded from project index)* | | |
<!-- gsd-skills-end -->

<!-- gsd-workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using file-changing tools for feature work, drive work through GSD so `.planning/` stays the source of truth.

Entry points:

- `/gsd-discuss-phase 1` — clarify Phase 1 before planning
- `/gsd-plan-phase 1` — produce `PLAN.md` for Phase 1
- `/gsd-execute-phase` — run approved plans

Do not expand product scope in code without updating `REQUIREMENTS.md` / `ROADMAP.md` first unless the user explicitly asks for a bypass.
<!-- gsd-workflow-end -->

<!-- gsd-profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` — do not edit manually.
<!-- gsd-profile-end -->
