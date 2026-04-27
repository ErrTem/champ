---
phase: 13-notifications-calendar-sync
plan: "01"
type: summary
created: 2026-04-27
---

## Summary
- Added **Web Push** foundation (VAPID) with per-user **push subscription** storage + lifecycle API.
- Added per-user **notification preferences** (reminders + fighter new booking toggles).
- Implemented **push delivery** with subscription cleanup (404/410) and **idempotency** via `NotificationDelivery` unique key.
- Added scheduled scan job to send **REMINDER_24H** push for upcoming confirmed bookings (at-most-once).
- Wired booking creation hook to send fighter **FIGHTER_NEW_BOOKING** push (at-most-once).
- Added secure **booking ICS export** endpoint + UI “Add to calendar”.
- Enabled PWA service worker setup + push notification handling worker (`combined-sw.js` + `push-sw.js`).

## Key files
- Backend:
  - `backend/prisma/schema.prisma`
  - `backend/src/push/*`
  - `backend/src/notifications/notification-preferences.*`
  - `backend/src/notifications/notification-delivery.*`
  - `backend/src/notifications/notification-types.ts`
  - `backend/src/calendar/*`
  - `backend/src/bookings/bookings.service.ts`
  - `backend/src/app.module.ts`
- Frontend:
  - `src/app/core/services/push.service.ts`
  - `src/app/core/services/notification-preferences.service.ts`
  - `src/app/core/services/booking.service.ts` (ICS download)
  - `src/app/pages/profile/profile.page.*` (toggle + enable push)
  - `src/app/pages/booking-detail/booking-detail.page.*` (Add to calendar)
  - `src/ngsw-config.json`, `src/combined-sw.js`, `src/push-sw.js`
  - `angular.json`, `src/main.ts`, `src/manifest.webmanifest`, `src/index.html`

## Endpoints
- `POST /push/subscriptions`
- `GET /push/subscriptions`
- `DELETE /push/subscriptions/:id`
- `GET /notifications/preferences`
- `PUT /notifications/preferences`
- `GET /bookings/:id/ics`

## Required runtime config
- Backend env:
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
  - `PUBLIC_APP_URL` (deep link base)
- Frontend env:
  - `environment.*.vapidPublicKey` (same public key)

## Test plan
- Backend: `cd backend && npm test`
- Frontend: `npm run lint` and `npm run build` (push + SW config compile)

