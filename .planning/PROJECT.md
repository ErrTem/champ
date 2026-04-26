# Champ — Fighter Session Booking

## What This Is

A web app where fans book **exclusive training sessions and consultations** with famous fighters: browse a catalog, open a fighter profile, pick a service (training 1/2/3 hours or online/offline consultation), choose an available time, pay, and receive confirmation. A **backend** owns fighters, services, slot availability, bookings, users, and payments; a **simple admin** (desirable for v1) manages fighters, prices, and schedules.

## Core Value

A customer can **complete one real booking** (fighter → service → slot → pay → confirmed) without manual back-office intervention.

## Requirements

### Validated

- ✓ Ionic + Angular application shell with routing and home page — existing repo (`ionic-app-base` scaffold)

### Active

- [ ] **Milestone v1.1 (Milestone 2)**: close deferred v1 verification gaps (Phase 01 auth UAT; Phase 03 booking/concurrency/timezone UAT)
- [ ] Milestone v1.1: fix requirements bookkeeping (create/restore `REQUIREMENTS.md` with traceability statuses)
- [ ] Milestone v1.1: UX/navigation cleanup (remove Home, `/explore` default, wildcard redirect, back button, footer nav)
- [ ] Milestone v1.1: registration upgrades (Google/Apple OAuth, phone mask, terms + 18+ checkboxes, fighter-vs-user role, fighter pending approval)
- [ ] Milestone v1.1: booking UX + rules (explore filters; booking calendar layout; enforce 24h rule server-side + UI errors)
- [ ] Milestone v1.1: gyms domain + multi-timezone policy (gym address + maps; fighters tied to gym timezone)
- [ ] Milestone v1.1: fighter self-serve (manage schedule/services; cancel bookings; ownership checks)
- [ ] Milestone v1.1: notifications + calendar sync (reminders, fighter booking notifications, calendar export/integration)
- [ ] Milestone v1.1: social sharing + social links on fighter profile

### Out of Scope

- **Native mobile apps** — web-first; responsive Ionic UI is enough for v1
- **Multi-tenant marketplace payouts** — unless explicitly needed later; prefer a single operator + Stripe (or similar) for v1
- **Real-time chat / negotiation** between fan and fighter — async notifications only
- **Complex recurring subscriptions** — one-off session purchases unless requirements expand

## Context

- **Brownfield repo:** Angular 20 + Ionic 8 starter (`ionic-app-base`). Product features are largely **greenfield** on top of this shell.
- **Core domain chain:** fighter → service → time slot → booking → payment.
- **Services mentioned:** 1h / 2h / 3h training; online or offline consultation (pricing and rules per fighter).
- **Admin:** desirable in v1 for operational reality (price/schedule changes without deploys).

## Current State

Shipped **v1.0 MVP** (phases 1–6) on 2026-04-25. Archive: `.planning/milestones/v1.0-ROADMAP.md`.

Known gaps at close (accepted as tech debt): `.planning/v1.0-MILESTONE-AUDIT.md` + `STATE.md` Deferred Items.

## Constraints

- **Backend required:** v1 is not “static brochure”; persistence and authoritative slot/booking state live server-side.
- **Compliance surface:** payments and PII imply careful handling of secrets, logs, and retention (see research PITFALLS).
- **Simplicity:** favor a boring, debuggable stack over premature microservices.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web-first on existing Ionic/Angular | Repo already scaffolded; fastest path to shipped UI | — Pending |
| Backend owns slot generation and booking holds | Prevents double-booking and race issues | — Pending |
| Admin panel in v1 if feasible | Schedules/prices change often in this domain | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. “What This Is” still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-26 starting v1.1 (Milestone 2)*
