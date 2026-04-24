# Phase 4: Payments & confirmation - Research

**Researched:** 2026-04-24  
**Domain:** Stripe Checkout + webhook-driven booking confirmation (NestJS + Prisma + Postgres + Ionic/Angular)  
**Confidence:** MEDIUM

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Checkout style (v1)

- **D-01:** Use **Stripe Checkout redirect (hosted page)** for payment UI (not an embedded payment form).
- **D-02:** Enable **card payments only** for v1.

#### Checkout session creation contract

- **D-03:** Create the Checkout Session when the user taps **“Pay now”** from the existing “Booking reserved / awaiting payment” screen (i.e., after booking creation).
- **D-04:** Enforce **one active session per booking** (recreate a session only if it expires/cancels, rather than new session per click).
- **D-05:** Attach **`bookingId` only** as Stripe metadata for webhook correlation.
- **D-06:** Compute the amount **from the database service price at checkout time** (backend authoritative).

#### Webhook + booking confirmation

- **D-07:** Confirm bookings on Stripe **`checkout.session.completed`**.
- **D-08:** If checkout is cancelled, keep the booking **`awaiting_payment` until TTL expiry** (do not auto-cancel immediately on return).
- **D-09:** Enforce webhook idempotency by **persisting Stripe `event.id`** in the database and ignoring duplicates.
- **D-10:** On confirmation, mark the slot as consumed by setting:
  - `slot.confirmedBookingId = booking.id`
  - clear `slot.reservedBookingId` and `slot.reservedUntilUtc`

#### Return UX

- **D-11:** After successful return, show a **dedicated booking success screen** aligned to `src/design/booking_success/code.html`, showing “Confirmed” booking details.
- **D-12:** If user returns before the webhook updates the booking, show **“Payment received — confirming…”** and **poll booking status briefly**, then fall back to guidance to check later.
- **D-13:** On cancellation return, route back to the booking (still `awaiting_payment`) with a clear **“Try again”** CTA.

#### Carry-forward constraints (must remain compatible)

- **D-14:** Auth/session stays cookie-based (httpOnly refresh strategy). API calls remain compatible with `withCredentials: true` + refresh-on-401 pattern.
- **D-15:** UI stays Ionic/Angular and follows `DESIGN.md` (“no-line rule”, tonal layering).

### Claude's Discretion

*(None explicitly requested in `04-CONTEXT.md`.)*

### Deferred Ideas (OUT OF SCOPE)

- Notifications/email confirmations — Phase 5.
- Stripe Connect / payouts — v2.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | User can pay for an awaiting-payment booking through a supported provider (Stripe recommended) | Stripe Checkout Session creation endpoint pattern + backend-authoritative pricing + one-session-per-booking storage model. |
| PAY-02 | User is returned to the app with clear success or cancellation outcome after checkout | Stripe `success_url` / `cancel_url` return flow + UI-SPEC return UX (polling + retry). |
| PAY-03 | Backend processes payment provider webhooks and updates booking payment state | Stripe webhook signature verification + `checkout.session.completed` handler that confirms booking and consumes slot. |
| PAY-04 | Webhook handling is idempotent (safe on duplicate delivery) | Persist Stripe `event.id` (unique) and ignore duplicates; DB transaction to ensure slot/booking transition is atomic. |
| BKG-04 | After successful payment, booking becomes confirmed and the slot is no longer offered | Slot consumption fields already exist (`confirmedBookingId`, `reservedBookingId`, `reservedUntilUtc`); availability query already filters on these. |

## Summary

Phase 4 is a **backend-driven Stripe Checkout flow**: the app starts checkout from an existing `awaiting_payment` booking, and Stripe webhooks are the source of truth for confirmation. The critical planning risk is **race + replay**: return URLs are not proof of payment and webhooks can arrive multiple times, so the plan must enforce **signature verification**, **idempotency by `event.id`**, and **atomic DB transitions** that consume the slot exactly once. [VERIFIED: codebase] [CITED: https://docs.stripe.com/webhooks/signature?lang=node]

The codebase already has the right primitives for slot holds and consumption: `BookingsService.createBooking()` reserves a slot by setting `slot.reservedBookingId` + `slot.reservedUntilUtc`, and availability filters exclude `confirmedBookingId != null` and active reservations. Phase 4 should reuse this model and extend it by persisting Stripe identifiers (at least the Checkout Session id and processed webhook event ids). [VERIFIED: codebase]

**Primary recommendation:** Implement a `POST /bookings/:id/checkout-session` that (re)creates Stripe Checkout Sessions with `metadata.bookingId`, store `stripeCheckoutSessionId` on the booking, and add a `POST /stripe/webhook` endpoint that verifies signatures using the **raw request body**, persists `event.id` for idempotency, and in one DB transaction confirms booking + consumes slot. [VERIFIED: codebase] [CITED: https://docs.stripe.com/webhooks/signature?lang=node]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Create / reuse Stripe Checkout Session for a booking | API / Backend | Browser / Client | Price and booking state are server-authoritative; client just initiates and redirects. [VERIFIED: codebase] |
| Hosted payment UI | Stripe | Browser / Client | Checkout is hosted; app only redirects. [ASSUMED] |
| Webhook signature verification | API / Backend | — | Must use server secret + raw body to verify authenticity. [CITED: https://docs.stripe.com/webhooks/signature?lang=node] |
| Webhook idempotency (event replay) | Database / Storage | API / Backend | Durable `event.id` persistence is required to safely ignore duplicates. [ASSUMED] |
| Booking confirmation state transition | API / Backend | Database / Storage | Confirm booking and consume slot in a single transaction. [VERIFIED: codebase] |
| Slot consumption & availability removal | Database / Storage | API / Backend | Availability already filters on `confirmedBookingId` and reservation TTL. [VERIFIED: codebase] |
| Return UX (success pending / confirmed / cancelled) | Browser / Client | API / Backend | Return view polls booking status; backend remains authoritative. [VERIFIED: codebase] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` | 22.1.0 (published 2026-04-24) | Create Checkout Sessions; verify webhook signatures | Official Stripe Node SDK; includes `webhooks.constructEvent(...)`. [VERIFIED: npm registry] [CITED: https://docs.stripe.com/webhooks/signature?lang=node] |
| NestJS (Express platform) | `@nestjs/*` ^11 | API framework | Already in use; Stripe raw-body guidance aligns to Express middleware realities. [VERIFIED: codebase] [CITED: https://docs.nestjs.com/faq/raw-body] |
| Prisma + PostgreSQL | `@prisma/client` ^6 | Persist booking + slot + processed webhook events | Already in use; transactional updates are already established in booking creation. [VERIFIED: codebase] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@nestjs/config` | ^4 | Stripe secrets + base URL config | Needed for `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and return URL base. [VERIFIED: codebase] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw-body capture via Nest `rawBody: true` | Express `raw({ type: 'application/json' })` just for the webhook route | Nest built-in raw body support is documented and cleaner; route-scoped `express.raw` can be a fallback if global parser config conflicts. [CITED: https://docs.nestjs.com/faq/raw-body] [CITED: https://raw.githubusercontent.com/stripe/stripe-node/master/examples/webhook-signing/express/main.ts] |

**Installation:**

```bash
cd backend
npm install stripe
```

## Architecture Patterns

### System Architecture Diagram

```mermaid
flowchart LR
  subgraph Client[Ionic/Angular]
    A[Awaiting payment screen\nPay now button]
    R[Return screen\nsuccess/cancel]
    P[Poll booking status]
    S[Success screen\nBooking confirmed]
  end

  subgraph API[NestJS API]
    CS[Create/reuse Checkout Session\n(backend price calc)]
    WH[Stripe webhook endpoint\nraw body + signature verify]
    BK[Booking/Slot domain\nPrisma transaction]
  end

  subgraph Stripe[Stripe]
    CO[Hosted Checkout]
    EV[Event delivery\ncheckout.session.completed]
  end

  subgraph DB[(PostgreSQL)]
    B[(Booking)]
    SL[(Slot)]
    WE[(ProcessedWebhookEvent)]
  end

  A -->|POST create session| CS
  CS -->|creates session| Stripe
  Stripe --> CO
  CO -->|redirect success/cancel| R
  R -->|GET booking| P
  P -->|GET booking status| API
  Stripe -->|POST webhook| WH
  WH -->|verify + idempotent| BK
  BK --> DB
  DB -->|booking confirmed| P
  P --> S
```

### Recommended Project Structure

```txt
backend/src/
├── payments/                  # Stripe client + session creation + webhook handler
│   ├── payments.module.ts
│   ├── payments.controller.ts # create session endpoint (auth)
│   ├── webhook.controller.ts  # webhook endpoint (no auth; signature-verified)
│   ├── stripe.client.ts       # Stripe SDK init (secret key)
│   └── payments.service.ts    # domain logic (confirm booking, idempotency)
├── bookings/                  # existing; extend with read endpoints for polling
└── prisma/
```

### Pattern 1: “Return is not confirmation” (webhook-authoritative)

**What:** Treat `success_url` return as “payment initiated/likely completed”, but confirm only when webhook transitions booking state.  
**When to use:** Always for Stripe Checkout flows where webhook is the canonical event.  
**Example:** Implement a “confirming…” return screen that polls booking status briefly. [VERIFIED: phase docs]

### Pattern 2: Webhook verification requires raw body

**What:** Verify Stripe webhook signatures with `Stripe-Signature` header + `constructEvent(...)` using the *unmodified raw request body*.  
**When to use:** For all Stripe webhook endpoints.  
**Example:**

```typescript
// Source: https://docs.stripe.com/webhooks/signature?lang=node
// Source: https://raw.githubusercontent.com/stripe/stripe-node/master/examples/webhook-signing/express/main.ts
const sig = req.headers['stripe-signature'];
event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
```

### Pattern 3: DB transaction for “confirm booking + consume slot”

**What:** In one Prisma transaction, (a) mark booking confirmed, (b) set `slot.confirmedBookingId`, and (c) clear reservation fields.  
**When to use:** In the `checkout.session.completed` webhook handler.  
**Evidence:** Booking creation already uses `prisma.$transaction` + `slot.updateMany` concurrency guard. [VERIFIED: codebase]

### Anti-Patterns to Avoid

- **Trusting return URLs as payment proof:** Success return can race the webhook; never flip booking to confirmed on return alone. [VERIFIED: phase docs]
- **Parsing JSON before verifying webhook signature:** Any mutation of request body can break signature verification. [CITED: https://docs.stripe.com/webhooks/signature?lang=node]
- **Non-atomic confirmation:** Updating booking and slot separately risks “money taken, slot not consumed” or “slot consumed, booking not confirmed” on partial failure. [ASSUMED]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC validation | Stripe SDK `webhooks.constructEvent(...)` | Stripe requires raw-body signature validation with their scheme. [CITED: https://docs.stripe.com/webhooks/signature?lang=node] |
| Payment UI | Custom card form | Stripe Checkout hosted redirect | Reduces PCI surface and UI complexity in v1; aligns with D-01. [ASSUMED] |

## Runtime State Inventory

Omitted (not a rename/refactor/migration phase).

## Common Pitfalls

### Pitfall: Signature verification fails intermittently

**What goes wrong:** Webhook handler sees `Webhook signature verification failed` or “payload must be provided as a string or Buffer” errors.  
**Why it happens:** Framework body parser consumes/mutates the request stream before Stripe verification.  
**How to avoid:** Ensure raw body is available for the webhook route (Nest `rawBody: true` and avoid overriding parsers, or route-scope raw parser). [CITED: https://docs.stripe.com/webhooks/signature?lang=node] [CITED: https://docs.nestjs.com/faq/raw-body]  
**Warning signs:** `req.rawBody` is undefined in Nest, or `req.body` is a parsed object. [CITED: https://docs.nestjs.com/faq/raw-body]

### Pitfall: Duplicate webhook deliveries corrupt booking state

**What goes wrong:** Booking flips multiple times, slot fields overwritten, or errors on unique constraints.  
**Why it happens:** Stripe retries events; duplicates are normal.  
**How to avoid:** Persist `event.id` with a unique constraint and short-circuit if already processed (D-09). [ASSUMED]

### Pitfall: Price mismatch / trust boundary violation

**What goes wrong:** Client influences amount; attackers pay less.  
**Why it happens:** Amount computed on client or derived from untrusted input.  
**How to avoid:** Calculate `unit_amount` from `Service.priceCents` in the DB at session creation time (D-06). [VERIFIED: codebase]

## Environment Availability

Step 2.6: SKIPPED (no external tools required beyond Node/npm; Stripe CLI optional for local webhook testing). [ASSUMED]

## Validation Architecture

Nyquist validation is enabled in `.planning/config.json`. [VERIFIED: codebase]

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Frontend: Karma/Jasmine (`ng test`) present; Backend: **no test runner configured** in `backend/package.json`. [VERIFIED: codebase] |
| Config file | Frontend: Angular default (`tsconfig.spec.json`); Backend: none. [VERIFIED: codebase] |
| Quick run command | Frontend: `npm test` (root). [VERIFIED: codebase] |
| Full suite command | Frontend: `npm test`; Backend: (add later). [ASSUMED] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| PAY-01 | “Pay now” creates/reuses Checkout Session for an awaiting-payment booking | integration | *(Wave 0: add backend test runner)* | ❌ |
| PAY-02 | Return screen renders success/cancel and polls status | unit (frontend) | `npm test` | ✅ (test infra exists; needs new tests) |
| PAY-03 | `checkout.session.completed` webhook confirms booking + consumes slot | integration | *(Wave 0: add backend test runner)* | ❌ |
| PAY-04 | Duplicate webhook event id is ignored | integration | *(Wave 0: add backend test runner)* | ❌ |
| BKG-04 | Confirmed booking removes slot from availability query | integration | *(Wave 0: add backend test runner)* | ❌ |

### Wave 0 Gaps

- [ ] Backend test harness (recommended: Nest’s Jest + Supertest) to validate webhook idempotency and atomic slot consumption. [ASSUMED]
- [ ] Add a small set of “payments” integration tests that run against an in-memory/test DB or a test Postgres container. [ASSUMED]

## Security Domain

Security enforcement is enabled at ASVS level 1 in `.planning/config.json`. [VERIFIED: codebase]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Protect session-creation endpoints with existing JWT access guard; webhook is not user-authenticated. [VERIFIED: codebase] |
| V3 Session Management | yes | Maintain existing cookie-based auth compatibility (D-14). [VERIFIED: phase docs] |
| V4 Access Control | yes | Webhook endpoint should be “public” but gated by Stripe signature verification, not by auth cookies. [CITED: https://docs.stripe.com/webhooks/signature?lang=node] |
| V5 Input Validation | yes | Validate bookingId route params and state (`awaiting_payment`) before creating sessions; validate metadata `bookingId` exists in webhook. [ASSUMED] |
| V6 Cryptography | yes | Use Stripe’s signature verification (`constructEvent`) rather than hand-rolled HMAC logic. [CITED: https://docs.stripe.com/webhooks/signature?lang=node] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fake webhook calls | Spoofing | Verify `Stripe-Signature` with raw body and endpoint secret. [CITED: https://docs.stripe.com/webhooks/signature?lang=node] |
| Webhook replay | Repudiation / Tampering | Idempotency keyed by `event.id` (persist + unique). [ASSUMED] |
| Price tampering | Tampering | Compute amount from DB service price (D-06). [VERIFIED: phase docs] |
| PII leakage in logs | Information Disclosure | Do not log full webhook payloads; never put sensitive data in Stripe metadata. [CITED: https://docs.stripe.com/metadata] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Stripe Checkout redirect reduces PCI surface enough for v1 and is acceptable without additional compliance work | Don’t Hand-Roll | Might require additional compliance steps or constraints in deployment. |
| A2 | A new DB table/model will be added for processed Stripe webhook `event.id` with a unique constraint | Pitfalls / Idempotency | If not added, idempotency must be enforced another way; duplicate events could corrupt state. |
| A3 | Backend test runner will be added (Jest/Supertest) to support Nyquist validation for payment/webhook behavior | Validation Architecture | Without it, PAY-03/04/BKG-04 verification becomes mostly manual and brittle. |

## Open Questions (RESOLVED)

1. **Where will the app host the Stripe return URLs (domain/path)?**
   - **Resolution (route contract):** Use a single Angular route:
     - `GET {PUBLIC_APP_URL}/pay/return?bookingId={bookingId}&result={success|cancel}`
   - **Resolution (environment base):** Backend builds `success_url`/`cancel_url` using `PUBLIC_APP_URL` (dev: `http://localhost:8100` by default; staging/prod via env).
   - **Notes:** Return routes are **UX only**; they never confirm bookings (webhook-authoritative per D-07/D-12). [VERIFIED: phase docs]

2. **What booking “read” endpoint exists for polling?**
   - **Resolution (endpoint):** Phase 4 Plan 03 adds `GET /bookings/:id` (user-scoped) for polling the booking status during the “Confirming…” return state.
   - **Resolution (authz):** Endpoint must be guarded with the existing auth guard and return 404/403 for non-owner access.
   - **Minimum response fields for UI:** `id`, `status`, `expiresAtUtc`, and identifiers needed to render the success screen details (slot/service/fighter ids as already used in the app).

## Sources

### Primary (HIGH confidence)

- Stripe webhook signature verification docs. [CITED: https://docs.stripe.com/webhooks/signature?lang=node]
- NestJS raw body docs. [CITED: https://docs.nestjs.com/faq/raw-body]
- Stripe metadata docs (sensitive data guidance + webhook includes object metadata). [CITED: https://docs.stripe.com/metadata]
- stripe-node official example showing `express.raw({ type: 'application/json' })` for webhook route. [CITED: https://raw.githubusercontent.com/stripe/stripe-node/master/examples/webhook-signing/express/main.ts]
- Codebase evidence:
  - Slot/booking reservation pattern and status `awaiting_payment`. [VERIFIED: codebase]
  - Slot fields `reservedUntilUtc`, `reservedBookingId`, `confirmedBookingId` and availability filtering. [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- Stripe API reference for creating Checkout Sessions (used to confirm parameter presence like `metadata`, `success_url`, `cancel_url`, `line_items`). [CITED: https://docs.stripe.com/api/checkout/sessions/create?api-version=2026-03-25.dahlia]

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — Stripe SDK version verified via npm; Stripe/Nest official docs cited. [VERIFIED: npm registry]
- Architecture: **MEDIUM** — codebase patterns verified; payment-specific DB model changes still to be planned. [VERIFIED: codebase]
- Pitfalls: **HIGH** for raw body + signature verification; **MEDIUM** for idempotency storage details (implementation-specific). [CITED: https://docs.stripe.com/webhooks/signature?lang=node]

**Research date:** 2026-04-24  
**Valid until:** 2026-05-24 (re-check Stripe API version + SDK release cadence)

