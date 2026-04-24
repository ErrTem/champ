# Roadmap: Champ

## Overview

Ship the full **fighter → service → slot → booking → payment → confirmation** loop on top of the existing Ionic/Angular shell: add a real backend and database, expose catalog and booking APIs, integrate Stripe with webhooks, then layer **My bookings**, **notifications**, and a **minimal admin** for fighters, prices, and schedules.

## Phases

- [ ] **Phase 1: Platform & auth** — API foundation, database, user auth and profile (client + server) *(plans implemented 2026-04-24; iOS UAT pending)*
- [ ] **Phase 2: Catalog & fighter profile** — Fighters list, profile pages, services and prices from API *(plans implemented 2026-04-24; verification pending)*
- [ ] **Phase 3: Slots & booking (pre-payment)** — Availability and booking creation with server-side concurrency rules
- [ ] **Phase 4: Payments & confirmation** — Checkout, webhooks, confirmed bookings
- [ ] **Phase 5: My bookings & notifications** — History, detail, email (or equivalent) on key events
- [ ] **Phase 6: Admin** — Staff management of fighters, services/prices, schedules, booking visibility

## Phase Details

### Phase 1: Platform & auth

**Goal:** Users can register, log in, log out, recover password, and maintain a basic profile; backend and DB exist with deployment-ready config stubs.

**Depends on:** Nothing (first phase)

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05

**Success Criteria** (what must be TRUE):

1. A new user can sign up and log in from the Ionic app against the live API.
2. Sessions survive a browser refresh until the user logs out or tokens expire per policy.
3. Password reset flow completes end-to-end in a dev/staging environment.
4. Profile fields used for bookings can be read and updated by the owning user.

**Plans:** 4 plans

Plans:

- [x] 01-01: Backend project scaffold, PostgreSQL schema baseline, health check, env configuration
- [x] 01-02: User model, auth endpoints (signup/login/refresh/logout), password hashing
- [x] 01-03: Password reset tokens + email sender integration (or dev logging with clear swap path)
- [x] 01-04: Ionic screens for auth and profile wired to API with route guards

**UI hint:** yes

---

### Phase 2: Catalog & fighter profile

**Goal:** Users can browse fighters from the backend and view profile details with bookable services and prices.

**Depends on:** Phase 1

**Requirements:** CAT-01, CAT-02, CAT-03, FTR-01, FTR-02, FTR-03

**Success Criteria** (what must be TRUE):

1. Catalog shows all published fighters from the API with image and summary.
2. Tapping a fighter opens a profile with bio and structured service list (duration, modality, price).
3. Selecting a service advances the user toward scheduling (placeholder route acceptable until Phase 3).

**Plans:** 3 plans

Plans:

- [x] 02-01: Fighter and service domain models, public read APIs, seed data script
- [x] 02-02: Ionic catalog and profile pages consuming APIs (loading/error states)
- [x] 02-03: Navigation flow catalog → profile → “Book” entry for chosen service
 

**UI hint:** yes

---

### Phase 3: Slots & booking (pre-payment)

**Goal:** Authenticated users can see real availability and create a booking in an awaiting-payment state without double-booking.

**Depends on:** Phase 2

**Requirements:** CAL-01, CAL-02, CAL-03, BKG-01, BKG-02, BKG-03

**Success Criteria** (what must be TRUE):

1. Calendar or date UI loads slots from an availability API for the selected fighter/service.
2. Concurrent attempts for the same slot cannot both result in confirmed holds (DB or transactional guard).
3. User sees booking in “awaiting payment” (or equivalent) status immediately after creation.

**Plans:** 4 plans

Plans:

- [ ] 03-01: Schedule model and slot generation/query API (timezone rules documented)
- [ ] 03-02: Booking entity, create-booking endpoint, concurrency tests
- [ ] 03-03: Ionic calendar/slot selection UI and booking confirmation step (pre-pay)
- [ ] 03-04: Edge cases: no slots, stale slot selection, friendly errors

**UI hint:** yes

---

### Phase 4: Payments & confirmation

**Goal:** Users pay via Stripe (or chosen provider); webhooks mark bookings confirmed; slots are consumed.

**Depends on:** Phase 3

**Requirements:** PAY-01, PAY-02, PAY-03, PAY-04, BKG-04

**Success Criteria** (what must be TRUE):

1. User can start checkout from an awaiting-payment booking and complete a test payment.
2. Successful webhook transitions booking to confirmed and removes availability for that slot.
3. Duplicate webhook deliveries do not corrupt booking state.

**Plans:** 3 plans

Plans:

- [ ] 04-01: Stripe Checkout/session creation with booking metadata; return URLs
- [ ] 04-02: Webhook endpoint with signature verification and idempotent state updates
- [ ] 04-03: Ionic payment return UX and error/retry paths

**UI hint:** yes

---

### Phase 5: My bookings & notifications

**Goal:** Users see their bookings and receive at least email confirmation and cancellation notices when applicable.

**Depends on:** Phase 4

**Requirements:** MBB-01, MBB-02, NOT-01, NOT-02

**Success Criteria** (what must be TRUE):

1. “My bookings” lists only the signed-in user’s bookings with correct statuses.
2. Detail view shows fighter, service, local time, payment/booking status.
3. On confirmation and cancellation events, user receives email (or documented equivalent).

**Plans:** 3 plans

Plans:

- [ ] 05-01: List and detail booking APIs scoped by user
- [ ] 05-02: Ionic “My bookings” list + detail screens
- [ ] 05-03: Outbound email integration for confirmation and cancellation hooks

**UI hint:** yes

---

### Phase 6: Admin

**Goal:** Staff can manage fighters, services/prices, schedules, and view bookings without code changes.

**Depends on:** Phase 5 (operates on live domain); can start after Phase 4 in parallel if resourcing allows, but **listed after** Phase 5 here to prioritize customer loop first.

**Requirements:** ADM-01, ADM-02, ADM-03, ADM-04, ADM-05

**Success Criteria** (what must be TRUE):

1. Only admin-role users reach admin routes and APIs.
2. CRUD on fighters and services reflects immediately in customer catalog/profile APIs.
3. Schedule changes alter generated slots for future dates without breaking existing confirmed bookings.

**Plans:** 3 plans

Plans:

- [ ] 06-01: Admin role model, authz middleware, admin route shell in Ionic
- [ ] 06-02: Admin CRUD APIs for fighters, services, prices
- [ ] 06-03: Admin schedule management UI + booking read-only list

**UI hint:** yes
