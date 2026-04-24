---
phase: 03-slots-booking-pre-payment
plan: 01
subsystem: api
tags: [nest, prisma, postgres, availability, slots, luxon, timezone]

# Dependency graph
requires:
  - phase: 02-catalog-fighter-profile
    provides: fighters and services in DB (seeded) for availability browsing
provides:
  - Public `GET /availability` API (30-day horizon, America/Los_Angeles boundary)
  - Database models for fighter schedule rules and generated candidate slots (UTC storage)
affects: [03-02-booking, 03-03-ui-booking-flow, 03-04-edge-cases]

# Tech tracking
tech-stack:
  added: [luxon, "@types/luxon"]
  patterns:
    - "Timezone boundary: compute local PT schedule windows, store/return UTC timestamps"
    - "Slot materialization: generate candidates and persist via unique constraint + createMany(skipDuplicates)"

key-files:
  created:
    - backend/src/availability/availability.module.ts
    - backend/src/availability/availability.controller.ts
    - backend/src/availability/availability.service.ts
    - backend/src/availability/availability.constants.ts
    - backend/src/availability/dto/availability-query.dto.ts
    - backend/src/availability/dto/availability-response.dto.ts
    - backend/src/availability/dto/slot.dto.ts
    - backend/prisma/README.md
  modified:
    - backend/prisma/schema.prisma
    - backend/prisma/seed.ts
    - backend/src/app.module.ts
    - backend/package.json
    - backend/package-lock.json

key-decisions:
  - "Use Luxon to enforce America/Los_Angeles boundary deterministically on the server."
  - "Clamp `days` server-side (≤ 30) instead of rejecting large values."

patterns-established:
  - "Availability responses are grouped by local YYYY-MM-DD (America/Los_Angeles) but include UTC ISO timestamps for booking safety."

requirements-completed: [CAL-01, CAL-02, CAL-03]

# Metrics
duration: 6min
completed: 2026-04-24
---

# Phase 03 Plan 01: Availability foundation Summary

**Public availability browsing API that generates stable, server-issued `slotId` values from PT schedule rules and returns UTC timestamps for the next 30 days.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-24T12:05:08+03:00
- **Completed:** 2026-04-24T12:10:48+03:00
- **Tasks:** 4
- **Files modified:** 13

## Accomplishments

- Added Prisma models for `FighterScheduleRule` (PT minutes) and `Slot` (UTC timestamps + reservation fields).
- Seeded deterministic baseline schedule rules for seeded fighters.
- Implemented `GET /availability` (public, no auth) that clamps to 30 days, materializes slots, filters availability, and returns `{ slotId, startsAtUtc, endsAtUtc }`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Prisma models for schedule rules + concrete slots (UTC storage)** - `4cadd33` (feat)
2. **Task 2: [BLOCKING] Push Prisma schema to database** - `90586d7` (docs)
3. **Task 3: Seed baseline schedule rules (Pacific Time) for existing fighters** - `7fce672` (feat)
4. **Task 4: Implement public availability API (30-day horizon, slotId contract)** - `3b66903` (feat)

## Files Created/Modified

- `backend/prisma/schema.prisma` - Adds `FighterScheduleRule` and `Slot` models (+ relations/unique index).
- `backend/prisma/seed.ts` - Seeds baseline PT schedule rules for each seeded fighter.
- `backend/src/availability/*` - Availability module/controller/service + DTOs/constants.
- `backend/src/app.module.ts` - Wires `AvailabilityModule`.
- `backend/package.json`, `backend/package-lock.json` - Adds Luxon dependency for timezone-safe math.

## Decisions Made

- Used Luxon for timezone-safe `America/Los_Angeles` date computations and UTC conversion (CAL-03, D-04/D-05).
- Implemented server-side clamping for `days` to satisfy the “next 30 days” contract even when clients pass larger values (D-02 / T-03-02 mitigation).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Clamp `days` instead of rejecting large values**
- **Found during:** Task 4 verification (`days=999` returned 400 due to DTO max validation)
- **Fix:** Removed `@Max(30)` from query DTO and relied on service-side clamp.
- **Files modified:** `backend/src/availability/dto/availability-query.dto.ts`
- **Verification:** `curl.exe ...&days=999` returns `range.days: 30`
- **Committed in:** `84770c4`

---

**Total deviations:** 1 auto-fixed (1 Rule 1)
**Impact on plan:** Required for correctness against plan verification criteria; no scope creep.

## Issues Encountered

- Prisma `db push` attempted to generate Prisma Client and hit a Windows `EPERM rename` error; reran `db push --skip-generate` to complete DB sync (documented in `backend/prisma/README.md`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Availability is now server-authoritative and returns `slotId`, enabling 03-02 booking holds to reference a slot without client-supplied timestamps.
- Seeded schedule rules provide deterministic baseline data for UI work in 03-03.

## Self-Check: PASSED

