# Phase 9: Registration upgrades — Research

**Researched:** 2026-04-26  
**Domain:** NestJS auth + Passport OAuth (Google, Apple) + registration schema constraints  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

- Preserve cookie-based session model.
- Registration requires: phone + 18+ + terms + profile type.
- Fighter profile type starts pending; admin approval required.
- Add Google + Apple OAuth.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R5 | OAuth + phone/terms + roles + fighter approval | OAuth can be implemented via Passport strategies for Google and Apple; Apple returns name/email only on first auth so must persist immediately; admin approval is standard access-control gate. |
</phase_requirements>

## OAuth building blocks (backend)

### Google
- Typical NestJS integration uses `@nestjs/passport` + `passport-google-oauth20` with `/auth/google` and `/auth/google/callback` routes. Official strategy docs describe required client config + callback/verify flow. [CITED: https://www.passportjs.org/packages/passport-google-oauth20/]

### Apple
- Apple requires server-side verification of identity token and careful handling of `state` / `nonce`. Apple notes user info returned only first time; must store name/email when provided. [CITED: https://developer.apple.com/documentation/signinwithapple/authenticating-users-with-sign-in-with-apple]
- Passport strategies exist; if using a NestJS-focused Apple strategy library, ensure callback route supports Apple’s POST callback form and returns `id_token`. (Library choice finalized in plan.)

## Identity linking model (DB)

Current DB stores only `User` with email/passwordHash + `isAdmin` + profile fields. For OAuth, add separate table:

- `UserOAuthIdentity`:
  - `provider` (google|apple)
  - `providerUserId` (stable subject id from provider)
  - `email` (optional, for debug/audit; do not trust as primary key)
  - `userId` FK
  - `createdAt`

This supports:
- existing user logs in with OAuth → link to existing account (by email match or explicit link flow)
- new user signs up with OAuth → create user + identity

## Roles + fighter approval

Existing role bit: `User.isAdmin`.
Phase 9 introduces user “profile type” (user vs fighter) and approval state for fighter type:
- `userType` (user|fighter)
- `fighterStatus` (none|pending|approved|rejected) or boolean `fighterApproved` with `fighterPending` (prefer enum for clarity)
- `fighterApprovedAt` timestamp (optional)

Backend enforcement:
- Endpoints that are fighter-only (future) must check approved state.
- For Phase 9: at minimum, expose status via `/users/me` so UI can show “pending approval” state.

## Registration UX constraints (frontend)

Current register page already collects `phone` but it is optional and unvalidated. Phase 9 needs:
- Phone input with USA prefix + mask (UI-level), plus backend validation/normalization.
- Two required checkboxes, and profile type selector.
- Terms page route + link.
- OAuth buttons that start redirect to backend OAuth routes.

## Security notes (minimum)

| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth login CSRF / replay (`state`/`nonce`) | account takeover | Use `state` and `nonce` verification; store per attempt; verify callback. [CITED: https://developer.apple.com/documentation/signinwithapple/authenticating-users-with-sign-in-with-apple] |
| Account confusion when linking by email | unintended linking | Require verified email claim from provider; log and handle conflicts; prefer explicit link flow when ambiguity exists. |
| Open redirect after OAuth callback | phishing | Use allowlist/relative-path validation for any `returnTo`/redirect param (same rule as Phase 8 login). |

## Recommended plan split

- Plan 09-01: DB + backend endpoints (userType, fighter status, approval endpoints, `/users/me` shape)
- Plan 09-02: Frontend registration UX + Terms route + pending messaging
- Plan 09-03: OAuth providers integration (strategies + controllers + callback → cookie session)

## Sources

- Google strategy docs: `passport-google-oauth20` [CITED: https://www.passportjs.org/packages/passport-google-oauth20/]
- Apple auth flow + token handling notes [CITED: https://developer.apple.com/documentation/signinwithapple/authenticating-users-with-sign-in-with-apple]

## Metadata

**Research date:** 2026-04-26  
**Valid until:** 2026-05-26
