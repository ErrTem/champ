# Phase 05: My bookings & notifications - Research

**Researched:** 2026-04-24  
**Domain:** My bookings (Angular/Ionic UI) + booking status notifications (NestJS backend)  
**Confidence:** MEDIUM

## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### My bookings list UX (MBB-01)

- **D-01:** Use **2 tabs**: **Upcoming** and **Past**.
- **D-02:** Per row shows **fighter name**, **service title**, **local date/time**, and a **status chip**.
- **D-03:** Sorting defaults:
  - Upcoming: **soonest-first**
  - Past: **newest-first**
- **D-04:** Empty state includes a friendly message + CTA to **Explore fighters**.

### Booking detail UX (MBB-02)

- **D-05:** Detail shows all key fields: **fighter**, **service**, **local time**, **status**, **payment state**, **price**.
- **D-06:** Time display follows Phase 3 policy: show **Pacific Time local time only**, **no timezone label**.
- **D-07:** If booking is `awaiting_payment`, primary CTA is **Pay now** (no cancel action added in Phase 5).
- **D-08:** For terminal statuses (past/confirmed/expired), show **no additional actions**.

### Notifications delivery (NOT-01, NOT-02)

- **D-09:** Phase 5 uses **dev-only email equivalent**: log outbound email payload/link in backend logs, with clear swap path to real provider later.
- **D-10:** Sender identity: **noreply@…**
- **D-11:** Email includes deep link to **booking detail** in the app.
- **D-12:** Email tone: **minimal transactional**.

### Notification events (NOT-01, NOT-02)

- **D-13:** Send notification when booking becomes **confirmed** (Stripe webhook path).
- **D-14:** Treat **awaiting-payment hold expiry** as “cancellation-like” event for v1 notification purposes.
- **D-15:** Do **not** send email on booking creation (awaiting payment).
- **D-16:** Do **not** send email on payment-cancel return from Stripe.

### Carry-forward constraints (must remain compatible)

- **D-17:** Ionic/Angular UI + existing design rules (no Tailwind in app code; keep tonal layering / no 1px borders per `DESIGN.md`).
- **D-18:** Cookie-based auth persists (`withCredentials: true` + refresh-on-401 interceptor pattern).
- **D-19:** Timezone policy remains **America/Los_Angeles display**, **UTC storage**.

### Claude's Discretion

*(none specified in Phase 05 context)*

### Deferred Ideas (OUT OF SCOPE)

- True booking cancellation action (user-initiated or admin-initiated) — separate capability; plan in a future phase if needed.
- Real email provider integration (Resend/SendGrid/SES) — future phase; Phase 5 logs are the swap point.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MBB-01 | User can list their own upcoming and past bookings | Backend: add list endpoint scoped to user; Frontend: new “My bookings” page w/ 2 tabs + sort + states. |
| MBB-02 | User can open booking detail with fighter, service, time, status | Backend: enrich booking DTO w/ fighter/service/price/payment state; Frontend: booking detail page + deep link target. |
| NOT-01 | User receives confirmation when booking becomes confirmed (email minimum) | Backend: hook after Stripe webhook confirms booking; dev-only email logger service uses `PUBLIC_APP_URL` deep link. |
| NOT-02 | User receives notification on material status change (e.g. cancellation) when applicable | Backend: implement “hold expired” transition from `awaiting_payment` → `expired` and emit notification once. |

## Project Constraints (from `.cursor/rules/`)

- **C-01:** Communicate terse (“caveman mode”) in chat only; code/commits normal. `[VERIFIED: codebase .cursor/rules/caveman.mdc]`
- **C-02:** Follow existing Angular/Ionic patterns; no conventions doc yet, so mirror `src/` patterns. `[VERIFIED: codebase .cursor/rules/gsd-project-context.md]`
- **C-03:** Do not expand product scope in code without updating `REQUIREMENTS.md` / `ROADMAP.md` unless explicit bypass. `[VERIFIED: codebase .cursor/rules/gsd-project-context.md]`

## Summary

Phase 05 needs 2 deliverables: authenticated “My bookings” UX (list + detail) and backend notification emission on 2 state transitions (confirmed via Stripe webhook, and hold expiry treated as cancellation-like). Existing backend already supports `GET /bookings/:id` scoped to user and confirms bookings in Stripe webhook processing; frontend already has `BookingService.getBooking()` and “Go to My bookings” CTAs (currently routed to `/profile`).

Main planning risk: **hold expiry currently only releases slot availability** via `reservedUntilUtc < now` filter; booking rows themselves never transition to `expired`, so there is no stable place to trigger NOT-02 today. Plan must introduce a **single, idempotent expiration pathway** that updates booking status + releases reservations (if still held) + emits dev-email log once.

**Primary recommendation:** implement a backend “expire stale awaiting_payment bookings” routine, called from the new list endpoint (and optionally from get-by-id) before returning data, so UI always sees consistent statuses and NOT-02 fires without adding cron infra. `[ASSUMED]` (no existing background scheduler found)

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| List my bookings (upcoming/past) | API / Backend | Client | Backend enforces user scoping + sorting; client renders tabs/UX. |
| Booking detail data (fighter/service/price/payment state) | API / Backend | Client | Backend authoritative joins; client displays per UI contract. |
| Confirmed notification | API / Backend | — | Confirmation occurs in backend webhook; trigger belongs there. |
| Hold-expiry notification | API / Backend | — | Only backend can safely transition state and avoid duplicate emits. |
| Deep link routing to booking detail | Client | API / Backend | Client owns route; backend constructs URL using `PUBLIC_APP_URL`. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | `^20.0.0` (app) | Client SPA | Existing app scaffold. `[VERIFIED: codebase package.json]` |
| Ionic | `^8.0.0` (app) | UI components/navigation | Existing app scaffold. `[VERIFIED: codebase package.json]` |
| NestJS | `^11.0.0` (backend) | API framework | Existing backend scaffold. `[VERIFIED: codebase backend/package.json]` |
| Prisma | `^6.0.0` (backend) | DB access | Existing backend scaffold. `[VERIFIED: codebase backend/package.json]` |
| Stripe SDK | `^18.4.0` (backend) | Checkout + webhooks | Existing payments integration. `[VERIFIED: codebase backend/package.json]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Luxon | `^3.7.2` (backend) | Timezone-safe date ops | Availability/time formatting helpers. `[VERIFIED: codebase backend/package.json]` |
| Nest `Logger` | built-in | Dev-email equivalent logging | Use for NOT-01/02 log output. `[VERIFIED: codebase backend/src/auth/auth.service.ts]` |

**Version verification (npm registry):**
- `stripe` latest `22.1.0`. `[VERIFIED: npm registry]`
- `luxon` latest `3.7.2`. `[VERIFIED: npm registry]`
- `@nestjs/common` latest `11.1.19`. `[VERIFIED: npm registry]`
- `@ionic/angular` latest `8.8.4`. `[VERIFIED: npm registry]`

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dev-email log only (D-09) | Resend/SendGrid/SES | Real delivery adds provider creds, templates, bounce handling; explicitly deferred. `[VERIFIED: Phase 05 context D-09 + deferred]` |
| On-demand expiry via endpoint call | Background scheduler/cron | Cron more “real”, but adds infra + local dev complexity; on-demand works for v1 if list/get is visited. `[ASSUMED]` |

## Architecture Patterns

### System Architecture Diagram

```mermaid
flowchart LR
  U[Signed-in user] -->|navigates| UI[Angular/Ionic: My bookings UI]
  UI -->|GET /bookings (withCredentials)| API[NestJS API]
  UI -->|GET /bookings/:id| API

  API -->|before responding| EXP[Expire stale holds\n(awaiting_payment -> expired)]
  EXP --> DB[(Postgres via Prisma)]
  API --> DB
  API -->|returns enriched DTOs| UI

  Stripe[Stripe webhook] -->|POST /stripe/webhook| API
  API -->|processStripeEvent| PAY[PaymentsService]
  PAY -->|confirm booking + consume slot| DB
  PAY -->|emit dev-email log| NOTIF[Notification logger]

  EXP -->|emit dev-email log| NOTIF
  NOTIF --> LOGS[Backend logs]
```

### Recommended Project Structure

Backend (Nest):
- `backend/src/bookings/` add list endpoint + DTO(s)
- `backend/src/notifications/` new module/service for dev-email equivalent (or colocate under `auth` precedent)
- `backend/src/payments/` call notifications after confirm transition

Frontend (Angular/Ionic):
- `src/app/pages/my-bookings/` list page (tabs, skeleton, empty/error)
- `src/app/pages/booking-detail/` detail page (fields + Pay now CTA)
- `src/app/core/services/booking.service.ts` extend with `listMyBookings()` + update `Booking` model shape
- `src/app/app.routes.ts` add routes + update legacy `/profile` CTAs or add alias route

### Pattern 1: User-scoped backend reads
**What:** Always scope booking reads by authenticated user id (`req.user.sub`).  
**When to use:** all “My bookings” list + detail endpoints.  
**Example:** `BookingsController.getById()` uses guard + `getBookingForUser({ bookingId, userId })`. `[VERIFIED: codebase backend/src/bookings/bookings.controller.ts]`

### Pattern 2: Idempotent Stripe webhook handling
**What:** Persist webhook `event.id` first, then process transition once.  
**When to use:** NOT-01 trigger must align to confirmed transition and stay idempotent.  
**Example:** `PaymentsService.processStripeEvent()` writes `stripeWebhookEvent` and returns on duplicates. `[VERIFIED: codebase backend/src/payments/payments.service.ts]`

### Anti-Patterns to Avoid
- **Unscoped bookings list:** never allow listing bookings by arbitrary userId param; use auth context only. `[VERIFIED: Phase boundary + existing get-by-id scoping]`
- **UI-side timezone labeling:** Phase 05 must show Pacific time **without timezone label**; do not add “PT”/“PST”. `[VERIFIED: Phase 05 decisions D-06]`
- **Sending notification on booking creation:** forbidden by D-15. `[VERIFIED: Phase 05 decisions]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email sending (prod) | Custom SMTP/client | Provider SDK (future phase) | Deliverability, retries, bounces, templates. `[VERIFIED: Phase 05 deferred]` |
| Signature verification | Manual HMAC parsing | Stripe SDK webhook utilities | Easy to get wrong; already used in tests. `[VERIFIED: codebase backend/test/helpers/stripe-webhook.ts]` |

## Common Pitfalls

### Pitfall 1: “Expired” exists only in UI copy, not data
**What goes wrong:** UI shows `awaiting_payment` forever; NOT-02 never fires; list sorting wrong.  
**Why it happens:** booking `status` is free-form string in DB; no process updates it on TTL expiry. `[VERIFIED: codebase prisma schema + bookings.service.ts]`  
**How to avoid:** implement explicit `expired` transition when `expiresAtUtc < now` and booking still `awaiting_payment`; ensure slot reservation cleared if still held.  
**Warning signs:** many rows with `expiresAtUtc` in past and status still `awaiting_payment`.

### Pitfall 2: Duplicate notification logs
**What goes wrong:** multiple emits for same booking transition (multi-call list endpoint, retries).  
**Why it happens:** expiration routine called repeatedly without guarding on “transition happened”.  
**How to avoid:** only emit when status update succeeds (e.g., per-booking conditional update); for confirmed path, emit only when confirm transition actually applied (or when `status` changed). `[ASSUMED]` (needs implementation detail)

## Code Examples

### Dev-only email equivalent logging (precedent)

Backend logs a dev-only reset link:
- `AuthService.forgotPassword()` logs link when `NODE_ENV === 'development'`. `[VERIFIED: codebase backend/src/auth/auth.service.ts]`

### Stripe deep link precedent

Backend already constructs `success_url` + `cancel_url` using `PUBLIC_APP_URL` with bookingId query param. `[VERIFIED: codebase backend/src/payments/payments.service.ts]`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No booking list | “My bookings” w/ tabs + detail deep link | Phase 05 | Users can self-serve status + next actions. |
| Slot holds expire silently | Booking transitions to `expired` w/ notification | Phase 05 | Enables NOT-02 and consistent UI states. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No existing background scheduler/cron infrastructure for booking expiry | Summary / Alternatives | If scheduler exists, better to trigger expiry there for timeliness. |
| A2 | On-demand expiry (called by list/get) acceptable for v1 notifications | Summary | NOT-02 timing depends on user visiting app; could miss “prompt” notification expectation. |

## Open Questions (RESOLVED)

1. **Should “Past” include expired holds?**
   - What we know: need Upcoming/Past tabs; need terminal statuses have no actions; expiry is cancellation-like. `[VERIFIED: Phase 05 context]`
   - What's unclear: sorting/category boundary for `expired` with startsAt in future vs past.
   - Resolution: classify `expired` as Past (terminal), regardless of start time, to avoid “Upcoming but dead” confusion. `[RESOLVED]`

2. **What exact “payment state” field should UI display?**
   - What we know: backend booking has `status` and optional `stripeCheckoutSessionId`. `[VERIFIED: prisma + payments.service.ts]`
   - What's unclear: whether payment state is distinct from booking status in v1.
   - Resolution: derive payment state from booking status (awaiting_payment vs confirmed vs expired) for Phase 05; avoid new schema field. `[RESOLVED]`

## Environment Availability

Step 2.6: SKIPPED (no new external dependencies identified; reuse existing Node/Angular/Nest toolchain). `[VERIFIED: scope + codebase dependencies]`

## Validation Architecture

`workflow.nyquist_validation` enabled. `[VERIFIED: .planning/config.json]`

### Test Framework

| Property | Value |
|----------|-------|
| Backend framework | Jest (Nest e2e-style) |
| Backend config file | `backend/jest.config.ts` |
| Backend quick run command | `cd backend; npm test` |
| Frontend framework | Karma/Jasmine (Angular) |
| Frontend quick run command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MBB-01 | `GET /bookings` returns only user bookings, split/sorted | backend e2e | `cd backend; npm test` | ❌ Wave 0 |
| MBB-02 | `GET /bookings/:id` returns enriched DTO and enforces scoping | backend e2e | `cd backend; npm test` | ❌ Wave 0 |
| NOT-01 | confirmed transition emits dev-email log payload | backend unit/e2e (mock logger) | `cd backend; npm test` | ❌ Wave 0 |
| NOT-02 | expiry transition emits dev-email log payload once | backend unit/e2e | `cd backend; npm test` | ❌ Wave 0 |

### Wave 0 Gaps

- Add backend tests:
  - `backend/test/bookings.list.e2e-spec.ts` — MBB-01
  - `backend/test/bookings.detail.e2e-spec.ts` — MBB-02 (or extend existing get-by-id test if exists later)
  - `backend/test/notifications.e2e-spec.ts` (or unit tests) — NOT-01/02 logging call assertions

## Security Domain

Security enforcement enabled; ASVS L1. `[VERIFIED: .planning/config.json]`

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | `JwtAccessAuthGuard` on bookings endpoints. `[VERIFIED: backend/src/bookings/bookings.controller.ts]` |
| V3 Session Management | yes | Cookie-based tokens + refresh flow (existing). `[VERIFIED: Phase 05 D-18 + backend auth service]` |
| V4 Access Control | yes | User scoping in queries (`where: { userId: req.user.sub }`). `[VERIFIED: backend/src/bookings/bookings.service.ts]` |
| V5 Input Validation | yes | Nest `ValidationPipe` global + DTOs. `[VERIFIED: backend/src/main.ts]` |
| V6 Cryptography | no (new) | Use existing Stripe + JWT; do not add custom crypto. `[VERIFIED: scope]` |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on bookings | Information disclosure | Enforce `userId` scoping server-side for list/detail. |
| Webhook spoofing | Spoofing | Verify Stripe signature + idempotency record. `[VERIFIED: existing tests + PaymentsService]` |
| PII leakage in logs | Information disclosure | Dev-only email logs must avoid secrets; log minimal transactional content. `[ASSUMED]` |

## Sources

### Primary (HIGH confidence)
- Phase context + decisions: `.planning/phases/05-my-bookings-notifications/05-CONTEXT.md`
- UI contract: `.planning/phases/05-my-bookings-notifications/05-UI-SPEC.md`
- Backend booking get-by-id scoping: `backend/src/bookings/bookings.controller.ts`, `backend/src/bookings/bookings.service.ts`
- Stripe confirmation transition + idempotency: `backend/src/payments/payments.service.ts`, `backend/test/payments.webhook.e2e-spec.ts`
- Dev-only log precedent: `backend/src/auth/auth.service.ts`
- DB schema: `backend/prisma/schema.prisma`
- Config (validation/security): `.planning/config.json`
- npm registry version checks: `npm view stripe version`, `npm view luxon version`, `npm view @nestjs/common version`, `npm view @ionic/angular version`

### Secondary (MEDIUM confidence)
- None

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (codebase + npm registry)
- Architecture: MEDIUM (core flows verified; expiry mechanism needs new design)
- Pitfalls: MEDIUM (expiry gap verified; notification duplication avoidance depends on implementation)

**Valid until:** 2026-05-24

