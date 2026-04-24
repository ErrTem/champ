---
phase: 05-my-bookings-notifications
plan: 01
subsystem: api
tags: [nestjs, prisma, postgres, jest, e2e, bookings]

requires:
  - phase: 04-payments-confirmation
    provides: booking status model + auth guard + prisma schema
provides:
  - GET /bookings (auth-scoped) with deterministic ordering + enriched list DTO
  - Enriched GET /bookings/:id DTO for Phase 05 UI detail
  - Idempotent expiry classification: awaiting_payment + expiresAtUtc<now → expired
affects: [05-02, 05-03, frontend, notifications]

tech-stack:
  added: []
  patterns:
    - user-scoped reads via JwtAccessAuthGuard + req.user.sub
    - deterministic list ordering (startsAtUtc asc, id asc)
    - on-read idempotent expiry sweep scoped per-user

key-files:
  created:
    - backend/test/bookings.my-bookings.e2e-spec.ts
  modified:
    - backend/src/bookings/bookings.controller.ts
    - backend/src/bookings/bookings.service.ts
    - backend/src/bookings/dto/booking.dto.ts
    - backend/test/helpers/test-app.ts

key-decisions:
  - "Return enriched display fields (fighter/service/price/paymentState + UTC times) from API to keep Phase 05 UI dumb and scan-friendly."
  - "Implement expiry classification as idempotent on-read sweep (per-user) to avoid new scheduler infra in v1."

patterns-established:
  - "Bookings list endpoint mirrors existing get-by-id scoping: guard + userId-only Prisma where clause."

requirements-completed: [MBB-01, MBB-02]

duration: 2m
completed: 2026-04-24
---

# Phase 05 Plan 01: My bookings backend API Summary

**Auth-scoped “My bookings” list endpoint + enriched booking detail DTO, with stable expired-hold classification.**

## Performance

- **Duration:** 2m
- **Started:** 2026-04-24T17:43:12+03:00
- **Completed:** 2026-04-24T17:45:00+03:00
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- User-scoped list API `GET /bookings` returning DTO fields needed for Upcoming/Past split + scan UI.
- Enriched `GET /bookings/:id` response with fighter/service/price/paymentState + UTC times.
- On-read expiry sweep makes stale `awaiting_payment` bookings show as terminal `expired`.

## Task Commits

1. **Task 0 (Nyquist Wave 0): Add backend e2e tests for “My bookings” list+detail** - `32d4ce0` (test)
2. **Task 1: Implement `GET /bookings` (auth-scoped) returning enriched list DTO** - `010d949` (feat)
3. **Task 2: Add idempotent expiry classification for stale `awaiting_payment` bookings** - `509ebf4` (feat)

## Files Created/Modified

- `backend/test/bookings.my-bookings.e2e-spec.ts` - e2e coverage for list scoping/order/shape + detail scoping/enrichment + expiry classification.
- `backend/test/helpers/test-app.ts` - test app now installs `cookie-parser` so auth cookie tests can hit guarded endpoints.
- `backend/src/bookings/bookings.controller.ts` - add `GET /bookings` guarded endpoint.
- `backend/src/bookings/bookings.service.ts` - implement `getMyBookings()` + enrich `getBookingForUser()` + expiry sweep helper.
- `backend/src/bookings/dto/booking.dto.ts` - add `BookingListItemDto` + enrich `BookingDto` (additive).

## Decisions Made

None beyond plan: followed Task 0–2 actions + locked Phase 05 decisions (D-18, D-19).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Enable cookie parsing in e2e test app**
- **Found during:** Task 0 (e2e tests for guarded endpoints)
- **Issue:** `createTestApp()` did not install `cookie-parser`, so `req.cookies` empty and guarded endpoints always 401 in tests.
- **Fix:** `backend/test/helpers/test-app.ts` adds `app.use(cookieParser())`.
- **Verification:** `npm test -- bookings.my-bookings.e2e-spec.ts` reaches guarded endpoints (401 → 404/200 as expected).
- **Committed in:** `32d4ce0`

**2. [Rule 3 - Blocking] Start local Postgres for e2e tests**
- **Found during:** Task 0 (resetTestDb)
- **Issue:** e2e suite requires DB at `localhost:5432`; tests failed to connect.
- **Fix:** ran `docker compose up -d db` (local runtime only; no repo changes).
- **Verification:** tests connect and run.
- **Committed in:** N/A (runtime)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both required for test execution. No scope creep.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Phase 05-02 can consume `GET /bookings` + enriched `GET /bookings/:id` for list + detail UI.
- Phase 05-03 can reuse expiry sweep behavior; if notifications need “emit-on-transition”, consider returning transitioned IDs from sweep (not done here).

## Self-Check: PASSED

- Summary file present
- Task commits present: `32d4ce0`, `010d949`, `509ebf4`

