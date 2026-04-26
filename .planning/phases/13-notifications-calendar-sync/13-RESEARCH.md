# Phase 13: Notifications + calendar sync — Research

**Researched:** 2026-04-26  
**Domain:** Web Push (VAPID) + background delivery constraints + ICS generation  
**Confidence:** MEDIUM

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R9 | Push notifications + reminders + fighter new-booking + calendar sync (ICS minimum) | Web Push via VAPID works across modern browsers; backend can store subscriptions and send payloads; ICS can be generated server-side with a node library and returned as `text/calendar`. |
</phase_requirements>

## Web Push (backend)

Two viable Node libraries:

### Option A: `web-push` (classic, widely used)
- Generates VAPID keys, sets VAPID details, sends notifications to subscription endpoint.
- Source: [CITED: `web-push` GitHub](https://github.com/web-push-libs/web-push/)

### Option B: `node-webpush` (TypeScript-first, dependency-free)
- Generates request details for `fetch()`, validates VAPID inputs, supports RFC8188/8291/8292.
- Source: [CITED: `node-webpush` npm registry](https://registry.npmjs.org/node-webpush)

**Recommendation (for this repo):** prefer `node-webpush` (small surface, TS-friendly, fewer deps) unless runtime constraints require `web-push`.

## Web Push (frontend)

Browser subscription primitives:
- `serviceWorkerRegistration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`
- Store returned subscription JSON (`endpoint`, `keys.p256dh`, `keys.auth`) in backend per user.

If using Angular PWA tooling, ensure service worker handles `push` + `notificationclick`. Multiple worker concerns usually solved with a combined worker or explicit push worker registration (implementation details decided in plan).

## Scheduling reminders

Backend scheduling can be implemented via:
- `@nestjs/schedule` Cron job scanning bookings starting in next N hours and inserting/sending due reminders
- or a simple interval runner (less robust)

Key requirement: idempotent sends so restarts do not duplicate notifications.

## ICS generation (calendar export)

### `ical-generator`
- Create VCALENDAR + VEVENT, send as `text/calendar`.
- Supports timezone fields and common calendar clients.
- Source: [CITED: `ical-generator` npm registry](https://www.npmjs.com/package/ical-generator)

### `ics`
- Generates iCal-compliant strings; good for single-event export.
- Source: [CITED: `ics` GitHub](https://github.com/adamgibbons/ics)

**Recommendation:** use `ical-generator` for clearer server response patterns and timezone handling.

## Research Notes

- Payload sizes limited (Web Push commonly ~4KB). Keep payload minimal; fetch full detail in-app when opened.
- Push opt-in must be user-initiated to avoid browser auto-deny patterns.

## Metadata

**Research date:** 2026-04-26  
**Valid until:** 2026-05-26

