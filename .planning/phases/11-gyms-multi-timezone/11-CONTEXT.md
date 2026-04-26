# Phase 11: Gyms + multi-timezone — Context

**Gathered:** 2026-04-26  
**Status:** Ready for planning  
**Source:** `.planning/ROADMAP.md` (Phase 11) + `.planning/REQUIREMENTS.md` (R7) + `.planning/todos/pending/2026-04-26-gyms-and-timezones.md`

<domain>
## Phase Boundary

Deliver gyms domain + multi-timezone behavior across backend (NestJS/Prisma) + frontend (Ionic/Angular):

- Add `Gym` entity (name, address, timezone, map links)
- Associate fighters to gym
- Slot generation + availability + booking times are computed + displayed in **gym timezone**
- UI shows gym address + “Show on map” button (open Google/Apple Maps)

Out of scope for Phase 11:

- Registration upgrades (Phase 9)
- Booking UX + rules fixes (Phase 10)
- Fighter self-serve (Phase 12)
- Notifications/calendar sync (Phase 13), social (Phase 14)

</domain>

<decisions>
## Implementation Decisions (Locked)

### Timezone policy (core)
- Source of truth for timezone: `Gym.timezone` (IANA tz, e.g. `America/Los_Angeles`, `America/New_York`).
- All slot/booking timestamps stored unambiguously in DB (UTC instants), but:
  - generation windows
  - “day boundary” groupings (calendar views)
  - display formatting
  must use gym timezone.

### Fighter ↔ gym relationship
- Each fighter belongs to exactly 1 gym (for now).
- Default migration path: existing fighters assigned to default gym.

### Maps links
- UI provides “Show on map” action using a standard link format:
  - web: open Google Maps URL
  - iOS: prefer Apple Maps URL when available (fallback Google)
</decisions>

<canonical_refs>
## Canonical References

### Requirements / phase drivers
- `.planning/ROADMAP.md` — Phase 11 definition
- `.planning/REQUIREMENTS.md` — R7 acceptance criteria
- `.planning/todos/pending/2026-04-26-gyms-and-timezones.md` — driver notes

### Backend domain baseline
- `backend/prisma/schema.prisma`
- `backend/src/**` (fighters, slots, bookings, availability)

### Frontend display baseline
- `src/app/pages/fighter-profile/*` (where gym/address likely renders)
- `src/app/pages/book/*` (calendar display grouping)
</canonical_refs>

<specifics>
## Specific Ideas

- Use Luxon in backend (already dependency) for timezone-safe math.
- Add explicit “gym timezone” fields to DTOs where needed (avoid UI guessing).
- Validate timezone values server-side (IANA only).
</specifics>

<deferred>
## Deferred Ideas

- Multi-gym per fighter / fighter traveling schedule.
- Per-user timezone display preference (always show both gym time + user local).
</deferred>

---

*Phase: 11-gyms-multi-timezone*  
*Context gathered: 2026-04-26*

