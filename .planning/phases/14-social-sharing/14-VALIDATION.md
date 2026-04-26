# Phase 14: Social sharing — Validation

| ID | Plan | Requirement | Threat | What to validate | Type | How | Status |
|----|------|-------------|--------|------------------|------|-----|--------|
| 14-01-01 | 01 | R10 | T-14-01 | Admin API accepts valid social URLs; rejects `javascript:`/invalid schemes | e2e | `cd backend && npm test` | ⬜ pending |
| 14-01-02 | 01 | R10 | T-14-05 | Public `GET /fighters/:fighterId` includes optional social fields for published fighter | e2e | `cd backend && npm test` | ⬜ pending |
| 14-02-01 | 02 | R10 | T-14-04 | URL safety util rejects `javascript:`/`data:` and non-https URLs; only allowlisted schemes pass | unit | `npm test` | ⬜ pending |
| 14-02-02 | 02 | R10 | T-14-02 | Share action copies canonical fighter profile URL on web/PWA (minimum always works) | integration | `npm test` + manual paste check | ⬜ pending |
| 14-02-03 | 02 | R10 | T-14-03 | Share sheet used when available; fallback to copy works when share unsupported/throws | manual | browser with/without `navigator.share` + (optional) iOS simulator | ⬜ pending |
| 14-02-04 | 02 | R10 | T-14-04 | Social links render only when present and safe; unsafe values do not render clickable href | integration | `npm test` + manual click-through | ⬜ pending |

## Threat notes (STRIDE)

| Threat ID | Category | Component | Risk | Mitigation |
|----------|----------|-----------|------|------------|
| T-14-01 | T | Admin DTO validation | storing dangerous/non-url strings | parse+validate URLs; allowlist schemes (`https:`) |
| T-14-02 | T | Share URL builder | wrong/non-canonical URL shared | build from canonical route; cover via tests |
| T-14-03 | A | Share capability | share fails on some platforms | capability detect + copy fallback always |
| T-14-04 | E | Link rendering | XSS / open redirect via `href` | strict URL validation + allowlist schemes before binding to `href` |
| T-14-05 | I | Public fighter profile | exposing social fields for non-published fighters | keep “published only” constraints on public endpoints |
| T-14-06 | D | Validation strictness | over-complex URL validation causes fragility | keep validation lightweight (parse + scheme allowlist only; no remote checks) |

---

Last updated: 2026-04-26
