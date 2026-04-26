# Phase 12: Fighter self-serve — Research

**Researched:** 2026-04-26  
**Domain:** fighter schedule/services ownership + booking cancel transitions  
**Confidence:** MEDIUM (needs final decision on ownership link + refund policy)

<user_constraints>
## User Constraints (from CONTEXT.md)

- Must enforce fighter-scoped auth + ownership checks.
- Must cover schedule rules + services + booking cancellation.
- Must integrate with Phase 9 fighter approval gate (`userType=fighter`, `fighterStatus=approved`).
</user_constraints>

## Existing implementation inventory (backend)

### Schedule rules + slot regeneration already exists (admin-scoped)
- Admin endpoints:
  - `GET /admin/fighters/:fighterId/schedule-rules`
  - `PUT /admin/fighters/:fighterId/schedule-rules`
- Implementation details:
  - schedule rules are replaced wholesale (`deleteMany` then `createMany`)
  - overlaps validated
  - candidate slots generated for next ~30 days, per service duration, then `slot.createMany(skipDuplicates)`
  - stale slots cleanup uses candidate key set (implemented in `ScheduleAdminService.replaceRulesAndRegenerate`)

This logic can be reused for fighter self-serve by scoping `fighterId` to “current fighter”.

### Services CRUD already exists (admin-scoped)
- Admin endpoints:
  - `GET /admin/fighters/:fighterId/services`
  - `POST /admin/fighters/:fighterId/services`
  - `PATCH /admin/services/:serviceId`
- Implementation uses Prisma `service` table; DTOs already defined under `backend/src/admin/dto/*`.

### Bookings domain exists but no cancellation endpoint yet
- User-scoped bookings:
  - `GET /bookings` (my list)
  - `GET /bookings/:id` (my detail)
  - `POST /bookings` (create hold)
- Status transitions currently implemented:
  - `awaiting_payment` -> `expired` (server-side, on read)
  - `awaiting_payment` -> `confirmed` (Stripe confirm flow in `PaymentsService.confirmBookingAndConsumeSlot`)
- No “cancel by fighter/user” status today; booking `status` is `String` (no enum), so adding new statuses is low-migration.

### Fighter approval primitives already in schema
- `User.userType` enum, `User.fighterStatus` enum, timestamps for approval/terms/adult.
- Missing link: `Fighter` model has no `userId`, so there is no ownership mapping yet.

## Recommended approach (to encode in plan)

### Ownership link (minimal)
- Add `Fighter.userId` nullable or required with `@unique` + FK to `User`.
- Alternatively: `User.fighterId` but this couples user to fighter and can block future multi-fighter per user; `Fighter.userId` keeps “fighter profile” entity as owned asset.

Plan should pick one and include migration + seed/backfill strategy (dev only).

### Authz guard pattern
Create backend guard(s) similar to `AdminGuard`:
- `FighterApprovedGuard`: checks authenticated `User` has `userType=fighter` and `fighterStatus=approved`.
- `FighterOwnershipGuard` or service helper: resolves “current fighterId” from `req.user.sub` via DB join.

### Cancellation mechanics
Implement cancel endpoint that:
- Validates booking belongs to current fighter.
- Only allows cancelling future bookings (based on slot start time vs now UTC).
- Transitions `Booking.status` to stable value (e.g. `cancelled_by_fighter`).
- Frees slot:
  - If booking was confirmed, set `slot.confirmedBookingId = null` (and keep reserved fields null).
  - If booking was awaiting_payment and reserved, clear `slot.reservedBookingId/reservedUntilUtc`.
- Emits notification to user using existing `NotificationsService` pattern (dev-email).

Refunds:
- If Stripe refund automation not implemented, status/notification must communicate “refund handled manually” (policy) and avoid claiming money refunded.

## Metadata

**Research date:** 2026-04-26  
**Valid until:** 2026-05-26

