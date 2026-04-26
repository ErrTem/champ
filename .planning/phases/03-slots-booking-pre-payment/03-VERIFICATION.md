---
phase: 03-slots-booking-pre-payment
verified: 2026-04-24T00:00:00Z
status: passed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "E2E booking flow (logged-in)"
    expected: "From fighter profile → service → /book, user can pick a day/time, reserve, and immediately sees status 'Awaiting payment'."
    why_human: "Requires running app + backend and validating UX, copy, and navigation."
  - test: "E2E login return-to preservation"
    expected: "When logged out, tapping 'Reserve slot' redirects to `/login?returnTo=/book?...`; after login, user returns to booking flow with date/slot preserved when still valid."
    why_human: "Requires runtime router behavior and auth cookie/session behavior."
  - test: "Concurrency guard under real load"
    expected: "Parallel reservation attempts for same `slotId` yield exactly one success (201) and the rest 409 `SLOT_UNAVAILABLE`."
    why_human: "Requires backend running + executing `backend/src/scripts/concurrency-smoke.ts` (or equivalent) against a real DB."
  - test: "Availability correctness and timezone presentation"
    expected: "Times shown match America/Los_Angeles policy and the next-30-days horizon; unavailable/reserved slots are not presented as available."
    why_human: "Requires comparing UI and API responses across day boundaries and verifying display formatting."
---

# Phase 3: Slots & booking (pre-payment) Verification Report

**Phase Goal:** Authenticated users can see real availability and create a booking in an awaiting-payment state without double-booking.

**Verified:** 2026-04-24T00:00:00Z  
**Status:** passed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Calendar/date UI loads slots from an availability API for selected fighter/service | ✓ VERIFIED | `src/app/core/services/booking.service.ts` calls `GET {apiUrl}/availability` with `fighterId`, `serviceId`, `days`; `src/app/pages/book-placeholder/book-placeholder.page.ts` loads availability and renders bucketed slots in template. |
| 2 | Availability is “real” (server-authoritative) and returns server-issued `slotId` values | ✓ VERIFIED | Backend generates/persists `Slot` rows and returns `{ slotId: Slot.id, startsAtUtc, endsAtUtc }` from DB in `backend/src/availability/availability.service.ts`. |
| 3 | Availability is limited to next 30 days and uses America/Los_Angeles boundary with UTC storage | ✓ VERIFIED | `backend/src/availability/availability.constants.ts` sets `MAX_DAYS = 30`, `AVAILABILITY_TIMEZONE = 'America/Los_Angeles'`; service clamps days and computes local dates in that zone, while storing/returning UTC ISO timestamps. Response DTO includes `timezone`. |
| 4 | Availability browsing does not require authentication | ✓ VERIFIED | `backend/src/availability/availability.controller.ts` has no auth guard; it only validates query params. |
| 5 | Creating a booking requires auth and uses `slotId` (not raw timestamps) | ✓ VERIFIED | `backend/src/bookings/bookings.controller.ts` protects `POST /bookings` with `JwtAccessAuthGuard`; request DTO only accepts `slotId`. |
| 6 | Server prevents double-booking via atomic slot reservation with TTL | ✓ VERIFIED | `backend/src/bookings/bookings.service.ts` uses `prisma.$transaction` + `slot.updateMany(where reservedUntilUtc null/expired and confirmedBookingId null)`; if `count===0`, throws 409 `SLOT_UNAVAILABLE`. TTL derived from `BOOKING_HOLD_TTL_MINUTES=15` stored as `reservedUntilUtc` and `booking.expiresAtUtc`. |
| 7 | Booking created immediately returns status “awaiting_payment” with expiration timestamp | ✓ VERIFIED | `backend/src/bookings/bookings.service.ts` creates booking with `status: 'awaiting_payment'` and returns `expiresAtUtc` in response DTO. |
| 8 | `/book?fighterId=&serviceId=` is stable entry route and works on refresh | ✓ VERIFIED | `src/app/app.routes.ts` defines path `book`; `BookPlaceholderPage.loadFromUrl()` reads query params from `ActivatedRoute.snapshot` and reloads on `queryParamMap` subscription. |
| 9 | Stale slot selection and empty availability cases are handled with friendly recovery | ✓ VERIFIED | UI template contains locked copy for “That time just got taken.” and both empty-state headings/actions; backend standardizes 409 `SLOT_UNAVAILABLE` and 404 `INVALID_SELECTION` (`backend/src/bookings/bookings.controller.ts`, `backend/src/availability/availability.controller.ts`). |

**Score:** 9/9 truths verified

## Required Artifacts (Existence + Substantive + Wired)

| Artifact | Expected | Status | Details |
|--------|----------|--------|---------|
| `backend/prisma/schema.prisma` | Slot + schedule + booking schema | ✓ VERIFIED | Defines `FighterScheduleRule`, `Slot` (UTC timestamps + reservation fields), and `Booking` linked to `User/Fighter/Service/Slot`. |
| `backend/src/availability/availability.controller.ts` | Public availability endpoint | ✓ VERIFIED | `@Controller('availability')` + `@Get()` wired to service; maps invalid selection to `INVALID_SELECTION`. |
| `backend/src/availability/availability.service.ts` | Generates/filters availability and returns slotIds | ✓ VERIFIED | Uses Prisma reads/writes + Luxon timezone boundary + filters by reservation/confirmation. |
| `backend/src/bookings/bookings.controller.ts` | Authenticated create booking endpoint | ✓ VERIFIED | `@Controller('bookings')` + `@Post()` with `@UseGuards(JwtAccessAuthGuard)`; maps conflicts to stable response. |
| `backend/src/bookings/bookings.service.ts` | Transactional hold + concurrency guard | ✓ VERIFIED | `$transaction` create booking + conditional `updateMany`; returns DTO including slot times and ids. |
| `src/app/core/services/booking.service.ts` | UI client to availability + booking APIs | ✓ VERIFIED | Calls `/availability` and `/bookings` with `withCredentials: true`; coerces error shape including `code`. |
| `src/app/pages/book-placeholder/book-placeholder.page.ts` | Step-based booking flow UI state | ✓ VERIFIED | Loads fighter/service, builds 30-day horizon in `America/Los_Angeles`, loads availability, reserves booking, handles 401→login returnTo, 409 stale slot. |
| `src/app/pages/book-placeholder/book-placeholder.page.html` | Select/Review/Created templates with locked copy | ✓ VERIFIED | Contains required CTAs/copy and stale-slot/empty-state recovery actions. |
| `src/app/pages/login/login.page.ts` | returnTo redirect on successful login | ✓ VERIFIED | Reads `returnTo` query param and `navigateByUrl(returnTo)` post-login. |

## Key Link Verification (Critical Wiring)

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `BookPlaceholderPage` | Availability API | `BookingService.getAvailability()` | ✓ WIRED | UI calls booking service, booking service calls `${apiUrl}/availability`; backend controller/service return DB-derived slots. |
| `BookPlaceholderPage` | Create booking API | `BookingService.createBooking()` | ✓ WIRED | UI calls create booking; backend requires auth and returns booking DTO; UI shows “Awaiting payment”. |
| Booking creation | Slot concurrency guard | Prisma `$transaction` + `slot.updateMany` | ✓ WIRED | Only one reservation can succeed while slot is not expired/confirmed; conflicts emit 409 `SLOT_UNAVAILABLE`. |
| Availability listing | Reservation visibility | DB filter on `reservedUntilUtc` + `confirmedBookingId` | ✓ WIRED | Reserved slots are excluded unless reservation is expired (`reservedUntilUtc < now`). |

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---------|---------------|--------|-------------------|--------|
| `backend/src/availability/availability.service.ts` | `availableSlots` | Prisma `slot.findMany` after `slot.createMany` materialization | Yes (DB reads/writes) | ✓ FLOWING |
| `backend/src/bookings/bookings.service.ts` | `booking` + slot reservation | Prisma `booking.create` + `slot.updateMany` in `$transaction` | Yes (DB transaction) | ✓ FLOWING |
| `src/app/pages/book-placeholder/book-placeholder.page.ts` | `availabilityDays` | `BookingService.getAvailability()` | Yes (HTTP to backend) | ✓ FLOWING |
| `src/app/pages/book-placeholder/book-placeholder.page.ts` | `createdBooking` | `BookingService.createBooking()` | Yes (HTTP to backend) | ✓ FLOWING |

## Behavioral Spot-Checks

**SKIPPED** — cannot run servers/services here. (A runnable check exists: `backend/src/scripts/concurrency-smoke.ts`.)

## Requirements Coverage (ALL Phase 3 IDs)

| Requirement | Source Plan(s) | Description (from `REQUIREMENTS.md`) | Status | Evidence |
|------------|----------------|---------------------------------------|--------|----------|
| CAL-01 | 03-01, 03-03 | User can view a calendar or date picker scoped to selected fighter and service | ✓ SATISFIED | `/book` reads `fighterId/serviceId` and loads availability; UI renders day grid + bucketed times; backend requires fighter/service match in availability query. |
| CAL-02 | 03-01, 03-03, 03-04 | User sees only time slots returned by backend as available | ✓ SATISFIED | Backend returns only slots meeting availability filter; UI renders slots from API response (no client-invented times). |
| CAL-03 | 03-01 | Shown times respect defined timezone policy (documented behavior; UTC storage) | ✓ SATISFIED | Backend policy: `AVAILABILITY_TIMEZONE='America/Los_Angeles'`, stores/returns UTC; UI formats with `Intl.DateTimeFormat(... timeZone: 'America/Los_Angeles')`. |
| BKG-01 | 03-02, 03-03 | Authenticated user can create a booking for a chosen slot and service | ✓ SATISFIED | `POST /bookings` guarded; UI calls it and handles 401/created state. |
| BKG-02 | 03-02, 03-04 | System prevents two confirmed bookings for same fighter time slot (server-enforced) | ✓ SATISFIED (pre-payment hold) | Concurrency guard prevents multiple simultaneous holds for same slot; confirmed-booking semantics are extended in Phase 4 (but Phase 3 prevents double reservation at create time). |
| BKG-03 | 03-02, 03-03 | User sees booking status (e.g. awaiting payment, confirmed, cancelled) | ✓ SATISFIED | Backend returns `status: 'awaiting_payment'`; UI displays “Awaiting payment” immediately on Review/Created steps. |

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/app/pages/book-placeholder/book-placeholder.page.ts` | `ionViewWillEnter()` subscribes to `queryParamMap` and also calls `loadFromUrl()` directly (duplicate initial load risk) | ⚠️ Warning | Could cause duplicate HTTP calls / flicker; does not block goal achievement. |
| `backend/src/bookings/bookings.service.ts` | Expired awaiting-payment bookings are not automatically transitioned/cleaned up | ⚠️ Warning | Can accumulate stale `awaiting_payment` records; does not break concurrency guard but may complicate later payment confirmation logic. |

## Human Verification Required

1. **E2E booking flow (logged-in)**
   - **Test:** Navigate to a fighter profile → select a service → open `/book?fighterId=...&serviceId=...` → select date/time → review → reserve.
   - **Expected:** Booking is created, and UI shows “Booking reserved” + “Awaiting payment”.
   - **Why human:** Requires running app + backend and validating UX/navigation.

2. **E2E login return-to preservation**
   - **Test:** Log out; repeat reserve action.
   - **Expected:** Redirect to `/login?returnTo=...`; after login, returns to `/book?...` with selection preserved when still valid.
   - **Why human:** Runtime router + auth cookie behavior.

3. **Concurrency guard under real load**
   - **Test:** Run backend and execute `backend/src/scripts/concurrency-smoke.ts` (via package script) against a real DB.
   - **Expected:** Exactly 1×201 and N-1×409 `SLOT_UNAVAILABLE`.
   - **Why human:** Requires runtime execution.

4. **Availability correctness + timezone**
   - **Test:** Compare UI times with API response times; cross-check around day boundary.
   - **Expected:** Display matches America/Los_Angeles policy; horizon is 30 days; reserved slots disappear until TTL expiry.
   - **Why human:** Visual/timezone correctness cannot be proven statically.

## Gaps Summary

No implementation gaps found against Phase 3 roadmap success criteria and the listed requirement IDs. Remaining work is runtime verification (E2E and concurrency smoke execution) plus optional follow-ups for duplicate UI loads and expired booking lifecycle.

---

_Verified: 2026-04-24T00:00:00Z_  
_Verifier: Claude (gsd-verifier)_

