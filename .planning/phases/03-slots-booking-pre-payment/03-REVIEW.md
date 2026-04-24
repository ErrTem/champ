---
phase: 03-slots-booking-pre-payment
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - backend/prisma/schema.prisma
  - backend/src/availability/availability.module.ts
  - backend/src/availability/availability.controller.ts
  - backend/src/availability/availability.service.ts
  - backend/src/availability/dto/availability-query.dto.ts
  - backend/src/availability/dto/availability-response.dto.ts
  - backend/src/availability/dto/slot.dto.ts
  - backend/src/availability/availability.constants.ts
  - backend/src/bookings/bookings.module.ts
  - backend/src/bookings/bookings.controller.ts
  - backend/src/bookings/bookings.service.ts
  - backend/src/bookings/dto/create-booking.dto.ts
  - backend/src/bookings/dto/booking.dto.ts
  - backend/src/bookings/bookings.constants.ts
  - backend/src/scripts/concurrency-smoke.ts
  - src/app/core/models/booking.models.ts
  - src/app/core/services/booking.service.ts
  - src/app/pages/book-placeholder/book-placeholder.page.ts
  - src/app/pages/book-placeholder/book-placeholder.page.html
  - src/app/pages/book-placeholder/book-placeholder.page.scss
  - src/app/pages/login/login.page.ts
  - src/app/pages/login/login.page.html
  - src/app/app.routes.ts
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-24T00:00:00Z  
**Depth:** standard  
**Files Reviewed:** 23  
**Status:** issues_found

## Summary

Overall, the slot availability generation and the booking reservation transaction are structured in a reasonably safe, server-authoritative way (conditional `updateMany` inside a DB transaction is a good concurrency pattern). The main risks are around **booking expiration semantics** (what happens after the hold expires) and **frontend duplicated loading** that can create unnecessary requests and flicker.

## Warnings

### WR-01: Expired holds can leave “awaiting_payment” bookings hanging indefinitely

**File:** `backend/src/bookings/bookings.service.ts:30-56`  
**Issue:** `createBooking()` creates a `booking` with `status: 'awaiting_payment'` and an `expiresAtUtc`. If the user never pays, the slot becomes available again after `reservedUntilUtc` passes (availability query treats expired reservations as available), but the original booking remains in the database as “awaiting_payment” forever unless something else cleans it up. That can cause:

- Multiple “awaiting_payment” bookings for the same `slotId` over time (after TTL expires)
- Ambiguous state for any future “payment finalization” logic (which booking is the right one?)
- Harder customer support/audit trails (bookings that look active but aren’t)

**Fix:** Add a server-side cleanup/state transition strategy. Options:

- **At read time**: when creating a new booking for a slot, first mark any prior bookings for the slot that are `awaiting_payment` and `expiresAtUtc < now` as `expired`.
- **With a periodic job**: background task to mark expired bookings and optionally clear stale `reservedBookingId` on slots.
- **With a stronger invariant**: add a DB constraint so at most one non-terminal booking exists per slot (e.g., unique partial index by `slotId` where `status in (...)`), if your DB/migrations support it.

### WR-02: Booking page likely loads twice on enter (duplicate subscription + direct call)

**File:** `src/app/pages/book-placeholder/book-placeholder.page.ts:87-92`  
**Issue:** `ionViewWillEnter()` both subscribes to `queryParamMap` (which emits immediately) *and* calls `loadFromUrl()` directly. That commonly results in **two calls** to `loadFromUrl()` on first entry, which can mean duplicate HTTP requests and UI flicker.

**Fix:** Remove one of the triggers:

- Keep the subscription and delete the extra direct `this.loadFromUrl();`, or
- Keep the direct call and change the subscription to only react to subsequent changes (e.g., track last params / use `distinctUntilChanged`), or
- Use `takeUntilDestroyed()` (Angular) and a single stream for param changes.

### WR-03: `availabilityDays` is assumed nullable on frontend, but backend always returns an array

**File:** `src/app/pages/book-placeholder/book-placeholder.page.ts:172`  
**Issue:** The code uses `this.availabilityDays = res.days ?? [];`. The backend response shape (`AvailabilityResponseDto`) always returns `days: AvailabilityDayDto[]` (not optional), so `?? []` is defensive but suggests the client model might diverge from the contract. If the client types allow `days?: ...` but the server always returns `days`, it’s easy to miss contract regressions.

**Fix:** Align API contracts end-to-end:

- Make `AvailabilityResponse.days` non-optional in the Angular model (`src/app/core/models/booking.models.ts`) to match server behavior, or
- If the server truly may omit it, reflect that in the server DTO and controller/service.

## Info

### IN-01: Slot reservation fields are not modeled as relations

**File:** `backend/prisma/schema.prisma:109-158`  
**Issue:** `Slot.reservedBookingId` and `Slot.confirmedBookingId` are plain `String?` fields, not Prisma relations to `Booking`. That can make future joins and integrity checks harder, and allows dangling IDs.

**Fix:** Consider modeling these as explicit relations (e.g., `reservedBooking: Booking? @relation(...)`) or remove them if they’re redundant with `Booking.slotId` + `Booking.status`.

### IN-02: Booking status is a free-form string (risk of typos / inconsistent states)

**File:** `backend/prisma/schema.prisma:148` and `backend/src/bookings/bookings.service.ts:36-38`  
**Issue:** `Booking.status` is a plain `String` and the code sets `'awaiting_payment'`. Without an enum or centralized constant, it’s easy to introduce inconsistent status values.

**Fix:** Promote statuses to a Prisma enum and use a shared constant/union type in the Nest code.

### IN-03: `AvailabilityResponseDto` imports unused constants

**File:** `backend/src/availability/dto/availability-response.dto.ts:3`  
**Issue:** `MAX_DAYS` is imported but not used (looks like a leftover). This tends to fail linting or accumulate noise.

**Fix:** Remove the unused import.

### IN-04: Controller exception remapping is good, but consider validating error shapes consistently

**File:** `backend/src/availability/availability.controller.ts:12-20` and `backend/src/bookings/bookings.controller.ts:16-31`  
**Issue:** Both controllers normalize certain errors to stable `{ code, message }` contracts. That’s great, but the code currently relies on `instanceof` checks and in the bookings controller inspects `e.getResponse()` shape.

**Fix:** Consider a shared exception filter / helper to standardize API error payloads (so the UI never has to guess between `{code}` and nested `{message:{code}}`).

### IN-05: `concurrency-smoke.ts` cookie extraction is environment-dependent

**File:** `backend/src/scripts/concurrency-smoke.ts:64-79`  
**Issue:** The script tries `headers.getSetCookie()` (non-standard) and falls back to `headers.get('set-cookie')`. Depending on Node/Undici versions, this may fail to capture multiple cookies or any cookies at all.

**Fix:** Document the expected runtime (Node version) for the script, and consider using a small cookie jar helper or a library for robust `Set-Cookie` parsing if this script is important.

---

_Reviewed: 2026-04-24T00:00:00Z_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: standard_

