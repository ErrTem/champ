---
phase: 12-fighter-self-serve
plan: "01"
type: summary
created: 2026-04-27
---

## Summary
- Added **fighter self-serve** backend surface (schedule rules, services, bookings list + cancel) under `/fighter-self/*`.
- Enforced **approved fighter gating** via `JwtAccessAuthGuard` + new `FighterApprovedGuard`.
- Enforced **ownership** by deriving `fighterId` server-side from authenticated `userId` (client never supplies fighterId).
- Added **dev seed** user `fighter@champ.local` (approved fighter) linked to seeded fighter `ftr_ali_01`.
- Added **profile entrypoint + UI** at `/profile/fighter-tools` for approved fighters to manage schedule/services and cancel bookings.

## Key files
- Backend:
  - `backend/src/auth/guards/fighter-approved.guard.ts`
  - `backend/src/fighter-self/fighter-self.module.ts`
  - `backend/src/fighter-self/fighter-self.controller.ts`
  - `backend/src/fighter-self/fighter-self.service.ts`
  - `backend/prisma/schema.prisma` (User↔Fighter relation)
  - `backend/prisma/seed.ts`
  - `backend/src/notifications/notifications.service.ts` (cancellation dev-email event)
- Frontend:
  - `src/app/core/services/fighter-self-api.service.ts`
  - `src/app/pages/profile/fighter-tools/*`
  - `src/app/app.routes.ts`
  - `src/app/pages/profile/profile.page.html`

## Endpoints
- `GET /fighter-self/schedule-rules`
- `PUT /fighter-self/schedule-rules`
- `GET /fighter-self/services`
- `POST /fighter-self/services`
- `PATCH /fighter-self/services/:serviceId`
- `GET /fighter-self/bookings`
- `POST /fighter-self/bookings/:bookingId/cancel`

## Cancellation + refunds
- Cancellation allowed only for **future** bookings.
- Slot freed by clearing `confirmedBookingId` and/or `reservedBookingId/reservedUntilUtc` when tied to cancelled booking.
- Refund automation **not implemented**; notification payload includes `refundPolicy: manual | not_applicable` and does not claim refund issued.

## Test plan
- Backend: `cd backend && npm test`
- Frontend (unit): `npm test`

