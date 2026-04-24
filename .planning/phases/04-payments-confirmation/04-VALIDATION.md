---
phase: 4
slug: 04-payments-confirmation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Frontend: Karma/Jasmine (`ng test`) present; Backend: none (Wave 0 adds Jest + Supertest) |
| **Config file** | Frontend: `tsconfig.spec.json`; Backend: none — Wave 0 installs |
| **Quick run command** | `npm test` (root) |
| **Full suite command** | `npm test` (root) |
| **Estimated runtime** | ~60–180 seconds (depends on Angular test suite size) |

---

## Sampling Rate

- **After every task commit:** Run `npm test` (root)
- **After every plan wave:** Run `npm test` (root)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | PAY-01 | T-04-02 | Checkout session tests enforce DB-authoritative amount + one active session per booking | integration (backend) | `cd backend && npm test` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | PAY-03 | T-04-01 | Webhook tests reject invalid/missing Stripe signatures (raw body verification) | integration (backend) | `cd backend && npm test` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | PAY-04 | T-04-03 | Webhook tests ignore duplicate Stripe `event.id` deliveries (idempotency) | integration (backend) | `cd backend && npm test` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | BKG-04 | T-04-05 | Confirmation tests ensure booking→confirmed consumes slot and affects availability | integration (backend) | `cd backend && npm test` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 4 | PAY-02 | T-04-13 | Return UX only displays + polls; never confirms locally; cancel keeps awaiting_payment + retry | unit (frontend) | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/package.json` — add Jest + Supertest (and `npm test` script)
- [ ] `backend/test/payments.checkout-session.e2e-spec.ts` — checkout session create/reuse tests
- [ ] `backend/test/payments.webhook.e2e-spec.ts` — webhook signature + idempotency + confirm/consume tests
- [ ] `backend/test/helpers/stripe-webhook.ts` — helper for signed webhook payloads (no PII in fixtures)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full Stripe Checkout happy-path in real hosted flow (redirect + return) | PAY-01, PAY-02 | Requires Stripe test mode + real redirect behavior in browser | Start booking → tap “Pay now” → complete Stripe test card → return → observe “Confirming…” then Success screen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

