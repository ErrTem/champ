---
phase: 1
slug: platform-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Nest Jest + supertest (backend); Karma + Jasmine (Ionic — existing) |
| **Config file** | `backend/package.json` / `backend/test/jest-e2e.json` after Wave 0; `karma.conf.js` |
| **Quick run command** | `cd backend && npm test` |
| **Full suite command** | `cd backend && npm test` then `npm test` from repo root |
| **Estimated runtime** | ~60–120 seconds (grows with e2e) |

---

## Sampling Rate

- **After every task commit:** Run quick command for touched package (`backend` vs root).
- **After every plan wave:** Run full suite sequence.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | AUTH-01 | T-1-01 | No secrets in health | unit | `cd backend && npm test` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | AUTH-01–03 | T-1-02 | bcrypt + httpOnly cookies | e2e | `cd backend && npm run test:e2e` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | AUTH-04 | T-1-03 | One-time reset token | e2e | `cd backend && npm run test:e2e` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 4 | AUTH-01–05 | T-1-04 | withCredentials + guards | unit | `npm test` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `backend/test/**/*.e2e-spec.ts` — stubs for AUTH-01..05 HTTP flows
- [ ] `backend/src/auth/**/*.spec.ts` — `AuthService` unit tests (hash verify)
- [ ] `npm run test:e2e` script in `backend/package.json`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| iOS Capacitor cookie persistence | AUTH-02 / D-06 | WKWebView + device | Build iOS target; log in; kill app; reopen; confirm session; document origin/CORS |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency under cap
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
