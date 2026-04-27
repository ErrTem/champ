---
phase: 11
slug: 11-gyms-multi-timezone
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-26
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

### Frontend

| Property | Value |
|----------|-------|
| **Framework** | Karma + Jasmine (Angular CLI) |
| **Quick run command** | `npm test` |
| **Estimated runtime** | ~30-90 seconds (local) |

### Backend

| Property | Value |
|----------|-------|
| **Framework** | Jest (NestJS) |
| **Quick run command** | `cd backend && npm test` |
| **Estimated runtime** | ~10-60 seconds (local) |

---

## Sampling Rate

- **After every task commit:** run relevant test command(s)
- **After every plan wave:** rerun both frontend + backend tests if changes cross boundary
- **Before human UAT:** both suites green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | R7 | T-11-01 | Gym schema + migrations consistent; tz validated | unit/integration | `cd backend && npm test` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 2 | R7 | T-11-02 | Slot gen + day bucketing use gym tz boundaries (incl DST) | unit/integration | `cd backend && npm test` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | R7 | T-11-03 | UI renders address + map link safe (encoded, no unsafe scheme) | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [ ] Add backend timezone math spec(s) (gym tz → UTC instants; day boundary grouping).
- [ ] Add backend DTO contract spec(s) for returning tz + formatted times (if chosen).
- [ ] Add frontend map-link render spec (no injection; correct URL encoding).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|------------------|
| Cross-timezone smoke (NY vs LA gym) end-to-end | R7 | needs real seed data + UX review | Seed 2 gyms with distinct tz + 2 fighters. Browse availability, open fighter profile, book slot. Confirm times match gym tz and booking confirmation consistent. |

---

## Validation Sign-Off

- [ ] Wave 0 tests exist for each key behavior
- [ ] Sampling continuity OK (no 3 consecutive tasks without automated verify)
- [ ] Feedback latency < 120s

