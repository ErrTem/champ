---
phase: 02-catalog-fighter-profile
plan: 02
status: complete
completed_at: "2026-04-24"
---

## Summary

Implemented the Phase 2 Ionic/Angular catalog and fighter profile pages against the public backend APIs, including loading skeletons, empty and error states, and navigation from Explore → Profile.

## What changed

- **Routing**: added public routes:
  - `/explore`
  - `/fighters/:fighterId`
- **API client**: added typed models + `CatalogService` for:
  - `GET /fighters`
  - `GET /fighters/:fighterId`
- **Explore (Catalog) UI**:
  - hero + sticky chips (static) + tonal fighter cards
  - “From $X” formatting from `fromPriceCents`
  - loading skeletons + empty + error (Retry) states
- **Fighter Profile UI**:
  - hero + required stats tiles + bio + services list
  - loading skeletons + empty services state + error (Retry) state
  - footer CTA “Book session” disabled until a service is selected (navigation wired in 02-03)

## Key files

- `src/app/app.routes.ts`
- `src/app/core/models/catalog.models.ts`
- `src/app/core/services/catalog.service.ts`
- `src/app/pages/catalog/*`
- `src/app/pages/fighter-profile/*`

## Verification

- `npm test -- --watch=false` (pass)

## Self-Check: PASSED

