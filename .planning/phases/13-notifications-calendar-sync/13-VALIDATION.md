# Phase 13: Notifications + calendar sync — Validation

Goal: Phase 13 plans cover R9 end-to-end with minimal, shippable slice.

## Coverage checklist (must)

- [ ] Push subscription stored per user (multi-device OK)
- [ ] Fighter receives push on new booking creation
- [ ] User reminder push at least 24h before booking start (idempotent)
- [ ] Notification preferences exist (at least enable/disable reminders)
- [ ] ICS export endpoint exists and UI exposes “Add to calendar”

## Key risks / focus

- Push reliability across browsers; permission UX timing
- Service worker integration with existing Ionic/Angular app (no PWA config yet)
- Scheduler idempotency + time math (timezone updates in Phase 11)

