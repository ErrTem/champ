---
phase: 05-my-bookings-notifications
verified: 2026-04-24T15:05:30Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "My bookings UI matches UI-SPEC (tabs, chips, tonal layering, skeleton/error/empty states) and feels scan-friendly"
    expected: "Upcoming/Past tabs render correctly; rows show fighter/service/time/status chip; empty state CTA routes to /explore; no 1px divider lines"
    why_human: "Visual contract (spacing/typography/tonal layering) can’t be verified programmatically in this workflow"
  - test: "Booking detail Pay now CTA opens Stripe Checkout and returns user to app flow"
    expected: "For awaiting_payment booking, Pay now redirects to Stripe checkout; after completing/canceling, return flow works as designed"
    why_human: "Requires real browser navigation + external Stripe UI; automated unit tests don’t validate this end-to-end"
---
## Phase 5: My bookings & notifications — Verification Report

**Phase Goal (ROADMAP.md):** Users see their bookings and receive at least email confirmation and cancellation notices when applicable.
**Verified:** 2026-04-24T15:05:30Z  
**Status:** human_needed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | “My bookings” lists only the signed-in user’s bookings with correct statuses | ✓ VERIFIED | Backend `GET /bookings` guarded + user-scoped: `backend/src/bookings/bookings.controller.ts` → `BookingsService.getMyBookings({ userId: req.user.sub })`. E2E: `backend/test/bookings.my-bookings.e2e-spec.ts` asserts auth scoping + expiry classification. |
| 2 | List response includes deterministic ordering and fields enabling Upcoming/Past split + scan-friendly rows | ✓ VERIFIED | Prisma query orders by `slot.startsAtUtc asc`, then `id asc` and returns enriched fields: `backend/src/bookings/bookings.service.ts` `getMyBookings()`. E2E asserts ordering + required fields. |
| 3 | User can open booking detail showing fighter/service/time/status/payment state/price | ✓ VERIFIED | Backend `GET /bookings/:id` guarded + scoped and returns enriched DTO fields: `backend/src/bookings/bookings.controller.ts` + `BookingsService.getBookingForUser()`. UI renders these fields in `src/app/pages/booking-detail/booking-detail.page.html`. E2E asserts detail shape + IDOR 404. |
| 4 | Expired payment holds never appear as “awaiting_payment forever” | ✓ VERIFIED | On-read sweep transitions `awaiting_payment` with `expiresAtUtc < now` to `expired`: `BookingsService.expireStaleAwaitingPaymentBookingsForUser()` called from both list + detail paths; E2E asserts list+detail return `expired`. |
| 5 | User can open My bookings and see Upcoming/Past tabs with correct default sorting | ✓ VERIFIED | UI tabs + derived sort: `src/app/pages/my-bookings/my-bookings.page.ts` (`IonSegment`, upcoming asc, past desc). |
| 6 | Each booking row shows fighter name, service title, Pacific local date/time, and status chip | ✓ VERIFIED | Template uses `fighterName`, `serviceTitle`, `formatPacificDateTime(startsAtUtc)`, and chip: `src/app/pages/my-bookings/my-bookings.page.html`; Pacific formatting uses `Intl.DateTimeFormat(... timeZone: 'America/Los_Angeles')` in page TS. |
| 7 | If booking awaiting payment, user sees Pay now CTA leading to existing payment flow | ✓ VERIFIED | Detail shows CTA only when `status === 'awaiting_payment'` and calls `BookingService.createCheckoutSession()` then `window.location.href = checkoutUrl`: `src/app/pages/booking-detail/booking-detail.page.ts` + `.html`. |
| 8 | On confirmation event (Stripe webhook path), backend emits one dev-email log with deep link | ✓ VERIFIED | `PaymentsService.processStripeEvent()` → `confirmBookingAndConsumeSlot()` emits notification only when transition applied (idempotent): `backend/src/payments/payments.service.ts` + `NotificationsService.notifyBookingConfirmed()`. E2E verifies exactly-once + deep link in log: `backend/test/notifications.booking-status.e2e-spec.ts`. |
| 9 | On hold expiry transition, backend emits one dev-email log with deep link (idempotent) | ✓ VERIFIED | `BookingsService.expireStaleAwaitingPaymentBookingsForUser()` emits notification only for transitioned bookings; deep link built from `PUBLIC_APP_URL` in `NotificationsService`: `backend/src/notifications/notifications.service.ts`. E2E verifies exactly-once across repeated sweeps: `backend/test/notifications.booking-status.e2e-spec.ts`. |
| 10 | No notifications on booking creation or Stripe cancel-like events | ✓ VERIFIED | Confirmed notifications only on `checkout.session.completed` path; expiry notifications only on state transition. E2E negative cases validate no `[DEV EMAIL]` on booking creation and on `checkout.session.expired` webhook: `backend/test/notifications.booking-status.e2e-spec.ts`. |

**Score:** 10/10 truths verified

## Required Artifacts (Exist + Substantive + Wired)

| Artifact | Expected | Status | Details |
|--------|----------|--------|---------|
| `backend/src/bookings/bookings.controller.ts` | Guarded list + detail endpoints | ✓ VERIFIED | `@UseGuards(JwtAccessAuthGuard)` on `GET /bookings` and `GET /bookings/:id`; scopes by `req.user.sub`. |
| `backend/src/bookings/bookings.service.ts` | User-scoped queries + expiry classification + notification hook | ✓ VERIFIED | Prisma `findMany` + deterministic ordering; expiry sweep updates status to `expired` and emits expired-hold notification for transitioned rows. |
| `backend/src/bookings/dto/booking.dto.ts` | DTO shapes for list + detail | ✓ VERIFIED | `BookingListItemDto` includes fighter/service/time/status/payment/price fields; `BookingDto` enriched for detail. |
| `backend/test/bookings.my-bookings.e2e-spec.ts` | E2E coverage: scoping/order/shape + expiry | ✓ VERIFIED | 3 tests cover MBB-01/MBB-02 + expiry classification. |
| `src/app/pages/my-bookings/my-bookings.page.ts` | List logic: fetch/tabs/sort/navigation/states | ✓ VERIFIED | Fetch via `BookingService.listMyBookings()`, split + sort, navigation to `/bookings/:bookingId`. |
| `src/app/pages/my-bookings/my-bookings.page.html` | List UI per UI-SPEC | ✓ VERIFIED | Skeleton/error/empty/list states, Upcoming/Past segment, status chip, Explore CTA to `/explore`. |
| `src/app/pages/booking-detail/booking-detail.page.ts` | Detail fetch + Pay now CTA wiring | ✓ VERIFIED | Loads by route param, calls `createCheckoutSession`, redirects to Stripe checkout URL. |
| `src/app/pages/booking-detail/booking-detail.page.html` | Detail UI per UI-SPEC | ✓ VERIFIED | Shows fighter/service/time/status/payment/price; CTA only for `awaiting_payment`. |
| `src/app/core/services/booking.service.ts` | API client methods | ✓ VERIFIED | `listMyBookings()` uses `withCredentials: true`; `getBooking()` and `createCheckoutSession()` used by pages. |
| `src/app/app.routes.ts` | Auth-guarded routes | ✓ VERIFIED | Routes `my-bookings` and `bookings/:bookingId` use `canActivate: [authGuard]`. |
| `backend/src/notifications/notifications.service.ts` | Dev-email logger + deep link | ✓ VERIFIED | Logs `[DEV EMAIL]` payload; deep link via `PUBLIC_APP_URL` to `/bookings/:id`, masks recipient in production. |
| `backend/src/notifications/notifications.module.ts` | Nest wiring | ✓ VERIFIED | Exports `NotificationsService`; imported by `BookingsModule` and `PaymentsModule`. |
| `backend/src/payments/payments.service.ts` | Notify-on-confirm only when transition applied | ✓ VERIFIED | Emits `notifyBookingConfirmed()` only when conditional update count indicates state changed; idempotent vs duplicate webhook events. |
| `backend/test/notifications.booking-status.e2e-spec.ts` | E2E emission rules | ✓ VERIFIED | Positive + negative + idempotency coverage for NOT-01/NOT-02. |

## Key Link Verification (Wiring)

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/src/bookings/bookings.controller.ts` | `backend/src/bookings/bookings.service.ts` | `getMy()` → `getMyBookings({ userId: req.user.sub })` | ✓ WIRED | Direct call with userId from auth context. |
| `backend/src/bookings/bookings.service.ts` | Prisma booking/slot/service/fighter/user | `findMany/findFirst` with selects and joins | ✓ WIRED | `prisma.booking.findMany` includes `slot`, `fighter`, `service`; expiry sweep reads `user.email` for notifications. |
| `backend/src/bookings/bookings.service.ts` | Booking status transition | conditional `updateMany` to `status: 'expired'` | ✓ WIRED | Transition only when still `awaiting_payment` and expired; idempotent. |
| `src/app/app.routes.ts` | My bookings + Booking detail pages | `loadComponent` + `authGuard` | ✓ WIRED | Routes present and guarded. |
| `src/app/pages/my-bookings/my-bookings.page.ts` | `src/app/core/services/booking.service.ts` | `listMyBookings()` | ✓ WIRED | Page fetches list on enter and refresh. |
| `src/app/pages/booking-detail/booking-detail.page.ts` | payment flow | `createCheckoutSession()` → `window.location.href` | ✓ WIRED | Reuses existing checkout-session API; CTA gated on `awaiting_payment`. |
| `backend/src/payments/payments.service.ts` | `backend/src/notifications/notifications.service.ts` | `notifyBookingConfirmed()` after confirm transition | ✓ WIRED | Emission occurs only if `didConfirm === true`. |
| `backend/src/bookings/bookings.service.ts` | `backend/src/notifications/notifications.service.ts` | `notifyBookingExpiredHold()` after expiry transition | ✓ WIRED | Emission occurs only for transitioned bookingIds. |
| `backend/src/notifications/notifications.service.ts` | deep link | `PUBLIC_APP_URL` + `new URL('/bookings/...')` | ✓ WIRED | Throws if `PUBLIC_APP_URL` missing; encoded bookingId. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|---------|---------------|--------|--------------------|--------|
| `MyBookingsPage` | `bookings: BookingListItem[]` | `BookingService.listMyBookings()` → `GET /bookings` | Yes (Prisma query) | ✓ FLOWING |
| `BookingDetailPage` | `data: Booking` | `BookingService.getBooking()` → `GET /bookings/:id` | Yes (Prisma query) | ✓ FLOWING |
| `NotificationsService` | `[DEV EMAIL]` log payload | `PaymentsService` + `BookingsService` transition hooks | Yes (emits on transition only) | ✓ FLOWING |

## Behavioral Spot-Checks (Automated)

| Behavior | Command | Result | Status |
|---------|---------|--------|--------|
| My bookings backend contract (MBB-01/MBB-02 + expiry) | `cd backend; npm test -- bookings.my-bookings.e2e-spec.ts` | PASS (3 tests) | ✓ PASS |
| Notifications emission rules (NOT-01/NOT-02 + negatives + idempotency) | `cd backend; npm test -- notifications.booking-status.e2e-spec.ts` | PASS (3 tests) | ✓ PASS |
| Frontend build/unit tests | `npm test -- --watch=false --browsers=ChromeHeadless` | PASS (2 tests) | ✓ PASS |

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|------------|-----------------|-------------|--------|---------|
| **MBB-01** | 05-01, 05-02 | User can list their own upcoming and past bookings | ✓ SATISFIED | Backend list endpoint + UI Upcoming/Past split and sort; backend e2e verifies scope/order/fields. |
| **MBB-02** | 05-01, 05-02 | User can open booking detail with fighter, service, time, status | ✓ SATISFIED | Backend detail endpoint + UI detail page; backend e2e verifies IDOR 404 and enriched fields. |
| **NOT-01** | 05-03 | User receives confirmation when booking becomes confirmed (email minimum) | ✓ SATISFIED | Dev-email equivalent logs emitted once on Stripe confirm transition; e2e verifies. |
| **NOT-02** | 05-03 | User receives notification on material status change when applicable | ✓ SATISFIED | Dev-email equivalent logs emitted once on hold expiry transition; e2e verifies. |

## Anti-Patterns Found

No Phase-05-specific TODO/FIXME/placeholder patterns detected in the Phase 05 touched artifacts listed above.

## Human Verification Required

### 1) Visual/UX contract spot-check

**Test:** Navigate to `/my-bookings` and inspect skeleton/error/empty/list states; verify tonal layering (no divider lines), chips, and copy match `05-UI-SPEC.md`.  
**Expected:** Two tabs (Upcoming/Past), scan-friendly rows (fighter/service/time/status), empty CTA routes to `/explore`.  
**Why human:** Visual design contract + “feel” are not machine-verifiable here.

### 2) Payment redirect smoke

**Test:** Open an awaiting-payment booking detail and click **Pay now**.  
**Expected:** Redirects to Stripe checkout; return flow functions; no CTA on terminal statuses.  
**Why human:** External Stripe UI + navigation behavior.

---
_Verified: 2026-04-24T15:05:30Z_  
_Verifier: Claude (gsd-verifier)_

