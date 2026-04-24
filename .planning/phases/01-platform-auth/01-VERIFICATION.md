---
phase: 01-platform-auth
status: human_needed
updated: 2026-04-24
---

# Phase 1 verification

## Automated

| Check | Result |
|-------|--------|
| `cd backend && npm run build` | Pass (after `npx prisma generate`) |
| `npm run build` (repo root / Ionic) | Pass |

## Must-haves (spot-check)

- Nest `GET /health` returns `{ "status": "ok", "timestamp": "<ISO>" }` when API running.
- Prisma `User`, `RefreshSession`, and `PasswordResetToken` models present; `npx prisma db push` succeeds with valid `DATABASE_URL`.
- Ionic `AuthService` uses `withCredentials: true` and does not reference `localStorage`.

## Human verification

1. **End-to-end browser:** `ng serve` + API on :3000 — register, refresh page while on profile, logout clears session.
2. **D-06 iOS:** Follow `README.md` **iOS auth verification** — simulator sign-in + force quit + relaunch; record outcome.

## human_verification

- Complete D-06 checklist on iOS simulator (minimum) and note result in `01-HUMAN-UAT.md` when running `/gsd-verify-work`.
