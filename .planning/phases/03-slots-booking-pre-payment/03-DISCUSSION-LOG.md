# Phase 3: Slots & booking (pre-payment) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `03-CONTEXT.md` — this log preserves alternatives considered.

**Date:** 2026-04-24  
**Phase:** 03-slots-booking-pre-payment  
**Areas discussed:** Availability UX, Booking creation contract

---

## Availability UX

### Slot picking UI

| Option | Selected |
|--------|----------|
| Calendar month view → time slots grid (matches `src/design/select_date_time/code.html`) | ✓ |
| Date list → time slots | |
| “Next available times” only | |

### Browse horizon

| Option | Selected |
|--------|----------|
| 30 days | ✓ |
| 60 days | |
| 90 days | |

### Time grouping

| Option | Selected |
|--------|----------|
| Buckets (Morning / Evening; optionally Afternoon) | ✓ |
| Flat sorted list/grid | |
| Toggle bucket/flat | |

### Timezone display / policy

| Option | Selected |
|--------|----------|
| California-only (single timezone) | ✓ |

Follow-up resolution:

| Option | Selected |
|--------|----------|
| Treat schedule/display as America/Los_Angeles; store UTC internally; no timezone label in UI | ✓ |
| Same, but always show “PT” label | |
| Still show user-local timezone | |

---

## Booking creation contract (pre-payment)

### Auth requirement

| Option | Selected |
|--------|----------|
| Require login; redirect to `/login` then return to booking flow preserving selection | ✓ |
| Browse slots unauthenticated; login only at create-booking | |

### Create-booking API input

| Option | Selected |
|--------|----------|
| Accept server-issued `slotId` from availability API | ✓ |
| Accept start/end timestamps + serviceId (server validates) | |

### “Awaiting payment” reserve behavior

| Option | Selected |
|--------|----------|
| Reserve/hold the slot for a short TTL (10–15 min target) then auto-expire if unpaid | ✓ |
| Do not reserve until payment confirmation | |

### Stale slot handling

| Option | Selected |
|--------|----------|
| Friendly error + refresh slots for the day, keep user on picker | ✓ |
| Send back to month view | |
| Offer next best times automatically | |

---

## Claude's Discretion

- Exact bucket cutoffs and whether to include “Afternoon”.
- Exact hold TTL implementation details and cleanup strategy.
- Exact booking status enum naming as long as required states are representable.
