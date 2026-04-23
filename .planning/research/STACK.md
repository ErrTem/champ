# Research — Stack (Champ)

**Milestone context:** Greenfield product on brownfield Ionic/Angular shell.

## Frontend (existing + extensions)

| Layer | Recommendation | Confidence |
|-------|----------------|------------|
| SPA | **Angular 20 + Ionic 8** (already in repo) | High |
| HTTP / state | Angular `HttpClient`; consider lightweight signals-based stores per feature | Medium |
| Dates | **Luxon** or **date-fns** + explicit timezone rules for slots; avoid naive `Date` parsing across TZ | High |

## Backend (v1)

| Layer | Recommendation | Confidence |
|-------|----------------|------------|
| API | **NestJS** (fits Angular team mental model) *or* **Fastify**/**Express** if minimalism preferred | Medium |
| ORM | **Prisma** or **Drizzle** with PostgreSQL | High |
| DB | **PostgreSQL** — transactional bookings + uniqueness constraints | High |
| Auth | **OIDC-ready JWT** or session cookies; bcrypt/argon2 for passwords; optional magic link later | High |
| Jobs / reminders | **BullMQ** + Redis *or* managed queue (defer if cron-only v1) | Medium |

## Payments

| Choice | When | Notes |
|--------|------|-------|
| **Stripe Checkout** or Payment Element | v1 default | Hosted compliance, webhooks as source of truth for `paid` |
| Connect / Express | v1+ if paying fighters individually | Adds onboarding, KYC, payout timing — scope carefully |

## Admin

- **Same Angular app** with role-guarded routes *or* minimal **Retool**/internal tool for fastest ops — pick based on team skill.

## What NOT to use (v1)

- **Blockchain / crypto payments** — unnecessary complexity.
- **Elasticsearch** for catalog — Postgres `ILIKE` + indexes until scale demands search.

## Version note

Verify current LTS and package majors at implementation time (do not trust training cutoff alone).
