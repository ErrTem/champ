# Phase 5: My bookings & notifications - Context

**Gathered:** 2026-04-24  
**Status:** Ready for planning

<domain>
## Phase Boundary

Signed-in user can view **only their own bookings** via “My bookings” (list + detail), and receives **email (or documented equivalent)** on booking **confirmation** and “cancellation-like” events (hold expiry).

Out of scope: adding a true user/admin “Cancel booking” feature (no new cancellation actions in Phase 5).

</domain>

<decisions>
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope / acceptance

- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, and plan breakdown (05-01 … 05-03).
- `.planning/REQUIREMENTS.md` — MBB-01, MBB-02, NOT-01, NOT-02 acceptance criteria.
- `.planning/PROJECT.md` — product scope + out-of-scope constraints.
- `.planning/phases/03-slots-booking-pre-payment/03-CONTEXT.md` — timezone policy, booking status model baseline.
- `.planning/phases/04-payments-confirmation/04-CONTEXT.md` — confirmation event semantics + return UX notes.

### Design / UI references (reuse where applicable)

- `DESIGN.md` — visual rules (“no-line rule”, tonal layering).
- `src/design/booking_summary/code.html` — booking summary layout cues (may inform booking detail).
- `src/design/booking_success/code.html` — confirmation screen style consistency.

### Existing implementation touchpoints

- `backend/src/bookings/bookings.controller.ts` — authenticated booking access patterns.
- `backend/src/bookings/bookings.service.ts` — booking DTO shape + user scoping for `getBookingForUser`.
- `backend/src/payments/payments.service.ts` — confirmed transition source (Stripe webhook) used as notification trigger.
- `backend/src/auth/auth.service.ts` — precedent for dev-only email equivalent via backend logging (password reset).
- `src/app/core/services/booking.service.ts` — booking fetch client used by payment return + success screens.
- `src/app/pages/payment-return/payment-return.page.ts` — “Check My bookings” copy; deep link behavior expectations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Backend: `GET /bookings/:id` already scoped to authenticated user and returns slot times.
- Frontend: `PaymentReturnPage` + `BookingSuccessPage` already fetch booking details via `BookingService`.
- Auth patterns: cookie sessions + `withCredentials` + refresh-on-401 already established.

### Established Patterns

- Backend: NestJS + Prisma with transactional updates and stable error contracts.
- Frontend: Ionic standalone pages + Angular services for API calls.

### Integration Points

- Backend: add **list bookings for user** endpoint + enrich booking DTO with fighter/service details for list + detail.
- Backend: add **notification hooks** on booking status transitions (confirmed, expired).
- Frontend: add “My bookings” route(s) + UI screens, plus deep link target for emails.

</code_context>

<specifics>
## Specific Ideas

- My bookings list should be fast to scan: compact rows + clear status chips.
- Email should deep-link directly into booking detail when possible.

</specifics>

<deferred>
## Deferred Ideas

- True booking cancellation action (user-initiated or admin-initiated) — separate capability; plan in a future phase if needed.
- Real email provider integration (Resend/SendGrid/SES) — future phase; Phase 5 logs are the swap point.

</deferred>

---

*Phase: 05-my-bookings-notifications*  
*Context gathered: 2026-04-24*
