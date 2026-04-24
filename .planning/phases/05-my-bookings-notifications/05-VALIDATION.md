---
phase: 05
slug: my-bookings-notifications
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-04-24"
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (backend) |
| **Config file** | `backend/jest.config.ts` |
| **Quick run command** | `cd backend; npm test -- --runInBand --testPathPattern bookings\\|notifications` |
| **Full suite command** | `cd backend; npm test` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend; npm test -- --runInBand --testPathPattern bookings\\|notifications`
- **After every plan wave:** Run `cd backend; npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | MBB-01 | T-05-01 | User scoping: list returns only caller bookings | e2e | `cd backend; npm test -- --runInBand --testPathPattern bookings\\.my-bookings\\.e2e-spec` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | MBB-02 | T-05-02 | IDOR protection: detail returns 404/403 for other user | e2e | `cd backend; npm test -- --runInBand --testPathPattern bookings\\.my-bookings\\.e2e-spec` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | NOT-01 | T-05-03 | Confirm emits exactly once (idempotent) | e2e | `cd backend; npm test -- --runInBand --testPathPattern notifications\\.booking-status\\.e2e-spec` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | NOT-02 | T-05-04 | Expiry emits once; status transition idempotent | e2e | `cd backend; npm test -- --runInBand --testPathPattern notifications\\.booking-status\\.e2e-spec` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/test/bookings.my-bookings.e2e-spec.ts` — MBB-01 list scoping + deterministic ordering + expiry classification
- [ ] `backend/test/notifications.booking-status.e2e-spec.ts` — NOT-01/NOT-02 dev-email log assertions + idempotency (spy on service/logger)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| My bookings list UX (tabs, empty/error visuals) | MBB-01 | Visual + interaction contract | Run app, sign in, open My bookings. Verify Upcoming/Past tabs, compact rows, empty CTA routes to Explore. |
| Booking detail UX (Pay now CTA on awaiting_payment) | MBB-02 | UI interaction + Stripe depends on env | Create awaiting_payment booking, open detail, confirm Pay now CTA present and routes into checkout flow. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

