# Phase 4: Payments & confirmation - Context

**Gathered:** 2026-04-24  
**Status:** Ready for planning

<domain>
## Phase Boundary

Take an existing **awaiting_payment** booking and let the user pay via Stripe Checkout.
Stripe webhooks then transition the booking to **confirmed** and consume the slot so it no longer appears in availability.

Out of scope: notifications/email (Phase 5), admin payment tooling, multi-tenant payouts (v2), alternative payment providers.

</domain>

<decisions>
## Implementation Decisions

### Checkout style (v1)

- **D-01:** Use **Stripe Checkout redirect (hosted page)** for payment UI (not an embedded payment form).
- **D-02:** Enable **card payments only** for v1.

### Checkout session creation contract

- **D-03:** Create the Checkout Session when the user taps **“Pay now”** from the existing “Booking reserved / awaiting payment” screen (i.e., after booking creation).
- **D-04:** Enforce **one active session per booking** (recreate a session only if it expires/cancels, rather than new session per click).
- **D-05:** Attach **`bookingId` only** as Stripe metadata for webhook correlation.
- **D-06:** Compute the amount **from the database service price at checkout time** (backend authoritative).

### Webhook + booking confirmation

- **D-07:** Confirm bookings on Stripe **`checkout.session.completed`**.
- **D-08:** If checkout is cancelled, keep the booking **`awaiting_payment` until TTL expiry** (do not auto-cancel immediately on return).
- **D-09:** Enforce webhook idempotency by **persisting Stripe `event.id`** in the database and ignoring duplicates.
- **D-10:** On confirmation, mark the slot as consumed by setting:
  - `slot.confirmedBookingId = booking.id`
  - clear `slot.reservedBookingId` and `slot.reservedUntilUtc`

### Return UX

- **D-11:** After successful return, show a **dedicated booking success screen** aligned to `src/design/booking_success/code.html`, showing “Confirmed” booking details.
- **D-12:** If user returns before the webhook updates the booking, show **“Payment received — confirming…”** and **poll booking status briefly**, then fall back to guidance to check later.
- **D-13:** On cancellation return, route back to the booking (still `awaiting_payment`) with a clear **“Try again”** CTA.

### Carry-forward constraints (must remain compatible)

- **D-14:** Auth/session stays cookie-based (httpOnly refresh strategy). API calls remain compatible with `withCredentials: true` + refresh-on-401 pattern.
- **D-15:** UI stays Ionic/Angular and follows `DESIGN.md` (“no-line rule”, tonal layering).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope / acceptance
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, and plans (04-01 … 04-03).
- `.planning/REQUIREMENTS.md` — PAY-01…PAY-04 and BKG-04 acceptance criteria.
- `.planning/PROJECT.md` — core value and constraints (boring/debuggable stack; payments/PII care).

### Design contract (source of truth for look/feel)
- `DESIGN.md` — “Kinetic Gallery” rules (no borders; tonal layering; glass/gradient).
- `src/design/booking_summary/code.html` — booking summary layout direction (Phase 3 review; Phase 4 pay entry).
- `src/design/booking_success/code.html` — booking success screen direction (Phase 4+).

### Existing implementation context (Phase 3)
- `.planning/phases/03-slots-booking-pre-payment/03-CONTEXT.md` — booking holds, statuses, slotId contract.
- `.planning/phases/03-slots-booking-pre-payment/03-UI-SPEC.md` — booking flow route contract (`/book?...`) and created/awaiting-payment UX baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Backend booking creation + slot reservation pattern already exists in `backend/src/bookings/bookings.service.ts` (transaction + concurrency guard).
- Frontend booking flow shell already renders **Awaiting payment** created state in `src/app/pages/book-placeholder/book-placeholder.page.html` (to be extended for Phase 4 payment entry + return UX).

### Established Patterns
- NestJS + Prisma transaction-based domain updates.
- Cookie-based auth and Angular `HttpClient` patterns for API calls.

### Integration Points
- Add backend endpoints for: creating Checkout Session for an `awaiting_payment` booking, and a Stripe webhook endpoint (signature verification + idempotent DB updates).
- Update the booking UI flow to offer “Pay now”, handle return states, and show success screen.

</code_context>

<specifics>
## Specific Ideas

- Card-only payments to keep v1 minimal.
- Treat “cancel” return as a recoverable state (retry payment) until booking TTL expires.
- Handle webhook/return race explicitly with a short polling “confirming…” state.

</specifics>

<deferred>
## Deferred Ideas

- Notifications/email confirmations — Phase 5.
- Stripe Connect / payouts — v2.

</deferred>

---

*Phase: 04-payments-confirmation*  
*Context gathered: 2026-04-24*

