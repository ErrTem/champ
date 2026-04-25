---
phase: 06-admin
plan: "03"
subsystem: api
tags: [nestjs, prisma, e2e, admin]
requires:
  - phase: 06-admin/02
    provides: AdminGuard + /admin namespace
provides:
  - Admin fighters CRUD endpoints (published toggle)
  - Admin services CRUD endpoints (published toggle, price updates)
  - E2E coverage for admin authz + public reflection
affects: [admin, catalog, ui, testing]
tech-stack:
  added: []
  patterns:
    - "Admin CRUD under /admin guarded by JwtAccessAuthGuard + AdminGuard"
    - "Public endpoints always filter published=true; admin toggles reflect immediately"
key-files:
  created:
    - backend/src/admin/fighters.admin.controller.ts
    - backend/src/admin/fighters.admin.service.ts
    - backend/src/admin/services.admin.controller.ts
    - backend/src/admin/services.admin.service.ts
    - backend/src/admin/dto/admin-fighter.dto.ts
    - backend/src/admin/dto/admin-service.dto.ts
    - backend/test/helpers/admin-login.ts
    - backend/test/admin.authz.e2e-spec.ts
    - backend/test/admin.fighters.e2e-spec.ts
    - backend/test/admin.services.e2e-spec.ts
  modified:
    - backend/src/admin/admin.module.ts
key-decisions:
  - "Admin create endpoints accept optional summary/bio but store empty string when omitted to satisfy current DB constraints."
patterns-established:
  - "Admin tests promote users to admin by DB update; AdminGuard always DB-checks per request."
requirements-completed: [ADM-02, ADM-03]
duration: 60m
completed: 2026-04-25
---

# Phase 6: Admin — Plan 03 Summary

**Admin-only CRUD APIs for fighters and services/prices, with e2e proofs that public catalog/profile reflect published state immediately.**

## Accomplishments

- Added `/admin/fighters` list/create/update endpoints (including `published` toggle).
- Added `/admin/fighters/:fighterId/services` list/create and `/admin/services/:serviceId` update endpoints.
- Added focused e2e tests covering admin vs non-admin authz, publish toggles, and public reflection for fighters/services.

## Issues Encountered

None.

## Deviations from Plan

None - plan executed as written.

## Next Phase Readiness

- Backend now supports schedule + bookings admin endpoints and frontend can wire CRUD UI to these stable contracts.

---
*Phase: 06-admin*
*Completed: 2026-04-25*

