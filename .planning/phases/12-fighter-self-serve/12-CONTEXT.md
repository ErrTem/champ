# Phase 12: Fighter self-serve — Context

**Gathered:** 2026-04-26  
**Status:** Ready for planning  
**Source:** `.planning/ROADMAP.md` (Phase 12) + `.planning/REQUIREMENTS.md` (R8) + `.planning/todos/pending/2026-04-26-fighter-self-serve.md`

<domain>
## Phase Boundary

Deliver fighter self-serve capability (backend + frontend):

- Fighter can edit **own schedule rules** (availability generation inputs)
- Fighter can edit **own services** (title/duration/modality/price/published)
- Fighter can view and **cancel own bookings** (with clear rule + user notification; payment handling policy defined)

Hard requirement: **fighter-scoped auth + ownership checks** for all self-serve endpoints.

Out of scope (Phase 12):

- OAuth/registration upgrades work (Phase 9)
- Booking UX + 24h rule (Phase 10)
- Gyms + multi-timezone (Phase 11)
- Push notifications + calendar sync (Phase 13)
</domain>

<decisions>
## Implementation Decisions (Locked)

### Identity + ownership
- Self-serve endpoints authenticate via existing `JwtAccessAuthGuard` (cookie session).
- Ownership must be derived server-side by linking authenticated `User` to a single `Fighter` record.
- Admin endpoints remain as-is; self-serve reuses same underlying domain rules but with ownership-scoped access.

### Fighter eligibility
- Only users with `userType=fighter` AND `fighterStatus=approved` may access self-serve.
- Non-approved fighter users:
  - must not access self-serve endpoints (403)
  - UI should show “pending approval” (Phase 9) and hide self-serve entrypoints.

### Cancellation policy (v1.1)
- Implement fighter cancellation for **future** bookings.
- On cancel:
  - booking status transitions to a stable cancelled state (distinct from `expired`)
  - slot is made bookable again (unless start time already passed)
  - user receives notification (dev-email at minimum, consistent with existing notification patterns)
- Stripe refund automation: **not required** unless already trivial/available; if skipped, plan must document policy (e.g. “manual refunds only”).

</decisions>

<canonical_refs>
## Canonical References

### Requirements / phase drivers
- `.planning/ROADMAP.md` — Phase 12 definition
- `.planning/REQUIREMENTS.md` — R8 acceptance criteria
- `.planning/todos/pending/2026-04-26-fighter-self-serve.md` — driver notes

### Existing backend primitives (to reuse)
- `backend/src/admin/schedule.admin.controller.ts` + `backend/src/admin/schedule.admin.service.ts` — schedule rules replace + slot regen logic
- `backend/src/admin/services.admin.controller.ts` + `backend/src/admin/services.admin.service.ts` — service CRUD patterns
- `backend/src/bookings/bookings.controller.ts` + `backend/src/bookings/bookings.service.ts` — booking list/detail + status transitions for `expired`
- `backend/src/notifications/notifications.service.ts` — email notification patterns
- `backend/prisma/schema.prisma` — `UserType`, `FighterStatus`, `Fighter`, `Service`, `FighterScheduleRule`, `Booking`, `Slot`

### Existing frontend surface (entrypoints to extend)
- `src/app/pages/profile/**` (profile UX + potential fighter tools entry)
- `src/app/pages/admin/**` (existing admin pages include services/schedule/bookings; good UX patterns to mirror)
- `src/app/shell/tabs.page.*` (admin gating pattern via `/users/me`)
</canonical_refs>

<specifics>
## Open Questions (to resolve in plan, not later)
- What DB link: `Fighter.userId` (unique) vs separate join table.
- UI placement: fighter self-serve in Profile tab vs new tab vs nested routes.
- Cancel rules: allow cancel until start time only vs add minimum notice window.
- Refund policy when booking already paid/confirmed (Stripe): auto-refund, partial, or manual-only.
</specifics>

---

*Phase: 12-fighter-self-serve*  
*Context gathered: 2026-04-26*

