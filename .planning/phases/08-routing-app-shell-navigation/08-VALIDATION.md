---
phase: 8
slug: 08-routing-app-shell-navigation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-26
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Karma + Jasmine (Angular CLI) |
| **Config file** | `karma.conf.js` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30-90 seconds (local) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** `npm test` must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | R4 | T-08-02 | Admin tab hidden by default, shown only for `isAdmin: true` | integration | `npm test` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | R3 | T-08-01 | `returnTo` preserved + open-redirect-safe, default `/explore` | unit/integration | `npm test` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | R3 | T-08-04 | `''` + `**` redirect to `/explore` and Home not used | unit | `npm test` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | R3 | T-08-05 | Back fallback always `/explore` | integration | `npm test` | ❌ W0 | ⬜ pending |
| 08-04-01 | 04 | 3 | R3 | T-08-06 | Shared header used across primary pages (no divergent back buttons) | integration | `npm test` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 4 | R3,R4 | T-08-07..09 | Test suite enforces redirects, `returnTo` safety, admin gating | unit/integration | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [ ] Add router config spec(s) for redirects + alias redirects.
- [ ] Add auth guard + login `returnTo` safety specs.
- [ ] Add tabs shell admin gating spec.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Deep-link + back behavior on device/browser history nuances | R3, R4 | tab-stack + browser history edge cases | Run app, visit `/`, visit unknown route, deep-link `/explore/fighters/:id`, `/my-bookings`, `/admin/fighters` (as admin). Confirm redirects to canonical routes, tab selection correct, back pops when possible else lands `/explore`. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s

**Approval:** pending

