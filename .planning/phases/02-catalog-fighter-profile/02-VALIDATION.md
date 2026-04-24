---
phase: 2
slug: 02-catalog-fighter-profile
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Backend: Jest + `@nestjs/testing` + Supertest · Frontend: Karma + Jasmine |
| **Config file** | Backend: none — Wave 0 installs · Frontend: `angular.json` |
| **Quick run command** | `npm test -- --watch=false` |
| **Full suite command** | Frontend: `npm test -- --watch=false` · Backend (after Wave 0): `cd backend && npm run test:e2e` |
| **Estimated runtime** | ~30–120 seconds (frontend); backend TBD after setup |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --watch=false` (scope to relevant unit tests where possible)
- **After every plan wave:** Run full suite (`npm test -- --watch=false`; plus backend e2e once added)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CAT-03 | T-02-01 | Public endpoints return DTOs and never leak unpublished data | e2e | `cd backend && npm run test:e2e` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | CAT-01 | T-02-01 | `/fighters` filters `published=true` and computes `fromPriceCents` from published services only | e2e | `cd backend && npm run test:e2e` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | CAT-02,FTR-01,FTR-02 | T-02-01 | `/fighters/:id` returns profile + stats + services for published fighter; 404 for unpublished | e2e | `cd backend && npm run test:e2e` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | CAT-01,CAT-03 | — | Explore page renders API data with proper loading/error states | unit | `npm test -- --watch=false` | ✅ | ⬜ pending |
| 02-02-02 | 02 | 2 | CAT-02,FTR-01,FTR-02 | — | Profile page renders bio/stats/services from API response | unit | `npm test -- --watch=false` | ✅ | ⬜ pending |
| 02-03-01 | 03 | 3 | FTR-03 | — | Exactly one service selection navigates with `fighterId` + `serviceId` | unit | `npm test -- --watch=false` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/` add Jest test configuration + scripts (`test`, `test:e2e`) and devDeps needed for Nest e2e (`jest`, `ts-jest`, `@nestjs/testing`, `supertest`, `@types/supertest`)
- [ ] `backend/test/` add e2e tests for:
  - `GET /fighters` (published filtering + fromPrice computation)
  - `GET /fighters/:id` (published filtering + profile/services)
- [ ] Establish a repeatable test DB strategy (separate `DATABASE_URL_TEST` or dedicated schema) and ensure seed/cleanup per run

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Explore and Profile deep-link + back behavior in WKWebView | CAT-02,FTR-03 | iOS/Capacitor-specific routing edge cases | Run the app in iOS simulator/device, navigate explore → profile → book placeholder, refresh on each page, verify back stack returns to expected pages |
| Visual compliance with “No-Line Rule” | CAT-01,FTR-01,FTR-02 | Visual design contract is subjective beyond DOM-level checks | Compare against `DESIGN.md` + `src/design/*/code.html`; confirm no 1px borders/dividers; tonal layering used for separation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

