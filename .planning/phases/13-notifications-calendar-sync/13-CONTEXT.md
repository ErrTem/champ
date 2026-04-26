# Phase 13: Notifications + calendar sync — Context

**Gathered:** 2026-04-26  
**Status:** Ready for planning  
**Source:** `.planning/ROADMAP.md` (Phase 13) + `.planning/REQUIREMENTS.md` (R9) + `.planning/todos/pending/2026-04-26-notifications-calendar-sync.md`

<domain>
## Phase Boundary

Deliver richer notifications + calendar sync across backend (NestJS) + frontend (Ionic/Angular):

- Push notifications (Web Push / PWA target) for:
  - user reminders (at least 24h before booked training)
  - fighter notification when new booking created with them
- Notification preferences (minimum viable toggles) so user can opt-out of reminder push
- Calendar sync:
  - ICS export minimum (add single booking to calendar)

Out of scope for Phase 13:

- Native iOS/Android push (Capacitor/APNs/FCM native SDKs)
- Real-time chat; async only
- Full calendar subscription feed (optional follow-up; ship single-event ICS first)
- Advanced scheduling workflows (reschedules, multi-reminder templates)

</domain>

<decisions>
## Implementation Decisions (Locked)

### Push transport (v1)
- Use **Web Push** with VAPID keys (PWA/browser push).
- Store per-user **push subscriptions** server-side; allow multiple devices/browsers per user.
- Deliver at least 2 notification types:
  - `REMINDER_24H` (user)
  - `FIGHTER_NEW_BOOKING` (fighter)

### Scheduling (v1)
- Reminders implemented as backend scheduled job scanning upcoming bookings and emitting due reminders idempotently.
- Idempotency key: `(bookingId, notificationType, scheduledFor)` must not send twice.

### Calendar sync (v1)
- Provide backend endpoint to download **ICS** for a booking (single VEVENT).
- UI exposes “Add to calendar” action from booking detail (or booking success screen).

</decisions>

<canonical_refs>
## Canonical References

### Requirements / phase drivers
- `.planning/REQUIREMENTS.md` — R9 acceptance criteria
- `.planning/todos/pending/2026-04-26-notifications-calendar-sync.md`

### Existing booking + notification baseline
- `backend/src/bookings/**` (booking creation + status transitions)
- `backend/src/notifications/**` (Phase 5 email notification baseline, if exists)
- `src/app/pages/my-bookings/**` (booking list/detail UI)
- `src/app/core/services/booking.service.ts`

</canonical_refs>

<notes>
## Notes / Constraints

- Frontend currently not explicitly configured as PWA/service-worker app in `package.json`; enabling Web Push may require adding Angular service worker registration and a custom push-handling service worker.
- Push permission UX must be deliberate: never prompt on app load; prompt only from explicit settings/CTA.
- ICS must use gym timezone once Phase 11 lands; until then, use booking start time as stored (UTC instant) and include timezone hint only if available.

</notes>

---

*Phase: 13-notifications-calendar-sync*  
*Context gathered: 2026-04-26*

