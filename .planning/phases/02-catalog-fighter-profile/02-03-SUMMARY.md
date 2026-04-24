---
phase: 02-catalog-fighter-profile
plan: 03
status: complete
completed_at: "2026-04-24"
---

## Summary

Implemented the Phase 2 “Book” entry placeholder flow: service selection immediately navigates with `fighterId` + `serviceId` via query params, and a `/book` page renders deterministically on refresh by driving state from the URL + API.

## What changed

- **Routing**: added public `/book` route (query params: `fighterId`, `serviceId`)
- **Service selection (D-04)**:
  - tapping a service row navigates immediately to `/book?fighterId=...&serviceId=...`
  - footer CTA “Book session” stays disabled until a service is selected, then navigates to the same URL
- **Book placeholder page**:
  - reads query params, fetches fighter profile, finds selected service, shows summary + “Scheduling will be available…” messaging
  - missing/invalid params and missing service handled with tonal error state + “Back to Explore”
  - “Choose a time” is disabled (no booking implied)

## Key files

- `src/app/app.routes.ts`
- `src/app/pages/fighter-profile/fighter-profile.page.ts`
- `src/app/pages/book-placeholder/*`

## Verification

- `npm test -- --watch=false` (pass)

## Self-Check: PASSED

