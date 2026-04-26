# Phase 9: Registration upgrades — Validation

**Created:** 2026-04-26  
**Status:** draft

## Automated

Backend:
- `backend/` e2e tests (Jest + Supertest) already exist; add/extend specs for OAuth endpoints (mock where needed) and fighter approval workflow.

Frontend:
- Add minimal unit/integration specs for register form gating (phone + checkboxes + profile type) if test harness exists; otherwise rely on manual smoke + backend e2e for critical rules.

## Manual smoke checklist (phase gate)

- Password registration:
  - cannot submit without required phone + checkboxes + profile type
  - successful register logs user in (cookies set) and `/users/me` returns expected fields
- OAuth:
  - “Continue with Google” starts flow, callback logs user in
  - “Continue with Apple” starts flow, callback logs user in
- Terms:
  - Terms page route loads; registration links to it
- Fighter:
  - registering as fighter yields status pending and clear UI message
  - admin can list pending fighters and approve
  - after approval, `/users/me` shows approved status

## Notes

OAuth flows depend on external provider credentials; automated tests may need conditional skip or local mock mode.
