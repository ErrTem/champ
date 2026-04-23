# Champ — Fighter Session Booking

## What This Is

A web app where fans book **exclusive training sessions and consultations** with famous fighters: browse a catalog, open a fighter profile, pick a service (training 1/2/3 hours or online/offline consultation), choose an available time, pay, and receive confirmation. A **backend** owns fighters, services, slot availability, bookings, users, and payments; a **simple admin** (desirable for v1) manages fighters, prices, and schedules.

## Core Value

A customer can **complete one real booking** (fighter → service → slot → pay → confirmed) without manual back-office intervention.

## Requirements

### Validated

- ✓ Ionic + Angular application shell with routing and home page — existing repo (`ionic-app-base` scaffold)

### Active

- [ ] User can sign up, sign in, and manage a basic profile tied to bookings
- [ ] User can browse fighters and open a profile showing info, services, and prices
- [ ] User can select a service, see a calendar of bookable slots, and create a booking
- [ ] User can pay for a booking and receive confirmation (email or in-app equivalent)
- [ ] User can view “My bookings” and receive notifications for key booking events
- [ ] Staff can use a minimal admin to manage fighters, prices, and schedules

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
*Last updated: 2026-04-24 after initialization (`/gsd-new-project`; `gsd-sdk` not on PATH — artifacts written locally; commit when ready)*
