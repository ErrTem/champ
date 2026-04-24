---
phase: 03-slots-booking-pre-payment
plan: 02
subsystem: api
tags: [nest, prisma, bookings, concurrency]

# Dependency graph
requires:
  - phase: 03-01
    provides: availability API returning slotId
provides:
  - Authenticated `POST /bookings` that creates an awaiting-payment hold with TTL
  - Atomic slot reservation guard returning 409 `SLOT_UNAVAILABLE` on conflicts
  - Concurrency smoke script proving double-booking prevention
affects: [payments, booking-flow, slot-holds]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prisma transactional conditional update for concurrency guard"

key-files:
  created:
    - backend/src/bookings/bookings.module.ts
    - backend/src/bookings/bookings.controller.ts
    - backend/src/bookings/bookings.service.ts
    - backend/src/bookings/bookings.constants.ts
    - backend/src/bookings/dto/create-booking.dto.ts
    - backend/src/bookings/dto/booking.dto.ts
    - backend/src/scripts/concurrency-smoke.ts
  modified:
    - backend/prisma/schema.prisma
    - backend/src/app.module.ts
    - backend/package.json

key-decisions:
  - "Keep Slot as the concurrency guard via conditional update; Booking uniqueness is not relied on for race safety."
  - "Use a 15-minute hold TTL (BOOKING_HOLD_TTL_MINUTES=15) for awaiting_payment bookings."

patterns-established:
  - "Conflict responses include a stable code string for UI: SLOT_UNAVAILABLE"

requirements-completed: [BKG-01, BKG-02, BKG-03]

# Metrics
duration: unknown
completed: 2026-04-24
---

# Phase 3 Plan 02: Booking creation (pre-payment) Summary

**Added an authenticated booking-hold endpoint that reserves a slot atomically for 15 minutes and returns 409 `SLOT_UNAVAILABLE` under concurrency.**

## Performance

- **Duration:** unknown
- **Started:** unknown
- **Completed:** 2026-04-24
- **Tasks:** 4/4
- **Files modified:** 10

## Accomplishments

- Booking persistence model (`Booking`) added to Prisma schema for awaiting-payment holds.
- `POST /bookings` implemented with a Prisma transaction that creates the booking and conditionally reserves the slot row (prevents double-booking).
- Added `concurrency:smoke` script that proves only one concurrent request succeeds and the rest are rejected with `SLOT_UNAVAILABLE`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Prisma model for Booking + wire slot reservation fields** - `77ea085` (feat)
2. **Task 2: Push Prisma schema to database** - `2b7860a` (chore, allow-empty)
3. **Task 3: Implement create-booking endpoint with atomic slot reservation (TTL)** - `7ec6411` (feat)
4. **Task 4: Add concurrency smoke script to prove double-booking is prevented** - `8c67bff` (test)

## Files Created/Modified

- `backend/prisma/schema.prisma` - adds `Booking` model linked to `User`, `Fighter`, `Service`, `Slot`
- `backend/src/bookings/*` - bookings module/controller/service/constants + DTOs
- `backend/src/app.module.ts` - wires `BookingsModule`
- `backend/src/scripts/concurrency-smoke.ts` - parallel double-booking smoke test
- `backend/package.json` - adds `concurrency:smoke` script

## Decisions Made

- None beyond what the plan specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma generate EPERM on Windows due to locked engine DLL**
- **Found during:** Task 2 (db push / generate)
- **Issue:** `npx prisma generate` failed with `EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp*`
- **Fix:** Stopped the backend dev server processes that were locking the Prisma engine DLL, then reran `npx prisma generate`
- **Verification:** `npx prisma generate` succeeded afterwards; backend `npm run build` passed
- **Committed in:** `2b7860a` (Task 2 commit note)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for reliable Prisma client generation on Windows; no scope creep.

## Issues Encountered

- Prisma client generation can fail on Windows if a running backend process holds a lock on `query_engine-windows.dll.node`. Stopping `nest start --watch` processes resolves it.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Booking holds are server-authoritative and concurrency-safe. Ready for Phase 03-03/03-04 and Phase 4 payment confirmation wiring.

