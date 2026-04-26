---
phase: 12-fighter-self-serve
verified: null
status: pending
score: 0/6 must-haves verified
gaps: []
human_verification: []
---

# Phase 12: Fighter self-serve — Verification Report

## Must-have truths to verify
1. Fighter self-serve endpoints require auth + approved fighter status.
2. Ownership enforced: fighter can only affect own schedule/services/bookings.
3. Schedule replace regenerates availability slots without creating overlaps/duplicates.
4. Service CRUD works for fighter and never leaks cross-fighter access.
5. Booking cancellation transitions state, frees slot, and notifies user.
6. Refund policy behavior consistent with implementation (no false claims).

## Automated checks (expected)
- Backend: `cd backend && npm test`
- Backend: add/extend e2e specs for fighter authz + cancellation behavior.
- Frontend: `npm test` (or repo default) for key route/guard visibility, if unit tests exist.

