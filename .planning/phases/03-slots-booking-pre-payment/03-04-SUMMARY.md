---
phase: 03-slots-booking-pre-payment
plan: 04
subsystem: ui
tags: [ionic, angular, nestjs, availability, bookings]

# Dependency graph
requires:
  - phase: 03-slots-booking-pre-payment
    provides: booking flow + create-booking hold endpoint (03-03)
provides:
  - Stable backend error codes for invalid selection and slot conflicts
  - In-context stale-slot recovery flow on Review step (refresh same day, clear stale slot)
  - Complete empty-state actions for no-slots day and no-availability horizon
affects: [phase-03, phase-04-payments]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Backend errors use stable `code` + user-safe `message` for UI handling"
    - "Booking UI keeps user context (same day) when recovering from slot conflicts"

key-files:
  created: []
  modified:
    - backend/src/availability/availability.controller.ts
    - backend/src/bookings/bookings.controller.ts
    - src/app/pages/book-placeholder/book-placeholder.page.ts
    - src/app/pages/book-placeholder/book-placeholder.page.html

key-decisions:
  - "Use HTTP 404 with `code: INVALID_SELECTION` for invalid fighter/service selection (consistent not-found semantics, UI-actionable)."
  - "Refresh availability only after user taps 'View updated times' so the stale-slot alert remains visible on Review."

patterns-established:
  - "Stale-slot UX: show inline tonal alert with fixed copy; action returns to Select, clears `slotId`, triggers availability refresh."

requirements-completed: [CAL-02, BKG-02]

# Metrics
duration: 2 min
completed: 2026-04-24
---

# Phase 03 Plan 04: Edge cases & polish Summary

**Stable backend error codes + in-context stale-slot recovery and empty states for the booking picker.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-24T09:27:35Z
- **Completed:** 2026-04-24T09:28:59Z
- **Tasks:** 3/3
- **Files modified:** 4

## Accomplishments

- Standardized backend errors for invalid selection (`INVALID_SELECTION`) and concurrency conflicts (`SLOT_UNAVAILABLE` + user-safe message).
- Implemented D-09 stale-slot UX on Review: friendly inline alert with exact UI-SPEC copy and “View updated times” recovery that refreshes the same day and clears the stale slot.
- Confirmed both empty states exist with correct copy and actions, including wiring “Pick a different date”.

## Task Commits

Each task was committed atomically:

1. **Task 1: Standardize stale-slot and validation errors (backend)** - `960cb19` (fix)
2. **Task 2: Implement stale slot friendly error + refresh selected day (frontend, no month bounce)** - `d232c8f` (fix)
3. **Task 3: Confirm empty-state coverage (no slots day + no availability 30 days)** - `f995ddb` (fix)

**Plan metadata:** _pending_

## Files Created/Modified

- `backend/src/availability/availability.controller.ts` - maps invalid fighter/service selection to `INVALID_SELECTION`
- `backend/src/bookings/bookings.controller.ts` - maps slot reservation conflicts to `SLOT_UNAVAILABLE` with user-safe message
- `src/app/pages/book-placeholder/book-placeholder.page.ts` - stale-slot recovery handler + empty-state action
- `src/app/pages/book-placeholder/book-placeholder.page.html` - embeds exact UI-SPEC stale-slot and empty-state copy + wires actions

## Decisions Made

- None beyond plan: used UI-SPEC copy verbatim and preserved picker context on conflict recovery.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Slot selection and pre-payment booking reservation flow now recover cleanly from race conditions and empty availability.
- Ready to proceed to Phase 4 payment UI and confirmation wiring.

## Self-Check: PASSED

- Found SUMMARY: `.planning/phases/03-slots-booking-pre-payment/03-04-SUMMARY.md`
- Found task commits: `960cb19`, `d232c8f`, `f995ddb`

---
*Phase: 03-slots-booking-pre-payment*  
*Completed: 2026-04-24*

