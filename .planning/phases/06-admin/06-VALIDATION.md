---
phase: 06
slug: admin
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (NestJS e2e via Supertest) |
| **Config file** | `backend/jest.config.js` (or default Jest config) |
| **Quick run command** | `cd backend && npm test -- admin` |
| **Full suite command** | `cd backend && npm test` |
| **Estimated runtime** | ~30-120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npm test -- admin`
- **After every plan wave:** Run `cd backend && npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | ADM-01 | T-06-01 | Non-admin cannot access `/admin/*` APIs (403) | e2e | `cd backend && npm test -- admin.authz` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | ADM-02 | T-06-02 | Admin fighter CRUD updates public catalog immediately | e2e | `cd backend && npm test -- admin.fighters` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | ADM-03 | T-06-03 | Admin service CRUD updates public fighter profile immediately | e2e | `cd backend && npm test -- admin.services` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | ADM-04 | T-06-04 | Schedule regen never deletes confirmed (or active reserved) slots | e2e | `cd backend && npm test -- admin.schedule` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | ADM-05 | T-06-05 | Admin bookings list supports filters, deterministic ordering | e2e | `cd backend && npm test -- admin.bookings` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/test/admin.authz.e2e-spec.ts` — ADM-01 coverage
- [ ] `backend/test/admin.fighters.e2e-spec.ts` — ADM-02 coverage
- [ ] `backend/test/admin.services.e2e-spec.ts` — ADM-03 coverage
- [ ] `backend/test/admin.schedule.e2e-spec.ts` — ADM-04 coverage
- [ ] `backend/test/admin.bookings.e2e-spec.ts` — ADM-05 coverage
- [ ] Shared e2e helper: login as admin user (cookie capture) + seed/admin provision path

---

## Manual-Only Verifications

All phase behaviors should be automatable via e2e tests. If any UI-only behavior must be manual:

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin tabs UX on small screens | ADM-01 | Visual layout | Open `/admin` on mobile width; confirm 4 tabs reachable + forms usable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

